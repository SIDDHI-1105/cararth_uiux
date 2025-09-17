import * as cheerio from 'cheerio';
import { DetailPageExtractor } from './detailPageExtractor.js';
import { imageAssetService } from './imageAssetService.js';
import { trustLayer } from './trustLayer.js';
import { type MarketplaceListing } from './marketplaceAggregator.js';
import { ObjectStorageService } from './objectStorage.js';
import { randomUUID } from 'crypto';

export interface EauctionsIndiaScrapingResult {
  success: boolean;
  listings: MarketplaceListing[];
  totalFound: number;
  authenticatedListings: number;
  errors?: string[];
}

/**
 * EAUCTIONS INDIA SCRAPER - BANK AUCTION INTEGRATION
 * 
 * Integrates with existing authenticity pipeline:
 * 1. Scrapes bank auction listings from EauctionsIndia.com
 * 2. Processes images through DetailPageExtractor
 * 3. Validates authenticity through ImageAuthenticityGate
 * 4. Publishes only verified listings via TrustLayer
 */
export class EauctionsIndiaScraper {
  private detailExtractor: DetailPageExtractor;
  private objectStorage: ObjectStorageService;
  private baseUrl = 'https://www.eauctionsindia.com';
  private portal = 'eauctionsindia.com';

  constructor() {
    this.detailExtractor = new DetailPageExtractor();
    this.objectStorage = new ObjectStorageService();
  }

