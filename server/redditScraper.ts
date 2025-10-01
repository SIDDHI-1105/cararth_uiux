/**
 * Reddit r/CarsIndia Scraper
 * Scrapes buying/selling threads and car discussions from India's active car community
 */

import { Crawl4AIService } from './crawl4aiService';
import type { DatabaseStorage } from './dbStorage';

export class RedditScraper {
  private crawl4ai: Crawl4AIService;
  private baseUrl = 'https://www.reddit.com/r/CarsIndia/search/?q=flair%3A%22Buying%2FSelling%22&restrict_sr=1&sort=new';

  constructor() {
    this.crawl4ai = new Crawl4AIService();
  }

  async scrapeLatestListings(db: DatabaseStorage['db']): Promise<{
    scrapedCount: number;
    newListings: number;
    errors: string[];
  }> {
    console.log('🤖 Scraping Reddit r/CarsIndia for car buying/selling threads...');
    
    const result = {
      scrapedCount: 0,
      newListings: 0,
      errors: [] as string[],
    };

    try {
      // Scrape Reddit r/CarsIndia to find latest buying/selling posts
      const scrapeResult = await this.crawl4ai.scrapeUrl(this.baseUrl, {
        llmProvider: 'openai',
        llmModel: 'gpt-4o-mini'
      });

      if (!scrapeResult.success || !scrapeResult.data) {
        result.errors.push('Failed to scrape Reddit r/CarsIndia');
        return result;
      }

      console.log(`✅ Found Reddit listing data, processing...`);
      result.scrapedCount = 1;

      // Create or get Reddit partner source
      const { IngestionService } = await import('./ingestionService');
      const ingestionService = new IngestionService();

      // Get or create Reddit source
      let redditSource = await this.getOrCreateRedditSource(db);
      if (!redditSource) {
        result.errors.push('Failed to create Reddit source');
        return result;
      }

      // Ingest the listing
      const ingestionResult = await ingestionService.ingestFromWebhook(
        redditSource.id,
        {
          ...scrapeResult.data,
          source: 'Reddit r/CarsIndia',
          url: this.baseUrl,
        },
        redditSource,
        db
      );

      if (ingestionResult.success && !ingestionResult.isDuplicate) {
        result.newListings++;
      }

      console.log(`✅ Reddit scraping complete: ${result.newListings} new listings`);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Reddit scraping failed:', errorMsg);
      result.errors.push(errorMsg);
    }

    return result;
  }

  private async getOrCreateRedditSource(db: DatabaseStorage['db']) {
    const { db: drizzleDb } = await import('./db');
    const { listingSources } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');

    // Try to find existing Reddit source
    const existing = await drizzleDb
      .select()
      .from(listingSources)
      .where(eq(listingSources.partnerName, 'Reddit r/CarsIndia'))
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    // Create new Reddit source
    const [newSource] = await drizzleDb
      .insert(listingSources)
      .values({
        partnerName: 'Reddit r/CarsIndia',
        contactEmail: 'community@reddit.com',
        sourceType: 'crawl4ai',
        endpoint: this.baseUrl,
        country: 'India',
        consented: true,
        status: 'active',
      })
      .returning();

    console.log('✅ Created Reddit r/CarsIndia partner source');
    return newSource;
  }
}

export const redditScraper = new RedditScraper();
