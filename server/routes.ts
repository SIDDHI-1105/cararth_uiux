import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertCarSchema, 
  insertContactSchema, 
  insertSubscriptionSchema, 
  insertFeaturedListingSchema,
  insertConversationSchema,
  insertMessageSchema,
  insertMessageInteractionSchema,
  insertConversationBlockSchema,
  insertUserSearchActivitySchema,
  insertPhoneVerificationSchema
} from "@shared/schema";
import { priceComparisonService } from "./priceComparison";
import { marketplaceAggregator, initializeMarketplaceAggregator } from "./marketplaceAggregator";
import { AutomotiveNewsService } from "./automotiveNews";
import { z } from "zod";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupSocialAuth } from "./socialAuth";
import { 
  communityPosts, 
  communityComments, 
  userReputation, 
  users,
  insertCommunityPostSchema,
  insertCommunityCommentSchema 
} from "@shared/schema";
import { desc, eq } from "drizzle-orm";
import { assistantService, type AssistantQuery } from "./assistantService";
import { cacheManager, withCache, HyderabadCacheWarmer } from "./advancedCaching.js";
import { enhanceHyderabadSearch, HyderabadMarketIntelligence } from "./hyderabadOptimizations.js";
import { fastSearchService } from "./fastSearch.js";

// Developer mode check
const isDeveloperMode = (req: any) => {
  // Check if running in development environment
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  
  // Check for developer user (if authenticated)
  if (req.isAuthenticated && typeof req.isAuthenticated === 'function' && req.isAuthenticated()) {
    const userEmail = req.user?.claims?.email;
    // Add your developer email here or check for admin status
    return userEmail && (
      userEmail.includes('@replit.com') || 
      userEmail.includes('developer') ||
      process.env.DEVELOPER_EMAIL === userEmail
    );
  }
  
  return false;
};

