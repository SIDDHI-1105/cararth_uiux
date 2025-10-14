/**
 * Batch Ingestion Service for CarArth
 * 
 * This service runs scheduled jobs to:
 * 1. Scrape all car portals (CarDekho, OLX, Cars24, etc.)
 * 2. Normalize and store listings in database
 * 3. Provide fast search by querying database directly
 * 
 * Benefits:
 * - Sub-second search results (no external API dependency)
 * - Handles API failures gracefully during ingestion
 * - Eliminates complex caching logic
 */

import { MarketplaceAggregator } from './marketplaceAggregator.js';
import { storage } from './storage.js';
import type { InsertCachedPortalListing } from '@shared/schema.js';
import crypto from 'crypto';
import { enrichmentService } from './enrichmentService.js';
import carSpecValidator from './carSpecValidator.js';
import { marutiTrueValueScraper } from './marutiTrueValueScraper.js';
import { hyundaiPromiseScraper } from './hyundaiPromiseScraper.js';
import { mahindraFirstChoiceScraper } from './mahindraFirstChoiceScraper.js';

export class BatchIngestionService {
  private marketplaceAggregator: MarketplaceAggregator;
  private isIngesting = false;

  constructor() {
    this.marketplaceAggregator = new MarketplaceAggregator(storage as any);
  }

