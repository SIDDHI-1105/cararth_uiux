import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authenticateDealer, generateApiKey } from './dealerAuthMiddleware';
import { quickAddVehicle, getDealerVehicles, getValidationReport } from './dealerService';
import { db } from './db';
import { dealers, dealerVehicles, validationReports, googleVehicleFeeds } from '../shared/schema';
import type { Dealer, InsertDealer } from '../shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per image (Google requirement)
    files: 10, // 1 primary + up to 9 additional
  },
  fileFilter: (req, file, cb) => {
    // Only allow images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

/**
 * POST /api/dealer/:id/upload
 * Upload single vehicle with images (mobile-first Quick Add)
 * Requires: X-API-Key header
 */
router.post(
  '/:id/upload',
  authenticateDealer,
  upload.array('images', 10),
  async (req: Request, res: Response) => {
    try {
      const dealer = req.dealer as Dealer;
      const files = req.files as Express.Multer.File[];

      // Validate required fields
      const {
        vin,
        make,
        model,
        year,
        price,
        mileage,
        fuelType,
        transmission,
        color,
        city,
        state,
        description,
      } = req.body;

      if (!vin || !make || !model || !year || !price || !mileage ||
          !fuelType || !transmission || !color || !city || !state || !description) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields',
          required: ['vin', 'make', 'model', 'year', 'price', 'mileage', 
                    'fuelType', 'transmission', 'color', 'city', 'state', 'description'],
        });
        return;
      }

      // Validate images (at least 3 required)
      if (!files || files.length < 3) {
        res.status(400).json({
          success: false,
          error: 'At least 3 vehicle images are required',
        });
        return;
      }

      // Prepare vehicle data
      const vehicleData = {
        vin,
        make,
        model,
        year: parseInt(year),
        price: parseInt(price),
        mileage: parseInt(mileage),
        condition: 'used', // Default to used
        fuelType,
        transmission,
        color,
        bodyType: 'Sedan', // Default
        primaryImage: files[0].buffer,
        additionalImages: files.slice(1).map(f => f.buffer),
        dealerPhone: dealer.phone,
        dealerAddress: `${city}, ${state}`,
        dealerAttested: true, // Assume attested through dashboard login
      };

      // Upload vehicle with validation
      const result = await quickAddVehicle(dealer, vehicleData);

      if (!result.isValid) {
        res.status(400).json({
          success: false,
          errors: result.errors,
          warnings: result.warnings,
        });
        return;
      }

      // Success
      res.status(201).json({
        success: true,
        uploadId: result.reportId, // Use real validation report ID
        vehicleId: result.vehicleId,
        slug: result.slug,
        vdpUrl: `https://${req.headers.host}/used/${result.slug}`,
        warnings: result.warnings,
        message: result.warnings.length > 0
          ? 'Vehicle uploaded successfully but flagged for review due to warnings'
          : 'Vehicle uploaded successfully',
      });
    } catch (error) {
      console.error('Quick add error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload vehicle',
      });
    }
  }
);

/**
 * POST /api/dealer/:id/upload/bulk
 * Bulk CSV upload with optional image ZIP
 * Requires: X-API-Key header
 */
router.post(
  '/:id/upload/bulk',
  authenticateDealer,
  upload.fields([
    { name: 'csvFile', maxCount: 1 },
    { name: 'imageZip', maxCount: 1 },
  ]),
  async (req: Request, res: Response) => {
    try {
      const dealer = req.dealer as Dealer;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      // Validate CSV file
      if (!files.csvFile || files.csvFile.length === 0) {
        res.status(400).json({
          success: false,
          error: 'CSV file is required',
        });
        return;
      }

      const csvFile = files.csvFile[0];
      const imageZip = files.imageZip?.[0];

      // TODO: Implement CSV parsing and bulk vehicle upload
      // For now, return a placeholder response
      res.status(201).json({
        success: true,
        batchId: `batch_${Date.now()}`,
        summary: {
          total: 0,
          successCount: 0,
          errorCount: 0,
          warningCount: 0,
        },
        message: 'Bulk upload feature coming soon. Currently processing CSV format validation.',
      });
    } catch (error) {
      console.error('Bulk upload error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process bulk upload',
      });
    }
  }
);

/**
 * GET /api/dealer/:dealerId/vehicles
 * Get all vehicles for a dealer
 */
router.get(
  '/:dealerId/vehicles',
  authenticateDealer,
  async (req: Request, res: Response) => {
    try {
      const dealer = req.dealer as Dealer;
      const vehicles = await getDealerVehicles(dealer.id);

      res.json({
        success: true,
        vehicles,
        total: vehicles.length,
      });
    } catch (error) {
      console.error('Get vehicles error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve vehicles',
      });
    }
  }
);

/**
 * GET /api/dealer/:dealerId/validation/:reportId
 * Get validation report for an upload
 */
router.get(
  '/:dealerId/validation/:reportId',
  authenticateDealer,
  async (req: Request, res: Response) => {
    try {
      const dealer = req.dealer as Dealer;
      const { reportId } = req.params;

      const report = await getValidationReport(dealer.id, reportId);

      if (!report) {
        res.status(404).json({
          success: false,
          error: 'Validation report not found',
        });
        return;
      }

      res.json({
        success: true,
        report,
      });
    } catch (error) {
      console.error('Get validation report error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve validation report',
      });
    }
  }
);

