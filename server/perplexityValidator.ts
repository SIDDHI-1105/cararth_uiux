import { UnifiedPerplexityService } from './unifiedPerplexityService';
import { MarketplaceListing } from './marketplaceAggregator';

// Anomaly detection patterns
interface AnomalyPatterns {
  priceAnomalies: Array<{
    listingId: string;
    expectedPriceRange: { min: number; max: number };
    actualPrice: number;
    anomalyScore: number;
    reasons: string[];
  }>;
  marketAnomalies: Array<{
    make: string;
    model: string;
    city: string;
    anomalyType: 'sudden_price_drop' | 'rare_model' | 'unusual_specs' | 'location_mismatch';
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;
}

// Real-time validation triggers
interface ValidationTrigger {
  type: 'price_outlier' | 'rare_model' | 'new_portal' | 'suspicious_listing' | 'market_change';
  priority: 'low' | 'medium' | 'high' | 'critical';
  threshold: number;
  shouldValidate: boolean;
}

// Selective validation result
interface ValidationResult {
  isValidated: boolean;
  confidence: number;
  anomaliesDetected: string[];
  marketInsights: {
    pricePosition: 'underpriced' | 'fair' | 'overpriced';
    demandLevel: 'low' | 'medium' | 'high';
    marketTrend: 'rising' | 'stable' | 'falling';
  };
  recommendedAction: 'approve' | 'investigate' | 'flag' | 'reject';
  validationCost: number; // Estimated API cost for this validation
}

export class PerplexityValidator {
  private perplexity: UnifiedPerplexityService;
  private dailyValidationBudget: number = 40; // $40 per day
  private currentDailySpend: number = 0;
  private validationCount: number = 0;
  
  // Budget tracking
  private budgetResetDate: string;
  
  // Validation priorities
  private validationTriggers: Record<string, ValidationTrigger> = {
    price_outlier: {
      type: 'price_outlier',
      priority: 'high',
      threshold: 0.3, // 30% price deviation from market
      shouldValidate: true
    },
    rare_model: {
      type: 'rare_model',
      priority: 'medium',
      threshold: 0.05, // Less than 5% market presence
      shouldValidate: true
    },
    suspicious_listing: {
      type: 'suspicious_listing',
      priority: 'critical',
      threshold: 0.1, // Any suspicious pattern
      shouldValidate: true
    },
    new_portal: {
      type: 'new_portal',
      priority: 'low',
      threshold: 0.8, // New or uncommon source
      shouldValidate: false // Budget conservation
    },
    market_change: {
      type: 'market_change',
      priority: 'high',
      threshold: 0.25, // 25% market shift
      shouldValidate: true
    }
  };

  constructor() {
    this.perplexity = new UnifiedPerplexityService();
    this.budgetResetDate = new Date().toISOString().split('T')[0];
    this.currentDailySpend = 0;
    this.validationCount = 0;
  }

  /**
   * SELECTIVE VALIDATION DECISION MAKER
   */
  async shouldValidateListing(listing: MarketplaceListing, context: {
    cacheStatus: 'hit' | 'miss' | 'cold';
    averagePriceForModel?: number;
    rarityScore?: number;
    sourceReliability?: number;
  }): Promise<{ shouldValidate: boolean; reason: string; estimatedCost: number }> {
    
    // Check daily budget first
    this.resetDailyBudgetIfNeeded();
    if (this.currentDailySpend >= this.dailyValidationBudget) {
      return {
        shouldValidate: false,
        reason: 'Daily validation budget exceeded',
        estimatedCost: 0
      };
    }

    // Calculate anomaly scores
    const anomalyScore = this.calculateAnomalyScore(listing, context);
    const triggerType = this.identifyTriggerType(listing, context, anomalyScore);
    const trigger = this.validationTriggers[triggerType];
    
    // Estimate cost before proceeding
    const estimatedCost = this.estimateValidationCost(triggerType);
    
    // Check if we have budget and trigger justifies validation
    const hasbudget = (this.currentDailySpend + estimatedCost) <= this.dailyValidationBudget;
    const shouldValidate = hasbudget && 
                          trigger.shouldValidate && 
                          anomalyScore >= trigger.threshold;
    
    return {
      shouldValidate,
      reason: shouldValidate 
        ? `${triggerType} anomaly detected (score: ${anomalyScore.toFixed(2)})` 
        : `Budget: ${hasbudget}, Trigger: ${trigger.shouldValidate}, Score: ${anomalyScore.toFixed(2)}/${trigger.threshold}`,
      estimatedCost
    };
  }

