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

// User storage table with OAuth support
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  phone: text("phone"),
  phoneVerified: boolean("phone_verified").default(false),
  phoneVerifiedAt: timestamp("phone_verified_at"),
  
  // Subscription management
  subscriptionTier: text("subscription_tier").default('free'), // free, pro_seller, pro_buyer, superhero
  subscriptionStatus: text("subscription_status").default('active'), // active, expired, cancelled
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  
  // Search usage tracking for free tier
  searchCount: integer("search_count").default(0),
  searchCountResetAt: timestamp("search_count_reset_at").defaultNow(),
  
  // Admin role system
  role: text("role").default('user'), // 'user' | 'admin'
  
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
  isVerified: boolean("is_verified").default(false),
  isSold: boolean("is_sold").default(false),
  isFeatured: boolean("is_featured").default(false),
  featuredExpiresAt: timestamp("featured_expires_at"),
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
  buyerName: text("buyer_name").notNull(),
  buyerPhone: text("buyer_phone").notNull(),
  buyerEmail: text("buyer_email").notNull(),
  message: text("message"),
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
  category: text("category").notNull(), // reviews, questions, market-insights, discussion
  
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
    
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_cached_city_brand_date").on(table.city, table.brand, table.listingDate),
    index("idx_cached_listing_date").on(table.listingDate),
    index("idx_cached_portal_external").on(table.portal, table.externalId),
    index("idx_cached_quality_score").on(table.qualityScore, table.listingDate), // For quality-based ranking
  ],
);

export const insertCachedPortalListingSchema = createInsertSchema(cachedPortalListings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCachedPortalListing = z.infer<typeof insertCachedPortalListingSchema>;
export type CachedPortalListing = typeof cachedPortalListings.$inferSelect;

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
