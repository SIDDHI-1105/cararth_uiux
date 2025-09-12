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
      const listings = await this.queryListings(filters);
      
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