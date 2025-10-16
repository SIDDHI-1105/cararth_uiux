import { db } from './db';
import { dealerVehicles } from '../shared/schema';
import { eq, and, sql } from 'drizzle-orm';

export interface PriceValidationResult {
  isPriceOutlier: boolean;
  medianPrice: number | null;
  priceRatio: number | null; // Actual price / median price
  warnings: string[];
}

/**
 * Validates vehicle price against median for same make/model/year
 * Google Vehicle Listing requirement: Flag prices > 1.5x median
 */
export async function validatePrice(
  make: string,
  model: string,
  year: number,
  price: number
): Promise<PriceValidationResult> {
  const result: PriceValidationResult = {
    isPriceOutlier: false,
    medianPrice: null,
    priceRatio: null,
    warnings: [],
  };

  try {
    // Get all approved prices for the same make/model/year
    const similarVehicles = await db
      .select({ price: dealerVehicles.price })
      .from(dealerVehicles)
      .where(
        and(
          eq(dealerVehicles.make, make),
          eq(dealerVehicles.model, model),
          eq(dealerVehicles.year, year),
          eq(dealerVehicles.validationStatus, 'approved')
        )
      );

    if (similarVehicles.length < 3) {
      // Not enough data for comparison
      result.warnings.push(
        `Insufficient data for price comparison (only ${similarVehicles.length} similar vehicles found). ` +
        `Price will be flagged for manual review.`
      );
      return result;
    }

    // Calculate median price
    const prices = similarVehicles.map(v => parseInt(v.price.toString())).sort((a, b) => a - b);
    const medianIndex = Math.floor(prices.length / 2);
    const median = prices.length % 2 === 0
      ? (prices[medianIndex - 1] + prices[medianIndex]) / 2
      : prices[medianIndex];

    result.medianPrice = Math.round(median);
    result.priceRatio = price / median;

    // Check if price is > 1.5x median (outlier)
    if (result.priceRatio > 1.5) {
      result.isPriceOutlier = true;
      result.warnings.push(
        `Price ₹${price.toLocaleString('en-IN')} is ${(result.priceRatio * 100).toFixed(0)}% of ` +
        `median price ₹${result.medianPrice.toLocaleString('en-IN')}. ` +
        `This is ${((result.priceRatio - 1) * 100).toFixed(0)}% above market average and will be flagged for review.`
      );
    } else if (result.priceRatio < 0.5) {
      // Also flag extremely low prices as potential errors
      result.warnings.push(
        `Price ₹${price.toLocaleString('en-IN')} is significantly below market average ` +
        `(${(result.priceRatio * 100).toFixed(0)}% of median ₹${result.medianPrice.toLocaleString('en-IN')}). ` +
        `This may indicate a pricing error.`
      );
    }
  } catch (error) {
    console.error('Price validation failed:', error);
    result.warnings.push('Unable to validate price against market data. Will be flagged for manual review.');
  }

  return result;
}

/**
 * Batch price validation for CSV uploads
 */
export async function validatePriceBatch(
  vehicles: Array<{ make: string; model: string; year: number; price: number }>
): Promise<Map<number, PriceValidationResult>> {
  const results = new Map<number, PriceValidationResult>();

  for (let i = 0; i < vehicles.length; i++) {
    const vehicle = vehicles[i];
    const validationResult = await validatePrice(
      vehicle.make,
      vehicle.model,
      vehicle.year,
      vehicle.price
    );
    results.set(i, validationResult);
  }

  return results;
}
