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
  source: text("source").notNull(), // themobilityhub, cars24, cardekho, facebook
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
