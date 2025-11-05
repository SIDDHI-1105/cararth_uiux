/**
 * AETHER Auto-SEO Content - Impact Tracking Scheduler
 * Nightly job to track SEO/GEO/GA4 impact for published articles
 */

import schedule from 'node-schedule';
import { impactTracker } from './impactTracker.js';
import { db } from '../../../db.js';
import { aetherArticles } from '../../../../shared/schema.js';
import { eq } from 'drizzle-orm';

class ContentScheduler {
  constructor() {
    this.job = null;
    this.isRunning = false;
  }

  /**
   * Initialize nightly impact tracking scheduler
   * Cron: 20 3 * * * (03:20 IST daily)
   */
  init() {
    const isEnabled = process.env.AETHER_CONTENT_CRON_ENABLED === 'true';
    
    if (!isEnabled) {
      console.log('[AETHER Content Scheduler] Nightly impact tracking disabled (AETHER_CONTENT_CRON_ENABLED=false)');
      return;
    }

    // Schedule at 03:20 IST daily (20 3 * * *)
    this.job = schedule.scheduleJob('20 3 * * *', async () => {
      await this.runNightlyImpactTracking();
    });

    console.log('[AETHER Content Scheduler] ✓ Nightly impact tracking scheduled (03:20 IST daily)');
  }

  /**
   * Run nightly impact tracking for all published articles
   */
  async runNightlyImpactTracking() {
    if (this.isRunning) {
      console.log('[AETHER Content Scheduler] Impact tracking already running, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();
    
    try {
      console.log('[AETHER Content Scheduler] 🌙 Starting nightly impact tracking...');

      // Get all published articles
      const articles = await db
        .select()
        .from(aetherArticles)
        .where(eq(aetherArticles.status, 'published'));

      console.log(`[AETHER Content Scheduler] Found ${articles.length} published articles`);

      let successCount = 0;
      let errorCount = 0;

      // Track impact for each article
      for (const article of articles) {
        try {
          await impactTracker.trackArticleImpact(article.id);
          successCount++;
          console.log(`[AETHER Content Scheduler] ✓ Tracked impact for article ${article.id}`);
        } catch (error) {
          errorCount++;
          console.error(`[AETHER Content Scheduler] ✗ Failed to track article ${article.id}:`, error);
        }
      }

      const duration = Date.now() - startTime;
      
      console.log(`[AETHER Content Scheduler] ✅ Nightly impact tracking completed in ${duration}ms`);
      console.log(`[AETHER Content Scheduler] Results: ${successCount} successful, ${errorCount} errors`);

    } catch (error) {
      console.error('[AETHER Content Scheduler] Nightly impact tracking failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Manually trigger impact tracking (for testing)
   */
  async manualTrigger() {
    console.log('[AETHER Content Scheduler] Manual trigger requested');
    await this.runNightlyImpactTracking();
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.job) {
      this.job.cancel();
      console.log('[AETHER Content Scheduler] Scheduler stopped');
    }
  }
}

// Singleton instance
let schedulerInstance = null;

export function getContentScheduler() {
  if (!schedulerInstance) {
    schedulerInstance = new ContentScheduler();
  }
  return schedulerInstance;
}

export const contentScheduler = getContentScheduler();
