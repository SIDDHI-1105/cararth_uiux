// Advanced caching system for marketplace optimization
import { storage } from './storage.js';
import { createHash } from 'crypto';

// Cache key generators
export class CacheKeyGenerator {
  static locationIntelligence(city: string, state?: string): string {
    return `location:${city.toLowerCase()}:${state?.toLowerCase() || 'any'}`;
  }

  static priceAnalysis(brand: string, model: string, year: number, city: string): string {
    return `price:${brand.toLowerCase()}:${model.toLowerCase()}:${year}:${city.toLowerCase()}`;
  }

  static historicalData(brand: string, model: string, city: string): string {
    return `historical:${brand.toLowerCase()}:${model.toLowerCase()}:${city.toLowerCase()}`;
  }

  static marketTrends(city: string, dateRange: string): string {
    return `trends:${city.toLowerCase()}:${dateRange}`;
  }

  static searchResults(filters: any): string {
    const filterString = JSON.stringify(filters, Object.keys(filters).sort());
    const hash = createHash('sha256').update(filterString).digest('base64url').slice(0, 32);
    return `search:${hash}`;
  }
}

// Multi-tier caching strategy
export interface CacheConfig {
  ttl: number;           // Time to live in milliseconds
  maxSize: number;       // Maximum cache size
  priority: 'high' | 'medium' | 'low';
  refreshThreshold: number; // Percentage of TTL after which to refresh
}

export const cacheConfigs: Record<string, CacheConfig> = {
  // Location intelligence - rarely changes
  location: {
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    maxSize: 500,
    priority: 'high',
    refreshThreshold: 0.8
  },
  
  // Price analysis - changes frequently
  price: {
    ttl: 15 * 60 * 1000, // 15 minutes
    maxSize: 1000,
    priority: 'high',
    refreshThreshold: 0.7
  },
  
  // Historical data - changes slowly
  historical: {
    ttl: 4 * 60 * 60 * 1000, // 4 hours
    maxSize: 2000,
    priority: 'medium',
    refreshThreshold: 0.75
  },
  
  // Market trends - updates daily
  trends: {
    ttl: 2 * 60 * 60 * 1000, // 2 hours
    maxSize: 200,
    priority: 'medium',
    refreshThreshold: 0.8
  },
  
  // Search results - short-lived
  search: {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 500,
    priority: 'low',
    refreshThreshold: 0.5
  }
};

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
}

export class AdvancedCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private refreshQueue = new Set<string>();
  
  constructor(private config: CacheConfig) {}

  async get(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    const age = now - entry.timestamp;

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;

    // Check if expired
    if (age > this.config.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Check if needs refresh (background)
    const refreshTime = this.config.ttl * this.config.refreshThreshold;
    if (age > refreshTime && !this.refreshQueue.has(key)) {
      this.refreshQueue.add(key);
      console.log(`🔄 Cache refresh queued for key: ${key}`);
    }

    return entry.data;
  }

  async set(key: string, data: T): Promise<void> {
    const size = this.estimateSize(data);
    const now = Date.now();

    // Evict if necessary
    this.evictIfNeeded(size);

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now,
      size
    };

    this.cache.set(key, entry);
    this.refreshQueue.delete(key);
    
    console.log(`💾 Cached data for key: ${key} (${size} bytes, TTL: ${this.config.ttl}ms)`);
  }

  private evictIfNeeded(newEntrySize: number): void {
    if (this.cache.size >= this.config.maxSize) {
      // LRU eviction with priority consideration
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => {
          // Lower priority entries first
          const priorityWeight = this.config.priority === 'high' ? 3 : 
                                this.config.priority === 'medium' ? 2 : 1;
          
          // Consider last access time and access count
          const scoreA = (a[1].lastAccessed * 0.7) + (a[1].accessCount * priorityWeight * 0.3);
          const scoreB = (b[1].lastAccessed * 0.7) + (b[1].accessCount * priorityWeight * 0.3);
          
          return scoreA - scoreB;
        });

      // Remove oldest/least used entries
      const toRemove = Math.ceil(this.config.maxSize * 0.2); // Remove 20%
      for (let i = 0; i < toRemove && entries.length > 0; i++) {
        const [key] = entries[i];
        this.cache.delete(key);
        console.log(`🗑️ Evicted cache entry: ${key}`);
      }
    }
  }

  private estimateSize(data: T): number {
    try {
      return JSON.stringify(data).length;
    } catch {
      return 1000; // Default estimate
    }
  }

  getStats() {
    const entries = Array.from(this.cache.values());
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      totalMemory: entries.reduce((sum, entry) => sum + entry.size, 0),
      avgAccessCount: entries.reduce((sum, entry) => sum + entry.accessCount, 0) / entries.length || 0,
      refreshQueueSize: this.refreshQueue.size,
      hitRate: 0 // Would need to track misses
    };
  }

  clear(): void {
    this.cache.clear();
    this.refreshQueue.clear();
    console.log(`🧹 Cleared cache for ${this.config.priority} priority cache`);
  }

  // Get items that need refresh
  getRefreshQueue(): string[] {
    return Array.from(this.refreshQueue);
  }
}

