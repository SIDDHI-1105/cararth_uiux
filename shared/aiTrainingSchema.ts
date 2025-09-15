import { z } from "zod";

// Core training sample schema as per your specification
export const trainingDataSchema = z.object({
  id: z.string().uuid(),
  source: z.enum(["CarDekho", "OLX", "Cars24", "Facebook", "AutoTrader", "CarWale"]),
  raw_text: z.string().describe("Raw scraped HTML/text from source"),
  normalized: z.object({
    make: z.string(),
    model: z.string(), 
    year: z.number().int().min(1990).max(2025),
    price: z.number().positive(),
    mileage: z.number().nonnegative(),
    city: z.string(),
    images: z.array(z.string().url()),
    contact: z.string().describe("Masked or full if permitted"),
    vin: z.string().optional(),
    fuel_type: z.string().optional(),
    transmission: z.string().optional(),
    owners: z.number().int().positive().optional()
  }),
  human_labels: z.object({
    price_band: z.object({
      low: z.number().positive(),
      median: z.number().positive(), 
      high: z.number().positive()
    }),
    price_confidence: z.number().min(0).max(1),
    is_authentic: z.boolean(),
    image_real: z.boolean(),
    contact_valid: z.boolean(),
    fraud_flag: z.boolean(),
    fraud_reasons: z.array(z.enum([
      "stolen-vin", 
      "duplicate-listing", 
      "forged-images", 
      "unrealistic-price", 
      "phone-mismatch",
      "copy-paste-description"
    ])),
    dedupe_group_id: z.string().optional(),
    notes: z.string().optional()
  }),
  ingest_batch_ts: z.string().datetime()
});

// Model prediction outputs
export const aiPredictionSchema = z.object({
  id: z.string().uuid(),
  listing_id: z.string().uuid(),
  model_version: z.string(),
  predictions: z.object({
    price_band: z.object({
      low: z.number().positive(),
      median: z.number().positive(),
      high: z.number().positive()
    }),
    price_confidence: z.number().min(0).max(1),
    is_authentic: z.boolean(),
    image_real: z.boolean(),
    contact_valid: z.boolean(),
    fraud_flag: z.boolean(),
    fraud_reasons: z.array(z.string()),
    short_summary: z.string().max(200),
    explain: z.string().max(500),
    suggested_offer_range: z.object({
      min: z.number().positive(),
      max: z.number().positive()
    }).optional()
  }),
  model_latency_ms: z.number().nonnegative(),
  created_at: z.string().datetime()
});

// Training configuration per model
export const modelConfigSchema = z.object({
  model_id: z.string(),
  provider: z.enum(["openai", "gemini", "anthropic"]),
  task_type: z.enum([
    "price_modeling", 
    "authenticity_scoring", 
    "fraud_detection", 
    "normalization", 
    "summary_generation",
    "classification"
  ]),
  hyperparameters: z.object({
    learning_rate: z.number().positive().optional(),
    batch_size: z.number().int().positive().optional(),
    epochs: z.number().int().positive().optional(),
    temperature: z.number().min(0).max(2).optional(),
    max_tokens: z.number().int().positive().optional()
  }),
  training_data_count: z.number().int().nonnegative(),
  validation_split: z.number().min(0).max(1).default(0.2),
  target_metrics: z.object({
    price_mape_threshold: z.number().min(0).max(1).optional(),
    fraud_precision_threshold: z.number().min(0).max(1).optional(),
    auth_precision_threshold: z.number().min(0).max(1).optional()
  })
});

// Evaluation metrics tracking
export const evaluationMetricsSchema = z.object({
  id: z.string().uuid(),
  model_version: z.string(),
  evaluation_date: z.string().datetime(),
  dataset_size: z.number().int().positive(),
  metrics: z.object({
    // Price modeling metrics
    price_mae: z.number().nonnegative().optional(),
    price_mape: z.number().min(0).max(1).optional(),
    price_rmse: z.number().nonnegative().optional(),
    
    // Classification metrics
    fraud_precision: z.number().min(0).max(1).optional(),
    fraud_recall: z.number().min(0).max(1).optional(),
    fraud_f1: z.number().min(0).max(1).optional(),
    
    auth_precision: z.number().min(0).max(1).optional(),
    auth_recall: z.number().min(0).max(1).optional(),
    auth_f1: z.number().min(0).max(1).optional(),
    
    // Overall metrics
    accuracy: z.number().min(0).max(1).optional(),
    avg_latency_ms: z.number().nonnegative().optional()
  }),
  notes: z.string().optional()
});

