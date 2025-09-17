import * as cheerio from 'cheerio';
import { DetailPageExtractor } from './detailPageExtractor.js';
import { imageAssetService } from './imageAssetService.js';
import { trustLayer } from './trustLayer.js';
import { type MarketplaceListing } from './marketplaceAggregator.js';
import { ObjectStorageService } from './objectStorage.js';
import { randomUUID } from 'crypto';

export interface HyundaiScrapingResult {
  success: boolean;
  listings: MarketplaceListing[];
  totalFound: number;
  authenticatedListings: number;
  errors?: string[];
}

/**
 * HYUNDAI H-PROMISE SCRAPER - CERTIFIED PRE-OWNED INTEGRATION
 * 
 * Integrates with existing authenticity pipeline:
 * 1. Scrapes Hyundai H-Promise listings from dealer network
 * 2. Processes images through DetailPageExtractor
 * 3. Validates authenticity through ImageAuthenticityGate
 * 4. Publishes only verified listings via TrustLayer
 */
export class HyundaiPromiseScraper {
  private detailExtractor: DetailPageExtractor;
  private objectStorage: ObjectStorageService;
  private dealerSites = [
    {
      name: 'Advaith Hyundai',
      baseUrl: 'https://www.advaithhyundai.com',
      listingPath: '/used-cars',
      location: 'Bangalore'
    },
    {
      name: 'Popular Hyundai',
      baseUrl: 'https://www.popularhyundai.com',
      listingPath: '/hpromise',
      location: 'Kerala'
    },
    {
      name: 'Hans Hyundai',
      baseUrl: 'https://hanshyundaihpromise.com',
      listingPath: '/',
      location: 'Delhi'
    }
  ];
  private portal = 'hyundai-promise';

  constructor() {
    this.detailExtractor = new DetailPageExtractor();
    this.objectStorage = new ObjectStorageService();
  }

