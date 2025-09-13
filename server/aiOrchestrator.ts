import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import { ClaudeCarListingService } from './claudeService';
import { UnifiedPerplexityService } from './unifiedPerplexityService';
import { aiDataExtractionService } from './aiDataExtraction';
import { MarketplaceListing } from './marketplaceAggregator';

// AI Budget Management
interface AIBudget {
  dailyLimits: {
    openai: number;
    claude: number;
    gemini: number;
    perplexity: number;
    firecrawl: number;
  };
  currentUsage: {
    openai: number;
    claude: number;
    gemini: number;
    perplexity: number;
    firecrawl: number;
    date: string;
  };
}

// AI Service Selection Strategy
interface AIRoutingDecision {
  primaryService: 'firecrawl' | 'gemini' | 'perplexity';
  fallbackServices: ('firecrawl' | 'gemini' | 'perplexity')[];
  useClaudeModeration: boolean;
  budgetCheck: boolean;
  reason: string;
}

// Deduplication Result
interface DeduplicationResult {
  isDuplicate: boolean;
  confidence: number;
  canonicalId?: string;
  similarListings: Array<{
    id: string;
    similarity: number;
    matchReasons: string[];
  }>;
}

// Embedding for deduplication
interface ListingEmbedding {
  id: string;
  embedding: number[];
  title: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  location: string;
}

export class AIOrchestrator {
  private openai: OpenAI;
  private gemini: GoogleGenAI;
  private claude: ClaudeCarListingService;
  private perplexity: UnifiedPerplexityService;
  
  private budget: AIBudget;
  private embeddingCache: Map<string, ListingEmbedding> = new Map();
  
