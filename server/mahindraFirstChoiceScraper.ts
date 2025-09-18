import * as cheerio from 'cheerio';
import { DetailPageExtractor } from './detailPageExtractor.js';
import { imageAssetService } from './imageAssetService.js';
import { trustLayer } from './trustLayer.js';
import { type MarketplaceListing } from './marketplaceAggregator.js';
import { ObjectStorageService } from './objectStorage.js';
import { randomUUID } from 'crypto';

export interface MahindraScrapingResult {
  success: boolean;
  listings: MarketplaceListing[];
  totalFound: number;
  authenticatedListings: number;
  errors?: string[];
}

/**
 * MAHINDRA FIRST CHOICE SCRAPER - CERTIFIED PRE-OWNED INTEGRATION
 * 
 * Integrates with existing authenticity pipeline:
 * 1. Scrapes Mahindra First Choice listings from dealer network
 * 2. Processes images through DetailPageExtractor
 * 3. Validates authenticity through ImageAuthenticityGate
 * 4. Publishes only verified listings via TrustLayer
 */
export class MahindraFirstChoiceScraper {
  private detailExtractor: DetailPageExtractor;
  private objectStorage: ObjectStorageService;
  private dealerSites = [
    {
      name: 'Mahindra First Choice Mumbai',
      baseUrl: 'https://www.mahindrafirstchoice.com',
      listingPath: '/used-cars',
      location: 'Mumbai'
    },
    {
      name: 'Mahindra First Choice Bangalore',
      baseUrl: 'https://www.mahindrafirstchoice.com',
      listingPath: '/bangalore/used-cars',
      location: 'Bangalore'
    },
    {
      name: 'Mahindra First Choice Hyderabad',
      baseUrl: 'https://www.mahindrafirstchoice.com',
      listingPath: '/hyderabad/used-cars',
      location: 'Hyderabad'
    }
  ];
  private portal = 'mahindra-first-choice';

  constructor() {
    this.detailExtractor = new DetailPageExtractor();
    this.objectStorage = new ObjectStorageService();
  }

