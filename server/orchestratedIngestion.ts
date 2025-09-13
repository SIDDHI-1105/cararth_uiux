import { AIOrchestrator } from './aiOrchestrator';
import { TrustLayer } from './trustLayer';
import { GeminiProcessor } from './geminiProcessor';
import { PerplexityValidator } from './perplexityValidator';
import { MarketplaceListing, EnhancedMarketplaceListing } from './marketplaceAggregator';
import { storage } from './storage';
import { aiDataExtraction } from './aiDataExtraction';

// Orchestrated batch ingestion pipeline
export interface OrchestratedIngestionResult {
  totalProcessed: number;
  successful: number;
  failed: number;
  duplicatesFound: number;
  trustRejected: number;
  anomaliesDetected: number;
  processingTime: number;
  costBreakdown: {
    firecrawl: number;
    openai: number;
    claude: number;
    gemini: number;
    perplexity: number;
    total: number;
  };
  pipelineStats: {
    orchestrationDecisions: number;
    trustScreenings: number;
    validations: number;
    normalizations: number;
    deduplicationAttempts: number;
  };
}

export class OrchestratedBatchIngestion {
  private orchestrator: AIOrchestrator;
  private trustLayer: TrustLayer;
  private geminiProcessor: GeminiProcessor;
  private perplexityValidator: PerplexityValidator;
  
  private processingMetrics = {
    totalRuns: 0,
    totalListingsProcessed: 0,
    averageSuccessRate: 0,
    averageProcessingTime: 0,
    totalCostSpent: 0
  };

  constructor() {
    this.orchestrator = new AIOrchestrator();
    this.trustLayer = new TrustLayer();
    this.geminiProcessor = new GeminiProcessor();
    this.perplexityValidator = new PerplexityValidator();
  }

  /**
   * MAIN ORCHESTRATED INGESTION PIPELINE
   */
  async runIngestion(cities: string[] = ['hyderabad', 'mumbai']): Promise<OrchestratedIngestionResult> {
    console.log(`🚀 Starting orchestrated batch ingestion for cities: ${cities.join(', ')}`);
    const startTime = Date.now();
    
    const result: OrchestratedIngestionResult = {
      totalProcessed: 0,
      successful: 0,
      failed: 0,
      duplicatesFound: 0,
      trustRejected: 0,
      anomaliesDetected: 0,
      processingTime: 0,
      costBreakdown: {
        firecrawl: 0,
        openai: 0,
        claude: 0,
        gemini: 0,
        perplexity: 0,
        total: 0
      },
      pipelineStats: {
        orchestrationDecisions: 0,
        trustScreenings: 0,
        validations: 0,
        normalizations: 0,
        deduplicationAttempts: 0
      }
    };

    try {
      // Phase 1: Intelligent Data Extraction
      console.log(`📡 Phase 1: AI-Orchestrated Data Extraction`);
      const rawListings = await this.orchestratedExtraction(cities, result);
      result.totalProcessed = rawListings.length;
      
      if (rawListings.length === 0) {
        console.log(`⚠️ No listings extracted - stopping pipeline`);
        return result;
      }

      // Phase 2: Bulk Normalization (Gemini)
      console.log(`🔧 Phase 2: Bulk Data Normalization`);
      const normalizedListings = await this.bulkNormalization(rawListings, result);
      
      // Phase 3: Trust Screening (Claude)
      console.log(`🛡️ Phase 3: Trust Layer Screening`);
      const trustedListings = await this.trustScreening(normalizedListings, result);
      
      // Phase 4: Deduplication (OpenAI Embeddings)
      console.log(`🔍 Phase 4: Intelligent Deduplication`);
      const deduplicatedListings = await this.smartDeduplication(trustedListings, result);
      
      // Phase 5: Selective Validation (Perplexity)
      console.log(`✅ Phase 5: Selective Real-time Validation`);
      const validatedListings = await this.selectiveValidation(deduplicatedListings, result);
      
      // Phase 6: Final Storage
      console.log(`💾 Phase 6: Enhanced Storage`);
      await this.enhancedStorage(validatedListings, result);
      
      result.successful = validatedListings.length;
      result.processingTime = Date.now() - startTime;
      
      // Update metrics
      this.updateMetrics(result);
      
      console.log(`✅ Orchestrated ingestion complete: ${result.successful}/${result.totalProcessed} listings processed (${Math.round((result.successful/result.totalProcessed)*100)}% success rate)`);
      console.log(`💰 Total cost: $${result.costBreakdown.total.toFixed(3)} | Time: ${Math.round(result.processingTime/1000)}s`);
      
      return result;
      
    } catch (error) {
      console.error(`🚨 Orchestrated ingestion failed:`, error);
      result.processingTime = Date.now() - startTime;
      return result;
    }
  }

