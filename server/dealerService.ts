import { db } from './db';
import { dealers, dealerVehicles, uploadBatches, validationReports } from '../shared/schema';
import type { InsertDealerVehicle, DealerVehicle, Dealer } from '../shared/schema';
import { eq, and } from 'drizzle-orm';
import { validateVIN, normalizeVIN } from './vinValidation';
import { validatePrice } from './priceValidationService';
import { validateImageFromBuffer } from './imageValidationService';
import { Storage } from '@google-cloud/storage';

const storage = new Storage();
const BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'replit-objstore-d0320f93-608f-4645-99b0-2ed990502d64';

export interface VehicleUploadData {
  vin: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  condition: 'used' | 'certified' | 'new';
  fuelType: string;
  transmission: string;
  color: string;
  bodyType: string;
  primaryImage: Buffer;
  additionalImages?: Buffer[];
  dealerPhone: string;
  dealerAddress: string;
  dealerAttested?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  vehicleId?: string;
  slug?: string;
}

/**
 * Upload vehicle image to object storage
 */
async function uploadImageToStorage(
  imageBuffer: Buffer,
  dealerId: string,
  vehicleId: string,
  isPrimary: boolean,
  index: number = 0
): Promise<string> {
  const timestamp = Date.now();
  const fileName = isPrimary
    ? `dealer-vehicles/${dealerId}/${vehicleId}/primary_${timestamp}.jpg`
    : `dealer-vehicles/${dealerId}/${vehicleId}/additional_${index}_${timestamp}.jpg`;

  const bucket = storage.bucket(BUCKET_NAME);
  const file = bucket.file(fileName);

  await file.save(imageBuffer, {
    metadata: {
      contentType: 'image/jpeg',
    },
  });

  // Make file publicly accessible
  await file.makePublic();

  return `/${BUCKET_NAME}/${fileName}`;
}

/**
 * Generate unique slug for vehicle landing page
 */
function generateSlug(dealer: Dealer, make: string, model: string, vehicleId: string): string {
  const cleanMake = make.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const cleanModel = model.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const shortId = vehicleId.substring(0, 8);
  
  return `${dealer.storeCode}/${cleanMake}-${cleanModel}-${shortId}`.toLowerCase();
}

/**
 * Quick Add - Single vehicle upload with full validation
 */
