import { GoogleGenAI } from "@google/genai";
import { Anthropic } from "@anthropic-ai/sdk";
import OpenAI from "openai";
import type { MarketplaceListing } from './marketplaceAggregator.js';

/**
 * Active Learning System for Multi-LLM Intelligence
 * Captures patterns from real data and shares insights between GPT, Claude, Gemini, and Perplexity
 */

export interface LearningPattern {
  id: string;
  category: 'mileage' | 'pricing' | 'authenticity' | 'regional' | 'seasonal';
  pattern: string;
  confidence: number; // 0-1
  dataPoints: number;
  lastUpdated: Date;
  geographicScope: string; // e.g., 'Hyderabad', 'India', 'Global'
  applicableModels: string[]; // Car models this applies to
}

export interface MileageContextPattern {
  brand: string;
  model: string;
  fuelType: string;
  city: string;
  expectedMileageRange: { min: number; max: number; ideal: number };
  usagePattern: 'city' | 'highway' | 'mixed' | 'commercial';
  confidence: number;
  sampleSize: number;
}

export interface SharedInsight {
  id: string;
  sourceAI: 'gpt' | 'claude' | 'gemini' | 'perplexity';
  targetAI: 'gpt' | 'claude' | 'gemini' | 'perplexity' | 'all';
  insight: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  timestamp: Date;
  validatedByOtherAI?: boolean;
}

export class LLMLearningSystem {
  private openai: OpenAI;
  private anthropic: Anthropic;
  private gemini: GoogleGenAI;
  private learningPatterns: Map<string, LearningPattern> = new Map();
  private mileagePatterns: Map<string, MileageContextPattern> = new Map();
  private sharedInsights: SharedInsight[] = [];

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    this.gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  /**
   * CONTINUOUS LEARNING - Analyze patterns from real marketplace data
   */
  async learnFromMarketplaceData(listings: MarketplaceListing[]): Promise<void> {
    try {
      console.log(`🧠 Learning from ${listings.length} marketplace listings...`);

      // Learn mileage patterns by model and geography
      await this.analyzeMileagePatterns(listings);
      
      // Learn pricing patterns
      await this.analyzePricingPatterns(listings);
      
      // Learn authenticity indicators
      await this.analyzeAuthenticityPatterns(listings);
      
      // Learn regional preferences
      await this.analyzeRegionalPatterns(listings);

      console.log(`✅ Learning complete - ${this.learningPatterns.size} patterns captured`);
    } catch (error) {
      console.error('❌ Learning system error:', error);
    }
  }

  /**
   * MILEAGE INTELLIGENCE - Context-aware mileage analysis
   */
  private async analyzeMileagePatterns(listings: MarketplaceListing[]): Promise<void> {
    const mileageGroups = new Map<string, number[]>();

    // Group by brand + model + fuel + city
    for (const listing of listings) {
      const key = `${listing.brand}-${listing.model}-${listing.fuelType}-${listing.city}`.toLowerCase();
      if (!mileageGroups.has(key)) {
        mileageGroups.set(key, []);
      }
      mileageGroups.get(key)!.push(listing.mileage);
    }

    // Analyze patterns for each group
    for (const [key, mileages] of mileageGroups) {
      if (mileages.length >= 5) { // Minimum sample size for statistical significance
        const [brand, model, fuelType, city] = key.split('-');
        
        const sortedMileages = mileages.sort((a, b) => a - b);
        const min = sortedMileages[0];
        const max = sortedMileages[sortedMileages.length - 1];
        const median = sortedMileages[Math.floor(sortedMileages.length / 2)];
        
        // Determine usage pattern based on statistics
        let usagePattern: 'city' | 'highway' | 'mixed' | 'commercial' = 'mixed';
        const avgMileage = mileages.reduce((sum, m) => sum + m, 0) / mileages.length;
        
        if (avgMileage < 8000) usagePattern = 'city';
        else if (avgMileage > 15000) usagePattern = 'highway';
        else if (avgMileage > 25000) usagePattern = 'commercial';

        const pattern: MileageContextPattern = {
          brand,
          model,
          fuelType,
          city,
          expectedMileageRange: {
            min: Math.max(0, median - (median * 0.3)),
            max: median + (median * 0.5),
            ideal: median
          },
          usagePattern,
          confidence: Math.min(0.95, mileages.length / 20), // Higher confidence with more data
          sampleSize: mileages.length
        };

        this.mileagePatterns.set(key, pattern);
      }
    }

    console.log(`📊 Learned mileage patterns for ${this.mileagePatterns.size} car profiles`);
  }

