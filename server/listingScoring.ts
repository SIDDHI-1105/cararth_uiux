/**
 * CarArth Holistic Listing & Ranking Framework
 * Calculates trust scores based on 6 weighted factors:
 * - Price Fairness (30%)
 * - Recency (15%)
 * - Demand (20%)
 * - Completeness (15%)
 * - Image Quality (10%)
 * - Seller Trust (10%)
 * 
 * PLUS Google Vehicle Listings compliance for dealer listings
 */

import { GoogleVehicleComplianceValidator } from './googleVehicleCompliance';

interface ListingData {
  // Core fields
  price: number;
  make: string;
  model: string;
  city: string;
  year: number;
  
  // Optional fields for completeness
  description?: string;
  images?: string[] | any[];
  mileage?: number;
  fuelType?: string;
  transmission?: string;
  
  // Listing metadata
  createdAt?: Date | string;
  listingDate?: Date | string;
  listingSource?: 'ethical_ai' | 'exclusive_dealer' | 'user_direct';
  isVerified?: boolean;
}

interface ScoreBreakdown {
  price: number;
  recency: number;
  demand: number;
  completeness: number;
  imageQuality: number;
  sellerTrust: number;
}

interface ScoringResult {
  listingScore: number;
  scoreBreakdown: ScoreBreakdown;
  demandIndex: number;
  avgSellingPrice: number | null;
  completeness: number;
  imageQualityAvg: number;
  
  // Metadata for UI display
  priceFairnessLabel: string; // "2% below market" or "At market price"
  demandLevel: string; // "Strong" | "Moderate" | "Low"
  trustLevel: string; // "Verified Dealer" | "AI Verified" | "User Listing"
  
  // Google Compliance (for dealer listings)
  googleCompliance?: {
    isCompliant: boolean;
    score: number;
    label: string;
    issues: string[];
  };
}

export class ListingScoringService {
  /**
   * Calculate complete listing score with all sub-scores
   * Includes Google Vehicle Listings compliance for dealer listings
   */
  static calculateScore(listing: ListingData, options?: { includeGoogleCompliance?: boolean; vin?: string; rtoVerified?: boolean }): ScoringResult {
    // Calculate individual sub-scores
    const priceScore = this.calculatePriceScore(listing);
    const recencyScore = this.calculateRecencyScore(listing);
    const demandScore = this.calculateDemandScore(listing);
    const completenessScore = this.calculateCompletenessScore(listing);
    const imageScore = this.calculateImageScore(listing);
    const sellerTrustScore = this.calculateSellerTrustScore(listing);
    
    // Calculate weighted final score
    const listingScore = 
      (priceScore.score * 0.30) +
      (recencyScore * 0.15) +
      (demandScore.score * 0.20) +
      (completenessScore.score * 0.15) +
      (imageScore.score * 0.10) +
      (sellerTrustScore.score * 0.10);
    
    // Build score breakdown
    const scoreBreakdown: ScoreBreakdown = {
      price: Math.round(priceScore.score * 10) / 10,
      recency: Math.round(recencyScore * 10) / 10,
      demand: Math.round(demandScore.score * 10) / 10,
      completeness: Math.round(completenessScore.score * 10) / 10,
      imageQuality: Math.round(imageScore.score * 10) / 10,
      sellerTrust: Math.round(sellerTrustScore.score * 10) / 10,
    };
    
    // Check Google Vehicle Listings compliance for dealer listings
    let googleCompliance: any = undefined;
    if (options?.includeGoogleCompliance) {
      // CRITICAL: Use actual listing data, not defaults
      const complianceResult = GoogleVehicleComplianceValidator.validate({
        vehicleType: (listing as any).vehicleType || undefined, // REQUIRED: Must be explicitly set by dealer
        make: listing.make,
        model: listing.model,
        year: listing.year,
        vin: options.vin, // REQUIRED for Google compliance
        titleStatus: (listing as any).titleStatus || undefined, // REQUIRED: Must be explicitly set
        mileage: listing.mileage, // REQUIRED for used cars
        price: listing.price,
        images: listing.images ? listing.images.map((img: any) => ({
          url: typeof img === 'string' ? img : img.url,
          width: typeof img === 'object' ? img.width : undefined,
          height: typeof img === 'object' ? img.height : undefined,
        })) : [],
        rtoVerified: options.rtoVerified,
        fuelType: listing.fuelType,
        transmission: listing.transmission,
        availabilityStatus: (listing as any).availabilityStatus || undefined, // REQUIRED: Must be explicitly set
      });
      
      googleCompliance = {
        isCompliant: complianceResult.isCompliant,
        score: complianceResult.score,
        label: GoogleVehicleComplianceValidator.getComplianceLabel(complianceResult.score),
        issues: complianceResult.issues,
      };
      
      console.log(`🔍 Google Compliance Check: ${googleCompliance.label} (${googleCompliance.score}/100)`);
      if (complianceResult.issues.length > 0) {
        console.log(`   Issues: ${complianceResult.issues.join('; ')}`);
      }
    }
    
    return {
      listingScore: Math.round(listingScore * 10) / 10,
      scoreBreakdown,
      demandIndex: demandScore.index,
      avgSellingPrice: priceScore.avgPrice,
      completeness: completenessScore.percentage,
      imageQualityAvg: imageScore.avgQuality,
      priceFairnessLabel: priceScore.label,
      demandLevel: demandScore.level,
      trustLevel: sellerTrustScore.label,
      googleCompliance,
    };
  }
  
