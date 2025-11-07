import { pgTable, varchar, numeric, integer, timestamp, boolean, unique, text, index, jsonb, serial, uniqueIndex, uuid, foreignKey, date, check } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const featuredListings = pgTable("featured_listings", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	carId: varchar("car_id").notNull(),
	sellerId: varchar("seller_id").notNull(),
	amount: numeric({ precision: 8, scale:  2 }).notNull(),
	duration: integer().notNull(),
	startDate: timestamp("start_date", { mode: 'string' }).defaultNow(),
	endDate: timestamp("end_date", { mode: 'string' }).notNull(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const users = pgTable("users", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	username: text().notNull(),
	email: text().notNull(),
	phone: text().notNull(),
	name: text().notNull(),
	password: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	isPremium: boolean("is_premium").default(false),
	premiumExpiresAt: timestamp("premium_expires_at", { mode: 'string' }),
	firstName: varchar("first_name"),
	lastName: varchar("last_name"),
	profileImageUrl: varchar("profile_image_url"),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	phoneVerified: boolean("phone_verified").default(false),
	phoneVerifiedAt: timestamp("phone_verified_at", { mode: 'string' }),
	subscriptionTier: text("subscription_tier").default('free'),
	subscriptionStatus: text("subscription_status").default('active'),
	subscriptionExpiresAt: timestamp("subscription_expires_at", { mode: 'string' }),
	searchCount: integer("search_count").default(0),
	searchCountResetAt: timestamp("search_count_reset_at", { mode: 'string' }).defaultNow(),
	role: text().default('user'),
	emailVerified: boolean("email_verified").default(false),
	verificationToken: varchar("verification_token", { length: 255 }),
	verificationTokenExpiresAt: timestamp("verification_token_expires_at", { mode: 'string' }),
	sellerType: text("seller_type").default('private'),
	consentSyndication: boolean("consent_syndication").default(false),
	consentTimestamp: timestamp("consent_timestamp", { mode: 'string' }),
	legalAgreementVersion: varchar("legal_agreement_version", { length: 50 }),
	legalAgreementAcceptedAt: timestamp("legal_agreement_accepted_at", { mode: 'string' }),
}, (table) => [
	unique("users_username_unique").on(table.username),
	unique("users_email_unique").on(table.email),
]);

export const platformPostingLogs = pgTable("platform_posting_logs", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	listingId: varchar("listing_id").notNull(),
	platform: text().notNull(),
	postingStatus: text("posting_status").notNull(),
	platformListingId: text("platform_listing_id"),
	errorMessage: text("error_message"),
	postedAt: timestamp("posted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const sellerInquiries = pgTable("seller_inquiries", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	listingId: varchar("listing_id").notNull(),
	maskedContactId: varchar("masked_contact_id").notNull(),
	buyerName: text("buyer_name").notNull(),
	buyerPhone: text("buyer_phone").notNull(),
	buyerEmail: text("buyer_email").notNull(),
	message: text(),
	source: text().notNull(),
	isRouted: boolean("is_routed").default(false),
	routedAt: timestamp("routed_at", { mode: 'string' }),
	sellerResponded: boolean("seller_responded").default(false),
	respondedAt: timestamp("responded_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const conversationBlocks = pgTable("conversation_blocks", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	blockerId: varchar("blocker_id").notNull(),
	blockedId: varchar("blocked_id").notNull(),
	reason: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const conversations = pgTable("conversations", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	carId: varchar("car_id").notNull(),
	buyerId: varchar("buyer_id").notNull(),
	sellerId: varchar("seller_id").notNull(),
	subject: text(),
	status: text().default('active'),
	buyerDisplayName: text("buyer_display_name").notNull(),
	sellerDisplayName: text("seller_display_name").notNull(),
	lastMessageAt: timestamp("last_message_at", { mode: 'string' }),
	isRead: boolean("is_read").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const messageInteractions = pgTable("message_interactions", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	messageId: varchar("message_id").notNull(),
	userId: varchar("user_id").notNull(),
	interactionType: text("interaction_type").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const messages = pgTable("messages", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	conversationId: varchar("conversation_id").notNull(),
	senderId: varchar("sender_id").notNull(),
	senderType: text("sender_type").notNull(),
	content: text().notNull(),
	messageType: text("message_type").default('text'),
	offerAmount: numeric("offer_amount", { precision: 10, scale:  2 }),
	offerStatus: text("offer_status"),
	isSystemMessage: boolean("is_system_message").default(false),
	isModerated: boolean("is_moderated").default(false),
	moderationStatus: text("moderation_status").default('approved'),
	isRead: boolean("is_read").default(false),
	readAt: timestamp("read_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const sessions = pgTable("sessions", {
	sid: varchar().primaryKey().notNull(),
	sess: jsonb().notNull(),
	expire: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	index("idx_session_expire").using("btree", table.expire.asc().nullsLast().op("timestamp_ops")),
]);

export const sellerListings = pgTable("seller_listings", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	sellerId: varchar("seller_id").notNull(),
	title: text().notNull(),
	brand: text().notNull(),
	model: text().notNull(),
	year: integer().notNull(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	mileage: integer().notNull(),
	fuelType: text("fuel_type").notNull(),
	transmission: text().notNull(),
	owners: integer().default(1).notNull(),
	location: text().notNull(),
	city: text().notNull(),
	state: text().notNull(),
	description: text(),
	features: text().array().default([""]),
	rcBookDocument: text("rc_book_document"),
	insuranceDocument: text("insurance_document"),
	frontPhoto: text("front_photo"),
	rearPhoto: text("rear_photo"),
	leftSidePhoto: text("left_side_photo"),
	rightSidePhoto: text("right_side_photo"),
	interiorPhoto: text("interior_photo"),
	engineBayPhoto: text("engine_bay_photo"),
	additionalPhotos: text("additional_photos").array().default([""]),
	maskedContactId: varchar("masked_contact_id").default(gen_random_uuid()),
	actualPhone: text("actual_phone").notNull(),
	actualEmail: text("actual_email").notNull(),
	postedToCars24: boolean("posted_to_cars24").default(false),
	cars24ListingId: text("cars24_listing_id"),
	postedToCardekho: boolean("posted_to_cardekho").default(false),
	cardekhoListingId: text("cardekho_listing_id"),
	postedToFacebookMarketplace: boolean("posted_to_facebook_marketplace").default(false),
	facebookMarketplaceListingId: text("facebook_marketplace_listing_id"),
	aiGeneratedTitle: text("ai_generated_title"),
	aiGeneratedDescription: text("ai_generated_description"),
	marketValueEstimate: numeric("market_value_estimate", { precision: 10, scale:  2 }),
	documentVerificationStatus: text("document_verification_status").default('pending'),
	photoVerificationStatus: text("photo_verification_status").default('pending'),
	listingStatus: text("listing_status").default('draft'),
	viewCount: integer("view_count").default(0),
	inquiryCount: integer("inquiry_count").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	adminOverride: boolean("admin_override").default(false),
});

export const userSearchActivity = pgTable("user_search_activity", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	searchType: text("search_type").notNull(),
	searchFilters: jsonb("search_filters"),
	resultsCount: integer("results_count").default(0),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	plan: text().notNull(),
	status: text().notNull(),
	amount: numeric({ precision: 8, scale:  2 }).notNull(),
	startDate: timestamp("start_date", { mode: 'string' }).defaultNow(),
	endDate: timestamp("end_date", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	tier: text(),
	currency: text().default('INR'),
	billingCycle: text("billing_cycle"),
	locationRestriction: text("location_restriction"),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const phoneVerifications = pgTable("phone_verifications", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	phoneNumber: text("phone_number").notNull(),
	verificationCode: text("verification_code").notNull(),
	verified: boolean().default(false),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const anonymousSearchActivity = pgTable("anonymous_search_activity", {
	id: serial().primaryKey().notNull(),
	visitorId: varchar("visitor_id", { length: 255 }).notNull(),
	searchTime: timestamp("search_time", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	searchQuery: jsonb("search_query"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	ipHash: varchar("ip_hash"),
	userAgent: text("user_agent"),
});

export const productionPortalListings = pgTable("production_portal_listings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	source: text(),
	sourceId: text("source_id"),
	normalized: jsonb(),
	raw: jsonb(),
	fetchedAt: timestamp("fetched_at", { withTimezone: true, mode: 'string' }),
	ingestBatchTs: timestamp("ingest_batch_ts", { withTimezone: true, mode: 'string' }),
	status: text().default('raw'),
	confidence: numeric(),
	trustScore: numeric("trust_score"),
	validationNotes: jsonb("validation_notes"),
}, (table) => [
	index("idx_production_listings_batch_ts").using("btree", table.ingestBatchTs.asc().nullsLast().op("timestamptz_ops")),
	index("idx_production_listings_confidence").using("btree", table.confidence.asc().nullsLast().op("numeric_ops")),
	index("idx_production_listings_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_production_listings_trust_score").using("btree", table.trustScore.asc().nullsLast().op("numeric_ops")),
	uniqueIndex("idx_production_listings_unique").using("btree", table.source.asc().nullsLast().op("text_ops"), table.sourceId.asc().nullsLast().op("timestamptz_ops"), table.ingestBatchTs.asc().nullsLast().op("timestamptz_ops")),
]);

export const listingEmbeddings = pgTable("listing_embeddings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	listingId: uuid("listing_id"),
	vector: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_listing_embeddings_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_listing_embeddings_listing_id").using("btree", table.listingId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.listingId],
			foreignColumns: [productionPortalListings.id],
			name: "listing_embeddings_listing_id_fkey"
		}),
]);

export const trustedListings = pgTable("trusted_listings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	canonical: jsonb(),
	trustScore: numeric("trust_score"),
	sourceList: jsonb("source_list"),
	publishedAt: timestamp("published_at", { withTimezone: true, mode: 'string' }),
	status: text().default('active'),
	removedAt: timestamp("removed_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_trusted_listings_active").using("btree", table.status.asc().nullsLast().op("text_ops"), table.removedAt.asc().nullsLast().op("text_ops")).where(sql`(removed_at IS NULL)`),
	index("idx_trusted_listings_published_at").using("btree", table.publishedAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_trusted_listings_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_trusted_listings_trust_score").using("btree", table.trustScore.asc().nullsLast().op("numeric_ops")),
]);

export const dailySpend = pgTable("daily_spend", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	date: date().notNull(),
	model: text().notNull(),
	spendUsd: numeric("spend_usd").default('0'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_daily_spend_date").using("btree", table.date.asc().nullsLast().op("date_ops")),
	uniqueIndex("idx_daily_spend_date_model").using("btree", table.date.asc().nullsLast().op("date_ops"), table.model.asc().nullsLast().op("date_ops")),
]);

export const aiAnalysisMetrics = pgTable("ai_analysis_metrics", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	serviceName: text("service_name").notNull(),
	operationType: text("operation_type").notNull(),
	totalCalls: integer("total_calls").default(0),
	successfulCalls: integer("successful_calls").default(0),
	failedCalls: integer("failed_calls").default(0),
	averageProcessingTime: numeric("average_processing_time", { precision: 8, scale:  2 }),
	averageConfidence: numeric("average_confidence", { precision: 3, scale:  2 }),
	totalTokensUsed: integer("total_tokens_used").default(0),
	estimatedCostUsd: numeric("estimated_cost_usd", { precision: 10, scale:  4 }),
	periodStart: timestamp("period_start", { mode: 'string' }).notNull(),
	periodEnd: timestamp("period_end", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const imageAssets = pgTable("image_assets", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	listingId: varchar("listing_id").notNull(),
	portal: text().notNull(),
	pageUrl: text("page_url").notNull(),
	selector: text(),
	originalUrl: text("original_url").notNull(),
	storageKey: text("storage_key"),
	width: integer(),
	height: integer(),
	fileSizeBytes: integer("file_size_bytes"),
	contentType: text("content_type"),
	sha256Hash: text("sha256_hash").notNull(),
	perceptualHash: text("perceptual_hash"),
	authenticityScore: integer("authenticity_score").default(0).notNull(),
	passedGate: boolean("passed_gate").default(false).notNull(),
	rejectionReasons: text("rejection_reasons").array().default([""]),
	extractedAt: timestamp("extracted_at", { mode: 'string' }).defaultNow(),
	validatedAt: timestamp("validated_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_image_assets_listing").using("btree", table.listingId.asc().nullsLast().op("text_ops")),
	index("idx_image_assets_passed_gate").using("btree", table.passedGate.asc().nullsLast().op("bool_ops")),
	index("idx_image_assets_sha256").using("btree", table.sha256Hash.asc().nullsLast().op("text_ops")),
]);

export const sarfaesiJobs = pgTable("sarfaesi_jobs", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	source: text().notNull(),
	parameters: jsonb().notNull(),
	status: text().default('queued').notNull(),
	totalFound: integer("total_found").default(0),
	authenticatedListings: integer("authenticated_listings").default(0),
	errors: jsonb().default([]),
	startedAt: timestamp("started_at", { mode: 'string' }),
	finishedAt: timestamp("finished_at", { mode: 'string' }),
	triggeredByUserId: varchar("triggered_by_user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_sarfaesi_jobs_source").using("btree", table.source.asc().nullsLast().op("text_ops")),
	index("idx_sarfaesi_jobs_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_sarfaesi_jobs_user").using("btree", table.triggeredByUserId.asc().nullsLast().op("text_ops")),
]);

export const adminAuditLogs = pgTable("admin_audit_logs", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	actorUserId: varchar("actor_user_id").notNull(),
	action: text().notNull(),
	targetType: text("target_type"),
	targetId: varchar("target_id"),
	metadata: jsonb().default({}),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_admin_audit_action").using("btree", table.action.asc().nullsLast().op("text_ops")),
	index("idx_admin_audit_actor").using("btree", table.actorUserId.asc().nullsLast().op("text_ops")),
	index("idx_admin_audit_created").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
]);

export const llmReports = pgTable("llm_reports", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	listingId: varchar("listing_id").notNull(),
	checkType: varchar("check_type").notNull(),
	llmProvider: varchar("llm_provider").notNull(),
	llmModel: varchar("llm_model").notNull(),
	result: jsonb().default({}).notNull(),
	passed: boolean().default(false).notNull(),
	riskFlags: text("risk_flags").array(),
	processingTimeMs: integer("processing_time_ms"),
	costUsd: numeric("cost_usd", { precision: 10, scale:  6 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.listingId],
			foreignColumns: [canonicalListings.id],
			name: "llm_reports_listing_id_fkey"
		}).onDelete("cascade"),
	check("llm_reports_check_type_check", sql`(check_type)::text = ANY ((ARRAY['tos_extraction'::character varying, 'pii_detection'::character varying, 'copyright_validation'::character varying, 'data_normalization'::character varying])::text[])`),
]);

export const listingSources = pgTable("listing_sources", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	partnerName: varchar("partner_name").notNull(),
	feedType: varchar("feed_type").notNull(),
	sourceUrl: varchar("source_url"),
	fieldMapping: jsonb("field_mapping").default({}).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	legalComplianceNotes: text("legal_compliance_notes"),
	lastSyncAt: timestamp("last_sync_at", { mode: 'string' }),
	syncFrequencyHours: integer("sync_frequency_hours"),
	healthStatus: varchar("health_status").default('healthy').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	check("listing_sources_feed_type_check", sql`(feed_type)::text = ANY ((ARRAY['webhook'::character varying, 'csv'::character varying, 'sftp'::character varying, 'firecrawl'::character varying])::text[])`),
	check("listing_sources_health_status_check", sql`(health_status)::text = ANY ((ARRAY['healthy'::character varying, 'degraded'::character varying, 'down'::character varying])::text[])`),
]);

export const canonicalListings = pgTable("canonical_listings", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	sourceId: varchar("source_id").notNull(),
	sourceListingId: varchar("source_listing_id").notNull(),
	vin: varchar(),
	registrationNumber: varchar("registration_number"),
	contentHash: varchar("content_hash"),
	normalizedData: jsonb("normalized_data").default({}).notNull(),
	status: varchar().default('pending').notNull(),
	riskScore: integer("risk_score").default(0),
	flaggedReasons: text("flagged_reasons").array(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.sourceId],
			foreignColumns: [listingSources.id],
			name: "canonical_listings_source_id_fkey"
		}).onDelete("cascade"),
	unique("canonical_listings_source_id_source_listing_id_key").on(table.sourceId, table.sourceListingId),
	check("canonical_listings_status_check", sql`(status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'flagged'::character varying, 'rejected'::character varying])::text[])`),
]);