  /**
   * REAL-TIME VALIDATION - Only for high-value cases
   */
  async validateListing(listing: MarketplaceListing): Promise<ValidationResult> {
    console.log(`🔍 Perplexity real-time validation: ${listing.title}`);
    const startTime = Date.now();
    
    try {
      // Get real-time market data
      const marketData = await this.perplexity.getMarketInsights({
        make: listing.brand,
        model: listing.model,
        city: listing.city,
        priceRange: {
          min: listing.price * 0.8,
          max: listing.price * 1.2
        }
      });

      // Analyze for anomalies
      const anomalies = await this.detectAnomalies(listing, marketData);
      
      // Generate market insights
      const insights = this.generateMarketInsights(listing, marketData);
      
      // Calculate confidence and recommendation
      const confidence = this.calculateValidationConfidence(marketData, anomalies);
      const recommendation = this.makeRecommendation(confidence, anomalies, insights);
      
      // Track costs
      const validationCost = this.estimateActualCost(Date.now() - startTime);
      this.currentDailySpend += validationCost;
      this.validationCount++;
      
      console.log(`✅ Perplexity validation complete: ${recommendation} (${confidence}% confidence, $${validationCost.toFixed(3)})`);
      
      return {
        isValidated: true,
        confidence,
        anomaliesDetected: anomalies,
        marketInsights: insights,
        recommendedAction: recommendation,
        validationCost
      };
      
    } catch (error) {
      console.error(`🚨 Perplexity validation failed: ${error}`);
      
      return {
        isValidated: false,
        confidence: 0,
        anomaliesDetected: ['Validation service error'],
        marketInsights: {
          pricePosition: 'fair',
          demandLevel: 'medium', 
          marketTrend: 'stable'
        },
        recommendedAction: 'investigate',
        validationCost: 0
      };
    }
  }

  /**
   * ANOMALY DETECTION - Identify suspicious patterns
   */
  async detectAnomaliesInBatch(listings: MarketplaceListing[]): Promise<AnomalyPatterns> {
    console.log(`🔍 Batch anomaly detection: ${listings.length} listings`);
    
    const priceAnomalies: AnomalyPatterns['priceAnomalies'] = [];
    const marketAnomalies: AnomalyPatterns['marketAnomalies'] = [];
    
    // Group by make/model for comparison
    const modelGroups = this.groupListingsByModel(listings);
    
    for (const [modelKey, modelListings] of Object.entries(modelGroups)) {
      const [make, model] = modelKey.split('_');
      
      if (modelListings.length < 3) continue; // Need at least 3 for comparison
      
      // Calculate price statistics
      const prices = modelListings.map(l => l.price).sort((a, b) => a - b);
      const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
      const medianPrice = prices[Math.floor(prices.length / 2)];
      
      // Detect price outliers
      for (const listing of modelListings) {
        const deviation = Math.abs(listing.price - avgPrice) / avgPrice;
        
        if (deviation > 0.4) { // 40% deviation threshold
          priceAnomalies.push({
            listingId: listing.id,
            expectedPriceRange: {
              min: avgPrice * 0.8,
              max: avgPrice * 1.2
            },
            actualPrice: listing.price,
            anomalyScore: deviation,
            reasons: [
              deviation > 0.6 ? 'Extreme price outlier' : 'Significant price deviation',
              listing.price > avgPrice ? 'Overpriced' : 'Underpriced'
            ]
          });
        }
      }
      
      // Detect market anomalies
      const cityDistribution = this.analyzeCityDistribution(modelListings);
      const yearDistribution = this.analyzeYearDistribution(modelListings);
      
      // Check for unusual patterns
      if (this.hasUnusualDistribution(cityDistribution)) {
        marketAnomalies.push({
          make,
          model,
          city: 'multiple',
          anomalyType: 'location_mismatch',
          severity: 'medium',
          description: `Unusual geographic distribution for ${make} ${model}`
        });
      }
      
      if (this.hasUnusualYearPattern(yearDistribution)) {
        marketAnomalies.push({
          make,
          model,
          city: 'multiple',
          anomalyType: 'unusual_specs',
          severity: 'low',
          description: `Atypical year distribution for ${make} ${model}`
        });
      }
    }
    
    console.log(`🔍 Anomaly detection complete: ${priceAnomalies.length} price anomalies, ${marketAnomalies.length} market anomalies`);
    
    return {
      priceAnomalies,
      marketAnomalies
    };
  }