  /**
   * PHASE 1: AI-ORCHESTRATED DATA EXTRACTION
   */
  private async orchestratedExtraction(cities: string[], result: OrchestratedIngestionResult): Promise<any[]> {
    const portals = ['cardekho.com', 'cars24.com', 'carwale.com', 'olx.in', 'droom.in'];
    const allRawData: any[] = [];
    
    for (const city of cities) {
      for (const portal of portals) {
        try {
          const portalUrl = this.buildPortalUrl(portal, city);
          
          // Get orchestration decision
          const routingDecision = await this.orchestrator.routeExtractionTask(portalUrl, {
            domain: portal,
            contentType: this.isStructuredDomain(portal) ? 'structured' : 'unstructured',
            priority: this.getCityPriority(city),
            cacheStatus: await this.getCacheStatus(portalUrl)
          });
          
          result.pipelineStats.orchestrationDecisions++;
          result.costBreakdown.openai += 0.01; // Small cost for routing decision
          
          console.log(`🤖 ${portal} (${city}): ${routingDecision.reason}`);
          
          if (!routingDecision.budgetCheck) {
            console.log(`💰 Skipping ${portal} - budget constraints`);
            continue;
          }
          
          // Execute extraction based on routing decision
          const extractedData = await this.executeExtraction(portalUrl, routingDecision, city);
          if (extractedData && extractedData.length > 0) {
            allRawData.push(...extractedData);
            
            // Update cost tracking based on service used
            this.updateExtractionCosts(routingDecision.primaryService, result);
          }
          
        } catch (error) {
          console.error(`🚨 Extraction failed for ${portal} (${city}):`, error);
          result.failed++;
        }
      }
    }
    
    console.log(`📊 Extraction complete: ${allRawData.length} raw listings from ${cities.length} cities`);
    return allRawData;
  }

  /**
   * PHASE 2: BULK NORMALIZATION
   */
  private async bulkNormalization(rawListings: any[], result: OrchestratedIngestionResult): Promise<MarketplaceListing[]> {
    const bulkResult = await this.geminiProcessor.bulkNormalizeListings(rawListings);
    
    result.pipelineStats.normalizations += bulkResult.processedCount;
    result.costBreakdown.gemini += this.estimateGeminiCost(bulkResult.processedCount);
    result.failed += bulkResult.failedCount;
    
    console.log(`🔧 Normalization: ${bulkResult.normalizedListings.length}/${bulkResult.processedCount} successfully normalized`);
    
    if (bulkResult.errors.length > 0) {
      console.log(`⚠️ Normalization errors: ${bulkResult.errors.slice(0, 3).join('; ')}`);
    }
    
    return bulkResult.normalizedListings;
  }

  /**
   * PHASE 3: TRUST LAYER SCREENING
   */
  private async trustScreening(listings: MarketplaceListing[], result: OrchestratedIngestionResult): Promise<MarketplaceListing[]> {
    const trustResults = await this.trustLayer.screenListings(listings);
    
    result.pipelineStats.trustScreenings += trustResults.length;
    result.costBreakdown.claude += this.estimateClaudeCost(trustResults.length);
    
    const approvedListings: MarketplaceListing[] = [];
    
    trustResults.forEach(({ listing, trustResult }) => {
      if (trustResult.isApproved) {
        approvedListings.push(listing);
      } else {
        result.trustRejected++;
        
        // Log rejection reasons for monitoring
        if (trustResult.actions.includes('reject')) {
          console.log(`🚫 Rejected: ${listing.title} - ${trustResult.explanation}`);
        }
      }
    });
    
    console.log(`🛡️ Trust screening: ${approvedListings.length}/${listings.length} listings approved`);
    
    return approvedListings;
  }

