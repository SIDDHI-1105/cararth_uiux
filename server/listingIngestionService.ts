import { TrustLayer, TrustAnalysisResult } from './trustLayer';
import { MarketplaceListing } from './marketplaceAggregator';
import { storage } from './storage';

/**
 * CENTRALIZED LISTING INGESTION SERVICE
 * 
 * ALL scrapers MUST use this service to save listings.
 * This ensures EVERY listing goes through Trust Layer validation.
 * 
 * Architecture:
 * 1. Scraper extracts raw listing data
 * 2. Sends to ingestListing()
 * 3. Trust Layer validates and sets final verification status
 * 4. Only approved listings are saved to database
 * 5. Database gets proper verificationStatus from Trust Layer
 */
export class ListingIngestionService {
  private trustLayer: TrustLayer;
  
  constructor() {
    this.trustLayer = new TrustLayer();
  }

  /**
   * Ingest a listing with mandatory Trust Layer validation
   * 
   * @param listing - Raw listing from any scraper
   * @param source - Scraper source identifier
   * @returns Trust analysis result with save status
   */
  async ingestListing(
    listing: MarketplaceListing, 
    source: string
  ): Promise<{ 
    saved: boolean; 
    trustResult: TrustAnalysisResult; 
    reason: string 
  }> {
    try {
      console.log(`📥 Ingesting listing from ${source}: ${listing.title}`);
      
      // MANDATORY: Run through Trust Layer
      const trustResult = await this.trustLayer.screenListing(listing);
      
      // Prepare listing data with Trust Layer's final verification status
      const listingData = {
        id: listing.id,
        portal: listing.source || source,
        externalId: listing.id,
        url: listing.url,
        title: listing.title,
        brand: listing.brand,
        model: listing.model,
        year: listing.year,
        price: listing.price,
        mileage: listing.mileage,
        fuelType: listing.fuelType,
        transmission: listing.transmission,
        owners: (listing as any).owners || 1,
        location: listing.location,
        city: listing.city,
        state: (listing as any).state || '',
        description: listing.description,
        features: listing.features || [],
        images: listing.images || [],
        sellerType: listing.sellerType,
        condition: listing.condition,
        
        // CRITICAL: Use Trust Layer's final verification status
        verificationStatus: trustResult.finalVerificationStatus,
        
        // Quality metrics from Trust Layer
        qualityScore: trustResult.trustScore,
        imageAuthenticity: trustResult.imageAuthenticityScore || 0,
        hasRealImage: (trustResult.verifiedImageCount || 0) > 0,
        
        listingDate: listing.listingDate || new Date(),
        sourceMeta: {
          trustAnalysis: {
            approved: trustResult.isApproved,
            trustScore: trustResult.trustScore,
            issues: trustResult.issues,
            verifiedImages: trustResult.verifiedImageCount || 0
          }
        },
        hash: this.generateHash(listing),
        origin: 'scraped'
      };

      // Only save if Trust Layer approved
      if (trustResult.isApproved) {
        // Save to cached_portal_listings table (correct table for scraped listings)
        await (storage as any).createCachedPortalListing(listingData);
        console.log(`✅ Listing saved to cached_portal_listings table with status: ${trustResult.finalVerificationStatus}`);
        return { 
          saved: true, 
          trustResult, 
          reason: 'Approved by Trust Layer and saved to cached_portal_listings table' 
        };
      } else {
        // Listing rejected by Trust Layer - do NOT save
        console.log(`❌ Listing rejected: ${trustResult.explanation}`);
        console.log(`   Issues: ${trustResult.issues.join(', ')}`);
        return { 
          saved: false, 
          trustResult, 
          reason: trustResult.explanation 
        };
      }
      
    } catch (error) {
      console.error(`🚨 Ingestion failed for ${listing.title}:`, error);
      throw error;
    }
  }

  /**
   * Batch ingest multiple listings with concurrency control
   */
  async ingestBatch(
    listings: MarketplaceListing[], 
    source: string,
    concurrency: number = 3
  ): Promise<{
    totalProcessed: number;
    saved: number;
    rejected: number;
    results: any[];
  }> {
    console.log(`📦 Batch ingesting ${listings.length} listings from ${source}`);
    
    const results = [];
    let saved = 0;
    let rejected = 0;

    // Process in batches with concurrency control
    for (let i = 0; i < listings.length; i += concurrency) {
      const batch = listings.slice(i, i + concurrency);
      const batchResults = await Promise.allSettled(
        batch.map(listing => this.ingestListing(listing, source))
      );

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
          if (result.value.saved) {
            saved++;
          } else {
            rejected++;
          }
        } else {
          console.error('Batch processing error:', result.reason);
          rejected++;
        }
      }
    }

    console.log(`✅ Batch complete: ${saved} saved, ${rejected} rejected`);
    
    return {
      totalProcessed: listings.length,
      saved,
      rejected,
      results
    };
  }

  /**
   * Generate unique hash for deduplication
   */
  private generateHash(listing: MarketplaceListing): string {
    const key = `${listing.source}_${listing.url}_${listing.title}_${listing.price}`;
    return Buffer.from(key).toString('base64').substring(0, 32);
  }
}

// Export singleton instance
export const listingIngestionService = new ListingIngestionService();
