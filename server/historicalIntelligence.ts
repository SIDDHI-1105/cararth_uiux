import { GoogleGenAI } from "@google/genai";
import type { MarketplaceListing } from './marketplaceAggregator.js';

export interface HistoricalAnalysis {
  authenticityRating: number; // 1-10 scale
  meanPrice: number;
  priceConfidence: number; // 0-1 scale
  salesVelocity: {
    avgDaysToSell: number;
    demandLevel: 'high' | 'medium' | 'low';
    seasonalFactor: number;
  };
  recencyScore: number; // 0-1 scale (1 = very recent)
  marketTrend: 'rising' | 'falling' | 'stable';
  riskFactors: string[];
  recommendations: string[];
}

export interface VehicleProfile {
  brand: string;
  model: string;
  year: number;
  fuelType: string;
  transmission: string;
  city: string;
  mileage: number;
  price: number;
  listingDate: Date;
}

export class HistoricalIntelligenceService {
  private ai: GoogleGenAI;

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required for historical intelligence');
    }
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  /**
   * Calculate recency bias score for listings prioritization
   */
  calculateRecencyScore(listingDate: Date): number {
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - listingDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Fresh listings (0-7 days) get highest score
    if (daysDiff <= 7) return 1.0;
    
    // Recent listings (8-30 days) get high score with decay
    if (daysDiff <= 30) return Math.max(0.7, 1.0 - (daysDiff - 7) * 0.015);
    
    // Older listings (31-90 days) get medium score
    if (daysDiff <= 90) return Math.max(0.3, 0.7 - (daysDiff - 30) * 0.007);
    
    // Very old listings (90+ days) get minimal score
    return Math.max(0.1, 0.3 - (daysDiff - 90) * 0.002);
  }

  /**
   * Apply recency bias to listings array
   */
  applyRecencyBias(listings: MarketplaceListing[]): MarketplaceListing[] {
    return listings
      .map(listing => ({
        ...listing,
        recencyScore: this.calculateRecencyScore(listing.listingDate)
      }))
      .sort((a, b) => {
        // Primary sort: recency score (descending)
        const recencyDiff = (b as any).recencyScore - (a as any).recencyScore;
        if (Math.abs(recencyDiff) > 0.1) return recencyDiff;
        
        // Secondary sort: verification status
        const verificationWeight = { 'certified': 3, 'verified': 2, 'unverified': 1 };
        const verificationDiff = verificationWeight[b.verificationStatus] - verificationWeight[a.verificationStatus];
        if (verificationDiff !== 0) return verificationDiff;
        
        // Tertiary sort: price (ascending for value)
        return a.price - b.price;
      });
  }

  /**
   * Analyze historical data and provide AI-powered authenticity rating
   */
  async analyzeHistoricalData(vehicleProfile: VehicleProfile): Promise<HistoricalAnalysis> {
    try {
      const prompt = `You are an automotive expert analyzing this specific car listing. 

IMPORTANT: You do NOT have access to real historical sales data, regional sales volumes, or actual market transaction data. Base your analysis only on general automotive knowledge and the listing information provided.

Vehicle Profile:
- ${vehicleProfile.year} ${vehicleProfile.brand} ${vehicleProfile.model}
- Location: ${vehicleProfile.city}
- Fuel: ${vehicleProfile.fuelType}, Transmission: ${vehicleProfile.transmission}
- Mileage: ${vehicleProfile.mileage} km
- Listed Price: ₹${vehicleProfile.price.toLocaleString()}
- Listing Age: ${Math.floor((new Date().getTime() - vehicleProfile.listingDate.getTime()) / (1000 * 60 * 60 * 24))} days

Based on general automotive knowledge (NOT real sales data), analyze this listing and provide conservative estimates in JSON format:

{
  "authenticityRating": number (1-10, where 10 is most authentic),
  "meanPrice": number (historical average for similar vehicles),
  "priceConfidence": number (0-1, confidence in price accuracy),
  "salesVelocity": {
    "avgDaysToSell": number (typical days to sell similar cars),
    "demandLevel": "high|medium|low",
    "seasonalFactor": number (0.8-1.2, current seasonal demand)
  },
  "recencyScore": number (0-1, based on listing freshness),
  "marketTrend": "rising|falling|stable",
  "riskFactors": ["factor1", "factor2"],
  "recommendations": ["recommendation1", "recommendation2"]
}

ANALYSIS CRITERIA (Based on general knowledge only):
- Authenticity: General price reasonableness based on age/mileage
- Mean Price: Estimate based on typical market patterns (label as "estimated")
- Sales Velocity: General estimates for similar vehicles (label as "estimated") 
- Risk Factors: Age, mileage, and general market concerns
- Recommendations: General automotive advice only

IMPORTANT DISCLAIMERS:
- All data points are estimates based on general automotive knowledge
- This is NOT based on real regional sales data or actual market transactions
- Users should verify pricing through multiple real sources
- Consider this analysis as general guidance only`;

      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const resultText = response.text || "";
      const jsonMatch = resultText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const analysis: HistoricalAnalysis = JSON.parse(jsonMatch[0]);
        
        // Override recency score with our calculation
        analysis.recencyScore = this.calculateRecencyScore(vehicleProfile.listingDate);
        
        console.log(`🧠 Historical Analysis: ${vehicleProfile.brand} ${vehicleProfile.model} - Authenticity: ${analysis.authenticityRating}/10, Sales: ${analysis.salesVelocity.avgDaysToSell} days`);
        return analysis;
      }

      // Fallback analysis if parsing fails
      return this.getFallbackAnalysis(vehicleProfile);

    } catch (error) {
      console.error('🚫 Historical intelligence error:', error);
      return this.getFallbackAnalysis(vehicleProfile);
    }
  }

  /**
   * Batch analyze multiple listings with historical intelligence
   */
  async batchAnalyzeListings(listings: MarketplaceListing[]): Promise<(MarketplaceListing & { historicalAnalysis: HistoricalAnalysis })[]> {
    const enrichedListings = await Promise.all(
      listings.map(async (listing) => {
        const vehicleProfile: VehicleProfile = {
          brand: listing.brand,
          model: listing.model,
          year: listing.year,
          fuelType: listing.fuelType,
          transmission: listing.transmission,
          city: listing.city,
          mileage: listing.mileage,
          price: listing.price,
          listingDate: listing.listingDate
        };

        const historicalAnalysis = await this.analyzeHistoricalData(vehicleProfile);
        
        return {
          ...listing,
          historicalAnalysis
        };
      })
    );

    console.log(`🔍 Batch analyzed ${enrichedListings.length} listings with historical intelligence`);
    return enrichedListings;
  }

  /**
   * Generate market summary with historical insights
   */
  async generateMarketSummary(listings: MarketplaceListing[], location: string): Promise<{
    totalListings: number;
    avgAuthenticityRating: number;
    avgSalesVelocity: number;
    priceDistribution: {
      under5L: number;
      between5L10L: number;
      above10L: number;
    };
    demandHotspots: string[];
    marketHealth: 'excellent' | 'good' | 'average' | 'poor';
  }> {
    const enrichedListings = await this.batchAnalyzeListings(listings);
    
    const avgAuthenticityRating = enrichedListings.reduce((sum, listing) => 
      sum + listing.historicalAnalysis.authenticityRating, 0) / enrichedListings.length;
    
    const avgSalesVelocity = enrichedListings.reduce((sum, listing) => 
      sum + listing.historicalAnalysis.salesVelocity.avgDaysToSell, 0) / enrichedListings.length;
    
    const priceDistribution = enrichedListings.reduce((acc, listing) => {
      if (listing.price < 500000) acc.under5L++;
      else if (listing.price <= 1000000) acc.between5L10L++;
      else acc.above10L++;
      return acc;
    }, { under5L: 0, between5L10L: 0, above10L: 0 });

    const highDemandListings = enrichedListings.filter(l => 
      l.historicalAnalysis.salesVelocity.demandLevel === 'high');
    
    const demandHotspots = Array.from(new Set(highDemandListings.map(l => l.brand))).slice(0, 3);

    const marketHealth = avgAuthenticityRating >= 8 ? 'excellent' :
                        avgAuthenticityRating >= 6.5 ? 'good' :
                        avgAuthenticityRating >= 5 ? 'average' : 'poor';

    return {
      totalListings: enrichedListings.length,
      avgAuthenticityRating: Math.round(avgAuthenticityRating * 10) / 10,
      avgSalesVelocity: Math.round(avgSalesVelocity),
      priceDistribution,
      demandHotspots,
      marketHealth
    };
  }

  private getFallbackAnalysis(vehicleProfile: VehicleProfile): HistoricalAnalysis {
    const recencyScore = this.calculateRecencyScore(vehicleProfile.listingDate);
    const ageYears = new Date().getFullYear() - vehicleProfile.year;
    
    // Basic authenticity scoring based on age and price
    let authenticityRating = 8;
    if (ageYears > 10) authenticityRating -= 1;
    if (vehicleProfile.mileage > 100000) authenticityRating -= 0.5;
    if (recencyScore < 0.5) authenticityRating -= 0.5;
    
    return {
      authenticityRating: Math.max(1, Math.min(10, authenticityRating)),
      meanPrice: vehicleProfile.price * 0.95, // Slightly below listed price
      priceConfidence: 0.7,
      salesVelocity: {
        avgDaysToSell: ageYears > 5 ? 45 : 30,
        demandLevel: ageYears < 3 ? 'high' : ageYears < 7 ? 'medium' : 'low',
        seasonalFactor: 1.0
      },
      recencyScore,
      marketTrend: 'stable',
      riskFactors: ageYears > 8 ? ['High age', 'Potential maintenance costs'] : [],
      recommendations: ['Verify service history', 'Inspect thoroughly']
    };
  }
}