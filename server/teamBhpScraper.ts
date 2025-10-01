/**
 * Team-BHP Classifieds Scraper
 * Scrapes owner-run forum listings for quality used cars
 */

import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import type { DatabaseStorage } from './dbStorage';
import { cachedPortalListings } from '../shared/schema.js';

export class TeamBhpScraper {
  private baseUrl = 'https://classifieds.team-bhp.com';

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
      // Fetch the classifieds page
      const response = await fetch(this.baseUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) {
        result.errors.push(`Failed to fetch Team-BHP: ${response.status}`);
        return result;
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Extract listings from the page
      // Note: This is a simplified scraper - Team-BHP structure may vary
      const listings: any[] = [];
      
      // Look for car listings (adjust selectors based on actual page structure)
      $('.listing, .classified-item, article').each((i, elem) => {
        try {
          const $elem = $(elem);
          const title = $elem.find('h2, h3, .title, .listing-title').first().text().trim();
          const link = $elem.find('a').first().attr('href');
          const priceText = $elem.find('.price, .amount').first().text().trim();
          
          if (title && link) {
            listings.push({
              title,
              url: link.startsWith('http') ? link : `${this.baseUrl}${link}`,
              price: this.extractPrice(priceText),
              portal: 'Team-BHP Classifieds'
            });
          }
        } catch (err) {
          // Skip malformed listings
        }
      });

      result.scrapedCount = listings.length;
      console.log(`📊 Found ${listings.length} potential listings on Team-BHP`);

      // Insert unique listings into database
      for (const listing of listings) {
        try {
          // Check if listing already exists
          const existing = await db
            .select()
            .from(cachedPortalListings)
            .where((eb: any) => eb.eq('url', listing.url))
            .limit(1);

          if (existing.length === 0) {
            // Insert new listing
            await db.insert(cachedPortalListings).values({
              url: listing.url,
              title: listing.title,
              price: listing.price || null,
              portal: listing.portal,
              origin: 'scraped',
              quality: 'authentic',
              images: [],
              location: 'India'
            });
            result.newListings++;
          }
        } catch (err) {
          // Skip duplicate or invalid listings
        }
      }

      console.log(`✅ Team-BHP: ${result.newListings} new listings added`);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(errorMsg);
      console.error('❌ Team-BHP scraping error:', errorMsg);
    }

    return result;
  }

  private extractPrice(priceText: string): number | null {
    // Extract numeric price from text like "₹5,50,000" or "5.5L"
    const cleaned = priceText.replace(/[₹,\s]/g, '');
    const match = cleaned.match(/(\d+\.?\d*)\s*([LlKk])?/);
    
    if (match) {
      let price = parseFloat(match[1]);
      const unit = match[2]?.toLowerCase();
      
      if (unit === 'l') price *= 100000; // Lakhs
      if (unit === 'k') price *= 1000;   // Thousands
      
      return price;
    }
    
    return null;
  }
}

// Export singleton
export const teamBhpScraper = new TeamBhpScraper();
