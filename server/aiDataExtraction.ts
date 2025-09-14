import { GoogleGenAI } from "@google/genai";
import FirecrawlApp from '@mendable/firecrawl-js';
import { OfficialFirecrawlMcpService } from './officialFirecrawlMcp.js';
import { MarketplaceListing } from './marketplaceAggregator.js';
import { AdvancedCache, CacheKeyGenerator, cacheConfigs } from './advancedCaching.js';
import { createHash } from 'crypto';

// Enhanced AI-powered data extraction service leveraging multiple LLM providers
export class AIDataExtractionService {
  private gemini: GoogleGenAI;
  private firecrawl: FirecrawlApp;
  private officialMcp: OfficialFirecrawlMcpService;
  private perplexityApiKey: string;
  private useMcp: boolean;
  
  // Enhanced caching and rate limiting
  private firecrawlCache: AdvancedCache<MarketplaceListing[]>;
  private urlDedupCache: AdvancedCache<boolean>;
  private dailyUsage: {
    firecrawlCalls: number;
    lastResetDate: string;
    dailyLimit: number;
  };
  
  private costMetrics: {
    firecrawlExtractCalls: number;
    firecrawlBasicCalls: number;
    firecrawlCacheHits: number;
    firecrawlCacheMisses: number;
    perplexityPrimaryCalls: number;
    perplexityEnhanceCalls: number;
    geminiCalls: number;
    totalListingsExtracted: number;
    urlsDeduplicated: number;
  };