// Subscription middleware to check search limits
const checkSearchLimit = async (req: any, res: any, next: any) => {
  try {
    // Developer mode bypass
    if (isDeveloperMode(req)) {
      console.log('🚀 Developer mode active - bypassing all restrictions');
      return next();
    }

    // Handle anonymous users with 30-day rolling window
    if (!req.isAuthenticated || typeof req.isAuthenticated !== 'function' || !req.isAuthenticated()) {
      // Get or generate visitor ID
      let visitorId = req.headers['x-visitor-id'] as string;
      if (!visitorId) {
        visitorId = require('crypto').randomUUID();
        res.setHeader('X-Visitor-ID', visitorId);
      }

      // Calculate 30 days ago
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Check search count in rolling 30-day window
      const searchCount = await storage.getAnonymousSearchCountSince(visitorId, thirtyDaysAgo);
      
      if (searchCount >= 10) {
        // Return 429 with popup trigger metadata
        return res.status(429).json({
          code: "search_limit_exceeded",
          message: "🔥 You're on fire with searches! Ready to unlock unlimited car discoveries?",
          limit: 10,
          window: "30d",
          searchesLeft: 0,
          resetAt: new Date(Date.now() + (24 * 60 * 60 * 1000)) // Reset tomorrow (searches older than 30 days will be available)
        });
      }

      // Log the search activity
      await storage.logAnonymousSearch({
        visitorId,
        ipHash: req.ip ? require('crypto').createHash('sha256').update(req.ip).digest('hex').substring(0, 32) : null,
        userAgent: req.get('User-Agent') || null
      });

      // Limit results to 10 for non-authenticated users
      if (req.body) {
        req.body.limit = Math.min(req.body.limit || 10, 10);
      }
      if (req.query) {
        req.query.limit = Math.min(req.query.limit || 10, 10);
      }
      return next();
    }

    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Free tier users need phone verification
    if (user.subscriptionTier === 'free' && !user.phoneVerified) {
      return res.status(403).json({ 
        error: "Phone verification required",
        requiresPhoneVerification: true,
        userTier: user.subscriptionTier 
      });
    }

    // Check search limits for free tier
    const searchLimitInfo = await storage.checkUserSearchLimit(userId);
    if (!searchLimitInfo.canSearch) {
      return res.status(429).json({ 
        error: "Search limit exceeded",
        searchesLeft: searchLimitInfo.searchesLeft,
        resetDate: searchLimitInfo.resetDate,
        userTier: user.subscriptionTier
      });
    }

    // Log the search activity
    await storage.logUserSearchActivity({
      userId,
      searchType: 'marketplace_search',
      searchFilters: req.body || req.query,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent') || null
    });

    // Increment search count for free users
    if (user.subscriptionTier === 'free') {
      await storage.incrementUserSearchCount(userId);
    }

    next();
  } catch (error) {
    console.error("Search limit check error:", error);
    res.status(500).json({ error: "Failed to check search limits" });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize services
  const automotiveNewsService = new AutomotiveNewsService();
  
  // Initialize MarketplaceAggregator with database storage for caching
  if (process.env.DATABASE_URL) {
    const { DatabaseStorage } = await import('./dbStorage.js');
    const dbStorage = new DatabaseStorage();
    initializeMarketplaceAggregator(dbStorage);
    console.log('🚀 MarketplaceAggregator initialized with database caching');
  } else {
    console.log('⚠️ Using MarketplaceAggregator without database caching');
  }

  // Auth middleware
  await setupAuth(app);
  
  // Social authentication
  setupSocialAuth(app);

  // Batch ingestion endpoint for external cron jobs (cron-job.org, GitHub Actions, Railway)
  app.post('/api/run_ingestion', async (req, res) => {
    try {
      console.log('🚀 Manual ingestion triggered via API endpoint');
      
      // Import batch ingestion service
      const { batchIngestionService } = await import('./batchIngestion.js');
      
      // Get ingestion status
      const status = batchIngestionService.getStatus();
      if (status.isIngesting) {
        return res.status(429).json({ 
          error: 'Ingestion already in progress',
          isIngesting: true 
        });
      }
      
      // Start ingestion in background
      const cities = req.body.cities || ['hyderabad', 'bangalore', 'mumbai', 'delhi', 'pune', 'chennai'];
      batchIngestionService.runIngestion(cities).catch(error => {
        console.error('Background ingestion failed:', error);
      });
      
      res.json({ 
        message: 'Batch ingestion started',
        cities: cities,
        isIngesting: true,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Ingestion endpoint error:', error);
      res.status(500).json({ error: 'Failed to start ingestion' });
    }
  });

  // Ingestion status endpoint
  app.get('/api/ingestion/status', async (req, res) => {
    try {
      const { batchIngestionService } = await import('./batchIngestion.js');
      const status = batchIngestionService.getStatus();
      
      // Get search stats
      const { fastSearchService } = await import('./fastSearch.js');
      const stats = await fastSearchService.getSearchStats();
      
      res.json({
        ...status,
        ...stats,
        lastCheck: new Date().toISOString()
      });
    } catch (error) {
      console.error('Status endpoint error:', error);
      res.status(500).json({ error: 'Failed to get status' });
    }
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Usage status endpoint for anonymous users
  app.get('/api/usage/status', async (req: any, res) => {
    try {
      // If authenticated, unlimited searches
      if (req.isAuthenticated && req.isAuthenticated()) {
        return res.json({
          isAuthenticated: true,
          searchesLeft: -1, // unlimited
          totalLimit: -1,
          window: "unlimited"
        });
      }

      // For anonymous users, check visitor ID and rolling window
      const visitorId = req.headers['x-visitor-id'] as string;
      if (!visitorId) {
        return res.json({
          isAuthenticated: false,
          searchesLeft: 10,
          totalLimit: 10,
          window: "30d",
          needsVisitorId: true
        });
      }

      // Calculate 30 days ago
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Check search count in rolling 30-day window
      let searchCount = 0;
      try {
        searchCount = await storage.getAnonymousSearchCountSince(visitorId, thirtyDaysAgo);
      } catch (dbError: any) {
        // If table doesn't exist, default to 0 searches
        if (dbError.code === '42P01') {
          console.warn('Anonymous search activity table not found, defaulting to 0 searches');
          searchCount = 0;
        } else {
          throw dbError; // Re-throw other database errors
        }
      }
      const searchesLeft = Math.max(0, 10 - searchCount);

      res.json({
        isAuthenticated: false,
        searchesLeft,
        totalLimit: 10,
        window: "30d",
        searchCount
      });
    } catch (error) {
      console.error("Error fetching usage status:", error);
      res.status(500).json({ error: "Failed to fetch usage status" });
    }
  });

  // Phone verification endpoints
  app.post('/api/auth/verify-phone/send', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { phoneNumber } = req.body;
      
      if (!phoneNumber) {
        return res.status(400).json({ error: "Phone number required" });
      }

      // Generate random 6-digit code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await storage.createPhoneVerification({
        userId,
        phoneNumber,
        verificationCode,
        expiresAt
      });

      // In a real app, send SMS here
      console.log(`SMS Verification Code for ${phoneNumber}: ${verificationCode}`);
      
      res.json({ message: "Verification code sent", codeForDemo: verificationCode });
    } catch (error) {
      console.error("Phone verification error:", error);
      res.status(500).json({ error: "Failed to send verification code" });
    }
  });

  app.post('/api/auth/verify-phone/confirm', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ error: "Verification code required" });
      }

      const isValid = await storage.verifyPhoneCode(userId, code);
      if (isValid) {
        await storage.markPhoneAsVerified(userId);
        const user = await storage.getUser(userId);
        res.json({ message: "Phone verified successfully", user });
      } else {
        res.status(400).json({ error: "Invalid or expired verification code" });
      }
    } catch (error) {
      console.error("Phone verification error:", error);
      res.status(500).json({ error: "Failed to verify phone" });
    }
  });

  // Subscription management endpoints
  app.get('/api/subscription/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const searchLimitInfo = await storage.checkUserSearchLimit(userId);
      
      res.json({
        tier: user?.subscriptionTier,
        status: user?.subscriptionStatus,
        phoneVerified: user?.phoneVerified,
        searchInfo: searchLimitInfo
      });
    } catch (error) {
      console.error("Subscription status error:", error);
      res.status(500).json({ error: "Failed to get subscription status" });
    }
  });

  app.post('/api/subscription/upgrade', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { tier } = req.body;
      
      if (!['pro_seller', 'pro_buyer', 'superhero'].includes(tier)) {
        return res.status(400).json({ error: "Invalid subscription tier" });
      }

      const updatedUser = await storage.updateUserSubscriptionTier(userId, tier);
      res.json({ message: "Subscription upgraded successfully", user: updatedUser });
    } catch (error) {
      console.error("Subscription upgrade error:", error);
      res.status(500).json({ error: "Failed to upgrade subscription" });
    }
  });
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

  // Search cars (alternative endpoint) - with subscription limits
  app.post("/api/cars/search", checkSearchLimit, async (req, res) => {
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
      
      // Include search limit info in response for free users
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const searchLimitInfo = await storage.checkUserSearchLimit(userId);
      
      res.json({
        cars,
        searchInfo: {
          userTier: user?.subscriptionTier,
          searchesLeft: searchLimitInfo.searchesLeft,
          resetDate: searchLimitInfo.resetDate
        }
      });
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

  // Community Posts API - Create new post
  app.post('/api/community/posts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertCommunityPostSchema.parse({
        ...req.body,
        authorId: userId,
      });

      // Create the post
      const [newPost] = await db
        .insert(communityPosts)
        .values(validatedData)
        .returning();

      // Update user reputation
      await db
        .insert(userReputation)
        .values({
          userId: userId,
          postsCount: 1,
          postsScore: 10, // Base score for creating a post
          totalReputation: 10,
        })
        .onConflictDoUpdate({
          target: userReputation.userId,
          set: {
            postsCount: db.sql`${userReputation.postsCount} + 1`,
            postsScore: db.sql`${userReputation.postsScore} + 10`,
            totalReputation: db.sql`${userReputation.totalReputation} + 10`,
            lastActiveAt: new Date(),
          },
        });

      res.status(201).json(newPost);
    } catch (error) {
      console.error('Failed to create community post:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create post' });
    }
  });

  // Get user-generated community posts with author info
  app.get('/api/community/user-posts', async (req, res) => {
    try {
      const posts = await db
        .select({
          id: communityPosts.id,
          title: communityPosts.title,
          content: communityPosts.content,
          category: communityPosts.category,
          views: communityPosts.views,
          upvotes: communityPosts.upvotes,
          downvotes: communityPosts.downvotes,
          status: communityPosts.status,
          isPinned: communityPosts.isPinned,
          isHot: communityPosts.isHot,
          createdAt: communityPosts.createdAt,
          updatedAt: communityPosts.updatedAt,
          author: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
          },
        })
        .from(communityPosts)
        .leftJoin(users, eq(communityPosts.authorId, users.id))
        .where(eq(communityPosts.status, 'published'))
        .orderBy(desc(communityPosts.createdAt))
        .limit(20);

      res.json({ posts });
    } catch (error) {
      console.error('Failed to fetch user posts:', error);
      res.status(500).json({ error: 'Failed to fetch posts' });
    }
  });

  // Get single community post with comments
  app.get('/api/community/posts/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get the post
      const [post] = await db
        .select({
          id: communityPosts.id,
          title: communityPosts.title,
          content: communityPosts.content,
          category: communityPosts.category,
          views: communityPosts.views,
          upvotes: communityPosts.upvotes,
          downvotes: communityPosts.downvotes,
          status: communityPosts.status,
          isPinned: communityPosts.isPinned,
          isHot: communityPosts.isHot,
          createdAt: communityPosts.createdAt,
          updatedAt: communityPosts.updatedAt,
          author: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
          },
        })
        .from(communityPosts)
        .leftJoin(users, eq(communityPosts.authorId, users.id))
        .where(eq(communityPosts.id, id))
        .limit(1);

      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      // Increment view count
      await db
        .update(communityPosts)
        .set({ views: db.sql`${communityPosts.views} + 1` })
        .where(eq(communityPosts.id, id));

      // Get comments for the post
      const comments = await db
        .select({
          id: communityComments.id,
          content: communityComments.content,
          parentCommentId: communityComments.parentCommentId,
          upvotes: communityComments.upvotes,
          downvotes: communityComments.downvotes,
          status: communityComments.status,
          createdAt: communityComments.createdAt,
          author: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
          },
        })
        .from(communityComments)
        .leftJoin(users, eq(communityComments.authorId, users.id))
        .where(eq(communityComments.postId, id))
        .orderBy(communityComments.createdAt);

      res.json({ 
        post: { ...post, views: post.views + 1 }, 
        comments 
      });
    } catch (error) {
      console.error('Failed to fetch post:', error);
      res.status(500).json({ error: 'Failed to fetch post' });
    }
  });

  // Create comment on a post
  app.post('/api/community/posts/:id/comments', isAuthenticated, async (req: any, res) => {
    try {
      const { id: postId } = req.params;
      const userId = req.user.claims.sub;
      
      const validatedData = insertCommunityCommentSchema.parse({
        ...req.body,
        postId,
        authorId: userId,
      });

      const [newComment] = await db
        .insert(communityComments)
        .values(validatedData)
        .returning();

      // Update user reputation for commenting
      await db
        .insert(userReputation)
        .values({
          userId: userId,
          commentsCount: 1,
          commentsScore: 5, // Base score for creating a comment
          totalReputation: 5,
        })
        .onConflictDoUpdate({
          target: userReputation.userId,
          set: {
            commentsCount: db.sql`${userReputation.commentsCount} + 1`,
            commentsScore: db.sql`${userReputation.commentsScore} + 5`,
            totalReputation: db.sql`${userReputation.totalReputation} + 5`,
            lastActiveAt: new Date(),
          },
        });

      res.status(201).json(newComment);
    } catch (error) {
      console.error('Failed to create comment:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create comment' });
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

  // Developer bypass endpoint for testing
  app.get("/api/developer/status", async (req, res) => {
    const devMode = isDeveloperMode(req);
    res.json({
      isDeveloper: devMode,
      environment: process.env.NODE_ENV,
      authenticated: req.isAuthenticated ? req.isAuthenticated() : false,
      userEmail: req.user?.claims?.email || null
    });
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

  // The Assistant - Conversational Car Search with GPT - with chat limits and auth
  app.post("/api/assistant/chat", async (req, res) => {
    try {
      // Chat limit enforcement - more restrictive than marketplace search
      const MAX_FREE_CHATS = 5;
      
      // Check if user is authenticated
      const isAuthenticated = req.isAuthenticated && req.isAuthenticated();
      
      if (!isAuthenticated) {
        // For unauthenticated users, enforce chat limits via session
        const session = req.session as any;
        if (!session.assistantChatCount) {
          session.assistantChatCount = 0;
        }
        
        if (session.assistantChatCount >= MAX_FREE_CHATS) {
          return res.status(401).json({ 
            error: "Chat limit reached. Please log in to continue.",
            code: "CHAT_LIMIT_REACHED",
            maxChats: MAX_FREE_CHATS,
            currentCount: session.assistantChatCount
          });
        }
        
        // Increment chat count for unauthenticated users
        session.assistantChatCount += 1;
      }

      const schema = z.object({
        message: z.string().min(1, "Message cannot be empty").max(500, "Message too long"),
        filters: z.object({}).optional(),
        context: z.string().optional().refine(val => !val || val.length <= 1000, "Context too long")
      });

      const { message, filters, context } = schema.parse(req.body);
      
      console.log('🤖 The Assistant query:', message);
      
      const assistantQuery: AssistantQuery = {
        message,
        filters: filters || {},
        context: context || 'New conversation'
      };

      const response = await assistantService.processQuery(assistantQuery);
      
      console.log('✅ The Assistant response:', response.action, '-', response.message.substring(0, 100) + '...');
      
      // Include chat limit info in response
      if (isDeveloperMode(req)) {
        res.json({
          success: true,
          ...response,
          chatInfo: {
            userTier: 'developer',
            chatsLeft: 9999,
            maxChats: 9999,
            isDeveloper: true
          }
        });
      } else if (isAuthenticated) {
        res.json({
          success: true,
          ...response,
          chatInfo: {
            userTier: 'premium',
            chatsLeft: 'unlimited',
            maxChats: 'unlimited',
            isAuthenticated: true
          }
        });
      } else {
        // Unauthenticated user - include chat count info
        const session = req.session as any;
        res.json({
          success: true,
          ...response,
          chatInfo: {
            userTier: 'free',
            chatsLeft: MAX_FREE_CHATS - (session.assistantChatCount || 0),
            maxChats: MAX_FREE_CHATS,
            currentCount: session.assistantChatCount || 0,
            isAuthenticated: false
          }
        });
      }
    } catch (error: any) {
      console.error('❌ The Assistant error:', error);
      
      // Determine appropriate error response based on error type
      let errorMessage = "I'm having trouble understanding your request. Could you try rephrasing it?";
      let statusCode = 500;
      
      if (error instanceof z.ZodError) {
        errorMessage = "Please provide a valid message to help you find a car.";
        statusCode = 400;
      } else if (error.message?.includes('timeout')) {
        errorMessage = "I'm taking longer than usual to respond. Please try again in a moment.";
        statusCode = 503;
      } else if (error.message?.includes('rate limit') || error.message?.includes('quota')) {
        errorMessage = "I'm currently busy helping other users. Please try again shortly.";
        statusCode = 429;
      }
      
      // Always include search info even in error responses (for authenticated users)
      let searchInfo = null;
      try {
        if (req.user && req.user.claims && req.user.claims.sub && !isDeveloperMode(req)) {
          const userId = req.user.claims.sub;
          const user = await storage.getUser(userId);
          const searchLimitInfo = await storage.checkUserSearchLimit(userId);
          searchInfo = {
            userTier: user?.subscriptionTier,
            searchesLeft: searchLimitInfo.searchesLeft,
            resetDate: searchLimitInfo.resetDate
          };
        } else if (isDeveloperMode(req)) {
          searchInfo = {
            userTier: 'developer',
            searchesLeft: 9999,
            resetDate: null,
            isDeveloper: true
          };
        }
      } catch (searchInfoError) {
        // Ignore search info errors in error responses
        console.warn('Failed to get search info in error response:', searchInfoError);
      }
      
      const errorResponse: any = { 
        error: errorMessage,
        success: false 
      };
      
      if (searchInfo) {
        errorResponse.searchInfo = searchInfo;
      }
      
      res.status(statusCode).json(errorResponse);
    }
  });

  // Advanced marketplace search across portals - with subscription limits
  app.post("/api/marketplace/search", checkSearchLimit, async (req, res) => {
    try {
      const searchStart = Date.now();
      
      // Check cache first for instant response
      const cachedResults = await cacheManager.search.getSearchResults(req.body);
      if (cachedResults) {
        console.log(`🚀 Cache hit! Returning results in ${Date.now() - searchStart}ms`);
        return res.json(cachedResults);
      }
      
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
      
      // Apply Hyderabad-specific optimizations
      const enhancedFilters = await enhanceHyderabadSearch(filters);
      if (enhancedFilters !== filters) {
        console.log('🏙️ Applied Hyderabad market intelligence');
      }

      // Try fast database search first
      console.log('⚡ Attempting fast database search...');
      const dbSearchFilters = {
        make: enhancedFilters.brand,
        model: enhancedFilters.model,
        city: enhancedFilters.city,
        fuelType: enhancedFilters.fuelType?.[0], // Take first fuel type if array
        transmission: enhancedFilters.transmission?.[0], // Take first transmission if array
        priceMin: enhancedFilters.priceMin,
        priceMax: enhancedFilters.priceMax,
        yearMin: enhancedFilters.yearMin,
        yearMax: enhancedFilters.yearMax,
        ownerCount: enhancedFilters.owners?.[0], // Take first owner count if array
        mileageMax: enhancedFilters.mileageMax,
        sortBy: enhancedFilters.sortBy || 'date',
        sortOrder: enhancedFilters.sortOrder || 'desc',
        limit: enhancedFilters.limit || 50,
        offset: 0
      };

      const fastSearchResult = await fastSearchService.search(dbSearchFilters);
      let searchResult;
      
      // If we have database results, use them for lightning-fast response
      if (fastSearchResult.listings.length > 0) {
        console.log(`🚀 Fast database search: ${fastSearchResult.listings.length} results in ${fastSearchResult.performance.queryTime}ms`);
        searchResult = {
          listings: fastSearchResult.listings.map((listing: any) => ({
            id: listing.id,
            title: listing.title,
            brand: listing.brand,
            model: listing.model,
            year: listing.year,
            price: parseInt(listing.price),
            mileage: listing.mileage,
            fuelType: listing.fuelType,
            transmission: listing.transmission,
            location: listing.location,
            city: listing.city,
            state: listing.state,
            images: listing.images || [],
            source: listing.portal,
            url: listing.url,
            condition: listing.condition,
            sellerType: listing.sellerType,
            verificationStatus: listing.verificationStatus,
            listingDate: listing.listingDate,
            owners: listing.owners
          })),
          total: fastSearchResult.total,
          performance: {
            queryTime: fastSearchResult.performance.queryTime,
            source: 'database'
          }
        };
      } else {
        console.log('⚠️ No database results, falling back to MarketplaceAggregator...');
        // Fallback to MarketplaceAggregator only if database is empty
        searchResult = await marketplaceAggregator.searchAcrossPortals(enhancedFilters as any);
      }
      
      // Cache the results for future requests
      await cacheManager.search.setSearchResults(req.body, searchResult);
      console.log(`💾 Cached search results (${Date.now() - searchStart}ms total)`);
      
      // Include search limit info in response (skip for developer mode)
      if (isDeveloperMode(req)) {
        res.json({
          ...searchResult,
          searchInfo: {
            userTier: 'developer',
            searchesLeft: 9999,
            resetDate: null,
            isDeveloper: true
          }
        });
      } else {
        const userId = req.user.claims.sub;
        const user = await storage.getUser(userId);
        const searchLimitInfo = await storage.checkUserSearchLimit(userId);
        
        res.json({
          ...searchResult,
          searchInfo: {
            userTier: user?.subscriptionTier,
            searchesLeft: searchLimitInfo.searchesLeft,
            resetDate: searchLimitInfo.resetDate
          }
        });
      }
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
  // Real database-backed messaging system
  
  // Create a new conversation or get existing one
  app.post("/api/conversations", async (req, res) => {
    try {
      const conversationData = insertConversationSchema.parse(req.body);
      
      // Check if conversation already exists
      const existing = await storage.getConversationByCarAndBuyer(
        conversationData.carId, 
        conversationData.buyerId
      );
      
      if (existing) {
        return res.json(existing);
      }
      
      // Create new conversation with privacy protection
      const conversation = await storage.createConversation({
        ...conversationData,
        buyerDisplayName: `Buyer ${conversationData.buyerId.slice(-4)}`,
        sellerDisplayName: `Seller ${conversationData.sellerId.slice(-4)}`
      });
      
      res.status(201).json(conversation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid conversation data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  // Get all conversations for a user
  app.get("/api/conversations", async (req, res) => {
    try {
      const { userId, userType } = req.query;
      
      if (!userId || !userType) {
        return res.status(400).json({ error: "Missing userId or userType" });
      }
      
      const conversations = await storage.getConversationsForUser(
        userId as string, 
        userType as 'buyer' | 'seller'
      );
      
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get messages in a conversation
  app.get("/api/conversations/:conversationId/messages", async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { userId } = req.query;
      
      if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
      }
      
      // Verify user has access to this conversation
      const conversation = await storage.getConversation(conversationId);
      if (!conversation || (conversation.buyerId !== userId && conversation.sellerId !== userId)) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const messages = await storage.getMessagesInConversation(conversationId);
      
      // Mark messages as read for this user
      await storage.markMessagesAsRead(conversationId, userId as string);
      
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Send a message in conversation
  app.post("/api/conversations/:conversationId/messages", async (req, res) => {
    try {
      const { conversationId } = req.params;
      const messageData = insertMessageSchema.parse({
        ...req.body,
        conversationId
      });
      
      // Verify user has access to this conversation
      const conversation = await storage.getConversation(conversationId);
      if (!conversation || (conversation.buyerId !== messageData.senderId && conversation.sellerId !== messageData.senderId)) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Determine sender type
      const senderType = conversation.buyerId === messageData.senderId ? 'buyer' : 'seller';
      
      const message = await storage.createMessage({
        ...messageData,
        senderType
      });
      
      // Update conversation last message time
      await storage.updateConversationLastMessage(conversationId);
      
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid message data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Make an offer on a car
  app.post("/api/conversations/:conversationId/offers", async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { senderId, offerAmount } = req.body;
      
      if (!senderId || !offerAmount) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      // Verify user has access to this conversation
      const conversation = await storage.getConversation(conversationId);
      if (!conversation || (conversation.buyerId !== senderId && conversation.sellerId !== senderId)) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const senderType = conversation.buyerId === senderId ? 'buyer' : 'seller';
      
      const offerMessage = await storage.createMessage({
        conversationId,
        senderId,
        senderType,
        content: `Offer: ₹${offerAmount.toLocaleString()}`,
        messageType: 'offer',
        offerAmount,
        offerStatus: 'pending'
      });
      
      await storage.updateConversationLastMessage(conversationId);
      
      res.status(201).json(offerMessage);
    } catch (error) {
      res.status(500).json({ error: "Failed to make offer" });
    }
  });

  // Respond to an offer
  app.patch("/api/messages/:messageId/offer", async (req, res) => {
    try {
      const { messageId } = req.params;
      const { userId, response } = req.body; // response: 'accepted', 'rejected', 'countered'
      
      if (!userId || !response) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      const updatedMessage = await storage.updateOfferStatus(messageId, response, userId);
      
      if (!updatedMessage) {
        return res.status(404).json({ error: "Offer not found or access denied" });
      }
      
      res.json(updatedMessage);
    } catch (error) {
      res.status(500).json({ error: "Failed to respond to offer" });
    }
  });

  // Request seller contact details (Premium feature)
  app.post("/api/conversations/:conversationId/request-contact", async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { userId } = req.body;
      
      // Verify user has access to this conversation
      const conversation = await storage.getConversation(conversationId);
      if (!conversation || conversation.buyerId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Check if user has premium access
      const user = await storage.getUser(userId);
      if (!user?.isPremium) {
        return res.status(402).json({ 
          error: "Premium subscription required",
          feature: "contact_sharing"
        });
      }
      
      // Get seller contact information (masked for privacy)
      const sellerInfo = await storage.getSellerContactInfo(conversation.sellerId);
      
      res.json({ 
        success: true, 
        contactShared: true,
        sellerInfo: {
          name: sellerInfo.buyerDisplayName,
          phone: sellerInfo.maskedPhone,
          email: sellerInfo.maskedEmail,
          note: "Contact via The Mobility Hub for privacy protection"
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to request contact details" });
    }
  });

  // Block a user from messaging
  app.post("/api/conversations/block", async (req, res) => {
    try {
      const blockData = insertConversationBlockSchema.parse(req.body);
      
      const block = await storage.createConversationBlock(blockData);
      
      res.status(201).json({ success: true, block });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid block data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to block user" });
    }
  });

  // Create marketplace contact request (used by contact-seller-modal)
  app.post("/api/marketplace/contact", async (req, res) => {
    try {
      const { name, phone, email, message, listingId, listingTitle } = req.body;
      
      if (!name || !phone || !listingId) {
        return res.status(400).json({ error: "Missing required fields: name, phone, listingId" });
      }

      // Create contact record for tracking
      const contact = await storage.createContact({
        name,
        phone,
        email: email || null,
        message: message || null,
        carId: listingId,
      });

      // In a real implementation, this would:
      // 1. Send SMS with OTP to phone number
      // 2. Store OTP temporarily for verification
      
      console.log(`📱 Contact request from ${name} (${phone}) for listing ${listingTitle}`);
      
      res.status(201).json({ 
        success: true,
        message: "Contact request received. OTP sent to phone number.",
        contactId: contact.id
      });
    } catch (error) {
      console.error("Contact request error:", error);
      res.status(500).json({ error: "Failed to process contact request" });
    }
  });

  // Verify contact OTP (used by contact-seller-modal)
  app.post("/api/marketplace/verify-contact", async (req, res) => {
    try {
      const { phone, otp, listingId } = req.body;
      
      if (!phone || !otp || !listingId) {
        return res.status(400).json({ error: "Missing required fields: phone, otp, listingId" });
      }

      // In a real implementation, this would verify the OTP
      // For demo purposes, accept any 6-digit OTP
      if (otp.length !== 6) {
        return res.status(400).json({ error: "Invalid OTP format" });
      }

      console.log(`✅ OTP verified for ${phone} - enabling messaging for listing ${listingId}`);
      
      res.json({ 
        success: true,
        verified: true,
        message: "Phone number verified successfully"
      });
    } catch (error) {
      console.error("OTP verification error:", error);
      res.status(500).json({ error: "Failed to verify OTP" });
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

  // Blog management endpoints
  const blogService = new (await import('./blogService')).default();

  // Public blog endpoints
  app.get("/api/blog/articles", async (req, res) => {
    try {
      const articles = blogService.getAllArticles().filter(article => 
        article.status === 'published' || article.status === 'shared'
      );
      res.json(articles);
    } catch (error) {
      console.error('Error fetching blog articles:', error);
      res.status(500).json({ error: 'Failed to fetch articles' });
    }
  });

  app.get("/api/blog/trending-topics", async (req, res) => {
    try {
      const topics = await blogService.getTrendingTopics();
      res.json(topics);
    } catch (error) {
      console.error('Error fetching trending topics:', error);
      res.status(500).json({ error: 'Failed to fetch trending topics' });
    }
  });

  app.post("/api/blog/generate", async (req, res) => {
    try {
      const { topic, category } = req.body;
      if (!topic) {
        return res.status(400).json({ error: 'Topic is required' });
      }
      
      const article = await blogService.generateArticle(topic, category);
      res.json(article);
    } catch (error) {
      console.error('Error generating article:', error);
      res.status(500).json({ error: 'Failed to generate article' });
    }
  });

  app.post("/api/blog/refresh", async (req, res) => {
    try {
      const newArticles = await blogService.refreshContent();
      res.json({ 
        success: true, 
        articlesGenerated: newArticles.length,
        articles: newArticles 
      });
    } catch (error) {
      console.error('Error refreshing content:', error);
      res.status(500).json({ error: 'Failed to refresh content' });
    }
  });

  // Admin blog endpoints
  app.get("/api/admin/blog/articles", async (req, res) => {
    try {
      const articles = blogService.getAllArticles();
      res.json(articles);
    } catch (error) {
      console.error('Error fetching admin articles:', error);
      res.status(500).json({ error: 'Failed to fetch articles' });
    }
  });

  app.get("/api/admin/blog/analytics", async (req, res) => {
    try {
      const analytics = blogService.getAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  });

  // New marketplace analytics endpoint for transparency
  app.get("/api/marketplace/status", async (req, res) => {
    try {
      const marketplaceAnalytics = {
        apiStatus: {
          firecrawl: {
            available: !!process.env.FIRECRAWL_API_KEY,
            status: "exhausted", // Based on 402 errors in logs
            error: "Insufficient credits - upgrade plan at https://firecrawl.dev/pricing"
          },
          gemini: {
            available: !!process.env.GEMINI_API_KEY,
            status: "rate_limited", // Based on occasional 503 errors
            error: "Model overloaded - intermittent availability"
          },
          perplexity: {
            available: !!process.env.PERPLEXITY_API_KEY,
            status: "active",
            error: null
          }
        },
        portals: {
          cardekho: { lastScrape: null, status: "api_limit", listings: 0 },
          olx: { lastScrape: null, status: "api_limit", listings: 0 },
          cars24: { lastScrape: null, status: "api_limit", listings: 0 },
          carwale: { lastScrape: null, status: "api_limit", listings: 0 },
          facebook: { lastScrape: null, status: "api_limit", listings: 0 }
        },
        dataQuality: {
          realListings: 0,
          aiGenerated: 100,
          fallbackUsed: true,
          lastRealData: null
        },
        recommendations: [
          "🔥 Upgrade Firecrawl plan for real portal scraping",
          "💰 Current plan: Free tier exhausted (402 errors)",
          "⏰ Implement caching to reduce API calls",
          "📊 Consider alternative data sources for authentic market data"
        ],
        lastUpdated: new Date().toISOString()
      };

      res.json(marketplaceAnalytics);
    } catch (error) {
      console.error('Error fetching marketplace status:', error);
      res.status(500).json({ error: 'Failed to fetch marketplace status' });
    }
  });

  // Affiliate tracking endpoints for loan partnerships
  app.get("/api/affiliate/redirect/:partnerId", (req, res) => {
    const { partnerId } = req.params;
    const { amount, tenure, lender } = req.query;
    
    // Track affiliate click for commission calculation
    console.log(`🔗 Affiliate click: ${partnerId}, Amount: ₹${amount}, Tenure: ${tenure} months, Lender: ${lender}`);
    
    // Redirect to appropriate partner based on partnerId
    const redirectUrls = {
      kuwy_partner: `https://www.kuwy.in/klass?ref=cararth&amount=${amount}&tenure=${tenure}`,
      dialabank_affiliate: `https://dialabank.com/car-loan/?ref=cararth&amount=${amount}&tenure=${tenure}`,
      sbi_partner: `https://www.sbi.co.in/web/personal-banking/loans/auto-loans/car-loan?ref=cararth`,
      hdfc_partner: `https://www.hdfcbank.com/personal/borrow/popular-loans/auto-loan?ref=cararth`
    };
    
    const redirectUrl = redirectUrls[partnerId as string] || 'https://www.kuwy.in/klass';
    res.redirect(redirectUrl);
  });

  app.post("/api/admin/blog/approve/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { approver } = req.body;
      
      const article = blogService.approveArticle(id, approver || 'Admin');
      if (!article) {
        return res.status(404).json({ error: 'Article not found' });
      }
      
      res.json(article);
    } catch (error) {
      console.error('Error approving article:', error);
      res.status(500).json({ error: 'Failed to approve article' });
    }
  });

  app.post("/api/admin/blog/publish/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      const article = blogService.publishArticle(id);
      if (!article) {
        return res.status(404).json({ error: 'Article not found or not approved' });
      }
      
      res.json(article);
    } catch (error) {
      console.error('Error publishing article:', error);
      res.status(500).json({ error: 'Failed to publish article' });
    }
  });

  app.post("/api/admin/blog/share/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      const article = await blogService.shareToSocialMedia(id);
      if (!article) {
        return res.status(404).json({ error: 'Article not found or not published' });
      }
      
      res.json(article);
    } catch (error) {
      console.error('Error sharing article:', error);
      res.status(500).json({ error: 'Failed to share article' });
    }
  });

  app.put("/api/admin/blog/update/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const article = blogService.updateArticle(id, updates);
      if (!article) {
        return res.status(404).json({ error: 'Article not found' });
      }
      
      res.json(article);
    } catch (error) {
      console.error('Error updating article:', error);
      res.status(500).json({ error: 'Failed to update article' });
    }
  });

  app.delete("/api/admin/blog/delete/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      const deleted = blogService.deleteArticle(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Article not found' });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting article:', error);
      res.status(500).json({ error: 'Failed to delete article' });
    }
  });

  // Dynamic placeholder image endpoints with automotive visuals
  app.get("/api/placeholder/:imageType", (req, res) => {
    const { imageType } = req.params;
    
    const imageConfigs = {
      'blog-image': {
        title: 'Automotive News',
        subtitle: '#cararth',
        icon: '🚗',
        gradient: ['#3b82f6', '#06b6d4'],
        bgColor: '#f1f5f9'
      },
      'buying-guide-image': {
        title: 'Car Buying Guide',
        subtitle: 'Expert Tips & Reviews',
        icon: '🔍',
        gradient: ['#10b981', '#06d6a0'],
        bgColor: '#ecfdf5'
      },
      'market-trend-image': {
        title: 'Market Insights',
        subtitle: 'Trends & Analysis',
        icon: '📊',
        gradient: ['#8b5cf6', '#a855f7'],
        bgColor: '#faf5ff'
      },
      'tech-image': {
        title: 'Auto Technology',
        subtitle: 'Innovation & Features',
        icon: '⚡',
        gradient: ['#f59e0b', '#f97316'],
        bgColor: '#fffbeb'
      },
      'policy-image': {
        title: 'Policy Updates',
        subtitle: 'Regulations & Laws',
        icon: '📋',
        gradient: ['#ef4444', '#dc2626'],
        bgColor: '#fef2f2'
      },
      'automotive-hero-image': {
        title: 'The Mobility Hub',
        subtitle: 'Your Journey. Simplified.',
        icon: '🏎️',
        gradient: ['#1e40af', '#3b82f6'],
        bgColor: '#eff6ff'
      }
    };
    
    const config = imageConfigs[imageType as keyof typeof imageConfigs] || imageConfigs['blog-image'];
    
    const svg = `
      <svg width="800" height="400" xmlns="http://www.w3.org/2000/svg">
        <!-- Animated background -->
        <defs>
          <linearGradient id="mainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${config.gradient[0]};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${config.gradient[1]};stop-opacity:1" />
          </linearGradient>
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${config.bgColor};stop-opacity:1" />
            <stop offset="100%" style="stop-color:#ffffff;stop-opacity:0.9" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/> 
            </feMerge>
          </filter>
        </defs>
        
        <!-- Background -->
        <rect width="800" height="400" fill="url(#bgGradient)"/>
        
        <!-- Animated geometric shapes -->
        <circle cx="150" cy="100" r="40" fill="url(#mainGradient)" opacity="0.1">
          <animateTransform attributeName="transform" attributeType="XML" type="rotate"
                          from="0 150 100" to="360 150 100" dur="20s" repeatCount="indefinite"/>
        </circle>
        <circle cx="650" cy="320" r="30" fill="url(#mainGradient)" opacity="0.15">
          <animateTransform attributeName="transform" attributeType="XML" type="rotate"
                          from="360 650 320" to="0 650 320" dur="15s" repeatCount="indefinite"/>
        </circle>
        
        <!-- Car silhouette animation -->
        <g transform="translate(50,300)" opacity="0.1">
          <path d="M0,20 Q20,0 60,5 L120,5 Q140,0 160,20 L160,40 Q140,50 120,45 L60,45 Q20,50 0,40 Z" 
                fill="url(#mainGradient)">
            <animateTransform attributeName="transform" attributeType="XML" type="translate"
                            values="0,0; 20,0; 0,0" dur="8s" repeatCount="indefinite"/>
          </path>
        </g>
        
        <!-- Central content -->
        <g transform="translate(400,200)">
          <rect x="-120" y="-60" width="240" height="120" fill="white" opacity="0.9" rx="12" 
                filter="url(#glow)"/>
          
          <!-- Icon with pulse animation -->
          <text x="0" y="-20" text-anchor="middle" font-size="32" fill="url(#mainGradient)">
            ${config.icon}
            <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite"/>
          </text>
          
          <text x="0" y="10" text-anchor="middle" font-family="Inter, sans-serif" 
                font-size="22" fill="#1f2937" font-weight="700">${config.title}</text>
          <text x="0" y="35" text-anchor="middle" font-family="Inter, sans-serif" 
                font-size="14" fill="#6b7280" font-weight="500">${config.subtitle}</text>
        </g>
        
        <!-- Decorative elements -->
        <path d="M0,200 Q200,180 400,200 T800,200" stroke="url(#mainGradient)" 
              stroke-width="2" fill="none" opacity="0.3">
          <animate attributeName="d" 
                   values="M0,200 Q200,180 400,200 T800,200;M0,200 Q200,220 400,200 T800,200;M0,200 Q200,180 400,200 T800,200" 
                   dur="6s" repeatCount="indefinite"/>
        </path>
      </svg>
    `;
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour cache
    res.send(svg);
  });

  // Seller service endpoints
  const sellerService = new (await import('./sellerService')).SellerService();
  const objectStorageService = new (await import('./objectStorage')).ObjectStorageService();

  // Create new seller listing
  app.post("/api/seller/listings", async (req, res) => {
    try {
      const listingData = req.body;
      const listing = await sellerService.createListing("temp-seller", listingData);
      res.status(201).json(listing);
    } catch (error) {
      console.error('Error creating seller listing:', error);
      res.status(500).json({ error: "Failed to create listing" });
    }
  });

  // Get upload URL for seller documents/photos
  app.get("/api/seller/upload-url", async (req, res) => {
    try {
      const category = req.query.category as string;
      if (!category) {
        return res.status(400).json({ error: "Category is required" });
      }
      
      const uploadURL = await sellerService.getUploadURL(category);
      res.json(uploadURL);
    } catch (error) {
      console.error('Error getting upload URL:', error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Update listing with uploaded files
  app.patch("/api/seller/listings/:id/files", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const listing = await sellerService.updateListingFiles(id, updates);
      res.json(listing);
    } catch (error) {
      console.error('Error updating listing files:', error);
      res.status(500).json({ error: "Failed to update listing files" });
    }
  });

  // Generate AI content for listing
  app.post("/api/seller/listings/:id/generate-content", async (req, res) => {
    try {
      const { id } = req.params;
      const content = await sellerService.generateListingContent(id);
      res.json(content);
    } catch (error) {
      console.error('Error generating listing content:', error);
      res.status(500).json({ error: "Failed to generate content" });
    }
  });

  // Post listing to multiple platforms
  app.post("/api/seller/listings/:id/post-platforms", async (req, res) => {
    try {
      const { id } = req.params;
      const results = await sellerService.postToMultiplePlatforms(id);
      res.json(results);
    } catch (error) {
      console.error('Error posting to platforms:', error);
      res.status(500).json({ error: "Failed to post to platforms" });
    }
  });

  // Get seller listings
  app.get("/api/seller/listings", async (req, res) => {
    try {
      const sellerId = req.query.sellerId as string || "temp-seller";
      const listings = await sellerService.getSellerListings(sellerId);
      res.json(listings);
    } catch (error) {
      console.error('Error fetching seller listings:', error);
      res.status(500).json({ error: "Failed to fetch listings" });
    }
  });

  // Handle masked contact inquiries
  app.post("/api/seller/inquiries/:maskedContactId", async (req, res) => {
    try {
      const { maskedContactId } = req.params;
      const inquiryData = req.body;
      
      const result = await sellerService.routeInquiry(maskedContactId, inquiryData);
      res.json(result);
    } catch (error) {
      console.error('Error routing inquiry:', error);
      res.status(500).json({ error: "Failed to route inquiry" });
    }
  });

  // Serve private object files
  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error accessing object:", error);
      return res.sendStatus(404);
    }
  });

  // Serve public object files  
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    try {
      const filePath = req.params.filePath;
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Automotive News and Market Intelligence API
  app.get("/api/news/automotive", async (req, res) => {
    try {
      console.log('📰 Fetching latest automotive news and market intelligence...');
      const news = await automotiveNewsService.getLatestAutomotiveNews();
      
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        articles: news,
        meta: {
          count: news.length,
          source: 'Perplexity Market Intelligence',
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('❌ News service error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch automotive news',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Market insights for specific locations
  app.get("/api/news/market-insights", async (req, res) => {
    try {
      const { location } = req.query;
      console.log(`🔍 Fetching market insights for ${location || 'India'}...`);
      
      const insights = await automotiveNewsService.getMarketInsights(location as string);
      
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        insights,
        location: location || 'India',
        meta: {
          count: insights.length,
          source: 'Perplexity Market Intelligence',
          analysisDepth: 'comprehensive'
        }
      });
    } catch (error) {
      console.error('❌ Market insights error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch market insights',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Brand-specific market insights
  app.get("/api/news/brand-insights/:brand", async (req, res) => {
    try {
      const { brand } = req.params;
      console.log(`🏷️ Fetching ${brand} brand insights...`);
      
      const insights = await automotiveNewsService.getBrandInsights(brand);
      
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        brand,
        insights,
        meta: {
          count: insights.length,
          source: 'Perplexity Market Intelligence',
          analysisType: 'brand-specific'
        }
      });
    } catch (error) {
      console.error(`❌ ${req.params.brand} insights error:`, error);
      res.status(500).json({ 
        error: `Failed to fetch ${req.params.brand} insights`,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // SEO-friendly community routes for backlinks
  app.get("/community/guidelines", (req, res) => {
    res.redirect('/community?tab=resources');
  });

  app.get("/community/events", (req, res) => {
    res.redirect('/community?tab=events');
  });

  app.get("/community/members", (req, res) => {
    res.redirect('/community');
  });

  app.get("/community/:brand", (req, res) => {
    const { brand } = req.params;
    res.redirect(`/?brand=${brand}`);
  });

  app.get("/guides/:type", (req, res) => {
    const { type } = req.params;
    if (type === 'buying') {
      res.redirect('/news?category=market');
    } else if (type === 'maintenance') {
      res.redirect('/news?category=technology');
    } else if (type === 'finance') {
      res.redirect('/finance');
    } else {
      res.redirect('/news');
    }
  });

  // Sitemap for SEO
  app.get("/sitemap.xml", (req, res) => {
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url><loc>${req.protocol}://${req.get('host')}/</loc><priority>1.0</priority></url>
      <url><loc>${req.protocol}://${req.get('host')}/community</loc><priority>0.9</priority></url>
      <url><loc>${req.protocol}://${req.get('host')}/news</loc><priority>0.9</priority></url>
      <url><loc>${req.protocol}://${req.get('host')}/sell</loc><priority>0.8</priority></url>
      <url><loc>${req.protocol}://${req.get('host')}/finance</loc><priority>0.7</priority></url>
      <url><loc>${req.protocol}://${req.get('host')}/community/maruti</loc><priority>0.6</priority></url>
      <url><loc>${req.protocol}://${req.get('host')}/community/hyundai</loc><priority>0.6</priority></url>
      <url><loc>${req.protocol}://${req.get('host')}/community/tata</loc><priority>0.6</priority></url>
    </urlset>`;
    
    res.set('Content-Type', 'text/xml');
    res.send(sitemap);
  });

  // Community & RSS Integration Routes
  app.get('/api/community/posts', async (req, res) => {
    try {
      const { rssAggregator } = await import('./rssService');
      const posts = await rssAggregator.aggregateAutomotiveContent();
      
      res.json({
        success: true,
        posts,
        timestamp: new Date().toISOString(),
        attribution: 'Content aggregated from various automotive sources with proper attribution'
      });
    } catch (error) {
      console.error('Community posts error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch community content',
        timestamp: new Date().toISOString()
      });
    }
  });

  app.get('/api/community/stats', async (req, res) => {
    try {
      const { rssAggregator } = await import('./rssService');
      const stats = await rssAggregator.getCommunityStats();
      
      res.json({
        success: true,
        stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Community stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch community statistics',
        timestamp: new Date().toISOString()
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
