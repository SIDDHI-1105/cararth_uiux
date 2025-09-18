import { GoogleGenAI } from '@google/genai';
import { MarketplaceListing } from './marketplaceAggregator';
import { aiDatabaseCache } from './aiDatabaseCache.js';

// Bulk processing capabilities for Gemini
export interface BulkProcessingResult {
  processedCount: number;
  normalizedListings: MarketplaceListing[];
  failedCount: number;
  processingTime: number;
  errors: string[];
}

// Price intelligence and market analysis
export interface PriceIntelligence {
  cityPriceBands: Record<string, {
    make: string;
    model: string;
    yearRange: string;
    priceRange: { min: number; max: number };
    averagePrice: number;
    dataPoints: number;
  }[]>;
  depreciation: {
    make: string;
    model: string;
    yearlyDepreciation: number;
    retainedValue: number;
  }[];
  marketTrends: {
    city: string;
    trending: 'up' | 'down' | 'stable';
    growth: number;
    insights: string[];
  }[];
}

// Data normalization patterns
interface NormalizationRules {
  brandVariations: Record<string, string>;
  modelNormalization: Record<string, string>;
  locationStandardization: Record<string, { city: string; state: string }>;
  fuelTypeMapping: Record<string, string>;
  transmissionMapping: Record<string, string>;
}

export class GeminiProcessor {
  private gemini: GoogleGenAI;
  private normalizationRules: NormalizationRules;
  private processingMetrics: {
    totalProcessed: number;
    totalNormalized: number;
    totalAnalyzed: number;
    averageProcessingTime: number;
    errorRate: number;
  };

  constructor() {
    this.gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
    
    this.normalizationRules = {
      brandVariations: {
        'maruti': 'Maruti Suzuki',
        'maruti suzuki': 'Maruti Suzuki', 
        'suzuki': 'Maruti Suzuki',
        'hyundai': 'Hyundai',
        'tata': 'Tata',
        'tata motors': 'Tata',
        'honda': 'Honda',
        'toyota': 'Toyota',
        'mahindra': 'Mahindra',
        'kia': 'Kia',
        'mg': 'MG',
        'morris garages': 'MG',
        'renault': 'Renault',
        'nissan': 'Nissan',
        'skoda': 'Skoda',
        'volkswagen': 'Volkswagen',
        'vw': 'Volkswagen',
        'ford': 'Ford',
        'bmw': 'BMW',
        'mercedes': 'Mercedes-Benz',
        'mercedes-benz': 'Mercedes-Benz',
        'audi': 'Audi',
        'jaguar': 'Jaguar',
        'land rover': 'Land Rover',
        'volvo': 'Volvo'
      },
      modelNormalization: {
        // Common model variations
        'swift dzire': 'Swift Dzire',
        'dzire': 'Swift Dzire',
        'wagon r': 'Wagon R',
        'wagonr': 'Wagon R',
        'i20': 'i20',
        'i-20': 'i20',
        'creta': 'Creta',
        'venue': 'Venue',
        'verna': 'Verna',
        'elantra': 'Elantra',
        'city': 'City',
        'civic': 'Civic',
        'accord': 'Accord',
        'crv': 'CR-V',
        'cr-v': 'CR-V'
      },
      locationStandardization: {
        'hyderabad': { city: 'Hyderabad', state: 'Telangana' },
        'hyd': { city: 'Hyderabad', state: 'Telangana' },
        'secunderabad': { city: 'Hyderabad', state: 'Telangana' },
        'delhi': { city: 'Delhi', state: 'Delhi' },
        'new delhi': { city: 'Delhi', state: 'Delhi' },
        'mumbai': { city: 'Mumbai', state: 'Maharashtra' },
        'bombay': { city: 'Mumbai', state: 'Maharashtra' },
        'bangalore': { city: 'Bangalore', state: 'Karnataka' },
        'bengaluru': { city: 'Bangalore', state: 'Karnataka' },
        'chennai': { city: 'Chennai', state: 'Tamil Nadu' },
        'madras': { city: 'Chennai', state: 'Tamil Nadu' },
        'kolkata': { city: 'Kolkata', state: 'West Bengal' },
        'calcutta': { city: 'Kolkata', state: 'West Bengal' },
        'pune': { city: 'Pune', state: 'Maharashtra' },
        'ahmedabad': { city: 'Ahmedabad', state: 'Gujarat' },
        'jaipur': { city: 'Jaipur', state: 'Rajasthan' },
        'surat': { city: 'Surat', state: 'Gujarat' },
        'lucknow': { city: 'Lucknow', state: 'Uttar Pradesh' },
        'kanpur': { city: 'Kanpur', state: 'Uttar Pradesh' },
        'nagpur': { city: 'Nagpur', state: 'Maharashtra' },
        'indore': { city: 'Indore', state: 'Madhya Pradesh' },
        'bhopal': { city: 'Bhopal', state: 'Madhya Pradesh' },
        'visakhapatnam': { city: 'Visakhapatnam', state: 'Andhra Pradesh' },
        'vizag': { city: 'Visakhapatnam', state: 'Andhra Pradesh' }
      },
      fuelTypeMapping: {
        'petrol': 'Petrol',
        'gasoline': 'Petrol',
        'gas': 'Petrol',
        'diesel': 'Diesel',
        'cng': 'CNG',
        'lpg': 'CNG', // Treating LPG as CNG for simplicity
        'electric': 'Electric',
        'ev': 'Electric',
        'hybrid': 'Hybrid',
        'hybrid petrol': 'Hybrid'
      },
      transmissionMapping: {
        'manual': 'Manual',
        'mt': 'Manual',
        'automatic': 'Automatic',
        'at': 'Automatic',
        'amt': 'AMT',
        'cvt': 'CVT',
        'dct': 'DCT',
        'auto': 'Automatic'
      }
    };

    this.processingMetrics = {
      totalProcessed: 0,
      totalNormalized: 0,
      totalAnalyzed: 0,
      averageProcessingTime: 0,
      errorRate: 0
    };
  }

