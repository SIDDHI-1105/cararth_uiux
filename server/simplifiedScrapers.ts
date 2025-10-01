/**
 * Simplified scrapers using Firecrawl for bot-protected sites
 * These scrapers extract basic listing information and insert into database
 */

import type { DatabaseStorage } from './dbStorage';
import { cachedPortalListings } from '../shared/schema.js';
import FirecrawlApp from '@mendable/firecrawl-js';

const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

interface ScraperResult {
  scrapedCount: number;
  newListings: number;
  errors: string[];
}

// Team-BHP Classifieds Scraper
export async function scrapeTeamBHP(db: DatabaseStorage['db']): Promise<ScraperResult> {
  console.log('🏎️ Scraping Team-BHP classifieds...');
  
  const result: ScraperResult = {
    scrapedCount: 0,
    newListings: 0,
    errors: []
  };

  try {
    // Use Firecrawl to scrape (bypasses bot detection)
    const scrapeResult = await firecrawl.scrapeUrl('https://classifieds.team-bhp.com', {
      formats: ['markdown', 'html']
    });

    if (!scrapeResult.success) {
      result.errors.push('Failed to scrape Team-BHP');
      return result;
    }

    // Parse markdown for listings
    const markdown = scrapeResult.markdown || '';
    const links = markdown.match(/\[.*?\]\((https?:\/\/[^\)]+)\)/g) || [];
    
    result.scrapedCount = links.length;
    
    // Insert sample listings (simplified for now)
    for (const link of links.slice(0, 5)) { // Limit to 5 for testing
      const urlMatch = link.match(/\((https?:\/\/[^\)]+)\)/);
      const titleMatch = link.match(/\[(.*?)\]/);
      
      if (urlMatch && titleMatch) {
        const url = urlMatch[1];
        const title = titleMatch[1];
        
        try {
          const existing = await db
            .select()
            .from(cachedPortalListings)
            .where((eb: any) => eb.eq('url', url))
            .limit(1);

          if (existing.length === 0) {
            await db.insert(cachedPortalListings).values({
              url,
              title: title || 'Team-BHP Listing',
              portal: 'Team-BHP Classifieds',
              origin: 'scraped',
              quality: 'authentic',
              images: [],
              location: 'India'
            });
            result.newListings++;
          }
        } catch (err) {
          // Skip duplicates
        }
      }
    }

    console.log(`✅ Team-BHP: ${result.newListings} new listings`);
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    console.error('❌ Team-BHP error:', error);
  }

  return result;
}

// TheAutomotiveIndia Marketplace Scraper
export async function scrapeAutomotiveIndia(db: DatabaseStorage['db']): Promise<ScraperResult> {
  console.log('🚗 Scraping TheAutomotiveIndia marketplace...');
  
  const result: ScraperResult = {
    scrapedCount: 0,
    newListings: 0,
    errors: []
  };

  try {
    const scrapeResult = await firecrawl.scrapeUrl('https://www.theautomotiveindia.com/marketplace', {
      formats: ['markdown']
    });

    if (!scrapeResult.success) {
      result.errors.push('Failed to scrape TheAutomotiveIndia');
      return result;
    }

    const markdown = scrapeResult.markdown || '';
    const links = markdown.match(/\[.*?\]\((https?:\/\/[^\)]+marketplace[^\)]*)\)/g) || [];
    
    result.scrapedCount = links.length;
    
    for (const link of links.slice(0, 5)) {
      const urlMatch = link.match(/\((https?:\/\/[^\)]+)\)/);
      const titleMatch = link.match(/\[(.*?)\]/);
      
      if (urlMatch && titleMatch) {
        const url = urlMatch[1];
        const title = titleMatch[1];
        
        try {
          const existing = await db
            .select()
            .from(cachedPortalListings)
            .where((eb: any) => eb.eq('url', url))
            .limit(1);

          if (existing.length === 0) {
            await db.insert(cachedPortalListings).values({
              url,
              title: title || 'TheAutomotiveIndia Listing',
              portal: 'TheAutomotiveIndia',
              origin: 'scraped',
              quality: 'authentic',
              images: [],
              location: 'India'
            });
            result.newListings++;
          }
        } catch (err) {
          // Skip duplicates
        }
      }
    }

    console.log(`✅ TheAutomotiveIndia: ${result.newListings} new listings`);
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    console.error('❌ TheAutomotiveIndia error:', error);
  }

  return result;
}

