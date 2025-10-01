/**
 * Team-BHP Classifieds Scraper
 * Scrapes owner-run forum listings for quality used cars
 */

import { Crawl4AIService } from './crawl4aiService';
import type { DatabaseStorage } from './dbStorage';

export class TeamBhpScraper {
  private crawl4ai: Crawl4AIService;
  private baseUrl = 'https://classifieds.team-bhp.com';

  constructor() {
    this.crawl4ai = new Crawl4AIService();
  }

  async scrapeLatestListings(db: DatabaseStorage['db']): Promise<{
    scrapedCount: number;
    newListings: number;
    errors: string[];
  }> {
    console.log('🏎️ Scraping Team-BHP classifieds for fresh listings...');
    
    const result = {
      scrapedCount: 0,
      newListings: 0,
      errors: [] as string[],
    };

    try {
      // Scrape Team-BHP classifieds homepage to find latest listings
      const scrapeResult = await this.crawl4ai.scrapeUrl(this.baseUrl, {
        llmProvider: 'openai',
        llmModel: 'gpt-4o-mini'
      });

      if (!scrapeResult.success || !scrapeResult.data) {
        result.errors.push('Failed to scrape Team-BHP classifieds');
        return result;
      }

      console.log(`✅ Found Team-BHP listing data, processing...`);
      result.scrapedCount = 1;

      // Create or get Team-BHP partner source
      const { IngestionService } = await import('./ingestionService');
      const ingestionService = new IngestionService();

      // Get or create Team-BHP source
      let teamBhpSource = await this.getOrCreateTeamBhpSource(db);
      if (!teamBhpSource) {
        result.errors.push('Failed to create Team-BHP source');
        return result;
      }

      // Ingest the listing
      const ingestionResult = await ingestionService.ingestFromWebhook(
        teamBhpSource.id,
        {
          ...scrapeResult.data,
          source: 'Team-BHP Classifieds',
          url: this.baseUrl,
        },
        teamBhpSource,
        db
      );

      if (ingestionResult.success && !ingestionResult.isDuplicate) {
        result.newListings++;
      }

      console.log(`✅ Team-BHP scraping complete: ${result.newListings} new listings`);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Team-BHP scraping failed:', errorMsg);
      result.errors.push(errorMsg);
    }

    return result;
  }

  private async getOrCreateTeamBhpSource(db: DatabaseStorage['db']) {
    const { db: drizzleDb } = await import('./db');
    const { listingSources } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');

    // Try to find existing Team-BHP source
    const existing = await drizzleDb
      .select()
      .from(listingSources)
      .where(eq(listingSources.partnerName, 'Team-BHP Classifieds'))
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    // Create new Team-BHP source
    const [newSource] = await drizzleDb
      .insert(listingSources)
      .values({
        partnerName: 'Team-BHP Classifieds',
        contactEmail: 'classifieds@team-bhp.com',
        sourceType: 'crawl4ai',
        endpoint: this.baseUrl,
        country: 'India',
        consented: true,
        status: 'active',
      })
      .returning();

    console.log('✅ Created Team-BHP partner source');
    return newSource;
  }
}

export const teamBhpScraper = new TeamBhpScraper();