  /**
   * BULK PROCESSING - Handle large batches efficiently
   */
  async bulkNormalizeListings(rawListings: any[]): Promise<BulkProcessingResult> {
    console.log(`🔧 Gemini bulk processing: ${rawListings.length} listings`);
    const startTime = Date.now();
    
    const results: MarketplaceListing[] = [];
    const errors: string[] = [];
    
    // Process in smaller batches to avoid timeouts
    const batchSize = 10;
    for (let i = 0; i < rawListings.length; i += batchSize) {
      const batch = rawListings.slice(i, i + batchSize);
      
      try {
        const batchResults = await this.processBatch(batch);
        results.push(...batchResults);
      } catch (error) {
        console.error(`🚨 Batch processing error (${i}-${i + batchSize}):`, error);
        errors.push(`Batch ${i}-${i + batchSize}: ${error}`);
        
        // Continue with individual processing for failed batch
        for (const item of batch) {
          try {
            const normalized = await this.normalizeListingData(item);
            if (normalized) results.push(normalized);
          } catch (err) {
            errors.push(`Individual item error: ${err}`);
          }
        }
      }
    }
    
    const processingTime = Date.now() - startTime;
    this.updateMetrics(rawListings.length, results.length, errors.length, processingTime);
    
    return {
      processedCount: rawListings.length,
      normalizedListings: results,
      failedCount: errors.length,
      processingTime,
      errors
    };
  }

