// Zod schemas for external API response validation
import { z } from 'zod';

// Schema for Gemini API response structure
export const GeminiResponseSchema = z.object({
  text: z.string().optional(),
  candidates: z.array(z.object({
    content: z.object({
      parts: z.array(z.object({
        text: z.string()
      }))
    }),
    finishReason: z.string().optional()
  })).optional()
});

// Schema for price data from Gemini price analysis
export const PriceDataItemSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  source: z.string().min(1),
  price: z.number().positive().finite()
});

export const PriceAnalysisResponseSchema = z.object({
  priceData: z.array(PriceDataItemSchema).min(1).max(10)
});

// Schema for search result listings from Gemini web search
export const SearchListingSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  url: z.string().url(),
  source: z.string().min(1)
});

export const WebSearchResponseSchema = z.object({
  listings: z.array(SearchListingSchema).min(1).max(10)
});

// Schema for RSS feed items
export const RSSItemSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  content: z.string().optional(),
  contentSnippet: z.string().optional(),
  summary: z.string().optional(),
  link: z.string().url().optional(),
  pubDate: z.string().optional(),
  category: z.string().optional(),
  guid: z.string().optional(),
  creator: z.string().optional(),
  author: z.string().optional()
});

export const RSSFeedSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  link: z.string().url().optional(),
  items: z.array(RSSItemSchema).default([])
});

// Schema for community posts created from RSS feeds
export const CommunityPostSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  content: z.string().min(1),
  author: z.string().min(1),
  source: z.string().min(1),
  sourceUrl: z.string().url(),
  publishedAt: z.date(),
  category: z.string().min(1),
  attribution: z.string().min(1),
  isExternal: z.boolean(),
  coverImage: z.string().optional()
});

// Helper function to safely parse JSON with schema validation
export function safeParseJSON<T>(
  jsonString: string,
  schema: z.ZodSchema<T>,
  fallback?: T
): { success: boolean; data?: T; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    const validated = schema.safeParse(parsed);
    
    if (validated.success) {
      return { success: true, data: validated.data };
    } else {
      console.error('Schema validation failed:', validated.error.issues);
      return { 
        success: false, 
        error: `Schema validation failed: ${validated.error.issues.map(i => i.message).join(', ')}`,
        data: fallback
      };
    }
  } catch (parseError) {
    console.error('JSON parsing failed:', parseError);
    return { 
      success: false, 
      error: `JSON parsing failed: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
      data: fallback
    };
  }
}

// Helper function to validate external API responses
export function validateApiResponse<T>(
  response: any,
  schema: z.ZodSchema<T>,
  operationName: string
): { success: boolean; data?: T; error?: string } {
  try {
    const validated = schema.safeParse(response);
    
    if (validated.success) {
      return { success: true, data: validated.data };
    } else {
      console.error(`${operationName} validation failed:`, validated.error.issues);
      return { 
        success: false, 
        error: `${operationName} validation failed: ${validated.error.issues.map(i => i.message).join(', ')}`
      };
    }
  } catch (validationError) {
    console.error(`${operationName} validation error:`, validationError);
    return { 
      success: false, 
      error: `${operationName} validation error: ${validationError instanceof Error ? validationError.message : 'Unknown error'}`
    };
  }
}

// Type exports for TypeScript
export type PriceDataItem = z.infer<typeof PriceDataItemSchema>;
export type PriceAnalysisResponse = z.infer<typeof PriceAnalysisResponseSchema>;
export type SearchListing = z.infer<typeof SearchListingSchema>;
export type WebSearchResponse = z.infer<typeof WebSearchResponseSchema>;
export type RSSItem = z.infer<typeof RSSItemSchema>;
export type RSSFeed = z.infer<typeof RSSFeedSchema>;
export type CommunityPost = z.infer<typeof CommunityPostSchema>;
export type GeminiResponse = z.infer<typeof GeminiResponseSchema>;