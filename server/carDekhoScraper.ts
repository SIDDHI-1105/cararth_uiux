import axios from 'axios';
import * as cheerio from 'cheerio';
import type { IStorage } from './storage';
import { listingIngestionService } from './listingIngestionService';
import type { MarketplaceListing } from './marketplaceAggregator';

/**
 * CarDekhoScraper - Scrapes car listings from CarDekho India
 * 
 * Features:
 * - Scrapes public listings from CarDekho Hyderabad
 * - Extracts car details, prices, images, seller info
 * - Routes through Trust Layer validation
 * - Handles deduplication with portal+URL unique identifier
 */
export class CarDekhoScraper {
  private storage: IStorage;
  private readonly BASE_URL = 'https://www.cardekho.com';

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  /**
   * Scrape CarDekho car listings for a specific city
   */
  async scrapeCarDekhoCars(city: string, maxListings: number = 50): Promise<{
    success: boolean;
    scrapedCount: number;
    savedCount: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let scrapedCount = 0;
    let savedCount = 0;

    try {
      console.log(`🚀 Starting CarDekho scrape for ${city}...`);

      // Build CarDekho search URL
      const citySlug = city.toLowerCase().replace(/\s+/g, '-');
      const searchUrl = `${this.BASE_URL}/used-cars+in+${citySlug}`;
      
      console.log(`📡 Fetching from: ${searchUrl}`);

      // Fetch the page
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        },
        timeout: 30000
      });

      // Parse HTML
      const $ = cheerio.load(response.data);

      // Extract listings - CarDekho uses .cardColumn class for listing cards
      const listings: any[] = [];

      $('.cardColumn').each((index, element) => {
        if (index >= maxListings) return false;

        const $elem = $(element);
        
        // Extract title from the card
        const title = $elem.find('h2, h3, [class*="title"]').first().text().trim();
        
        // Extract price - look for price text patterns
        const priceText = $elem.text();
        const priceMatch = priceText.match(/₹[\d.,]+ (?:Lakh|Cr|Crore)/i);
        const price = priceMatch ? priceMatch[0] : '';
        
        // Extract link
        const link = $elem.find('a').first().attr('href');
        
        // Extract image
        const image = $elem.find('img').first().attr('src') || $elem.find('img').first().attr('data-src');
        
        // Extract description/details (mileage, fuel type, etc.)
        const description = $elem.text().trim();

        if (title && price && link) {
          listings.push({
            title,
            price,
            url: link.startsWith('http') ? link : `${this.BASE_URL}${link}`,
            image,
            description,
            location: city
          });
        }
      });

      scrapedCount = listings.length;
      console.log(`📦 Scraped ${scrapedCount} listings from CarDekho`);

      // Save each listing
      for (const item of listings) {
        try {
          await this.saveCarDekhoListing(item, city);
          savedCount++;
          
          // Rate limiting: 1 second delay between saves to be respectful
          await this.delay(1000);
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
      console.error('❌ CarDekho scraping failed:', error);
      return {
        success: false,
        scrapedCount,
        savedCount,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Save a scraped CarDekho listing via centralized ingestion service
   */
  private async saveCarDekhoListing(item: any, city: string): Promise<void> {
    if (!item.url) {
      throw new Error('Listing URL is required for deduplication');
    }

    // Generate unique ID
    const crypto = await import('crypto');
    const listingId = crypto.createHash('sha256')
      .update(`CarDekho:${item.url}`)
      .digest('hex').substring(0, 16);

    // Extract car details
    const price = this.parsePrice(item.price || '0');
    const brand = this.extractBrand(item.title || '');
    const model = this.extractModel(item.title || '');

    // Create MarketplaceListing
    const listing: MarketplaceListing = {
      id: listingId,
      title: item.title || 'Unknown Car',
      brand: brand,
      model: model,
      year: this.extractYear(item.title || item.description || ''),
      price: parseFloat(price) || 0,
      mileage: this.extractMileageNum(item.description || ''),
      fuelType: this.extractFuelType(item.description || item.title || ''),
      transmission: this.extractTransmission(item.description || item.title || ''),
      location: item.location || city,
      city: city,
      source: 'CarDekho',
      url: item.url,
      images: item.image ? [item.image] : [],
      description: item.description || '',
      features: [],
      condition: 'used',
      verificationStatus: 'unverified', // Will be set by Trust Layer
      listingDate: new Date(),
      sellerType: 'dealer'
    };

    // Route through Trust Layer validation
    const result = await listingIngestionService.ingestListing(listing, 'CarDekho');
    
    if (result.saved) {
      console.log(`✅ CarDekho listing saved: ${result.trustResult.finalVerificationStatus}`);
    } else {
      console.log(`❌ CarDekho listing rejected: ${result.reason}`);
    }
  }

  /**
   * Parse Indian price format to rupees (consistent with other scrapers)
   * Handles: "₹ 5.4 Lakh", "₹ 8.5 L", "65 Thousand", "₹ 1.2 Cr", etc.
   */
  private parsePrice(priceStr: string): string {
    if (!priceStr) return '0';
    
    try {
      // Convert to lowercase and remove extra whitespace
      let text = priceStr.toLowerCase().trim();
      
      // Remove common suffixes
      text = text.replace(/\(.*?\)/g, '').replace(/(negotiable|onwards|approx|only)/gi, '').trim();
      
      let totalPrice = 0;
      
      // Handle Crore format: "1.2 Cr" or "1 Crore"
      const croreMatch = text.match(/([\d.]+)\s*(crore?s?|cr)/i);
      if (croreMatch) {
        const croreValue = parseFloat(croreMatch[1]);
        if (!isNaN(croreValue)) {
          totalPrice += croreValue * 10000000; // 1 Crore = 10,000,000 rupees
        }
      }
      
      // Handle Lakh format: "5.4 Lakh" or "5.4 L"
      const lakhMatch = text.match(/([\d.]+)\s*(lakhs?|lacs?|l(?!\w))/i);
      if (lakhMatch) {
        const lakhValue = parseFloat(lakhMatch[1]);
        if (!isNaN(lakhValue)) {
          totalPrice += lakhValue * 100000; // 1 Lakh = 100,000 rupees
        }
      }
      
      // If we found crore or lakh, return rupee amount
      if (totalPrice > 0) {
        return Math.round(totalPrice).toString();
      }
      
      // Handle Thousand/K format: "65 Thousand", "850K"
      const thousandMatch = text.match(/([\d.]+)\s*(thousands?|k(?!\w))/i);
      if (thousandMatch) {
        const value = parseFloat(thousandMatch[1]);
        if (!isNaN(value)) {
          return Math.round(value * 1000).toString();
        }
      }
      
      // Standard numeric price: extract first number sequence
      const numericMatch = text.match(/([\d,]+\.?\d*)/);
      if (numericMatch) {
        const cleanNum = numericMatch[1].replace(/,/g, '');
        const parsed = parseFloat(cleanNum);
        if (!isNaN(parsed)) {
          return Math.round(parsed).toString();
        }
      }
      
      // Fallback: return 0 for unparseable prices
      console.warn(`Could not parse price: "${priceStr}"`);
      return '0';
    } catch (error) {
      console.warn(`Failed to parse price: ${priceStr}`, error);
      return '0';
    }
  }

  /**
   * Extract brand from title
   */
  private extractBrand(title: string): string {
    const brands = [
      'Maruti Suzuki', 'Maruti', 'Hyundai', 'Honda', 'Toyota', 'Tata', 
      'Mahindra', 'Ford', 'Renault', 'Volkswagen', 'Skoda', 'Nissan', 
      'Chevrolet', 'BMW', 'Mercedes', 'Audi', 'Kia', 'MG', 'Jeep'
    ];
    
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
   * Extract mileage from text as number
   */
  private extractMileageNum(text: string): number {
    const mileageMatch = text.match(/(\d+[\d,]*)\s*(km|kms|kilometres)/i);
    if (mileageMatch) {
      return parseInt(mileageMatch[1].replace(/,/g, ''));
    }
    return 0;
  }

  /**
   * Extract fuel type from text
   */
  private extractFuelType(text: string): string {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('diesel')) return 'Diesel';
    if (lowerText.includes('petrol')) return 'Petrol';
    if (lowerText.includes('cng')) return 'CNG';
    if (lowerText.includes('electric') || lowerText.includes('ev')) return 'Electric';
    if (lowerText.includes('hybrid')) return 'Hybrid';
    return 'Petrol';
  }

  /**
   * Extract transmission from text
   */
  private extractTransmission(text: string): string {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('automatic') || lowerText.includes('auto')) return 'Automatic';
    if (lowerText.includes('manual')) return 'Manual';
    return 'Manual';
  }

  /**
   * Delay helper for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
