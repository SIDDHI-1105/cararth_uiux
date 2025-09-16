/**
 * GPT-5 Enrichment Service for CarArth
 * 
 * Optional AI enrichment for car listings using GPT-5
 * Adds intelligent summaries highlighting pros/cons
 */

import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface CarListingEnrichment {
  summary: string;
  prosAndCons: {
    pros: string[];
    cons: string[];
  };
  marketInsight: string;
  confidence: number;
}

export class EnrichmentService {
  /**
   * Enrich a car listing with GPT-5 analysis
   */
  async enrichListing(listing: {
    make: string;
    model: string;
    year: number;
    price: number;
    fuelType?: string;
    mileage?: number;
    city: string;
    description?: string;
  }): Promise<CarListingEnrichment | null> {
    
    // Skip enrichment if no OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.log('⚠️ OpenAI API key not found, skipping enrichment');
      return null;
    }

    try {
      const prompt = this.buildEnrichmentPrompt(listing);
      
      const response = await openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a car market expert in India. Analyze car listings and provide honest, helpful insights in JSON format."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 500,
        temperature: 0.7,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        summary: result.summary || "AI analysis unavailable",
        prosAndCons: {
          pros: result.pros || [],
          cons: result.cons || []
        },
        marketInsight: result.marketInsight || "",
        confidence: Math.max(0, Math.min(1, result.confidence || 0.7))
      };

    } catch (error) {
      console.error('❌ GPT-5 enrichment failed:', error);
      return null;
    }
  }

  /**
   * Batch enrich multiple listings
   */
  async enrichListings(listings: any[]): Promise<Map<string, CarListingEnrichment>> {
    const enrichments = new Map<string, CarListingEnrichment>();
    
    // Process in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < listings.length; i += batchSize) {
      const batch = listings.slice(i, i + batchSize);
      
      const promises = batch.map(async (listing) => {
        const enrichment = await this.enrichListing(listing);
        if (enrichment) {
          enrichments.set(listing.id || listing.externalId, enrichment);
        }
      });

      await Promise.all(promises);
      
      // Rate limiting delay
      if (i + batchSize < listings.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`✅ GPT-5 enriched ${enrichments.size}/${listings.length} listings`);
    return enrichments;
  }

  /**
   * Build enrichment prompt for GPT-5
   */
  private buildEnrichmentPrompt(listing: any): string {
    const currentYear = new Date().getFullYear();
    const carAge = currentYear - listing.year;
    const kmPerYear = listing.mileage ? Math.round(listing.mileage / carAge) : 0;
    
    return `You are an expert automotive analyst specializing in the Indian used car market. Analyze this specific car listing with deep market knowledge and provide nuanced insights in JSON format:

**Car Specifications:**
- Vehicle: ${listing.make} ${listing.model} (${listing.year})
- Asking Price: ₹${listing.price?.toLocaleString('en-IN')}
- Odometer: ${listing.mileage ? listing.mileage.toLocaleString('en-IN') + ' km' : 'Not disclosed'}
- Fuel Type: ${listing.fuelType || 'Not specified'}
- Location: ${listing.city}
- Usage Pattern: ${kmPerYear ? `~${kmPerYear.toLocaleString('en-IN')} km/year` : 'Unknown'}
- Car Age: ${carAge} years
- Description: ${listing.description || 'No additional details provided'}

**Market Context & Analysis Guidelines:**
- Consider ${listing.city} regional preferences (traffic conditions, fuel costs, brand loyalty)
- Evaluate ${listing.make} ${listing.model} model reputation, reliability, resale trends
- Factor in ${listing.fuelType} fuel efficiency relevance for city driving
- Assess mileage vs age ratio (ideal: 10,000-15,000 km/year for used cars)
- Compare pricing against typical ${carAge}-year-old ${listing.make} models
- Consider maintenance costs, spare parts availability, service network
- Account for current market sentiment towards this specific model

**Required JSON Response:**
{
  "summary": "One compelling sentence capturing the unique value proposition and market positioning",
  "pros": ["2-3 specific advantages considering model reputation, pricing, condition, and local market factors"],
  "cons": ["1-2 genuine concerns buyers should investigate, considering model-specific issues or market factors"],
  "marketInsight": "Detailed assessment of this car's competitive position in ${listing.city} market with price justification",
  "confidence": 0.85
}

**Analysis Depth Required:**
- Price competitiveness vs similar ${listing.year} ${listing.make} ${listing.model} listings
- Model-specific reliability and common issues
- Regional fuel type preferences and infrastructure
- Ownership cost implications (insurance, maintenance, depreciation)
- Target buyer profile and demand patterns
- Seasonal market trends affecting this vehicle category`;
  }

  /**
   * Quick summary-only enrichment for faster processing
   */
  async quickSummary(listing: any): Promise<string | null> {
    if (!process.env.OPENAI_API_KEY) return null;

    try {
      const prompt = `Summarize this car listing in one compelling sentence highlighting pros/cons: ${listing.make} ${listing.model} ${listing.year}, ₹${listing.price?.toLocaleString('en-IN')}, ${listing.mileage || 'Unknown'} km, ${listing.city}`;

      const response = await openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        max_tokens: 100,
        temperature: 0.5,
      });

      return response.choices[0].message.content || null;

    } catch (error) {
      console.error('❌ Quick summary failed:', error);
      return null;
    }
  }
}

// Global instance
export const enrichmentService = new EnrichmentService();