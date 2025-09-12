import { sql, eq, gte, lte, desc, asc, and } from "drizzle-orm";
import { cachedPortalListings, type CachedPortalListing, type InsertCachedPortalListing } from "@shared/schema";
import type { DatabaseStorage, OptimizedSearchFilters } from "./dbStorage";
import type { MarketplaceListing, AggregatedSearchResult, EnhancedMarketplaceListing } from "./marketplaceAggregator";
import { createHash } from "crypto";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  cacheAge: number;
  source: 'L1' | 'L2' | 'live';
}

interface CacheMetadata {
  servedFrom: 'L1' | 'L2' | 'live';
  dataAgeMs: number;
  cacheHit: boolean;
  freshness: 'fresh' | 'warm' | 'stale';
}

export class CacheManager {
  // L1 Cache: In-memory for sub-second responses
  private l1Cache = new Map<string, CacheEntry<AggregatedSearchResult>>();
  private readonly L1_TTL = 2 * 60 * 1000; // 2 minutes
  private readonly L2_TTL = 24 * 60 * 60 * 1000; // 24 hours
  
  constructor(private storage: DatabaseStorage) {}

  /**
   * Generate stable cache key from search filters
   */
  private generateCacheKey(filters: OptimizedSearchFilters): string {
    // Normalize filters for consistent caching
    const normalized = {
      city: filters.city?.toLowerCase()?.trim(),
      brand: filters.brand?.toLowerCase()?.trim(),
      model: filters.model?.toLowerCase()?.trim(),
      priceMin: filters.priceMin,
      priceMax: filters.priceMax,
      yearMin: filters.yearMin,
      yearMax: filters.yearMax,
      fuelType: filters.fuelType?.map((f: string) => f.toLowerCase()).sort(),
      transmission: filters.transmission?.map((t: string) => t.toLowerCase()).sort(),
      sortBy: filters.sortBy || 'price',
      sortOrder: filters.sortOrder || 'asc'
    };
    
    const filterString = JSON.stringify(normalized, Object.keys(normalized).sort());
    const hash = createHash('sha256').update(filterString).digest('base64url').slice(0, 32);
    return `search:${hash}`;
  }

  /**
   * Get cached search results using stale-while-revalidate strategy
   */
  async getCachedSearch(filters: OptimizedSearchFilters): Promise<{ 
    result: AggregatedSearchResult | null, 
    metadata: CacheMetadata 
  }> {
    const cacheKey = this.generateCacheKey(filters);
    const now = Date.now();

    // L1 Cache check - fastest response
    const l1Entry = this.l1Cache.get(cacheKey);
    if (l1Entry && (now - l1Entry.timestamp) < this.L1_TTL) {
      console.log(`⚡ L1 Cache HIT for key: ${cacheKey}`);
      return {
        result: l1Entry.data,
        metadata: {
          servedFrom: 'L1',
          dataAgeMs: now - l1Entry.timestamp,
          cacheHit: true,
          freshness: this.getFreshness(now - l1Entry.timestamp)
        }
      };
    }

    // L2 Cache check - database lookup
    try {
      const cachedListings = await this.getL2CachedListings(filters);
      if (cachedListings.length > 0) {
        console.log(`💾 L2 Cache HIT: ${cachedListings.length} listings from database`);
        
        // Convert to search result format
        const result = this.convertToSearchResult(cachedListings, filters);
        
        // Update L1 cache
        this.l1Cache.set(cacheKey, {
          data: result,
          timestamp: now,
          cacheAge: now - new Date(cachedListings[0].fetchedAt).getTime(),
          source: 'L2'
        });

        return {
          result,
          metadata: {
            servedFrom: 'L2',
            dataAgeMs: now - new Date(cachedListings[0].fetchedAt).getTime(),
            cacheHit: true,
            freshness: this.getFreshness(now - new Date(cachedListings[0].fetchedAt).getTime())
          }
        };
      }
    } catch (error) {
      console.error('❌ L2 Cache error:', error);
    }

    // Cache MISS - no cached data available
    console.log(`💸 Cache MISS for key: ${cacheKey}`);
    return {
      result: null,
      metadata: {
        servedFrom: 'live',
        dataAgeMs: 0,
        cacheHit: false,
        freshness: 'fresh'
      }
    };
  }