  /**
   * Main ingestion job - scrapes all portals and stores normalized data
   */
  async runIngestion(cities: string[] = ['hyderabad', 'bangalore', 'mumbai', 'delhi']): Promise<void> {
    if (this.isIngesting) {
      console.log('⏳ Ingestion already in progress, skipping');
      return;
    }

    this.isIngesting = true;
    const startTime = Date.now();
    console.log('🚀 Starting batch ingestion for cities:', cities);

    try {
      let totalListings = 0;

      for (const city of cities) {
        console.log(`\n🏙️ Ingesting listings for ${city}...`);
        
        // Run search to get fresh listings from all portals
        const searchFilters = {
          city: city.toLowerCase(),
          limit: 100, // Get more listings during batch ingestion
        };

        const result = await this.marketplaceAggregator.searchAcrossPortals(searchFilters);
        
        // 🏭 INTEGRATE MARUTI TRUE VALUE SCRAPER into batch ingestion
        let marutiListings: any[] = [];
        try {
          console.log(`🏭 Scraping Maruti True Value certified listings for ${city}...`);
          const marutiResult = await marutiTrueValueScraper.scrapeListings({ 
            city: city.charAt(0).toUpperCase() + city.slice(1), // Capitalize city name
            maxPages: 10 // Increased to get more listings
          });
          
          if (marutiResult.listings && marutiResult.listings.length > 0) {
            marutiListings = marutiResult.listings;
            console.log(`✅ Found ${marutiListings.length} Maruti True Value certified listings`);
          }
        } catch (error) {
          console.error(`❌ Maruti True Value scraping failed for ${city}:`, error);
        }

        // 🚗 INTEGRATE HYUNDAI H-PROMISE SCRAPER into batch ingestion
        let hyundaiListings: any[] = [];
        try {
          console.log(`🚗 Scraping Hyundai H-Promise certified listings for ${city}...`);
          const hyundaiResult = await hyundaiPromiseScraper.scrapeListings({ 
            city: city.charAt(0).toUpperCase() + city.slice(1), // Capitalize city name
            maxPages: 25, // Increased from 15 to get more listings
            dealerSite: 'Advaith' // Start with Advaith Hyundai
          });
          
          if (hyundaiResult.listings && hyundaiResult.listings.length > 0) {
            hyundaiListings = hyundaiResult.listings;
            console.log(`✅ Found ${hyundaiListings.length} Hyundai H-Promise certified listings`);
          }
        } catch (error) {
          console.error(`❌ Hyundai H-Promise scraping failed for ${city}:`, error);
        }

        // 🚘 INTEGRATE MAHINDRA FIRST CHOICE SCRAPER into batch ingestion
        let mahindraListings: any[] = [];
        try {
          console.log(`🚘 Scraping Mahindra First Choice certified listings for ${city}...`);
          const mahindraResult = await mahindraFirstChoiceScraper.scrapeListings({ 
            city: city.charAt(0).toUpperCase() + city.slice(1), // Capitalize city name
            maxPages: 10 // Increased to get more listings
          });
          
          if (mahindraResult.listings && mahindraResult.listings.length > 0) {
            mahindraListings = mahindraResult.listings;
            console.log(`✅ Found ${mahindraListings.length} Mahindra First Choice certified listings`);
          }
        } catch (error) {
          console.error(`❌ Mahindra First Choice scraping failed for ${city}:`, error);
        }
        
        // Combine marketplace, Maruti True Value, Hyundai H-Promise, and Mahindra First Choice listings
        const allListings = [...(result.listings || []), ...marutiListings, ...hyundaiListings, ...mahindraListings];
        
        if (allListings.length > 0) {
          // Normalize and store listings (including Maruti True Value)
          const normalizedListings = this.normalizeListings(allListings, []);
          
          // Optional GPT-5 enrichment if OpenAI API key is available
          if (process.env.OPENAI_API_KEY && normalizedListings.length > 0) {
            console.log(`🧠 GPT-5 enriching ${normalizedListings.length} listings...`);
            const enrichments = await enrichmentService.enrichListings(normalizedListings);
            
            // Apply enrichments to listings
            for (const listing of normalizedListings) {
              const enrichment = enrichments.get(listing.externalId);
              if (enrichment) {
                listing.description = enrichment.summary;
                listing.sourceMeta = {
                  ...(typeof listing.sourceMeta === 'object' && listing.sourceMeta !== null ? listing.sourceMeta : {}),
                  aiEnrichment: enrichment
                };
              }
            }
            console.log(`✅ Applied GPT-5 enrichment to ${enrichments.size} listings`);
          }

          for (const listing of normalizedListings) {
            try {
              await this.storeListing(listing);
              totalListings++;
            } catch (error) {
              console.error('❌ Failed to store listing:', listing.externalId, error);
            }
          }

          console.log(`✅ Stored ${normalizedListings.length} listings for ${city}`);
        } else {
          console.log(`⚠️ No listings found for ${city}`);
        }

        // Small delay between cities to be respectful to APIs
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      const duration = Date.now() - startTime;
      console.log(`\n🎯 Batch ingestion completed: ${totalListings} listings in ${duration}ms`);

    } catch (error) {
      console.error('❌ Batch ingestion failed:', error);
    } finally {
      this.isIngesting = false;
    }
  }

  /**
   * Normalize raw listings from marketplace aggregator to database format
   */
  private normalizeListings(listings: any[], sourceListings: any[]): InsertCachedPortalListing[] {
    const normalized: InsertCachedPortalListing[] = [];

    for (const listing of listings) {
      try {
        // Extract price as number (remove currency symbols, commas)
        const priceStr = String(listing.price || '0').replace(/[₹,\s]/g, '');
        const price = parseFloat(priceStr) || 0;

        // Extract year as number
        const year = parseInt(String(listing.year || new Date().getFullYear())) || new Date().getFullYear();

        // Generate unique hash for deduplication
        const hash = crypto
          .createHash('md5')
          .update(`${listing.source}-${listing.id}-${listing.title}-${price}`)
          .digest('hex');

        // Validate car specifications and compute quality scores
        const validation = carSpecValidator.validateListing({
          brand: listing.brand,
          model: listing.model,
          fuelType: listing.fuelType || listing.fuel,
          transmission: listing.transmission,
          year: year,
          price: price,
          mileage: parseInt(String(listing.mileage || '0')) || undefined
        });
        
        const qualityScore = carSpecValidator.calculateQualityScore(listing, listing.source || 'unknown');
        const hasRealImage = carSpecValidator.hasAuthenticImages(listing);

        const normalizedListing: InsertCachedPortalListing = {
          portal: listing.source || 'unknown',
          externalId: listing.id || `${listing.source}-${Date.now()}`,
          url: listing.url || '',
          
          // Car details
          title: listing.title || `${listing.brand} ${listing.model}`,
          brand: listing.brand || 'Unknown',
          model: listing.model || 'Unknown',
          year: year,
          price: price.toString(),
          mileage: parseInt(String(listing.mileage || '0')) || undefined,
          fuelType: listing.fuelType || listing.fuel || null,
          transmission: listing.transmission || null,
          owners: parseInt(String(listing.owners || '1')) || 1,
          
          // Location
          location: listing.location || listing.city || 'Unknown',
          city: listing.city || 'Unknown',
          state: listing.state || null,
          
          // Additional data
          description: listing.description || listing.summary || null,
          features: listing.features || [],
          images: listing.images || [],
          sellerType: listing.sellerType || 'individual',
          verificationStatus: listing.verified ? 'verified' : 'unverified',
          condition: listing.condition || null,
          
          // Quality scoring
          qualityScore: qualityScore,
          sourceWeight: (
            {
              'CarDekho': 100,
              'CarWale': 90,
              'Spinny': 85,
              'Cars24': 65,
              'OLX': 50,
              'Facebook Marketplace': 30
            } as Record<string, number>
          )[listing.source] || 20,
          hasRealImage: hasRealImage,
          specValid: validation.isValid,
          imageAuthenticity: hasRealImage ? (listing.source === 'CarDekho' ? 90 : 60) : 0,
          
          // Cache metadata
          listingDate: new Date(listing.listedDate || Date.now()),
          sourceMeta: {
            originalListing: listing,
            ingestionTime: new Date().toISOString(),
            validationIssues: validation.issues,
          },
          hash: hash,
        };

        // Skip invalid listings that fail critical validation
        if (!validation.isValid && validation.issues.some(issue => issue.includes('never came with'))) {
          console.log(`❌ Skipping invalid listing: ${listing.title} - ${validation.issues.join(', ')}`);
          continue;
        }

        normalized.push(normalizedListing);

      } catch (error) {
        console.error('❌ Failed to normalize listing:', listing.id, error);
      }
    }

    return normalized;
  }

  /**
   * Store normalized listing in MAIN cars table (not cache)
   */
  private async storeListing(listing: InsertCachedPortalListing): Promise<void> {
    try {
      // Convert cached listing to car format and save to main cars table
      const carListing = {
        ...listing,
        id: listing.externalId || crypto.randomUUID(),
        // Ensure all required fields are present
        sellerId: 'system-ingestion', // Temporary seller for batch ingestion
        origin: 'scraped' as const
      };
      
      await storage.createCar(carListing as any);
      console.log(`✅ Saved to cars table: ${listing.title}`);
    } catch (error) {
      console.error(`❌ Failed to save listing to cars table: ${listing.title}`, error);
      throw error;
    }
  }

  /**
   * Clean up old listings (older than 7 days)
   */
  async cleanupOldListings(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);
    
    console.log('🧹 Cleaning up listings older than', cutoffDate.toISOString());
    
    if ('cleanupOldCachedListings' in storage) {
      await (storage as any).cleanupOldCachedListings(cutoffDate);
      console.log('✅ Cleanup completed');
    } else {
      console.warn('⚠️ Cleanup method not available');
    }
  }

  /**
   * Get ingestion status
   */
  getStatus(): { isIngesting: boolean } {
    return { isIngesting: this.isIngesting };
  }
}

// Global instance
export const batchIngestionService = new BatchIngestionService();