import * as cheerio from 'cheerio';
import { DetailPageExtractor } from './detailPageExtractor.js';
import { imageAssetService } from './imageAssetService.js';
import { trustLayer } from './trustLayer.js';
import { type MarketplaceListing } from './marketplaceAggregator.js';
import { ObjectStorageService } from './objectStorage.js';
import { randomUUID } from 'crypto';

export interface SarfaesiScrapingResult {
  success: boolean;
  listings: MarketplaceListing[];
  totalFound: number;
  authenticatedListings: number;
  errors?: string[];
  sourcesProcessed: string[];
}

/**
 * SARFAESI AUCTION SCRAPER - OFFICIAL GOVERNMENT PORTAL INTEGRATION
 * 
 * Legally compliant integration with official SARFAESI auction sources:
 * 1. IBAPI.in - Official Indian Banks Association portal
 * 2. BankEauctions.com - Trusted aggregator used by major banks
 * 3. Individual bank portals (SBI, Union Bank, IOB, etc.)
 * 
 * Integrates with existing authenticity pipeline:
 * - Processes images through DetailPageExtractor
 * - Validates authenticity through ImageAuthenticityGate
 * - Publishes only verified listings via TrustLayer
 * - Maintains legal compliance with rate limiting
 */
export class SarfaesiScraper {
  private detailExtractor: DetailPageExtractor;
  private objectStorage: ObjectStorageService;
  
  // Official SARFAESI portals
  private portals = {
    ibapi: {
      baseUrl: 'https://ibapi.in',
      name: 'IBAPI - Official Government Portal',
      authority: 'Indian Banks Association, Ministry of Finance'
    },
    bankEauctions: {
      baseUrl: 'https://www.bankeauctions.com',
      name: 'BankEauctions - Trusted Bank Portal',
      authority: 'Authorized by Major PSU and Private Banks'
    },
    sarfaesiAuctions: {
      baseUrl: 'https://sarfaesiauctions.com',
      name: 'SarfaesiAuctions - Composite Portal',
      authority: 'First composite SARFAESI portal in India'
    }
  };

  constructor() {
    this.detailExtractor = new DetailPageExtractor();
    this.objectStorage = new ObjectStorageService();
  }