  /**
   * Scrape Hyundai H-Promise listings with authenticity validation
   */
  async scrapeListings(options: {
    city?: string;
    maxPages?: number;
    budget?: string;
    dealerSite?: string;
  } = {}): Promise<HyundaiScrapingResult> {
    try {
      console.log('🏭 Starting Hyundai H-Promise certified pre-owned scraping...');
      
      const allListings: MarketplaceListing[] = [];
      let authenticatedCount = 0;
      const errors: string[] = [];

      // Select dealer sites to scrape
      const sitesToScrape = options.dealerSite 
        ? this.dealerSites.filter(site => site.name.toLowerCase().includes(options.dealerSite!.toLowerCase()))
        : this.dealerSites.slice(0, 1); // Start with Advaith Hyundai only

      for (const dealer of sitesToScrape) {
        try {
          console.log(`\n🔍 Scraping ${dealer.name} (${dealer.location})...`);
          
          // Build search URL for this dealer
          const searchUrl = this.buildSearchUrl(dealer, options);
          console.log(`🔍 Searching: ${searchUrl}`);

          // Fetch listings page
          const html = await this.fetchPage(searchUrl);
          if (!html) {
            errors.push(`Failed to fetch listings from ${dealer.name}`);
            continue;
          }

          // Extract car listing URLs
          const listingUrls = this.extractListingUrls(html, dealer);
          console.log(`📋 Found ${listingUrls.length} car listings from ${dealer.name}`);

          // Process each listing through authenticity pipeline
          for (let index = 0; index < listingUrls.length; index++) {
            const listingUrl = listingUrls[index];
            if (index >= (options.maxPages || 15)) break; // Limit processing

            try {
              console.log(`\n🔍 Processing listing ${index + 1}/${listingUrls.length}: ${listingUrl}`);
              
              // Extract listing data and images using existing pipeline
              const listing = await this.processListing(listingUrl, dealer);
              
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
                  // Listing failed trust validation - mark as unverified
                  listing.verificationStatus = 'unverified';
                  console.log(`❌ Listing failed trust validation: ${listing.title} - ${trustResult.explanation}`);
                  // Note: We don't add rejected listings to allListings to prevent them from being stored
                }
              }

            } catch (error) {
              const errorMsg = `Error processing ${listingUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`;
              console.error(`❌ ${errorMsg}`);
              errors.push(errorMsg);
            }

            // Rate limiting - be respectful to dealer servers
            await this.delay(1500);
          }

        } catch (error) {
          const errorMsg = `Error scraping ${dealer.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(`❌ ${errorMsg}`);
          errors.push(errorMsg);
        }
      }

      console.log(`\n📊 Hyundai H-Promise Scraping Results:`);
      console.log(`Total listings found: ${allListings.length + errors.length}`);
      console.log(`Successfully processed: ${allListings.length}`);
      console.log(`Passed authenticity gate: ${authenticatedCount}`);
      console.log(`Authentication success rate: ${allListings.length > 0 ? ((authenticatedCount / allListings.length) * 100).toFixed(1) : 0}%`);

      return {
        success: true,
        listings: allListings,
        totalFound: allListings.length + errors.length,
        authenticatedListings: authenticatedCount,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      console.error('❌ Hyundai H-Promise scraping failed:', error);
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
   * Process individual listing through authenticity pipeline
   */
  private async processListing(listingUrl: string, dealer: any): Promise<MarketplaceListing | null> {
    try {
      // Fetch listing detail page
      const html = await this.fetchPage(listingUrl);
      if (!html) return null;

      const $ = cheerio.load(html);

      // Extract basic listing data
      const listing = this.extractListingData($, listingUrl, dealer);
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
      listing.source = 'Hyundai H-Promise'; // Use source field
      // CRITICAL: Do NOT set verificationStatus='certified' here
      // This will be set ONLY after TrustLayer validation passes
      listing.verificationStatus = 'unverified'; // Will be updated after trust validation

      return listing;

    } catch (error) {
      console.error(`Error processing listing ${listingUrl}:`, error);
      return null;
    }
  }

  /**
   * Extract listing URLs from search results page
   */
  private extractListingUrls(html: string, dealer: any): string[] {
    const $ = cheerio.load(html);
    const urls: string[] = [];

    // Different selectors for different dealer sites
    if (dealer.name.includes('Advaith')) {
      // Advaith Hyundai pattern: /used-cars/specific-car-name
      $('a[href*="/used-cars/hyundai"]').each((_, element) => {
        const href = $(element).attr('href');
        if (href && href.includes('/used-cars/hyundai') && !href.includes('#')) {
          const fullUrl = href.startsWith('http') ? href : `${dealer.baseUrl}${href}`;
          if (!urls.includes(fullUrl)) {
            urls.push(fullUrl);
          }
        }
      });
    } else if (dealer.name.includes('Popular')) {
      // Popular Hyundai pattern
      $('a[href*="hpromise"], a[href*="used-car"]').each((_, element) => {
        const href = $(element).attr('href');
        if (href && !href.includes('#')) {
          const fullUrl = href.startsWith('http') ? href : `${dealer.baseUrl}${href}`;
          if (!urls.includes(fullUrl)) {
            urls.push(fullUrl);
          }
        }
      });
    } else {
      // Generic pattern for other dealers
      $('a[href*="hyundai"], a[href*="promise"], a[href*="used"]').each((_, element) => {
        const href = $(element).attr('href');
        if (href && !href.includes('#') && (href.includes('hyundai') || href.includes('promise'))) {
          const fullUrl = href.startsWith('http') ? href : `${dealer.baseUrl}${href}`;
          if (!urls.includes(fullUrl)) {
            urls.push(fullUrl);
          }
        }
      });
    }

    return urls.slice(0, 50); // Limit to prevent overwhelming the system
  }

  /**
   * Extract structured data from individual listing page
   */
  private extractListingData($: cheerio.CheerioAPI, url: string, dealer: any): MarketplaceListing | null {
    try {
      // Extract title - prioritize specific selectors for each dealer
      let title = '';
      if (dealer.name.includes('Advaith')) {
        title = $('h1').first().text().trim() || 
               $('.car-title, .vehicle-title').first().text().trim() ||
               $('title').text().replace(' - Advaith Hyundai', '').trim();
      } else {
        title = $('h1').first().text().trim() || 
               $('[class*="title"]').first().text().trim() ||
               $('title').text().trim();
      }

      if (!title) return null;

      // Extract price - look for rupee symbols and numbers
      const priceText = $('[class*="price"], .price, [data-price]')
        .first().text().replace(/[^\d]/g, '');
      const price = priceText ? parseInt(priceText, 10) : undefined;

      // Extract year and mileage from text content
      const pageText = $('body').text();
      const yearMatch = pageText.match(/\b(20[0-2][0-9])\b/);
      const year = yearMatch ? parseInt(yearMatch[1], 10) : undefined;

      // Look for kilometers/mileage
      const mileageMatch = pageText.match(/(\d+,?\d*)\s*(?:km|kilometers)/i);
      const mileage = mileageMatch ? parseInt(mileageMatch[1].replace(',', ''), 10) : undefined;

      // Extract location - use dealer location as fallback
      const location = $('[class*="location"], .location').first().text().trim() ||
                      pageText.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s*(?:[A-Z][a-z]+)?/)?.[0] ||
                      dealer.location;

      // Parse brand and model from title
      const { brand, model } = this.parseBrandModel(title);

      // Extract fuel type
      const fuelType = this.extractFuelType(pageText);

      // Extract transmission
      const transmission = this.extractTransmission(pageText);

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
        location: location || dealer.location,
        city: this.extractCity(location || dealer.location),
        source: 'Hyundai H-Promise',
        url,
        images: [], // Will be populated by authenticity pipeline
        description: `Hyundai H-Promise certified pre-owned ${title} from ${dealer.name}`,
        features: this.extractFeatures($),
        condition: 'certified', // H-Promise is pre-owned certified program
        verificationStatus: 'unverified' as const, // Will be set after TrustLayer validation
        listingDate: new Date(),
        sellerType: 'dealer' as const
      };

    } catch (error) {
      console.error('Error extracting listing data:', error);
      return null;
    }
  }

  /**
   * Build search URL with filters for specific dealer
   */
  private buildSearchUrl(dealer: any, options: {
    city?: string;
    budget?: string;
  }): string {
    let url = `${dealer.baseUrl}${dealer.listingPath}`;
    
    const params = new URLSearchParams();
    
    if (options.budget) {
      params.append('budget', options.budget);
    }
    
    // Dealer-specific URL patterns
    if (dealer.name.includes('Advaith')) {
      // Advaith uses clean URLs, no query params needed
      return url;
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
    return match ? `hyundai_${match[1]}` : `hyundai_${Date.now()}`;
  }

  private parseBrandModel(title: string): { brand: string; model: string } {
    // For Hyundai H-Promise, brand is always Hyundai
    const brand = 'Hyundai';
    
    // Extract model from title
    const hyundaiModels = [
      'Creta', 'i20', 'Verna', 'Venue', 'Alcazar', 'Tucson', 'Elantra',
      'Grand i10', 'i10', 'Santro', 'Aura', 'Kona', 'Ioniq', 'Eon',
      'Getz', 'Accent', 'Sonata', 'Santa Fe'
    ];
    
    const model = hyundaiModels.find(m => 
      title.toLowerCase().includes(m.toLowerCase())
    ) || 'Unknown';

    return { brand, model };
  }

  private extractFuelType(text: string): string {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('diesel')) return 'Diesel';
    if (lowerText.includes('cng')) return 'CNG';
    if (lowerText.includes('electric')) return 'Electric';
    if (lowerText.includes('hybrid')) return 'Hybrid';
    return 'Petrol'; // Default for Hyundai cars
  }

  private extractTransmission(text: string): string {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('automatic') || 
        lowerText.includes('amt') || 
        lowerText.includes('cvt') ||
        lowerText.includes('dct') ||
        lowerText.includes('ivt')) return 'Automatic';
    return 'Manual';
  }

  private extractFeatures($: cheerio.CheerioAPI): string[] {
    const features: string[] = [];
    
    // Standard Hyundai H-Promise features
    features.push('H-Promise Certified', '147-Point Quality Check');
    
    const bodyText = $('body').text().toLowerCase();
    
    if (bodyText.includes('warranty')) features.push('1 Year Warranty');
    if (bodyText.includes('service')) features.push('2 Free Services');
    if (bodyText.includes('abs')) features.push('ABS');
    if (bodyText.includes('airbag')) features.push('Airbags');
    if (bodyText.includes('ac') || bodyText.includes('air condition')) features.push('AC');
    if (bodyText.includes('power steering')) features.push('Power Steering');
    if (bodyText.includes('central lock')) features.push('Central Locking');
    if (bodyText.includes('sunroof')) features.push('Sunroof');
    if (bodyText.includes('bluetooth')) features.push('Bluetooth');
    
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
export const hyundaiPromiseScraper = new HyundaiPromiseScraper();