  /**
   * Cache fresh search results in both L1 and L2
   */
  async cacheSearchResults(
    filters: OptimizedSearchFilters, 
    result: AggregatedSearchResult, 
    sourceListings: MarketplaceListing[]
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(filters);
    const now = Date.now();

    // Store in L1 cache
    this.l1Cache.set(cacheKey, {
      data: result,
      timestamp: now,
      cacheAge: 0,
      source: 'live'
    });

    // Store individual listings in L2 cache (database)
    try {
      await this.storeListingsInL2Cache(sourceListings);
      console.log(`💾 Cached ${sourceListings.length} listings in L2 database cache`);
    } catch (error) {
      console.error('❌ Failed to cache in L2:', error);
    }
  }

  /**
   * Get cached listings from database (L2)
   */
  private async getL2CachedListings(filters: OptimizedSearchFilters): Promise<CachedPortalListing[]> {
    const twentyFourHoursAgo = new Date(Date.now() - this.L2_TTL);
    
    // Build query with proper drizzle syntax
    const whereConditions = [gte(cachedPortalListings.listingDate, twentyFourHoursAgo)];
    
    if (filters.city) {
      whereConditions.push(sql`LOWER(${cachedPortalListings.city}) = ${filters.city.toLowerCase()}`);
    }
    if (filters.brand) {
      whereConditions.push(sql`LOWER(${cachedPortalListings.brand}) = ${filters.brand.toLowerCase()}`);
    }
    if (filters.model) {
      whereConditions.push(sql`LOWER(${cachedPortalListings.model}) = ${filters.model.toLowerCase()}`);
    }
    if (filters.priceMin) {
      whereConditions.push(gte(cachedPortalListings.price, filters.priceMin.toString()));
    }
    if (filters.priceMax) {
      whereConditions.push(lte(cachedPortalListings.price, filters.priceMax.toString()));
    }
    if (filters.yearMin) {
      whereConditions.push(gte(cachedPortalListings.year, filters.yearMin));
    }
    if (filters.yearMax) {
      whereConditions.push(lte(cachedPortalListings.year, filters.yearMax));
    }

    // Build the query
    let query = (this.storage as any).db
      .select()
      .from(cachedPortalListings)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .limit(filters.limit || 50);
    
    // Add sorting
    const sortField = filters.sortBy === 'year' ? cachedPortalListings.year : cachedPortalListings.price;
    query = query.orderBy(filters.sortOrder === 'desc' ? desc(sortField) : asc(sortField));

    return await query;
  }

  /**
   * Store marketplace listings in L2 database cache
   */
  private async storeListingsInL2Cache(listings: MarketplaceListing[]): Promise<void> {
    if (listings.length === 0) return;

    const cacheEntries: InsertCachedPortalListing[] = listings.map(listing => ({
      portal: listing.source,
      externalId: listing.id,
      url: listing.url,
      title: listing.title,
      brand: listing.brand,
      model: listing.model || 'Unknown',
      year: listing.year,
      price: listing.price.toString(),
      mileage: listing.mileage,
      fuelType: listing.fuelType,
      transmission: listing.transmission,
      owners: listing.owners || 1,
      location: listing.location,
      city: listing.city,
      state: listing.state,
      description: listing.description,
      features: listing.features || [],
      images: listing.images || [],
      sellerType: listing.sellerType,
      verificationStatus: listing.verificationStatus,
      condition: listing.condition,
      listingDate: new Date(listing.listingDate),
      sourceMeta: {
        originalData: {
          source: listing.source,
          fetchedAt: new Date().toISOString()
        }
      },
      hash: this.generateListingHash(listing)
    }));

    // Use upsert to handle duplicates
    for (const entry of cacheEntries) {
      try {
        await (this.storage as any).db
          .insert(cachedPortalListings)
          .values(entry)
          .onConflictDoUpdate({
            target: cachedPortalListings.hash,
            set: {
              price: entry.price,
              fetchedAt: sql`NOW()`,
              images: entry.images,
              sourceMeta: entry.sourceMeta,
              updatedAt: sql`NOW()`
            }
          });
      } catch (error) {
        // Skip duplicates silently
        console.log(`⚠️ Skipped duplicate listing: ${entry.externalId}`);
      }
    }
  }

