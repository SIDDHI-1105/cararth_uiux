/**
 * Quikr Cars Scraper
 * Scrapes 2,500+ owner-run car listings from India's classifieds platform
 */

import { Crawl4AIService } from './crawl4aiService';
import type { DatabaseStorage } from './dbStorage';

export class QuikrScraper {
  private crawl4ai: Crawl4AIService;
  private baseUrl = 'https://www.quikr.com/cars/used-cars-for-sale-by-owner/all-india';

  constructor() {
    this.crawl4ai = new Crawl4AIService();
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
      // Scrape Quikr Cars to find latest owner listings
      const scrapeResult = await this.crawl4ai.scrapeUrl(this.baseUrl, {
        llmProvider: 'openai',
        llmModel: 'gpt-4o-mini'
      });

      if (!scrapeResult.success || !scrapeResult.data) {
        result.errors.push('Failed to scrape Quikr Cars');
        return result;
      }

      console.log(`✅ Found Quikr listing data, processing...`);
      result.scrapedCount = 1;

      // Create or get Quikr partner source
      const { IngestionService } = await import('./ingestionService');
      const ingestionService = new IngestionService();

      // Get or create Quikr source
      let quikrSource = await this.getOrCreateQuikrSource(db);
      if (!quikrSource) {
        result.errors.push('Failed to create Quikr source');
        return result;
      }

      // Ingest the listing
      const ingestionResult = await ingestionService.ingestFromWebhook(
        quikrSource.id,
        {
          ...scrapeResult.data,
          source: 'Quikr Cars',
          url: this.baseUrl,
        },
        quikrSource,
        db
      );

      if (ingestionResult.success && !ingestionResult.isDuplicate) {
        result.newListings++;
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
        sourceType: 'crawl4ai',
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