// Quikr Cars Scraper
export async function scrapeQuikr(db: DatabaseStorage['db']): Promise<ScraperResult> {
  console.log('🚙 Scraping Quikr Cars...');
  
  const result: ScraperResult = {
    scrapedCount: 0,
    newListings: 0,
    errors: []
  };

  try {
    const scrapeResult = await firecrawl.scrapeUrl('https://www.quikr.com/cars', {
      formats: ['markdown']
    });

    if (!scrapeResult.success) {
      result.errors.push('Failed to scrape Quikr');
      return result;
    }

    const markdown = scrapeResult.markdown || '';
    const links = markdown.match(/\[.*?\]\((https?:\/\/[^\)]*quikr[^\)]*cars[^\)]*)\)/g) || [];
    
    result.scrapedCount = links.length;
    
    for (const link of links.slice(0, 5)) {
      const urlMatch = link.match(/\((https?:\/\/[^\)]+)\)/);
      const titleMatch = link.match(/\[(.*?)\]/);
      
      if (urlMatch && titleMatch) {
        const url = urlMatch[1];
        const title = titleMatch[1];
        
        try {
          const existing = await db
            .select()
            .from(cachedPortalListings)
            .where((eb: any) => eb.eq('url', url))
            .limit(1);

          if (existing.length === 0) {
            await db.insert(cachedPortalListings).values({
              url,
              title: title || 'Quikr Cars Listing',
              portal: 'Quikr',
              origin: 'scraped',
              quality: 'authentic',
              images: [],
              location: 'India'
            });
            result.newListings++;
          }
        } catch (err) {
          // Skip duplicates
        }
      }
    }

    console.log(`✅ Quikr: ${result.newListings} new listings`);
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    console.error('❌ Quikr error:', error);
  }

  return result;
}

// Reddit r/CarsIndia Scraper
export async function scrapeReddit(db: DatabaseStorage['db']): Promise<ScraperResult> {
  console.log('🤖 Scraping Reddit r/CarsIndia...');
  
  const result: ScraperResult = {
    scrapedCount: 0,
    newListings: 0,
    errors: []
  };

  try {
    const scrapeResult = await firecrawl.scrapeUrl(
      'https://www.reddit.com/r/CarsIndia/search/?q=flair%3A%22Buying%2FSelling%22',
      { formats: ['markdown'] }
    );

    if (!scrapeResult.success) {
      result.errors.push('Failed to scrape Reddit');
      return result;
    }

    const markdown = scrapeResult.markdown || '';
    const links = markdown.match(/\[.*?\]\((https?:\/\/[^\)]*reddit[^\)]*)\)/g) || [];
    
    result.scrapedCount = links.length;
    
    for (const link of links.slice(0, 5)) {
      const urlMatch = link.match(/\((https?:\/\/[^\)]+)\)/);
      const titleMatch = link.match(/\[(.*?)\]/);
      
      if (urlMatch && titleMatch) {
        const url = urlMatch[1];
        const title = titleMatch[1];
        
        try {
          const existing = await db
            .select()
            .from(cachedPortalListings)
            .where((eb: any) => eb.eq('url', url))
            .limit(1);

          if (existing.length === 0) {
            await db.insert(cachedPortalListings).values({
              url,
              title: title || 'Reddit r/CarsIndia Post',
              portal: 'Reddit',
              origin: 'scraped',
              quality: 'authentic',
              images: [],
              location: 'India'
            });
            result.newListings++;
          }
        } catch (err) {
          // Skip duplicates
        }
      }
    }

    console.log(`✅ Reddit: ${result.newListings} new listings`);
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    console.error('❌ Reddit error:', error);
  }

  return result;
}

// Run all scrapers
export async function runAllScrapers(db: DatabaseStorage['db']): Promise<{
  total: ScraperResult;
  individual: Record<string, ScraperResult>;
}> {
  console.log('\n🚀 Running all community scrapers...\n');
  
  const results = {
    'team-bhp': await scrapeTeamBHP(db),
    'automotive-india': await scrapeAutomotiveIndia(db),
    'quikr': await scrapeQuikr(db),
    'reddit': await scrapeReddit(db)
  };

  const total: ScraperResult = {
    scrapedCount: Object.values(results).reduce((sum, r) => sum + r.scrapedCount, 0),
    newListings: Object.values(results).reduce((sum, r) => sum + r.newListings, 0),
    errors: Object.values(results).flatMap(r => r.errors)
  };

  console.log(`\n📊 TOTAL: ${total.newListings} new listings from ${total.scrapedCount} scraped\n`);

  return { total, individual: results };
}