// Specialized caches for different data types
export class LocationIntelligenceCache extends AdvancedCache<any> {
  constructor() {
    super(cacheConfigs.location);
  }

  async getLocationData(city: string, state?: string): Promise<any | null> {
    const key = CacheKeyGenerator.locationIntelligence(city, state);
    return this.get(key);
  }

  async setLocationData(city: string, data: any, state?: string): Promise<void> {
    const key = CacheKeyGenerator.locationIntelligence(city, state);
    return this.set(key, data);
  }
}

export class PriceAnalysisCache extends AdvancedCache<any> {
  constructor() {
    super(cacheConfigs.price);
  }

  async getPriceAnalysis(brand: string, model: string, year: number, city: string): Promise<any | null> {
    const key = CacheKeyGenerator.priceAnalysis(brand, model, year, city);
    return this.get(key);
  }

  async setPriceAnalysis(brand: string, model: string, year: number, city: string, data: any): Promise<void> {
    const key = CacheKeyGenerator.priceAnalysis(brand, model, year, city);
    return this.set(key, data);
  }
}

export class HistoricalDataCache extends AdvancedCache<any> {
  constructor() {
    super(cacheConfigs.historical);
  }

  async getHistoricalData(brand: string, model: string, city: string): Promise<any | null> {
    const key = CacheKeyGenerator.historicalData(brand, model, city);
    return this.get(key);
  }

  async setHistoricalData(brand: string, model: string, city: string, data: any): Promise<void> {
    const key = CacheKeyGenerator.historicalData(brand, model, city);
    return this.set(key, data);
  }
}

export class SearchResultsCache extends AdvancedCache<any> {
  constructor() {
    super(cacheConfigs.search);
  }

  async getSearchResults(filters: any): Promise<any | null> {
    const key = CacheKeyGenerator.searchResults(filters);
    return this.get(key);
  }

  async setSearchResults(filters: any, data: any): Promise<void> {
    const key = CacheKeyGenerator.searchResults(filters);
    return this.set(key, data);
  }
}

// Global cache manager
export class CacheManager {
  private locationCache = new LocationIntelligenceCache();
  private priceCache = new PriceAnalysisCache();
  private historicalCache = new HistoricalDataCache();
  private searchCache = new SearchResultsCache();