/**
 * GET /api/dealer/:dealerId/feed/preview
 * Generate Google Vehicle Listing feed preview
 */
router.get(
  '/:dealerId/feed/preview',
  authenticateDealer,
  async (req: Request, res: Response) => {
    try {
      const dealer = req.dealer as Dealer;

      // Get approved vehicles
      const vehicles = await db
        .select()
        .from(dealerVehicles)
        .where(eq(dealerVehicles.dealerId, dealer.id));

      // Map to Google Vehicle Listing format
      const feedData = vehicles
        .filter(v => v.validationStatus === 'approved')
        .map(v => ({
          // Required fields
          id: v.id,
          title: `${v.year} ${v.make} ${v.model}`,
          link: `https://${req.headers.host}/used/${v.slug}`,
          price: `${v.price} INR`,
          image_link: `https://${req.headers.host}${v.primaryImage}`,
          condition: v.condition,
          availability: 'in stock',
          
          // Vehicle-specific fields
          vehicle_identification_number: v.vin,
          make: v.make,
          model: v.model,
          year: v.year,
          mileage: {
            value: v.mileage,
            unit: 'km',
          },
          fuel_type: v.fuelType,
          transmission: v.transmission,
          color: v.color,
          body_style: v.bodyType,
          
          // Additional images
          additional_image_links: v.additionalImages?.map(
            img => `https://${req.headers.host}${img}`
          ) || [],
          
          // Dealer info
          seller_name: dealer.dealerName,
          seller_phone: v.dealerPhone,
          location: {
            address: v.dealerAddress,
            city: dealer.city,
            region: dealer.state,
            country: 'IN',
          },
        }));

      // Check for errors (vehicles that would be rejected)
      const errorSummary = vehicles
        .filter(v => v.validationStatus !== 'approved')
        .map(v => ({
          vehicleId: v.id,
          vin: v.vin,
          status: v.validationStatus,
          errors: v.validationErrors,
          warnings: v.validationWarnings,
        }));

      res.json({
        success: true,
        feedData,
        vehicleCount: feedData.length,
        totalVehicles: vehicles.length,
        approvedCount: feedData.length,
        rejectedCount: errorSummary.length,
        errorSummary: errorSummary.length > 0 ? errorSummary : undefined,
      });
    } catch (error) {
      console.error('Feed preview error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate feed preview',
      });
    }
  }
);

/**
 * POST /api/dealer/register
 * Admin endpoint to register a new dealer and generate API key
 * TODO: Add admin authentication
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const {
      dealerName,
      storeCode,
      contactPerson,
      email,
      phone,
      address,
      city,
      state,
    } = req.body;

    if (!dealerName || !storeCode || !contactPerson || !email || !phone || !address) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['dealerName', 'storeCode', 'contactPerson', 'email', 'phone', 'address'],
      });
      return;
    }

    // Generate API key
    const apiKey = generateApiKey();

    // Create dealer
    const dealerData: InsertDealer = {
      dealerName,
      storeCode,
      contactPerson,
      email,
      phone,
      address,
      city: city || 'Hyderabad',
      state: state || 'Telangana',
      apiKey,
      isActive: true,
      monthlyUploadLimit: 100,
    };

    const [newDealer] = await db.insert(dealers).values(dealerData).returning();

    res.status(201).json({
      success: true,
      dealer: {
        id: newDealer.id,
        dealerName: newDealer.dealerName,
        storeCode: newDealer.storeCode,
        email: newDealer.email,
        apiKey: newDealer.apiKey, // In production, send this via secure channel
      },
      message: 'Dealer registered successfully. Please store the API key securely.',
    });
  } catch (error) {
    console.error('Dealer registration error:', error);
    
    if (error instanceof Error && error.message.includes('unique constraint')) {
      res.status(409).json({
        success: false,
        error: 'Dealer with this email or store code already exists',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to register dealer',
    });
  }
});

/**
 * GET /api/dealer/:dealerId/stats
 * Get dealer statistics (upload count, limits, etc.)
 */
router.get(
  '/:dealerId/stats',
  authenticateDealer,
  async (req: Request, res: Response) => {
    try {
      const dealer = req.dealer as Dealer;

      // Get vehicle counts by status
      const allVehicles = await db
        .select()
        .from(dealerVehicles)
        .where(eq(dealerVehicles.dealerId, dealer.id));

      const stats = {
        totalVehicles: allVehicles.length,
        approvedVehicles: allVehicles.filter(v => v.validationStatus === 'approved').length,
        pendingVehicles: allVehicles.filter(v => v.validationStatus === 'pending').length,
        rejectedVehicles: allVehicles.filter(v => v.validationStatus === 'rejected').length,
        onHoldVehicles: allVehicles.filter(v => v.validationStatus === 'on_hold').length,
        monthlyUploads: dealer.currentMonthUploads || 0,
        monthlyLimit: dealer.monthlyUploadLimit || 100,
        remainingUploads: (dealer.monthlyUploadLimit || 100) - (dealer.currentMonthUploads || 0),
        limitResetDate: dealer.limitResetAt,
      };

      res.json({
        success: true,
        stats,
      });
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve statistics',
      });
    }
  }
);

export default router;
