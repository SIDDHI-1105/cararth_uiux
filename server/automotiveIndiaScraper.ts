/**
 * TheAutomotiveIndia Marketplace Scraper
 * Scrapes owner-run marketplace listings for quality used cars
 */

import { Crawl4AIService } from './crawl4aiService';
import type { DatabaseStorage } from './dbStorage';

export class AutomotiveIndiaScraper {
  private crawl4ai: Crawl4AIService;
  private baseUrl = 'https://www.theautomotiveindia.com/marketplace';

  constructor() {
    this.crawl4ai = new Crawl4AIService();
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
      // Scrape TheAutomotiveIndia marketplace to find latest listings
      const scrapeResult = await this.crawl4ai.scrapeUrl(this.baseUrl, {
        llmProvider: 'openai',
        llmModel: 'gpt-4o-mini'
      });

      if (!scrapeResult.success || !scrapeResult.data) {
        result.errors.push('Failed to scrape TheAutomotiveIndia marketplace');
        return result;
      }

      console.log(`✅ Found TheAutomotiveIndia listing data, processing...`);
      result.scrapedCount = 1;

      // Create or get TheAutomotiveIndia partner source
      const { IngestionService } = await import('./ingestionService');
      const ingestionService = new IngestionService();

      // Get or create TheAutomotiveIndia source
      let automotiveIndiaSource = await this.getOrCreateAutomotiveIndiaSource(db);
      if (!automotiveIndiaSource) {
        result.errors.push('Failed to create TheAutomotiveIndia source');
        return result;
      }

      // Ingest the listing
      const ingestionResult = await ingestionService.ingestFromWebhook(
        automotiveIndiaSource.id,
        {
          ...scrapeResult.data,
          source: 'TheAutomotiveIndia Marketplace',
          url: this.baseUrl,
        },
        automotiveIndiaSource,
        db
      );

      if (ingestionResult.success && !ingestionResult.isDuplicate) {
        result.newListings++;
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
        sourceType: 'crawl4ai',
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