export const ingestionLogs = pgTable("ingestion_logs", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	sourceId: varchar("source_id").notNull(),
	totalProcessed: integer("total_processed").default(0),
	newListings: integer("new_listings").default(0),
	updatedListings: integer("updated_listings").default(0),
	rejectedListings: integer("rejected_listings").default(0),
	status: varchar().default('running').notNull(),
	errorMessage: text("error_message"),
	startedAt: timestamp("started_at", { mode: 'string' }).defaultNow().notNull(),
	finishedAt: timestamp("finished_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.sourceId],
			foreignColumns: [listingSources.id],
			name: "ingestion_logs_source_id_fkey"
		}).onDelete("cascade"),
	check("ingestion_logs_status_check", sql`(status)::text = ANY ((ARRAY['running'::character varying, 'success'::character varying, 'failed'::character varying, 'partial'::character varying])::text[])`),
]);

export const contacts = pgTable("contacts", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	carId: varchar("car_id").notNull(),
	buyerName: text("buyer_name").notNull(),
	buyerPhone: text("buyer_phone").notNull(),
	buyerEmail: text("buyer_email").notNull(),
	message: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	sellerId: varchar("seller_id"),
	buyerPhoneNormalized: text("buyer_phone_normalized"),
	sellerNotifiedAt: timestamp("seller_notified_at", { mode: 'string' }),
	sellerNotificationMethod: text("seller_notification_method"),
	sellerNotificationStatus: text("seller_notification_status").default('pending'),
	sellerNotificationError: text("seller_notification_error"),
	notificationRetryCount: integer("notification_retry_count").default(0),
	lastNotificationAttempt: timestamp("last_notification_attempt", { mode: 'string' }),
});

