-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "featured_listings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"car_id" varchar NOT NULL,
	"seller_id" varchar NOT NULL,
	"amount" numeric(8, 2) NOT NULL,
	"duration" integer NOT NULL,
	"start_date" timestamp DEFAULT now(),
	"end_date" timestamp NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"name" text NOT NULL,
	"password" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"is_premium" boolean DEFAULT false,
	"premium_expires_at" timestamp,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"updated_at" timestamp DEFAULT now(),
	"phone_verified" boolean DEFAULT false,
	"phone_verified_at" timestamp,
	"subscription_tier" text DEFAULT 'free',
	"subscription_status" text DEFAULT 'active',
	"subscription_expires_at" timestamp,
	"search_count" integer DEFAULT 0,
	"search_count_reset_at" timestamp DEFAULT now(),
	"role" text DEFAULT 'user',
	"email_verified" boolean DEFAULT false,
	"verification_token" varchar(255),
	"verification_token_expires_at" timestamp,
	"seller_type" text DEFAULT 'private',
	"consent_syndication" boolean DEFAULT false,
	"consent_timestamp" timestamp,
	"legal_agreement_version" varchar(50),
	"legal_agreement_accepted_at" timestamp,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "platform_posting_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" varchar NOT NULL,
	"platform" text NOT NULL,
	"posting_status" text NOT NULL,
	"platform_listing_id" text,
	"error_message" text,
	"posted_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "seller_inquiries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" varchar NOT NULL,
	"masked_contact_id" varchar NOT NULL,
	"buyer_name" text NOT NULL,
	"buyer_phone" text NOT NULL,
	"buyer_email" text NOT NULL,
	"message" text,
	"source" text NOT NULL,
	"is_routed" boolean DEFAULT false,
	"routed_at" timestamp,
	"seller_responded" boolean DEFAULT false,
	"responded_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "conversation_blocks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"blocker_id" varchar NOT NULL,
	"blocked_id" varchar NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"car_id" varchar NOT NULL,
	"buyer_id" varchar NOT NULL,
	"seller_id" varchar NOT NULL,
	"subject" text,
	"status" text DEFAULT 'active',
	"buyer_display_name" text NOT NULL,
	"seller_display_name" text NOT NULL,
	"last_message_at" timestamp,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "message_interactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"interaction_type" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar NOT NULL,
	"sender_id" varchar NOT NULL,
	"sender_type" text NOT NULL,
	"content" text NOT NULL,
	"message_type" text DEFAULT 'text',
	"offer_amount" numeric(10, 2),
	"offer_status" text,
	"is_system_message" boolean DEFAULT false,
	"is_moderated" boolean DEFAULT false,
	"moderation_status" text DEFAULT 'approved',
	"is_read" boolean DEFAULT false,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seller_listings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_id" varchar NOT NULL,
	"title" text NOT NULL,
	"brand" text NOT NULL,
	"model" text NOT NULL,
	"year" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"mileage" integer NOT NULL,
	"fuel_type" text NOT NULL,
	"transmission" text NOT NULL,
	"owners" integer DEFAULT 1 NOT NULL,
	"location" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"description" text,
	"features" text[] DEFAULT '{""}',
	"rc_book_document" text,
	"insurance_document" text,
	"front_photo" text,
	"rear_photo" text,
	"left_side_photo" text,
	"right_side_photo" text,
	"interior_photo" text,
	"engine_bay_photo" text,
	"additional_photos" text[] DEFAULT '{""}',
	"masked_contact_id" varchar DEFAULT gen_random_uuid(),
	"actual_phone" text NOT NULL,
	"actual_email" text NOT NULL,
	"posted_to_cars24" boolean DEFAULT false,
	"cars24_listing_id" text,
	"posted_to_cardekho" boolean DEFAULT false,
	"cardekho_listing_id" text,
	"posted_to_facebook_marketplace" boolean DEFAULT false,
	"facebook_marketplace_listing_id" text,
	"ai_generated_title" text,
	"ai_generated_description" text,
	"market_value_estimate" numeric(10, 2),
	"document_verification_status" text DEFAULT 'pending',
	"photo_verification_status" text DEFAULT 'pending',
	"listing_status" text DEFAULT 'draft',
	"view_count" integer DEFAULT 0,
	"inquiry_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"admin_override" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "user_search_activity" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"search_type" text NOT NULL,
	"search_filters" jsonb,
	"results_count" integer DEFAULT 0,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"plan" text NOT NULL,
	"status" text NOT NULL,
	"amount" numeric(8, 2) NOT NULL,
	"start_date" timestamp DEFAULT now(),
	"end_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"tier" text,
	"currency" text DEFAULT 'INR',
	"billing_cycle" text,
	"location_restriction" text,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "phone_verifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"phone_number" text NOT NULL,
	"verification_code" text NOT NULL,
	"verified" boolean DEFAULT false,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "anonymous_search_activity" (
	"id" serial PRIMARY KEY NOT NULL,
	"visitor_id" varchar(255) NOT NULL,
	"search_time" timestamp DEFAULT CURRENT_TIMESTAMP,
	"search_query" jsonb,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"ip_hash" varchar,
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "production_portal_listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text,
	"source_id" text,
	"normalized" jsonb,
	"raw" jsonb,
	"fetched_at" timestamp with time zone,
	"ingest_batch_ts" timestamp with time zone,
	"status" text DEFAULT 'raw',
	"confidence" numeric,
	"trust_score" numeric,
	"validation_notes" jsonb
);
--> statement-breakpoint
CREATE TABLE "listing_embeddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid,
	"vector" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "trusted_listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"canonical" jsonb,
	"trust_score" numeric,
	"source_list" jsonb,
	"published_at" timestamp with time zone,
	"status" text DEFAULT 'active',
	"removed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "daily_spend" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"model" text NOT NULL,
	"spend_usd" numeric DEFAULT '0',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_analysis_metrics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_name" text NOT NULL,
	"operation_type" text NOT NULL,
	"total_calls" integer DEFAULT 0,
	"successful_calls" integer DEFAULT 0,
	"failed_calls" integer DEFAULT 0,
	"average_processing_time" numeric(8, 2),
	"average_confidence" numeric(3, 2),
	"total_tokens_used" integer DEFAULT 0,
	"estimated_cost_usd" numeric(10, 4),
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "image_assets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" varchar NOT NULL,
	"portal" text NOT NULL,
	"page_url" text NOT NULL,
	"selector" text,
	"original_url" text NOT NULL,
	"storage_key" text,
	"width" integer,
	"height" integer,
	"file_size_bytes" integer,
	"content_type" text,
	"sha256_hash" text NOT NULL,
	"perceptual_hash" text,
	"authenticity_score" integer DEFAULT 0 NOT NULL,
	"passed_gate" boolean DEFAULT false NOT NULL,
	"rejection_reasons" text[] DEFAULT '{""}',
	"extracted_at" timestamp DEFAULT now(),
	"validated_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sarfaesi_jobs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text NOT NULL,
	"parameters" jsonb NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"total_found" integer DEFAULT 0,
	"authenticated_listings" integer DEFAULT 0,
	"errors" jsonb DEFAULT '[]'::jsonb,
	"started_at" timestamp,
	"finished_at" timestamp,
	"triggered_by_user_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "admin_audit_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" varchar NOT NULL,
	"action" text NOT NULL,
	"target_type" text,
	"target_id" varchar,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "llm_reports" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" varchar NOT NULL,
	"check_type" varchar NOT NULL,
	"llm_provider" varchar NOT NULL,
	"llm_model" varchar NOT NULL,
	"result" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"passed" boolean DEFAULT false NOT NULL,
	"risk_flags" text[],
	"processing_time_ms" integer,
	"cost_usd" numeric(10, 6),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "llm_reports_check_type_check" CHECK ((check_type)::text = ANY ((ARRAY['tos_extraction'::character varying, 'pii_detection'::character varying, 'copyright_validation'::character varying, 'data_normalization'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "listing_sources" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_name" varchar NOT NULL,
	"feed_type" varchar NOT NULL,
	"source_url" varchar,
	"field_mapping" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"legal_compliance_notes" text,
	"last_sync_at" timestamp,
	"sync_frequency_hours" integer,
	"health_status" varchar DEFAULT 'healthy' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "listing_sources_feed_type_check" CHECK ((feed_type)::text = ANY ((ARRAY['webhook'::character varying, 'csv'::character varying, 'sftp'::character varying, 'firecrawl'::character varying])::text[])),
	CONSTRAINT "listing_sources_health_status_check" CHECK ((health_status)::text = ANY ((ARRAY['healthy'::character varying, 'degraded'::character varying, 'down'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "canonical_listings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" varchar NOT NULL,
	"source_listing_id" varchar NOT NULL,
	"vin" varchar,
	"registration_number" varchar,
	"content_hash" varchar,
	"normalized_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"risk_score" integer DEFAULT 0,
	"flagged_reasons" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "canonical_listings_source_id_source_listing_id_key" UNIQUE("source_id","source_listing_id"),
	CONSTRAINT "canonical_listings_status_check" CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'flagged'::character varying, 'rejected'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "ingestion_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" varchar NOT NULL,
	"total_processed" integer DEFAULT 0,
	"new_listings" integer DEFAULT 0,
	"updated_listings" integer DEFAULT 0,
	"rejected_listings" integer DEFAULT 0,
	"status" varchar DEFAULT 'running' NOT NULL,
	"error_message" text,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"finished_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ingestion_logs_status_check" CHECK ((status)::text = ANY ((ARRAY['running'::character varying, 'success'::character varying, 'failed'::character varying, 'partial'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"car_id" varchar NOT NULL,
	"buyer_name" text NOT NULL,
	"buyer_phone" text NOT NULL,
	"buyer_email" text NOT NULL,
	"message" text,
	"created_at" timestamp DEFAULT now(),
	"seller_id" varchar,
	"buyer_phone_normalized" text,
	"seller_notified_at" timestamp,
	"seller_notification_method" text,
	"seller_notification_status" text DEFAULT 'pending',
	"seller_notification_error" text,
	"notification_retry_count" integer DEFAULT 0,
	"last_notification_attempt" timestamp
);
--> statement-breakpoint
CREATE TABLE "partner_invites" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" varchar NOT NULL,
	"listing_source_id" varchar NOT NULL,
	"email" text,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"used_by_user_id" varchar,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "partner_invites_token_key" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "partner_accounts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_source_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"role" text DEFAULT 'owner' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bulk_upload_jobs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_user_id" varchar NOT NULL,
	"listing_source_id" varchar NOT NULL,
	"csv_file_name" text,
	"csv_file_path" text,
	"total_rows" integer DEFAULT 0,
	"processed_rows" integer DEFAULT 0,
	"successful_listings" integer DEFAULT 0,
	"failed_listings" integer DEFAULT 0,
	"status" text DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"error_details" jsonb DEFAULT '[]'::jsonb,
	"started_at" timestamp,
	"finished_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "google_trends_data" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"search_term" text NOT NULL,
	"category" text DEFAULT 'automotive',
	"region" text NOT NULL,
	"region_name" text,
	"date" timestamp NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"week" integer,
	"search_volume" integer NOT NULL,
	"related_queries" text[] DEFAULT '{""}',
	"trend_direction" text,
	"change_percent" numeric(5, 2),
	"data_source" text DEFAULT 'GoogleTrends' NOT NULL,
	"collected_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "siam_sales_data" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"report_period" text NOT NULL,
	"brand" text NOT NULL,
	"model" text,
	"segment" text NOT NULL,
	"units_sold" integer NOT NULL,
	"growth_yoy" numeric(5, 2),
	"growth_mom" numeric(5, 2),
	"market_share" numeric(5, 2),
	"data_source" text DEFAULT 'SIAM' NOT NULL,
	"source_url" text,
	"verified_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "market_trends" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trend_type" text NOT NULL,
	"region" text NOT NULL,
	"brand" text,
	"model" text,
	"segment" text,
	"current_value" numeric(10, 2),
	"previous_value" numeric(10, 2),
	"change_percent" numeric(5, 2),
	"trend_direction" text NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"significance" text NOT NULL,
	"description" text,
	"data_points" integer NOT NULL,
	"confidence" numeric(3, 2) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_model_cache" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cache_key" text NOT NULL,
	"model" text NOT NULL,
	"provider" text NOT NULL,
	"prompt" text NOT NULL,
	"prompt_hash" text NOT NULL,
	"response" jsonb NOT NULL,
	"token_usage" jsonb,
	"hit_count" integer DEFAULT 0,
	"last_accessed" timestamp DEFAULT now(),
	"ttl_hours" integer DEFAULT 24,
	"estimated_cost" numeric(8, 4),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "ai_model_cache_cache_key_key" UNIQUE("cache_key")
);
--> statement-breakpoint
CREATE TABLE "deduplication_results" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" varchar NOT NULL,
	"platform" text NOT NULL,
	"is_duplicate" boolean NOT NULL,
	"confidence_score" numeric(3, 2) NOT NULL,
	"firecrawl_results" jsonb,
	"gemini_analysis" jsonb,
	"claude_validation" jsonb,
	"openai_decision" jsonb,
	"potential_duplicates" jsonb DEFAULT '[]'::jsonb,
	"skip_syndication" boolean DEFAULT false,
	"skip_reason" text,
	"processing_time_ms" integer,
	"total_cost" numeric(8, 4),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "scraper_health_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scraper_name" text NOT NULL,
	"scraper_type" text NOT NULL,
	"status" text NOT NULL,
	"total_found" integer DEFAULT 0,
	"new_listings_saved" integer DEFAULT 0,
	"duplicates_skipped" integer DEFAULT 0,
	"errors_count" integer DEFAULT 0,
	"started_at" timestamp NOT NULL,
	"completed_at" timestamp,
	"duration_ms" integer,
	"error_message" text,
	"error_stack" text,
	"retry_attempt" integer DEFAULT 0,
	"scheduled_run" boolean DEFAULT true,
	"triggered_by" text DEFAULT 'scheduler',
	"created_at" timestamp DEFAULT now(),
	"is_retry_pending" boolean DEFAULT false,
	"next_retry_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "seller_consent_log" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"seller_id" varchar NOT NULL,
	"consent_type" text NOT NULL,
	"consent_status" boolean NOT NULL,
	"terms_version" varchar NOT NULL,
	"ip_address" text NOT NULL,
	"user_agent" text,
	"platforms_consented" text[] DEFAULT '{""}',
	"consent_timestamp" timestamp DEFAULT now(),
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "syndication_execution_log" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" varchar NOT NULL,
	"seller_id" varchar NOT NULL,
	"platform" text NOT NULL,
	"status" text NOT NULL,
	"platform_listing_id" text,
	"platform_url" text,
	"powered_by_attribution" boolean DEFAULT true,
	"attribution_text" text,
	"error_message" text,
	"error_stack" text,
	"retry_count" integer DEFAULT 0,
	"next_retry_at" timestamp,
	"request_payload" jsonb,
	"response_payload" jsonb,
	"executed_at" timestamp DEFAULT now(),
	"succeeded_at" timestamp,
	"failed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "external_api_audit_log" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"api_provider" text NOT NULL,
	"api_endpoint" text NOT NULL,
	"http_method" text NOT NULL,
	"user_id" varchar,
	"listing_id" varchar,
	"operation_type" text NOT NULL,
	"request_headers" jsonb,
	"request_body" jsonb,
	"response_status" integer,
	"response_body" jsonb,
	"response_time_ms" integer,
	"estimated_cost" numeric(8, 4),
	"is_error" boolean DEFAULT false,
	"error_message" text,
	"error_code" text,
	"rate_limit_hit" boolean DEFAULT false,
	"rate_limit_reset" timestamp,
	"ip_address" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "dealers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dealer_name" text NOT NULL,
	"store_code" text NOT NULL,
	"contact_person" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"address" text NOT NULL,
	"city" text DEFAULT 'Hyderabad' NOT NULL,
	"state" text DEFAULT 'Telangana' NOT NULL,
	"api_key" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"monthly_upload_limit" integer DEFAULT 100,
	"current_month_uploads" integer DEFAULT 0,
	"limit_reset_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"oem_brand" text,
	"dealer_group" text,
	CONSTRAINT "dealers_store_code_key" UNIQUE("store_code"),
	CONSTRAINT "dealers_email_key" UNIQUE("email"),
	CONSTRAINT "dealers_api_key_key" UNIQUE("api_key")
);
--> statement-breakpoint
CREATE TABLE "dealer_vehicles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dealer_id" varchar NOT NULL,
	"vin" text NOT NULL,
	"make" text NOT NULL,
	"model" text NOT NULL,
	"year" integer NOT NULL,
	"price" integer NOT NULL,
	"mileage" integer NOT NULL,
	"condition" text NOT NULL,
	"fuel_type" text NOT NULL,
	"transmission" text NOT NULL,
	"color" text NOT NULL,
	"body_type" text NOT NULL,
	"primary_image" text NOT NULL,
	"additional_images" text[] DEFAULT '{""}',
	"dealer_phone" text NOT NULL,
	"dealer_address" text NOT NULL,
	"slug" text NOT NULL,
	"validation_status" text DEFAULT 'pending',
	"validation_errors" jsonb DEFAULT '[]'::jsonb,
	"validation_warnings" jsonb DEFAULT '[]'::jsonb,
	"is_price_outlier" boolean DEFAULT false,
	"median_price" integer,
	"is_duplicate" boolean DEFAULT false,
	"duplicate_of_vin" text,
	"upload_batch_id" varchar,
	"upload_method" text NOT NULL,
	"dealer_attested" boolean DEFAULT false,
	"attested_at" timestamp,
	"included_in_feed" boolean DEFAULT false,
	"last_feed_export" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "upload_batches" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dealer_id" varchar NOT NULL,
	"file_name" text NOT NULL,
	"file_size" integer NOT NULL,
	"row_count" integer NOT NULL,
	"status" text DEFAULT 'processing',
	"success_count" integer DEFAULT 0,
	"error_count" integer DEFAULT 0,
	"warning_count" integer DEFAULT 0,
	"has_image_zip" boolean DEFAULT false,
	"image_zip_path" text,
	"extracted_image_count" integer DEFAULT 0,
	"processing_errors" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "validation_reports" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dealer_id" varchar NOT NULL,
	"upload_batch_id" varchar,
	"vehicle_id" varchar,
	"validation_type" text NOT NULL,
	"total_checked" integer NOT NULL,
	"passed_count" integer DEFAULT 0,
	"failed_count" integer DEFAULT 0,
	"warning_count" integer DEFAULT 0,
	"validation_details" jsonb NOT NULL,
	"requires_review" boolean DEFAULT false,
	"reviewed_by" varchar,
	"reviewed_at" timestamp,
	"review_decision" text,
	"review_notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "google_vehicle_feeds" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dealer_id" varchar NOT NULL,
	"feed_data" jsonb NOT NULL,
	"vehicle_count" integer NOT NULL,
	"csv_url" text,
	"has_errors" boolean DEFAULT false,
	"error_summary" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_posts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_id" varchar NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"category" text NOT NULL,
	"is_external" boolean DEFAULT false,
	"source_url" text,
	"source_name" text,
	"attribution" text,
	"views" integer DEFAULT 0,
	"upvotes" integer DEFAULT 0,
	"downvotes" integer DEFAULT 0,
	"status" text DEFAULT 'published',
	"is_pinned" boolean DEFAULT false,
	"is_hot" boolean DEFAULT false,
	"is_moderated" boolean DEFAULT false,
	"moderated_by" varchar,
	"moderated_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"dealer_id" varchar
);
--> statement-breakpoint
CREATE TABLE "vehicle_registrations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"state" text NOT NULL,
	"city" text,
	"brand" text NOT NULL,
	"model" text NOT NULL,
	"variant" text,
	"fuel_type" text NOT NULL,
	"transmission" text NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"registrations_count" integer NOT NULL,
	"popularity_rank" integer,
	"regional_market_share" numeric(5, 2),
	"data_source" text DEFAULT 'VAHAN' NOT NULL,
	"verified_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"rto_code" text
);
--> statement-breakpoint
CREATE TABLE "listing_metrics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" timestamp NOT NULL,
	"total_listings" integer DEFAULT 0 NOT NULL,
	"active_listings" integer DEFAULT 0 NOT NULL,
	"ethical_ai_count" integer DEFAULT 0 NOT NULL,
	"exclusive_dealer_count" integer DEFAULT 0 NOT NULL,
	"user_direct_count" integer DEFAULT 0 NOT NULL,
	"new_additions" integer DEFAULT 0 NOT NULL,
	"removals" integer DEFAULT 0 NOT NULL,
	"net_change" integer DEFAULT 0 NOT NULL,
	"car_dekho_count" integer DEFAULT 0,
	"olx_count" integer DEFAULT 0,
	"cars24_count" integer DEFAULT 0,
	"car_wale_count" integer DEFAULT 0,
	"team_bhp_count" integer DEFAULT 0,
	"other_portals_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_stories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"car_brand" text,
	"car_model" text,
	"city" text,
	"images" text[] DEFAULT '{""}',
	"moderation_status" text DEFAULT 'pending',
	"moderated_at" timestamp,
	"ai_moderation_notes" text,
	"cararth_links" jsonb DEFAULT '[]'::jsonb,
	"featured" boolean DEFAULT false,
	"featured_until" timestamp,
	"views" integer DEFAULT 0,
	"likes" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscribers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"frequency" text DEFAULT 'weekly',
	"topics" text[] DEFAULT '{""}',
	"status" text DEFAULT 'active',
	"unsubscribed_at" timestamp,
	"unsubscribe_reason" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "newsletter_subscribers_email_key" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "polls" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question" text NOT NULL,
	"options" jsonb NOT NULL,
	"category" text,
	"active" boolean DEFAULT true,
	"featured" boolean DEFAULT false,
	"total_votes" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "poll_votes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"poll_id" varchar NOT NULL,
	"option_id" varchar NOT NULL,
	"user_id" varchar,
	"visitor_id" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "article_analytics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_id" varchar NOT NULL,
	"views" integer DEFAULT 0,
	"unique_views" integer DEFAULT 0,
	"shares" integer DEFAULT 0,
	"avg_read_time" integer DEFAULT 0,
	"scroll_depth" jsonb DEFAULT '{}'::jsonb,
	"traffic_sources" jsonb DEFAULT '{}'::jsonb,
	"social_shares" jsonb DEFAULT '{}'::jsonb,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "content_generation_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trigger" text NOT NULL,
	"status" text NOT NULL,
	"perplexity_query" text,
	"perplexity_citations" jsonb DEFAULT '[]'::jsonb,
	"grok_prompt" text,
	"article_id" varchar,
	"article_title" text,
	"word_count" integer,
	"backlinks_count" integer,
	"generation_time_ms" integer,
	"perplexity_tokens" integer,
	"grok_tokens" integer,
	"error_message" text,
	"error_details" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "aether_watchlist" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page" text NOT NULL,
	"city" text NOT NULL,
	"intent" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cars" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_id" varchar NOT NULL,
	"title" text NOT NULL,
	"brand" text NOT NULL,
	"model" text NOT NULL,
	"year" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"mileage" integer NOT NULL,
	"fuel_type" text NOT NULL,
	"transmission" text NOT NULL,
	"owners" integer DEFAULT 1 NOT NULL,
	"location" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"description" text,
	"features" text[] DEFAULT '{""}',
	"images" text[] DEFAULT '{""}',
	"is_verified" boolean DEFAULT false,
	"is_sold" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"is_featured" boolean DEFAULT false,
	"featured_expires_at" timestamp,
	"source" text,
	"listing_source" text DEFAULT 'user_direct' NOT NULL,
	"listing_score" numeric(5, 2) DEFAULT '0',
	"score_breakdown" jsonb DEFAULT '{}'::jsonb,
	"demand_index" numeric(3, 2) DEFAULT '0.5',
	"avg_selling_price" numeric(10, 2),
	"completeness" numeric(3, 2) DEFAULT '0',
	"image_quality_avg" numeric(3, 2) DEFAULT '0',
	"google_compliance_score" integer DEFAULT 0,
	"price_fairness_label" varchar
);
--> statement-breakpoint
CREATE TABLE "cached_portal_listings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"portal" text NOT NULL,
	"external_id" text NOT NULL,
	"url" text NOT NULL,
	"title" text NOT NULL,
	"brand" text NOT NULL,
	"model" text NOT NULL,
	"year" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"mileage" integer,
	"fuel_type" text,
	"transmission" text,
	"owners" integer DEFAULT 1,
	"location" text NOT NULL,
	"city" text NOT NULL,
	"state" text,
	"description" text,
	"features" jsonb DEFAULT '[]'::jsonb,
	"images" jsonb DEFAULT '[]'::jsonb,
	"seller_type" text,
	"verification_status" text DEFAULT 'unverified',
	"condition" text,
	"listing_date" timestamp NOT NULL,
	"fetched_at" timestamp DEFAULT now(),
	"source_meta" jsonb DEFAULT '{}'::jsonb,
	"hash" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"quality_score" integer DEFAULT 50,
	"source_weight" integer DEFAULT 50,
	"has_real_image" boolean DEFAULT false,
	"spec_valid" boolean DEFAULT true,
	"image_authenticity" integer DEFAULT 0,
	"origin" text DEFAULT 'scraped' NOT NULL,
	"source_id" varchar,
	"partner_user_id" varchar,
	"partner_verification_status" text DEFAULT 'pending',
	"listing_source" text DEFAULT 'ethical_ai' NOT NULL,
	"listing_score" numeric(5, 2) DEFAULT '0',
	"score_breakdown" jsonb DEFAULT '{}'::jsonb,
	"demand_index" numeric(3, 2) DEFAULT '0.5',
	"avg_selling_price" numeric(10, 2),
	"completeness" numeric(3, 2) DEFAULT '0',
	"image_quality_avg" numeric(3, 2) DEFAULT '0',
	"google_compliance_score" integer DEFAULT 0,
	"price_fairness_label" varchar,
	CONSTRAINT "cached_portal_listings_hash_key" UNIQUE("hash")
);
--> statement-breakpoint
CREATE TABLE "geo_sweeps" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sweep_type" text DEFAULT 'manual' NOT NULL,
	"prompt_text" text NOT NULL,
	"prompt_category" text,
	"ai_provider" text NOT NULL,
	"ai_model" text NOT NULL,
	"ai_response" text NOT NULL,
	"cararth_mentioned" boolean DEFAULT false,
	"mention_context" text,
	"mention_position" integer,
	"competitors_mentioned" text[],
	"response_quality" integer,
	"relevance_score" numeric(3, 2),
	"sweep_duration" integer,
	"tokens_used" integer,
	"cost" numeric(10, 6),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "seo_audits" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"audit_type" text DEFAULT 'full' NOT NULL,
	"overall_score" integer NOT NULL,
	"sitemap_score" integer,
	"schema_score" integer,
	"canonical_score" integer,
	"performance_score" integer,
	"sitemap_urls" integer,
	"sitemap_errors" integer,
	"sitemap_warnings" integer,
	"pages_checked" integer,
	"pages_with_schema" integer,
	"schema_types" text[],
	"schema_errors" jsonb DEFAULT '[]'::jsonb,
	"canonical_issues" integer,
	"duplicate_canonicals" integer,
	"missing_canonicals" integer,
	"critical_issues" jsonb DEFAULT '[]'::jsonb,
	"warnings" jsonb DEFAULT '[]'::jsonb,
	"recommendations" jsonb DEFAULT '[]'::jsonb,
	"audit_duration" integer,
	"pages_audited" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "aether_experiments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"hypothesis" text NOT NULL,
	"category" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"baseline_metric" text NOT NULL,
	"baseline_value" numeric(10, 2) NOT NULL,
	"target_value" numeric(10, 2) NOT NULL,
	"actual_value" numeric(10, 2),
	"outcome" text,
	"confidence_level" numeric(3, 2),
	"weight" numeric(5, 2) DEFAULT '1.00',
	"weight_delta" numeric(5, 2) DEFAULT '0',
	"implementation_notes" text,
	"changes_applied" jsonb DEFAULT '{}'::jsonb,
	"started_at" timestamp,
	"completed_at" timestamp,
	"evaluated_at" timestamp,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "aether_deltas" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" timestamp NOT NULL,
	"page" text,
	"city" text,
	"source" text NOT NULL,
	"metric" text NOT NULL,
	"value" numeric(10, 4),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "aether_actions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" timestamp NOT NULL,
	"priority" integer,
	"page" text,
	"city" text,
	"pillar" text,
	"title" text,
	"do" text,
	"dont" text,
	"suggested_fix" text,
	"expected_uplift" numeric(5, 2),
	"effort" text,
	"confidence" numeric(3, 2),
	"evidence" jsonb DEFAULT '{}'::jsonb,
	"status" text DEFAULT 'open',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "aether_action_experiments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"action_id" varchar,
	"page" text,
	"city" text,
	"started_at" timestamp,
	"status" text DEFAULT 'running',
	"target_metrics" jsonb DEFAULT '{}'::jsonb,
	"baseline" jsonb DEFAULT '{}'::jsonb,
	"variant" jsonb DEFAULT '{}'::jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "aether_daily_digest" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_at" timestamp NOT NULL,
	"city" text NOT NULL,
	"actions" jsonb DEFAULT '[]'::jsonb,
	"token_cost_usd" numeric(8, 4),
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "aether_competitors" (
	"id" serial PRIMARY KEY NOT NULL,
	"domain" varchar(255) NOT NULL,
	"label" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "aether_competitors_domain_key" UNIQUE("domain")
);
--> statement-breakpoint
CREATE TABLE "aether_competitor_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"domain" varchar(255) NOT NULL,
	"date" timestamp NOT NULL,
	"kpis" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "aether_benchmark_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" timestamp NOT NULL,
	"domain" varchar(255) NOT NULL,
	"pillar" varchar(100) NOT NULL,
	"score" numeric(5, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "aether_bench_recommendations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" timestamp NOT NULL,
	"pillar" varchar(100) NOT NULL,
	"severity" varchar(50) NOT NULL,
	"title" text NOT NULL,
	"do" text NOT NULL,
	"dont" text NOT NULL,
	"evidence" jsonb,
	"expected_uplift" numeric(5, 3) NOT NULL,
	"effort" varchar(50) NOT NULL,
	"confidence" numeric(5, 3) NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "aether_articles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"city" text NOT NULL,
	"topic" text NOT NULL,
	"slug" varchar(255) NOT NULL,
	"meta" jsonb NOT NULL,
	"schema" jsonb,
	"content_html" text NOT NULL,
	"geo_intro" text,
	"internal_links" jsonb DEFAULT '[]'::jsonb,
	"cta" jsonb,
	"seo_checklist" jsonb,
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"cms_ref" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "aether_articles_slug_key" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "aether_properties" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" varchar NOT NULL,
	"source" text NOT NULL,
	"external_id" text NOT NULL,
	"display_name" text NOT NULL,
	"kind" text,
	"config" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "aether_article_impacts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_id" varchar NOT NULL,
	"date" timestamp NOT NULL,
	"gsc" jsonb,
	"ga4" jsonb,
	"geo" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "aether_organizations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"domain" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "aether_users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" varchar NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"picture" text,
	"provider" text NOT NULL,
	"google_sub" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "aether_bing_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"scopes" jsonb DEFAULT '[]'::jsonb,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "aether_google_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" varchar NOT NULL,
	"token_type" text NOT NULL,
	"credentials" jsonb NOT NULL,
	"scopes" jsonb,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "aether_meta_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" varchar NOT NULL,
	"access_token" text NOT NULL,
	"token_type" text,
	"expires_at" timestamp,
	"permissions" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "aether_bing_sites" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"site_url" text NOT NULL,
	"verified" boolean DEFAULT false,
	"last_sync" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "aether_bing_performance" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" timestamp NOT NULL,
	"site_url" text NOT NULL,
	"page" text,
	"query" text,
	"device" text,
	"country" text,
	"clicks" numeric DEFAULT '0',
	"impressions" numeric DEFAULT '0',
	"ctr" numeric(5, 4) DEFAULT '0',
	"position" numeric(5, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "aether_bing_crawl_issues" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" timestamp NOT NULL,
	"site_url" text NOT NULL,
	"url" text NOT NULL,
	"issue_type" text NOT NULL,
	"severity" text NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb,
	"resolved" boolean DEFAULT false,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "aether_bing_sitemaps" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" timestamp NOT NULL,
	"site_url" text NOT NULL,
	"sitemap_url" text NOT NULL,
	"status" text NOT NULL,
	"urls_submitted" integer DEFAULT 0,
	"urls_indexed" integer DEFAULT 0,
	"last_submitted" timestamp,
	"last_processed" timestamp,
	"errors" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "aether_bing_backlinks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" timestamp NOT NULL,
	"site_url" text NOT NULL,
	"url" text NOT NULL,
	"referring_domains" integer DEFAULT 0,
	"backlinks" integer DEFAULT 0,
	"anchor_texts" jsonb DEFAULT '[]'::jsonb,
	"top_referrers" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "listing_embeddings" ADD CONSTRAINT "listing_embeddings_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."production_portal_listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "llm_reports" ADD CONSTRAINT "llm_reports_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."canonical_listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "canonical_listings" ADD CONSTRAINT "canonical_listings_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "public"."listing_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingestion_logs" ADD CONSTRAINT "ingestion_logs_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "public"."listing_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aether_properties" ADD CONSTRAINT "aether_properties_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."aether_organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aether_article_impacts" ADD CONSTRAINT "aether_article_impacts_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "public"."aether_articles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aether_users" ADD CONSTRAINT "aether_users_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."aether_organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aether_google_tokens" ADD CONSTRAINT "aether_google_tokens_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."aether_organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aether_meta_tokens" ADD CONSTRAINT "aether_meta_tokens_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."aether_organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_session_expire" ON "sessions" USING btree ("expire" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_production_listings_batch_ts" ON "production_portal_listings" USING btree ("ingest_batch_ts" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_production_listings_confidence" ON "production_portal_listings" USING btree ("confidence" numeric_ops);--> statement-breakpoint
CREATE INDEX "idx_production_listings_status" ON "production_portal_listings" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_production_listings_trust_score" ON "production_portal_listings" USING btree ("trust_score" numeric_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "idx_production_listings_unique" ON "production_portal_listings" USING btree ("source" text_ops,"source_id" timestamptz_ops,"ingest_batch_ts" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_listing_embeddings_created_at" ON "listing_embeddings" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_listing_embeddings_listing_id" ON "listing_embeddings" USING btree ("listing_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_trusted_listings_active" ON "trusted_listings" USING btree ("status" text_ops,"removed_at" text_ops) WHERE (removed_at IS NULL);--> statement-breakpoint
CREATE INDEX "idx_trusted_listings_published_at" ON "trusted_listings" USING btree ("published_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_trusted_listings_status" ON "trusted_listings" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_trusted_listings_trust_score" ON "trusted_listings" USING btree ("trust_score" numeric_ops);--> statement-breakpoint
CREATE INDEX "idx_daily_spend_date" ON "daily_spend" USING btree ("date" date_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "idx_daily_spend_date_model" ON "daily_spend" USING btree ("date" date_ops,"model" date_ops);--> statement-breakpoint
CREATE INDEX "idx_image_assets_listing" ON "image_assets" USING btree ("listing_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_image_assets_passed_gate" ON "image_assets" USING btree ("passed_gate" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_image_assets_sha256" ON "image_assets" USING btree ("sha256_hash" text_ops);--> statement-breakpoint
CREATE INDEX "idx_sarfaesi_jobs_source" ON "sarfaesi_jobs" USING btree ("source" text_ops);--> statement-breakpoint
CREATE INDEX "idx_sarfaesi_jobs_status" ON "sarfaesi_jobs" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_sarfaesi_jobs_user" ON "sarfaesi_jobs" USING btree ("triggered_by_user_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_admin_audit_action" ON "admin_audit_logs" USING btree ("action" text_ops);--> statement-breakpoint
CREATE INDEX "idx_admin_audit_actor" ON "admin_audit_logs" USING btree ("actor_user_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_admin_audit_created" ON "admin_audit_logs" USING btree ("created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_partner_invites_source" ON "partner_invites" USING btree ("listing_source_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_partner_invites_token" ON "partner_invites" USING btree ("token" text_ops);--> statement-breakpoint
CREATE INDEX "idx_partner_accounts_source" ON "partner_accounts" USING btree ("listing_source_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_partner_accounts_user" ON "partner_accounts" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_bulk_upload_partner" ON "bulk_upload_jobs" USING btree ("partner_user_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_bulk_upload_status" ON "bulk_upload_jobs" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_trends_date" ON "google_trends_data" USING btree ("date" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_trends_region" ON "google_trends_data" USING btree ("region" text_ops);--> statement-breakpoint
CREATE INDEX "idx_trends_term" ON "google_trends_data" USING btree ("search_term" text_ops);--> statement-breakpoint
CREATE INDEX "idx_trends_volume" ON "google_trends_data" USING btree ("search_volume" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_siam_brand_model" ON "siam_sales_data" USING btree ("brand" text_ops,"model" text_ops);--> statement-breakpoint
CREATE INDEX "idx_siam_period" ON "siam_sales_data" USING btree ("year" int4_ops,"month" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_siam_units" ON "siam_sales_data" USING btree ("units_sold" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_trends_significance" ON "market_trends" USING btree ("significance" text_ops);--> statement-breakpoint
CREATE INDEX "idx_trends_type_region" ON "market_trends" USING btree ("trend_type" text_ops,"region" text_ops);--> statement-breakpoint
CREATE INDEX "idx_trends_vehicle" ON "market_trends" USING btree ("brand" text_ops,"model" text_ops);--> statement-breakpoint
CREATE INDEX "idx_ai_cache_key" ON "ai_model_cache" USING btree ("cache_key" text_ops);--> statement-breakpoint
CREATE INDEX "idx_ai_cache_last_accessed" ON "ai_model_cache" USING btree ("last_accessed" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_ai_cache_model_provider" ON "ai_model_cache" USING btree ("model" text_ops,"provider" text_ops);--> statement-breakpoint
CREATE INDEX "idx_ai_cache_prompt_hash" ON "ai_model_cache" USING btree ("prompt_hash" text_ops);--> statement-breakpoint
CREATE INDEX "idx_dedup_duplicate" ON "deduplication_results" USING btree ("is_duplicate" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_dedup_listing" ON "deduplication_results" USING btree ("listing_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_dedup_platform" ON "deduplication_results" USING btree ("platform" text_ops);--> statement-breakpoint
CREATE INDEX "idx_scraper_health_name" ON "scraper_health_logs" USING btree ("scraper_name" text_ops);--> statement-breakpoint
CREATE INDEX "idx_scraper_health_started" ON "scraper_health_logs" USING btree ("started_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_scraper_health_status" ON "scraper_health_logs" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_consent_log_status" ON "seller_consent_log" USING btree ("consent_status" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_consent_log_timestamp" ON "seller_consent_log" USING btree ("consent_timestamp" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_consent_log_user" ON "seller_consent_log" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_syndication_listing" ON "syndication_execution_log" USING btree ("listing_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_syndication_platform" ON "syndication_execution_log" USING btree ("platform" text_ops);--> statement-breakpoint
CREATE INDEX "idx_syndication_seller" ON "syndication_execution_log" USING btree ("seller_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_syndication_status" ON "syndication_execution_log" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_api_audit_created" ON "external_api_audit_log" USING btree ("created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_api_audit_error" ON "external_api_audit_log" USING btree ("is_error" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_api_audit_listing" ON "external_api_audit_log" USING btree ("listing_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_api_audit_operation" ON "external_api_audit_log" USING btree ("operation_type" text_ops);--> statement-breakpoint
CREATE INDEX "idx_api_audit_provider" ON "external_api_audit_log" USING btree ("api_provider" text_ops);--> statement-breakpoint
CREATE INDEX "idx_api_audit_user" ON "external_api_audit_log" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_dealers_api_key" ON "dealers" USING btree ("api_key" text_ops);--> statement-breakpoint
CREATE INDEX "idx_dealers_oem" ON "dealers" USING btree ("oem_brand" text_ops);--> statement-breakpoint
CREATE INDEX "idx_dealers_store_code" ON "dealers" USING btree ("store_code" text_ops);--> statement-breakpoint
CREATE INDEX "idx_dealer_vehicles_dealer" ON "dealer_vehicles" USING btree ("dealer_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_dealer_vehicles_slug" ON "dealer_vehicles" USING btree ("slug" text_ops);--> statement-breakpoint
CREATE INDEX "idx_dealer_vehicles_status" ON "dealer_vehicles" USING btree ("validation_status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_dealer_vehicles_vin" ON "dealer_vehicles" USING btree ("vin" text_ops);--> statement-breakpoint
CREATE INDEX "idx_upload_batches_dealer" ON "upload_batches" USING btree ("dealer_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_upload_batches_status" ON "upload_batches" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_validation_reports_batch" ON "validation_reports" USING btree ("upload_batch_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_validation_reports_dealer" ON "validation_reports" USING btree ("dealer_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_validation_reports_review" ON "validation_reports" USING btree ("requires_review" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_google_feed_dealer" ON "google_vehicle_feeds" USING btree ("dealer_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_google_feed_expires" ON "google_vehicle_feeds" USING btree ("expires_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_registrations_count" ON "vehicle_registrations" USING btree ("registrations_count" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_registrations_location" ON "vehicle_registrations" USING btree ("state" text_ops,"city" text_ops);--> statement-breakpoint
CREATE INDEX "idx_registrations_period" ON "vehicle_registrations" USING btree ("year" int4_ops,"month" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_registrations_vehicle" ON "vehicle_registrations" USING btree ("brand" text_ops,"model" text_ops,"fuel_type" text_ops);--> statement-breakpoint
CREATE INDEX "idx_listing_metrics_date" ON "listing_metrics" USING btree ("date" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_watchlist_active" ON "aether_watchlist" USING btree ("is_active" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_watchlist_city" ON "aether_watchlist" USING btree ("city" text_ops);--> statement-breakpoint
CREATE INDEX "idx_cached_listing_score" ON "cached_portal_listings" USING btree ("listing_score" numeric_ops,"listing_date" numeric_ops);--> statement-breakpoint
CREATE INDEX "idx_geo_sweeps_category" ON "geo_sweeps" USING btree ("prompt_category" text_ops);--> statement-breakpoint
CREATE INDEX "idx_geo_sweeps_created" ON "geo_sweeps" USING btree ("created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_geo_sweeps_mentioned" ON "geo_sweeps" USING btree ("cararth_mentioned" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_seo_audits_created" ON "seo_audits" USING btree ("created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_seo_audits_score" ON "seo_audits" USING btree ("overall_score" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_aether_experiments_category" ON "aether_experiments" USING btree ("category" text_ops);--> statement-breakpoint
CREATE INDEX "idx_aether_experiments_outcome" ON "aether_experiments" USING btree ("outcome" text_ops);--> statement-breakpoint
CREATE INDEX "idx_aether_experiments_status" ON "aether_experiments" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_deltas_date_city" ON "aether_deltas" USING btree ("date" timestamp_ops,"city" text_ops);--> statement-breakpoint
CREATE INDEX "idx_deltas_page_city" ON "aether_deltas" USING btree ("page" text_ops,"city" text_ops);--> statement-breakpoint
CREATE INDEX "idx_deltas_source" ON "aether_deltas" USING btree ("source" text_ops);--> statement-breakpoint
CREATE INDEX "idx_actions_date_city" ON "aether_actions" USING btree ("date" text_ops,"city" text_ops);--> statement-breakpoint
CREATE INDEX "idx_actions_priority" ON "aether_actions" USING btree ("priority" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_actions_status" ON "aether_actions" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_action_experiments_action" ON "aether_action_experiments" USING btree ("action_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_action_experiments_status" ON "aether_action_experiments" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_daily_digest_city_date" ON "aether_daily_digest" USING btree ("city" text_ops,"run_at" text_ops);--> statement-breakpoint
CREATE INDEX "competitor_snapshots_date_idx" ON "aether_competitor_snapshots" USING btree ("date" timestamp_ops);--> statement-breakpoint
CREATE INDEX "competitor_snapshots_domain_date_idx" ON "aether_competitor_snapshots" USING btree ("domain" text_ops,"date" text_ops);--> statement-breakpoint
CREATE INDEX "benchmark_scores_date_idx" ON "aether_benchmark_scores" USING btree ("date" timestamp_ops);--> statement-breakpoint
CREATE INDEX "benchmark_scores_domain_date_idx" ON "aether_benchmark_scores" USING btree ("domain" text_ops,"date" text_ops);--> statement-breakpoint
CREATE INDEX "benchmark_scores_pillar_date_idx" ON "aether_benchmark_scores" USING btree ("pillar" text_ops,"date" text_ops);--> statement-breakpoint
CREATE INDEX "bench_recommendations_date_idx" ON "aether_bench_recommendations" USING btree ("date" timestamp_ops);--> statement-breakpoint
CREATE INDEX "bench_recommendations_pillar_date_idx" ON "aether_bench_recommendations" USING btree ("pillar" text_ops,"date" timestamp_ops);--> statement-breakpoint
CREATE INDEX "bench_recommendations_status_idx" ON "aether_bench_recommendations" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "articles_city_created_idx" ON "aether_articles" USING btree ("city" text_ops,"created_at" text_ops);--> statement-breakpoint
CREATE INDEX "articles_slug_idx" ON "aether_articles" USING btree ("slug" text_ops);--> statement-breakpoint
CREATE INDEX "articles_status_idx" ON "aether_articles" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "article_impacts_article_date_idx" ON "aether_article_impacts" USING btree ("article_id" text_ops,"date" text_ops);--> statement-breakpoint
CREATE INDEX "article_impacts_date_idx" ON "aether_article_impacts" USING btree ("date" timestamp_ops);
*/