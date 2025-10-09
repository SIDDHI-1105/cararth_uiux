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
          // Extract car details from title
          const carInfo = this.extractCarInfo(listing.title);
          if (!carInfo) {
            console.log(`⚠️ Skipping Team-BHP listing - could not parse: ${listing.title}`);
            continue;
          }

          // Generate external ID from URL
          const externalId = this.generateExternalId(listing.url);

          // Check if listing already exists
          const existing = await db
            .select()
            .from(cachedPortalListings)
            .where((eb: any) => eb.eq('externalId', externalId))
            .limit(1);

          if (existing.length === 0) {
            // Insert new listing with all required fields
            const hash = `teambhp-${externalId}`;
            
            await db.insert(cachedPortalListings).values({
              portal: listing.portal,
              externalId: externalId,
              url: listing.url,
              title: listing.title,
              brand: carInfo.brand,
              model: carInfo.model,
              year: carInfo.year,
              price: listing.price ? listing.price.toString() : '0',
              location: 'India',
              city: 'Mumbai',
              listingDate: new Date(),
              hash: hash,
            });
            result.newListings++;
          }
        } catch (err) {
          console.log(`⚠️ Team-BHP insert error: ${err}`);
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

  private extractCarInfo(title: string): { brand: string; model: string; year: number } | null {
    // Common patterns: "2015 Maruti Swift", "Honda City 2018", "Mercedes-Benz C200 - 2016"
    const yearMatch = title.match(/\b(19|20)\d{2}\b/);
    if (!yearMatch) return null;

    const year = parseInt(yearMatch[0]);
    if (year < 2000 || year > new Date().getFullYear()) return null;

    // Remove year from title to extract brand/model
    const withoutYear = title.replace(yearMatch[0], '').trim();
    
    // Common Indian car brands (including hyphenated ones)
    const brands = ['Mercedes-Benz', 'Maruti Suzuki', 'Maruti', 'Hyundai', 'Honda', 'Tata', 'Mahindra', 
                    'Toyota', 'Ford', 'Volkswagen', 'Skoda', 'Renault', 'Nissan', 'Chevrolet', 'Fiat', 
                    'BMW', 'Mercedes', 'Audi', 'MG', 'Kia', 'Jeep'];
    
    let brand = '';
    let model = '';

    for (const b of brands) {
      if (withoutYear.toLowerCase().includes(b.toLowerCase())) {
        brand = b;
        // Remove brand and extract model (strip punctuation first, then take first non-empty segment)
        const afterBrand = withoutYear.replace(new RegExp(b, 'i'), '').trim();
        const cleanedModel = afterBrand.replace(/^[-,\s]+/, '').trim(); // Remove leading punctuation/spaces
        const modelParts = cleanedModel.split(/[-,]/);
        model = modelParts.find(part => part.trim().length > 0)?.trim() || 'Unknown';
        break;
      }
    }

    if (!brand) {
      // Fallback: use first word as brand, rest as model
      const parts = withoutYear.trim().split(/\s+/);
      brand = parts[0] || 'Unknown';
      model = parts.slice(1).join(' ') || 'Unknown';
    }

    return { brand, model: model || 'Unknown', year };
  }

  private generateExternalId(url: string): string {
    // Extract unique identifier from URL or generate hash
    const urlParts = url.split('/');
    const lastPart = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];
    return `teambhp-${lastPart.replace(/[^a-zA-Z0-9]/g, '-')}`.substring(0, 255);
  }
}

// Export singleton
export const teamBhpScraper = new TeamBhpScraper();