  /**
   * 1. Price Score (30% weight)
   * How close listing price is to average market price
   */
  private static calculatePriceScore(listing: ListingData): {
    score: number;
    avgPrice: number | null;
    label: string;
  } {
    // Get average selling price for this model/city
    const avgPrice = this.getAveragePrice(listing.make, listing.model, listing.city);
    
    if (!avgPrice || avgPrice === 0) {
      // No market data, assign neutral score
      return {
        score: 70,
        avgPrice: null,
        label: "Market price unavailable"
      };
    }
    
    const priceDiff = Math.abs(listing.price - avgPrice) / avgPrice;
    const score = Math.max(0, (1 - priceDiff) * 100);
    
    // Generate label
    const percentDiff = Math.round((listing.price - avgPrice) / avgPrice * 100);
    let label = "At market price";
    if (percentDiff < -2) {
      label = `${Math.abs(percentDiff)}% below market`;
    } else if (percentDiff > 2) {
      label = `${percentDiff}% above market`;
    }
    
    return { score, avgPrice, label };
  }
  
  /**
   * 2. Recency Score (15% weight)
   * Freshness of listing (decay after 30 days)
   */
  private static calculateRecencyScore(listing: ListingData): number {
    const listingDate = listing.listingDate || listing.createdAt;
    if (!listingDate) return 50; // Neutral score if no date
    
    const date = typeof listingDate === 'string' ? new Date(listingDate) : listingDate;
    const daysSince = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    // Linear decay over 30 days
    return Math.max(0, (1 - daysSince / 30) * 100);
  }
  
  /**
   * 3. Demand Score (20% weight)
   * Market demand for this specific make/model
   */
  private static calculateDemandScore(listing: ListingData): {
    score: number;
    index: number;
    level: string;
  } {
    // Get demand index from market data (0-1 scale)
    const demandIndex = this.getDemandIndex(listing.make, listing.model, listing.city);
    const score = demandIndex * 100;
    
    let level = "Low";
    if (demandIndex >= 0.7) level = "Strong";
    else if (demandIndex >= 0.4) level = "Moderate";
    
    return { score, index: demandIndex, level };
  }
  
