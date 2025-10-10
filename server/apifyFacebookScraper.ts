import { ApifyClient } from 'apify-client';
import type { IStorage } from './storage';

/**
 * ApifyFacebookScraper - Scrapes car listings from Facebook Marketplace using Apify
 * 
 * Features:
 * - Uses apify/facebook-marketplace-scraper actor
 * - Extracts car details, prices, images, seller info
 * - Saves scraped listings to database
 * - Handles deduplication with portal+URL unique identifier
 */
export class ApifyFacebookScraper {
  private client: ApifyClient;
  private storage: IStorage;
  private readonly ACTOR_ID = 'apify/facebook-marketplace-scraper';

  constructor(apiToken: string, storage: IStorage) {
    this.client = new ApifyClient({ token: apiToken });
    this.storage = storage;
  }

  /**
   * Scrape Facebook Marketplace car listings for a specific city
   */
  async scrapeFacebookCars(city: string, maxListings: number = 100): Promise<{
    success: boolean;
    scrapedCount: number;
    savedCount: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let scrapedCount = 0;
    let savedCount = 0;

    try {
      console.log(`🚀 Starting Apify Facebook Marketplace scrape for ${city}...`);

      // Build Facebook Marketplace search URLs for cars in the city
      const searchUrl = `https://www.facebook.com/marketplace/${city.toLowerCase()}/search?query=used%20cars`;
      
      // Run the Apify actor
      const run = await this.client.actor(this.ACTOR_ID).call({
        startUrls: [{ url: searchUrl }],
        maxItems: maxListings,
        proxy: {
          useApifyProxy: true
        }
      });

      console.log(`✅ Apify run completed: ${run.id}`);

      // Fetch results from the dataset
      const { items } = await this.client.dataset(run.defaultDatasetId).listItems();
      scrapedCount = items.length;

      console.log(`📦 Scraped ${scrapedCount} listings from Facebook Marketplace`);

      // Save each listing to database
      for (const item of items) {
        try {
          await this.saveFacebookListing(item as any, city);
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
      console.error('❌ Apify Facebook scraping failed:', error);
      return {
        success: false,
        scrapedCount,
        savedCount,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Save a scraped Facebook Marketplace listing to the database
   */
  private async saveFacebookListing(item: any, city: string): Promise<void> {
    if (!item.url) {
      throw new Error('Listing URL is required for deduplication');
    }

    // Generate hash for deduplication (portal + URL)
    const crypto = await import('crypto');
    const hash = crypto.createHash('sha256')
      .update(`FacebookMarketplace:${item.url}`)
      .digest('hex');

    // Extract car details
    const price = this.parsePrice(item.price || '0');
    const brand = this.extractBrand(item.title || item.name || '');
    const model = this.extractModel(item.title || item.name || '');
    
    // Prepare cached portal listing data
    const listingData = {
      portal: 'FacebookMarketplace',
      externalId: item.id || item.itemId || hash.substring(0, 16),
      url: item.url,
      hash: hash,
      
      // Car details
      title: item.title || item.name || 'Unknown Car',
      brand: brand,
      model: model,
      year: this.extractYear(item.title || item.description || ''),
      price: price.toString(),
      mileage: this.extractMileage(item.description || ''),
      fuelType: this.extractFuelType(item.description || ''),
      transmission: this.extractTransmission(item.description || ''),
      city: item.location || city,
      state: this.cityToState(city),
      
      // Images (Facebook provides image URLs)
      images: item.images || (item.image ? [item.image] : []),
      primaryImage: item.image || (item.images && item.images[0]) || null,
      
      // Seller info
      sellerName: item.sellerName || item.seller?.name || 'Unknown Seller',
      sellerPhone: null, // Facebook doesn't expose phone numbers in listings
      
      // Listing metadata
      description: item.description || '',
      condition: item.condition || 'used',
      listingDate: item.date || new Date().toISOString(),
      
      // Quality defaults (will be updated by quality scoring)
      qualityScore: 60, // Default for Facebook Marketplace listings
      hasVerifiedImages: false,
      hasCompleteListing: !!(item.title && item.price && item.description),
      
      // Timestamps
      scrapedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    // Save to cachedPortalListings table
    await this.storage.createCachedPortalListing(listingData as any);
    console.log(`✅ Saved Facebook listing: ${listingData.title} - ${listingData.city}`);
  }

  /**
   * Parse Indian price format from Facebook listings
   */
  private parsePrice(priceStr: string): number {
    if (!priceStr) return 0;
    
    // Remove currency symbols and clean
    const cleaned = priceStr.replace(/[₹$,\s]/g, '').toLowerCase();
    
    // Handle Indian price formats
    if (cleaned.includes('lakh') || cleaned.includes('l')) {
      const num = parseFloat(cleaned.replace(/[^0-9.]/g, ''));
      return num; // Already in lakhs
    }
    
    if (cleaned.includes('cr') || cleaned.includes('crore')) {
      const num = parseFloat(cleaned.replace(/[^0-9.]/g, ''));
      return num * 100; // Convert crores to lakhs
    }
    
    if (cleaned.includes('k') || cleaned.includes('thousand')) {
      const num = parseFloat(cleaned.replace(/[^0-9.]/g, ''));
      return num / 100; // Convert thousands to lakhs
    }
    
    // Plain number - assume it's in rupees, convert to lakhs
    const num = parseFloat(cleaned.replace(/[^0-9.]/g, ''));
    return num / 100000; // Convert rupees to lakhs
  }

  /**
   * Extract brand from title
   */
  private extractBrand(title: string): string {
    const brands = [
      'Maruti Suzuki', 'Maruti', 'Hyundai', 'Tata', 'Mahindra', 'Honda', 'Toyota',
      'Ford', 'Renault', 'Volkswagen', 'Skoda', 'Nissan', 'Chevrolet', 'Fiat',
      'Jeep', 'MG', 'Kia', 'BMW', 'Mercedes', 'Audi', 'Volvo'
    ];
    
    const titleLower = title.toLowerCase();
    for (const brand of brands) {
      if (titleLower.includes(brand.toLowerCase())) {
        return brand;
      }
    }
    
    // Fallback: first word
    return title.split(' ')[0] || 'Unknown';
  }

  /**
   * Extract model from title
   */
  private extractModel(title: string): string {
    const words = title.split(' ').filter(w => w.length > 0);
    
    // Model is usually after the brand
    if (words.length >= 2) {
      return words.slice(1, 3).join(' ');
    }
    
    return words[1] || 'Unknown';
  }

  /**
   * Extract year from text
   */
  private extractYear(text: string): number {
    const currentYear = new Date().getFullYear();
    const yearMatch = text.match(/\b(19|20)\d{2}\b/);
    
    if (yearMatch) {
      const year = parseInt(yearMatch[0]);
      if (year >= 1990 && year <= currentYear) {
        return year;
      }
    }
    
    return currentYear - 5; // Default to 5 years old
  }

  /**
   * Extract mileage from description
   */
  private extractMileage(description: string): number {
    const mileageMatch = description.match(/(\d+(?:,\d+)*)\s*(?:km|kms|kilometers)/i);
    if (mileageMatch) {
      return parseInt(mileageMatch[1].replace(/,/g, ''));
    }
    return 0;
  }

  /**
   * Extract fuel type from description
   */
  private extractFuelType(description: string): string {
    const descLower = description.toLowerCase();
    if (descLower.includes('diesel')) return 'Diesel';
    if (descLower.includes('petrol') || descLower.includes('gasoline')) return 'Petrol';
    if (descLower.includes('cng')) return 'CNG';
    if (descLower.includes('electric') || descLower.includes('ev')) return 'Electric';
    if (descLower.includes('hybrid')) return 'Hybrid';
    return 'Petrol'; // Default
  }

  /**
   * Extract transmission from description
   */
  private extractTransmission(description: string): string {
    const descLower = description.toLowerCase();
    if (descLower.includes('automatic') || descLower.includes('auto')) return 'Automatic';
    if (descLower.includes('manual')) return 'Manual';
    return 'Manual'; // Default
  }

  /**
   * Map city to state
   */
  private cityToState(city: string): string {
    const cityStateMap: Record<string, string> = {
      'hyderabad': 'Telangana',
      'bangalore': 'Karnataka',
      'bengaluru': 'Karnataka',
      'mumbai': 'Maharashtra',
      'delhi': 'Delhi',
      'chennai': 'Tamil Nadu',
      'kolkata': 'West Bengal',
      'pune': 'Maharashtra',
      'ahmedabad': 'Gujarat',
      'surat': 'Gujarat',
      'jaipur': 'Rajasthan',
      'lucknow': 'Uttar Pradesh',
      'kanpur': 'Uttar Pradesh',
      'nagpur': 'Maharashtra',
      'indore': 'Madhya Pradesh',
      'thane': 'Maharashtra',
      'bhopal': 'Madhya Pradesh',
      'visakhapatnam': 'Andhra Pradesh',
      'pimpri-chinchwad': 'Maharashtra',
      'patna': 'Bihar',
      'vadodara': 'Gujarat',
      'ghaziabad': 'Uttar Pradesh',
      'ludhiana': 'Punjab',
      'agra': 'Uttar Pradesh',
      'nashik': 'Maharashtra',
      'faridabad': 'Haryana',
      'meerut': 'Uttar Pradesh',
      'rajkot': 'Gujarat',
      'kalyan-dombivali': 'Maharashtra',
      'vasai-virar': 'Maharashtra',
      'varanasi': 'Uttar Pradesh',
      'srinagar': 'Jammu and Kashmir',
      'aurangabad': 'Maharashtra',
      'dhanbad': 'Jharkhand',
      'amritsar': 'Punjab',
      'navi mumbai': 'Maharashtra',
      'allahabad': 'Uttar Pradesh',
      'prayagraj': 'Uttar Pradesh',
      'howrah': 'West Bengal',
      'ranchi': 'Jharkhand',
      'gwalior': 'Madhya Pradesh',
      'jabalpur': 'Madhya Pradesh',
      'coimbatore': 'Tamil Nadu',
      'vijayawada': 'Andhra Pradesh',
      'jodhpur': 'Rajasthan',
      'madurai': 'Tamil Nadu',
      'raipur': 'Chhattisgarh',
      'kota': 'Rajasthan',
      'chandigarh': 'Chandigarh',
      'guwahati': 'Assam'
    };
    
    return cityStateMap[city.toLowerCase()] || 'Unknown';
  }
}
