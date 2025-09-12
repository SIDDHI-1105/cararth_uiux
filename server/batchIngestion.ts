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

export class BatchIngestionService {
  private marketplaceAggregator: MarketplaceAggregator;
  private isIngesting = false;

  constructor() {
    this.marketplaceAggregator = new MarketplaceAggregator();
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
        
        if (result.listings && result.listings.length > 0) {
          // Normalize and store listings
          const normalizedListings = this.normalizeListings(result.listings, []);
          
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
                  ...listing.sourceMeta,
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
          mileage: parseInt(String(listing.mileage || '0')) || null,
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
          
          // Cache metadata
          listingDate: new Date(listing.listedDate || Date.now()),
          sourceMeta: {
            originalListing: listing,
            ingestionTime: new Date().toISOString(),
          },
          hash: hash,
        };

        normalized.push(normalizedListing);

      } catch (error) {
        console.error('❌ Failed to normalize listing:', listing.id, error);
      }
    }

    return normalized;
  }

  /**
   * Store normalized listing in database (upsert based on hash)
   */
  private async storeListing(listing: InsertCachedPortalListing): Promise<void> {
    if ('createCachedPortalListing' in storage) {
      // Use database storage method if available
      await (storage as any).createCachedPortalListing(listing);
    } else {
      console.warn('⚠️ Database storage not available for batch ingestion');
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