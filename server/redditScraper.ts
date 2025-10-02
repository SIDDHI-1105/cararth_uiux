/**
 * Reddit r/CarsIndia Scraper
 * Scrapes buying/selling threads and car discussions from India's active car community
 */

import { OfficialFirecrawlMcpService } from './officialFirecrawlMcp';
import type { DatabaseStorage } from './dbStorage';

export class RedditScraper {
  private firecrawl: OfficialFirecrawlMcpService;
  private baseUrl = 'https://www.reddit.com/r/CarsIndia/search/?q=flair%3A%22Buying%2FSelling%22&restrict_sr=1&sort=new';

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
    console.log('🤖 Scraping Reddit r/CarsIndia for car buying/selling threads...');
    
    const result = {
      scrapedCount: 0,
      newListings: 0,
      errors: [] as string[],
    };

    try {
      // Scrape Reddit r/CarsIndia using Firecrawl
      const scrapeResult = await this.firecrawl.extractCarListings(
        this.baseUrl,
        'Extract car listings from buying/selling posts including title, brand, model, year, price, and seller contact info'
      );

      if (!scrapeResult.success || !scrapeResult.listings || scrapeResult.listings.length === 0) {
        result.errors.push('Failed to scrape Reddit r/CarsIndia or no listings found');
        return result;
      }

      console.log(`✅ Found ${scrapeResult.listings.length} Reddit listings, processing...`);
      result.scrapedCount = scrapeResult.listings.length;

      // Create or get Reddit partner source
      const { IngestionService } = await import('./ingestionService');
      const ingestionService = new IngestionService();

      // Get or create Reddit source
      let redditSource = await this.getOrCreateRedditSource(db);
      if (!redditSource) {
        result.errors.push('Failed to create Reddit source');
        return result;
      }

      // Ingest each listing
      for (const listing of scrapeResult.listings) {
        const ingestionResult = await ingestionService.ingestFromWebhook(
          redditSource.id,
          {
            ...listing,
            source: 'Reddit r/CarsIndia',
            url: listing.url || this.baseUrl,
          },
          redditSource,
          db
        );

        if (ingestionResult.success && !ingestionResult.isDuplicate) {
          result.newListings++;
        }
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
        sourceType: 'firecrawl',
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
