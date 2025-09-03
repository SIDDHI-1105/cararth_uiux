import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCarSchema, insertContactSchema, insertSubscriptionSchema, insertFeaturedListingSchema } from "@shared/schema";
import { priceComparisonService } from "./priceComparison";
import { marketplaceAggregator } from "./marketplaceAggregator";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all cars with optional filters
  app.get("/api/cars", async (req, res) => {
    try {
      const filters = {
        brand: req.query.brand as string,
        priceMin: req.query.priceMin ? parseFloat(req.query.priceMin as string) : undefined,
        priceMax: req.query.priceMax ? parseFloat(req.query.priceMax as string) : undefined,
        city: req.query.city as string,
        fuelType: req.query.fuelType as string,
        transmission: req.query.transmission as string,
        yearMin: req.query.yearMin ? parseInt(req.query.yearMin as string) : undefined,
        yearMax: req.query.yearMax ? parseInt(req.query.yearMax as string) : undefined,
      };

      const cars = await storage.searchCars(filters);
      res.json(cars);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cars" });
    }
  });

  // Get car by ID
  app.get("/api/cars/:id", async (req, res) => {
    try {
      const car = await storage.getCar(req.params.id);
      if (!car) {
        return res.status(404).json({ error: "Car not found" });
      }
      res.json(car);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch car" });
    }
  });

  // Create new car listing
  app.post("/api/cars", async (req, res) => {
    try {
      const carData = insertCarSchema.parse(req.body);
      const car = await storage.createCar(carData);
      res.status(201).json(car);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid car data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create car listing" });
    }
  });

  // Search cars (alternative endpoint)
  app.post("/api/cars/search", async (req, res) => {
    try {
      const searchSchema = z.object({
        brand: z.string().optional(),
        priceMin: z.number().optional(),
        priceMax: z.number().optional(),
        city: z.string().optional(),
        fuelType: z.string().optional(),
        transmission: z.string().optional(),
        yearMin: z.number().optional(),
        yearMax: z.number().optional(),
      });

      const filters = searchSchema.parse(req.body);
      const cars = await storage.searchCars(filters);
      res.json(cars);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid search parameters", details: error.errors });
      }
      res.status(500).json({ error: "Failed to search cars" });
    }
  });

  // Create contact inquiry
  app.post("/api/contacts", async (req, res) => {
    try {
      const contactData = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(contactData);
      res.status(201).json(contact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid contact data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create contact inquiry" });
    }
  });

  // Get contacts for a car (for sellers)
  app.get("/api/cars/:id/contacts", async (req, res) => {
    try {
      const contacts = await storage.getContactsForCar(req.params.id);
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contacts" });
    }
  });

  // Get car seller info
  app.get("/api/cars/:id/seller", async (req, res) => {
    try {
      const car = await storage.getCar(req.params.id);
      if (!car) {
        return res.status(404).json({ error: "Car not found" });
      }
      
      const seller = await storage.getUser(car.sellerId);
      if (!seller) {
        return res.status(404).json({ error: "Seller not found" });
      }

      // Don't send sensitive info
      const { password, ...sellerInfo } = seller;
      res.json(sellerInfo);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch seller information" });
    }
  });

  // Get price insights for a car
  app.get("/api/cars/:id/price-insights", async (req, res) => {
    try {
      const car = await storage.getCar(req.params.id);
      if (!car) {
        return res.status(404).json({ error: "Car not found" });
      }

      const carData = {
        brand: car.brand,
        model: car.model,
        year: car.year,
        city: car.city,
        mileage: car.mileage,
        fuelType: car.fuelType,
        transmission: car.transmission
      };

      const insights = await priceComparisonService.getPriceInsights(carData);
      res.json(insights);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch price insights" });
    }
  });

  // Compare car price with market
  app.post("/api/cars/compare-price", async (req, res) => {
    try {
      const schema = z.object({
        brand: z.string(),
        model: z.string(),
        year: z.number(),
        city: z.string(),
        mileage: z.number(),
        fuelType: z.string(),
        transmission: z.string(),
        userPrice: z.number()
      });

      const data = schema.parse(req.body);
      const { userPrice, ...carData } = data;

      const comparison = await priceComparisonService.comparePrices(carData, userPrice);
      res.json(comparison);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to compare price" });
    }
  });

  // Advanced marketplace search across portals
  app.post("/api/marketplace/search", async (req, res) => {
    try {
      const searchSchema = z.object({
        brand: z.string().optional(),
        model: z.string().optional(),
        yearMin: z.number().optional(),
        yearMax: z.number().optional(),
        priceMin: z.number().optional(),
        priceMax: z.number().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        radiusKm: z.number().optional(),
        fuelType: z.array(z.string()).optional(),
        transmission: z.array(z.string()).optional(),
        mileageMax: z.number().optional(),
        owners: z.array(z.number()).optional(),
        condition: z.array(z.string()).optional(),
        verificationStatus: z.array(z.string()).optional(),
        sellerType: z.array(z.string()).optional(),
        features: z.array(z.string()).optional(),
        hasImages: z.boolean().optional(),
        hasWarranty: z.boolean().optional(),
        listedWithinDays: z.number().optional(),
        sources: z.array(z.string()).optional(),
        sortBy: z.string().optional(),
        sortOrder: z.string().optional(),
        limit: z.number().optional()
      });

      const filters = searchSchema.parse(req.body);
      console.log('Marketplace search filters:', filters);

      const searchResult = await marketplaceAggregator.searchAcrossPortals(filters as any);
      res.json(searchResult);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid search parameters", details: error.errors });
      }
      console.error('Marketplace search error:', error);
      res.status(500).json({ error: "Failed to search marketplace" });
    }
  });

  // Get individual marketplace listing details
  app.get("/api/marketplace/listing/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Generate detailed listing data for demo
      const listing = {
        id,
        title: `Hyundai i20 Sportz - Well Maintained Car`,
        brand: 'Hyundai',
        model: 'i20',
        year: 2020,
        price: 650000,
        mileage: 35000,
        fuelType: 'Petrol',
        transmission: 'Manual',
        condition: 'Excellent',
        location: 'Mumbai, Maharashtra',
        source: 'CarDekho',
        verificationStatus: 'verified',
        sellerType: 'dealer',
        listingDate: new Date().toISOString(),
        description: `This Hyundai i20 Sportz is in excellent condition with complete service history. 
        Single owner, non-accident car with all genuine parts. Well-maintained with regular servicing at authorized service center.`,
        images: [
          "/api/placeholder/car-image",
          "/api/placeholder/car-image",
          "/api/placeholder/car-image",
          "/api/placeholder/car-image"
        ],
        features: [
          'Air Conditioning', 'Power Steering', 'Power Windows', 'Central Locking',
          'ABS', 'Dual Airbags', 'Music System', 'Bluetooth Connectivity',
          'Alloy Wheels', 'Fog Lights', 'Rear Parking Sensors', 'Electric Mirrors'
        ],
        seller: {
          name: 'Mumbai Car Bazaar',
          type: 'dealer',
          rating: 4.5,
          reviews: 127,
          verified: true
        }
      };
      
      res.json(listing);
    } catch (error) {
      console.error('Get listing error:', error);
      res.status(500).json({ error: 'Failed to fetch listing details' });
    }
  });

  // Contact seller with OTP verification
  app.post("/api/marketplace/contact", async (req, res) => {
    try {
      const { name, phone, email, message, listingId, listingTitle } = req.body;
      
      if (!name || !phone || !listingId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Generate and store OTP (in production, use SMS service)
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store OTP in session for demo (use database in production)
      const contactRequest = {
        id: `contact-${Date.now()}`,
        name,
        phone,
        email,
        message,
        listingId,
        listingTitle,
        otp,
        createdAt: new Date(),
        verified: false
      };
      
      // Store in session for demo
      if (!req.session) req.session = {};
      req.session.contactRequest = contactRequest;
      
      console.log(`📱 OTP for ${phone}: ${otp} (Listing: ${listingTitle})`);
      
      res.json({ 
        success: true, 
        message: 'OTP sent successfully',
        contactId: contactRequest.id 
      });
    } catch (error) {
      console.error('Contact request error:', error);
      res.status(500).json({ error: 'Failed to send contact request' });
    }
  });

  // Verify OTP and complete contact sharing
  app.post("/api/marketplace/verify-contact", async (req, res) => {
    try {
      const { phone, otp, listingId } = req.body;
      
      if (!phone || !otp || !listingId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const contactRequest = req.session?.contactRequest;
      
      if (!contactRequest || 
          contactRequest.phone !== phone || 
          contactRequest.listingId !== listingId ||
          contactRequest.otp !== otp) {
        return res.status(400).json({ error: 'Invalid OTP or request' });
      }

      // Mark as verified
      contactRequest.verified = true;
      contactRequest.verifiedAt = new Date();
      
      // In production, save to database and notify seller
      console.log(`✅ Contact verified: ${contactRequest.name} (${contactRequest.phone}) interested in ${contactRequest.listingTitle}`);
      
      res.json({ 
        success: true, 
        message: 'Contact details shared with seller successfully' 
      });
    } catch (error) {
      console.error('OTP verification error:', error);
      res.status(500).json({ error: 'Failed to verify OTP' });
    }
  });

  // Messaging system endpoints
  app.get("/api/conversations/:listingId", async (req, res) => {
    try {
      const { listingId } = req.params;
      
      // Generate demo conversation for listing
      const messages = [
        {
          id: 'msg-1',
          senderId: 'buyer-123',
          senderType: 'buyer',
          senderName: 'Interested Buyer',
          content: 'Hi, I\'m interested in this car. Is it still available?',
          timestamp: new Date(Date.now() - 3600000), // 1 hour ago
          isRead: true
        },
        {
          id: 'msg-2', 
          senderId: 'seller-456',
          senderType: 'seller',
          senderName: 'Car Owner',
          content: 'Yes, the car is available. Would you like to schedule a test drive?',
          timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
          isRead: true
        }
      ];
      
      res.json(messages);
    } catch (error) {
      console.error('Get conversation error:', error);
      res.status(500).json({ error: 'Failed to fetch conversation' });
    }
  });

  app.post("/api/conversations/:listingId/messages", async (req, res) => {
    try {
      const { listingId } = req.params;
      const { content, senderType, listingTitle } = req.body;
      
      if (!content || !senderType) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const newMessage = {
        id: `msg-${Date.now()}`,
        senderId: `${senderType}-${Math.random().toString(36).substr(2, 9)}`,
        senderType,
        senderName: senderType === 'buyer' ? 'Interested Buyer' : 'Car Owner',
        content,
        timestamp: new Date(),
        isRead: false
      };
      
      // In production, save to database
      console.log(`💬 New message in ${listingTitle}: ${content} (from ${senderType})`);
      
      res.json({ success: true, message: newMessage });
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  app.post("/api/conversations/:listingId/request-contact", async (req, res) => {
    try {
      const { listingId } = req.params;
      const { senderType } = req.body;
      
      // Pro feature - share contact details
      console.log(`📞 Contact details requested for listing ${listingId} by ${senderType}`);
      
      res.json({ 
        success: true, 
        contactShared: true,
        message: 'Contact details shared successfully' 
      });
    } catch (error) {
      console.error('Request contact error:', error);
      res.status(500).json({ error: 'Failed to request contact details' });
    }
  });

  // Premium subscription endpoints
  app.post("/api/subscriptions", async (req, res) => {
    try {
      const subscriptionData = insertSubscriptionSchema.parse(req.body);
      const subscription = await storage.createSubscription(subscriptionData);
      res.status(201).json(subscription);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid subscription data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create subscription" });
    }
  });

  // Featured listings endpoints
  app.post("/api/featured-listings", async (req, res) => {
    try {
      const featuredData = insertFeaturedListingSchema.parse(req.body);
      const featured = await storage.createFeaturedListing(featuredData);
      
      // Update car to be featured
      await storage.updateCarFeatured(featuredData.carId, true, new Date(Date.now() + featuredData.duration * 24 * 60 * 60 * 1000));
      
      res.status(201).json(featured);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid featured listing data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create featured listing" });
    }
  });

  app.get("/api/subscriptions/user/:userId", async (req, res) => {
    try {
      const subscription = await storage.getUserSubscription(req.params.userId);
      res.json(subscription);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch subscription" });
    }
  });

  // Placeholder image endpoint
  app.get("/api/placeholder/car-image", (req, res) => {
    // Generate a simple SVG placeholder for car images
    const svg = `
      <svg width="500" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="500" height="300" fill="#f8f9fa"/>
        <rect x="0" y="0" width="500" height="300" fill="url(#gradient)" opacity="0.1"/>
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#8B5CF6;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#06B6D4;stop-opacity:1" />
          </linearGradient>
        </defs>
        <g transform="translate(250,150)">
          <path d="M-80,-20 L-40,-40 L40,-40 L80,-20 L80,20 L60,30 L-60,30 L-80,20 Z" fill="#64748b" opacity="0.3"/>
          <circle cx="-50" cy="25" r="15" fill="#374151" opacity="0.4"/>
          <circle cx="50" cy="25" r="15" fill="#374151" opacity="0.4"/>
          <rect x="-70" y="-35" width="20" height="15" fill="#9CA3AF" opacity="0.3"/>
          <rect x="-30" y="-35" width="60" height="15" fill="#9CA3AF" opacity="0.3"/>
          <rect x="50" y="-35" width="20" height="15" fill="#9CA3AF" opacity="0.3"/>
        </g>
        <text x="250" y="200" text-anchor="middle" font-family="Inter, sans-serif" font-size="14" fill="#6B7280">Car Image</text>
      </svg>
    `;
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
    res.send(svg);
  });

  const httpServer = createServer(app);
  return httpServer;
}