  /**
   * 4. Completeness Score (15% weight)
   * Percentage of required fields completed
   */
  private static calculateCompletenessScore(listing: ListingData): {
    score: number;
    percentage: number;
  } {
    let totalPoints = 0;
    let earnedPoints = 0;
    
    // Basic info (50 points)
    totalPoints += 50;
    if (listing.make && listing.model && listing.year && listing.price && listing.city && listing.mileage) {
      earnedPoints += 50;
    } else {
      // Partial credit
      earnedPoints += 40;
    }
    
    // Description (10 points)
    totalPoints += 10;
    if (listing.description && listing.description.length > 50) {
      earnedPoints += 10;
    }
    
    // Images (15 points)
    totalPoints += 15;
    const imageCount = Array.isArray(listing.images) ? listing.images.length : 0;
    if (imageCount >= 3) {
      earnedPoints += 15;
    } else if (imageCount > 0) {
      earnedPoints += imageCount * 5;
    }
    
    // Contact/verification (15 points)
    totalPoints += 15;
    if (listing.isVerified) {
      earnedPoints += 15;
    } else {
      earnedPoints += 10; // Partial credit
    }
    
    // Fuel/Transmission (10 points)
    totalPoints += 10;
    if (listing.fuelType && listing.transmission) {
      earnedPoints += 10;
    }
    
    const percentage = earnedPoints / totalPoints;
    return {
      score: percentage * 100,
      percentage
    };
  }
  
  /**
   * 5. Image Quality Score (10% weight)
   * Visual clarity and number of photos
   */
  private static calculateImageScore(listing: ListingData): {
    score: number;
    avgQuality: number;
  } {
    const images = Array.isArray(listing.images) ? listing.images : [];
    const imageCount = Math.min(images.length, 5); // Cap at 5
    
    // Baseline: minimum 3 images = 0.6
    let avgQuality = 0.6;
    
    if (imageCount >= 3) {
      // Each additional image adds quality
      avgQuality = 0.6 + ((imageCount - 3) * 0.1);
    } else if (imageCount > 0) {
      avgQuality = 0.4 + (imageCount * 0.1);
    } else {
      avgQuality = 0.2; // Low quality if no images
    }
    
    avgQuality = Math.min(avgQuality, 1.0); // Cap at 1.0
    
    // Score = (count factor * 0.4 + quality * 0.6) * 100
    const countFactor = imageCount / 5;
    const score = (countFactor * 0.4 + avgQuality * 0.6) * 100;
    
    return { score, avgQuality };
  }
  
  /**
   * 6. Seller Trust Score (10% weight)
   * Based on listing source type
   */
  private static calculateSellerTrustScore(listing: ListingData): {
    score: number;
    label: string;
  } {
    const source = listing.listingSource || 'user_direct';
    
    switch (source) {
      case 'ethical_ai':
        return { score: 95, label: "AI Verified" };
      case 'exclusive_dealer':
        return { score: 90, label: "Verified Dealer" };
      case 'user_direct':
        if (listing.isVerified) {
          return { score: 85, label: "Verified User" };
        }
        return { score: 60, label: "User Listing" };
      default:
        return { score: 60, label: "Unverified" };
    }
  }
  
  /**
   * Get average selling price for a model in a city
   * TODO: Replace with actual database query
   */
  private static getAveragePrice(make: string, model: string, city: string): number | null {
    // Mock implementation - in production, query database
    // Example: SELECT AVG(price) FROM cached_portal_listings WHERE make = ? AND model = ? AND city = ?
    
    // For now, return null to indicate no market data
    // This will be replaced with actual DB queries
    return null;
  }
  
  /**
   * Get demand index for a model in a city (0-1 scale)
   * TODO: Replace with actual market data
   */
  private static getDemandIndex(make: string, model: string, city: string): number {
    // Mock implementation - in production, use:
    // - Search volume data
    // - Listing view counts
    // - Time-to-sell metrics
    // - Regional popularity
    
    // Popular models get higher demand
    const popularModels = ['Creta', 'City', 'Swift', 'i20', 'Verna', 'Seltos', 'Venue'];
    const isPopular = popularModels.some(m => model.toLowerCase().includes(m.toLowerCase()));
    
    return isPopular ? 0.75 : 0.5;
  }
  
  /**
   * Get trust level color for UI (based on final score)
   */
  static getTrustColor(score: number): 'green' | 'yellow' | 'red' {
    if (score >= 80) return 'green';
    if (score >= 60) return 'yellow';
    return 'red';
  }
  
  /**
   * Get trust level label for UI
   */
  static getTrustLabel(score: number): string {
    if (score >= 80) return 'High Confidence';
    if (score >= 60) return 'Moderate';
    return 'Low Quality / Overpriced';
  }
}