  /**
   * BUDGET AND COST MANAGEMENT
   */
  private resetDailyBudgetIfNeeded(): void {
    const today = new Date().toISOString().split('T')[0];
    if (this.budgetResetDate !== today) {
      this.currentDailySpend = 0;
      this.validationCount = 0;
      this.budgetResetDate = today;
      console.log(`💰 Daily Perplexity validation budget reset: $${this.dailyValidationBudget}`);
    }
  }

  private estimateValidationCost(triggerType: string): number {
    const baseCosts = {
      price_outlier: 0.8,      // Medium complexity query
      rare_model: 1.2,         // Requires broader market analysis
      suspicious_listing: 1.5, // Deep investigation needed
      new_portal: 0.5,         // Simple verification
      market_change: 1.0       // Standard market query
    };
    
    return baseCosts[triggerType] || 1.0;
  }

  private estimateActualCost(processingTime: number): number {
    // Estimate based on processing time and query complexity
    const baseRate = 0.005; // $0.005 per second of processing
    return Math.max(0.1, processingTime * baseRate / 1000);
  }

  /**
   * ANOMALY SCORING AND DECISION LOGIC
   */
  private calculateAnomalyScore(listing: MarketplaceListing, context: any): number {
    let score = 0;
    
    // Price anomaly component
    if (context.averagePriceForModel) {
      const priceDeviation = Math.abs(listing.price - context.averagePriceForModel) / context.averagePriceForModel;
      score += Math.min(priceDeviation, 1.0) * 0.4; // Max 40% of score
    }
    
    // Rarity component
    if (context.rarityScore !== undefined) {
      score += context.rarityScore * 0.3; // Max 30% of score
    }
    
    // Source reliability component
    if (context.sourceReliability !== undefined) {
      score += (1 - context.sourceReliability) * 0.2; // Max 20% of score
    }
    
    // Cache status component (prioritize cache misses)
    if (context.cacheStatus === 'cold') {
      score += 0.1; // 10% boost for cold cache
    }
    
    return Math.min(score, 1.0);
  }

  private identifyTriggerType(listing: MarketplaceListing, context: any, anomalyScore: number): string {
    // Prioritize by severity and budget impact
    if (anomalyScore > 0.7) return 'suspicious_listing';
    if (context.averagePriceForModel && Math.abs(listing.price - context.averagePriceForModel) / context.averagePriceForModel > 0.3) {
      return 'price_outlier';
    }
    if (context.rarityScore && context.rarityScore > 0.8) return 'rare_model';
    if (context.sourceReliability && context.sourceReliability < 0.5) return 'new_portal';
    
    return 'market_change';
  }

  private async detectAnomalies(listing: MarketplaceListing, marketData: any): Promise<string[]> {
    const anomalies: string[] = [];
    
    // Price-based anomalies
    if (marketData && marketData.averagePrice) {
      const deviation = Math.abs(listing.price - marketData.averagePrice) / marketData.averagePrice;
      if (deviation > 0.3) {
        anomalies.push(listing.price > marketData.averagePrice ? 'Overpriced' : 'Underpriced');
      }
    }
    
    // Market-based anomalies  
    if (marketData && marketData.listings) {
      if (marketData.listings.length < 3) {
        anomalies.push('Rare model - limited market data');
      }
    }
    
    return anomalies;
  }