export const partnerInvites = pgTable("partner_invites", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	token: varchar().notNull(),
	listingSourceId: varchar("listing_source_id").notNull(),
	email: text(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	usedAt: timestamp("used_at", { mode: 'string' }),
	usedByUserId: varchar("used_by_user_id"),
	createdBy: varchar("created_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_partner_invites_source").using("btree", table.listingSourceId.asc().nullsLast().op("text_ops")),
	index("idx_partner_invites_token").using("btree", table.token.asc().nullsLast().op("text_ops")),
	unique("partner_invites_token_key").on(table.token),
]);

export const partnerAccounts = pgTable("partner_accounts", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	listingSourceId: varchar("listing_source_id").notNull(),
	userId: varchar("user_id").notNull(),
	role: text().default('owner').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_partner_accounts_source").using("btree", table.listingSourceId.asc().nullsLast().op("text_ops")),
	index("idx_partner_accounts_user").using("btree", table.userId.asc().nullsLast().op("text_ops")),
]);

export const bulkUploadJobs = pgTable("bulk_upload_jobs", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	partnerUserId: varchar("partner_user_id").notNull(),
	listingSourceId: varchar("listing_source_id").notNull(),
	csvFileName: text("csv_file_name"),
	csvFilePath: text("csv_file_path"),
	totalRows: integer("total_rows").default(0),
	processedRows: integer("processed_rows").default(0),
	successfulListings: integer("successful_listings").default(0),
	failedListings: integer("failed_listings").default(0),
	status: text().default('pending').notNull(),
	errorMessage: text("error_message"),
	errorDetails: jsonb("error_details").default([]),
	startedAt: timestamp("started_at", { mode: 'string' }),
	finishedAt: timestamp("finished_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_bulk_upload_partner").using("btree", table.partnerUserId.asc().nullsLast().op("text_ops")),
	index("idx_bulk_upload_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
]);

