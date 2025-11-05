import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table with OAuth and local auth support
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  name: text("name").notNull(),
  password: text("password").notNull(), // Hashed password for local authentication
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  phoneVerified: boolean("phone_verified").default(false),
  phoneVerifiedAt: timestamp("phone_verified_at"),
  
  // Email verification for seller MVP
  emailVerified: boolean("email_verified").default(false),
  verificationToken: varchar("verification_token"),
  verificationTokenExpiresAt: timestamp("verification_token_expires_at"),
  
  // Seller type classification for posting limits
  sellerType: text("seller_type").default('private'), // 'private' | 'dealer'
  
  // Legal compliance for syndication
  consentSyndication: boolean("consent_syndication").default(false),
  consentTimestamp: timestamp("consent_timestamp"),
  legalAgreementVersion: varchar("legal_agreement_version"),
  legalAgreementAcceptedAt: timestamp("legal_agreement_accepted_at"),
  
  // Subscription management
  subscriptionTier: text("subscription_tier").default('free'), // free, pro_seller, pro_buyer, superhero
  subscriptionStatus: text("subscription_status").default('active'), // active, expired, cancelled
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  
  // Search usage tracking for free tier
  searchCount: integer("search_count").default(0),
  searchCountResetAt: timestamp("search_count_reset_at").defaultNow(),
  
  // Admin role system
  role: text("role").default('user'), // 'user' | 'admin' | 'partner'
  
  // Legacy fields for compatibility
  isPremium: boolean("is_premium").default(false),
  premiumExpiresAt: timestamp("premium_expires_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const cars = pgTable("cars", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sellerId: varchar("seller_id").notNull(),
  title: text("title").notNull(),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  mileage: integer("mileage").notNull(), // in km
  fuelType: text("fuel_type").notNull(), // Petrol, Diesel, CNG, Electric
  transmission: text("transmission").notNull(), // Manual, Automatic, CVT
  owners: integer("owners").notNull().default(1),
  location: text("location").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  description: text("description"),
  features: text("features").array().default([]),
  images: text("images").array().default([]),
  source: text("source"), // Legal data source: Google Places, GMB Dealer, etc.
  listingSource: text("listing_source").notNull().default('user_direct'), // 'ethical_ai' | 'exclusive_dealer' | 'user_direct'
  isVerified: boolean("is_verified").default(false),
  isSold: boolean("is_sold").default(false),
  isFeatured: boolean("is_featured").default(false),
  featuredExpiresAt: timestamp("featured_expires_at"),
  
  // Holistic Listing Ranking Framework fields
  listingScore: decimal("listing_score", { precision: 5, scale: 2 }).default('0'), // Overall trust score 0-100
  scoreBreakdown: jsonb("score_breakdown").default({}), // {price, recency, demand, completeness, imageQuality, sellerTrust}
  demandIndex: decimal("demand_index", { precision: 3, scale: 2 }).default('0.5'), // Market demand 0-1
  avgSellingPrice: decimal("avg_selling_price", { precision: 10, scale: 2 }), // Average market price for this model
  completeness: decimal("completeness", { precision: 3, scale: 2 }).default('0'), // Completeness score 0-1
  imageQualityAvg: decimal("image_quality_avg", { precision: 3, scale: 2 }).default('0'), // Average image quality 0-1
  googleComplianceScore: decimal("google_compliance_score", { precision: 3, scale: 0 }).default('0'), // Google Vehicle Listings compliance 0-100
  priceFairnessLabel: text("price_fairness_label"), // e.g. "2% below market" or "At market price"
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Anonymous visitor search tracking for 30-day rolling window
export const anonymousSearchActivity = pgTable(
  "anonymous_search_activity",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    visitorId: varchar("visitor_id").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    ipHash: varchar("ip_hash"),
    userAgent: text("user_agent"),
  },
  (table) => [
    index("idx_visitor_activity").on(table.visitorId, table.createdAt),
  ],
);