  /**
   * Scrape Mahindra First Choice listings with authenticity validation
   */
  async scrapeListings(options: {
    city?: string;
    maxPages?: number;
    budget?: string;
    dealerSite?: string;
  } = {}): Promise<MahindraScrapingResult> {
    try {
      console.log('🏭 Starting Mahindra First Choice certified pre-owned scraping...');
      
      const allListings: MarketplaceListing[] = [];
      let authenticatedCount = 0;
      const errors: string[] = [];

      // Select dealer sites to scrape
      const sitesToScrape = options.dealerSite 
        ? this.dealerSites.filter(site => site.name.toLowerCase().includes(options.dealerSite!.toLowerCase()))
        : this.dealerSites.slice(0, 2); // Start with first 2 dealers

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
          const maxListings = Math.min(listingUrls.length, options.maxPages || 5);
          for (let index = 0; index < maxListings; index++) {
            const listingUrl = listingUrls[index];
            
            try {
              console.log(`\n🔍 Processing listing ${index + 1}/${maxListings}: ${listingUrl}`);
              
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
                  console.log(`❌ Listing rejected by trust layer: ${listing.title} (score: ${trustResult.trustScore})`);
                }
              }
              
            } catch (listingError) {
              console.error(`❌ Error processing listing ${listingUrl}:`, listingError);
              errors.push(`Failed to process listing: ${listingUrl}`);
            }
          }
          
        } catch (dealerError) {
          console.error(`❌ Error scraping ${dealer.name}:`, dealerError);
          errors.push(`Failed to scrape ${dealer.name}: ${dealerError}`);
        }
      }

      console.log(`\n📊 Mahindra First Choice Scraping Results:`);
      console.log(`Total listings found: ${allListings.length + errors.length}`);
      console.log(`Successfully processed: ${allListings.length}`);
      console.log(`Passed authenticity gate: ${authenticatedCount}`);
      console.log(`Authentication success rate: ${allListings.length > 0 ? ((authenticatedCount / allListings.length) * 100).toFixed(1) : 0}%`);

      return {
        success: allListings.length > 0,
        listings: allListings,
        totalFound: allListings.length + errors.length,
        authenticatedListings: authenticatedCount,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      console.error('❌ Mahindra First Choice scraper failed:', error);
      return {
        success: false,
        listings: [],
        totalFound: 0,
        authenticatedListings: 0,
        errors: [`Scraper failed: ${error}`]
      };
    }
  }

  /**
   * Build search URL for specific dealer site
   */
  private buildSearchUrl(dealer: any, options: any): string {
    let searchUrl = `${dealer.baseUrl}${dealer.listingPath}`;
    
    const params = new URLSearchParams();
    
    if (options.city) {
      params.append('city', options.city);
    }
    
    if (options.budget) {
      params.append('budget', options.budget);
    }
    
    // Add location-specific parameters
    if (dealer.location && !options.city) {
      params.append('location', dealer.location.toLowerCase());
    }
    
    if (params.toString()) {
      searchUrl += `?${params.toString()}`;
    }
    
    return searchUrl;
  }

  /**
   * Fetch page content with error handling
   */
  private async fetchPage(url: string): Promise<string | null> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        timeout: 30000
      });
      
      if (!response.ok) {
        console.error(`❌ HTTP error! status: ${response.status} for URL: ${url}`);
        return null;
      }
      
      return await response.text();
    } catch (error) {
      console.error(`❌ Failed to fetch ${url}:`, error);
      return null;
    }
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
      listing.source = 'Mahindra First Choice'; // Use source field
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

    // Common selectors for car listing links (dealer-specific patterns)
    const selectors = [
      'a[href*="/car/"]',
      'a[href*="/vehicle/"]',
      'a[href*="/listing/"]',
      'a[href*="/used-car/"]',
      '.car-item a',
      '.vehicle-card a',
      '.listing-item a'
    ];

    selectors.forEach(selector => {
      $(selector).each((_, element) => {
        let href = $(element).attr('href');
        if (href) {
          // Convert relative URLs to absolute
          if (href.startsWith('/')) {
            href = dealer.baseUrl + href;
          } else if (!href.startsWith('http')) {
            href = dealer.baseUrl + '/' + href;
          }
          
          // Filter for car listing URLs
          if (href.includes('/car/') || href.includes('/vehicle/') || href.includes('/listing/') || href.includes('/used-car/')) {
            if (!urls.includes(href)) {
              urls.push(href);
            }
          }
        }
      });
    });

    return urls;
  }

  /**
   * Extract listing data from detail page
   */
  private extractListingData($: cheerio.CheerioAPI, url: string, dealer: any): MarketplaceListing | null {
    try {
      // Extract basic information with multiple fallback selectors
      const title = this.extractText($, [
        'h1.car-title',
        '.car-name h1',
        '.vehicle-title',
        'h1'
      ]) || 'Mahindra Vehicle';

      const priceText = this.extractText($, [
        '.price-value',
        '.car-price',
        '.vehicle-price',
        '[class*="price"]'
      ]) || '0';
      
      const price = this.extractPrice(priceText);
      
      // Extract car specifications
      const year = this.extractNumber($, [
        '.year-value',
        '[data-field="year"]',
        '.spec-year'
      ]) || new Date().getFullYear() - 3;
      
      const mileage = this.extractNumber($, [
        '.mileage-value',
        '[data-field="mileage"]',
        '.spec-mileage'
      ]) || 0;

      const fuelType = this.extractText($, [
        '.fuel-type',
        '[data-field="fuel"]',
        '.spec-fuel'
      ]) || 'Petrol';

      const transmission = this.extractText($, [
        '.transmission-type',
        '[data-field="transmission"]',
        '.spec-transmission'
      ]) || 'Manual';

      // Extract location
      const location = this.extractText($, [
        '.location-value',
        '[data-field="location"]',
        '.spec-location'
      ]) || dealer.location;

      // Create listing object
      const listing: MarketplaceListing = {
        id: this.generateListingId(url),
        title,
        make: 'Mahindra', // All listings are Mahindra
        model: this.extractModelFromTitle(title),
        year,
        price: price.toString(),
        mileage,
        fuelType,
        transmission,
        location,
        city: dealer.location,
        state: this.getCityState(dealer.location),
        description: this.extractText($, ['.description', '.car-description', '.vehicle-details']) || '',
        images: [], // Will be populated after image processing
        url,
        listingDate: new Date().toISOString(),
        portal: this.portal,
        sellerType: 'dealer' as const,
        source: `Mahindra First Choice ${dealer.location}`,
        verificationStatus: 'unverified' as const,
        // Additional Mahindra-specific metadata
        dealerInfo: {
          name: dealer.name,
          location: dealer.location,
          type: 'Mahindra First Choice Certified'
        }
      };

      return listing;
    } catch (error) {
      console.error('Error extracting listing data:', error);
      return null;
    }
  }

  /**
   * Helper method to extract text using multiple selectors
   */
  private extractText($: cheerio.CheerioAPI, selectors: string[]): string | null {
    for (const selector of selectors) {
      const text = $(selector).first().text().trim();
      if (text) return text;
    }
    return null;
  }

  /**
   * Helper method to extract numbers using multiple selectors
   */
  private extractNumber($: cheerio.CheerioAPI, selectors: string[]): number | null {
    for (const selector of selectors) {
      const text = $(selector).first().text().trim();
      if (text) {
        const num = parseInt(text.replace(/[^\d]/g, ''));
        if (!isNaN(num)) return num;
      }
    }
    return null;
  }

  /**
   * Extract price from text
   */
  private extractPrice(priceText: string): number {
    // Remove currency symbols and extract number
    const cleanText = priceText.replace(/[₹,\s]/g, '');
    const price = parseFloat(cleanText);
    
    // Handle price in lakhs/crores
    if (priceText.toLowerCase().includes('lakh')) {
      return price * 100000;
    } else if (priceText.toLowerCase().includes('crore')) {
      return price * 10000000;
    }
    
    return isNaN(price) ? 0 : price;
  }

  /**
   * Extract model name from title
   */
  private extractModelFromTitle(title: string): string {
    // Common Mahindra models
    const models = [
      'XUV700', 'XUV500', 'XUV300', 'Scorpio', 'Thar', 'Bolero', 
      'KUV100', 'TUV300', 'Marazzo', 'Alturas', 'XUV400'
    ];
    
    const upperTitle = title.toUpperCase();
    for (const model of models) {
      if (upperTitle.includes(model.toUpperCase())) {
        return model;
      }
    }
    
    // Fallback: extract first word after Mahindra
    const words = title.split(' ');
    const mahindraIndex = words.findIndex(word => word.toLowerCase().includes('mahindra'));
    if (mahindraIndex >= 0 && mahindraIndex < words.length - 1) {
      return words[mahindraIndex + 1];
    }
    
    return 'Vehicle';
  }

  /**
   * Get state for city
   */
  private getCityState(city: string): string {
    const cityStateMap: Record<string, string> = {
      'Delhi': 'Delhi',
      'Mumbai': 'Maharashtra',
      'Bangalore': 'Karnataka',
      'Hyderabad': 'Telangana',
      'Chennai': 'Tamil Nadu',
      'Pune': 'Maharashtra',
      'Kolkata': 'West Bengal'
    };
    
    return cityStateMap[city] || 'India';
  }

  /**
   * Generate unique listing ID
   */
  private generateListingId(url: string): string {
    const urlHash = url.split('/').pop() || randomUUID();
    return `mahindra_${urlHash}`;
  }

  /**
   * Convert storage keys to public URLs
   */
  private async convertStorageKeysToPublicUrls(storageKeys: string[]): Promise<string[]> {
    const urls: string[] = [];
    
    for (const key of storageKeys) {
      try {
        const publicUrl = await this.objectStorage.getPublicUrl(key);
        if (publicUrl) {
          urls.push(publicUrl);
        }
      } catch (error) {
        console.error(`Failed to get public URL for storage key: ${key}`, error);
      }
    }
    
    return urls;
  }
}

// Export singleton instance
export const mahindraFirstChoiceScraper = new MahindraFirstChoiceScraper();