export const googleTrendsData = pgTable("google_trends_data", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	searchTerm: text("search_term").notNull(),
	category: text().default('automotive'),
	region: text().notNull(),
	regionName: text("region_name"),
	date: timestamp({ mode: 'string' }).notNull(),
	year: integer().notNull(),
	month: integer().notNull(),
	week: integer(),
	searchVolume: integer("search_volume").notNull(),
	relatedQueries: text("related_queries").array().default([""]),
	trendDirection: text("trend_direction"),
	changePercent: numeric("change_percent", { precision: 5, scale:  2 }),
	dataSource: text("data_source").default('GoogleTrends').notNull(),
	collectedAt: timestamp("collected_at", { mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_trends_date").using("btree", table.date.asc().nullsLast().op("timestamp_ops")),
	index("idx_trends_region").using("btree", table.region.asc().nullsLast().op("text_ops")),
	index("idx_trends_term").using("btree", table.searchTerm.asc().nullsLast().op("text_ops")),
	index("idx_trends_volume").using("btree", table.searchVolume.asc().nullsLast().op("int4_ops")),
]);

export const siamSalesData = pgTable("siam_sales_data", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	year: integer().notNull(),
	month: integer().notNull(),
	reportPeriod: text("report_period").notNull(),
	brand: text().notNull(),
	model: text(),
	segment: text().notNull(),
	unitsSold: integer("units_sold").notNull(),
	growthYoy: numeric("growth_yoy", { precision: 5, scale:  2 }),
	growthMom: numeric("growth_mom", { precision: 5, scale:  2 }),
	marketShare: numeric("market_share", { precision: 5, scale:  2 }),
	dataSource: text("data_source").default('SIAM').notNull(),
	sourceUrl: text("source_url"),
	verifiedAt: timestamp("verified_at", { mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_siam_brand_model").using("btree", table.brand.asc().nullsLast().op("text_ops"), table.model.asc().nullsLast().op("text_ops")),
	index("idx_siam_period").using("btree", table.year.asc().nullsLast().op("int4_ops"), table.month.asc().nullsLast().op("int4_ops")),
	index("idx_siam_units").using("btree", table.unitsSold.asc().nullsLast().op("int4_ops")),
]);

export const marketTrends = pgTable("market_trends", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	trendType: text("trend_type").notNull(),
	region: text().notNull(),
	brand: text(),
	model: text(),
	segment: text(),
	currentValue: numeric("current_value", { precision: 10, scale:  2 }),
	previousValue: numeric("previous_value", { precision: 10, scale:  2 }),
	changePercent: numeric("change_percent", { precision: 5, scale:  2 }),
	trendDirection: text("trend_direction").notNull(),
	periodStart: timestamp("period_start", { mode: 'string' }).notNull(),
	periodEnd: timestamp("period_end", { mode: 'string' }).notNull(),
	significance: text().notNull(),
	description: text(),
	dataPoints: integer("data_points").notNull(),
	confidence: numeric({ precision: 3, scale:  2 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_trends_significance").using("btree", table.significance.asc().nullsLast().op("text_ops")),
	index("idx_trends_type_region").using("btree", table.trendType.asc().nullsLast().op("text_ops"), table.region.asc().nullsLast().op("text_ops")),
	index("idx_trends_vehicle").using("btree", table.brand.asc().nullsLast().op("text_ops"), table.model.asc().nullsLast().op("text_ops")),
]);

export const aiModelCache = pgTable("ai_model_cache", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	cacheKey: text("cache_key").notNull(),
	model: text().notNull(),
	provider: text().notNull(),
	prompt: text().notNull(),
	promptHash: text("prompt_hash").notNull(),
	response: jsonb().notNull(),
	tokenUsage: jsonb("token_usage"),
	hitCount: integer("hit_count").default(0),
	lastAccessed: timestamp("last_accessed", { mode: 'string' }).defaultNow(),
	ttlHours: integer("ttl_hours").default(24),
	estimatedCost: numeric("estimated_cost", { precision: 8, scale:  4 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_ai_cache_key").using("btree", table.cacheKey.asc().nullsLast().op("text_ops")),
	index("idx_ai_cache_last_accessed").using("btree", table.lastAccessed.asc().nullsLast().op("timestamp_ops")),
	index("idx_ai_cache_model_provider").using("btree", table.model.asc().nullsLast().op("text_ops"), table.provider.asc().nullsLast().op("text_ops")),
	index("idx_ai_cache_prompt_hash").using("btree", table.promptHash.asc().nullsLast().op("text_ops")),
	unique("ai_model_cache_cache_key_key").on(table.cacheKey),
]);

export const deduplicationResults = pgTable("deduplication_results", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	listingId: varchar("listing_id").notNull(),
	platform: text().notNull(),
	isDuplicate: boolean("is_duplicate").notNull(),
	confidenceScore: numeric("confidence_score", { precision: 3, scale:  2 }).notNull(),
	firecrawlResults: jsonb("firecrawl_results"),
	geminiAnalysis: jsonb("gemini_analysis"),
	claudeValidation: jsonb("claude_validation"),
	openaiDecision: jsonb("openai_decision"),
	potentialDuplicates: jsonb("potential_duplicates").default([]),
	skipSyndication: boolean("skip_syndication").default(false),
	skipReason: text("skip_reason"),
	processingTimeMs: integer("processing_time_ms"),
	totalCost: numeric("total_cost", { precision: 8, scale:  4 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_dedup_duplicate").using("btree", table.isDuplicate.asc().nullsLast().op("bool_ops")),
	index("idx_dedup_listing").using("btree", table.listingId.asc().nullsLast().op("text_ops")),
	index("idx_dedup_platform").using("btree", table.platform.asc().nullsLast().op("text_ops")),
]);

export const scraperHealthLogs = pgTable("scraper_health_logs", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	scraperName: text("scraper_name").notNull(),
	scraperType: text("scraper_type").notNull(),
	status: text().notNull(),
	totalFound: integer("total_found").default(0),
	newListingsSaved: integer("new_listings_saved").default(0),
	duplicatesSkipped: integer("duplicates_skipped").default(0),
	errorsCount: integer("errors_count").default(0),
	startedAt: timestamp("started_at", { mode: 'string' }).notNull(),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	durationMs: integer("duration_ms"),
	errorMessage: text("error_message"),
	errorStack: text("error_stack"),
	retryAttempt: integer("retry_attempt").default(0),
	scheduledRun: boolean("scheduled_run").default(true),
	triggeredBy: text("triggered_by").default('scheduler'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	isRetryPending: boolean("is_retry_pending").default(false),
	nextRetryAt: timestamp("next_retry_at", { mode: 'string' }),
}, (table) => [
	index("idx_scraper_health_name").using("btree", table.scraperName.asc().nullsLast().op("text_ops")),
	index("idx_scraper_health_started").using("btree", table.startedAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_scraper_health_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
]);

export const sellerConsentLog = pgTable("seller_consent_log", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	sellerId: varchar("seller_id").notNull(),
	consentType: text("consent_type").notNull(),
	consentStatus: boolean("consent_status").notNull(),
	termsVersion: varchar("terms_version").notNull(),
	ipAddress: text("ip_address").notNull(),
	userAgent: text("user_agent"),
	platformsConsented: text("platforms_consented").array().default([""]),
	consentTimestamp: timestamp("consent_timestamp", { mode: 'string' }).defaultNow(),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_consent_log_status").using("btree", table.consentStatus.asc().nullsLast().op("bool_ops")),
	index("idx_consent_log_timestamp").using("btree", table.consentTimestamp.asc().nullsLast().op("timestamp_ops")),
	index("idx_consent_log_user").using("btree", table.userId.asc().nullsLast().op("text_ops")),
]);

export const syndicationExecutionLog = pgTable("syndication_execution_log", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	listingId: varchar("listing_id").notNull(),
	sellerId: varchar("seller_id").notNull(),
	platform: text().notNull(),
	status: text().notNull(),
	platformListingId: text("platform_listing_id"),
	platformUrl: text("platform_url"),
	poweredByAttribution: boolean("powered_by_attribution").default(true),
	attributionText: text("attribution_text"),
	errorMessage: text("error_message"),
	errorStack: text("error_stack"),
	retryCount: integer("retry_count").default(0),
	nextRetryAt: timestamp("next_retry_at", { mode: 'string' }),
	requestPayload: jsonb("request_payload"),
	responsePayload: jsonb("response_payload"),
	executedAt: timestamp("executed_at", { mode: 'string' }).defaultNow(),
	succeededAt: timestamp("succeeded_at", { mode: 'string' }),
	failedAt: timestamp("failed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_syndication_listing").using("btree", table.listingId.asc().nullsLast().op("text_ops")),
	index("idx_syndication_platform").using("btree", table.platform.asc().nullsLast().op("text_ops")),
	index("idx_syndication_seller").using("btree", table.sellerId.asc().nullsLast().op("text_ops")),
	index("idx_syndication_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
]);

export const externalApiAuditLog = pgTable("external_api_audit_log", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	apiProvider: text("api_provider").notNull(),
	apiEndpoint: text("api_endpoint").notNull(),
	httpMethod: text("http_method").notNull(),
	userId: varchar("user_id"),
	listingId: varchar("listing_id"),
	operationType: text("operation_type").notNull(),
	requestHeaders: jsonb("request_headers"),
	requestBody: jsonb("request_body"),
	responseStatus: integer("response_status"),
	responseBody: jsonb("response_body"),
	responseTimeMs: integer("response_time_ms"),
	estimatedCost: numeric("estimated_cost", { precision: 8, scale:  4 }),
	isError: boolean("is_error").default(false),
	errorMessage: text("error_message"),
	errorCode: text("error_code"),
	rateLimitHit: boolean("rate_limit_hit").default(false),
	rateLimitReset: timestamp("rate_limit_reset", { mode: 'string' }),
	ipAddress: text("ip_address"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_api_audit_created").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_api_audit_error").using("btree", table.isError.asc().nullsLast().op("bool_ops")),
	index("idx_api_audit_listing").using("btree", table.listingId.asc().nullsLast().op("text_ops")),
	index("idx_api_audit_operation").using("btree", table.operationType.asc().nullsLast().op("text_ops")),
	index("idx_api_audit_provider").using("btree", table.apiProvider.asc().nullsLast().op("text_ops")),
	index("idx_api_audit_user").using("btree", table.userId.asc().nullsLast().op("text_ops")),
]);

export const dealers = pgTable("dealers", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	dealerName: text("dealer_name").notNull(),
	storeCode: text("store_code").notNull(),
	contactPerson: text("contact_person").notNull(),
	email: text().notNull(),
	phone: text().notNull(),
	address: text().notNull(),
	city: text().default('Hyderabad').notNull(),
	state: text().default('Telangana').notNull(),
	apiKey: text("api_key").notNull(),
	isActive: boolean("is_active").default(true),
	monthlyUploadLimit: integer("monthly_upload_limit").default(100),
	currentMonthUploads: integer("current_month_uploads").default(0),
	limitResetAt: timestamp("limit_reset_at", { mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	oemBrand: text("oem_brand"),
	dealerGroup: text("dealer_group"),
}, (table) => [
	index("idx_dealers_api_key").using("btree", table.apiKey.asc().nullsLast().op("text_ops")),
	index("idx_dealers_oem").using("btree", table.oemBrand.asc().nullsLast().op("text_ops")),
	index("idx_dealers_store_code").using("btree", table.storeCode.asc().nullsLast().op("text_ops")),
	unique("dealers_store_code_key").on(table.storeCode),
	unique("dealers_email_key").on(table.email),
	unique("dealers_api_key_key").on(table.apiKey),
]);

export const dealerVehicles = pgTable("dealer_vehicles", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	dealerId: varchar("dealer_id").notNull(),
	vin: text().notNull(),
	make: text().notNull(),
	model: text().notNull(),
	year: integer().notNull(),
	price: integer().notNull(),
	mileage: integer().notNull(),
	condition: text().notNull(),
	fuelType: text("fuel_type").notNull(),
	transmission: text().notNull(),
	color: text().notNull(),
	bodyType: text("body_type").notNull(),
	primaryImage: text("primary_image").notNull(),
	additionalImages: text("additional_images").array().default([""]),
	dealerPhone: text("dealer_phone").notNull(),
	dealerAddress: text("dealer_address").notNull(),
	slug: text().notNull(),
	validationStatus: text("validation_status").default('pending'),
	validationErrors: jsonb("validation_errors").default([]),
	validationWarnings: jsonb("validation_warnings").default([]),
	isPriceOutlier: boolean("is_price_outlier").default(false),
	medianPrice: integer("median_price"),
	isDuplicate: boolean("is_duplicate").default(false),
	duplicateOfVin: text("duplicate_of_vin"),
	uploadBatchId: varchar("upload_batch_id"),
	uploadMethod: text("upload_method").notNull(),
	dealerAttested: boolean("dealer_attested").default(false),
	attestedAt: timestamp("attested_at", { mode: 'string' }),
	includedInFeed: boolean("included_in_feed").default(false),
	lastFeedExport: timestamp("last_feed_export", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_dealer_vehicles_dealer").using("btree", table.dealerId.asc().nullsLast().op("text_ops")),
	index("idx_dealer_vehicles_slug").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	index("idx_dealer_vehicles_status").using("btree", table.validationStatus.asc().nullsLast().op("text_ops")),
	index("idx_dealer_vehicles_vin").using("btree", table.vin.asc().nullsLast().op("text_ops")),
]);

export const uploadBatches = pgTable("upload_batches", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	dealerId: varchar("dealer_id").notNull(),
	fileName: text("file_name").notNull(),
	fileSize: integer("file_size").notNull(),
	rowCount: integer("row_count").notNull(),
	status: text().default('processing'),
	successCount: integer("success_count").default(0),
	errorCount: integer("error_count").default(0),
	warningCount: integer("warning_count").default(0),
	hasImageZip: boolean("has_image_zip").default(false),
	imageZipPath: text("image_zip_path"),
	extractedImageCount: integer("extracted_image_count").default(0),
	processingErrors: jsonb("processing_errors").default([]),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	completedAt: timestamp("completed_at", { mode: 'string' }),
}, (table) => [
	index("idx_upload_batches_dealer").using("btree", table.dealerId.asc().nullsLast().op("text_ops")),
	index("idx_upload_batches_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
]);

export const validationReports = pgTable("validation_reports", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	dealerId: varchar("dealer_id").notNull(),
	uploadBatchId: varchar("upload_batch_id"),
	vehicleId: varchar("vehicle_id"),
	validationType: text("validation_type").notNull(),
	totalChecked: integer("total_checked").notNull(),
	passedCount: integer("passed_count").default(0),
	failedCount: integer("failed_count").default(0),
	warningCount: integer("warning_count").default(0),
	validationDetails: jsonb("validation_details").notNull(),
	requiresReview: boolean("requires_review").default(false),
	reviewedBy: varchar("reviewed_by"),
	reviewedAt: timestamp("reviewed_at", { mode: 'string' }),
	reviewDecision: text("review_decision"),
	reviewNotes: text("review_notes"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_validation_reports_batch").using("btree", table.uploadBatchId.asc().nullsLast().op("text_ops")),
	index("idx_validation_reports_dealer").using("btree", table.dealerId.asc().nullsLast().op("text_ops")),
	index("idx_validation_reports_review").using("btree", table.requiresReview.asc().nullsLast().op("bool_ops")),
]);

export const googleVehicleFeeds = pgTable("google_vehicle_feeds", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	dealerId: varchar("dealer_id").notNull(),
	feedData: jsonb("feed_data").notNull(),
	vehicleCount: integer("vehicle_count").notNull(),
	csvUrl: text("csv_url"),
	hasErrors: boolean("has_errors").default(false),
	errorSummary: jsonb("error_summary").default([]),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
}, (table) => [
	index("idx_google_feed_dealer").using("btree", table.dealerId.asc().nullsLast().op("text_ops")),
	index("idx_google_feed_expires").using("btree", table.expiresAt.asc().nullsLast().op("timestamp_ops")),
]);

export const communityPosts = pgTable("community_posts", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	authorId: varchar("author_id").notNull(),
	title: text().notNull(),
	content: text().notNull(),
	category: text().notNull(),
	isExternal: boolean("is_external").default(false),
	sourceUrl: text("source_url"),
	sourceName: text("source_name"),
	attribution: text(),
	views: integer().default(0),
	upvotes: integer().default(0),
	downvotes: integer().default(0),
	status: text().default('published'),
	isPinned: boolean("is_pinned").default(false),
	isHot: boolean("is_hot").default(false),
	isModerated: boolean("is_moderated").default(false),
	moderatedBy: varchar("moderated_by"),
	moderatedAt: timestamp("moderated_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	dealerId: varchar("dealer_id"),
});

export const vehicleRegistrations = pgTable("vehicle_registrations", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	state: text().notNull(),
	city: text(),
	brand: text().notNull(),
	model: text().notNull(),
	variant: text(),
	fuelType: text("fuel_type").notNull(),
	transmission: text().notNull(),
	year: integer().notNull(),
	month: integer().notNull(),
	registrationsCount: integer("registrations_count").notNull(),
	popularityRank: integer("popularity_rank"),
	regionalMarketShare: numeric("regional_market_share", { precision: 5, scale:  2 }),
	dataSource: text("data_source").default('VAHAN').notNull(),
	verifiedAt: timestamp("verified_at", { mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	rtoCode: text("rto_code"),
}, (table) => [
	index("idx_registrations_count").using("btree", table.registrationsCount.asc().nullsLast().op("int4_ops")),
	index("idx_registrations_location").using("btree", table.state.asc().nullsLast().op("text_ops"), table.city.asc().nullsLast().op("text_ops")),
	index("idx_registrations_period").using("btree", table.year.asc().nullsLast().op("int4_ops"), table.month.asc().nullsLast().op("int4_ops")),
	index("idx_registrations_vehicle").using("btree", table.brand.asc().nullsLast().op("text_ops"), table.model.asc().nullsLast().op("text_ops"), table.fuelType.asc().nullsLast().op("text_ops")),
]);

export const listingMetrics = pgTable("listing_metrics", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	date: timestamp({ mode: 'string' }).notNull(),
	totalListings: integer("total_listings").default(0).notNull(),
	activeListings: integer("active_listings").default(0).notNull(),
	ethicalAiCount: integer("ethical_ai_count").default(0).notNull(),
	exclusiveDealerCount: integer("exclusive_dealer_count").default(0).notNull(),
	userDirectCount: integer("user_direct_count").default(0).notNull(),
	newAdditions: integer("new_additions").default(0).notNull(),
	removals: integer().default(0).notNull(),
	netChange: integer("net_change").default(0).notNull(),
	carDekhoCount: integer("car_dekho_count").default(0),
	olxCount: integer("olx_count").default(0),
	cars24Count: integer("cars24_count").default(0),
	carWaleCount: integer("car_wale_count").default(0),
	teamBhpCount: integer("team_bhp_count").default(0),
	otherPortalsCount: integer("other_portals_count").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_listing_metrics_date").using("btree", table.date.asc().nullsLast().op("timestamp_ops")),
]);

export const userStories = pgTable("user_stories", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id"),
	title: text().notNull(),
	content: text().notNull(),
	carBrand: text("car_brand"),
	carModel: text("car_model"),
	city: text(),
	images: text().array().default([""]),
	moderationStatus: text("moderation_status").default('pending'),
	moderatedAt: timestamp("moderated_at", { mode: 'string' }),
	aiModerationNotes: text("ai_moderation_notes"),
	cararthLinks: jsonb("cararth_links").default([]),
	featured: boolean().default(false),
	featuredUntil: timestamp("featured_until", { mode: 'string' }),
	views: integer().default(0),
	likes: integer().default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	email: text().notNull(),
	name: text(),
	frequency: text().default('weekly'),
	topics: text().array().default([""]),
	status: text().default('active'),
	unsubscribedAt: timestamp("unsubscribed_at", { mode: 'string' }),
	unsubscribeReason: text("unsubscribe_reason"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("newsletter_subscribers_email_key").on(table.email),
]);

export const polls = pgTable("polls", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	question: text().notNull(),
	options: jsonb().notNull(),
	category: text(),
	active: boolean().default(true),
	featured: boolean().default(false),
	totalVotes: integer("total_votes").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
});

export const pollVotes = pgTable("poll_votes", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	pollId: varchar("poll_id").notNull(),
	optionId: varchar("option_id").notNull(),
	userId: varchar("user_id"),
	visitorId: varchar("visitor_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const articleAnalytics = pgTable("article_analytics", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	articleId: varchar("article_id").notNull(),
	views: integer().default(0),
	uniqueViews: integer("unique_views").default(0),
	shares: integer().default(0),
	avgReadTime: integer("avg_read_time").default(0),
	scrollDepth: jsonb("scroll_depth").default({}),
	trafficSources: jsonb("traffic_sources").default({}),
	socialShares: jsonb("social_shares").default({}),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const contentGenerationLogs = pgTable("content_generation_logs", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	trigger: text().notNull(),
	status: text().notNull(),
	perplexityQuery: text("perplexity_query"),
	perplexityCitations: jsonb("perplexity_citations").default([]),
	grokPrompt: text("grok_prompt"),
	articleId: varchar("article_id"),
	articleTitle: text("article_title"),
	wordCount: integer("word_count"),
	backlinksCount: integer("backlinks_count"),
	generationTimeMs: integer("generation_time_ms"),
	perplexityTokens: integer("perplexity_tokens"),
	grokTokens: integer("grok_tokens"),
	errorMessage: text("error_message"),
	errorDetails: jsonb("error_details"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const aetherWatchlist = pgTable("aether_watchlist", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	page: text().notNull(),
	city: text().notNull(),
	intent: text(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_watchlist_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("idx_watchlist_city").using("btree", table.city.asc().nullsLast().op("text_ops")),
]);

export const cars = pgTable("cars", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	sellerId: varchar("seller_id").notNull(),
	title: text().notNull(),
	brand: text().notNull(),
	model: text().notNull(),
	year: integer().notNull(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	mileage: integer().notNull(),
	fuelType: text("fuel_type").notNull(),
	transmission: text().notNull(),
	owners: integer().default(1).notNull(),
	location: text().notNull(),
	city: text().notNull(),
	state: text().notNull(),
	description: text(),
	features: text().array().default([""]),
	images: text().array().default([""]),
	isVerified: boolean("is_verified").default(false),
	isSold: boolean("is_sold").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	isFeatured: boolean("is_featured").default(false),
	featuredExpiresAt: timestamp("featured_expires_at", { mode: 'string' }),
	source: text(),
	listingSource: text("listing_source").default('user_direct').notNull(),
	listingScore: numeric("listing_score", { precision: 5, scale:  2 }).default('0'),
	scoreBreakdown: jsonb("score_breakdown").default({}),
	demandIndex: numeric("demand_index", { precision: 3, scale:  2 }).default('0.5'),
	avgSellingPrice: numeric("avg_selling_price", { precision: 10, scale:  2 }),
	completeness: numeric({ precision: 3, scale:  2 }).default('0'),
	imageQualityAvg: numeric("image_quality_avg", { precision: 3, scale:  2 }).default('0'),
	googleComplianceScore: integer("google_compliance_score").default(0),
	priceFairnessLabel: varchar("price_fairness_label"),
});

export const cachedPortalListings = pgTable("cached_portal_listings", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	portal: text().notNull(),
	externalId: text("external_id").notNull(),
	url: text().notNull(),
	title: text().notNull(),
	brand: text().notNull(),
	model: text().notNull(),
	year: integer().notNull(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	mileage: integer(),
	fuelType: text("fuel_type"),
	transmission: text(),
	owners: integer().default(1),
	location: text().notNull(),
	city: text().notNull(),
	state: text(),
	description: text(),
	features: jsonb().default([]),
	images: jsonb().default([]),
	sellerType: text("seller_type"),
	verificationStatus: text("verification_status").default('unverified'),
	condition: text(),
	listingDate: timestamp("listing_date", { mode: 'string' }).notNull(),
	fetchedAt: timestamp("fetched_at", { mode: 'string' }).defaultNow(),
	sourceMeta: jsonb("source_meta").default({}),
	hash: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	qualityScore: integer("quality_score").default(50),
	sourceWeight: integer("source_weight").default(50),
	hasRealImage: boolean("has_real_image").default(false),
	specValid: boolean("spec_valid").default(true),
	imageAuthenticity: integer("image_authenticity").default(0),
	origin: text().default('scraped').notNull(),
	sourceId: varchar("source_id"),
	partnerUserId: varchar("partner_user_id"),
	partnerVerificationStatus: text("partner_verification_status").default('pending'),
	listingSource: text("listing_source").default('ethical_ai').notNull(),
	listingScore: numeric("listing_score", { precision: 5, scale:  2 }).default('0'),
	scoreBreakdown: jsonb("score_breakdown").default({}),
	demandIndex: numeric("demand_index", { precision: 3, scale:  2 }).default('0.5'),
	avgSellingPrice: numeric("avg_selling_price", { precision: 10, scale:  2 }),
	completeness: numeric({ precision: 3, scale:  2 }).default('0'),
	imageQualityAvg: numeric("image_quality_avg", { precision: 3, scale:  2 }).default('0'),
	googleComplianceScore: integer("google_compliance_score").default(0),
	priceFairnessLabel: varchar("price_fairness_label"),
}, (table) => [
	index("idx_cached_listing_score").using("btree", table.listingScore.asc().nullsLast().op("numeric_ops"), table.listingDate.asc().nullsLast().op("numeric_ops")),
	unique("cached_portal_listings_hash_key").on(table.hash),
]);

export const geoSweeps = pgTable("geo_sweeps", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	sweepType: text("sweep_type").default('manual').notNull(),
	promptText: text("prompt_text").notNull(),
	promptCategory: text("prompt_category"),
	aiProvider: text("ai_provider").notNull(),
	aiModel: text("ai_model").notNull(),
	aiResponse: text("ai_response").notNull(),
	cararthMentioned: boolean("cararth_mentioned").default(false),
	mentionContext: text("mention_context"),
	mentionPosition: integer("mention_position"),
	competitorsMentioned: text("competitors_mentioned").array(),
	responseQuality: integer("response_quality"),
	relevanceScore: numeric("relevance_score", { precision: 3, scale:  2 }),
	sweepDuration: integer("sweep_duration"),
	tokensUsed: integer("tokens_used"),
	cost: numeric({ precision: 10, scale:  6 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_geo_sweeps_category").using("btree", table.promptCategory.asc().nullsLast().op("text_ops")),
	index("idx_geo_sweeps_created").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_geo_sweeps_mentioned").using("btree", table.cararthMentioned.asc().nullsLast().op("bool_ops")),
]);

export const seoAudits = pgTable("seo_audits", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	auditType: text("audit_type").default('full').notNull(),
	overallScore: integer("overall_score").notNull(),
	sitemapScore: integer("sitemap_score"),
	schemaScore: integer("schema_score"),
	canonicalScore: integer("canonical_score"),
	performanceScore: integer("performance_score"),
	sitemapUrls: integer("sitemap_urls"),
	sitemapErrors: integer("sitemap_errors"),
	sitemapWarnings: integer("sitemap_warnings"),
	pagesChecked: integer("pages_checked"),
	pagesWithSchema: integer("pages_with_schema"),
	schemaTypes: text("schema_types").array(),
	schemaErrors: jsonb("schema_errors").default([]),
	canonicalIssues: integer("canonical_issues"),
	duplicateCanonicals: integer("duplicate_canonicals"),
	missingCanonicals: integer("missing_canonicals"),
	criticalIssues: jsonb("critical_issues").default([]),
	warnings: jsonb().default([]),
	recommendations: jsonb().default([]),
	auditDuration: integer("audit_duration"),
	pagesAudited: integer("pages_audited"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_seo_audits_created").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_seo_audits_score").using("btree", table.overallScore.asc().nullsLast().op("int4_ops")),
]);

export const aetherExperiments = pgTable("aether_experiments", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	hypothesis: text().notNull(),
	category: text().notNull(),
	status: text().default('draft').notNull(),
	baselineMetric: text("baseline_metric").notNull(),
	baselineValue: numeric("baseline_value", { precision: 10, scale:  2 }).notNull(),
	targetValue: numeric("target_value", { precision: 10, scale:  2 }).notNull(),
	actualValue: numeric("actual_value", { precision: 10, scale:  2 }),
	outcome: text(),
	confidenceLevel: numeric("confidence_level", { precision: 3, scale:  2 }),
	weight: numeric({ precision: 5, scale:  2 }).default('1.00'),
	weightDelta: numeric("weight_delta", { precision: 5, scale:  2 }).default('0'),
	implementationNotes: text("implementation_notes"),
	changesApplied: jsonb("changes_applied").default({}),
	startedAt: timestamp("started_at", { mode: 'string' }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	evaluatedAt: timestamp("evaluated_at", { mode: 'string' }),
	createdBy: varchar("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_aether_experiments_category").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("idx_aether_experiments_outcome").using("btree", table.outcome.asc().nullsLast().op("text_ops")),
	index("idx_aether_experiments_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
]);

export const aetherDeltas = pgTable("aether_deltas", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	date: timestamp({ mode: 'string' }).notNull(),
	page: text(),
	city: text(),
	source: text().notNull(),
	metric: text().notNull(),
	value: numeric({ precision: 10, scale:  4 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_deltas_date_city").using("btree", table.date.asc().nullsLast().op("timestamp_ops"), table.city.asc().nullsLast().op("text_ops")),
	index("idx_deltas_page_city").using("btree", table.page.asc().nullsLast().op("text_ops"), table.city.asc().nullsLast().op("text_ops")),
	index("idx_deltas_source").using("btree", table.source.asc().nullsLast().op("text_ops")),
]);

export const aetherActions = pgTable("aether_actions", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	date: timestamp({ mode: 'string' }).notNull(),
	priority: integer(),
	page: text(),
	city: text(),
	pillar: text(),
	title: text(),
	do: text(),
	dont: text(),
	suggestedFix: text("suggested_fix"),
	expectedUplift: numeric("expected_uplift", { precision: 5, scale:  2 }),
	effort: text(),
	confidence: numeric({ precision: 3, scale:  2 }),
	evidence: jsonb().default({}),
	status: text().default('open'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_actions_date_city").using("btree", table.date.asc().nullsLast().op("text_ops"), table.city.asc().nullsLast().op("text_ops")),
	index("idx_actions_priority").using("btree", table.priority.asc().nullsLast().op("int4_ops")),
	index("idx_actions_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
]);

export const aetherActionExperiments = pgTable("aether_action_experiments", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	actionId: varchar("action_id"),
	page: text(),
	city: text(),
	startedAt: timestamp("started_at", { mode: 'string' }),
	status: text().default('running'),
	targetMetrics: jsonb("target_metrics").default({}),
	baseline: jsonb().default({}),
	variant: jsonb().default({}),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_action_experiments_action").using("btree", table.actionId.asc().nullsLast().op("text_ops")),
	index("idx_action_experiments_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
]);

export const aetherDailyDigest = pgTable("aether_daily_digest", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	runAt: timestamp("run_at", { mode: 'string' }).notNull(),
	city: text().notNull(),
	actions: jsonb().default([]),
	tokenCostUsd: numeric("token_cost_usd", { precision: 8, scale:  4 }),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_daily_digest_city_date").using("btree", table.city.asc().nullsLast().op("text_ops"), table.runAt.asc().nullsLast().op("text_ops")),
]);

export const aetherCompetitors = pgTable("aether_competitors", {
	id: serial().primaryKey().notNull(),
	domain: varchar({ length: 255 }).notNull(),
	label: varchar({ length: 255 }).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("aether_competitors_domain_key").on(table.domain),
]);

export const aetherCompetitorSnapshots = pgTable("aether_competitor_snapshots", {
	id: serial().primaryKey().notNull(),
	domain: varchar({ length: 255 }).notNull(),
	date: timestamp({ mode: 'string' }).notNull(),
	kpis: jsonb().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("competitor_snapshots_date_idx").using("btree", table.date.asc().nullsLast().op("timestamp_ops")),
	index("competitor_snapshots_domain_date_idx").using("btree", table.domain.asc().nullsLast().op("text_ops"), table.date.asc().nullsLast().op("text_ops")),
]);

export const aetherBenchmarkScores = pgTable("aether_benchmark_scores", {
	id: serial().primaryKey().notNull(),
	date: timestamp({ mode: 'string' }).notNull(),
	domain: varchar({ length: 255 }).notNull(),
	pillar: varchar({ length: 100 }).notNull(),
	score: numeric({ precision: 5, scale:  2 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("benchmark_scores_date_idx").using("btree", table.date.asc().nullsLast().op("timestamp_ops")),
	index("benchmark_scores_domain_date_idx").using("btree", table.domain.asc().nullsLast().op("text_ops"), table.date.asc().nullsLast().op("text_ops")),
	index("benchmark_scores_pillar_date_idx").using("btree", table.pillar.asc().nullsLast().op("text_ops"), table.date.asc().nullsLast().op("text_ops")),
]);

export const aetherBenchRecommendations = pgTable("aether_bench_recommendations", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	date: timestamp({ mode: 'string' }).notNull(),
	pillar: varchar({ length: 100 }).notNull(),
	severity: varchar({ length: 50 }).notNull(),
	title: text().notNull(),
	do: text().notNull(),
	dont: text().notNull(),
	evidence: jsonb(),
	expectedUplift: numeric("expected_uplift", { precision: 5, scale:  3 }).notNull(),
	effort: varchar({ length: 50 }).notNull(),
	confidence: numeric({ precision: 5, scale:  3 }).notNull(),
	status: varchar({ length: 50 }).default('pending').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("bench_recommendations_date_idx").using("btree", table.date.asc().nullsLast().op("timestamp_ops")),
	index("bench_recommendations_pillar_date_idx").using("btree", table.pillar.asc().nullsLast().op("text_ops"), table.date.asc().nullsLast().op("timestamp_ops")),
	index("bench_recommendations_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
]);

export const aetherArticles = pgTable("aether_articles", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	city: text().notNull(),
	topic: text().notNull(),
	slug: varchar({ length: 255 }).notNull(),
	meta: jsonb().notNull(),
	schema: jsonb(),
	contentHtml: text("content_html").notNull(),
	geoIntro: text("geo_intro"),
	internalLinks: jsonb("internal_links").default([]),
	cta: jsonb(),
	seoChecklist: jsonb("seo_checklist"),
	status: varchar({ length: 50 }).default('draft').notNull(),
	cmsRef: text("cms_ref"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("articles_city_created_idx").using("btree", table.city.asc().nullsLast().op("text_ops"), table.createdAt.asc().nullsLast().op("text_ops")),
	index("articles_slug_idx").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	index("articles_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	unique("aether_articles_slug_key").on(table.slug),
]);

export const aetherProperties = pgTable("aether_properties", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	orgId: varchar("org_id").notNull(),
	source: text().notNull(),
	externalId: text("external_id").notNull(),
	displayName: text("display_name").notNull(),
	kind: text(),
	config: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.orgId],
			foreignColumns: [aetherOrganizations.id],
			name: "aether_properties_org_id_fkey"
		}),
]);

export const aetherArticleImpacts = pgTable("aether_article_impacts", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	articleId: varchar("article_id").notNull(),
	date: timestamp({ mode: 'string' }).notNull(),
	gsc: jsonb(),
	ga4: jsonb(),
	geo: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("article_impacts_article_date_idx").using("btree", table.articleId.asc().nullsLast().op("text_ops"), table.date.asc().nullsLast().op("text_ops")),
	index("article_impacts_date_idx").using("btree", table.date.asc().nullsLast().op("timestamp_ops")),
	foreignKey({
			columns: [table.articleId],
			foreignColumns: [aetherArticles.id],
			name: "aether_article_impacts_article_id_fkey"
		}),
]);

export const aetherOrganizations = pgTable("aether_organizations", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	domain: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const aetherUsers = pgTable("aether_users", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	orgId: varchar("org_id").notNull(),
	email: text().notNull(),
	name: text(),
	picture: text(),
	provider: text().notNull(),
	googleSub: text("google_sub"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.orgId],
			foreignColumns: [aetherOrganizations.id],
			name: "aether_users_org_id_fkey"
		}),
]);

export const aetherBingTokens = pgTable("aether_bing_tokens", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	accessToken: text("access_token").notNull(),
	refreshToken: text("refresh_token").notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	scopes: jsonb().default([]),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const aetherGoogleTokens = pgTable("aether_google_tokens", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	orgId: varchar("org_id").notNull(),
	tokenType: text("token_type").notNull(),
	credentials: jsonb().notNull(),
	scopes: jsonb(),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.orgId],
			foreignColumns: [aetherOrganizations.id],
			name: "aether_google_tokens_org_id_fkey"
		}),
]);

export const aetherMetaTokens = pgTable("aether_meta_tokens", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	orgId: varchar("org_id").notNull(),
	accessToken: text("access_token").notNull(),
	tokenType: text("token_type"),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	permissions: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.orgId],
			foreignColumns: [aetherOrganizations.id],
			name: "aether_meta_tokens_org_id_fkey"
		}),
]);

