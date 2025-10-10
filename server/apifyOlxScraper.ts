import { ApifyClient } from 'apify-client';
import type { IStorage } from './storage';

/**
 * ApifyOlxScraper - Scrapes car listings from OLX India using Apify
 * 
 * Features:
 * - Uses natanielsantos/olx-india-scraper actor
 * - Extracts car details, prices, images, seller info
 * - Saves scraped listings to database
 * - Handles deduplication with portal+URL unique identifier
 */
export class ApifyOlxScraper {
  private client: ApifyClient;
  private storage: IStorage;
  private readonly ACTOR_ID = 'natanielsantos/olx-india-scraper';

  constructor(apiToken: string, storage: IStorage) {
    this.client = new ApifyClient({ token: apiToken });
    this.storage = storage;
  }

  /**
   * Scrape OLX India car listings for a specific city
   */
  async scrapeOlxCars(city: string, maxListings: number = 100): Promise<{
    success: boolean;
    scrapedCount: number;
    savedCount: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let scrapedCount = 0;
    let savedCount = 0;

    try {
      console.log(`🚀 Starting Apify OLX scrape for ${city}...`);

      // Build OLX India cars URL for the city
      const citySlug = city.toLowerCase().replace(/\s+/g, '-');
      const startUrls = [
        `https://www.olx.in/${citySlug}/cars_c84`,
        `https://www.olx.in/${citySlug}/motorcycles_c81`
      ];

      // Run the Apify actor
      const run = await this.client.actor(this.ACTOR_ID).call({
        startUrls: startUrls.map(url => ({ url })),
        maxItems: maxListings,
        proxy: {
          useApifyProxy: true
        }
      });

      console.log(`✅ Apify run completed: ${run.id}`);

      // Fetch results from the dataset
      const { items } = await this.client.dataset(run.defaultDatasetId).listItems();
      scrapedCount = items.length;

      console.log(`📦 Scraped ${scrapedCount} listings from OLX`);

      // Save each listing to database
      for (const item of items) {
        try {
          await this.saveOlxListing(item as any, city);
          savedCount++;
        } catch (error) {
          const errorMsg = `Failed to save listing ${item.url}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }

      console.log(`💾 Saved ${savedCount}/${scrapedCount} listings to database`);

      return {
        success: true,
        scrapedCount,
        savedCount,
        errors
      };
    } catch (error) {
      console.error('❌ Apify scraping failed:', error);
      return {
        success: false,
        scrapedCount,
        savedCount,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Save a scraped OLX listing to the database
   */
  private async saveOlxListing(item: any, city: string): Promise<void> {
    if (!item.url) {
      throw new Error('Listing URL is required for deduplication');
    }

    // Generate hash for deduplication (portal + URL)
    const crypto = await import('crypto');
    const hash = crypto.createHash('sha256')
      .update(`OLX:${item.url}`)
      .digest('hex');

    // Extract car details
    const price = this.parsePrice(item.price || '0');
    const brand = this.extractBrand(item.title || '');
    const model = this.extractModel(item.title || '');
    
    // Prepare cached portal listing data
    const listingData = {
      portal: 'OLX',
      externalId: item.id || item.url.split('/').pop() || hash.substring(0, 16),
      url: item.url,
      hash: hash,
      
      // Car details
      title: item.title || 'Unknown Car',
      brand: brand,
      model: model,
      year: this.extractYear(item.title || item.description || ''),
      price: price.toString(),
      mileage: this.extractMileage(item.description || ''),
      fuelType: this.extractFuelType(item.description || ''),
      transmission: this.extractTransmission(item.description || ''),
      owners: 1,
      
      // Location
      location: item.location || city,
      city: city,
      state: this.extractState(item.location || city),
      
      // Additional data
      description: item.description || '',
      features: [],
      images: item.images || [],
      sellerType: 'individual', // OLX is primarily individual sellers
      verificationStatus: 'unverified',
      condition: this.extractCondition(item.description || ''),
      
      // Quality scoring (conservative for scraped data)
      qualityScore: 50,
      sourceWeight: 60, // OLX is a major portal
      hasRealImage: (item.images && item.images.length > 0),
      specValid: true,
      imageAuthenticity: 0,
      
      // Listing metadata
      listingDate: item.postedDate ? new Date(item.postedDate) : new Date(),
      sourceMeta: {
        scrapedAt: new Date().toISOString(),
        apifyActorRun: true,
        originalData: {
          id: item.id,
          location: item.location
        }
      },
      
      // Partner fields (not applicable for scraped)
      origin: 'scraped'
    };

    // Save to cachedPortalListings table (will throw on duplicate hash)
    await this.storage.createCachedPortalListing(listingData);
    console.log(`✅ Saved OLX listing to portal cache: ${item.title}`);
  }

  /**
   * Extract brand from title
   */
  private extractBrand(title: string): string {
    const brands = ['Maruti', 'Hyundai', 'Honda', 'Toyota', 'Tata', 'Mahindra', 'Ford', 'Renault', 'Volkswagen', 'Skoda', 'Nissan', 'Chevrolet', 'BMW', 'Mercedes', 'Audi'];
    for (const brand of brands) {
      if (title.toLowerCase().includes(brand.toLowerCase())) {
        return brand;
      }
    }
    return 'Unknown';
  }

  /**
   * Extract model from title
   */
  private extractModel(title: string): string {
    const parts = title.split(' ');
    return parts.slice(1, 3).join(' ') || 'Unknown';
  }

  /**
   * Extract year from text
   */
  private extractYear(text: string): number {
    const yearMatch = text.match(/\b(19|20)\d{2}\b/);
    return yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear();
  }

  /**
   * Parse price string to number (handles Indian formats: Lakh, Crore, K, Thousand, etc.)
   * Supports: "₹ 5.4 Lakh", "₹ 8.5 L", "65 Thousand", "₹ 1.2 Cr 40 Lakh", "5 Lakh (Negotiable)"
   */
  private parsePrice(priceStr: string | number): number {
    // Handle numeric input
    if (typeof priceStr === 'number') {
      return priceStr;
    }

    try {
      // Convert to lowercase and remove extra whitespace
      let text = priceStr.toLowerCase().trim();
      
      // Remove common suffixes like "(negotiable)", "onwards", etc.
      text = text.replace(/\(.*?\)/g, '').replace(/(negotiable|onwards|approx|only)/gi, '').trim();
      
      let totalPrice = 0;
      
      // Handle composite format: "1.2 Cr 40 Lakh" or "1 Crore 50 Lakh"
      const croreMatch = text.match(/([\d.]+)\s*(crore?s?|cr)/i);
      const lakhMatch = text.match(/([\d.]+)\s*(lakhs?|lacs?|l(?!\w))/i);
      
      if (croreMatch) {
        const croreValue = parseFloat(croreMatch[1]);
        if (!isNaN(croreValue)) {
          totalPrice += croreValue * 10000000; // 1 Crore = 10,000,000
        }
      }
      
      if (lakhMatch) {
        const lakhValue = parseFloat(lakhMatch[1]);
        if (!isNaN(lakhValue)) {
          totalPrice += lakhValue * 100000; // 1 Lakh = 100,000
        }
      }
      
      // If we found crore or lakh, return that
      if (totalPrice > 0) {
        return Math.round(totalPrice);
      }
      
      // Handle Thousand/K format: "65 Thousand", "850K"
      const thousandMatch = text.match(/([\d.]+)\s*(thousands?|k(?!\w))/i);
      if (thousandMatch) {
        const value = parseFloat(thousandMatch[1]);
        if (!isNaN(value)) {
          return Math.round(value * 1000);
        }
      }
      
      // Standard numeric price: extract first number sequence
      const numericMatch = text.match(/([\d,]+\.?\d*)/);
      if (numericMatch) {
        const cleanNum = numericMatch[1].replace(/,/g, '');
        const parsed = parseFloat(cleanNum);
        if (!isNaN(parsed)) {
          return Math.round(parsed);
        }
      }
      
      // Fallback: return 0 for unparseable prices
      console.warn(`Could not parse price: "${priceStr}"`);
      return 0;
    } catch (error) {
      console.warn(`Failed to parse price: ${priceStr}`, error);
      return 0;
    }
  }

  /**
   * Extract mileage/km driven from description
   */
  private extractMileage(description: string): number {
    const kmMatch = description.match(/(\d+[\d,]*)\s*(km|kms|kilometers)/i);
    if (kmMatch) {
      return parseInt(kmMatch[1].replace(/,/g, ''));
    }
    return 0;
  }

  /**
   * Extract fuel type from description
   */
  private extractFuelType(description: string): string {
    const fuelTypes = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'];
    for (const fuel of fuelTypes) {
      if (description.toLowerCase().includes(fuel.toLowerCase())) {
        return fuel;
      }
    }
    return 'Petrol';
  }

  /**
   * Extract transmission type from description
   */
  private extractTransmission(description: string): string {
    if (description.toLowerCase().includes('automatic') || description.toLowerCase().includes('amt')) {
      return 'Automatic';
    }
    return 'Manual';
  }

  /**
   * Extract state from location
   */
  private extractState(location: string): string {
    const stateMap: Record<string, string> = {
      'mumbai': 'Maharashtra',
      'delhi': 'Delhi',
      'bangalore': 'Karnataka',
      'hyderabad': 'Telangana',
      'chennai': 'Tamil Nadu',
      'kolkata': 'West Bengal',
      'pune': 'Maharashtra',
      'ahmedabad': 'Gujarat',
      'jaipur': 'Rajasthan',
      'lucknow': 'Uttar Pradesh',
      'surat': 'Gujarat',
      'noida': 'Uttar Pradesh',
      'gurgaon': 'Haryana',
      'gurugram': 'Haryana',
      'faridabad': 'Haryana',
      'ghaziabad': 'Uttar Pradesh'
    };

    const lowerLocation = location.toLowerCase();
    for (const [city, state] of Object.entries(stateMap)) {
      if (lowerLocation.includes(city)) {
        return state;
      }
    }
    
    return 'India'; // Default fallback
  }

  /**
   * Extract condition from description
   */
  private extractCondition(description: string): string {
    const lowerDesc = description.toLowerCase();
    
    if (lowerDesc.includes('excellent') || lowerDesc.includes('like new')) {
      return 'excellent';
    }
    if (lowerDesc.includes('good') || lowerDesc.includes('well maintained')) {
      return 'good';
    }
    if (lowerDesc.includes('fair') || lowerDesc.includes('needs work')) {
      return 'fair';
    }
    
    return 'good'; // Default to good for OLX listings
  }
}