  /**
   * Convert cached listings to search result format
   */
  private convertToSearchResult(
    cachedListings: CachedPortalListing[], 
    filters: OptimizedSearchFilters
  ): AggregatedSearchResult {
    const listings: MarketplaceListing[] = cachedListings.map(cached => ({
      id: cached.externalId,
      title: cached.title,
      brand: cached.brand,
      model: cached.model,
      year: cached.year,
      price: parseFloat(cached.price),
      mileage: cached.mileage || 0,
      fuelType: cached.fuelType || 'Petrol',
      transmission: cached.transmission || 'Manual',
      owners: cached.owners || 1,
      location: cached.location,
      city: cached.city,
      state: cached.state || 'Unknown',
      description: cached.description || '',
      features: Array.isArray(cached.features) ? cached.features as string[] : [],
      images: Array.isArray(cached.images) ? cached.images as string[] : [],
      source: cached.portal,
      url: cached.url,
      sellerType: cached.sellerType as any,
      verificationStatus: cached.verificationStatus as any,
      condition: cached.condition as any,
      listingDate: cached.listingDate.toISOString()
    }));

    return {
      listings,
      analytics: this.generateBasicAnalytics(listings),
      recommendations: this.generateBasicRecommendations(listings)
    };
  }

  /**
   * Generate unique hash for listing deduplication
   */
  private generateListingHash(listing: MarketplaceListing): string {
    const key = `${listing.source}:${listing.title}:${listing.price}:${listing.city}:${listing.year}`;
    return createHash('sha256').update(key).digest('hex').slice(0, 32);
  }

  /**
   * Determine data freshness based on age
   */
  private getFreshness(ageMs: number): 'fresh' | 'warm' | 'stale' {
    if (ageMs < 5 * 60 * 1000) return 'fresh'; // < 5 minutes
    if (ageMs < 60 * 60 * 1000) return 'warm'; // < 1 hour
    return 'stale'; // > 1 hour
  }

  /**
   * Generate basic analytics for cached results
   */
  private generateBasicAnalytics(listings: MarketplaceListing[]) {
    const prices = listings.map(l => l.price).filter(p => p > 0);
    return {
      totalListings: listings.length,
      averagePrice: prices.reduce((a, b) => a + b, 0) / prices.length || 0,
      priceRange: {
        min: Math.min(...prices) || 0,
        max: Math.max(...prices) || 0
      },
      topBrands: Object.entries(
        listings.reduce((acc, l) => {
          acc[l.brand] = (acc[l.brand] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).sort(([,a], [,b]) => (b as number) - (a as number)).slice(0, 5)
    };
  }

  /**
   * Generate basic recommendations for cached results
   */
  private generateBasicRecommendations(listings: MarketplaceListing[]) {
    return {
      message: `Found ${listings.length} vehicles from cached data`,
      bestValue: listings.sort((a, b) => a.price - b.price)[0] || null,
      quickSale: listings.filter(l => l.condition === 'excellent')[0] || null
    };
  }

  /**
   * Clean up expired cache entries
   */
  async cleanupExpiredCache(): Promise<void> {
    // Clean L1 cache
    const now = Date.now();
    Array.from(this.l1Cache.entries()).forEach(([key, entry]) => {
      if (now - entry.timestamp > this.L1_TTL) {
        this.l1Cache.delete(key);
      }
    });

    // Clean L2 cache
    try {
      const twentyFourHoursAgo = new Date(Date.now() - this.L2_TTL);
      await (this.storage as any).db
        .delete(cachedPortalListings)
        .where(sql`${cachedPortalListings.listingDate} < ${twentyFourHoursAgo}`);
      
      console.log('🧹 Cleaned up expired cache entries');
    } catch (error) {
      console.error('❌ Cache cleanup error:', error);
    }
  }
}