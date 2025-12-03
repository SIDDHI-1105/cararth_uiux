// FILE: server/spinnyRoutes.ts – Spinny-style API routes

import type { Express } from "express";
import { z } from "zod";

// RTO Lookup Response Schema
const rtoLookupResponseSchema = z.object({
  registrationNumber: z.string(),
  brand: z.string(),
  model: z.string(),
  year: z.number(),
  fuelType: z.string(),
  transmission: z.string(),
  city: z.string(),
  ownerSerial: z.number(),
  registrationDate: z.string(),
  chassisNumber: z.string().optional(),
  engineNumber: z.string().optional()
});

// Listing Creation Schema
const createListingSchema = z.object({
  registrationNumber: z.string(),
  brand: z.string(),
  model: z.string(),
  year: z.number(),
  price: z.number(),
  mileage: z.number(),
  fuelType: z.string(),
  transmission: z.string(),
  city: z.string(),
  owners: z.number(),
  description: z.string().optional(),
  sellerName: z.string(),
  sellerPhone: z.string(),
  sellerEmail: z.string().optional(),
  images: z.array(z.string()).optional()
});

export function registerSpinnyRoutes(app: Express) {
  /**
   * GET /api/rto-lookup
   * Lookup vehicle details by registration number
   * Query param: reg (registration number)
   */
  app.get("/api/rto-lookup", async (req, res) => {
    try {
      const { reg } = req.query;

      if (!reg || typeof reg !== 'string') {
        return res.status(400).json({
          success: false,
          error: "Registration number is required"
        });
      }

      // TODO: Integrate with actual RTO provider
      // For now, returning mock data
      // In production, call external RTO API using RTO_PROVIDER_URL and RTO_PROVIDER_KEY

      const regNumber = reg.toUpperCase();

      // Mock response based on registration number pattern
      const mockResponse = {
        registrationNumber: regNumber,
        brand: "Maruti Suzuki",
        model: "Swift VDi",
        year: 2018,
        fuelType: "Diesel",
        transmission: "Manual",
        city: "Hyderabad",
        ownerSerial: 1,
        registrationDate: "2018-03-15",
        chassisNumber: `MA3***********${regNumber.slice(-3)}`,
        engineNumber: `D13A***${regNumber.slice(-4)}`
      };

      res.json({
        success: true,
        data: mockResponse
      });
    } catch (error) {
      console.error("RTO lookup error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch vehicle details"
      });
    }
  });

  /**
   * POST /api/listings
   * Create a new car listing
   */
  app.post("/api/listings", async (req, res) => {
    try {
      const validatedData = createListingSchema.parse(req.body);

      // TODO: Save to database
      // For now, just return success with generated listing ID
      const listingId = `LST-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      console.log("New listing created:", {
        id: listingId,
        seller: validatedData.sellerName,
        vehicle: `${validatedData.brand} ${validatedData.model}`,
        price: validatedData.price
      });

      res.status(201).json({
        success: true,
        data: {
          listingId,
          status: "pending_review",
          message: "Your listing has been submitted for review"
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: error.errors
        });
      }

      console.error("Listing creation error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create listing"
      });
    }
  });

  /**
   * POST /api/uploads
   * Upload images for listings
   * NOTE: This is a placeholder for S3/Cloudinary integration
   */
  app.post("/api/uploads", async (req, res) => {
    try {
      // TODO: Integrate with S3 or Cloudinary
      // For now, returning mock pre-signed URLs

      const { filename, contentType } = req.body;

      if (!filename) {
        return res.status(400).json({
          success: false,
          error: "Filename is required"
        });
      }

      // Mock response with pre-signed URL
      const mockUploadUrl = `https://storage.example.com/listings/${Date.now()}-${filename}`;
      const mockViewUrl = `https://cdn.example.com/listings/${Date.now()}-${filename}`;

      res.json({
        success: true,
        data: {
          uploadUrl: mockUploadUrl,
          viewUrl: mockViewUrl,
          expiresIn: 3600 // 1 hour
        }
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to generate upload URL"
      });
    }
  });

  /**
   * GET /api/me
   * Get current user information
   */
  app.get("/api/me", async (req, res) => {
    try {
      // TODO: Integrate with actual session/auth middleware
      // For now, checking if user is authenticated via session

      // @ts-ignore - req.user is added by passport
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          error: "Not authenticated"
        });
      }

      res.json({
        success: true,
        data: {
          id: user.id || user.sub,
          name: user.name || user.displayName,
          email: user.email,
          picture: user.picture || user.avatar,
          provider: user.provider || "google"
        }
      });
    } catch (error) {
      console.error("/api/me error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch user info"
      });
    }
  });

  /**
   * GET /auth/google
   * Initiate Google OAuth flow
   * NOTE: This requires Google OAuth strategy to be configured in passport
   */
  app.get("/auth/google", (req, res) => {
    // TODO: Integrate with passport-google-oauth20
    // For now, returning a placeholder message

    // Check if Google OAuth is configured
    const isConfigured = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;

    if (!isConfigured) {
      return res.status(501).json({
        success: false,
        error: "Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables."
      });
    }

    // In production, this would use: passport.authenticate('google', { scope: ['profile', 'email'] })
    res.send(`
      <html>
        <head><title>Google OAuth Placeholder</title></head>
        <body style="font-family: Arial; max-width: 600px; margin: 100px auto; text-align: center;">
          <h2>🔐 Google OAuth Integration</h2>
          <p>To enable Google Sign-In, please configure the following:</p>
          <ol style="text-align: left;">
            <li>Set <code>GOOGLE_CLIENT_ID</code> in your .env file</li>
            <li>Set <code>GOOGLE_CLIENT_SECRET</code> in your .env file</li>
            <li>Set <code>GOOGLE_REDIRECT_URI</code> (default: http://localhost:5000/auth/google/callback)</li>
            <li>Enable Google OAuth in passport configuration</li>
          </ol>
          <p><a href="/">← Back to Home</a></p>
        </body>
      </html>
    `);
  });

  /**
   * GET /auth/google/callback
   * Google OAuth callback
   */
  app.get("/auth/google/callback", (req, res) => {
    // TODO: Integrate with passport-google-oauth20
    // For now, returning a placeholder

    res.send(`
      <html>
        <head><title>OAuth Callback</title></head>
        <body style="font-family: Arial; max-width: 600px; margin: 100px auto; text-align: center;">
          <h2>OAuth Callback Placeholder</h2>
          <p>This endpoint will handle the Google OAuth callback once configured.</p>
          <p><a href="/">← Back to Home</a></p>
        </body>
      </html>
    `);
  });

  console.log("✅ Spinny-style routes registered:");
  console.log("   - GET  /api/rto-lookup");
  console.log("   - POST /api/listings");
  console.log("   - POST /api/uploads");
  console.log("   - GET  /api/me");
  console.log("   - GET  /auth/google");
  console.log("   - GET  /auth/google/callback");
}