  /**
   * PRICING INTELLIGENCE - Learn regional pricing patterns
   */
  private async analyzePricingPatterns(listings: MarketplaceListing[]): Promise<void> {
    // Group by city and analyze price variations
    const cityPrices = new Map<string, { brand: string; model: string; year: number; price: number }[]>();
    
    for (const listing of listings) {
      if (!cityPrices.has(listing.city)) {
        cityPrices.set(listing.city, []);
      }
      cityPrices.get(listing.city)!.push({
        brand: listing.brand,
        model: listing.model,
        year: listing.year,
        price: listing.price
      });
    }

    for (const [city, prices] of cityPrices) {
      if (prices.length >= 10) {
        const avgPrice = prices.reduce((sum, p) => sum + p.price, 0) / prices.length;
        
        const pattern: LearningPattern = {
          id: `pricing-${city}-${Date.now()}`,
          category: 'pricing',
          pattern: `${city} market shows average pricing of ₹${Math.round(avgPrice).toLocaleString()} with ${prices.length} data points`,
          confidence: Math.min(0.9, prices.length / 50),
          dataPoints: prices.length,
          lastUpdated: new Date(),
          geographicScope: city,
          applicableModels: [...new Set(prices.map(p => `${p.brand} ${p.model}`))]
        };

        this.learningPatterns.set(pattern.id, pattern);
      }
    }
  }

  /**
   * AUTHENTICITY INTELLIGENCE - Learn image and listing quality patterns
   */
  private async analyzeAuthenticityPatterns(listings: MarketplaceListing[]): Promise<void> {
    const authenticityMetrics = {
      withImages: listings.filter(l => l.images && l.images.length > 0).length,
      verified: listings.filter(l => l.verificationStatus === 'verified').length,
      certified: listings.filter(l => l.verificationStatus === 'certified').length
    };

    const pattern: LearningPattern = {
      id: `authenticity-${Date.now()}`,
      category: 'authenticity',
      pattern: `Authenticity baseline: ${Math.round(authenticityMetrics.withImages / listings.length * 100)}% have images, ${Math.round(authenticityMetrics.verified / listings.length * 100)}% verified`,
      confidence: 0.8,
      dataPoints: listings.length,
      lastUpdated: new Date(),
      geographicScope: 'India',
      applicableModels: ['All']
    };

    this.learningPatterns.set(pattern.id, pattern);
  }

  /**
   * REGIONAL INTELLIGENCE - Learn city-specific preferences
   */
  private async analyzeRegionalPatterns(listings: MarketplaceListing[]): Promise<void> {
    const regionalPrefs = new Map<string, { fuelTypes: string[]; brands: string[] }>();

    for (const listing of listings) {
      if (!regionalPrefs.has(listing.city)) {
        regionalPrefs.set(listing.city, { fuelTypes: [], brands: [] });
      }
      const prefs = regionalPrefs.get(listing.city)!;
      prefs.fuelTypes.push(listing.fuelType);
      prefs.brands.push(listing.brand);
    }

    for (const [city, prefs] of regionalPrefs) {
      const topFuel = this.getMostCommon(prefs.fuelTypes);
      const topBrand = this.getMostCommon(prefs.brands);

      const pattern: LearningPattern = {
        id: `regional-${city}-${Date.now()}`,
        category: 'regional',
        pattern: `${city} preferences: ${topFuel} fuel (${Math.round(prefs.fuelTypes.filter(f => f === topFuel).length / prefs.fuelTypes.length * 100)}%), ${topBrand} brand popular`,
        confidence: 0.7,
        dataPoints: prefs.fuelTypes.length,
        lastUpdated: new Date(),
        geographicScope: city,
        applicableModels: ['All']
      };

      this.learningPatterns.set(pattern.id, pattern);
    }
  }

