import * as cheerio from 'cheerio';
import { DetailPageExtractor } from './detailPageExtractor.js';
import { imageAssetService } from './imageAssetService.js';
import { trustLayer } from './trustLayer.js';
import { type MarketplaceListing } from './marketplaceAggregator.js';
import { ObjectStorageService } from './objectStorage.js';
import { randomUUID } from 'crypto';

export interface MarutiScrapingResult {
  success: boolean;
  listings: MarketplaceListing[];
  totalFound: number;
  authenticatedListings: number;
  errors?: string[];
}

/**
 * MARUTI TRUE VALUE SCRAPER - CERTIFIED PRE-OWNED INTEGRATION
 * 
 * Integrates with existing authenticity pipeline:
 * 1. Scrapes Maruti True Value listings
 * 2. Processes images through DetailPageExtractor
 * 3. Validates authenticity through ImageAuthenticityGate
 * 4. Publishes only verified listings via TrustLayer
 */
export class MarutiTrueValueScraper {
  private detailExtractor: DetailPageExtractor;
  private objectStorage: ObjectStorageService;
  private baseUrl = 'https://www.marutisuzukitruevalue.com';
  private portal = 'marutisuzukitruevalue.com';

  constructor() {
    this.detailExtractor = new DetailPageExtractor();
    this.objectStorage = new ObjectStorageService();
  }