  /**
   * PHASE 4: SMART DEDUPLICATION
   */
  private async smartDeduplication(listings: MarketplaceListing[], result: OrchestratedIngestionResult): Promise<MarketplaceListing[]> {
    const uniqueListings: MarketplaceListing[] = [];
    const duplicateIds = new Set<string>();
    
    for (const listing of listings) {
      result.pipelineStats.deduplicationAttempts++;
      
      const deduplicationResult = await this.orchestrator.findDuplicateListings(listing);
      
      if (deduplicationResult.isDuplicate && deduplicationResult.canonicalId) {
        duplicateIds.add(listing.id);
        result.duplicatesFound++;
        
        console.log(`🔍 Duplicate detected: ${listing.title} -> canonical: ${deduplicationResult.canonicalId} (${Math.round(deduplicationResult.confidence * 100)}% confidence)`);
      } else {
        uniqueListings.push(listing);
      }
      
      result.costBreakdown.openai += 0.02; // Cost per embedding
    }
    
    console.log(`🔍 Deduplication: ${uniqueListings.length}/${listings.length} unique listings identified`);
    
    return uniqueListings;
  }

  /**
   * PHASE 5: SELECTIVE VALIDATION
   */
  private async selectiveValidation(listings: MarketplaceListing[], result: OrchestratedIngestionResult): Promise<EnhancedMarketplaceListing[]> {
    const enhancedListings: EnhancedMarketplaceListing[] = [];
    
    // First, detect anomalies in batch
    const anomalies = await this.perplexityValidator.detectAnomaliesInBatch(listings);
    result.anomaliesDetected = anomalies.priceAnomalies.length + anomalies.marketAnomalies.length;
    
    console.log(`🔍 Batch anomaly detection: ${result.anomaliesDetected} anomalies found`);
    
    // Then selectively validate high-value listings
    for (const listing of listings) {
      const enhanced: EnhancedMarketplaceListing = {
        ...listing,
        overallQualityScore: 85 // Default quality score
      };
      
      // Check if this listing needs validation
      const shouldValidate = await this.perplexityValidator.shouldValidateListing(listing, {
        cacheStatus: 'miss', // Assume cache miss for new listings
        rarityScore: this.calculateRarityScore(listing, listings),
        sourceReliability: this.getSourceReliability(listing.source)
      });
      
      if (shouldValidate.shouldValidate) {
        try {
          const validationResult = await this.perplexityValidator.validateListing(listing);
          result.pipelineStats.validations++;
          result.costBreakdown.perplexity += validationResult.validationCost;
          
          // Enhance listing with validation results
          enhanced.overallQualityScore = validationResult.confidence;
          enhanced.authenticityRating = validationResult.confidence;
          
          console.log(`✅ Validated: ${listing.title} - ${validationResult.recommendedAction} (${validationResult.confidence}% confidence)`);
          
        } catch (error) {
          console.error(`🚨 Validation failed for ${listing.title}:`, error);
        }
      }
      
      enhancedListings.push(enhanced);
    }
    
    console.log(`✅ Selective validation: ${result.pipelineStats.validations}/${listings.length} listings validated`);
    
    return enhancedListings;
  }

  /**
   * PHASE 6: ENHANCED STORAGE
   */
  private async enhancedStorage(listings: EnhancedMarketplaceListing[], result: OrchestratedIngestionResult): Promise<void> {
    try {
      // Store in cached portal listings for fast search
      const storedCount = await this.storeEnhancedListings(listings);
      console.log(`💾 Storage: ${storedCount} listings stored successfully`);
      
    } catch (error) {
      console.error(`🚨 Storage failed:`, error);
      throw error;
    }
  }

  /**
   * UTILITY METHODS
   */
  private buildPortalUrl(portal: string, city: string): string {
    const urlTemplates = {
      'cardekho.com': `https://www.cardekho.com/used-cars/${city}`,
      'cars24.com': `https://www.cars24.com/buy-used-cars/${city}`,
      'carwale.com': `https://www.carwale.com/used-cars-${city}`,
      'olx.in': `https://www.olx.in/${city}/cars_c84`,
      'droom.in': `https://droom.in/buy-used-cars-${city}`
    };
    
    return urlTemplates[portal] || `https://${portal}/used-cars/${city}`;
  }

  private isStructuredDomain(domain: string): boolean {
    return ['cardekho.com', 'cars24.com', 'carwale.com'].includes(domain);
  }

  private getCityPriority(city: string): 'high' | 'medium' | 'low' {
    const highPriority = ['hyderabad', 'mumbai', 'bangalore', 'delhi'];
    const mediumPriority = ['chennai', 'kolkata', 'pune', 'ahmedabad'];
    
    if (highPriority.includes(city.toLowerCase())) return 'high';
    if (mediumPriority.includes(city.toLowerCase())) return 'medium';
    return 'low';
  }

  private async getCacheStatus(url: string): Promise<'hit' | 'miss' | 'cold'> {
    // Simple cache status check - could be enhanced
    return Math.random() > 0.7 ? 'hit' : 'miss';
  }