  /**
   * Scrape bank auction listings with authenticity validation
   */
  async scrapeListings(options: {
    bank?: 'sbi' | 'hdfc' | 'icici' | 'all';
    city?: string;
    maxPages?: number;
    vehicleType?: 'car' | 'vehicle' | 'all';
  } = {}): Promise<EauctionsIndiaScrapingResult> {
    try {
      console.log('🏦 Starting EauctionsIndia bank auction scraping...');
      
      const allListings: MarketplaceListing[] = [];
      let authenticatedCount = 0;
      const errors: string[] = [];

      // Build search URLs for different banks
      const searchUrls = this.buildSearchUrls(options);
      console.log(`🔍 Searching ${searchUrls.length} bank auction pages`);

      let totalUrls = 0;

      // Process each bank's auction page
      for (const { url, bankName } of searchUrls) {
        try {
          console.log(`\n🏛️ Processing ${bankName} auctions: ${url}`);
          
          // Fetch listings page
          const html = await this.fetchPage(url);
          if (!html) {
            errors.push(`Failed to fetch ${bankName} auction page`);
            continue;
          }

          // Extract car listing URLs AND their corresponding images from the main page
          const listingsWithImages = this.extractListingsWithImages(html, bankName);
          console.log(`📋 Found ${listingsWithImages.length} ${bankName} auction listings with images`);
          totalUrls += listingsWithImages.length;

          // Process each listing through authenticity pipeline
          const maxListings = options.maxPages || 20; // Limit per bank
          for (let index = 0; index < Math.min(listingsWithImages.length, maxListings); index++) {
            const { url: listingUrl, imageUrl } = listingsWithImages[index];

            try {
              console.log(`\n🔍 Processing ${bankName} listing ${index + 1}/${Math.min(listingsWithImages.length, maxListings)}: ${listingUrl}`);
              
              // Extract listing data and use pre-extracted image from listing page
              const listing = await this.processListingWithImage(listingUrl, imageUrl, bankName);
              
              if (listing) {
                console.log(`🛡️ Trust screening: ${listing.title}`);
                
                // CRITICAL: Apply trust layer validation before certification
                const trustResult = await trustLayer.screenListing(listing);
                
                if (trustResult.isApproved) {
                  // ONLY NOW set certified status after TrustLayer approval
                  listing.verificationStatus = 'certified';
                  allListings.push(listing);
                  authenticatedCount++;
                  console.log(`✅ Bank auction authenticated: ${listing.title} (trust score: ${trustResult.trustScore})`);
                } else {
                  console.log(`❌ Bank auction failed trust validation: ${listing.title} - ${trustResult.explanation}`);
                  // Note: We don't add failed listings to allListings to maintain quality
                }
              }

            } catch (error) {
              const errorMsg = `Error processing ${bankName} listing ${listingUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`;
              console.error(`❌ ${errorMsg}`);
              errors.push(errorMsg);
            }

            // Rate limiting - be respectful to EauctionsIndia servers
            await this.delay(1200);
          }

        } catch (error) {
          const errorMsg = `Error processing ${bankName} bank page: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(`❌ ${errorMsg}`);
          errors.push(errorMsg);
        }

        // Delay between bank pages
        await this.delay(2000);
      }

      console.log(`\n📊 EauctionsIndia Bank Auction Scraping Results:`);
      console.log(`Total listings found: ${totalUrls}`);
      console.log(`Successfully processed: ${allListings.length}`);
      console.log(`Passed authenticity gate: ${authenticatedCount}`);
      console.log(`Authentication success rate: ${totalUrls > 0 ? ((authenticatedCount / totalUrls) * 100).toFixed(1) : 0}%`);

      return {
        success: true,
        listings: allListings,
        totalFound: totalUrls,
        authenticatedListings: authenticatedCount,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      console.error('💥 EauctionsIndia scraper failed:', error);
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
   * Build search URLs for different banks
   */
  private buildSearchUrls(options: {
    bank?: 'sbi' | 'hdfc' | 'icici' | 'all';
    city?: string;
    vehicleType?: 'car' | 'vehicle' | 'all';
  }): Array<{ url: string; bankName: string }> {
    const banks = options.bank === 'all' || !options.bank 
      ? ['sbi', 'hdfc', 'icici'] 
      : [options.bank];

    const urls: Array<{ url: string; bankName: string }> = [];

    for (const bank of banks) {
      let bankUrl = '';
      let bankName = '';

      switch (bank) {
        case 'sbi':
          bankUrl = `${this.baseUrl}/cars/state-bank-of-india-car-auctions`;
          bankName = 'State Bank of India';
          break;
        case 'hdfc':
          bankUrl = `${this.baseUrl}/cars/hdfc-bank-car-auctions`;
          bankName = 'HDFC Bank';
          break;
        case 'icici':
          bankUrl = `${this.baseUrl}/bank/icici-bank`;
          bankName = 'ICICI Bank';
          break;
      }

      // Add city filter if specified
      if (options.city && bankUrl) {
        const separator = bankUrl.includes('?') ? '&' : '?';
        bankUrl += `${separator}city=${encodeURIComponent(options.city)}`;
      }

      if (bankUrl) {
        urls.push({ url: bankUrl, bankName });
      }
    }

    return urls;
  }

  /**
   * Extract individual listing URLs from search page
   */
  private extractListingUrls(html: string, bankName: string): string[] {
    try {
      const $ = cheerio.load(html);
      const listingUrls: string[] = [];

      // Look for property/listing links - multiple selectors for robustness
      const linkSelectors = [
        'a[href*="/properties/"]',  // Primary pattern
        '.property-item a',         // Property item links
        '.auction-item a',          // Auction item links
        '.listing-item a',          // Listing item links
        'a[href*="car"]',          // Car-related links
        'a[href*="vehicle"]'       // Vehicle-related links
      ];

      for (const selector of linkSelectors) {
        $(selector).each((_, element) => {
          const href = $(element).attr('href');
          if (href) {
            let fullUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
            
            // Only include property detail pages
            if (fullUrl.includes('/properties/') && !listingUrls.includes(fullUrl)) {
              listingUrls.push(fullUrl);
            }
          }
        });
      }

      console.log(`🔗 Extracted ${listingUrls.length} ${bankName} listing URLs`);
      return listingUrls;

    } catch (error) {
      console.error(`❌ Error extracting listing URLs for ${bankName}:`, error);
      return [];
    }
  }

  /**
   * Extract listing URLs WITH corresponding images from main listing page
   */
  private extractListingsWithImages(html: string, bankName: string): Array<{ url: string; imageUrl: string }> {
    try {
      const $ = cheerio.load(html);
      const listingsWithImages: Array<{ url: string; imageUrl: string }> = [];

      // Find listing containers that have both links and images
      $('.row.mb-3').each((_, element) => {
        const $container = $(element);
        
        // Extract listing URL
        const listingLink = $container.find('a[href*="/properties/"]').first().attr('href');
        
        // Extract car image 
        const carImage = $container.find('.cover-image').first().attr('src');
        
        if (listingLink && carImage) {
          const fullUrl = listingLink.startsWith('http') ? listingLink : `${this.baseUrl}${listingLink}`;
          const fullImageUrl = carImage.startsWith('http') ? carImage : `${this.baseUrl}${carImage}`;
          
          listingsWithImages.push({
            url: fullUrl,
            imageUrl: fullImageUrl
          });
        }
      });

      console.log(`🔗 Extracted ${listingsWithImages.length} ${bankName} listings with images`);
      return listingsWithImages;

    } catch (error) {
      console.error(`❌ Error extracting listings with images for ${bankName}:`, error);
      return [];
    }
  }

  /**
   * Process individual listing through authenticity pipeline
   */
  private async processListing(listingUrl: string, bankName: string): Promise<MarketplaceListing | null> {
    try {
      // Generate unique listing ID
      const listingId = `eauctions_${this.extractAuctionId(listingUrl)}`;
      
      console.log(`🔄 Processing images through authenticity pipeline for: ${listingUrl}`);

      // Extract images and metadata using DetailPageExtractor
      const extractionResult = await this.detailExtractor.extractFromUrl({
        url: listingUrl,
        listingId,
        portal: this.portal,
        processImages: true, // Enable image processing for authenticity validation
      });

      if (!extractionResult.success || extractionResult.images.length === 0) {
        console.log(`⚠️ No images found or extraction failed for: ${listingUrl}`);
        return null;
      }

      console.log(`📸 ${extractionResult.images.length} images passed authenticity gate`);

      // Convert storage keys to public URLs for serving
      const publicImageUrls = this.convertStorageKeysToPublicUrls(extractionResult.images);

      // Extract car metadata from the listing page
      const carData = await this.extractListingData(listingUrl, bankName);
      if (!carData) {
        console.log(`⚠️ Could not extract car data from: ${listingUrl}`);
        return null;
      }

      // Build the final listing object - NO automatic certification here
      const listing: MarketplaceListing = {
        id: listingId,
        title: carData.title,
        brand: carData.brand,
        model: carData.model,
        year: carData.year,
        price: carData.price,
        mileage: carData.mileage || 0,
        fuelType: carData.fuelType,
        transmission: carData.transmission,
        location: carData.location,
        city: carData.city,
        source: `EauctionsIndia - ${bankName}`,
        url: listingUrl,
        images: publicImageUrls,
        description: carData.description,
        features: carData.features || [],
        condition: 'bank_auction', // Special condition for bank auctions
        verificationStatus: 'unverified', // Will be set to 'certified' only after TrustLayer approval
        listingDate: new Date(),
        sellerType: 'dealer' // Bank auctions are institutional sales
      };

      return listing;

    } catch (error) {
      console.error(`❌ Error processing listing ${listingUrl}:`, error);
      return null;
    }
  }

  /**
   * Process listing with pre-extracted image from listing page
   */
  private async processListingWithImage(listingUrl: string, imageUrl: string, bankName: string): Promise<MarketplaceListing | null> {
    try {
      // Generate unique listing ID
      const listingId = `eauctions_${this.extractAuctionId(listingUrl)}`;
      
      console.log(`🔄 Processing pre-extracted image through authenticity pipeline: ${imageUrl}`);

      // Process the single pre-extracted image through authenticity pipeline
      const imageResult = await imageAssetService.processImageFromUrl({
        listingId,
        portal: 'eauctionsindia.com',
        pageUrl: listingUrl,
        imageUrl: imageUrl,
        selector: '.cover-image'
      });

      if (!imageResult.success || !imageResult.passedGate) {
        console.log(`⚠️ Pre-extracted image failed authenticity validation: ${imageUrl} - ${imageResult.rejectionReasons?.join(', ') || 'Unknown reason'}`);
        return null;
      }

      console.log(`📸 1 pre-extracted image passed authenticity gate (score: ${imageResult.authenticityScore})`);

      // Use the original image URL for serving (since we have it directly)
      const publicImageUrls = [imageUrl];

      // Extract car metadata from the listing page
      const carData = await this.extractListingData(listingUrl, bankName);
      if (!carData) {
        console.log(`⚠️ Could not extract car data from: ${listingUrl}`);
        return null;
      }

      // Build the final listing object - NO automatic certification here
      const listing: MarketplaceListing = {
        id: listingId,
        title: carData.title,
        brand: carData.brand,
        model: carData.model,
        year: carData.year,
        price: carData.price,
        mileage: carData.mileage || 0,
        fuelType: carData.fuelType,
        transmission: carData.transmission,
        location: carData.location,
        city: carData.city,
        source: `EauctionsIndia - ${bankName}`,
        url: listingUrl,
        images: publicImageUrls,
        description: carData.description,
        features: carData.features || [],
        condition: 'bank_auction', // Special condition for bank auctions
        verificationStatus: 'unverified', // Will be set to 'certified' only after TrustLayer approval
        listingDate: new Date(),
        sellerType: 'dealer' // Bank auctions are institutional sales
      };

      return listing;

    } catch (error) {
      console.error(`❌ Error processing listing with image ${listingUrl}:`, error);
      return null;
    }
  }

  /**
   * Extract auction ID from listing URL
   */
  private extractAuctionId(url: string): string {
    const match = url.match(/\/properties\/(\d+)/);
    return match ? match[1] : randomUUID().slice(0, 8);
  }

  /**
   * Convert storage keys to public URLs for serving
   */
  private convertStorageKeysToPublicUrls(images: any[]): string[] {
    return images.map(img => {
      // If it's already a full URL, return as-is
      if (img.url && img.url.startsWith('http')) {
        return img.url;
      }
      
      // If it's a storage key, convert to proxy URL
      if (img.storageKey) {
        return `/api/proxy/image?url=${encodeURIComponent(img.storageKey)}`;
      }
      
      // Fallback to original URL
      return img.url || '';
    }).filter(Boolean);
  }

  /**
   * Extract car listing data from individual page
   */
  private async extractListingData(url: string, bankName: string): Promise<{
    title: string;
    brand: string;
    model: string;
    year: number;
    price: number;
    mileage?: number;
    fuelType: string;
    transmission: string;
    location: string;
    city: string;
    description: string;
    features?: string[];
    auctionDate?: string;
    reservePrice?: number;
    auctionId?: string;
  } | null> {
    try {
      const html = await this.fetchPage(url);
      if (!html) return null;

      const $ = cheerio.load(html);

      // Extract title
      const title = $('h1').first().text().trim() || 
                   $('.property-title').text().trim() ||
                   $('title').text().trim() ||
                   'Bank Auction Vehicle';

      // Extract description
      const description = $('.description').text().trim() ||
                         $('[class*="description"]').text().trim() ||
                         $('.property-details p').text().trim() ||
                         title;

      // Extract price (reserve price)
      const priceText = $('.reserve-price').text() ||
                       $('[class*="price"]').text() ||
                       $('[class*="reserve"]').text() ||
                       '';
      const price = this.parsePrice(priceText);

      // Extract location
      const location = $('.location').text().trim() ||
                      $('[class*="location"]').text().trim() ||
                      $('.city').text().trim() ||
                      'India';

      // Parse car details from title and description
      const carDetails = this.parseCarDetails(title, description);

      return {
        title: title,
        brand: carDetails.brand,
        model: carDetails.model,
        year: carDetails.year,
        price: price,
        mileage: carDetails.mileage,
        fuelType: carDetails.fuelType,
        transmission: carDetails.transmission,
        location: location,
        city: this.extractCity(location),
        description: `${bankName} Bank Auction: ${description}`,
        features: [],
        auctionId: this.extractAuctionId(url)
      };

    } catch (error) {
      console.error(`❌ Error extracting listing data from ${url}:`, error);
      return null;
    }
  }

  /**
   * Parse car details from title and description
   */
  private parseCarDetails(title: string, description: string): {
    brand: string;
    model: string;
    year: number;
    mileage?: number;
    fuelType: string;
    transmission: string;
  } {
    const text = `${title} ${description}`.toLowerCase();

    // Extract year (4-digit number between 1990-2030)
    const yearMatch = text.match(/\b(19[9]\d|20[0-3]\d)\b/);
    const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear() - 5;

    // Extract brand (common Indian brands)
    const brands = ['maruti', 'suzuki', 'hyundai', 'honda', 'toyota', 'tata', 'mahindra', 'renault', 'nissan', 'chevrolet', 'ford', 'skoda', 'volkswagen', 'bmw', 'audi', 'mercedes'];
    let brand = 'Unknown';
    for (const b of brands) {
      if (text.includes(b)) {
        brand = b.charAt(0).toUpperCase() + b.slice(1);
        break;
      }
    }

    // Extract model (word after brand)
    let model = 'Unknown';
    const brandIndex = text.indexOf(brand.toLowerCase());
    if (brandIndex !== -1) {
      const afterBrand = text.slice(brandIndex + brand.length).trim();
      const modelMatch = afterBrand.match(/^(\w+)/);
      if (modelMatch) {
        model = modelMatch[1].charAt(0).toUpperCase() + modelMatch[1].slice(1);
      }
    }

    // Extract fuel type
    let fuelType = 'Petrol'; // Default
    if (text.includes('diesel') || text.includes('cdi') || text.includes('tdi')) {
      fuelType = 'Diesel';
    } else if (text.includes('cng')) {
      fuelType = 'CNG';
    } else if (text.includes('electric') || text.includes('ev')) {
      fuelType = 'Electric';
    }

    // Extract transmission
    let transmission = 'Manual'; // Default
    if (text.includes('automatic') || text.includes('amt') || text.includes('cvt') || text.includes('at')) {
      transmission = 'Automatic';
    }

    return {
      brand,
      model,
      year,
      fuelType,
      transmission
    };
  }

  /**
   * Parse price from text
   */
  private parsePrice(priceText: string): number {
    const cleaned = priceText.replace(/[^\d.]/g, '');
    const price = parseFloat(cleaned);
    
    // If price is in lakhs (typical format)
    if (priceText.toLowerCase().includes('lakh')) {
      return price * 100000;
    }
    // If price is in crores
    if (priceText.toLowerCase().includes('crore')) {
      return price * 10000000;
    }
    
    return price || 300000; // Default price if parsing fails
  }

  /**
   * Extract city from location string
   */
  private extractCity(location: string): string {
    // Common Indian cities for bank auctions
    const cities = ['mumbai', 'delhi', 'bangalore', 'hyderabad', 'chennai', 'kolkata', 'pune', 'ahmedabad', 'surat', 'jaipur'];
    const lowerLocation = location.toLowerCase();
    
    for (const city of cities) {
      if (lowerLocation.includes(city)) {
        return city.charAt(0).toUpperCase() + city.slice(1);
      }
    }
    
    // Return first word as city if no match
    return location.split(',')[0].trim() || 'India';
  }

  /**
   * Fetch page HTML with error handling
   */
  private async fetchPage(url: string): Promise<string | null> {
    try {
      console.log(`🌐 Fetching: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        }
      });

      if (!response.ok) {
        console.error(`❌ HTTP ${response.status} for ${url}`);
        return null;
      }

      return await response.text();

    } catch (error) {
      console.error(`❌ Error fetching ${url}:`, error);
      return null;
    }
  }

  /**
   * Delay utility for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const eauctionsIndiaScraper = new EauctionsIndiaScraper();