/**
 * TheAutomotiveIndia Marketplace Scraper
 * Scrapes owner-run marketplace listings for quality used cars
 */

import { OfficialFirecrawlMcpService } from './officialFirecrawlMcp';
import type { DatabaseStorage } from './dbStorage';

export class AutomotiveIndiaScraper {
  private firecrawl: OfficialFirecrawlMcpService;
  private baseUrl = 'https://www.theautomotiveindia.com/marketplace';

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
    console.log('🚗 Scraping TheAutomotiveIndia marketplace for fresh listings...');
    
    const result = {
      scrapedCount: 0,
      newListings: 0,
      errors: [] as string[],
    };

    try {
      // Scrape TheAutomotiveIndia marketplace using Firecrawl
      const scrapeResult = await this.firecrawl.extractCarListings(
        this.baseUrl,
        'Extract all car listings from this marketplace page including title, brand, model, year, price, and other details'
      );

      if (!scrapeResult.success || !scrapeResult.listings || scrapeResult.listings.length === 0) {
        result.errors.push('Failed to scrape TheAutomotiveIndia marketplace or no listings found');
        return result;
      }

      console.log(`✅ Found ${scrapeResult.listings.length} TheAutomotiveIndia listings, processing...`);
      result.scrapedCount = scrapeResult.listings.length;

      // Create or get TheAutomotiveIndia partner source
      const { IngestionService } = await import('./ingestionService');
      const ingestionService = new IngestionService();

      // Get or create TheAutomotiveIndia source
      let automotiveIndiaSource = await this.getOrCreateAutomotiveIndiaSource(db);
      if (!automotiveIndiaSource) {
        result.errors.push('Failed to create TheAutomotiveIndia source');
        return result;
      }

      // Ingest each listing
      for (const listing of scrapeResult.listings) {
        const ingestionResult = await ingestionService.ingestFromWebhook(
          automotiveIndiaSource.id,
          {
            ...listing,
            source: 'TheAutomotiveIndia Marketplace',
            url: listing.url || this.baseUrl,
          },
          automotiveIndiaSource,
          db
        );

        if (ingestionResult.success && !ingestionResult.isDuplicate) {
          result.newListings++;
        }
      }

      console.log(`✅ TheAutomotiveIndia scraping complete: ${result.newListings} new listings`);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ TheAutomotiveIndia scraping failed:', errorMsg);
      result.errors.push(errorMsg);
    }

    return result;
  }

  private async getOrCreateAutomotiveIndiaSource(db: DatabaseStorage['db']) {
    const { db: drizzleDb } = await import('./db');
    const { listingSources } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');

    // Try to find existing TheAutomotiveIndia source
    const existing = await drizzleDb
      .select()
      .from(listingSources)
      .where(eq(listingSources.partnerName, 'TheAutomotiveIndia Marketplace'))
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    // Create new TheAutomotiveIndia source
    const [newSource] = await drizzleDb
      .insert(listingSources)
      .values({
        partnerName: 'TheAutomotiveIndia Marketplace',
        contactEmail: 'marketplace@theautomotiveindia.com',
        sourceType: 'firecrawl',
        endpoint: this.baseUrl,
        country: 'India',
        consented: true,
        status: 'active',
      })
      .returning();

    console.log('✅ Created TheAutomotiveIndia partner source');
    return newSource;
  }
}

export const automotiveIndiaScraper = new AutomotiveIndiaScraper();