export const aetherBingSites = pgTable("aether_bing_sites", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	siteUrl: text("site_url").notNull(),
	verified: boolean().default(false),
	lastSync: timestamp("last_sync", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const aetherBingPerformance = pgTable("aether_bing_performance", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	date: timestamp({ mode: 'string' }).notNull(),
	siteUrl: text("site_url").notNull(),
	page: text(),
	query: text(),
	device: text(),
	country: text(),
	clicks: numeric().default('0'),
	impressions: numeric().default('0'),
	ctr: numeric({ precision: 5, scale:  4 }).default('0'),
	position: numeric({ precision: 5, scale:  2 }).default('0'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const aetherBingCrawlIssues = pgTable("aether_bing_crawl_issues", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	date: timestamp({ mode: 'string' }).notNull(),
	siteUrl: text("site_url").notNull(),
	url: text().notNull(),
	issueType: text("issue_type").notNull(),
	severity: text().notNull(),
	details: jsonb().default({}),
	resolved: boolean().default(false),
	resolvedAt: timestamp("resolved_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const aetherBingSitemaps = pgTable("aether_bing_sitemaps", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	date: timestamp({ mode: 'string' }).notNull(),
	siteUrl: text("site_url").notNull(),
	sitemapUrl: text("sitemap_url").notNull(),
	status: text().notNull(),
	urlsSubmitted: integer("urls_submitted").default(0),
	urlsIndexed: integer("urls_indexed").default(0),
	lastSubmitted: timestamp("last_submitted", { mode: 'string' }),
	lastProcessed: timestamp("last_processed", { mode: 'string' }),
	errors: jsonb().default([]),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const aetherBingBacklinks = pgTable("aether_bing_backlinks", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	date: timestamp({ mode: 'string' }).notNull(),
	siteUrl: text("site_url").notNull(),
	url: text().notNull(),
	referringDomains: integer("referring_domains").default(0),
	backlinks: integer().default(0),
	anchorTexts: jsonb("anchor_texts").default([]),
	topReferrers: jsonb("top_referrers").default([]),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});
