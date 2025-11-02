import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CACHE_DIR = path.join(__dirname, '../../../.aether_cache');

/**
 * Prompt-hash-based cache for LLM responses
 */
class CacheLayer {
  constructor() {
    this.ensureCacheDirectory();
    this.stats = {
      hits: 0,
      misses: 0,
      saves: 0
    };
  }

  ensureCacheDirectory() {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      console.log(`[CacheLayer] Created cache directory: ${CACHE_DIR}`);
    }
  }

  /**
   * Generate cache key from prompt
   */
  generateKey(prompt, operation = 'chat', options = {}) {
    // Include relevant options in hash for cache differentiation
    const cacheInput = {
      prompt,
      operation,
      model: options.model || 'default',
      temperature: options.temperature || 0.7
    };
    
    return crypto.createHash('sha256')
      .update(JSON.stringify(cacheInput))
      .digest('hex');
  }

  /**
   * Get cache file path
   */
  getCachePath(key) {
    return path.join(CACHE_DIR, `${key}.json`);
  }

  /**
   * Check if cache exists for prompt
   */
  has(prompt, operation = 'chat', options = {}) {
    const key = this.generateKey(prompt, operation, options);
    const cachePath = this.getCachePath(key);
    return fs.existsSync(cachePath);
  }

  /**
   * Get cached response
   */
  get(prompt, operation = 'chat', options = {}) {
    const key = this.generateKey(prompt, operation, options);
    const cachePath = this.getCachePath(key);

    try {
      if (!fs.existsSync(cachePath)) {
        this.stats.misses++;
        return null;
      }

      const data = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      
      // Check if cache is stale (optional: could add TTL)
      // For now, cache is permanent
      
      this.stats.hits++;
      console.log(`[CacheLayer] Cache HIT for key: ${key.substring(0, 8)}...`);
      
      return {
        ...data,
        cached: true,
        cacheKey: key
      };
    } catch (error) {
      console.error('[CacheLayer] Failed to read cache:', error);
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Save response to cache
   */
  set(prompt, response, operation = 'chat', options = {}) {
    const key = this.generateKey(prompt, operation, options);
    const cachePath = this.getCachePath(key);

    try {
      const cacheData = {
        prompt,
        operation,
        response,
        options: {
          model: options.model,
          temperature: options.temperature
        },
        cachedAt: new Date().toISOString(),
        key
      };

      fs.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2));
      this.stats.saves++;
      console.log(`[CacheLayer] Cached response for key: ${key.substring(0, 8)}...`);
      
      return true;
    } catch (error) {
      console.error('[CacheLayer] Failed to write cache:', error);
      return false;
    }
  }

  /**
   * Delete cached entry
   */
  delete(prompt, operation = 'chat', options = {}) {
    const key = this.generateKey(prompt, operation, options);
    const cachePath = this.getCachePath(key);

    try {
      if (fs.existsSync(cachePath)) {
        fs.unlinkSync(cachePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[CacheLayer] Failed to delete cache:', error);
      return false;
    }
  }

  /**
   * Clear all cache
   */
  clear() {
    try {
      if (fs.existsSync(CACHE_DIR)) {
        const files = fs.readdirSync(CACHE_DIR);
        for (const file of files) {
          if (file.endsWith('.json')) {
            fs.unlinkSync(path.join(CACHE_DIR, file));
          }
        }
        console.log(`[CacheLayer] Cleared ${files.length} cache entries`);
        return files.length;
      }
      return 0;
    } catch (error) {
      console.error('[CacheLayer] Failed to clear cache:', error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    try {
      const files = fs.existsSync(CACHE_DIR) ? fs.readdirSync(CACHE_DIR) : [];
      const cacheFiles = files.filter(f => f.endsWith('.json'));
      
      let totalSize = 0;
      for (const file of cacheFiles) {
        const stats = fs.statSync(path.join(CACHE_DIR, file));
        totalSize += stats.size;
      }

      return {
        hits: this.stats.hits,
        misses: this.stats.misses,
        saves: this.stats.saves,
        hitRate: this.stats.hits + this.stats.misses > 0 
          ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2) + '%'
          : '0%',
        totalEntries: cacheFiles.length,
        totalSizeBytes: totalSize,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
        cacheDir: CACHE_DIR
      };
    } catch (error) {
      console.error('[CacheLayer] Failed to get stats:', error);
      return {
        hits: this.stats.hits,
        misses: this.stats.misses,
        saves: this.stats.saves,
        error: error.message
      };
    }
  }

  /**
   * Get list of all cached keys with metadata
   */
  list(limit = 100) {
    try {
      if (!fs.existsSync(CACHE_DIR)) {
        return [];
      }

      const files = fs.readdirSync(CACHE_DIR)
        .filter(f => f.endsWith('.json'))
        .slice(0, limit);

      const entries = [];
      for (const file of files) {
        try {
          const filePath = path.join(CACHE_DIR, file);
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          const stats = fs.statSync(filePath);
          
          entries.push({
            key: data.key,
            operation: data.operation,
            promptPreview: data.prompt.substring(0, 100),
            cachedAt: data.cachedAt,
            sizeBytes: stats.size,
            file
          });
        } catch (err) {
          console.error(`Failed to read cache file ${file}:`, err);
        }
      }

      return entries.sort((a, b) => 
        new Date(b.cachedAt).getTime() - new Date(a.cachedAt).getTime()
      );
    } catch (error) {
      console.error('[CacheLayer] Failed to list cache:', error);
      return [];
    }
  }
}

// Export singleton instance
export const cacheLayer = new CacheLayer();