// Types
export type TrainingData = z.infer<typeof trainingDataSchema>;
export type AiPrediction = z.infer<typeof aiPredictionSchema>;

// Authenticity scoring schema for fine-tuned model
export const authenticityScoreSchema = z.object({
  id: z.string().uuid(),
  listing_id: z.string().uuid(),
  overall_authenticity: z.number().min(0).max(100),
  price_authenticity: z.number().min(0).max(100),
  image_authenticity: z.number().min(0).max(100),
  contact_validity: z.number().min(0).max(100),
  fraud_indicators: z.array(z.string()),
  trust_signals: z.array(z.string()),
  confidence_score: z.number().min(0).max(1),
  model_version: z.string(),
  analysis_timestamp: z.string().datetime(),
  model_latency_ms: z.number().nonnegative()
});

export type AuthenticityScore = z.infer<typeof authenticityScoreSchema>;
export type ModelConfig = z.infer<typeof modelConfigSchema>;
export type EvaluationMetrics = z.infer<typeof evaluationMetricsSchema>;

// Hyderabad-specific market context for training
// Input validation schema for API endpoints
export const listingInputSchema = z.object({
  id: z.string().optional(),
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.number().int().min(1990).max(2025),
  price: z.number().positive("Price must be positive"),
  mileage: z.number().nonnegative("Mileage cannot be negative"),
  city: z.string().min(1, "City is required"),
  images: z.array(z.string()).default([]),
  contact: z.string().optional(),
  fuel_type: z.string().optional(),
  transmission: z.string().optional(),
  sellerType: z.string().optional(),
  description: z.string().optional()
});

// Request schemas for API endpoints
export const authenticityRequestSchema = z.object({
  listing: listingInputSchema
});

export const batchAuthenticityRequestSchema = z.object({
  listings: z.array(listingInputSchema).min(1, "At least one listing is required").max(50, "Maximum 50 listings allowed")
});

// Response schemas
export const authenticityResponseSchema = z.object({
  authenticity_score: authenticityScoreSchema,
  analysis_timestamp: z.string().datetime()
});

export const batchAuthenticityResponseSchema = z.object({
  results: z.array(z.object({
    listing_id: z.string().optional(),
    success: z.boolean(),
    authenticity_score: authenticityScoreSchema.optional(),
    error: z.string().optional()
  })),
  total_processed: z.number(),
  successful: z.number(),
  failed: z.number(),
  analysis_timestamp: z.string().datetime()
});

export type ListingInput = z.infer<typeof listingInputSchema>;
export type AuthenticityRequest = z.infer<typeof authenticityRequestSchema>;
export type BatchAuthenticityRequest = z.infer<typeof batchAuthenticityRequestSchema>;
export type AuthenticityResponse = z.infer<typeof authenticityResponseSchema>;
export type BatchAuthenticityResponse = z.infer<typeof batchAuthenticityResponseSchema>;

export const hyderabadMarketContext = {
  popular_brands: ["Maruti", "Hyundai", "Honda", "Toyota", "Tata", "Mahindra"],
  price_ranges: {
    budget: { min: 150000, max: 500000 },
    mid: { min: 500000, max: 1200000 },
    premium: { min: 1200000, max: 3000000 },
    luxury: { min: 3000000, max: 10000000 }
  },
  popular_areas: ["Jubilee Hills", "Banjara Hills", "Gachibowli", "Hitech City", "Secunderabad", "Kukatpally"],
  depreciation_rates: {
    year_1: 0.15,
    year_2: 0.12,
    year_3: 0.10,
    year_4_plus: 0.08
  }
};