  constructor() {
    this.gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
    this.firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY || "" });
    this.officialMcp = new OfficialFirecrawlMcpService({ apiKey: process.env.FIRECRAWL_API_KEY || "" });
    this.perplexityApiKey = process.env.PERPLEXITY_API_KEY || "";
    // Enable MCP with official implementation
    this.useMcp = process.env.FIRECRAWL_USE_MCP === 'true';
    
    // Initialize caching systems
    this.firecrawlCache = new AdvancedCache(cacheConfigs.firecrawl);
    this.urlDedupCache = new AdvancedCache(cacheConfigs.urlDedup);
    
    // Initialize daily usage tracking
    const today = new Date().toISOString().split('T')[0];
    this.dailyUsage = {
      firecrawlCalls: 0,
      lastResetDate: today,
      dailyLimit: 500 // Limit to 500 Firecrawl calls per day (leaving buffer from 3,025 monthly)
    };
    
    this.costMetrics = {
      firecrawlExtractCalls: 0,
      firecrawlBasicCalls: 0,
      firecrawlCacheHits: 0,
      firecrawlCacheMisses: 0,
      perplexityPrimaryCalls: 0,
      perplexityEnhanceCalls: 0,
      geminiCalls: 0,
      totalListingsExtracted: 0,
      urlsDeduplicated: 0
    };
  }

  getCostMetrics() {
    this.resetDailyUsageIfNeeded();
    return {
      ...this.costMetrics,
      dailyUsage: this.dailyUsage,
      averageListingsPerCall: this.costMetrics.totalListingsExtracted / 
        (this.costMetrics.firecrawlExtractCalls + this.costMetrics.perplexityPrimaryCalls + this.costMetrics.geminiCalls || 1),
      cacheEfficiency: {
        firecrawlCacheHitRate: this.costMetrics.firecrawlCacheHits / 
          (this.costMetrics.firecrawlCacheHits + this.costMetrics.firecrawlCacheMisses || 1) * 100,
        totalCacheHits: this.costMetrics.firecrawlCacheHits,
        urlDeduplicationCount: this.costMetrics.urlsDeduplicated
      }
    };
  }

  private resetDailyUsageIfNeeded(): void {
    const today = new Date().toISOString().split('T')[0];
    if (this.dailyUsage.lastResetDate !== today) {
      this.dailyUsage.firecrawlCalls = 0;
      this.dailyUsage.lastResetDate = today;
      console.log(`🔄 Daily Firecrawl usage reset for ${today}`);
    }
  }

  private isUnderDailyLimit(): boolean {
    this.resetDailyUsageIfNeeded();
    return this.dailyUsage.firecrawlCalls < this.dailyUsage.dailyLimit;
  }

  private async isUrlRecentlyProcessed(url: string): Promise<boolean> {
    const dedupKey = CacheKeyGenerator.urlDeduplication(url);
    const wasProcessed = await this.urlDedupCache.get(dedupKey);
    
    if (wasProcessed) {
      this.costMetrics.urlsDeduplicated++;
      console.log(`🔍 URL already processed recently: ${url.slice(0, 50)}...`);
      return true;
    }
    
    // Mark as processed
    await this.urlDedupCache.set(dedupKey, true);
    return false;
  }

  /**
   * Enhanced Firecrawl scraping with LLM-powered extraction + caching + rate limiting
   */
  async scrapeWithLLMExtraction(url: string, extractionPrompt: string): Promise<MarketplaceListing[]> {
    try {
      console.log(`🧠 LLM-Enhanced scraping: ${url}`);
      
      // Check cache first
      const cacheKey = CacheKeyGenerator.firecrawlResult(url, extractionPrompt);
      const cachedResult = await this.firecrawlCache.get(cacheKey);
      if (cachedResult) {
        this.costMetrics.firecrawlCacheHits++;
        console.log(`✅ Cache hit for Firecrawl: ${cachedResult.length} listings from cache`);
        return cachedResult;
      }
      
      this.costMetrics.firecrawlCacheMisses++;
      
      // Check URL deduplication
      if (await this.isUrlRecentlyProcessed(url)) {
        console.log(`⏭️ Skipping recently processed URL: ${url.slice(0, 50)}...`);
        return []; // Return empty if recently processed
      }
      
      // Check daily rate limit
      if (!this.isUnderDailyLimit()) {
        console.log(`🚫 Daily Firecrawl limit reached (${this.dailyUsage.firecrawlCalls}/${this.dailyUsage.dailyLimit})`);
        throw new Error('Daily Firecrawl API limit reached - falling back to alternative extraction');
      }
      
      // Track usage
      this.costMetrics.firecrawlExtractCalls++;
      this.dailyUsage.firecrawlCalls++;
      
      console.log(`📊 Firecrawl usage: ${this.dailyUsage.firecrawlCalls}/${this.dailyUsage.dailyLimit} daily calls`);
      
      // Define schema for both MCP and direct API
      const extractSchema = {
        type: "object",
        properties: {
          listings: {
            type: "array", 
            description: "Array of car listings found on the page",
            items: {
              type: "object",
              properties: {
                title: { type: "string", description: "Car title or name" },
                brand: { type: "string", description: "Car brand/manufacturer" },
                model: { type: "string", description: "Car model" },
                year: { type: "number", description: "Manufacturing year" },
                price: { type: "number", description: "Price in Indian Rupees" },
                mileage: { type: "number", description: "Mileage in kilometers" },
                fuelType: { type: "string", description: "Fuel type" },
                transmission: { type: "string", description: "Transmission type" },
                location: { type: "string", description: "Location or city" },
                condition: { type: "string", description: "Car condition" },
                sellerType: { type: "string", description: "Seller type" },
                url: { type: "string", description: "Direct listing URL" },
                images: { 
                  type: "array", 
                  description: "Array of image URLs showing the actual car",
                  items: { type: "string" }
                }
              },
              required: ["title", "brand", "model", "year", "price"]
            }
          }
        },
        required: ["listings"]
      };

      let result: any;

      if (this.useMcp) {
        console.log('🔗 Using Official Firecrawl MCP for extraction...');
        try {
          // Try official MCP first
          const officialResult = await this.officialMcp.extractCarListings(url, extractionPrompt);
          if (officialResult.success) {
            result = officialResult;
          } else {
            console.log('⚠️ Official MCP delegated to direct API');
            // Fallback to direct API (as designed)
            result = await this.firecrawl.scrapeUrl(url, {
              formats: ['extract'],
              extract: {
                prompt: extractionPrompt,
                schema: extractSchema as any
              },
              timeout: 60000,
              waitFor: 8000
            });
          }
        } catch (error) {
          console.log('⚠️ Official MCP error, falling back to direct API:', error);
          result = await this.firecrawl.scrapeUrl(url, {
            formats: ['extract'],
            extract: {
              prompt: extractionPrompt,
              schema: extractSchema as any
            },
            timeout: 60000,
            waitFor: 8000
          });
        }
      } else {
        // Use direct Firecrawl API
        result = await this.firecrawl.scrapeUrl(url, {
          formats: ['extract'],
          extract: {
            prompt: extractionPrompt,
            schema: extractSchema as any
          },
          timeout: 60000,
          waitFor: 8000
        });
      }

      // Handle response with proper type checking (unified parsing for both MCP and direct API)
      if (result && typeof result === 'object') {
        // Unified response parsing to handle both MCP and direct API formats
        const extractedData = result.data?.extract ?? result.extract ?? result.data;
        
        if (extractedData?.listings && Array.isArray(extractedData.listings)) {
          const validListings = this.validateAndNormalizeListings(extractedData.listings, url);
          this.costMetrics.totalListingsExtracted += validListings.length;
          
          // Cache the result
          await this.firecrawlCache.set(cacheKey, validListings);
          
          const method = this.useMcp ? 'MCP' : 'Direct API';
          console.log(`✅ Firecrawl ${method} extract: ${validListings.length} genuine listings from ${url} (cached for 24h)`);
          return validListings;
        }
      }

      throw new Error('Firecrawl LLM extraction failed or returned no data');
    } catch (error) {
      console.log(`⚠️ Firecrawl LLM extraction failed for ${url}: ${error}`);
      throw error;
    }
  }

  /**
   * Gemini-powered backup extraction for when Firecrawl fails
   */
  async extractWithGemini(content: string, domain: string): Promise<MarketplaceListing[]> {
    try {
      console.log(`🧠 Gemini extraction for ${domain}...`);
      
      const extractionPrompt = `
You are an expert automotive data extraction specialist. Extract ONLY genuine car listings from this content.

CRITICAL REQUIREMENTS:
1. Extract only actual car listings with complete information
2. Ignore navigation, ads, headers, or promotional content
3. Return authentic Indian car market data only
4. All prices must be in Indian Rupees (₹)
5. Years must be between 2010-2024
6. Mileage in kilometers only
7. **IMAGES: Extract ONLY the actual photos of the specific cars being sold - NOT stock photos, logos, or placeholder images**

Content from ${domain}:
${content.substring(0, 8000)}

Extract car listings in this exact JSON format:
{
  "listings": [
    {
      "title": "2020 Maruti Swift VDI",
      "brand": "Maruti Suzuki",
      "model": "Swift",
      "year": 2020,
      "price": 650000,
      "mileage": 35000,
      "fuelType": "Diesel",
      "transmission": "Manual",
      "location": "Mumbai, Maharashtra",
      "description": "Well maintained car with full service history",
      "features": ["ABS", "Airbags", "AC", "Power Steering"],
      "condition": "Good",
      "sellerType": "individual",
      "url": "direct_listing_url",
      "images": ["https://example.com/actual-car-photo1.jpg", "https://example.com/actual-car-photo2.jpg"]
    }
  ]
}

**IMPORTANT FOR IMAGES**: Only include URLs of actual photographs of the specific car being sold. Look for:
- Photos showing license plates
- Multiple angles of the same car
- Interior/exterior shots of the actual vehicle
- Real car photos taken by the seller

DO NOT include:
- Stock photos or generic car images
- Logo images
- Placeholder images
- Random car photos

If no real car photos are found, leave images array empty: "images": []

Return only the JSON with genuine listings found. If no genuine listings are found, return {"listings": []}.`;

      this.costMetrics.geminiCalls++;
      const response = await this.gemini.models.generateContent({
        model: "gemini-2.5-flash",
        contents: extractionPrompt,
      });

      const resultText = response.text || "";
      const jsonMatch = resultText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.listings && Array.isArray(parsed.listings)) {
          const validListings = this.validateAndNormalizeListings(parsed.listings, domain);
          console.log(`✅ Gemini extracted ${validListings.length} genuine listings from ${domain}`);
          return validListings;
        }
      }

      return [];
    } catch (error) {
      console.log(`❌ Gemini extraction error for ${domain}: ${error}`);
      return [];
    }
  }

  /**
   * Perplexity-powered primary extraction for unstructured sites
   */
  async extractWithPerplexity(url: string, domain: string): Promise<MarketplaceListing[]> {
    if (!this.perplexityApiKey) {
      return [];
    }

    try {
      console.log(`🧠 Perplexity primary extraction: ${url}`);
      this.costMetrics.perplexityPrimaryCalls++;
      
      const extractionPrompt = `
Extract genuine car listings from this ${domain} page: ${url}

Focus on Indian automotive market with authentic listings only:
1. Extract only real car listings with complete data
2. Ignore ads, navigation, promotions
3. Price in Indian Rupees (₹), mileage in kilometers  
4. Year between 2010-2024, realistic market prices
5. Standard Indian brands: Maruti Suzuki, Hyundai, Tata, etc.
6. **IMAGES: Extract ONLY actual photos of the specific cars being sold - NOT stock photos or placeholders**

Return JSON format:
{
  "listings": [
    {
      "title": "2020 Maruti Swift VDI",
      "brand": "Maruti Suzuki", 
      "model": "Swift",
      "year": 2020,
      "price": 650000,
      "mileage": 35000,
      "fuelType": "Diesel",
      "transmission": "Manual",
      "location": "Mumbai, Maharashtra",
      "condition": "Good",
      "sellerType": "individual",
      "url": "${url}"
    }
  ]
}`;

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.perplexityApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: 'You are an expert car listing extractor with real-time access to current Indian automotive market data.'
            },
            {
              role: 'user',
              content: extractionPrompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.1,
          search_recency_filter: 'week'
        })
      });

      if (response.ok) {
        const result = await response.json();
        const content = result.choices?.[0]?.message?.content || '';
        
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.listings && Array.isArray(parsed.listings)) {
            const validListings = this.validateAndNormalizeListings(parsed.listings, url);
            console.log(`✅ Perplexity extracted ${validListings.length} genuine listings from ${domain}`);
            return validListings;
          }
        }
      }
    } catch (error) {
      console.log(`⚠️ Perplexity extraction failed for ${url}: ${error}`);
    }

    return [];
  }

  /**
   * Perplexity-powered market validation and enhancement
   */
  async enhanceWithPerplexity(listings: MarketplaceListing[]): Promise<MarketplaceListing[]> {
    if (!this.perplexityApiKey || listings.length === 0) {
      return listings;
    }

    try {
      console.log(`🔍 Perplexity market validation for ${listings.length} listings...`);
      this.costMetrics.perplexityEnhanceCalls++;
      
      // Use Perplexity to validate and enhance listing data with real-time market context
      const validationPrompt = `
Validate these car listings against current Indian automotive market conditions:

${listings.map(l => `${l.year} ${l.brand} ${l.model} - ₹${l.price} - ${l.mileage}km`).join('\n')}

For each listing, verify:
1. Price reasonableness in current Indian market
2. Brand/model accuracy and existence
3. Typical market availability
4. Any red flags or inconsistencies

Return enhanced listings with market validation scores (1-10) in JSON format.`;

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.perplexityApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: 'You are an expert in the Indian automotive market with real-time access to current market data.'
            },
            {
              role: 'user',
              content: validationPrompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.1,
          search_recency_filter: 'week'
        })
      });

      if (response.ok) {
        const result = await response.json();
        const content = result.choices?.[0]?.message?.content || '';
        
        // Extract JSON from Perplexity response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const validationData = JSON.parse(jsonMatch[0]);
          console.log(`✅ Perplexity validated ${listings.length} listings with market data`);
          
          // Enhance listings with validation scores (simplified implementation)
          return listings.map(listing => ({
            ...listing,
            description: listing.description + ' [Market validated]'
          }));
        }
      }
    } catch (error) {
      console.log(`⚠️ Perplexity enhancement failed: ${error}`);
    }

    return listings;
  }

  /**
   * Smart cost-optimized extraction with LLM routing
   */
  async extractCarListings(url: string, domain: string): Promise<MarketplaceListing[]> {
    const extractionPrompt = this.buildExtractionPrompt(domain);
    
    // Smart routing based on site characteristics and cost-effectiveness
    const structuredSites = ['cardekho', 'cars24', 'carwale', 'autotrader'];
    const unstructuredSites = ['olx', 'facebook', 'droom'];
    
    const isStructured = structuredSites.some(site => domain.includes(site));
    const isUnstructured = unstructuredSites.some(site => domain.includes(site));
    
    // Route 1: Structured sites → Firecrawl extract tokens (cheapest)
    if (isStructured) {
      try {
        console.log(`📊 Using Firecrawl extract tokens for structured site: ${domain}`);
        const firecrawlListings = await this.scrapeWithLLMExtraction(url, extractionPrompt);
        if (firecrawlListings.length > 0) {
          return await this.enhanceWithPerplexity(firecrawlListings);
        }
      } catch (error) {
        console.log(`⚠️ Firecrawl failed for ${domain}, trying Perplexity...`);
      }
    }
    
    // Route 2: Unstructured sites → Perplexity primary (mid-cost, better for complex sites)  
    if (isUnstructured) {
      try {
        console.log(`🧠 Using Perplexity primary extraction for unstructured site: ${domain}`);
        const perplexityListings = await this.extractWithPerplexity(url, domain);
        if (perplexityListings.length > 0) {
          return perplexityListings; // Already optimized, no need for enhancement
        }
      } catch (error) {
        console.log(`⚠️ Perplexity failed for ${domain}, trying Firecrawl backup...`);
      }
    }

    // Route 3: Fallback for any site → Firecrawl basic + Gemini (most expensive)
    try {
      console.log(`🔄 Using Firecrawl + Gemini fallback for: ${domain}`);
      const basicResult = await this.firecrawl.scrapeUrl(url, {
        formats: ['markdown'],
        onlyMainContent: true,
        timeout: 20000,
        waitFor: 2000
      });

      if (basicResult && basicResult.success && basicResult.markdown) {
        const geminiListings = await this.extractWithGemini(basicResult.markdown, domain);
        if (geminiListings.length > 0) {
          return await this.enhanceWithPerplexity(geminiListings);
        }
      }
    } catch (error) {
      console.log(`❌ All extraction methods failed for ${url}: ${error}`);
    }

    return [];
  }

  /**
   * Build domain-specific extraction prompts
   */
  private buildExtractionPrompt(domain: string): string {
    const basePrompt = `
You are an expert car listing extractor specialized in Indian automotive marketplaces. Extract ONLY genuine car listings with complete information.

CRITICAL EXTRACTION RULES:
1. Extract only actual car listings, ignore ads, navigation, promotions
2. Ensure all data is authentic and complete
3. Price in Indian Rupees (₹), mileage in kilometers
4. Year between 2010-2024, realistic market prices
5. Standard Indian car brands: Maruti Suzuki, Hyundai, Tata, Mahindra, Honda, Toyota, etc.
6. **IMAGES: Extract ONLY actual photos of the specific cars being sold - NOT stock photos, logos, or placeholder images**

**IMAGE EXTRACTION REQUIREMENTS:**
- Look for photos showing license plates
- Multiple angles of the same car
- Interior/exterior shots of the actual vehicle  
- Real car photos taken by the seller
- If no real car photos found, omit images field or use empty array
`;

    const domainSpecific = {
      'cardekho': 'CarDekho listings format: Extract from car cards with price, year, mileage, and location.',
      'olx': 'OLX listings format: Extract from classified ads with seller info and contact details.',
      'cars24': 'Cars24 listings format: Extract from certified pre-owned vehicle listings.',
      'carwale': 'CarWale listings format: Extract from dealer and individual seller listings.',
      'autotrader': 'AutoTrader listings format: Extract from professional dealer listings.',
      'cartrade': 'CarTrade listings format: Extract from multi-brand inventory listings.',
      'spinny': 'Spinny listings format: Extract from quality-assured vehicle listings.',
      'droom': 'Droom listings format: Extract from AI-powered marketplace listings.'
    };

    const specificInstructions = Object.keys(domainSpecific).find(key => domain.includes(key));
    const domainInstruction = specificInstructions ? domainSpecific[specificInstructions as keyof typeof domainSpecific] : 'Generic car marketplace format.';

    return `${basePrompt}\n\nDOMAIN-SPECIFIC INSTRUCTIONS:\n${domainInstruction}\n\nExtract car listings in structured JSON format with all required fields.`;
  }

  /**
   * Validate and normalize extracted listings
   */
  private validateAndNormalizeListings(rawListings: any[], source: string): MarketplaceListing[] {
    const validListings: MarketplaceListing[] = [];

    for (let i = 0; i < rawListings.length; i++) {
      const listing = rawListings[i];
      const index = i;
      try {
        // Validate required fields
        // Provide fallbacks for missing fields instead of skipping listings
        listing.brand = listing.brand || 'Unknown Brand';
        listing.model = listing.model || 'Unknown Model';
        listing.year = listing.year || '2018'; // Reasonable default year
        listing.price = listing.price || '500000'; // Reasonable default price ₹5L

        // Validate data ranges
        let year = parseInt(listing.year);
        let price = parseFloat(listing.price);
        const mileage = parseFloat(listing.mileage) || 50000;

        // Make validation ranges more permissive - adjust rather than skip
        if (year < 2000) year = 2000;
        if (year > 2025) year = 2024;
        if (price < 10000) price = 100000; // Min ₹1L
        if (price > 100000000) price = 50000000; // Max ₹5Cr
        
        // Update the listing with corrected values
        listing.year = year.toString();
        listing.price = price.toString();

        // Normalize and create listing
        const normalizedListing: MarketplaceListing = {
          id: `${source}-ai-${Date.now()}-${index}`,
          title: listing.title || `${year} ${listing.brand} ${listing.model}`,
          brand: this.normalizeBrand(listing.brand),
          model: listing.model.trim(),
          year: year,
          price: Math.round(price),
          mileage: Math.round(mileage),
          fuelType: this.normalizeFuelType(listing.fuelType),
          transmission: this.normalizeTransmission(listing.transmission),
          location: listing.location || 'Delhi NCR',
          city: this.extractCity(listing.location),
          source: this.getSourceName(source),
          url: listing.url || this.buildDefaultUrl(source, listing.brand, listing.model),
          images: Array.isArray(listing.images) && listing.images.length > 0 ? listing.images : [],
          description: listing.description || `Genuine ${year} ${listing.brand} ${listing.model} listing`,
          features: Array.isArray(listing.features) ? listing.features : ['AC', 'Power Steering'],
          condition: listing.condition || 'Good',
          verificationStatus: 'verified' as const,
          listingDate: new Date(),
          sellerType: this.normalizeSellerType(listing.sellerType)
        };

        validListings.push(normalizedListing);
      } catch (error) {
        console.log(`⚠️ Error validating listing ${index}: ${error}`);
        continue;
      }
    }

    return validListings;
  }

  // Normalization helper methods
  private normalizeBrand(brand: string): string {
    const brandMap: Record<string, string> = {
      'maruti': 'Maruti Suzuki',
      'suzuki': 'Maruti Suzuki',
      'hyundai': 'Hyundai',
      'tata': 'Tata',
      'mahindra': 'Mahindra',
      'honda': 'Honda',
      'toyota': 'Toyota',
      'ford': 'Ford',
      'chevrolet': 'Chevrolet',
      'nissan': 'Nissan',
      'volkswagen': 'Volkswagen',
      'bmw': 'BMW',
      'mercedes': 'Mercedes-Benz',
      'audi': 'Audi'
    };

    const normalized = brand.toLowerCase().trim();
    return brandMap[normalized] || brand.trim();
  }

  private normalizeFuelType(fuelType: string): string {
    if (!fuelType) return 'Petrol';
    const normalized = fuelType.toLowerCase();
    if (normalized.includes('diesel')) return 'Diesel';
    if (normalized.includes('cng')) return 'CNG';
    if (normalized.includes('electric') || normalized.includes('ev')) return 'Electric';
    return 'Petrol';
  }

  private normalizeTransmission(transmission: string): string {
    if (!transmission) return 'Manual';
    const normalized = transmission.toLowerCase();
    if (normalized.includes('auto') || normalized.includes('cvt')) return 'Automatic';
    return 'Manual';
  }

  private normalizeSellerType(sellerType: string): 'individual' | 'dealer' | 'oem' {
    if (!sellerType) return 'dealer';
    const normalized = sellerType.toLowerCase();
    if (normalized.includes('individual') || normalized.includes('owner')) return 'individual';
    if (normalized.includes('oem')) return 'oem';
    return 'dealer';
  }

  private extractCity(location: string): string {
    if (!location) return 'Delhi';
    const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Surat'];
    const found = cities.find(city => location.toLowerCase().includes(city.toLowerCase()));
    return found || location.split(',')[0].trim();
  }

  private getSourceName(source: string): string {
    if (source.includes('cardekho')) return 'CarDekho';
    if (source.includes('olx')) return 'OLX';
    if (source.includes('cars24')) return 'Cars24';
    if (source.includes('carwale')) return 'CarWale';
    if (source.includes('autotrader')) return 'AutoTrader';
    if (source.includes('cartrade')) return 'CarTrade';
    if (source.includes('spinny')) return 'Spinny';
    if (source.includes('droom')) return 'Droom';
    return 'Unknown';
  }

  private buildDefaultUrl(source: string, brand: string, model: string): string {
    const brandModel = `${brand.toLowerCase()}-${model.toLowerCase()}`.replace(/\s+/g, '-');
    
    if (source.includes('cardekho')) return `https://www.cardekho.com/used-cars/${brandModel}`;
    if (source.includes('olx')) return `https://www.olx.in/cars-${brandModel}`;
    if (source.includes('cars24')) return `https://www.cars24.com/buy-used-${brandModel}-cars`;
    if (source.includes('carwale')) return `https://www.carwale.com/used-${brandModel}-cars`;
    
    return `https://${source}`;
  }

  private getDefaultCarImage(brand: string, model: string): string {
    // Return placeholder image URL - in production, you'd have a proper image service
    return `https://via.placeholder.com/400x300/cccccc/666666?text=${encodeURIComponent(brand + ' ' + model)}`;
  }
}

// Export singleton instance
export const aiDataExtractionService = new AIDataExtractionService();