  private async executeExtraction(url: string, decision: any, city: string): Promise<any[]> {
    try {
      // Use the existing aiDataExtraction service but with orchestrated decisions
      const listings = await aiDataExtraction.extractFromUrl(url);
      return listings || [];
    } catch (error) {
      console.error(`🚨 Extraction execution failed for ${url}:`, error);
      return [];
    }
  }

  private updateExtractionCosts(service: string, result: OrchestratedIngestionResult): void {
    const costs = {
      'firecrawl': 0.5,
      'gemini': 0.2,
      'perplexity': 1.0
    };
    
    const cost = costs[service] || 0.3;
    result.costBreakdown[service as keyof typeof result.costBreakdown] += cost;
  }

  private estimateGeminiCost(count: number): number {
    return count * 0.02; // ~$0.02 per listing for normalization
  }

  private estimateClaudeCost(count: number): number {
    return count * 0.05; // ~$0.05 per listing for trust screening
  }

  private calculateRarityScore(listing: MarketplaceListing, allListings: MarketplaceListing[]): number {
    const modelListings = allListings.filter(l => 
      l.brand === listing.brand && l.model === listing.model
    );
    
    return 1 - (modelListings.length / allListings.length);
  }

  private getSourceReliability(source: string): number {
    const reliabilityScores = {
      'cardekho.com': 0.9,
      'cars24.com': 0.85,
      'carwale.com': 0.8,
      'olx.in': 0.4,
      'droom.in': 0.6
    };
    
    return reliabilityScores[source] || 0.5;
  }

  private async storeEnhancedListings(listings: EnhancedMarketplaceListing[]): Promise<number> {
    let storedCount = 0;
    
    for (const listing of listings) {
      try {
        // Store in cached_portal_listings table
        const cacheData = {
          id: listing.id,
          title: listing.title,
          brand: listing.brand,
          model: listing.model,
          year: listing.year,
          price: listing.price,
          mileage: listing.mileage,
          fuelType: listing.fuelType,
          transmission: listing.transmission,
          location: listing.location,
          city: listing.city,
          state: listing.state || '',
          images: listing.images || [],
          source: listing.source,
          url: listing.url,
          condition: listing.condition,
          sellerType: listing.sellerType,
          verificationStatus: listing.verificationStatus,
          listingDate: new Date(),
          owners: 1
        };
        
        // Use storage interface to save
        await storage.createCachedPortalListing(cacheData);
        storedCount++;
        
      } catch (error) {
        console.error(`🚨 Failed to store listing ${listing.id}:`, error);
      }
    }
    
    return storedCount;
  }

  private updateMetrics(result: OrchestratedIngestionResult): void {
    this.processingMetrics.totalRuns++;
    this.processingMetrics.totalListingsProcessed += result.totalProcessed;
    this.processingMetrics.averageSuccessRate = 
      (this.processingMetrics.averageSuccessRate + (result.successful / result.totalProcessed)) / 2;
    this.processingMetrics.averageProcessingTime = 
      (this.processingMetrics.averageProcessingTime + result.processingTime) / 2;
    
    // Calculate total cost
    result.costBreakdown.total = Object.values(result.costBreakdown)
      .filter(cost => typeof cost === 'number' && cost !== result.costBreakdown.total)
      .reduce((sum, cost) => sum + cost, 0);
    
    this.processingMetrics.totalCostSpent += result.costBreakdown.total;
  }

  /**
   * PUBLIC MONITORING APIs
   */
  getIngestionMetrics() {
    return {
      ...this.processingMetrics,
      orchestratorStatus: this.orchestrator.getBudgetStatus(),
      trustLayerMetrics: this.trustLayer.getTrustMetrics(),
      geminiMetrics: this.geminiProcessor.getMetrics(),
      perplexityMetrics: this.perplexityValidator.getValidationMetrics()
    };
  }

  async getSystemStatus() {
    return {
      orchestrator: {
        budgetStatus: this.orchestrator.getBudgetStatus(),
        cacheStats: this.orchestrator.getCacheStats()
      },
      trustLayer: 'operational',
      geminiProcessor: 'operational', 
      perplexityValidator: {
        validationMetrics: this.perplexityValidator.getValidationMetrics(),
        triggerSettings: this.perplexityValidator.getTriggerSettings()
      }
    };
  }
}

export const orchestratedBatchIngestion = new OrchestratedBatchIngestion();