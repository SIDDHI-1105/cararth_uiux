/**
 * Fast Search Service for CarArth
 * 
 * This service provides lightning-fast search results by querying
 * the normalized car_listings database directly, eliminating the need
 * for external API calls during search.
 * 
 * Benefits:
 * - Sub-100ms search responses
 * - Cross-filtering support (any filter combination works)
 * - No external API dependency during search
 * - Consistent performance regardless of external service status
 */

import { storage } from './storage.js';
import type { CachedPortalListing } from '@shared/schema.js';
import { sql, and, or, gte, lte, like, desc, asc } from 'drizzle-orm';
import { calculateTrustScore } from './trustScoring.js';

export interface SearchFilters {
  // Core filters
  make?: string;
  model?: string;
  city?: string;
  fuelType?: string;
  transmission?: string;
  
  // Price filters
  priceMin?: number;
  priceMax?: number;
  
  // Year filters
  yearMin?: number;
  yearMax?: number;
  
  // Other filters
  ownerCount?: number;
  mileageMax?: number;
  
  // Age filter (listings within X days)
  listedWithinDays?: number;
  
  // Search query
  query?: string;
  
  // Sorting and pagination
  sortBy?: 'price' | 'year' | 'mileage' | 'date';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  listings: CachedPortalListing[];
  total: number;
  filters: {
    availableMakes: string[];
    availableModels: string[];
    availableCities: string[];
    priceRange: { min: number; max: number };
    yearRange: { min: number; max: number };
  };
  performance: {
    queryTime: number;
    source: 'database';
  };
}

export class FastSearchService {
  /**
   * Main search method - queries database directly for instant results
   */
  async search(filters: SearchFilters): Promise<SearchResult> {
    const startTime = Date.now();
    
    try {
      console.log('⚡ Fast database search with filters:', filters);
      
      // Get search results from database
      let listings = await this.queryListings(filters);
      
      // FILTER OUT POOR QUALITY LISTINGS
      listings = listings.filter(listing => {
        // Remove listings with "Unknown" model
        if (listing.model?.toLowerCase().includes('unknown')) return false;
        
        // Remove spam/promotional titles
        if (listing.title?.toLowerCase().includes('finalise the loan') || 
            listing.title?.toLowerCase().includes('it only takes')) return false;
        
        // Remove listings with invalid cities
        if (listing.city?.toLowerCase().includes('please select') || 
            listing.city?.toLowerCase().includes('to get the desired')) return false;
        
        // Keep valid listings
        return true;
      });
      
      console.log(`🧹 Filtered to ${listings.length} quality listings (removed spam/unknowns)`);
      
      // DEDUPLICATE LISTINGS - Use URL+portal as unique identifier
      const deduplicatedMap = new Map<string, typeof listings[0]>();
      
      listings.forEach(listing => {
        // Create unique key from URL + portal (most reliable identifier)
        const uniqueKey = listing.url 
          ? `${listing.portal}-${listing.url}` 
          : `${listing.portal}-${listing.id || Math.random()}`;
        
        const existing = deduplicatedMap.get(uniqueKey);
        if (!existing) {
          deduplicatedMap.set(uniqueKey, listing);
        } else {
          // Keep the listing with higher quality score OR verified status
          const listingScore = (listing.qualityScore || 0) + 
            (listing.verificationStatus === 'verified' ? 10 : 0);
          const existingScore = (existing.qualityScore || 0) + 
            (existing.verificationStatus === 'verified' ? 10 : 0);
          
          if (listingScore > existingScore) {
            deduplicatedMap.set(uniqueKey, listing);
          }
        }
      });
      
      listings = Array.from(deduplicatedMap.values());
      console.log(`🎯 Deduplicated to ${listings.length} unique listings (removed exact duplicates)`);
      
      // CALCULATE TRUST SCORES for each listing
      listings = listings.map(listing => {
        const trustScore = calculateTrustScore(listing);
        return {
          ...listing,
          // Add computed trust score fields
          trustScore: trustScore.overall,
          trustScoreLabel: trustScore.label,
          trustScoreColor: trustScore.color,
          trustScoreBreakdown: trustScore.breakdown,
        };
      });
      console.log(`✨ Calculated trust scores for ${listings.length} listings`);
      
      // CRITICAL: SORT BY TRUST SCORE AND IMAGE QUALITY
      // Listings WITHOUT verified images must be pushed to the bottom
      listings.sort((a, b) => {
        // First priority: Listings with real/verified images go first
        const aHasImages = (a.images && a.images.length > 0 && !a.images[0]?.includes('spacer')) || a.hasRealImage;
        const bHasImages = (b.images && b.images.length > 0 && !b.images[0]?.includes('spacer')) || b.hasRealImage;
        
        if (aHasImages && !bHasImages) return -1;
        if (!aHasImages && bHasImages) return 1;
        
        // Second priority: Sort by trust score (higher is better) - NO tolerance
        const trustDiff = (b.trustScore || 0) - (a.trustScore || 0);
        if (trustDiff !== 0) return trustDiff;
        
        // Third priority: Image authenticity score
        const authDiff = (b.imageAuthenticity || 0) - (a.imageAuthenticity || 0);
        if (authDiff !== 0) return authDiff;
        
        // Fourth priority: Quality score
        return (b.qualityScore || 0) - (a.qualityScore || 0);
      });
      console.log(`📊 Sorted ${listings.length} listings by trust score and image quality (verified images first)`);
      
      // Get total count for pagination
      const total = await this.getSearchCount(filters);
      
      // Get filter options for frontend
      const filterOptions = await this.getFilterOptions(filters);
      
      const queryTime = Date.now() - startTime;
      console.log(`✅ Database search completed in ${queryTime}ms - found ${listings.length}/${total} listings`);
      
      return {
        listings,
        total,
        filters: filterOptions,
        performance: {
          queryTime,
          source: 'database',
        },
      };
      
    } catch (error) {
      console.error('❌ Fast search failed:', error);
      throw new Error('Search temporarily unavailable');
    }
  }