  /**
   * CONTEXT-AWARE MILEAGE ANALYSIS - Use learned patterns for better insights
   */
  async getContextualMileageInsight(listing: MarketplaceListing): Promise<string> {
    const key = `${listing.brand}-${listing.model}-${listing.fuelType}-${listing.city}`.toLowerCase();
    const pattern = this.mileagePatterns.get(key);

    if (pattern && pattern.confidence > 0.5) {
      const { expectedMileageRange, usagePattern } = pattern;
      
      if (listing.mileage < expectedMileageRange.min) {
        return `Low mileage for ${listing.city} ${listing.brand} ${listing.model} - suggests careful usage or recent purchase`;
      } else if (listing.mileage > expectedMileageRange.max) {
        return `Higher than typical mileage for this profile - verify maintenance history and ${usagePattern} usage patterns`;
      } else {
        return `Normal mileage range for ${listing.city} market - typical ${usagePattern} usage pattern`;
      }
    }

    // Fallback to general analysis
    const ageYears = new Date().getFullYear() - listing.year;
    const expectedAnnualMileage = listing.fuelType === 'Diesel' ? 15000 : 10000;
    const expectedMileage = ageYears * expectedAnnualMileage;
    
    if (listing.mileage < expectedMileage * 0.7) {
      return `Below average mileage for ${ageYears}-year-old vehicle - could indicate limited use`;
    } else if (listing.mileage > expectedMileage * 1.3) {
      return `Above average mileage - verify service history and overall condition`;
    } else {
      return `Reasonable mileage for vehicle age - within expected range`;
    }
  }

  /**
   * CROSS-AI INSIGHT SHARING - Share learnings between different AI models
   */
  async shareInsightBetweenAIs(sourceAI: string, targetAI: string, insight: string, category: string): Promise<void> {
    const sharedInsight: SharedInsight = {
      id: `insight-${Date.now()}`,
      sourceAI: sourceAI as any,
      targetAI: targetAI as any,
      insight,
      category,
      priority: 'medium',
      timestamp: new Date()
    };

    this.sharedInsights.push(sharedInsight);
    console.log(`🔄 Shared insight from ${sourceAI} to ${targetAI}: ${insight.substring(0, 100)}...`);
  }

  /**
   * GET ENHANCED PROMPT CONTEXT - Provide learned patterns to AI models
   */
  getEnhancedPromptContext(category: string, geographic?: string): string {
    const relevantPatterns = Array.from(this.learningPatterns.values())
      .filter(p => p.category === category && (!geographic || p.geographicScope === geographic))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);

    if (relevantPatterns.length === 0) return '';

    return `\n\nLEARNED PATTERNS (based on ${relevantPatterns.reduce((sum, p) => sum + p.dataPoints, 0)} data points):\n` +
      relevantPatterns.map(p => `• ${p.pattern} (confidence: ${Math.round(p.confidence * 100)}%)`).join('\n');
  }

  /**
   * UTILITY METHODS
   */
  private getMostCommon<T>(arr: T[]): T {
    const counts = new Map<T, number>();
    for (const item of arr) {
      counts.set(item, (counts.get(item) || 0) + 1);
    }
    
    let mostCommon = arr[0];
    let maxCount = 0;
    for (const [item, count] of counts) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = item;
      }
    }
    
    return mostCommon;
  }

  /**
   * SYSTEM HEALTH METRICS
   */
  getSystemMetrics(): {
    totalPatterns: number;
    mileagePatterns: number;
    sharedInsights: number;
    avgConfidence: number;
  } {
    const patterns = Array.from(this.learningPatterns.values());
    const avgConfidence = patterns.length > 0 
      ? patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length 
      : 0;

    return {
      totalPatterns: patterns.length,
      mileagePatterns: this.mileagePatterns.size,
      sharedInsights: this.sharedInsights.length,
      avgConfidence: Math.round(avgConfidence * 100) / 100
    };
  }
}

// Export singleton instance
export const llmLearningSystem = new LLMLearningSystem();