  constructor() {
    this.openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY 
    });
    this.gemini = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY || "" 
    });
    this.claude = new ClaudeCarListingService();
    this.perplexity = new UnifiedPerplexityService();
    
    // Initialize budget tracking
    this.budget = {
      dailyLimits: {
        openai: 100,      // $100 per day
        claude: 50,       // $50 per day
        gemini: 30,       // $30 per day
        perplexity: 40,   // $40 per day
        firecrawl: 60     // $60 per day
      },
      currentUsage: {
        openai: 0,
        claude: 0,
        gemini: 0,
        perplexity: 0,
        firecrawl: 0,
        date: new Date().toISOString().split('T')[0]
      }
    };
  }

  /**
   * ORCHESTRATION MASTER - Route AI decisions based on context
   */
  async routeExtractionTask(url: string, context: {
    domain: string;
    contentType: 'structured' | 'unstructured' | 'unknown';
    priority: 'high' | 'medium' | 'low';
    cacheStatus: 'hit' | 'miss' | 'cold';
  }): Promise<AIRoutingDecision> {
    
    // Check budget constraints first
    if (!this.checkBudgetAvailability()) {
      return {
        primaryService: 'gemini', // Cheapest fallback
        fallbackServices: [],
        useClaudeModeration: false,
        budgetCheck: false,
        reason: 'Budget limits exceeded - using minimal processing'
      };
    }

    // Route based on domain and content type
    if (this.isStructuredDomain(context.domain)) {
      // CarDekho, Cars24, CarWale - use Firecrawl
      return {
        primaryService: 'firecrawl',
        fallbackServices: ['gemini'],
        useClaudeModeration: true,
        budgetCheck: true,
        reason: `Structured domain ${context.domain} - Firecrawl optimal`
      };
    }

    if (this.isUnstructuredDomain(context.domain)) {
      // OLX, Facebook - use Perplexity only if cache miss and high priority
      if (context.cacheStatus === 'miss' && context.priority === 'high') {
        return {
          primaryService: 'perplexity',
          fallbackServices: ['gemini'],
          useClaudeModeration: true,
          budgetCheck: true,
          reason: `Unstructured domain ${context.domain} - cache miss, high priority`
        };
      } else {
        return {
          primaryService: 'gemini',
          fallbackServices: [],
          useClaudeModeration: true,
          budgetCheck: true,
          reason: `Unstructured domain ${context.domain} - using cached data or lower priority`
        };
      }
    }

    // Default: use Gemini for unknown domains
    return {
      primaryService: 'gemini',
      fallbackServices: ['perplexity'],
      useClaudeModeration: true,
      budgetCheck: true,
      reason: 'Unknown domain - conservative approach'
    };
  }

  /**
   * SMART DEDUPLICATION - Find same cars across portals using embeddings
   */
  async findDuplicateListings(listing: MarketplaceListing): Promise<DeduplicationResult> {
    try {
      // Create embedding for the current listing
      const currentEmbedding = await this.createListingEmbedding(listing);
      
      // Compare with existing embeddings
      const similarities = Array.from(this.embeddingCache.values()).map(cached => {
        const similarity = this.cosineSimilarity(currentEmbedding.embedding, cached.embedding);
        const ruleBasedScore = this.calculateRuleBasedSimilarity(listing, cached);
        
        return {
          id: cached.id,
          similarity: (similarity * 0.6) + (ruleBasedScore * 0.4), // Weighted combination
          embedding: similarity,
          rules: ruleBasedScore,
          matchReasons: this.getMatchReasons(listing, cached, similarity, ruleBasedScore)
        };
      }).sort((a, b) => b.similarity - a.similarity);

      // Check if any listing is above duplicate threshold
      const duplicateThreshold = 0.85;
      const topMatch = similarities[0];
      
      if (topMatch && topMatch.similarity > duplicateThreshold) {
        return {
          isDuplicate: true,
          confidence: topMatch.similarity,
          canonicalId: topMatch.id,
          similarListings: similarities.slice(0, 3).map(s => ({
            id: s.id,
            similarity: s.similarity,
            matchReasons: s.matchReasons
          }))
        };
      }

      // Store embedding for future comparisons
      this.embeddingCache.set(listing.id, currentEmbedding);
      
      return {
        isDuplicate: false,
        confidence: topMatch ? topMatch.similarity : 0,
        similarListings: similarities.slice(0, 3).map(s => ({
          id: s.id,
          similarity: s.similarity,
          matchReasons: s.matchReasons
        }))
      };

    } catch (error) {
      console.error('🚨 Deduplication error:', error);
      return {
        isDuplicate: false,
        confidence: 0,
        similarListings: []
      };
    }
  }

  /**
   * BUDGET MANAGEMENT - Track and enforce spending limits
   */
  private checkBudgetAvailability(): boolean {
    this.resetDailyUsageIfNeeded();
    
    const { currentUsage, dailyLimits } = this.budget;
    
    return (
      currentUsage.openai < dailyLimits.openai &&
      currentUsage.claude < dailyLimits.claude &&
      currentUsage.gemini < dailyLimits.gemini &&
      currentUsage.perplexity < dailyLimits.perplexity &&
      currentUsage.firecrawl < dailyLimits.firecrawl
    );
  }

  private recordUsage(service: keyof AIBudget['currentUsage'], cost: number) {
    if (service === 'date') return;
    this.resetDailyUsageIfNeeded();
    this.budget.currentUsage[service] += cost;
  }

  private resetDailyUsageIfNeeded() {
    const today = new Date().toISOString().split('T')[0];
    if (this.budget.currentUsage.date !== today) {
      this.budget.currentUsage = {
        openai: 0,
        claude: 0,
        gemini: 0,
        perplexity: 0,
        firecrawl: 0,
        date: today
      };
    }
  }

  /**
   * EMBEDDING CREATION - Generate semantic representations
   */
  private async createListingEmbedding(listing: MarketplaceListing): Promise<ListingEmbedding> {
    const embeddingText = `${listing.title} ${listing.brand} ${listing.model} ${listing.year} ${listing.location} ${listing.price}`;
    
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: embeddingText
      });

      this.recordUsage('openai', 0.02); // ~$0.02 per embedding

      return {
        id: listing.id,
        embedding: response.data[0].embedding,
        title: listing.title,
        brand: listing.brand,
        model: listing.model,
        year: listing.year,
        price: listing.price,
        location: listing.location
      };
    } catch (error) {
      console.error('🚨 Embedding creation failed:', error);
      throw error;
    }
  }

  /**
   * SIMILARITY CALCULATIONS
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  private calculateRuleBasedSimilarity(listingA: MarketplaceListing, listingB: ListingEmbedding): number {
    let score = 0;
    let maxScore = 0;

    // Brand match (high weight)
    maxScore += 30;
    if (listingA.brand?.toLowerCase() === listingB.brand?.toLowerCase()) {
      score += 30;
    }

    // Model match (high weight)
    maxScore += 25;
    if (listingA.model?.toLowerCase() === listingB.model?.toLowerCase()) {
      score += 25;
    }

    // Year proximity (medium weight)
    maxScore += 15;
    const yearDiff = Math.abs(listingA.year - listingB.year);
    if (yearDiff === 0) score += 15;
    else if (yearDiff === 1) score += 10;
    else if (yearDiff <= 2) score += 5;

    // Price proximity (medium weight)
    maxScore += 15;
    const priceDiff = Math.abs(listingA.price - listingB.price) / Math.max(listingA.price, listingB.price);
    if (priceDiff <= 0.05) score += 15;      // 5% difference
    else if (priceDiff <= 0.10) score += 10; // 10% difference
    else if (priceDiff <= 0.20) score += 5;  // 20% difference

    // Location proximity (low weight)
    maxScore += 15;
    if (listingA.location?.toLowerCase().includes(listingB.location?.toLowerCase() || '') ||
        listingB.location?.toLowerCase().includes(listingA.location?.toLowerCase() || '')) {
      score += 15;
    }

    return score / maxScore;
  }

  private getMatchReasons(listingA: MarketplaceListing, listingB: ListingEmbedding, embeddingSim: number, ruleSim: number): string[] {
    const reasons: string[] = [];
    
    if (embeddingSim > 0.8) reasons.push('High semantic similarity');
    if (listingA.brand === listingB.brand && listingA.model === listingB.model) {
      reasons.push('Exact brand and model match');
    }
    if (Math.abs(listingA.year - listingB.year) <= 1) reasons.push('Similar year');
    if (Math.abs(listingA.price - listingB.price) / listingA.price <= 0.1) {
      reasons.push('Price within 10%');
    }
    
    return reasons;
  }

  /**
   * DOMAIN CLASSIFICATION
   */
  private isStructuredDomain(domain: string): boolean {
    const structuredDomains = ['cardekho.com', 'cars24.com', 'carwale.com', 'autotrader.in'];
    return structuredDomains.some(d => domain.includes(d));
  }

  private isUnstructuredDomain(domain: string): boolean {
    const unstructuredDomains = ['olx.in', 'facebook.com', 'droom.in', 'quikr.com'];
    return unstructuredDomains.some(d => domain.includes(d));
  }

  /**
   * PUBLIC API - Get current status
   */
  getBudgetStatus() {
    this.resetDailyUsageIfNeeded();
    return {
      ...this.budget,
      availabilityStatus: this.checkBudgetAvailability(),
      utilizationPercentage: {
        openai: (this.budget.currentUsage.openai / this.budget.dailyLimits.openai) * 100,
        claude: (this.budget.currentUsage.claude / this.budget.dailyLimits.claude) * 100,
        gemini: (this.budget.currentUsage.gemini / this.budget.dailyLimits.gemini) * 100,
        perplexity: (this.budget.currentUsage.perplexity / this.budget.dailyLimits.perplexity) * 100,
        firecrawl: (this.budget.currentUsage.firecrawl / this.budget.dailyLimits.firecrawl) * 100,
      }
    };
  }

  getCacheStats() {
    return {
      embeddingCacheSize: this.embeddingCache.size,
      totalComparisons: Array.from(this.embeddingCache.values()).length
    };
  }
}

export const aiOrchestrator = new AIOrchestrator();