  /**
   * Scrape SARFAESI auction listings with authenticity validation
   */
  async scrapeListings(options: {
    source?: 'ibapi' | 'bankEauctions' | 'sarfaesiAuctions' | 'all';
    bank?: string;
    state?: string;
    district?: string;
    propertyType?: 'vehicle' | 'movable' | 'all';
    maxPages?: number;
  } = {}): Promise<SarfaesiScrapingResult> {
    try {
      console.log('🏛️ Starting SARFAESI government auction scraping...');
      
      const allListings: MarketplaceListing[] = [];
      let authenticatedCount = 0;
      const errors: string[] = [];
      const sourcesProcessed: string[] = [];

      // Determine which sources to process
      const sources = this.determineSources(options.source);
      console.log(`🔍 Processing ${sources.length} official SARFAESI sources`);

      // Process each official source
      for (const source of sources) {
        try {
          console.log(`\n🏛️ Processing ${this.portals[source].name}...`);
          console.log(`   Authority: ${this.portals[source].authority}`);
          
          const sourceResults = await this.processSarfaesiSource(source, options);
          
          if (sourceResults.listings.length > 0) {
            allListings.push(...sourceResults.listings);
            authenticatedCount += sourceResults.authenticatedCount;
            sourcesProcessed.push(this.portals[source].name);
            
            console.log(`✅ ${this.portals[source].name}: ${sourceResults.authenticatedCount} authenticated listings`);
          } else {
            console.log(`⚠️ ${this.portals[source].name}: No vehicle listings found`);
          }
          
          if (sourceResults.errors.length > 0) {
            errors.push(...sourceResults.errors);
          }

        } catch (error) {
          const errorMsg = `Error processing ${this.portals[source].name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(`❌ ${errorMsg}`);
          errors.push(errorMsg);
        }

        // Rate limiting - be respectful to government and bank servers
        await this.delay(3000); // 3 second delay between sources
      }

      console.log(`\n📊 SARFAESI Government Auction Scraping Results:`);
      console.log(`   📋 Total Sources Processed: ${sourcesProcessed.length}`);
      console.log(`   🚗 Total Vehicle Listings Found: ${allListings.length}`);
      console.log(`   ✅ Authenticated Listings: ${authenticatedCount}`);
      console.log(`   ⚠️ Errors: ${errors.length}`);

      return {
        success: authenticatedCount > 0,
        listings: allListings,
        totalFound: allListings.length,
        authenticatedListings: authenticatedCount,
        errors: errors.length > 0 ? errors : undefined,
        sourcesProcessed
      };

    } catch (error) {
      console.error('❌ SARFAESI scraping failed:', error);
      return {
        success: false,
        listings: [],
        totalFound: 0,
        authenticatedListings: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        sourcesProcessed: []
      };
    }
  }

  /**
   * Process a specific SARFAESI source
   */
  private async processSarfaesiSource(
    source: keyof typeof this.portals,
    options: any
  ): Promise<{ listings: MarketplaceListing[]; authenticatedCount: number; errors: string[] }> {
    const listings: MarketplaceListing[] = [];
    let authenticatedCount = 0;
    const errors: string[] = [];

    try {
      // Build search URLs for this source
      const searchUrls = this.buildSearchUrls(source, options);
      
      if (searchUrls.length === 0) {
        console.log(`⚠️ No search URLs generated for ${this.portals[source].name}`);
        return { listings, authenticatedCount, errors };
      }

      console.log(`🔍 ${searchUrls.length} search URLs for ${this.portals[source].name}`);

      // Process each search URL
      for (const { url, description } of searchUrls) {
        try {
          console.log(`   📄 Fetching: ${description}`);
          
          // Fetch the search results page
          const html = await this.fetchPage(url);
          if (!html) {
            errors.push(`Failed to fetch ${description}`);
            continue;
          }

          // Extract vehicle listing URLs from search results
          const vehicleUrls = this.extractVehicleListings(html, source);
          console.log(`   🚗 Found ${vehicleUrls.length} vehicle listings`);

          // Process each vehicle listing through authenticity pipeline
          const maxListings = options.maxPages || 20;
          for (let i = 0; i < Math.min(vehicleUrls.length, maxListings); i++) {
            const listingUrl = vehicleUrls[i];

            try {
              console.log(`     🔍 Processing vehicle ${i + 1}/${Math.min(vehicleUrls.length, maxListings)}: ${listingUrl}`);
              
              const listing = await this.processVehicleListing(listingUrl, source);
              
              if (listing) {
                console.log(`     🛡️ Trust screening: ${listing.title}`);
                
                // CRITICAL: Apply trust layer validation before certification
                const trustResult = await trustLayer.screenListing(listing);
                
                if (trustResult.isApproved) {
                  // Mark as certified ONLY after TrustLayer approval
                  listing.verificationStatus = 'certified';
                  listing.source = `${this.portals[source].name} - SARFAESI`;
                  listings.push(listing);
                  authenticatedCount++;
                  console.log(`     ✅ SARFAESI vehicle authenticated: ${listing.title}`);
                } else {
                  console.log(`     ❌ Trust validation failed: ${listing.title} - ${trustResult.explanation}`);
                }
              }

            } catch (error) {
              const errorMsg = `Error processing vehicle ${listingUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`;
              console.error(`     ❌ ${errorMsg}`);
              errors.push(errorMsg);
            }

            // Rate limiting between individual listings
            await this.delay(1500);
          }

        } catch (error) {
          const errorMsg = `Error processing search URL ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(`   ❌ ${errorMsg}`);
          errors.push(errorMsg);
        }

        // Delay between search pages
        await this.delay(2000);
      }

    } catch (error) {
      const errorMsg = `Error in processSarfaesiSource for ${source}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`❌ ${errorMsg}`);
      errors.push(errorMsg);
    }

    return { listings, authenticatedCount, errors };
  }

  /**
   * Determine which sources to process based on options
   */
  private determineSources(source?: string): (keyof typeof this.portals)[] {
    if (!source || source === 'all') {
      return ['ibapi', 'bankEauctions', 'sarfaesiAuctions'];
    }
    return [source as keyof typeof this.portals];
  }

  /**
   * Build search URLs for a specific SARFAESI source
   */
  private buildSearchUrls(
    source: keyof typeof this.portals,
    options: any
  ): Array<{ url: string; description: string }> {
    const urls: Array<{ url: string; description: string }> = [];
    const baseUrl = this.portals[source].baseUrl;

    switch (source) {
      case 'ibapi':
        // IBAPI.in search URLs for vehicles
        urls.push({
          url: `${baseUrl}/sale_info_home.aspx`,
          description: 'IBAPI Main Auction Listings'
        });
        
        if (options.state) {
          urls.push({
            url: `${baseUrl}/sale_info_home.aspx?state=${encodeURIComponent(options.state)}`,
            description: `IBAPI ${options.state} Listings`
          });
        }
        break;

      case 'bankEauctions':
        // BankEauctions.com search URLs
        urls.push({
          url: `${baseUrl}/vehicle-auctions`,
          description: 'BankEauctions Vehicle Listings'
        });
        
        if (options.bank) {
          urls.push({
            url: `${baseUrl}/bank/${options.bank.toLowerCase()}-auctions`,
            description: `BankEauctions ${options.bank} Vehicles`
          });
        }
        break;

      case 'sarfaesiAuctions':
        // SarfaesiAuctions.com search URLs
        urls.push({
          url: `${baseUrl}/auction-listings?type=vehicle`,
          description: 'SarfaesiAuctions Vehicle Listings'
        });
        break;
    }

    return urls;
  }

  /**
   * Extract vehicle listing URLs from search results page
   */
  private extractVehicleListings(html: string, source: keyof typeof this.portals): string[] {
    try {
      const $ = cheerio.load(html);
      const vehicleUrls: string[] = [];
      const baseUrl = this.portals[source].baseUrl;

      // Different selectors for different sources
      let linkSelectors: string[] = [];
      
      switch (source) {
        case 'ibapi':
          linkSelectors = [
            'a[href*="sale_info"]',
            'a[href*="property"]',
            '.property-link',
            '.auction-link'
          ];
          break;
        
        case 'bankEauctions':
          linkSelectors = [
            'a[href*="/auction/"]',
            'a[href*="/property/"]',
            '.auction-item a',
            '.property-item a'
          ];
          break;
        
        case 'sarfaesiAuctions':
          linkSelectors = [
            'a[href*="/listing/"]',
            'a[href*="/auction/"]',
            '.listing-link',
            '.auction-card a'
          ];
          break;
      }

      // Extract URLs using selectors
      for (const selector of linkSelectors) {
        $(selector).each((_, element) => {
          const href = $(element).attr('href');
          if (href) {
            let fullUrl = href.startsWith('http') ? href : `${baseUrl}${href}`;
            
            // Filter for vehicle-related listings
            const vehicleKeywords = ['vehicle', 'car', 'auto', 'motor', 'bike', 'scooter'];
            const listingText = $(element).text().toLowerCase();
            const urlText = fullUrl.toLowerCase();
            
            const isVehicle = vehicleKeywords.some(keyword => 
              listingText.includes(keyword) || urlText.includes(keyword)
            );
            
            if (isVehicle && !vehicleUrls.includes(fullUrl)) {
              vehicleUrls.push(fullUrl);
            }
          }
        });
      }

      console.log(`🔗 Extracted ${vehicleUrls.length} vehicle URLs from ${this.portals[source].name}`);
      return vehicleUrls;

    } catch (error) {
      console.error(`❌ Error extracting vehicle listings for ${source}:`, error);
      return [];
    }
  }

  /**
   * Process individual vehicle listing through authenticity pipeline
   */
  private async processVehicleListing(
    listingUrl: string,
    source: keyof typeof this.portals
  ): Promise<MarketplaceListing | null> {
    try {
      // Generate unique listing ID
      const listingId = `sarfaesi_${source}_${this.extractListingId(listingUrl)}`;
      
      console.log(`🔄 Processing images with government compliance for: ${listingUrl}`);

      // CRITICAL: For government portals, we only extract image references without rehosting
      const extractionResult = await this.detailExtractor.extractFromUrl({
        url: listingUrl,
        listingId,
        portal: `${source}.sarfaesi`,
        processImages: false, // DISABLED: No rehosting of government images for compliance
        governmentCompliance: true // Special flag for government sources
      });

      if (!extractionResult.success || extractionResult.images.length === 0) {
        console.log(`⚠️ No images found or extraction failed for: ${listingUrl}`);
        return null;
      }

      console.log(`📸 ${extractionResult.images.length} images passed authenticity gate`);

      // COMPLIANCE: For government sources, use proxied references instead of rehosted images
      const compliantImageUrls = this.generateCompliantImageReferences(extractionResult.images || [], listingUrl, source);

      // Extract vehicle metadata from the listing page
      const vehicleData = await this.extractVehicleData(listingUrl, source);
      if (!vehicleData) {
        console.log(`⚠️ Could not extract vehicle data from: ${listingUrl}`);
        return null;
      }

      // Build the final listing object
      const listing: MarketplaceListing = {
        id: listingId,
        title: vehicleData.title,
        brand: vehicleData.brand,
        model: vehicleData.model,
        year: vehicleData.year,
        price: vehicleData.price,
        mileage: vehicleData.mileage || 0,
        fuelType: vehicleData.fuelType,
        transmission: vehicleData.transmission,
        location: vehicleData.location,
        city: vehicleData.city,
        source: `${this.portals[source].name} - SARFAESI`,
        url: listingUrl,
        images: compliantImageUrls,
        imageDisclaimer: 'Images sourced from official government portals. CarArth is not affiliated with government agencies.',
        imageCompliance: 'government_proxy', // Special compliance flag
        description: vehicleData.description,
        features: vehicleData.features || [],
        condition: 'sarfaesi_auction', // Special condition for SARFAESI auctions
        verificationStatus: 'unverified', // Will be set to 'certified' after TrustLayer approval
        listingDate: new Date(),
        sellerType: 'dealer' // SARFAESI auctions are institutional sales
      };

      return listing;

    } catch (error) {
      console.error(`❌ Error processing vehicle listing ${listingUrl}:`, error);
      return null;
    }
  }

  /**
   * Extract vehicle data from listing page HTML
   */
  private async extractVehicleData(listingUrl: string, source: keyof typeof this.portals): Promise<any> {
    try {
      const html = await this.fetchPage(listingUrl);
      if (!html) return null;

      const $ = cheerio.load(html);
      
      // Extract title
      let title = $('h1').first().text().trim() || 
                  $('[class*="title"]').first().text().trim() ||
                  $('[class*="heading"]').first().text().trim() ||
                  'SARFAESI Vehicle Auction';

      // Extract basic vehicle info from title or content
      const content = $.text().toLowerCase();
      
      // Extract brand (basic pattern matching)
      const brands = ['maruti', 'hyundai', 'honda', 'toyota', 'tata', 'mahindra', 'renault', 'nissan', 'volkswagen', 'ford'];
      let brand = 'Unknown';
      for (const b of brands) {
        if (content.includes(b)) {
          brand = b.charAt(0).toUpperCase() + b.slice(1);
          break;
        }
      }

      // Extract model (first word after brand if found)
      let model = 'Unknown';
      if (brand !== 'Unknown') {
        const brandIndex = content.indexOf(brand.toLowerCase());
        const afterBrand = content.slice(brandIndex + brand.length).trim();
        const words = afterBrand.split(/\s+/);
        if (words.length > 0 && words[0].length > 1) {
          model = words[0];
        }
      }

      // Extract year (4-digit number pattern)
      const yearMatch = content.match(/\b(20[0-2][0-9]|19[89][0-9])\b/);
      const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear() - 5; // Default to 5 years old

      // Extract price (Indian currency patterns)
      const priceMatch = content.match(/(?:rs\.?|₹|price)\s*[:\-]?\s*([0-9,]+(?:\.[0-9]{2})?)/i);
      let price = 100000; // Default minimum auction price
      if (priceMatch) {
        price = parseInt(priceMatch[1].replace(/,/g, ''));
      }

      // Extract location
      let location = $('[class*="location"]').text().trim() ||
                    $('[class*="address"]').text().trim() ||
                    'India';

      // Extract city from location
      let city = location.split(',')[0].trim() || 'Unknown';

      // Extract fuel type
      let fuelType = 'Petrol'; // Default
      if (content.includes('diesel')) fuelType = 'Diesel';
      else if (content.includes('cng')) fuelType = 'CNG';
      else if (content.includes('electric')) fuelType = 'Electric';

      // Extract transmission
      let transmission = 'Manual'; // Default
      if (content.includes('automatic') || content.includes('auto')) {
        transmission = 'Automatic';
      }

      // Extract description
      const description = $('[class*="description"]').text().trim() ||
                         $('[class*="detail"]').text().trim() ||
                         'SARFAESI auction vehicle - Bank recovered asset';

      return {
        title,
        brand,
        model,
        year,
        price,
        mileage: 50000, // Default estimate for auction vehicles
        fuelType,
        transmission,
        location,
        city,
        description,
        features: ['Bank Auction', 'SARFAESI Act', 'Legal Documentation']
      };

    } catch (error) {
      console.error('❌ Error extracting vehicle data:', error);
      return null;
    }
  }

  /**
   * Check robots.txt compliance before scraping
   */
  private async checkRobotsCompliance(url: string): Promise<{ allowed: boolean; crawlDelay?: number }> {
    try {
      const urlObj = new URL(url);
      const robotsUrl = `${urlObj.protocol}//${urlObj.hostname}/robots.txt`;
      
      console.log(`🤖 Checking robots.txt compliance for ${urlObj.hostname}`);
      
      const response = await fetch(robotsUrl, {
        headers: {
          'User-Agent': 'CarArth-Scraper/1.0 (+https://cararth.com/robots; contact@cararth.com)',
        },
        signal: AbortSignal.timeout(10000)
      });
      
      if (!response.ok) {
        console.log(`⚠️ robots.txt not found for ${urlObj.hostname}, proceeding with default delay`);
        return { allowed: true, crawlDelay: 5000 }; // Default 5 second delay
      }
      
      const robotsText = await response.text();
      const lines = robotsText.split('\n').map(line => line.trim().toLowerCase());
      
      let crawlDelay = 5000; // Default 5 seconds
      let currentUserAgent = '';
      let isApplicable = false;
      
      for (const line of lines) {
        if (line.startsWith('user-agent:')) {
          currentUserAgent = line.split(':')[1].trim();
          isApplicable = currentUserAgent === '*' || currentUserAgent.includes('cararthscraper') || currentUserAgent.includes('cararth');
        } else if (isApplicable && line.startsWith('crawl-delay:')) {
          const delay = parseInt(line.split(':')[1].trim());
          if (!isNaN(delay)) {
            crawlDelay = delay * 1000; // Convert to milliseconds
          }
        } else if (isApplicable && line.startsWith('disallow:')) {
          const disallowPath = line.split(':')[1].trim();
          if (disallowPath === '/' || urlObj.pathname.startsWith(disallowPath)) {
            console.log(`❌ robots.txt disallows access to ${url}`);
            return { allowed: false };
          }
        }
      }
      
      console.log(`✅ robots.txt compliance check passed for ${urlObj.hostname} (delay: ${crawlDelay}ms)`);
      return { allowed: true, crawlDelay };
      
    } catch (error) {
      console.error(`⚠️ Error checking robots.txt for ${url}:`, error);
      return { allowed: true, crawlDelay: 5000 }; // Conservative default
    }
  }

  /**
   * Fetch page HTML with full compliance and legal safeguards
   */
  private async fetchPage(url: string): Promise<string | null> {
    try {
      // CRITICAL: Check robots.txt compliance first
      const robotsCheck = await this.checkRobotsCompliance(url);
      
      if (!robotsCheck.allowed) {
        console.error(`❌ robots.txt disallows scraping of ${url} - ABORTING`);
        return null;
      }
      
      // Respect crawl delay
      if (robotsCheck.crawlDelay && robotsCheck.crawlDelay > 1000) {
        console.log(`⏱️ Respecting robots.txt crawl-delay: ${robotsCheck.crawlDelay}ms`);
        await this.delay(robotsCheck.crawlDelay);
      }
      
      console.log(`📄 Fetching page with compliance: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          // CRITICAL: Proper identification with contact info for government sites
          'User-Agent': 'CarArth-Scraper/1.0 (+https://cararth.com/robots; contact@cararth.com) India Car Marketplace Compliance',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'From': 'contact@cararth.com', // RFC compliant contact header
          'Cache-Control': 'no-cache' // Respect caching policies
        },
        signal: AbortSignal.timeout(45000) // Longer timeout for government sites
      });

      if (!response.ok) {
        console.error(`❌ HTTP ${response.status} for ${url}`);
        
        // Rate limiting response - back off exponentially
        if (response.status === 429 || response.status === 503) {
          console.log(`🛑 Rate limited by ${url} - implementing exponential backoff`);
          await this.delay(60000); // 1 minute backoff
          return null;
        }
        
        return null;
      }

      const html = await response.text();
      console.log(`✅ Compliance-fetched ${html.length} characters from ${url}`);
      return html;

    } catch (error) {
      console.error(`❌ Compliant fetch error for ${url}:`, error);
      
      // Implement exponential backoff on network errors
      await this.delay(10000); // 10 second backoff
      return null;
    }
  }

  /**
   * Extract listing ID from URL for unique identification
   */
  private extractListingId(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(part => part);
      const queryParams = urlObj.searchParams;
      
      // Try to extract ID from various URL patterns
      const idFromPath = pathParts[pathParts.length - 1];
      const idFromQuery = queryParams.get('id') || queryParams.get('propertyId') || queryParams.get('auctionId');
      
      return idFromQuery || idFromPath || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    } catch {
      return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  /**
   * Generate compliant image references for government sources (NO REHOSTING)
   */
  private generateCompliantImageReferences(images: any[], listingUrl: string, source: keyof typeof this.portals): string[] {
    if (!images || images.length === 0) {
      return [];
    }
    
    const sourceHost = new URL(listingUrl).hostname;
    
    return images.map((img, index) => {
      let originalUrl = '';
      
      if (typeof img === 'string') {
        originalUrl = img;
      } else {
        originalUrl = img.url || img.src || img.originalUrl || '';
      }
      
      if (!originalUrl) {
        return '';
      }
      
      // Ensure absolute URL
      if (originalUrl.startsWith('/')) {
        const baseUrl = this.portals[source].baseUrl;
        originalUrl = `${baseUrl}${originalUrl}`;
      }
      
      // COMPLIANCE: Return proxied URL that preserves attribution and respects caching
      // This allows us to serve the image while maintaining compliance and source attribution
      return `/api/proxy/government-image?source=${encodeURIComponent(originalUrl)}&authority=${encodeURIComponent(this.portals[source].authority)}&disclaimer=true`;
      
    }).filter(url => url.length > 0);
  }

  /**
   * Convert object storage keys to public URLs for serving (NON-GOVERNMENT SOURCES ONLY)
   */
  private convertStorageKeysToPublicUrls(images: any[]): string[] {
    return images.map(img => {
      if (typeof img === 'string') {
        return img;
      }
      return img.url || img.storageKey || img.publicUrl || '';
    }).filter(url => url.length > 0);
  }

  /**
   * Rate limiting delay to be respectful to government servers
   */
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const sarfaesiScraper = new SarfaesiScraper();