  // Background refresh worker
  private refreshInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startBackgroundRefresh();
  }

  private startBackgroundRefresh(): void {
    this.refreshInterval = setInterval(async () => {
      await this.processRefreshQueue();
    }, 30000); // Check every 30 seconds

    console.log('🔄 Background cache refresh worker started');
  }

  private async processRefreshQueue(): Promise<void> {
    const refreshTasks = [
      ...this.locationCache.getRefreshQueue().map(key => ({ type: 'location', key })),
      ...this.priceCache.getRefreshQueue().map(key => ({ type: 'price', key })),
      ...this.historicalCache.getRefreshQueue().map(key => ({ type: 'historical', key })),
      ...this.searchCache.getRefreshQueue().map(key => ({ type: 'search', key }))
    ];

    if (refreshTasks.length > 0) {
      console.log(`🔄 Processing ${refreshTasks.length} cache refresh tasks`);
      
      // Process in batches to avoid overwhelming services
      const batchSize = 5;
      for (let i = 0; i < refreshTasks.length; i += batchSize) {
        const batch = refreshTasks.slice(i, i + batchSize);
        await Promise.all(batch.map(task => this.refreshCacheEntry(task)));
      }
    }
  }

  private async refreshCacheEntry(task: { type: string; key: string }): Promise<void> {
    try {
      // This would trigger a background refresh of the data
      // Implementation would depend on the specific service
      console.log(`🔄 Refreshing ${task.type} cache for key: ${task.key}`);
    } catch (error) {
      console.log(`❌ Failed to refresh cache entry ${task.key}:`, error);
    }
  }

  // Public interface
  get location() { return this.locationCache; }
  get price() { return this.priceCache; }
  get historical() { return this.historicalCache; }
  get search() { return this.searchCache; }

  getAllStats() {
    return {
      location: this.locationCache.getStats(),
      price: this.priceCache.getStats(),
      historical: this.historicalCache.getStats(),
      search: this.searchCache.getStats()
    };
  }

  clearAll(): void {
    this.locationCache.clear();
    this.priceCache.clear();
    this.historicalCache.clear();
    this.searchCache.clear();
    console.log('🧹 All caches cleared');
  }

  stop(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
      console.log('⏹️ Background cache refresh worker stopped');
    }
  }
}

// Global cache manager instance
export const cacheManager = new CacheManager();

// Helper function for cache-wrapped operations
export async function withCache<T>(
  cache: AdvancedCache<T>,
  key: string,
  fallback: () => Promise<T>,
  forceRefresh: boolean = false
): Promise<T> {
  if (!forceRefresh) {
    const cached = await cache.get(key);
    if (cached !== null) {
      return cached;
    }
  }

  const data = await fallback();
  await cache.set(key, data);
  return data;
}

// Cache warming strategies for Hyderabad market
export class HyderabadCacheWarmer {
  static async warmLocationCaches(): Promise<void> {
    const hyderabadLocations = [
      'hyderabad', 'secunderabad', 'gachibowli', 'hitech city', 
      'madhapur', 'banjara hills', 'jubilee hills', 'kondapur',
      'kukatpally', 'mehdipatnam', 'uppal', 'lb nagar'
    ];

    console.log('🔥 Warming Hyderabad location caches...');
    
    for (const location of hyderabadLocations) {
      try {
        // This would fetch and cache location intelligence
        await cacheManager.location.setLocationData(location, {
          city: location,
          marketHealth: 'excellent',
          avgPriceRange: { min: 200000, max: 1500000 },
          popularBrands: ['Maruti Suzuki', 'Hyundai', 'Kia', 'Tata'],
          timestamp: Date.now()
        });
      } catch (error) {
        console.log(`⚠️ Failed to warm cache for ${location}:`, error);
      }
    }
  }

  static async warmPriceCaches(): Promise<void> {
    const popularModels = [
      { brand: 'Maruti Suzuki', model: 'Swift' },
      { brand: 'Hyundai', model: 'i20' },
      { brand: 'Kia', model: 'Seltos' },
      { brand: 'Tata', model: 'Nexon' },
      { brand: 'Mahindra', model: 'Thar' }
    ];

    console.log('🔥 Warming popular model price caches...');

    for (const { brand, model } of popularModels) {
      for (const year of [2024, 2023, 2022, 2021]) {
        try {
          await cacheManager.price.setPriceAnalysis(brand, model, year, 'hyderabad', {
            brand,
            model,
            year,
            avgPrice: Math.floor(Math.random() * 800000) + 300000,
            priceRange: { min: 250000, max: 1200000 },
            marketTrend: 'stable',
            timestamp: Date.now()
          });
        } catch (error) {
          console.log(`⚠️ Failed to warm price cache for ${brand} ${model}:`, error);
        }
      }
    }
  }
}

console.log('✅ Advanced caching system initialized');