export async function quickAddVehicle(
  dealer: Dealer,
  vehicleData: VehicleUploadData
): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  try {
    // 1. Validate VIN
    const vinValidation = await validateVIN(vehicleData.vin, dealer.id);
    if (!vinValidation.isValid) {
      result.isValid = false;
      result.errors.push(...vinValidation.errors);
      return result;
    }
    result.warnings.push(...vinValidation.warnings);

    // 2. Validate Price
    const priceValidation = await validatePrice(
      vehicleData.make,
      vehicleData.model,
      vehicleData.year,
      vehicleData.price
    );
    result.warnings.push(...priceValidation.warnings);

    // 3. Validate Primary Image
    const primaryImageValidation = await validateImageFromBuffer(
      vehicleData.primaryImage,
      'primary_image.jpg'
    );
    if (!primaryImageValidation.isValid) {
      result.isValid = false;
      result.errors.push(...primaryImageValidation.errors);
      return result;
    }
    result.warnings.push(...primaryImageValidation.warnings);

    // 4. Validate Additional Images (if provided)
    const additionalImageErrors: string[] = [];
    if (vehicleData.additionalImages) {
      for (let i = 0; i < vehicleData.additionalImages.length; i++) {
        const imgValidation = await validateImageFromBuffer(
          vehicleData.additionalImages[i],
          `additional_image_${i}.jpg`
        );
        if (!imgValidation.isValid) {
          additionalImageErrors.push(...imgValidation.errors);
        }
        result.warnings.push(...imgValidation.warnings);
      }
    }

    // If validation failed, don't proceed
    if (!result.isValid) {
      return result;
    }

    // 5. Create vehicle record (temporary ID for image upload)
    const vehicleId = crypto.randomUUID();
    
    // 6. Upload images to object storage
    const primaryImagePath = await uploadImageToStorage(
      vehicleData.primaryImage,
      dealer.id,
      vehicleId,
      true,
      0
    );

    const additionalImagePaths: string[] = [];
    if (vehicleData.additionalImages) {
      for (let i = 0; i < vehicleData.additionalImages.length; i++) {
        const path = await uploadImageToStorage(
          vehicleData.additionalImages[i],
          dealer.id,
          vehicleId,
          false,
          i
        );
        additionalImagePaths.push(path);
      }
    }

    // 7. Generate slug
    const slug = generateSlug(dealer, vehicleData.make, vehicleData.model, vehicleId);

    // 8. Determine validation status
    let validationStatus: 'pending' | 'approved' | 'on_hold' = 'pending';
    if (priceValidation.isPriceOutlier || result.warnings.length > 2) {
      validationStatus = 'on_hold';
      result.warnings.push('Vehicle flagged for manual review due to validation warnings');
    } else if (!vinValidation.isDuplicate && result.errors.length === 0) {
      validationStatus = 'approved';
    }

    // 9. Insert vehicle into database
    const insertData: InsertDealerVehicle = {
      dealerId: dealer.id,
      vin: normalizeVIN(vehicleData.vin),
      make: vehicleData.make,
      model: vehicleData.model,
      year: vehicleData.year,
      price: vehicleData.price,
      mileage: vehicleData.mileage,
      condition: vehicleData.condition,
      fuelType: vehicleData.fuelType,
      transmission: vehicleData.transmission,
      color: vehicleData.color,
      bodyType: vehicleData.bodyType,
      primaryImage: primaryImagePath,
      additionalImages: additionalImagePaths,
      dealerPhone: vehicleData.dealerPhone,
      dealerAddress: vehicleData.dealerAddress,
      slug,
      validationStatus,
      validationErrors: result.errors,
      validationWarnings: result.warnings,
      isPriceOutlier: priceValidation.isPriceOutlier,
      medianPrice: priceValidation.medianPrice,
      isDuplicate: vinValidation.isDuplicate,
      duplicateOfVin: vinValidation.duplicateDetails?.vin,
      uploadMethod: 'quick_add',
      dealerAttested: vehicleData.dealerAttested || false,
      attestedAt: vehicleData.dealerAttested ? new Date() : undefined,
    };

    await db.insert(dealerVehicles).values({ id: vehicleId, ...insertData });

    // 10. Update dealer upload count
    await db
      .update(dealers)
      .set({
        currentMonthUploads: (dealer.currentMonthUploads || 0) + 1,
        updatedAt: new Date(),
      })
      .where(eq(dealers.id, dealer.id));

    // 11. Create validation report
    await db.insert(validationReports).values({
      dealerId: dealer.id,
      vehicleId: vehicleId,
      validationType: 'quick_add',
      totalChecked: 1,
      passedCount: validationStatus === 'approved' ? 1 : 0,
      failedCount: result.errors.length > 0 ? 1 : 0,
      warningCount: result.warnings.length,
      validationDetails: {
        vin: vinValidation,
        price: priceValidation,
        primaryImage: primaryImageValidation,
        additionalImages: additionalImageErrors,
      },
      requiresReview: validationStatus === 'on_hold',
    });

    result.vehicleId = vehicleId;
    result.slug = slug;

    return result;
  } catch (error) {
    console.error('Quick add vehicle error:', error);
    result.isValid = false;
    result.errors.push(`Failed to upload vehicle: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return result;
  }
}

/**
 * Get dealer by API key
 */
export async function getDealerByApiKey(apiKey: string): Promise<Dealer | null> {
  const result = await db
    .select()
    .from(dealers)
    .where(eq(dealers.apiKey, apiKey))
    .limit(1);

  return result[0] || null;
}

/**
 * Get dealer vehicles
 */
export async function getDealerVehicles(dealerId: string): Promise<DealerVehicle[]> {
  return await db
    .select()
    .from(dealerVehicles)
    .where(eq(dealerVehicles.dealerId, dealerId))
    .orderBy(dealerVehicles.createdAt);
}

/**
 * Get validation report for dealer
 */
export async function getValidationReport(dealerId: string, reportId: string) {
  const result = await db
    .select()
    .from(validationReports)
    .where(
      and(
        eq(validationReports.id, reportId),
        eq(validationReports.dealerId, dealerId)
      )
    )
    .limit(1);

  return result[0] || null;
}