export const contacts = pgTable("contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  carId: varchar("car_id").notNull(),
  sellerId: varchar("seller_id"), // Link to seller user for notification
  buyerName: text("buyer_name").notNull(),
  buyerPhone: text("buyer_phone").notNull(),
  buyerPhoneNormalized: text("buyer_phone_normalized"), // E.164 format
  buyerEmail: text("buyer_email").notNull(),
  message: text("message"),
  
  // Seller notification tracking
  sellerNotifiedAt: timestamp("seller_notified_at"),
  sellerNotificationMethod: text("seller_notification_method"), // 'email' | 'sms' | 'both' | 'none'
  sellerNotificationStatus: text("seller_notification_status").default('pending'), // 'pending' | 'sent' | 'failed' | 'delivered'
  sellerNotificationError: text("seller_notification_error"), // Store error details if failed
  notificationRetryCount: integer("notification_retry_count").default(0),
  lastNotificationAttempt: timestamp("last_notification_attempt"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Seller leads from landing page campaign
export const sellerLeads = pgTable("seller_leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  sellerType: text("seller_type").notNull(), // 'individual' | 'dealer'
  message: text("message"),
  status: text("status").default('new'), // 'new' | 'contacted' | 'converted' | 'rejected'
  contactedAt: timestamp("contacted_at"),
  convertedAt: timestamp("converted_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const upsertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export const insertCarSchema = createInsertSchema(cars).omit({
  id: true,
  createdAt: true,
  isVerified: true,
  isSold: true,
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
});

export const insertSellerLeadSchema = createInsertSchema(sellerLeads).omit({
  id: true,
  createdAt: true,
  status: true,
  contactedAt: true,
  convertedAt: true,
  notes: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertCar = z.infer<typeof insertCarSchema>;

// Normalized seller information for both internal users and external portal listings
export const sellerInfoSchema = z.discriminatedUnion('kind', [
  // Internal users with masked contact details
  z.object({
    kind: z.literal('internal'),
    sellerType: z.string(),
    name: z.string(),
    phoneMasked: z.string().optional(),
    emailMasked: z.string().optional(),
    profileImageUrl: z.string().optional(),
    badges: z.array(z.string()).optional(),
    verified: z.boolean().optional()
  }),
  // External portal listings with redirect info
  z.object({
    kind: z.literal('external'),
    sellerType: z.string(),
    portal: z.string(),
    redirectUrl: z.string(),
    note: z.string().optional()
  })
]);

export type SellerInfo = z.infer<typeof sellerInfoSchema>;
export type Car = typeof cars.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;
export type InsertSellerLead = z.infer<typeof insertSellerLeadSchema>;
export type SellerLead = typeof sellerLeads.$inferSelect;

// Premium subscriptions table
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  tier: text("tier").notNull(), // pro_seller, pro_buyer, superhero
  status: text("status").notNull(), // active, expired, cancelled, pending
  
  // Pricing
  amount: decimal("amount", { precision: 8, scale: 2 }).notNull(),
  currency: text("currency").default('INR'),
  billingCycle: text("billing_cycle").notNull(), // monthly, yearly
  
  // Dates
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date").notNull(),
  nextBillingDate: timestamp("next_billing_date"),
  
  // Payment integration
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripeCustomerId: text("stripe_customer_id"),
  
  // Superhero location restriction
  locationRestriction: text("location_restriction"), // City name for superhero tier
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Featured listings table
export const featuredListings = pgTable("featured_listings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  carId: varchar("car_id").notNull(),
  sellerId: varchar("seller_id").notNull(),
  amount: decimal("amount", { precision: 8, scale: 2 }).notNull(),
  duration: integer("duration").notNull(), // days
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// User search activity tracking
export const userSearchActivity = pgTable("user_search_activity", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  searchType: text("search_type").notNull(), // marketplace_search, car_detail_view, filter_search
  searchFilters: jsonb("search_filters"), // Store search parameters as JSON
  resultsCount: integer("results_count").default(0),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Phone verification table
export const phoneVerifications = pgTable("phone_verifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  phoneNumber: text("phone_number").notNull(),
  verificationCode: text("verification_code").notNull(),
  verified: boolean("verified").default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFeaturedListingSchema = createInsertSchema(featuredListings).omit({
  id: true,
  createdAt: true,
});

export const insertUserSearchActivitySchema = createInsertSchema(userSearchActivity).omit({
  id: true,
  createdAt: true,
});

export const insertPhoneVerificationSchema = createInsertSchema(phoneVerifications).omit({
  id: true,
  createdAt: true,
});

export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertUserSearchActivity = z.infer<typeof insertUserSearchActivitySchema>;
export type UserSearchActivity = typeof userSearchActivity.$inferSelect;
export type InsertPhoneVerification = z.infer<typeof insertPhoneVerificationSchema>;
export type PhoneVerification = typeof phoneVerifications.$inferSelect;

// Claude AI Analysis Tables for CarArth Intelligence Platform

// Listing Classification & Fairness Analysis Results
export const listingClassifications = pgTable("listing_classifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listingId: varchar("listing_id").notNull(), // References external listing ID
  source: text("source").notNull(), // Source marketplace (CarDekho, OLX, etc.)
  
  // Classification Scores (0-100)
  accuracyScore: integer("accuracy_score").notNull(),
  completenessScore: integer("completeness_score").notNull(),
  fairnessScore: integer("fairness_score").notNull(),
  
  // Overall Classification
  overallClassification: text("overall_classification").notNull(), // excellent, good, fair, poor, rejected
  
  // Analysis Results
  issues: text("issues").array().default([]),
  recommendations: text("recommendations").array().default([]),
  confidence: decimal("confidence", { precision: 3, scale: 2 }).notNull(), // 0.00-1.00
  
  // Metadata
  analysisTimestamp: timestamp("analysis_timestamp").defaultNow(),
  modelVersion: text("model_version").default('claude-sonnet-4-20250514'),
  processingTimeMs: integer("processing_time_ms"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Quality Analysis Results
export const qualityAnalyses = pgTable("quality_analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listingId: varchar("listing_id").notNull(),
  source: text("source").notNull(),
  
  // Quality Scores (0-100)
  authenticityScore: integer("authenticity_score").notNull(),
  informationQuality: integer("information_quality").notNull(),
  imageQuality: integer("image_quality").notNull(),
  priceReasonableness: integer("price_reasonableness").notNull(),
  overallQuality: integer("overall_quality").notNull(),
  
  // Quality Flags and Recommendations
  qualityFlags: text("quality_flags").array().default([]),
  verificationRecommendations: text("verification_recommendations").array().default([]),
  confidence: decimal("confidence", { precision: 3, scale: 2 }).notNull(),
  
  // Metadata
  analysisTimestamp: timestamp("analysis_timestamp").defaultNow(),
  modelVersion: text("model_version").default('claude-sonnet-4-20250514'),
  processingTimeMs: integer("processing_time_ms"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Content Moderation Results
export const contentModerations = pgTable("content_moderations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contentId: varchar("content_id").notNull(), // References listing, comment, review, etc.
  contentType: text("content_type").notNull(), // listing, comment, review, message
  userId: varchar("user_id"), // Optional user who created content
  
  // Moderation Results
  isCompliant: boolean("is_compliant").notNull(),
  violationTypes: text("violation_types").array().default([]),
  severity: text("severity").notNull(), // low, medium, high, critical
  moderationActions: text("moderation_actions").array().default([]),
  explanation: text("explanation"),
  confidence: decimal("confidence", { precision: 3, scale: 2 }).notNull(),
  
  // Review Status
  humanReviewRequired: boolean("human_review_required").default(false),
  humanReviewedAt: timestamp("human_reviewed_at"),
  humanReviewedBy: varchar("human_reviewed_by"),
  finalDecision: text("final_decision"), // approved, rejected, modified
  
  // Metadata
  analysisTimestamp: timestamp("analysis_timestamp").defaultNow(),
  modelVersion: text("model_version").default('claude-sonnet-4-20250514'),
  processingTimeMs: integer("processing_time_ms"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// User Search Intent & Behavior Tracking
export const userSearchIntents = pgTable("user_search_intents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"), // Optional for anonymous users
  sessionId: varchar("session_id").notNull(), // Track search sessions
  
  // Search Context
  searchFilters: jsonb("search_filters").notNull(), // DetailedFilters as JSON
  searchQuery: text("search_query"), // Natural language query if any
  
  // Inferred Intent
  budgetMin: integer("budget_min"),
  budgetMax: integer("budget_max"),
  urgencyLevel: text("urgency_level"), // low, medium, high
  behaviorPattern: text("behavior_pattern"), // browsing, comparing, ready_to_buy
  
  // Preference Scores (0-100)
  brandImportance: integer("brand_importance").default(50),
  priceImportance: integer("price_importance").default(70),
  mileageImportance: integer("mileage_importance").default(60),
  yearImportance: integer("year_importance").default(50),
  locationImportance: integer("location_importance").default(60),
  
  // Search Results & Interaction
  resultsCount: integer("results_count"),
  clickedListings: text("clicked_listings").array().default([]),
  timeOnResults: integer("time_on_results_seconds"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// AI Analysis Performance Metrics
export const aiAnalysisMetrics = pgTable("ai_analysis_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Service Metrics
  serviceName: text("service_name").notNull(), // claude, gemini, perplexity
  operationType: text("operation_type").notNull(), // classification, quality, ranking, moderation
  
  // Performance Data
  totalCalls: integer("total_calls").default(0),
  successfulCalls: integer("successful_calls").default(0),
  failedCalls: integer("failed_calls").default(0),
  averageProcessingTime: decimal("average_processing_time", { precision: 8, scale: 2 }),
  averageConfidence: decimal("average_confidence", { precision: 3, scale: 2 }),
  
  // Cost Tracking
  totalTokensUsed: integer("total_tokens_used").default(0),
  estimatedCostUsd: decimal("estimated_cost_usd", { precision: 10, scale: 4 }),
  
  // Time Window
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert Schemas for Claude AI Tables
export const insertListingClassificationSchema = createInsertSchema(listingClassifications).omit({
  id: true,
  createdAt: true,
});

export const insertQualityAnalysisSchema = createInsertSchema(qualityAnalyses).omit({
  id: true,
  createdAt: true,
});

export const insertContentModerationSchema = createInsertSchema(contentModerations).omit({
  id: true,
  createdAt: true,
});

export const insertUserSearchIntentSchema = createInsertSchema(userSearchIntents).omit({
  id: true,
  createdAt: true,
});

export const insertAiAnalysisMetricsSchema = createInsertSchema(aiAnalysisMetrics).omit({
  id: true,
  createdAt: true,
});

// Type Exports for Claude AI Services
export type ListingClassification = typeof listingClassifications.$inferSelect;
export type QualityAnalysis = typeof qualityAnalyses.$inferSelect;
export type ContentModeration = typeof contentModerations.$inferSelect;
export type UserSearchIntent = typeof userSearchIntents.$inferSelect;
export type AiAnalysisMetrics = typeof aiAnalysisMetrics.$inferSelect;

export type InsertListingClassification = z.infer<typeof insertListingClassificationSchema>;
export type InsertQualityAnalysis = z.infer<typeof insertQualityAnalysisSchema>;
export type InsertContentModeration = z.infer<typeof insertContentModerationSchema>;
export type InsertUserSearchIntent = z.infer<typeof insertUserSearchIntentSchema>;
export type InsertAiAnalysisMetrics = z.infer<typeof insertAiAnalysisMetricsSchema>;
export type InsertFeaturedListing = z.infer<typeof insertFeaturedListingSchema>;
export type FeaturedListing = typeof featuredListings.$inferSelect;


// Seller listings with comprehensive data
export const sellerListings = pgTable("seller_listings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sellerId: varchar("seller_id").notNull(),
  
  // Basic car information
  title: text("title").notNull(),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  mileage: integer("mileage").notNull(),
  fuelType: text("fuel_type").notNull(),
  transmission: text("transmission").notNull(),
  owners: integer("owners").notNull().default(1),
  location: text("location").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  description: text("description"),
  features: text("features").array().default([]),
  
  // Document uploads
  rcBookDocument: text("rc_book_document"), // Object storage path
  insuranceDocument: text("insurance_document"), // Object storage path
  
  // Required photos in fixed format
  frontPhoto: text("front_photo"), // Object storage path
  rearPhoto: text("rear_photo"), // Object storage path
  leftSidePhoto: text("left_side_photo"), // Object storage path
  rightSidePhoto: text("right_side_photo"), // Object storage path
  interiorPhoto: text("interior_photo"), // Object storage path - must show odometer
  engineBayPhoto: text("engine_bay_photo"), // Object storage path
  additionalPhotos: text("additional_photos").array().default([]),
  
  // Contact masking
  maskedContactId: varchar("masked_contact_id").default(sql`gen_random_uuid()`), // Public contact ID
  actualPhone: text("actual_phone").notNull(),
  actualEmail: text("actual_email").notNull(),
  
  // Multi-platform posting
  postedToCars24: boolean("posted_to_cars24").default(false),
  cars24ListingId: text("cars24_listing_id"),
  postedToCarDekho: boolean("posted_to_cardekho").default(false),
  carDekhoListingId: text("cardekho_listing_id"),
  postedToFacebookMarketplace: boolean("posted_to_facebook_marketplace").default(false),
  facebookMarketplaceListingId: text("facebook_marketplace_listing_id"),
  
  // AI-generated listing content
  aiGeneratedTitle: text("ai_generated_title"),
  aiGeneratedDescription: text("ai_generated_description"),
  marketValueEstimate: decimal("market_value_estimate", { precision: 10, scale: 2 }),
  
  // Status tracking
  documentVerificationStatus: text("document_verification_status").default('pending'), // pending, approved, rejected
  photoVerificationStatus: text("photo_verification_status").default('pending'),
  listingStatus: text("listing_status").default('draft'), // draft, active, sold, expired
  
  // Performance tracking
  viewCount: integer("view_count").default(0),
  inquiryCount: integer("inquiry_count").default(0),
  
  // Admin override for posting limits
  adminOverride: boolean("admin_override").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Seller inquiries with masked contact routing
export const sellerInquiries = pgTable("seller_inquiries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listingId: varchar("listing_id").notNull(),
  maskedContactId: varchar("masked_contact_id").notNull(), // Routes through platform
  
  // Buyer information
  buyerName: text("buyer_name").notNull(),
  buyerPhone: text("buyer_phone").notNull(),
  buyerEmail: text("buyer_email").notNull(),
  message: text("message"),
  
  // Platform routing
  source: text("source").notNull(), // cararth, cars24, cardekho, facebook
  isRouted: boolean("is_routed").default(false), // Whether forwarded to seller
  routedAt: timestamp("routed_at"),
  
  // Response tracking
  sellerResponded: boolean("seller_responded").default(false),
  respondedAt: timestamp("responded_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Platform posting logs
export const platformPostingLogs = pgTable("platform_posting_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listingId: varchar("listing_id").notNull(),
  platform: text("platform").notNull(), // cars24, cardekho, facebook_marketplace
  
  postingStatus: text("posting_status").notNull(), // success, failed, pending
  platformListingId: text("platform_listing_id"),
  errorMessage: text("error_message"),
  
  postedAt: timestamp("posted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSellerListingSchema = createInsertSchema(sellerListings).omit({
  id: true,
  maskedContactId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSellerInquirySchema = createInsertSchema(sellerInquiries).omit({
  id: true,
  createdAt: true,
});

export const insertPlatformPostingLogSchema = createInsertSchema(platformPostingLogs).omit({
  id: true,
  createdAt: true,
});

// Image Assets with Provenance Tracking - PERMANENT FIX for image authenticity
export const imageAssets = pgTable("image_assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Provenance Chain - Complete traceability from source to storage
  listingId: varchar("listing_id").notNull(), // Reference to cached_portal_listings
  portal: text("portal").notNull(), // Source portal (cardekho.com, cars24.com, etc.)
  pageUrl: text("page_url").notNull(), // Original listing detail page URL
  selector: text("selector"), // DOM selector/XPath used to extract image
  originalUrl: text("original_url").notNull(), // Original image URL from portal
  
  // Storage and Content
  storageKey: text("storage_key"), // Object storage path after download
  width: integer("width"), // Image dimensions for validation
  height: integer("height"),
  fileSizeBytes: integer("file_size_bytes"),
  contentType: text("content_type"), // image/jpeg, image/png, etc.
  
  // Content Integrity
  sha256Hash: text("sha256_hash").notNull(), // Content hash for exact deduplication
  perceptualHash: text("perceptual_hash"), // pHash for visual similarity detection
  
  // Authenticity Validation
  authenticityScore: integer("authenticity_score").notNull().default(0), // 0-100 quality score
  passedGate: boolean("passed_gate").notNull().default(false), // TRUE = verified authentic
  rejectionReasons: text("rejection_reasons").array().default([]), // Why it failed gate
  
  // Metadata
  extractedAt: timestamp("extracted_at").defaultNow(), // When image was first found
  validatedAt: timestamp("validated_at"), // When authenticity gate was run
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_image_assets_listing").on(table.listingId),
  index("idx_image_assets_sha256").on(table.sha256Hash),
  index("idx_image_assets_passed_gate").on(table.passedGate),
]);



export type InsertSellerListing = z.infer<typeof insertSellerListingSchema>;
export type SellerListing = typeof sellerListings.$inferSelect;
export type InsertSellerInquiry = z.infer<typeof insertSellerInquirySchema>;
export type SellerInquiry = typeof sellerInquiries.$inferSelect;
export type InsertPlatformPostingLog = z.infer<typeof insertPlatformPostingLogSchema>;
export type PlatformPostingLog = typeof platformPostingLogs.$inferSelect;

// Conversations for two-way messaging between buyers and sellers
export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  carId: varchar("car_id").notNull(), // The car listing being discussed
  buyerId: varchar("buyer_id").notNull(), // User who initiated conversation
  sellerId: varchar("seller_id").notNull(), // Car owner
  
  // Conversation metadata
  subject: text("subject"), // Usually the car title
  status: text("status").default('active'), // active, closed, archived
  
  // Privacy protection
  buyerDisplayName: text("buyer_display_name").notNull(), // Masked name for privacy
  sellerDisplayName: text("seller_display_name").notNull(), // Masked name for privacy
  
  // Tracking
  lastMessageAt: timestamp("last_message_at"),
  isRead: boolean("is_read").default(false), // Has seller read latest buyer message
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Individual messages within conversations
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull(),
  senderId: varchar("sender_id").notNull(), // User ID of message sender
  senderType: text("sender_type").notNull(), // 'buyer' or 'seller'
  
  // Message content
  content: text("content").notNull(),
  messageType: text("message_type").default('text'), // text, system, offer
  
  // For offer messages
  offerAmount: decimal("offer_amount", { precision: 10, scale: 2 }),
  offerStatus: text("offer_status"), // pending, accepted, rejected, countered
  
  // Privacy & Security
  isSystemMessage: boolean("is_system_message").default(false),
  isModerated: boolean("is_moderated").default(false),
  moderationStatus: text("moderation_status").default('approved'), // approved, flagged, removed
  
  // Tracking
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Message reactions and interactions
export const messageInteractions = pgTable("message_interactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: varchar("message_id").notNull(),
  userId: varchar("user_id").notNull(),
  
  interactionType: text("interaction_type").notNull(), // like, report, bookmark
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Blocked users and conversation management
export const conversationBlocks = pgTable("conversation_blocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  blockerId: varchar("blocker_id").notNull(), // User who blocked
  blockedId: varchar("blocked_id").notNull(), // User who was blocked
  reason: text("reason"), // spam, inappropriate, etc.
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertMessageInteractionSchema = createInsertSchema(messageInteractions).omit({
  id: true,
  createdAt: true,
});

export const insertConversationBlockSchema = createInsertSchema(conversationBlocks).omit({
  id: true,
  createdAt: true,
});

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessageInteraction = z.infer<typeof insertMessageInteractionSchema>;
export type MessageInteraction = typeof messageInteractions.$inferSelect;
export type InsertConversationBlock = z.infer<typeof insertConversationBlockSchema>;
export type ConversationBlock = typeof conversationBlocks.$inferSelect;

// Community posts for Throttle Talk
export const communityPosts = pgTable("community_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authorId: varchar("author_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(), // reviews, questions, market-insights, discussion, dealership_benchmark
  
  // Dealer benchmark linkage (for dealership_benchmark posts)
  dealerId: varchar("dealer_id"), // Links to dealers table for benchmark posts
  
  // External content attribution
  isExternal: boolean("is_external").default(false),
  sourceUrl: text("source_url"),
  sourceName: text("source_name"),
  attribution: text("attribution"),
  
  // Engagement tracking
  views: integer("views").default(0),
  upvotes: integer("upvotes").default(0),
  downvotes: integer("downvotes").default(0),
  
  // Status
  status: text("status").default('published'), // draft, published, hidden, deleted
  isPinned: boolean("is_pinned").default(false),
  isHot: boolean("is_hot").default(false),
  
  // Moderation
  isModerated: boolean("is_moderated").default(false),
  moderatedBy: varchar("moderated_by"),
  moderatedAt: timestamp("moderated_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Comments on community posts
export const communityComments = pgTable("community_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull(),
  authorId: varchar("author_id").notNull(),
  content: text("content").notNull(),
  
  // Threading support
  parentCommentId: varchar("parent_comment_id"), // null for top-level comments
  
  // Engagement
  upvotes: integer("upvotes").default(0),
  downvotes: integer("downvotes").default(0),
  
  // Status
  status: text("status").default('published'), // published, hidden, deleted
  isModerated: boolean("is_moderated").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User reputation system
export const userReputation = pgTable("user_reputation", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  
  // Reputation scores
  totalReputation: integer("total_reputation").default(0),
  postsScore: integer("posts_score").default(0),
  commentsScore: integer("comments_score").default(0),
  upvotesReceived: integer("upvotes_received").default(0),
  downvotesReceived: integer("downvotes_received").default(0),
  
  // Achievement levels
  level: text("level").default('newcomer'), // newcomer, contributor, expert, guru
  badges: text("badges").array().default([]),
  
  // Activity tracking
  postsCount: integer("posts_count").default(0),
  commentsCount: integer("comments_count").default(0),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Social authentication providers
export const socialAccounts = pgTable("social_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  provider: text("provider").notNull(), // google, facebook, github, etc.
  providerUserId: text("provider_user_id").notNull(),
  
  // Provider-specific data
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  
  // Profile data from provider
  providerEmail: text("provider_email"),
  providerName: text("provider_name"),
  providerAvatar: text("provider_avatar"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCommunityPostSchema = createInsertSchema(communityPosts).omit({
  id: true,
  views: true,
  upvotes: true,
  downvotes: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommunityCommentSchema = createInsertSchema(communityComments).omit({
  id: true,
  upvotes: true,
  downvotes: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSocialAccountSchema = createInsertSchema(socialAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAnonymousSearchActivitySchema = createInsertSchema(anonymousSearchActivity).omit({
  id: true,
  createdAt: true,
});

export type InsertCommunityPost = z.infer<typeof insertCommunityPostSchema>;
export type CommunityPost = typeof communityPosts.$inferSelect;
export type InsertCommunityComment = z.infer<typeof insertCommunityCommentSchema>;
export type CommunityComment = typeof communityComments.$inferSelect;
export type InsertSocialAccount = z.infer<typeof insertSocialAccountSchema>;
export type SocialAccount = typeof socialAccounts.$inferSelect;
export type UserReputation = typeof userReputation.$inferSelect;
export type InsertAnonymousSearchActivity = z.infer<typeof insertAnonymousSearchActivitySchema>;
export type AnonymousSearchActivity = typeof anonymousSearchActivity.$inferSelect;

// User-generated car stories for "Road Tales" feature
export const userStories = pgTable("user_stories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  
  // Story content
  title: text("title").notNull(),
  content: text("content").notNull(),
  carBrand: text("car_brand"),
  carModel: text("car_model"),
  city: text("city"),
  
  // Media
  images: text("images").array().default([]),
  
  // AI moderation
  moderationStatus: text("moderation_status").default('pending'), // pending, approved, rejected, flagged
  moderatedAt: timestamp("moderated_at"),
  aiModerationNotes: text("ai_moderation_notes"),
  cararthLinks: jsonb("cararth_links").default([]), // AI-suggested CarArth listing links
  
  // Engagement
  featured: boolean("featured").default(false),
  featuredUntil: timestamp("featured_until"),
  views: integer("views").default(0),
  likes: integer("likes").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Newsletter subscriptions
export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name"),
  
  // Preferences
  frequency: text("frequency").default('weekly'), // daily, weekly, monthly
  topics: text("topics").array().default([]), // market-insights, new-articles, ugc-highlights
  
  // Status
  status: text("status").default('active'), // active, unsubscribed, bounced
  unsubscribedAt: timestamp("unsubscribed_at"),
  unsubscribeReason: text("unsubscribe_reason"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Polls for user engagement
export const polls = pgTable("polls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  question: text("question").notNull(),
  options: jsonb("options").notNull(), // [{ id, text, votes }]
  
  // Metadata
  category: text("category"), // used-ev, maintenance, market-trends
  active: boolean("active").default(true),
  featured: boolean("featured").default(false),
  
  // Stats
  totalVotes: integer("total_votes").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

// Poll votes tracking
export const pollVotes = pgTable("poll_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pollId: varchar("poll_id").notNull(),
  optionId: varchar("option_id").notNull(),
  userId: varchar("user_id"),
  visitorId: varchar("visitor_id"), // For anonymous votes
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Article analytics for tracking engagement
export const articleAnalytics = pgTable("article_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  articleId: varchar("article_id").notNull(), // Links to community_posts
  
  // Engagement metrics
  views: integer("views").default(0),
  uniqueViews: integer("unique_views").default(0),
  shares: integer("shares").default(0),
  avgReadTime: integer("avg_read_time").default(0), // in seconds
  scrollDepth: jsonb("scroll_depth").default({}), // { 25: count, 50: count, 75: count, 100: count }
  
  // Traffic sources
  trafficSources: jsonb("traffic_sources").default({}), // { organic: count, social: count, direct: count }
  
  // Social shares breakdown
  socialShares: jsonb("social_shares").default({}), // { whatsapp: count, twitter: count, facebook: count }
  
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Content generation logs for automated articles
export const contentGenerationLogs = pgTable("content_generation_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Generation metadata
  trigger: text("trigger").notNull(), // cron, manual, api
  status: text("status").notNull(), // success, failed, partial
  
  // API usage
  perplexityQuery: text("perplexity_query"),
  perplexityCitations: jsonb("perplexity_citations").default([]),
  grokPrompt: text("grok_prompt"),
  
  // Generated content
  articleId: varchar("article_id"), // Links to community_posts if published
  articleTitle: text("article_title"),
  wordCount: integer("word_count"),
  backlinksCount: integer("backlinks_count"),
  
  // Performance metrics
  generationTimeMs: integer("generation_time_ms"),
  perplexityTokens: integer("perplexity_tokens"),
  grokTokens: integer("grok_tokens"),
  
  // Error tracking
  errorMessage: text("error_message"),
  errorDetails: jsonb("error_details"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Cached portal listings for 24-hour data storage
export const cachedPortalListings = pgTable(
  "cached_portal_listings",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    portal: text("portal").notNull(), // CarDekho, OLX, Cars24, etc.
    externalId: text("external_id").notNull(), // Original listing ID from portal
    url: text("url").notNull(),
    
    // Car details
    title: text("title").notNull(),
    brand: text("brand").notNull(),
    model: text("model").notNull(),
    year: integer("year").notNull(),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    mileage: integer("mileage"),
    fuelType: text("fuel_type"),
    transmission: text("transmission"),
    owners: integer("owners").default(1),
    
    // Location
    location: text("location").notNull(),
    city: text("city").notNull(),
    state: text("state"),
    
    // Additional data
    description: text("description"),
    features: jsonb("features").default([]),
    images: jsonb("images").default([]),
    sellerType: text("seller_type"), // individual, dealer, oem
    verificationStatus: text("verification_status").default("unverified"),
    condition: text("condition"), // excellent, good, fair
    
    // Quality scoring for trust-weighted ranking
    qualityScore: integer("quality_score").default(50), // Overall quality score 0-100
    sourceWeight: integer("source_weight").default(50), // Source reliability 0-100
    hasRealImage: boolean("has_real_image").default(false), // True if authentic images from portals
    specValid: boolean("spec_valid").default(true), // True if car specs are valid (no Alto Diesel)
    imageAuthenticity: integer("image_authenticity").default(0), // Image authenticity score 0-100
    
    // Cache metadata
    listingDate: timestamp("listing_date").notNull(),
    fetchedAt: timestamp("fetched_at").defaultNow(),
    sourceMeta: jsonb("source_meta").default({}),
    hash: text("hash").notNull().unique(), // For deduplication
    
    // Partner listing support
    origin: text("origin").notNull().default('scraped'), // 'scraped' | 'partner'
    sourceId: varchar("source_id"), // FK to listing_sources for partner listings
    partnerUserId: varchar("partner_user_id"), // User who created (for partner origin)
    partnerVerificationStatus: text("partner_verification_status").default('pending'), // 'pending' | 'verified' | 'rejected'
    
    // Listing source branding
    listingSource: text("listing_source").notNull().default('ethical_ai'), // 'ethical_ai' | 'exclusive_dealer' | 'user_direct'
    
    // Holistic Listing Ranking Framework fields
    listingScore: decimal("listing_score", { precision: 5, scale: 2 }).default('0'), // Overall trust score 0-100
    scoreBreakdown: jsonb("score_breakdown").default({}), // {price, recency, demand, completeness, imageQuality, sellerTrust}
    demandIndex: decimal("demand_index", { precision: 3, scale: 2 }).default('0.5'), // Market demand 0-1
    avgSellingPrice: decimal("avg_selling_price", { precision: 10, scale: 2 }), // Average market price for this model
    completeness: decimal("completeness", { precision: 3, scale: 2 }).default('0'), // Completeness score 0-1
    imageQualityAvg: decimal("image_quality_avg", { precision: 3, scale: 2 }).default('0'), // Average image quality 0-1
    googleComplianceScore: decimal("google_compliance_score", { precision: 3, scale: 0 }).default('0'), // Google Vehicle Listings compliance 0-100
    priceFairnessLabel: text("price_fairness_label"), // e.g. "2% below market" or "At market price"
    
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_cached_city_brand_date").on(table.city, table.brand, table.listingDate),
    index("idx_cached_listing_date").on(table.listingDate),
    index("idx_cached_portal_external").on(table.portal, table.externalId),
    index("idx_cached_quality_score").on(table.qualityScore, table.listingDate), // For quality-based ranking
    index("idx_cached_listing_score").on(table.listingScore, table.listingDate), // For trust-based ranking
  ],
);

export const insertCachedPortalListingSchema = createInsertSchema(cachedPortalListings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCachedPortalListing = z.infer<typeof insertCachedPortalListingSchema>;
export type CachedPortalListing = typeof cachedPortalListings.$inferSelect;

// Daily listing metrics for tracking growth trends
export const listingMetrics = pgTable("listing_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").notNull(), // Snapshot date (midnight IST)
  
  // Overall counts
  totalListings: integer("total_listings").notNull().default(0),
  activeListings: integer("active_listings").notNull().default(0),
  
  // Breakdown by listing source
  ethicalAiCount: integer("ethical_ai_count").notNull().default(0),
  exclusiveDealerCount: integer("exclusive_dealer_count").notNull().default(0),
  userDirectCount: integer("user_direct_count").notNull().default(0),
  
  // Daily changes
  newAdditions: integer("new_additions").notNull().default(0),
  removals: integer("removals").notNull().default(0),
  netChange: integer("net_change").notNull().default(0),
  
  // Portal breakdown for ethical AI
  carDekhoCount: integer("car_dekho_count").default(0),
  olxCount: integer("olx_count").default(0),
  cars24Count: integer("cars24_count").default(0),
  carWaleCount: integer("car_wale_count").default(0),
  teamBhpCount: integer("team_bhp_count").default(0),
  otherPortalsCount: integer("other_portals_count").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_listing_metrics_date").on(table.date),
]);

export const insertListingMetricsSchema = createInsertSchema(listingMetrics).omit({
  id: true,
  createdAt: true,
});

export type InsertListingMetrics = z.infer<typeof insertListingMetricsSchema>;
export type ListingMetrics = typeof listingMetrics.$inferSelect;

// Insert schemas and types for Throttle Talk enhanced features
export const insertUserStorySchema = createInsertSchema(userStories).omit({
  id: true,
  views: true,
  likes: true,
  moderatedAt: true,
  aiModerationNotes: true,
  cararthLinks: true,
  createdAt: true,
});

export const insertNewsletterSubscriberSchema = createInsertSchema(newsletterSubscribers).omit({
  id: true,
  createdAt: true,
  unsubscribedAt: true,
});

export const insertPollSchema = createInsertSchema(polls).omit({
  id: true,
  totalVotes: true,
  createdAt: true,
});

export const insertPollVoteSchema = createInsertSchema(pollVotes).omit({
  id: true,
  createdAt: true,
});

export const insertArticleAnalyticsSchema = createInsertSchema(articleAnalytics).omit({
  id: true,
  updatedAt: true,
});

export const insertContentGenerationLogSchema = createInsertSchema(contentGenerationLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertUserStory = z.infer<typeof insertUserStorySchema>;
export type UserStory = typeof userStories.$inferSelect;
export type InsertNewsletterSubscriber = z.infer<typeof insertNewsletterSubscriberSchema>;
export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type InsertPoll = z.infer<typeof insertPollSchema>;
export type Poll = typeof polls.$inferSelect;
export type InsertPollVote = z.infer<typeof insertPollVoteSchema>;
export type PollVote = typeof pollVotes.$inferSelect;
export type InsertArticleAnalytics = z.infer<typeof insertArticleAnalyticsSchema>;
export type ArticleAnalytics = typeof articleAnalytics.$inferSelect;
export type InsertContentGenerationLog = z.infer<typeof insertContentGenerationLogSchema>;
export type ContentGenerationLog = typeof contentGenerationLogs.$inferSelect;

// AI model response cache for cost optimization
export const aiModelCache = pgTable("ai_model_cache", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Cache key and model info
  cacheKey: text("cache_key").notNull().unique(),
  model: text("model").notNull(), // openai-gpt4, gemini-pro, perplexity-sonar, claude-sonnet
  provider: text("provider").notNull(), // openai, google, perplexity, anthropic
  
  // Request details
  prompt: text("prompt").notNull(),
  promptHash: text("prompt_hash").notNull(), // For fast lookups
  
  // Response data
  response: jsonb("response").notNull(),
  tokenUsage: jsonb("token_usage"), // Track token consumption
  
  // Cache management
  hitCount: integer("hit_count").default(0),
  lastAccessed: timestamp("last_accessed").defaultNow(),
  ttlHours: integer("ttl_hours").default(24), // TTL in hours
  
  // Cost tracking
  estimatedCost: decimal("estimated_cost", { precision: 8, scale: 4 }), // USD cost
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_ai_cache_key").on(table.cacheKey),
  index("idx_ai_cache_prompt_hash").on(table.promptHash),
  index("idx_ai_cache_model_provider").on(table.model, table.provider),
  index("idx_ai_cache_last_accessed").on(table.lastAccessed),
]);

export const insertAiModelCacheSchema = createInsertSchema(aiModelCache).omit({
  id: true,
  hitCount: true,
  lastAccessed: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAiModelCache = z.infer<typeof insertAiModelCacheSchema>;
export type AiModelCache = typeof aiModelCache.$inferSelect;

// Trusted Listings - Only published after passing authenticity gate
export const trustedListings = pgTable("trusted_listings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Reference to source data
  sourceListingId: varchar("source_listing_id").notNull(), // References cachedPortalListings
  
  // Verified Information (copied from source after validation)
  title: text("title").notNull(),
  brand: text("brand").notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  price: integer("price").notNull(),
  mileage: integer("mileage"),
  fuelType: text("fuel_type"),
  transmission: text("transmission"),
  ownerCount: integer("owner_count"),
  location: text("location").notNull(),
  city: text("city").notNull(),
  state: text("state"),
  description: text("description"),
  features: text("features").array().default([]),
  condition: text("condition"),
  sellerType: text("seller_type"),
  
  // Portal Information
  portal: text("portal").notNull(),
  url: text("url").notNull(),
  
  // Verification Results
  verifiedImageCount: integer("verified_image_count").notNull(), // Must be >= 2 for publication
  qualityScore: integer("quality_score").notNull(), // Overall 0-100 quality score
  trustScore: decimal("trust_score", { precision: 3, scale: 2 }).notNull(), // 0.00-1.00 trust rating
  
  // Publication Control
  isPublished: boolean("is_published").default(true),
  publishedAt: timestamp("published_at").defaultNow(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_trusted_listings_city").on(table.city),
  index("idx_trusted_listings_make").on(table.make),  
  index("idx_trusted_listings_price").on(table.price),
  index("idx_trusted_listings_published").on(table.isPublished),
]);

// ============================================================================
// REAL MARKET INTELLIGENCE DATA TABLES
// Replace AI hallucinations with authentic SIAM, RTA & Google Trends data
// ============================================================================

// SIAM Monthly Sales Data - Real OEM sales figures by brand/model
export const siamSalesData = pgTable("siam_sales_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Time Period
  year: integer("year").notNull(),
  month: integer("month").notNull(), // 1-12
  reportPeriod: text("report_period").notNull(), // "2025-07", "Q2-2025"
  
  // Vehicle Details
  brand: text("brand").notNull(), // Maruti Suzuki, Hyundai, Tata
  model: text("model"), // Swift, i20, Nexon (can be null for brand totals)
  segment: text("segment").notNull(), // Hatchback, Sedan, SUV, etc.
  
  // Sales Figures - Real SIAM data
  unitsSold: integer("units_sold").notNull(),
  growthYoY: decimal("growth_yoy", { precision: 5, scale: 2 }), // Year-over-year % growth
  growthMoM: decimal("growth_mom", { precision: 5, scale: 2 }), // Month-over-month % growth
  marketShare: decimal("market_share", { precision: 5, scale: 2 }), // % of total market
  
  // Data Source & Quality
  dataSource: text("data_source").notNull().default('SIAM'), // SIAM, MarkLines, CEIC
  sourceUrl: text("source_url"), // URL of press release or data source
  verifiedAt: timestamp("verified_at").defaultNow(),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_siam_period").on(table.year, table.month),
  index("idx_siam_brand_model").on(table.brand, table.model),
  index("idx_siam_units").on(table.unitsSold),
]);

// Google Trends Data - Real search interest patterns
export const googleTrendsData = pgTable("google_trends_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Search Term
  searchTerm: text("search_term").notNull(), // "Maruti Swift", "Hyundai Creta"
  category: text("category").default('automotive'), // automotive, etc.
  
  // Location
  region: text("region").notNull(), // 'IN' for India, 'IN-MH' for Maharashtra
  regionName: text("region_name"), // "India", "Maharashtra", "Mumbai"
  
  // Time Data
  date: timestamp("date").notNull(), // Weekly data points
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  week: integer("week"), // Week of year
  
  // Trends Data
  searchVolume: integer("search_volume").notNull(), // 0-100 relative scale
  relatedQueries: text("related_queries").array().default([]), // Top related searches
  
  // Calculated Fields
  trendDirection: text("trend_direction"), // "rising", "falling", "stable"
  changePercent: decimal("change_percent", { precision: 5, scale: 2 }), // Week-over-week change
  
  // Data Quality
  dataSource: text("data_source").notNull().default('GoogleTrends'),
  collectedAt: timestamp("collected_at").defaultNow(),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_trends_term").on(table.searchTerm),
  index("idx_trends_region").on(table.region),
  index("idx_trends_date").on(table.date),
  index("idx_trends_volume").on(table.searchVolume),
]);

// Vehicle Registrations by Region - Real RTA/VAHAN data
export const vehicleRegistrations = pgTable("vehicle_registrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Location Data
  state: text("state").notNull(), // Maharashtra, Telangana, etc.
  city: text("city"), // Mumbai, Hyderabad (can be null for state totals)
  
  // Vehicle Specifications
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  variant: text("variant"), // VXI, ZXI, etc.
  fuelType: text("fuel_type").notNull(), // Petrol, Diesel, CNG, Electric
  transmission: text("transmission").notNull(), // Manual, Automatic, CVT
  
  // Time Period
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  
  // Registration Data - Real RTA figures
  registrationsCount: integer("registrations_count").notNull(),
  popularityRank: integer("popularity_rank"), // 1 = most popular in region
  
  // Calculated Metrics
  regionalMarketShare: decimal("regional_market_share", { precision: 5, scale: 2 }),
  
  // Data Source
  dataSource: text("data_source").notNull().default('VAHAN'), // VAHAN, RTA, CarRegistrationAPI
  verifiedAt: timestamp("verified_at").defaultNow(),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_registrations_location").on(table.state, table.city),
  index("idx_registrations_vehicle").on(table.brand, table.model, table.fuelType),
  index("idx_registrations_period").on(table.year, table.month),
  index("idx_registrations_count").on(table.registrationsCount),
]);

// Market Trends Analysis - Aggregated insights from real data
export const marketTrends = pgTable("market_trends", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Trend Identification
  trendType: text("trend_type").notNull(), // "sales_growth", "search_interest", "regional_demand"
  region: text("region").notNull(), // "Hyderabad", "Maharashtra", "National"
  
  // Vehicle Category
  brand: text("brand"),
  model: text("model"),
  segment: text("segment"), // Hatchback, SUV, etc.
  
  // Trend Data
  currentValue: decimal("current_value", { precision: 10, scale: 2 }),
  previousValue: decimal("previous_value", { precision: 10, scale: 2 }),
  changePercent: decimal("change_percent", { precision: 5, scale: 2 }),
  trendDirection: text("trend_direction").notNull(), // "rising", "falling", "stable"
  
  // Time Period
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  
  // Analysis
  significance: text("significance").notNull(), // "high", "medium", "low"
  description: text("description"), // Human-readable trend description
  
  // Data Quality
  dataPoints: integer("data_points").notNull(), // Number of data points used
  confidence: decimal("confidence", { precision: 3, scale: 2 }).notNull(), // 0.00-1.00
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_trends_type_region").on(table.trendType, table.region),
  index("idx_trends_vehicle").on(table.brand, table.model),
  index("idx_trends_significance").on(table.significance),
]);

// Scraper Health Monitoring - Track all scraper runs for reliability
export const scraperHealthLogs = pgTable("scraper_health_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Scraper Identification
  scraperName: text("scraper_name").notNull(), // 'Team-BHP', 'Hyundai H-Promise', etc.
  scraperType: text("scraper_type").notNull(), // 'forum', 'certified', 'auction', 'marketplace'
  
  // Run Status
  status: text("status").notNull(), // 'running', 'success', 'partial_success', 'failed'
  
  // Performance Metrics
  totalFound: integer("total_found").default(0),
  newListingsSaved: integer("new_listings_saved").default(0),
  duplicatesSkipped: integer("duplicates_skipped").default(0),
  errorsCount: integer("errors_count").default(0),
  
  // Runtime
  startedAt: timestamp("started_at").notNull(),
  completedAt: timestamp("completed_at"),
  durationMs: integer("duration_ms"),
  
  // Error Tracking
  errorMessage: text("error_message"),
  errorStack: text("error_stack"),
  retryAttempt: integer("retry_attempt").default(0),
  
  // Retry State Persistence (survives restarts)
  isRetryPending: boolean("is_retry_pending").default(false),
  nextRetryAt: timestamp("next_retry_at"),
  
  // System Context
  scheduledRun: boolean("scheduled_run").default(true), // vs manual run
  triggeredBy: text("triggered_by").default('scheduler'), // 'scheduler', 'admin', 'auto-retry'
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_scraper_health_name").on(table.scraperName),
  index("idx_scraper_health_status").on(table.status),
  index("idx_scraper_health_started").on(table.startedAt),
  index("idx_scraper_retry_pending").on(table.isRetryPending, table.nextRetryAt),
]);

// SARFAESI Government Auction Jobs - Admin-controlled scraping operations
export const sarfaesiJobs = pgTable("sarfaesi_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  source: text("source").notNull(), // 'ibapi', 'bankeauctions', 'sarfaesieauctions'
  parameters: jsonb("parameters").notNull(), // Search filters, banks, states, etc.
  status: text("status").notNull().default('queued'), // 'queued', 'running', 'success', 'failed', 'cancelled'
  
  // Results tracking
  totalFound: integer("total_found").default(0),
  authenticatedListings: integer("authenticated_listings").default(0),
  errors: jsonb("errors").default([]), // Array of error summaries
  
  // Time tracking
  startedAt: timestamp("started_at"),
  finishedAt: timestamp("finished_at"),
  
  // Audit trail
  triggeredByUserId: varchar("triggered_by_user_id").notNull(),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_sarfaesi_jobs_status").on(table.status),
  index("idx_sarfaesi_jobs_source").on(table.source),
  index("idx_sarfaesi_jobs_user").on(table.triggeredByUserId),
]);

// Admin Audit Logs - Compliance tracking for admin actions
export const adminAuditLogs = pgTable("admin_audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  actorUserId: varchar("actor_user_id").notNull(),
  action: text("action").notNull(), // 'assign_admin_role', 'trigger_sarfaesi', 'cancel_job', etc.
  targetType: text("target_type"), // 'user', 'sarfaesi_job', etc.
  targetId: varchar("target_id"),
  metadata: jsonb("metadata").default({}), // Additional context data
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_admin_audit_actor").on(table.actorUserId),
  index("idx_admin_audit_action").on(table.action),
  index("idx_admin_audit_created").on(table.createdAt),
]);

// Schema Types for New Tables
export const insertImageAssetSchema = createInsertSchema(imageAssets).omit({
  id: true,
  createdAt: true,
});

export const insertTrustedListingSchema = createInsertSchema(trustedListings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Real Market Intelligence Schema Types
export const insertSiamSalesDataSchema = createInsertSchema(siamSalesData).omit({
  id: true,
  createdAt: true,
  verifiedAt: true,
});

export const insertGoogleTrendsDataSchema = createInsertSchema(googleTrendsData).omit({
  id: true,
  createdAt: true,
  collectedAt: true,
});

export const insertVehicleRegistrationsSchema = createInsertSchema(vehicleRegistrations).omit({
  id: true,
  createdAt: true,
  verifiedAt: true,
});

export const insertMarketTrendsSchema = createInsertSchema(marketTrends).omit({
  id: true,
  createdAt: true,
});

export const insertSarfaesiJobSchema = createInsertSchema(sarfaesiJobs).omit({
  id: true,
  createdAt: true,
  startedAt: true,
  finishedAt: true,
});

export const insertAdminAuditLogSchema = createInsertSchema(adminAuditLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertImageAsset = z.infer<typeof insertImageAssetSchema>;
export type ImageAsset = typeof imageAssets.$inferSelect;
export type InsertTrustedListing = z.infer<typeof insertTrustedListingSchema>;
export type TrustedListing = typeof trustedListings.$inferSelect;

// Real Market Intelligence Types
export type InsertSiamSalesData = z.infer<typeof insertSiamSalesDataSchema>;
export type SiamSalesData = typeof siamSalesData.$inferSelect;
export type InsertGoogleTrendsData = z.infer<typeof insertGoogleTrendsDataSchema>;
export type GoogleTrendsData = typeof googleTrendsData.$inferSelect;
export type InsertVehicleRegistrations = z.infer<typeof insertVehicleRegistrationsSchema>;
export type VehicleRegistrations = typeof vehicleRegistrations.$inferSelect;
export type InsertMarketTrends = z.infer<typeof insertMarketTrendsSchema>;
export type MarketTrends = typeof marketTrends.$inferSelect;

// Admin system types
export type InsertSarfaesiJob = z.infer<typeof insertSarfaesiJobSchema>;
export type SarfaesiJob = typeof sarfaesiJobs.$inferSelect;
export type InsertAdminAuditLog = z.infer<typeof insertAdminAuditLogSchema>;
export type AdminAuditLog = typeof adminAuditLogs.$inferSelect;

// Use cached portal listings as normalized car listings for fast search
export type CarListing = CachedPortalListing;
export type InsertCarListing = InsertCachedPortalListing;

// ============================================================================
// LISTING UPDATE MONITOR & SELLER SYNDICATION SYSTEM
// Partner ingestion, deduplication, and LLM compliance pipeline
// ============================================================================

// Partner/Source Management
export const listingSources = pgTable("listing_sources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Partner information
  partnerName: text("partner_name"),
  contactEmail: text("contact_email"),
  
  // Feed configuration
  sourceType: text("source_type").notNull(), // webhook, csv, sftp, firecrawl, crawl4ai
  endpoint: text("endpoint"), // API endpoint, SFTP host, or URL
  credentials: jsonb("credentials"), // Encrypted credentials
  
  // Mapping configuration
  fieldMapping: jsonb("field_mapping"), // Maps partner fields to canonical schema
  
  // Geographic scope
  country: text("country").default('India'),
  city: text("city"),
  
  // Legal compliance
  consented: boolean("consented").default(false),
  contractUrl: text("contract_url"), // Stored contract/agreement
  tosSnapshot: text("tos_snapshot"), // Latest ToS snapshot URL
  
  // Health metrics
  lastIngestAt: timestamp("last_ingest_at"),
  ingestRate: integer("ingest_rate").default(0), // Listings per day
  rejectedCount: integer("rejected_count").default(0),
  status: text("status").default('active'), // active, paused, suspended
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_listing_sources_type").on(table.sourceType),
  index("idx_listing_sources_status").on(table.status),
]);

// Partner Invite System - Shareable links for onboarding partners
export const partnerInvites = pgTable("partner_invites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  token: varchar("token").notNull().unique(), // UUID token for URL
  listingSourceId: varchar("listing_source_id").notNull(), // FK to listing_sources
  
  // Optional pre-fill
  email: text("email"), // Pre-assign to specific email
  
  // Status
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  usedByUserId: varchar("used_by_user_id"),
  
  // Audit
  createdBy: varchar("created_by").notNull(), // Admin user who generated
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_partner_invites_token").on(table.token),
  index("idx_partner_invites_source").on(table.listingSourceId),
]);

// Partner Accounts - Maps users to their listing sources
export const partnerAccounts = pgTable("partner_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listingSourceId: varchar("listing_source_id").notNull(), // FK to listing_sources
  userId: varchar("user_id").notNull(), // FK to users
  role: text("role").notNull().default('owner'), // 'owner' | 'staff'
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_partner_accounts_user").on(table.userId),
  index("idx_partner_accounts_source").on(table.listingSourceId),
]);

// Canonical Listings with full provenance
export const canonicalListings = pgTable("canonical_listings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Source tracking
  sourceId: varchar("source_id").notNull(),
  sourceListingId: text("source_listing_id").notNull(),
  sourceUrl: text("source_url"),
  
  // Deduplication
  fingerprint: text("fingerprint").notNull().unique(), // VIN or SHA256 hash
  vin: text("vin"), // Vehicle Identification Number if available
  
  // Basic info
  title: text("title").notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  variant: text("variant"),
  year: integer("year").notNull(),
  
  // Pricing
  priceAmount: decimal("price_amount", { precision: 10, scale: 2 }).notNull(),
  priceCurrency: text("price_currency").default('INR'),
  
  // Vehicle details
  kms: integer("kms"),
  fuel: text("fuel"),
  transmission: text("transmission"),
  ownerCount: integer("owner_count"),
  
  // Location
  registrationState: text("registration_state"),
  city: text("city").notNull(),
  pincode: text("pincode"),
  
  // Content
  images: text("images").array().default([]),
  description: text("description"),
  
  // Seller info
  sellerType: text("seller_type"), // dealer, individual, aggregator
  verifiedDocs: jsonb("verified_docs").default({rc: false, insurance: false}),
  
  // Timestamps
  postedAt: timestamp("posted_at"),
  ingestedAt: timestamp("ingested_at").defaultNow(),
  lastSeenAt: timestamp("last_seen_at").defaultNow(),
  
  // Risk and compliance
  listingRiskScore: decimal("listing_risk_score", { precision: 3, scale: 2 }),
  status: text("status").default('pending'), // pending, approved, rejected, flagged
  
  // Metadata
  meta: jsonb("meta").default({}), // Raw payload, snapshots, etc.
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_canonical_fingerprint").on(table.fingerprint),
  index("idx_canonical_source").on(table.sourceId),
  index("idx_canonical_status").on(table.status),
  index("idx_canonical_city_make").on(table.city, table.make),
]);

// LLM Compliance Reports
export const llmReports = pgTable("llm_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Linked listing
  listingId: varchar("listing_id").notNull(),
  
  // LLM provider and type
  provider: text("provider").notNull(), // openai, gemini, anthropic, perplexity
  reportType: text("report_type").notNull(), // tos_extraction, pii_detection, copyright_check, normalization
  
  // Report data
  reportJson: jsonb("report_json").notNull(),
  
  // Risk assessment
  riskLevel: text("risk_level"), // low, medium, high, critical
  flagged: boolean("flagged").default(false),
  
  // Processing metadata
  processingTimeMs: integer("processing_time_ms"),
  tokenUsage: jsonb("token_usage"),
  estimatedCost: decimal("estimated_cost", { precision: 8, scale: 4 }),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_llm_reports_listing").on(table.listingId),
  index("idx_llm_reports_type").on(table.reportType),
  index("idx_llm_reports_flagged").on(table.flagged),
]);

// Partner Ingestion Logs
export const ingestionLogs = pgTable("ingestion_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  sourceId: varchar("source_id").notNull(),
  
  // Ingestion results
  totalProcessed: integer("total_processed").default(0),
  newListings: integer("new_listings").default(0),
  updatedListings: integer("updated_listings").default(0),
  rejectedListings: integer("rejected_listings").default(0),
  
  // Status
  status: text("status").notNull(), // success, partial, failed
  errorMessage: text("error_message"),
  
  // Timing
  startedAt: timestamp("started_at").notNull(),
  finishedAt: timestamp("finished_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_ingestion_logs_source").on(table.sourceId),
  index("idx_ingestion_logs_status").on(table.status),
]);

// Bulk Upload Jobs for Partner Portal
export const bulkUploadJobs = pgTable("bulk_upload_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Partner information
  partnerUserId: varchar("partner_user_id").notNull(),
  listingSourceId: varchar("listing_source_id").notNull(),
  
  // File information
  csvFileName: text("csv_file_name"),
  csvFilePath: text("csv_file_path"),
  totalRows: integer("total_rows").default(0),
  
  // Processing results
  processedRows: integer("processed_rows").default(0),
  successfulListings: integer("successful_listings").default(0),
  failedListings: integer("failed_listings").default(0),
  
  // Status tracking
  status: text("status").notNull().default('pending'), // pending, processing, completed, failed
  errorMessage: text("error_message"),
  errorDetails: jsonb("error_details").default([]),
  
  // Timing
  startedAt: timestamp("started_at"),
  finishedAt: timestamp("finished_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_bulk_upload_partner").on(table.partnerUserId),
  index("idx_bulk_upload_status").on(table.status),
]);

// Insert schemas
export const insertListingSourceSchema = createInsertSchema(listingSources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPartnerInviteSchema = createInsertSchema(partnerInvites).omit({
  id: true,
  createdAt: true,
});

export const insertPartnerAccountSchema = createInsertSchema(partnerAccounts).omit({
  id: true,
  createdAt: true,
});

export const insertCanonicalListingSchema = createInsertSchema(canonicalListings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLlmReportSchema = createInsertSchema(llmReports).omit({
  id: true,
  createdAt: true,
});

export const insertIngestionLogSchema = createInsertSchema(ingestionLogs).omit({
  id: true,
  createdAt: true,
});

export const insertBulkUploadJobSchema = createInsertSchema(bulkUploadJobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ============================================================================
// SELLER SYNDICATION COMPLIANCE & AUTOMATION SYSTEM
// DPDP Act 2023 compliant consent tracking, deduplication, and audit logs
// ============================================================================

// Seller Consent Log - Detailed consent tracking with IP for DPDP Act 2023
export const sellerConsentLog = pgTable("seller_consent_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Seller identification
  userId: varchar("user_id").notNull(), // FK to users
  sellerId: varchar("seller_id").notNull(), // Same as userId, for clarity
  
  // Consent details
  consentType: text("consent_type").notNull(), // 'syndication', 'data_sharing', 'terms_acceptance'
  consentStatus: boolean("consent_status").notNull(), // TRUE = consented, FALSE = revoked
  termsVersion: varchar("terms_version").notNull(), // e.g., 'v1.0', 'v2.0'
  
  // Legal tracking
  ipAddress: text("ip_address").notNull(), // Capture IP for compliance
  userAgent: text("user_agent"), // Browser/device info
  
  // Syndication scope
  platformsConsented: text("platforms_consented").array().default([]), // ['OLX', 'Quikr', 'Facebook']
  
  // Timestamps
  consentTimestamp: timestamp("consent_timestamp").defaultNow(),
  expiresAt: timestamp("expires_at"), // Optional expiry for time-limited consent
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_consent_log_user").on(table.userId),
  index("idx_consent_log_status").on(table.consentStatus),
  index("idx_consent_log_timestamp").on(table.consentTimestamp),
]);

// Deduplication Results - AI-powered duplicate detection logs
export const deduplicationResults = pgTable("deduplication_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Source listing
  listingId: varchar("listing_id").notNull(), // The listing being checked
  
  // Deduplication analysis
  platform: text("platform").notNull(), // 'OLX', 'Quikr', 'Facebook'
  isDuplicate: boolean("is_duplicate").notNull(), // Final decision
  confidenceScore: decimal("confidence_score", { precision: 3, scale: 2 }).notNull(), // 0.00-1.00
  
  // AI Analysis Pipeline
  firecrawlResults: jsonb("firecrawl_results"), // Search results from Firecrawl
  geminiAnalysis: jsonb("gemini_analysis"), // Attribute comparison from Gemini
  claudeValidation: jsonb("claude_validation"), // Context validation from Claude
  openaiDecision: jsonb("openai_decision"), // Final decision from OpenAI
  
  // Matched listings
  potentialDuplicates: jsonb("potential_duplicates").default([]), // Array of matched listings
  
  // Decision metadata
  skipSyndication: boolean("skip_syndication").default(false), // TRUE = skip this platform
  skipReason: text("skip_reason"), // Human-readable reason
  
  // Processing metrics
  processingTimeMs: integer("processing_time_ms"),
  totalCost: decimal("total_cost", { precision: 8, scale: 4 }), // USD cost for LLM calls
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_dedup_listing").on(table.listingId),
  index("idx_dedup_platform").on(table.platform),
  index("idx_dedup_duplicate").on(table.isDuplicate),
]);

// Syndication Execution Log - Enhanced platform posting with attribution
export const syndicationExecutionLog = pgTable("syndication_execution_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Listing reference
  listingId: varchar("listing_id").notNull(), // FK to sellerListings
  sellerId: varchar("seller_id").notNull(), // FK to users
  
  // Platform details
  platform: text("platform").notNull(), // 'OLX', 'Quikr', 'Facebook'
  
  // Execution status
  status: text("status").notNull(), // 'pending', 'success', 'failed', 'retrying'
  
  // Platform response
  platformListingId: text("platform_listing_id"), // External platform's ID
  platformUrl: text("platform_url"), // Direct link to listing
  
  // CarArth Attribution
  poweredByAttribution: boolean("powered_by_attribution").default(true), // TRUE = "Powered by CarArth.com" added
  attributionText: text("attribution_text"), // Actual text used
  
  // Error handling
  errorMessage: text("error_message"),
  errorStack: text("error_stack"),
  retryCount: integer("retry_count").default(0),
  nextRetryAt: timestamp("next_retry_at"),
  
  // API details
  requestPayload: jsonb("request_payload"), // What was sent
  responsePayload: jsonb("response_payload"), // What was received
  
  // Timestamps
  executedAt: timestamp("executed_at").defaultNow(),
  succeededAt: timestamp("succeeded_at"),
  failedAt: timestamp("failed_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_syndication_listing").on(table.listingId),
  index("idx_syndication_seller").on(table.sellerId),
  index("idx_syndication_platform").on(table.platform),
  index("idx_syndication_status").on(table.status),
]);

// External API Audit Log - Compliance tracking for all external API calls
export const externalApiAuditLog = pgTable("external_api_audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // API details
  apiProvider: text("api_provider").notNull(), // 'Apify', 'Facebook', 'Firecrawl', 'OpenAI', 'Gemini'
  apiEndpoint: text("api_endpoint").notNull(), // Specific endpoint called
  httpMethod: text("http_method").notNull(), // 'GET', 'POST', 'PUT', 'DELETE'
  
  // Request context
  userId: varchar("user_id"), // User who triggered (if applicable)
  listingId: varchar("listing_id"), // Associated listing (if applicable)
  operationType: text("operation_type").notNull(), // 'syndication', 'deduplication', 'scraping', 'validation'
  
  // Request/Response
  requestHeaders: jsonb("request_headers"),
  requestBody: jsonb("request_body"),
  responseStatus: integer("response_status"), // HTTP status code
  responseBody: jsonb("response_body"),
  
  // Performance & Cost
  responseTimeMs: integer("response_time_ms"),
  estimatedCost: decimal("estimated_cost", { precision: 8, scale: 4 }), // USD
  
  // Error tracking
  isError: boolean("is_error").default(false),
  errorMessage: text("error_message"),
  errorCode: text("error_code"),
  
  // Rate limiting
  rateLimitHit: boolean("rate_limit_hit").default(false),
  rateLimitReset: timestamp("rate_limit_reset"),
  
  // Compliance
  ipAddress: text("ip_address"), // Originating IP
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_api_audit_provider").on(table.apiProvider),
  index("idx_api_audit_operation").on(table.operationType),
  index("idx_api_audit_user").on(table.userId),
  index("idx_api_audit_listing").on(table.listingId),
  index("idx_api_audit_error").on(table.isError),
  index("idx_api_audit_created").on(table.createdAt),
]);

// Insert schemas for seller syndication tables
export const insertSellerConsentLogSchema = createInsertSchema(sellerConsentLog).omit({
  id: true,
  createdAt: true,
});

export const insertDeduplicationResultSchema = createInsertSchema(deduplicationResults).omit({
  id: true,
  createdAt: true,
});

export const insertSyndicationExecutionLogSchema = createInsertSchema(syndicationExecutionLog).omit({
  id: true,
  createdAt: true,
});

export const insertExternalApiAuditLogSchema = createInsertSchema(externalApiAuditLog).omit({
  id: true,
  createdAt: true,
});

// Type exports for seller syndication
export type InsertSellerConsentLog = z.infer<typeof insertSellerConsentLogSchema>;
export type SellerConsentLog = typeof sellerConsentLog.$inferSelect;
export type InsertDeduplicationResult = z.infer<typeof insertDeduplicationResultSchema>;
export type DeduplicationResult = typeof deduplicationResults.$inferSelect;
export type InsertSyndicationExecutionLog = z.infer<typeof insertSyndicationExecutionLogSchema>;
export type SyndicationExecutionLog = typeof syndicationExecutionLog.$inferSelect;
export type InsertExternalApiAuditLog = z.infer<typeof insertExternalApiAuditLogSchema>;
export type ExternalApiAuditLog = typeof externalApiAuditLog.$inferSelect;

// Type exports
export type InsertListingSource = z.infer<typeof insertListingSourceSchema>;
export type ListingSource = typeof listingSources.$inferSelect;
export type InsertPartnerInvite = z.infer<typeof insertPartnerInviteSchema>;
export type PartnerInvite = typeof partnerInvites.$inferSelect;
export type InsertPartnerAccount = z.infer<typeof insertPartnerAccountSchema>;
export type PartnerAccount = typeof partnerAccounts.$inferSelect;
export type InsertCanonicalListing = z.infer<typeof insertCanonicalListingSchema>;
export type CanonicalListing = typeof canonicalListings.$inferSelect;
export type InsertLlmReport = z.infer<typeof insertLlmReportSchema>;
export type LlmReport = typeof llmReports.$inferSelect;
export type InsertIngestionLog = z.infer<typeof insertIngestionLogSchema>;
export type IngestionLog = typeof ingestionLogs.$inferSelect;
export type InsertBulkUploadJob = z.infer<typeof insertBulkUploadJobSchema>;
export type BulkUploadJob = typeof bulkUploadJobs.$inferSelect;

// ============================================================================
// DEALER INVENTORY UPLOAD SYSTEM
// Mobile-first dealer dashboard with Google Vehicle Listing compliance
// ============================================================================

// Dealers - API key authenticated dealer accounts
export const dealers = pgTable("dealers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Business info
  dealerName: text("dealer_name").notNull(),
  dealerGroup: text("dealer_group"), // KUN Group, Saboo Group, etc.
  oemBrand: text("oem_brand"), // Hyundai, Maruti Suzuki, Tata Motors, etc. - RTA registered OEM (optional for Others)
  storeCode: text("store_code").notNull().unique(), // For VDP slugs
  contactPerson: text("contact_person").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull().default('Hyderabad'),
  state: text("state").notNull().default('Telangana'),
  
  // Authentication
  apiKey: text("api_key").notNull().unique(), // Bearer token for API access
  
  // Status
  isActive: boolean("is_active").default(true),
  
  // Rate limiting
  monthlyUploadLimit: integer("monthly_upload_limit").default(100),
  currentMonthUploads: integer("current_month_uploads").default(0),
  limitResetAt: timestamp("limit_reset_at").defaultNow(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_dealers_api_key").on(table.apiKey),
  index("idx_dealers_store_code").on(table.storeCode),
  index("idx_dealers_oem").on(table.oemBrand),
]);

// Dealer Vehicles - Uploaded inventory with Google Vehicle Listing compliance
export const dealerVehicles = pgTable("dealer_vehicles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dealerId: varchar("dealer_id").notNull(),
  
  // VIN (Required for Google Vehicle Listings)
  vin: text("vin").notNull(), // 17 characters, validated
  
  // Basic vehicle info (Required)
  make: text("make").notNull(), // Maruti Suzuki, Hyundai, etc.
  model: text("model").notNull(),
  year: integer("year").notNull(),
  price: integer("price").notNull(), // In rupees
  mileage: integer("mileage").notNull(), // In kilometers
  
  // Vehicle details (Required for Google)
  condition: text("condition").notNull(), // 'used' | 'certified' | 'new'
  fuelType: text("fuel_type").notNull(), // Petrol, Diesel, CNG, Electric
  transmission: text("transmission").notNull(), // Manual, Automatic, CVT
  color: text("color").notNull(),
  bodyType: text("body_type").notNull(), // Sedan, SUV, Hatchback, etc.
  
  // Images (Required - min 1, stored in object storage)
  primaryImage: text("primary_image").notNull(), // Object storage path
  additionalImages: text("additional_images").array().default([]),
  
  // Dealer contact (Required)
  dealerPhone: text("dealer_phone").notNull(),
  dealerAddress: text("dealer_address").notNull(),
  
  // Landing page
  slug: text("slug").notNull(), // Auto-generated: /used/{storeCode}/{id}
  
  // Validation status
  validationStatus: text("validation_status").default('pending'), // pending, approved, rejected, on_hold
  validationErrors: jsonb("validation_errors").default([]),
  validationWarnings: jsonb("validation_warnings").default([]),
  
  // Price validation
  isPriceOutlier: boolean("is_price_outlier").default(false), // > 1.5x median
  medianPrice: integer("median_price"), // For comparison
  
  // Duplicate detection
  isDuplicate: boolean("is_duplicate").default(false),
  duplicateOfVin: text("duplicate_of_vin"),
  
  // Upload tracking
  uploadBatchId: varchar("upload_batch_id"), // For bulk uploads
  uploadMethod: text("upload_method").notNull(), // 'quick_add' | 'bulk_csv'
  
  // Legal attestation
  dealerAttested: boolean("dealer_attested").default(false),
  attestedAt: timestamp("attested_at"),
  
  // Google Feed status
  includedInFeed: boolean("included_in_feed").default(false),
  lastFeedExport: timestamp("last_feed_export"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_dealer_vehicles_dealer").on(table.dealerId),
  index("idx_dealer_vehicles_vin").on(table.vin),
  index("idx_dealer_vehicles_status").on(table.validationStatus),
  index("idx_dealer_vehicles_slug").on(table.slug),
]);

// Upload Batches - Track bulk CSV uploads
export const uploadBatches = pgTable("upload_batches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dealerId: varchar("dealer_id").notNull(),
  
  // File info
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(), // bytes
  rowCount: integer("row_count").notNull(),
  
  // Processing status
  status: text("status").default('processing'), // processing, completed, failed
  
  // Results
  successCount: integer("success_count").default(0),
  errorCount: integer("error_count").default(0),
  warningCount: integer("warning_count").default(0),
  
  // Image handling (for .zip uploads)
  hasImageZip: boolean("has_image_zip").default(false),
  imageZipPath: text("image_zip_path"),
  extractedImageCount: integer("extracted_image_count").default(0),
  
  // Errors
  processingErrors: jsonb("processing_errors").default([]),
  
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
}, (table) => [
  index("idx_upload_batches_dealer").on(table.dealerId),
  index("idx_upload_batches_status").on(table.status),
]);

// Validation Reports - Detailed validation results
export const validationReports = pgTable("validation_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dealerId: varchar("dealer_id").notNull(),
  uploadBatchId: varchar("upload_batch_id"), // For bulk uploads
  vehicleId: varchar("vehicle_id"), // For single vehicle validations
  
  // Validation type
  validationType: text("validation_type").notNull(), // 'quick_add' | 'bulk_csv'
  
  // Results summary
  totalChecked: integer("total_checked").notNull(),
  passedCount: integer("passed_count").default(0),
  failedCount: integer("failed_count").default(0),
  warningCount: integer("warning_count").default(0),
  
  // Detailed results
  validationDetails: jsonb("validation_details").notNull(), // Array of check results
  
  // Review status (for items on_hold)
  requiresReview: boolean("requires_review").default(false),
  reviewedBy: varchar("reviewed_by"), // Admin user ID
  reviewedAt: timestamp("reviewed_at"),
  reviewDecision: text("review_decision"), // 'approved' | 'rejected'
  reviewNotes: text("review_notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_validation_reports_dealer").on(table.dealerId),
  index("idx_validation_reports_batch").on(table.uploadBatchId),
  index("idx_validation_reports_review").on(table.requiresReview),
]);

// Google Vehicle Feed Cache - Pre-generated feed data
export const googleVehicleFeeds = pgTable("google_vehicle_feeds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dealerId: varchar("dealer_id").notNull(),
  
  // Feed data (Google Vehicle Listing format)
  feedData: jsonb("feed_data").notNull(), // Array of vehicle objects
  vehicleCount: integer("vehicle_count").notNull(),
  
  // CSV export
  csvUrl: text("csv_url"), // Object storage path for downloadable CSV
  
  // Feed status
  hasErrors: boolean("has_errors").default(false),
  errorSummary: jsonb("error_summary").default([]),
  
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(), // Refresh every 24 hours
}, (table) => [
  index("idx_google_feed_dealer").on(table.dealerId),
  index("idx_google_feed_expires").on(table.expiresAt),
]);

// AETHER - Project AETHER (Adaptive Engine for Trust, Heuristics & Evolving Rankings)
// GEO Sweeps - Track AI response monitoring
export const geoSweeps = pgTable("geo_sweeps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Sweep metadata
  sweepType: text("sweep_type").notNull().default('manual'), // 'manual' | 'scheduled' | 'auto'
  promptText: text("prompt_text").notNull(), // The query sent to AI
  promptCategory: text("prompt_category"), // e.g. "inspection", "selling", "buying"
  
  // AI response data
  aiProvider: text("ai_provider").notNull(), // 'openai' | 'anthropic' | etc
  aiModel: text("ai_model").notNull(), // 'gpt-4' | 'gpt-4-turbo'
  aiResponse: text("ai_response").notNull(), // Full AI response
  
  // CarArth detection
  cararthMentioned: boolean("cararth_mentioned").default(false),
  mentionContext: text("mention_context"), // Snippet of text where CarArth was mentioned
  mentionPosition: integer("mention_position"), // Position in response (1 = first, 2 = second, etc)
  competitorsMentioned: text("competitors_mentioned").array().default([]), // Other platforms mentioned
  
  // Quality metrics
  responseQuality: integer("response_quality"), // 1-5 rating
  relevanceScore: decimal("relevance_score", { precision: 3, scale: 2 }), // 0-1 how relevant was the response
  
  // Metadata
  sweepDuration: integer("sweep_duration"), // milliseconds
  tokensUsed: integer("tokens_used"),
  cost: decimal("cost", { precision: 10, scale: 6 }), // USD cost of API call
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_geo_sweeps_created").on(table.createdAt),
  index("idx_geo_sweeps_mentioned").on(table.cararthMentioned),
  index("idx_geo_sweeps_category").on(table.promptCategory),
]);

// SEO Audits - Track SEO health over time
export const seoAudits = pgTable("seo_audits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Audit metadata
  auditType: text("audit_type").notNull().default('full'), // 'full' | 'sitemap' | 'schema' | 'performance'
  
  // Overall scores
  overallScore: integer("overall_score").notNull(), // 0-100
  sitemapScore: integer("sitemap_score"), // 0-100
  schemaScore: integer("schema_score"), // 0-100
  canonicalScore: integer("canonical_score"), // 0-100
  performanceScore: integer("performance_score"), // 0-100
  
  // Sitemap analysis
  sitemapUrls: integer("sitemap_urls"), // Total URLs in sitemap
  sitemapErrors: integer("sitemap_errors"),
  sitemapWarnings: integer("sitemap_warnings"),
  
  // Schema markup analysis
  pagesChecked: integer("pages_checked"),
  pagesWithSchema: integer("pages_with_schema"),
  schemaTypes: text("schema_types").array().default([]), // e.g. ['Product', 'Organization', 'FAQPage']
  schemaErrors: jsonb("schema_errors").default([]),
  
  // Canonical analysis
  canonicalIssues: integer("canonical_issues"),
  duplicateCanonicals: integer("duplicate_canonicals"),
  missingCanonicals: integer("missing_canonicals"),
  
  // Issues & recommendations
  criticalIssues: jsonb("critical_issues").default([]),
  warnings: jsonb("warnings").default([]),
  recommendations: jsonb("recommendations").default([]),
  
  // Metadata
  auditDuration: integer("audit_duration"), // milliseconds
  pagesAudited: integer("pages_audited"),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_seo_audits_created").on(table.createdAt),
  index("idx_seo_audits_score").on(table.overallScore),
]);

// AETHER Experiments - A/B test tracking and learning
export const aetherExperiments = pgTable("aether_experiments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Experiment metadata
  name: text("name").notNull(),
  description: text("description"),
  hypothesis: text("hypothesis").notNull(), // What we're testing
  category: text("category").notNull(), // 'schema' | 'content' | 'technical' | 'prompt'
  
  // Status
  status: text("status").notNull().default('draft'), // 'draft' | 'running' | 'completed' | 'cancelled'
  
  // Baseline & target metrics
  baselineMetric: text("baseline_metric").notNull(), // e.g. 'geo_mention_rate'
  baselineValue: decimal("baseline_value", { precision: 10, scale: 2 }).notNull(),
  targetValue: decimal("target_value", { precision: 10, scale: 2 }).notNull(),
  
  // Results
  actualValue: decimal("actual_value", { precision: 10, scale: 2 }),
  outcome: text("outcome"), // 'win' | 'neutral' | 'loss'
  confidenceLevel: decimal("confidence_level", { precision: 3, scale: 2 }), // 0-1
  
  // Learning weights (for reinforcement learning)
  weight: decimal("weight", { precision: 5, scale: 2 }).default('1.00'), // Importance weighting
  weightDelta: decimal("weight_delta", { precision: 5, scale: 2 }).default('0'), // Change from last evaluation
  
  // Implementation details
  implementationNotes: text("implementation_notes"),
  changesApplied: jsonb("changes_applied").default({}), // What was changed
  
  // Timeline
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  evaluatedAt: timestamp("evaluated_at"),
  
  // Metadata
  createdBy: varchar("created_by"), // User ID
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_aether_experiments_status").on(table.status),
  index("idx_aether_experiments_category").on(table.category),
  index("idx_aether_experiments_outcome").on(table.outcome),
]);

// AETHER Top-5 Action Engine Tables
export const aetherWatchlist = pgTable("aether_watchlist", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  page: text("page").notNull(),
  city: text("city").notNull(),
  intent: text("intent"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_watchlist_city").on(table.city),
  index("idx_watchlist_active").on(table.isActive),
]);

export const aetherDeltas = pgTable("aether_deltas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").notNull(),
  page: text("page"),
  city: text("city"),
  source: text("source").notNull(), // 'gsc' | 'ga4' | 'geo' | 'audit'
  metric: text("metric").notNull(), // 'clicks', 'ctr', 'position', 'conversions', 'ai_mention_rate', etc.
  value: decimal("value", { precision: 10, scale: 4 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_deltas_date_city").on(table.date, table.city),
  index("idx_deltas_page_city").on(table.page, table.city),
  index("idx_deltas_source").on(table.source),
]);

export const aetherActions = pgTable("aether_actions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").notNull(),
  priority: integer("priority"), // 1-5 rank
  page: text("page"),
  city: text("city"),
  pillar: text("pillar"), // 'Schema' | 'Content' | 'Performance' | 'Internal Linking'
  title: text("title"),
  do: text("do"), // What to do
  dont: text("dont"), // What not to do
  suggestedFix: text("suggested_fix"),
  expectedUplift: decimal("expected_uplift", { precision: 5, scale: 2 }),
  effort: text("effort"), // 'low' | 'medium' | 'high'
  confidence: decimal("confidence", { precision: 3, scale: 2 }), // 0-1
  evidence: jsonb("evidence").default({}),
  status: text("status").default('open'), // 'open' | 'in_progress' | 'completed' | 'dismissed'
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_actions_date_city").on(table.date, table.city),
  index("idx_actions_status").on(table.status),
  index("idx_actions_priority").on(table.priority),
]);

export const aetherActionExperiments = pgTable("aether_action_experiments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  actionId: varchar("action_id"), // references aether_actions(id)
  page: text("page"),
  city: text("city"),
  startedAt: timestamp("started_at"),
  status: text("status").default('running'), // 'running' | 'completed' | 'no_effect' | 'regress'
  targetMetrics: jsonb("target_metrics").default({}),
  baseline: jsonb("baseline").default({}),
  variant: jsonb("variant").default({}),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_action_experiments_action").on(table.actionId),
  index("idx_action_experiments_status").on(table.status),
]);

export const aetherDailyDigest = pgTable("aether_daily_digest", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  runAt: timestamp("run_at").notNull(),
  city: text("city").notNull(),
  actions: jsonb("actions").default([]), // Array of action objects
  tokenCostUsd: decimal("token_cost_usd", { precision: 8, scale: 4 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_daily_digest_city_date").on(table.city, table.runAt),
]);

// Insert schemas
export const insertDealerSchema = createInsertSchema(dealers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  currentMonthUploads: true,
  limitResetAt: true,
});

export const insertDealerVehicleSchema = createInsertSchema(dealerVehicles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUploadBatchSchema = createInsertSchema(uploadBatches).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertValidationReportSchema = createInsertSchema(validationReports).omit({
  id: true,
  createdAt: true,
});

export const insertGoogleVehicleFeedSchema = createInsertSchema(googleVehicleFeeds).omit({
  id: true,
  createdAt: true,
});

// AETHER Insert schemas
export const insertGeoSweepSchema = createInsertSchema(geoSweeps).omit({
  id: true,
  createdAt: true,
});

export const insertSeoAuditSchema = createInsertSchema(seoAudits).omit({
  id: true,
  createdAt: true,
});

export const insertAetherExperimentSchema = createInsertSchema(aetherExperiments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// AETHER Top-5 Action Engine Insert schemas
export const insertAetherWatchlistSchema = createInsertSchema(aetherWatchlist).omit({
  id: true,
  createdAt: true,
});

export const insertAetherDeltasSchema = createInsertSchema(aetherDeltas).omit({
  id: true,
  createdAt: true,
});

export const insertAetherActionsSchema = createInsertSchema(aetherActions).omit({
  id: true,
  createdAt: true,
});

export const insertAetherActionExperimentsSchema = createInsertSchema(aetherActionExperiments).omit({
  id: true,
  createdAt: true,
});

export const insertAetherDailyDigestSchema = createInsertSchema(aetherDailyDigest).omit({
  id: true,
  createdAt: true,
});

// Type exports
export type InsertDealer = z.infer<typeof insertDealerSchema>;
export type Dealer = typeof dealers.$inferSelect;
export type InsertDealerVehicle = z.infer<typeof insertDealerVehicleSchema>;
export type DealerVehicle = typeof dealerVehicles.$inferSelect;
export type InsertUploadBatch = z.infer<typeof insertUploadBatchSchema>;
export type UploadBatch = typeof uploadBatches.$inferSelect;
export type InsertValidationReport = z.infer<typeof insertValidationReportSchema>;
export type ValidationReport = typeof validationReports.$inferSelect;
export type InsertGoogleVehicleFeed = z.infer<typeof insertGoogleVehicleFeedSchema>;
export type GoogleVehicleFeed = typeof googleVehicleFeeds.$inferSelect;

// AETHER Type exports
export type InsertGeoSweep = z.infer<typeof insertGeoSweepSchema>;
export type GeoSweep = typeof geoSweeps.$inferSelect;
export type InsertSeoAudit = z.infer<typeof insertSeoAuditSchema>;
export type SeoAudit = typeof seoAudits.$inferSelect;
export type InsertAetherExperiment = z.infer<typeof insertAetherExperimentSchema>;
export type AetherExperiment = typeof aetherExperiments.$inferSelect;

// AETHER Top-5 Action Engine Type exports
export type InsertAetherWatchlist = z.infer<typeof insertAetherWatchlistSchema>;
export type AetherWatchlist = typeof aetherWatchlist.$inferSelect;
export type InsertAetherDeltas = z.infer<typeof insertAetherDeltasSchema>;
export type AetherDeltas = typeof aetherDeltas.$inferSelect;
export type InsertAetherActions = z.infer<typeof insertAetherActionsSchema>;
export type AetherActions = typeof aetherActions.$inferSelect;
export type InsertAetherActionExperiments = z.infer<typeof insertAetherActionExperimentsSchema>;
export type AetherActionExperiments = typeof aetherActionExperiments.$inferSelect;
export type InsertAetherDailyDigest = z.infer<typeof insertAetherDailyDigestSchema>;
export type AetherDailyDigest = typeof aetherDailyDigest.$inferSelect;
