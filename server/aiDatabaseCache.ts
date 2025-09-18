import { createHash } from 'crypto';
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, lt, and, desc, sql } from "drizzle-orm";
import { aiModelCache, type AiModelCache, type InsertAiModelCache } from "@shared/schema";
import { logError } from "./errorHandling.js";

export interface AiCacheResult {
  hit: boolean;
  response?: any;
  costSaved?: number;
}

export interface AiCacheOptions {
  model: string;
  provider: string;
  ttlHours?: number;
  estimatedCost?: number;
}

/**
 * Database-backed AI model response cache for cost optimization
 * Implements the cost reduction strategy requested by user
 */
export class AiDatabaseCache {
  private db: ReturnType<typeof drizzle>;
  
  // Cost optimization settings based on user request
  private readonly isPublishShadowMode = process.env.PUBLISH_SHADOW_MODE === 'true';
  private readonly batchConcurrency = parseInt(process.env.BATCH_CONCURRENCY || '5');
  private readonly imageConcurrency = parseInt(process.env.IMAGE_DOWNLOAD_CONCURRENCY || '3');

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required for AiDatabaseCache');
    }
    
    const sql = neon(process.env.DATABASE_URL);
    this.db = drizzle(sql);
    
    this.logCostOptimizations();
  }

  private logCostOptimizations(): void {
    console.log('💰 AI Database Cache initialized with cost optimizations:');
    console.log(`   - Publish Shadow Mode: ${this.isPublishShadowMode}`);
    console.log(`   - Batch Concurrency: ${this.batchConcurrency}`);
    console.log(`   - Image Concurrency: ${this.imageConcurrency}`);
  }

  /**
   * Generate a consistent cache key for the request including all relevant parameters
   */
  private generateCacheKey(prompt: string, options: AiCacheOptions, requestParams?: any): string {
    // Include critical parameters that affect the response
    const keyData = JSON.stringify({
      provider: options.provider,
      model: options.model,
      prompt: prompt,
      temperature: requestParams?.temperature || 0.7,
      maxTokens: requestParams?.max_tokens || requestParams?.maxTokens,
      systemPrompt: requestParams?.system || requestParams?.systemPrompt,
      tools: requestParams?.tools,
      topP: requestParams?.top_p || requestParams?.topP
    });
    return createHash('sha256').update(keyData).digest('hex');
  }

  /**
   * Generate a shorter hash for database indexing
   */
  private generatePromptHash(prompt: string): string {
    return createHash('sha256').update(prompt).digest('hex').substring(0, 16);
  }

  /**
   * Get cached AI response if available and not expired
   */
  async get(prompt: string, options: AiCacheOptions, requestParams?: any): Promise<AiCacheResult> {
    try {
      const cacheKey = this.generateCacheKey(prompt, options, requestParams);
      
      // Calculate expiry time based on TTL
      const ttlHours = options.ttlHours || 24;
      const expiryTime = new Date();
      expiryTime.setHours(expiryTime.getHours() - ttlHours);

      const result = await this.db
        .select()
        .from(aiModelCache)
        .where(
          and(
            eq(aiModelCache.cacheKey, cacheKey),
            eq(aiModelCache.model, options.model),
            eq(aiModelCache.provider, options.provider),
            // Check if not expired
            sql`${aiModelCache.createdAt} > ${expiryTime}`
          )
        )
        .limit(1);

      if (result.length > 0) {
        const cached = result[0];
        
        // Update access statistics
        await this.db
          .update(aiModelCache)
          .set({
            hitCount: (cached.hitCount || 0) + 1,
            lastAccessed: new Date(),
            updatedAt: new Date()
          })
          .where(eq(aiModelCache.id, cached.id));

        console.log(`💾 AI Cache HIT: ${options.provider}/${options.model} (saved ${cached.estimatedCost || 0} USD)`);
        
        return {
          hit: true,
          response: cached.response,
          costSaved: parseFloat(cached.estimatedCost || '0')
        };
      }

      console.log(`🔍 AI Cache MISS: ${options.provider}/${options.model}`);
      return { hit: false };

    } catch (error) {
      console.error('❌ AI Cache retrieval error:', error);
      return { hit: false };
    }
  }

  /**
   * Store AI response in cache for future use
   */
  async set(
    prompt: string, 
    response: any, 
    options: AiCacheOptions,
    tokenUsage?: any,
    requestParams?: any
  ): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(prompt, options, requestParams);
      const promptHash = this.generatePromptHash(prompt);

      const cacheEntry: InsertAiModelCache = {
        cacheKey,
        model: options.model,
        provider: options.provider,
        prompt,
        promptHash,
        response,
        tokenUsage,
        ttlHours: options.ttlHours || 24,
        estimatedCost: options.estimatedCost?.toString() || '0'
      };

      // Upsert: update if exists, insert if not
      await this.db
        .insert(aiModelCache)
        .values(cacheEntry)
        .onConflictDoUpdate({
          target: aiModelCache.cacheKey,
          set: {
            response: cacheEntry.response,
            tokenUsage: cacheEntry.tokenUsage,
            updatedAt: new Date()
          }
        });

      console.log(`💾 AI Response cached: ${options.provider}/${options.model} (cost: ${options.estimatedCost || 0} USD)`);

    } catch (error) {
      console.error('❌ AI Cache storage error:', error);
    }
  }

  /**
   * Clean up expired cache entries
   */
  async cleanup(): Promise<number> {
    try {
      const result = await this.db
        .delete(aiModelCache)
        .where(
          lt(
            aiModelCache.lastAccessed,
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days old
          )
        );

      const deletedCount = result.rowCount || 0;
      if (deletedCount > 0) {
        console.log(`🧹 Cleaned up ${deletedCount} expired AI cache entries`);
      }
      
      return deletedCount;

    } catch (error) {
      console.error('❌ AI Cache cleanup error:', error);
      return 0;
    }
  }

  /**
   * Get cache statistics for monitoring
   */
  async getStats(): Promise<{
    totalEntries: number;
    totalHits: number;
    totalCostSaved: number;
    providerBreakdown: Record<string, number>;
  }> {
    try {
      const stats = await this.db
        .select({
          count: sql<number>`count(*)`,
          totalHits: sql<number>`sum(${aiModelCache.hitCount})`,
          totalCost: sql<number>`sum(${aiModelCache.estimatedCost})`,
          provider: aiModelCache.provider
        })
        .from(aiModelCache)
        .groupBy(aiModelCache.provider);

      const result = {
        totalEntries: 0,
        totalHits: 0,
        totalCostSaved: 0,
        providerBreakdown: {} as Record<string, number>
      };

      for (const stat of stats) {
        result.totalEntries += stat.count;
        result.totalHits += stat.totalHits || 0;
        result.totalCostSaved += stat.totalCost || 0;
        result.providerBreakdown[stat.provider] = stat.count;
      }

      return result;

    } catch (error) {
      console.error('❌ AI Cache stats error:', error);
      return {
        totalEntries: 0,
        totalHits: 0,
        totalCostSaved: 0,
        providerBreakdown: {}
      };
    }
  }

  /**
   * Get concurrency settings for cost optimization
   */
  getConcurrencySettings() {
    return {
      batchConcurrency: this.batchConcurrency,
      imageConcurrency: this.imageConcurrency,
      publishShadowMode: this.isPublishShadowMode
    };
  }
}

// Global instance
export const aiDatabaseCache = new AiDatabaseCache();