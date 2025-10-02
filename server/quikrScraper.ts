/**
 * Quikr Cars Scraper
 * Scrapes 2,500+ owner-run car listings from India's classifieds platform
 */

import { OfficialFirecrawlMcpService } from './officialFirecrawlMcp';
import type { DatabaseStorage } from './dbStorage';

export class QuikrScraper {
  private firecrawl: OfficialFirecrawlMcpService;
  private baseUrl = 'https://www.quikr.com/cars/used-cars-for-sale-by-owner/all-india';

  constructor() {
    this.firecrawl = new OfficialFirecrawlMcpService({
      apiKey: process.env.FIRECRAWL_API_KEY || ''
    });
  }

  async scrapeLatestListings(db: DatabaseStorage['db']): Promise<{
    scrapedCount: number;
    newListings: number;
    errors: string[];
  }> {
    console.log('🚙 Scraping Quikr Cars for owner listings...');
    
    const result = {
      scrapedCount: 0,
      newListings: 0,
      errors: [] as string[],
    };

    try {
      // Scrape Quikr Cars using Firecrawl
      const scrapeResult = await this.firecrawl.extractCarListings(
        this.baseUrl,
        'Extract all owner-listed cars for sale including title, brand, model, year, price, mileage, and location'
      );

      if (!scrapeResult.success || !scrapeResult.listings || scrapeResult.listings.length === 0) {
        result.errors.push('Failed to scrape Quikr Cars or no listings found');
        return result;
      }

      console.log(`✅ Found ${scrapeResult.listings.length} Quikr listings, processing...`);
      result.scrapedCount = scrapeResult.listings.length;

      // Create or get Quikr partner source
      const { IngestionService } = await import('./ingestionService');
      const ingestionService = new IngestionService();

      // Get or create Quikr source
      let quikrSource = await this.getOrCreateQuikrSource(db);
      if (!quikrSource) {
        result.errors.push('Failed to create Quikr source');
        return result;
      }

      // Ingest each listing
      for (const listing of scrapeResult.listings) {
        const ingestionResult = await ingestionService.ingestFromWebhook(
          quikrSource.id,
          {
            ...listing,
            source: 'Quikr Cars',
            url: listing.url || this.baseUrl,
          },
          quikrSource,
          db
        );

        if (ingestionResult.success && !ingestionResult.isDuplicate) {
          result.newListings++;
        }
      }

      console.log(`✅ Quikr scraping complete: ${result.newListings} new listings`);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Quikr scraping failed:', errorMsg);
      result.errors.push(errorMsg);
    }

    return result;
  }

  private async getOrCreateQuikrSource(db: DatabaseStorage['db']) {
    const { db: drizzleDb } = await import('./db');
    const { listingSources } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');

    // Try to find existing Quikr source
    const existing = await drizzleDb
      .select()
      .from(listingSources)
      .where(eq(listingSources.partnerName, 'Quikr Cars'))
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    // Create new Quikr source
    const [newSource] = await drizzleDb
      .insert(listingSources)
      .values({
        partnerName: 'Quikr Cars',
        contactEmail: 'support@quikr.com',
        sourceType: 'firecrawl',
        endpoint: this.baseUrl,
        country: 'India',
        consented: true,
        status: 'active',
      })
      .returning();

    console.log('✅ Created Quikr Cars partner source');
    return newSource;
  }
}

export const quikrScraper = new QuikrScraper();