  /**
   * Scrape Maruti True Value listings with authenticity validation
   */
  async scrapeListings(options: {
    city?: string;
    maxPages?: number;
    budget?: string;
    bodyType?: string;
  } = {}): Promise<MarutiScrapingResult> {
    try {
      console.log('🏭 Starting Maruti True Value certified pre-owned scraping...');
      
      const allListings: MarketplaceListing[] = [];
      let authenticatedCount = 0;
      const errors: string[] = [];

      // Build search URL
      const searchUrl = this.buildSearchUrl(options);
      console.log(`🔍 Searching: ${searchUrl}`);

      // Fetch listings page
      const html = await this.fetchPage(searchUrl);
      if (!html) {
        return {
          success: false,
          listings: [],
          totalFound: 0,
          authenticatedListings: 0,
          errors: ['Failed to fetch listings page']
        };
      }

      // Extract car listing URLs
      const listingUrls = this.extractListingUrls(html);
      console.log(`📋 Found ${listingUrls.length} car listings to process`);

      // Process each listing through authenticity pipeline
      for (let index = 0; index < listingUrls.length; index++) {
        const listingUrl = listingUrls[index];
        if (index >= (options.maxPages || 10)) break; // Limit processing

        try {
          console.log(`\n🔍 Processing listing ${index + 1}/${listingUrls.length}: ${listingUrl}`);
          
          // Extract listing data and images using existing pipeline
          const listing = await this.processListing(listingUrl);
          
          if (listing) {
            console.log(`🛡️ Trust screening: ${listing.title}`);
            
            // CRITICAL: Apply trust layer validation before certification
            const trustResult = await trustLayer.screenListing(listing);
            
            if (trustResult.isApproved) {
              // ONLY NOW set certified status after TrustLayer approval
              listing.verificationStatus = 'certified';
              allListings.push(listing);
              authenticatedCount++;
              console.log(`✅ Listing authenticated and certified: ${listing.title} (trust score: ${trustResult.trustScore})`);
            } else {
              // Listing failed trust validation - mark as rejected
              listing.verificationStatus = 'rejected';
              console.log(`❌ Listing failed trust validation: ${listing.title} - ${trustResult.explanation}`);
              // Note: We don't add rejected listings to allListings to prevent them from being stored
            }
          }

        } catch (error) {
          const errorMsg = `Error processing ${listingUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(`❌ ${errorMsg}`);
          errors.push(errorMsg);
        }

        // Rate limiting - be respectful to Maruti's servers
        await this.delay(1000);
      }

      console.log(`\n📊 Maruti True Value Scraping Results:`);
      console.log(`Total listings found: ${listingUrls.length}`);
      console.log(`Successfully processed: ${allListings.length}`);
      console.log(`Passed authenticity gate: ${authenticatedCount}`);
      console.log(`Authentication success rate: ${((authenticatedCount / allListings.length) * 100).toFixed(1)}%`);

      return {
        success: true,
        listings: allListings,
        totalFound: listingUrls.length,
        authenticatedListings: authenticatedCount,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      console.error('❌ Maruti True Value scraping failed:', error);
      return {
        success: false,
        listings: [],
        totalFound: 0,
        authenticatedListings: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Convert storage keys to public URLs for frontend consumption
   */
  private async convertStorageKeysToPublicUrls(storageKeys: string[]): Promise<string[]> {
    const publicUrls: string[] = [];
    
    for (const storageKey of storageKeys) {
      try {
        // Create a proxy URL that the frontend can use to access the image
        // The actual image will be served via the /api/proxy/image route
        const publicUrl = `/api/proxy/image?url=${encodeURIComponent(storageKey)}`;
        publicUrls.push(publicUrl);
      } catch (error) {
        console.error(`Failed to convert storage key to public URL: ${storageKey}`, error);
      }
    }
    
    return publicUrls;
  }

  /**
   * Screen listings through trust layer before final storage
   */
  async screenListingsThroughTrustLayer(listings: MarketplaceListing[]): Promise<{
    approved: MarketplaceListing[];
    rejected: MarketplaceListing[];
  }> {
    const approved: MarketplaceListing[] = [];
    const rejected: MarketplaceListing[] = [];
    
    for (const listing of listings) {
      try {
        console.log(`🛡️ Trust screening: ${listing.title}`);
        const trustResult = await trustLayer.screenListing(listing);
        
        if (trustResult.isApproved) {
          approved.push(listing);
          console.log(`✅ Trust approved: ${listing.title} (score: ${trustResult.trustScore})`);
        } else {
          rejected.push(listing);
          console.log(`❌ Trust rejected: ${listing.title} - ${trustResult.explanation}`);
        }
      } catch (error) {
        console.error(`Trust screening error for ${listing.title}:`, error);
        rejected.push(listing); // Conservative: reject on error
      }
    }
    
    return { approved, rejected };
  }

  /**
   * Process individual listing through authenticity pipeline
   */
  private async processListing(listingUrl: string): Promise<MarketplaceListing | null> {
    try {
      // Fetch listing detail page
      const html = await this.fetchPage(listingUrl);
      if (!html) return null;

      const $ = cheerio.load(html);

      // Extract basic listing data
      const listing = this.extractListingData($, listingUrl);
      if (!listing) return null;

      // CRITICAL: Process through authenticity pipeline
      const listingId = this.generateListingId(listingUrl);
      
      console.log(`🔄 Processing images through authenticity pipeline for: ${listing.title}`);
      
      // Extract and validate images using DetailPageExtractor
      const extractionResult = await this.detailExtractor.extractFromUrl({
        url: listingUrl,
        listingId,
        portal: this.portal,
        processImages: true // This runs through ImageAuthenticityGate
      });

      if (extractionResult.success && extractionResult.processedImages) {
        // Check if any images passed the authenticity gate
        const authenticatedImages = extractionResult.processedImages.filter(img => 
          img.success && img.passedGate && img.storageKey
        );

        // Convert storage keys to public URLs
        listing.images = await this.convertStorageKeysToPublicUrls(
          authenticatedImages.slice(0, 5).map(img => img.storageKey!)
        );

        console.log(`📸 ${authenticatedImages.length}/${extractionResult.processedImages.length} images passed authenticity gate`);
      } else {
        listing.images = [];
        console.log(`⚠️ No images extracted or authenticity validation failed`);
      }

      // Add certified pre-owned metadata using correct interface fields
      listing.sellerType = 'dealer'; // Use valid enum value
      listing.source = 'Maruti True Value'; // Use source field
      // CRITICAL: Do NOT set verificationStatus='certified' here
      // This will be set ONLY after TrustLayer validation passes
      listing.verificationStatus = 'pending'; // Will be updated after trust validation

      return listing;

    } catch (error) {
      console.error(`Error processing listing ${listingUrl}:`, error);
      return null;
    }
  }

  /**
   * Extract listing URLs from search results page
   */
  private extractListingUrls(html: string): string[] {
    const $ = cheerio.load(html);
    const urls: string[] = [];

    // Extract URLs from car listing links
    $('a[href*="/buy-car/"]').each((_, element) => {
      const href = $(element).attr('href');
      if (href && href.includes('/buy-car/') && !href.includes('#')) {
        const fullUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
        if (!urls.includes(fullUrl)) {
          urls.push(fullUrl);
        }
      }
    });

    return urls.slice(0, 50); // Limit to prevent overwhelming the system
  }

  /**
   * Extract structured data from individual listing page
   */
  private extractListingData($: cheerio.CheerioAPI, url: string): MarketplaceListing | null {
    try {
      // Extract title
      const title = $('h1').first().text().trim() || 
                   $('[class*="title"]').first().text().trim() ||
                   $('title').text().replace(' - Maruti Suzuki True Value', '').trim();

      if (!title) return null;

      // Extract price
      const priceText = $('[class*="price"], .price, [data-price]')
        .first().text().replace(/[^\d]/g, '');
      const price = priceText ? parseInt(priceText, 10) : undefined;

      // Extract year and mileage from text
      const pageText = $('body').text();
      const yearMatch = pageText.match(/\b(20[0-2][0-9])\b/);
      const year = yearMatch ? parseInt(yearMatch[1], 10) : undefined;

      const mileageMatch = pageText.match(/(\d+,?\d*)\s*km/i);
      const mileage = mileageMatch ? parseInt(mileageMatch[1].replace(',', ''), 10) : undefined;

      // Extract location
      const location = $('[class*="location"], .location').first().text().trim() ||
                      pageText.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s*(?:[A-Z][a-z]+)?/)?.[0];

      // Parse brand and model from title
      const { brand, model } = this.parseBrandModel(title);

      // Extract fuel type
      const fuelType = this.extractFuelType(pageText);

      // Extract transmission
      const transmission = pageText.toLowerCase().includes('automatic') || 
                          pageText.toLowerCase().includes('amt') || 
                          pageText.toLowerCase().includes('cvt') ? 'Automatic' : 'Manual';

      return {
        id: this.generateListingId(url),
        title,
        brand,
        model,
        year: year || 2020,
        price: price || 0,
        mileage: mileage || 0,
        fuelType,
        transmission,
        location: location || 'India',
        city: this.extractCity(location || 'India'),
        source: 'Maruti True Value',
        url,
        images: [], // Will be populated by authenticity pipeline
        description: `Maruti True Value certified pre-owned ${title}`,
        features: this.extractFeatures($),
        condition: 'certified', // Maruti True Value is pre-owned certified program
        verificationStatus: 'pending' as const, // Will be set after TrustLayer validation
        listingDate: new Date(),
        sellerType: 'dealer' as const
      };

    } catch (error) {
      console.error('Error extracting listing data:', error);
      return null;
    }
  }

  /**
   * Build search URL with filters
   */
  private buildSearchUrl(options: {
    city?: string;
    budget?: string;
    bodyType?: string;
  }): string {
    let url = `${this.baseUrl}/buy-car`;
    
    const params = new URLSearchParams();
    
    if (options.city) {
      // Maruti True Value uses city-specific URLs
      url = `${this.baseUrl}/used-cars-in-${options.city.toLowerCase()}`;
    }
    
    if (options.budget) {
      params.append('budget', options.budget);
    }
    
    if (options.bodyType) {
      params.append('bodyType', options.bodyType);
    }

    const queryString = params.toString();
    return queryString ? `${url}?${queryString}` : url;
  }

  /**
   * Utility methods
   */
  private async fetchPage(url: string): Promise<string | null> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        }
      });

      if (!response.ok) {
        console.error(`HTTP error! status: ${response.status} for ${url}`);
        return null;
      }

      return await response.text();
    } catch (error) {
      console.error(`Failed to fetch ${url}:`, error);
      return null;
    }
  }

  private generateListingId(url: string): string {
    const match = url.match(/\/([^\/]+)$/);
    return match ? `maruti_${match[1]}` : `maruti_${Date.now()}`;
  }

  private parseBrandModel(title: string): { brand: string; model: string } {
    // For Maruti True Value, brand is always Maruti Suzuki
    const brand = 'Maruti Suzuki';
    
    // Extract model from title
    const marutiModels = [
      'Swift', 'Dzire', 'Alto', 'WagonR', 'Baleno', 'Vitara Brezza', 'Ertiga',
      'Ciaz', 'S-Cross', 'Eeco', 'Celerio', 'Ignis', 'Fronx', 'Jimny', 'XL6',
      'Grand Vitara', 'Invicto'
    ];
    
    const model = marutiModels.find(m => 
      title.toLowerCase().includes(m.toLowerCase())
    ) || 'Unknown';

    return { brand, model };
  }

  private extractFuelType(text: string): string {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('diesel')) return 'Diesel';
    if (lowerText.includes('cng')) return 'CNG';
    if (lowerText.includes('electric')) return 'Electric';
    return 'Petrol'; // Default for Maruti cars
  }

  private extractFeatures($: cheerio.CheerioAPI): string[] {
    const features: string[] = [];
    
    // Standard Maruti True Value features
    features.push('True Value Certified', '376-Point Quality Check');
    
    const bodyText = $('body').text().toLowerCase();
    
    if (bodyText.includes('warranty')) features.push('1 Year Warranty');
    if (bodyText.includes('service')) features.push('3 Free Services');
    if (bodyText.includes('abs')) features.push('ABS');
    if (bodyText.includes('airbag')) features.push('Airbags');
    if (bodyText.includes('ac') || bodyText.includes('air condition')) features.push('AC');
    if (bodyText.includes('power steering')) features.push('Power Steering');
    if (bodyText.includes('central lock')) features.push('Central Locking');
    
    return features;
  }

  private extractCity(location: string): string {
    // Extract city from location string
    const parts = location.split(',');
    return parts[0].trim() || 'Unknown';
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const marutiTrueValueScraper = new MarutiTrueValueScraper();