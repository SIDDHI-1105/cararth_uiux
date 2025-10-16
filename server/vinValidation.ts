import { db } from './db';
import { dealerVehicles } from '../shared/schema';
import { eq } from 'drizzle-orm';

// VIN Validation regex - 17 characters, excludes I, O, Q to avoid confusion
const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/;

/**
 * VIN Checksum Validation (ISO 3779 standard)
 * Validates the check digit at position 9 using the weighted sum algorithm
 */
function validateVINChecksum(vin: string): boolean {
  const transliterationTable: { [key: string]: number } = {
    'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8,
    'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'P': 7, 'R': 9,
    'S': 2, 'T': 3, 'U': 4, 'V': 5, 'W': 6, 'X': 7, 'Y': 8, 'Z': 9,
    '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9
  };
  
  const weights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
  
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const char = vin[i];
    const value = transliterationTable[char];
    if (value === undefined) {
      return false; // Invalid character
    }
    sum += value * weights[i];
  }
  
  const remainder = sum % 11;
  const expectedCheckDigit = remainder === 10 ? 'X' : remainder.toString();
  const actualCheckDigit = vin[8];
  
  return expectedCheckDigit === actualCheckDigit;
}

export interface VINValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  isDuplicate: boolean;
  duplicateDetails?: {
    vin: string;
    dealerId: string;
    vehicleId: string;
    make: string;
    model: string;
    year: number;
  };
}

/**
 * Validates VIN format and checks for duplicates
 * Google Vehicle Listing requirement: VIN must be 17 characters, valid format
 */
export async function validateVIN(vin: string, currentDealerId?: string): Promise<VINValidationResult> {
  const result: VINValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    isDuplicate: false,
  };

  // Normalize VIN to uppercase
  const normalizedVIN = vin.trim().toUpperCase();

  // Check length
  if (normalizedVIN.length !== 17) {
    result.isValid = false;
    result.errors.push(`VIN must be exactly 17 characters (received ${normalizedVIN.length})`);
    return result;
  }

  // Check format with regex
  if (!VIN_REGEX.test(normalizedVIN)) {
    result.isValid = false;
    result.errors.push('VIN contains invalid characters. Must only contain A-H, J-N, P-R, Z and 0-9 (excludes I, O, Q)');
    return result;
  }

  // ISO 3779 checksum validation (check digit at position 9)
  const checksumValid = validateVINChecksum(normalizedVIN);
  if (!checksumValid) {
    result.isValid = false;
    result.errors.push('Invalid VIN checksum (position 9). This VIN may be fraudulent or incorrectly entered.');
    return result;
  }

  // Check for duplicates in dealer_vehicles table
  try {
    const existingVehicle = await db
      .select({
        id: dealerVehicles.id,
        dealerId: dealerVehicles.dealerId,
        vin: dealerVehicles.vin,
        make: dealerVehicles.make,
        model: dealerVehicles.model,
        year: dealerVehicles.year,
      })
      .from(dealerVehicles)
      .where(eq(dealerVehicles.vin, normalizedVIN))
      .limit(1);

    if (existingVehicle.length > 0) {
      const vehicle = existingVehicle[0];
      
      // If it's a different dealer, it's a duplicate violation
      if (vehicle.dealerId !== currentDealerId) {
        result.isValid = false;
        result.isDuplicate = true;
        result.errors.push(
          `VIN ${normalizedVIN} already exists in the system under another dealer. ` +
          `Please contact support if you believe this is an error.`
        );
        result.duplicateDetails = {
          vin: vehicle.vin,
          dealerId: vehicle.dealerId,
          vehicleId: vehicle.id,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
        };
      } else {
        // Same dealer, just a warning about existing VIN
        result.warnings.push(
          `This VIN already exists in your inventory (${vehicle.make} ${vehicle.model} ${vehicle.year})`
        );
      }
    }
  } catch (error) {
    console.error('VIN duplicate check failed:', error);
    result.warnings.push('Unable to check for duplicate VINs. Vehicle will be flagged for manual review.');
  }

  return result;
}

/**
 * Batch VIN validation for CSV uploads
 */
export async function validateVINBatch(
  vins: string[],
  dealerId: string
): Promise<Map<string, VINValidationResult>> {
  const results = new Map<string, VINValidationResult>();

  for (const vin of vins) {
    const validationResult = await validateVIN(vin, dealerId);
    results.set(vin, validationResult);
  }

  return results;
}

/**
 * Normalize VIN to uppercase for storage
 */
export function normalizeVIN(vin: string): string {
  return vin.trim().toUpperCase();
}