  /**
   * Query listings from database with filters
   */
  private async queryListings(filters: SearchFilters): Promise<CachedPortalListing[]> {
    if ('searchCachedPortalListings' in storage) {
      // Use database storage search method
      return await (storage as any).searchCachedPortalListings(filters);
    } else {
      console.warn('⚠️ Database search not available, falling back to empty results');
      return [];
    }
  }

  /**
   * Get total count of matching listings for pagination
   */
  private async getSearchCount(filters: SearchFilters): Promise<number> {
    if ('getCachedPortalListingsCount' in storage) {
      return await (storage as any).getCachedPortalListingsCount(filters);
    } else {
      return 0;
    }
  }

  /**
   * Get available filter options for frontend dropdowns
   */
  private async getFilterOptions(baseFilters: SearchFilters): Promise<SearchResult['filters']> {
    try {
      if ('getCachedPortalListingsFilterOptions' in storage) {
        return await (storage as any).getCachedPortalListingsFilterOptions(baseFilters);
      } else {
        // Fallback empty options
        return {
          availableMakes: [],
          availableModels: [],
          availableCities: [],
          priceRange: { min: 0, max: 0 },
          yearRange: { min: 2000, max: new Date().getFullYear() },
        };
      }
    } catch (error) {
      console.error('❌ Failed to get filter options:', error);
      return {
        availableMakes: [],
        availableModels: [],
        availableCities: [],
        priceRange: { min: 0, max: 0 },
        yearRange: { min: 2000, max: new Date().getFullYear() },
      };
    }
  }

  /**
   * Get popular searches for homepage
   */
  async getPopularSearches(limit: number = 10): Promise<CachedPortalListing[]> {
    const filters: SearchFilters = {
      sortBy: 'date',
      sortOrder: 'desc',
      limit,
    };
    
    return await this.queryListings(filters);
  }

  /**
   * Get listings by city for location-based searches
   */
  async getListingsByCity(city: string, limit: number = 20): Promise<CachedPortalListing[]> {
    const filters: SearchFilters = {
      city: city.toLowerCase(),
      sortBy: 'date',
      sortOrder: 'desc',
      limit,
    };
    
    return await this.queryListings(filters);
  }

  /**
   * Get listings by make/brand
   */
  async getListingsByMake(make: string, limit: number = 20): Promise<CachedPortalListing[]> {
    const filters: SearchFilters = {
      make: make.toLowerCase(),
      sortBy: 'price',
      sortOrder: 'asc',
      limit,
    };
    
    return await this.queryListings(filters);
  }

  /**
   * Get search statistics
   */
  async getSearchStats(): Promise<{
    totalListings: number;
    citiesCount: number;
    makesCount: number;
    latestUpdate: string | null;
  }> {
    if ('getCachedPortalListingsStats' in storage) {
      return await (storage as any).getCachedPortalListingsStats();
    } else {
      return {
        totalListings: 0,
        citiesCount: 0,
        makesCount: 0,
        latestUpdate: null,
      };
    }
  }
}

// Global instance
export const fastSearchService = new FastSearchService();