  private generateMarketInsights(listing: MarketplaceListing, marketData: any) {
    let pricePosition: 'underpriced' | 'fair' | 'overpriced' = 'fair';
    let demandLevel: 'low' | 'medium' | 'high' = 'medium';
    let marketTrend: 'rising' | 'stable' | 'falling' = 'stable';
    
    if (marketData && marketData.averagePrice) {
      const priceRatio = listing.price / marketData.averagePrice;
      if (priceRatio < 0.9) pricePosition = 'underpriced';
      else if (priceRatio > 1.1) pricePosition = 'overpriced';
    }
    
    if (marketData && marketData.demandScore) {
      if (marketData.demandScore > 0.7) demandLevel = 'high';
      else if (marketData.demandScore < 0.3) demandLevel = 'low';
    }
    
    return { pricePosition, demandLevel, marketTrend };
  }

  private calculateValidationConfidence(marketData: any, anomalies: string[]): number {
    let confidence = 50; // Base confidence
    
    // Higher confidence with more market data
    if (marketData && marketData.dataPoints) {
      confidence += Math.min(marketData.dataPoints * 5, 30);
    }
    
    // Lower confidence with more anomalies
    confidence -= anomalies.length * 10;
    
    return Math.max(10, Math.min(confidence, 95));
  }

  private makeRecommendation(confidence: number, anomalies: string[], insights: any): 'approve' | 'investigate' | 'flag' | 'reject' {
    if (anomalies.length === 0 && confidence > 80) return 'approve';
    if (anomalies.length > 2 || confidence < 30) return 'reject';
    if (anomalies.includes('Rare model') || insights.pricePosition === 'underpriced') return 'investigate';
    return 'flag';
  }

  /**
   * UTILITY FUNCTIONS
   */
  private groupListingsByModel(listings: MarketplaceListing[]): Record<string, MarketplaceListing[]> {
    return listings.reduce((groups, listing) => {
      const key = `${listing.brand}_${listing.model}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(listing);
      return groups;
    }, {} as Record<string, MarketplaceListing[]>);
  }

  private analyzeCityDistribution(listings: MarketplaceListing[]) {
    const cities = listings.map(l => l.city);
    const distribution = cities.reduce((dist, city) => {
      dist[city] = (dist[city] || 0) + 1;
      return dist;
    }, {} as Record<string, number>);
    
    return distribution;
  }

  private analyzeYearDistribution(listings: MarketplaceListing[]) {
    const years = listings.map(l => l.year);
    const distribution = years.reduce((dist, year) => {
      dist[year] = (dist[year] || 0) + 1;
      return dist;
    }, {} as Record<number, number>);
    
    return distribution;
  }

  private hasUnusualDistribution(cityDistribution: Record<string, number>): boolean {
    const cities = Object.keys(cityDistribution);
    const counts = Object.values(cityDistribution);
    
    // Check if one city dominates (>80% of listings)
    const maxCount = Math.max(...counts);
    const totalCount = counts.reduce((sum, count) => sum + count, 0);
    
    return (maxCount / totalCount) > 0.8 && cities.length > 2;
  }

  private hasUnusualYearPattern(yearDistribution: Record<number, number>): boolean {
    const years = Object.keys(yearDistribution).map(Number);
    const yearSpan = Math.max(...years) - Math.min(...years);
    
    // Unusual if span is very large (>15 years) or very small (<2 years)
    return yearSpan > 15 || (yearSpan < 2 && years.length > 3);
  }

  /**
   * PUBLIC METRICS AND STATUS
   */
  getValidationMetrics() {
    return {
      dailyBudget: this.dailyValidationBudget,
      currentSpend: this.currentDailySpend,
      remainingBudget: this.dailyValidationBudget - this.currentDailySpend,
      validationCount: this.validationCount,
      budgetUtilization: (this.currentDailySpend / this.dailyValidationBudget) * 100,
      averageCostPerValidation: this.validationCount > 0 ? this.currentDailySpend / this.validationCount : 0
    };
  }

  updateBudgetSettings(newDailyBudget: number) {
    this.dailyValidationBudget = newDailyBudget;
    console.log(`💰 Updated daily Perplexity validation budget to $${newDailyBudget}`);
  }

  getTriggerSettings() {
    return { ...this.validationTriggers };
  }

  updateTriggerSettings(triggerType: string, updates: Partial<ValidationTrigger>) {
    if (this.validationTriggers[triggerType]) {
      this.validationTriggers[triggerType] = { 
        ...this.validationTriggers[triggerType], 
        ...updates 
      };
    }
  }
}

export const perplexityValidator = new PerplexityValidator();