  /**
   * BATCH PROCESSING - Process smaller batches with Gemini
   */
  private async processBatch(batch: any[]): Promise<MarketplaceListing[]> {
    const prompt = `You are a car listing data normalizer for the Indian automotive market. 

Please normalize and clean the following car listing data. Extract and standardize:
1. Brand and model names (use official names)
2. Year (extract from text if needed)
3. Price (convert to numbers, handle lakhs/crores)
4. Location (standardize city names)
5. Fuel type and transmission
6. Mileage/odometer reading

Raw data:
${JSON.stringify(batch, null, 2)}

Return clean JSON array with normalized data following this structure:
{
  "listings": [
    {
      "id": "uuid",
      "title": "clean title",
      "brand": "Official Brand Name",
      "model": "Official Model Name", 
      "year": 2020,
      "price": 550000,
      "mileage": 35000,
      "fuelType": "Petrol",
      "transmission": "Manual",
      "location": "Area, City",
      "city": "City",
      "source": "source_name",
      "url": "original_url",
      "images": ["url1", "url2"],
      "description": "cleaned description",
      "features": ["feature1", "feature2"],
      "condition": "Good|Excellent|Fair",
      "verificationStatus": "verified|unverified|certified",
      "sellerType": "individual|dealer|oem"
    }
  ]
}`;

    try {
      // Create cache key for cost savings
      const cacheKey = JSON.stringify({ prompt, model: 'gemini-1.5-flash' });
      const requestParams = { model: 'gemini-1.5-flash', contents: prompt };

      // Check AI cache first for cost savings
      const cacheResult = await aiDatabaseCache.get(cacheKey, {
        model: 'gemini-1.5-flash',
        provider: 'google',
        estimatedCost: 0.01 // Estimated cost per request
      }, requestParams);

      if (cacheResult.hit) {
        console.log(`💾 AI Cache HIT: Saved $${cacheResult.costSaved} on Gemini API call`);
        const parsed = JSON.parse(cacheResult.response);
        return parsed.listings || [];
      }

      const response = await this.gemini.models.generateContent(requestParams);
      
      const responseText = response.text || "";
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Cache the successful response for future cost savings
        await aiDatabaseCache.set(cacheKey, jsonMatch[0], {
          model: 'gemini-1.5-flash',
          provider: 'google',
          estimatedCost: 0.01
        }, null, requestParams);

        return parsed.listings || [];
      }
      
      return [];
    } catch (error) {
      console.error('🚨 Gemini batch processing error:', error);
      throw error;
    }
  }

  /**
   * DATA NORMALIZATION - Clean individual listings
   */
  async normalizeListingData(rawData: any): Promise<MarketplaceListing | null> {
    try {
      // Apply rule-based normalization first
      const normalized = this.applyNormalizationRules(rawData);
      
      // Use Gemini for complex text extraction if needed
      if (this.needsAIProcessing(normalized)) {
        const aiProcessed = await this.aiNormalization(normalized);
        return aiProcessed || normalized;
      }
      
      return normalized;
    } catch (error) {
      console.error('🚨 Normalization error:', error);
      return null;
    }
  }

  /**
   * RULE-BASED NORMALIZATION - Fast local processing
   */
  private applyNormalizationRules(rawData: any): MarketplaceListing {
    const id = rawData.id || this.generateId();
    
    return {
      id,
      title: this.cleanTitle(rawData.title || ''),
      brand: this.normalizeBrand(rawData.brand || ''),
      model: this.normalizeModel(rawData.model || ''),
      year: this.extractYear(rawData.year || rawData.title || ''),
      price: this.normalizePrice(rawData.price || 0),
      mileage: this.normalizeMileage(rawData.mileage || rawData.km || rawData.odometer || 0),
      fuelType: this.normalizeFuelType(rawData.fuelType || rawData.fuel || ''),
      transmission: this.normalizeTransmission(rawData.transmission || ''),
      location: this.cleanLocation(rawData.location || ''),
      city: this.extractCity(rawData.location || rawData.city || ''),
      source: rawData.source || 'unknown',
      url: rawData.url || '',
      images: Array.isArray(rawData.images) ? rawData.images : [],
      description: this.cleanDescription(rawData.description || ''),
      features: Array.isArray(rawData.features) ? rawData.features : [],
      condition: this.normalizeCondition(rawData.condition || 'Good'),
      verificationStatus: rawData.verificationStatus || 'unverified',
      listingDate: rawData.listingDate || new Date(),
      sellerType: rawData.sellerType || 'individual'
    };
  }

  /**
   * PRICE INTELLIGENCE - Market analysis and price bands
   */
  async generatePriceIntelligence(listings: MarketplaceListing[]): Promise<PriceIntelligence> {
    console.log(`💰 Generating price intelligence from ${listings.length} listings`);
    
    // Group by city and model for analysis
    const cityModelGroups = this.groupListingsForAnalysis(listings);
    
    // Generate city price bands
    const cityPriceBands = await this.calculateCityPriceBands(cityModelGroups);
    
    // Calculate depreciation patterns
    const depreciation = this.calculateDepreciation(listings);
    
    // Analyze market trends
    const marketTrends = await this.analyzeMarketTrends(cityModelGroups);
    
    return {
      cityPriceBands,
      depreciation,
      marketTrends
    };
  }

  /**
   * NORMALIZATION HELPERS
   */
  private normalizeBrand(brand: string): string {
    const cleaned = brand.toLowerCase().trim();
    return this.normalizationRules.brandVariations[cleaned] || this.titleCase(brand);
  }

  private normalizeModel(model: string): string {
    const cleaned = model.toLowerCase().trim();
    return this.normalizationRules.modelNormalization[cleaned] || this.titleCase(model);
  }

  private extractYear(yearString: string): number {
    const yearMatch = yearString.match(/20\d{2}|19\d{2}/);
    if (yearMatch) {
      return parseInt(yearMatch[0]);
    }
    return new Date().getFullYear() - 5; // Default to 5 years old
  }

  private normalizePrice(price: any): number {
    if (typeof price === 'number') return price;
    
    const priceString = String(price).toLowerCase().replace(/[^\d.]/g, '');
    let numericPrice = parseFloat(priceString);
    
    if (String(price).includes('lakh')) {
      numericPrice *= 100000;
    } else if (String(price).includes('crore')) {
      numericPrice *= 10000000;
    }
    
    return numericPrice || 0;
  }

  private normalizeMileage(mileage: any): number {
    const numericMileage = parseInt(String(mileage).replace(/[^\d]/g, ''));
    return numericMileage || 0;
  }

  private normalizeFuelType(fuel: string): string {
    const cleaned = fuel.toLowerCase().trim();
    return this.normalizationRules.fuelTypeMapping[cleaned] || this.titleCase(fuel);
  }

  private normalizeTransmission(transmission: string): string {
    const cleaned = transmission.toLowerCase().trim();
    return this.normalizationRules.transmissionMapping[cleaned] || this.titleCase(transmission);
  }

  private extractCity(location: string): string {
    const cleaned = location.toLowerCase().trim();
    const standardized = this.normalizationRules.locationStandardization[cleaned];
    
    if (standardized) return standardized.city;
    
    // Extract city from "Area, City" format
    const parts = location.split(',');
    return parts[parts.length - 1]?.trim() || location;
  }

  private cleanTitle(title: string): string {
    return title.trim().replace(/\s+/g, ' ');
  }

  private cleanLocation(location: string): string {
    return location.trim().replace(/\s+/g, ' ');
  }

  private cleanDescription(description: string): string {
    return description.trim().replace(/\s+/g, ' ').substring(0, 500);
  }

  private normalizeCondition(condition: string): string {
    const cleaned = condition.toLowerCase();
    if (cleaned.includes('excellent')) return 'Excellent';
    if (cleaned.includes('good')) return 'Good';
    if (cleaned.includes('fair')) return 'Fair';
    return 'Good';
  }

  private titleCase(str: string): string {
    return str.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }

  private generateId(): string {
    return `listing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private needsAIProcessing(data: MarketplaceListing): boolean {
    // Check if key fields need AI extraction
    return !data.brand || !data.model || !data.year || data.price === 0;
  }

  private async aiNormalization(data: MarketplaceListing): Promise<MarketplaceListing | null> {
    // Use AI for complex extraction - implementation depends on specific needs
    return data; // Placeholder
  }

  private groupListingsForAnalysis(listings: MarketplaceListing[]) {
    const groups: Record<string, MarketplaceListing[]> = {};
    
    listings.forEach(listing => {
      const key = `${listing.city}_${listing.brand}_${listing.model}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(listing);
    });
    
    return groups;
  }

  private async calculateCityPriceBands(groups: Record<string, MarketplaceListing[]>) {
    const priceBands: Record<string, any[]> = {};
    
    for (const [key, listings] of Object.entries(groups)) {
      const [city, brand, model] = key.split('_');
      
      if (listings.length < 3) continue; // Need at least 3 data points
      
      const prices = listings.map(l => l.price).sort((a, b) => a - b);
      const years = listings.map(l => l.year);
      
      if (!priceBands[city]) priceBands[city] = [];
      
      priceBands[city].push({
        make: brand,
        model: model,
        yearRange: `${Math.min(...years)}-${Math.max(...years)}`,
        priceRange: {
          min: prices[0],
          max: prices[prices.length - 1]
        },
        averagePrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
        dataPoints: listings.length
      });
    }
    
    return priceBands;
  }

  private calculateDepreciation(listings: MarketplaceListing[]) {
    // Group by brand/model and calculate depreciation
    const depreciation: any[] = [];
    
    // Implementation depends on having sufficient data points
    // This is a placeholder for the logic
    
    return depreciation;
  }

  private async analyzeMarketTrends(groups: Record<string, MarketplaceListing[]>) {
    const trends: any[] = [];
    
    // Analyze trends by city
    // This would require historical data comparison
    
    return trends;
  }

  private updateMetrics(processed: number, normalized: number, errors: number, time: number) {
    this.processingMetrics.totalProcessed += processed;
    this.processingMetrics.totalNormalized += normalized;
    this.processingMetrics.averageProcessingTime = 
      (this.processingMetrics.averageProcessingTime + time) / 2;
    this.processingMetrics.errorRate = 
      (errors / processed) * 100;
  }

  /**
   * PUBLIC API - Get processing metrics
   */
  getMetrics() {
    return { ...this.processingMetrics };
  }
}

export const geminiProcessor = new GeminiProcessor();