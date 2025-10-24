import { storage } from './storage';
import { scraperHealthLogs } from '../shared/schema';
import { eq, desc, and, gte } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

interface ScraperRun {
  id: string;
  scraperName: string;
  scraperType: 'forum' | 'certified' | 'auction' | 'marketplace';
  startedAt: Date;
}

interface ScraperResult {
  success: boolean;
  totalFound: number;
  newListingsSaved: number;
  duplicatesSkipped?: number;
  error?: string;
  errorStack?: string;
}

export class ScraperHealthMonitor {
  private activeRuns: Map<string, ScraperRun> = new Map();
  private retryQueue: Array<{ scraperName: string; retryAttempt: number; nextRetryAt: Date }> = [];
  private readonly MAX_RETRIES = 3;
  private readonly BASE_RETRY_DELAY_MS = 5 * 60 * 1000; // 5 minutes
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    // Load pending retries from database on startup (including overdue ones)
    if ('db' in storage) {
      try {
        const pendingRetries = await storage.db
          .select()
          .from(scraperHealthLogs)
          .where(eq(scraperHealthLogs.isRetryPending, true))
          .orderBy(desc(scraperHealthLogs.createdAt));

        // Group by scraper name to get the latest retry state for each scraper
        const latestRetries = new Map<string, typeof pendingRetries[0]>();
        for (const retry of pendingRetries) {
          if (!latestRetries.has(retry.scraperName)) {
            latestRetries.set(retry.scraperName, retry);
          }
        }

        for (const retry of latestRetries.values()) {
          if (retry.nextRetryAt && retry.retryAttempt !== null) {
            this.retryQueue.push({
              scraperName: retry.scraperName,
              retryAttempt: retry.retryAttempt,
              nextRetryAt: new Date(retry.nextRetryAt)
            });
            const isOverdue = new Date(retry.nextRetryAt) <= new Date();
            console.log(`📥 Loaded ${isOverdue ? 'overdue' : 'pending'} retry for ${retry.scraperName} (attempt ${retry.retryAttempt}/${this.MAX_RETRIES}) scheduled for ${retry.nextRetryAt}`);
          }
        }
        
        if (latestRetries.size > 0) {
          console.log(`✅ Loaded ${latestRetries.size} pending retries from database`);
        }
      } catch (error) {
        console.error('Failed to load pending retries from database:', error);
      }
    }
    
    this.initialized = true;
  }

  async startRun(
    scraperName: string,
    scraperType: 'forum' | 'certified' | 'auction' | 'marketplace',
    scheduledRun: boolean = true,
    triggeredBy: string = 'scheduler'
  ): Promise<string> {
    const runId = crypto.randomUUID();
    const startedAt = new Date();

    this.activeRuns.set(runId, {
      id: runId,
      scraperName,
      scraperType,
      startedAt
    });

    // Log to database
    if ('db' in storage) {
      try {
        await storage.db.insert(scraperHealthLogs).values({
          id: runId,
          scraperName,
          scraperType,
          status: 'running',
          startedAt,
          scheduledRun,
          triggeredBy,
          createdAt: new Date()
        });
      } catch (error) {
        console.error(`Failed to log scraper start for ${scraperName}:`, error);
      }
    }

    console.log(`🔄 Started scraper run: ${scraperName} (${runId})`);
    return runId;
  }

  async completeRun(runId: string, result: ScraperResult): Promise<void> {
    const run = this.activeRuns.get(runId);
    if (!run) {
      console.error(`No active run found for ID: ${runId}`);
      return;
    }

    const completedAt = new Date();
    const durationMs = completedAt.getTime() - run.startedAt.getTime();
    const status = result.success ? 'success' : 'failed';

    // Log to database
    if ('db' in storage) {
      try {
        await storage.db
          .update(scraperHealthLogs)
          .set({
            status,
            totalFound: result.totalFound,
            newListingsSaved: result.newListingsSaved,
            duplicatesSkipped: result.duplicatesSkipped || 0,
            errorsCount: result.success ? 0 : 1,
            completedAt,
            durationMs,
            errorMessage: result.error,
            errorStack: result.errorStack
          })
          .where(eq(scraperHealthLogs.id, runId));

        console.log(`✅ Completed scraper run: ${run.scraperName} (${status}) - ${result.newListingsSaved} new listings in ${durationMs}ms`);
      } catch (error) {
        console.error(`Failed to update scraper run ${runId}:`, error);
      }
    }

    // Handle failures with retry logic
    if (!result.success) {
      await this.handleFailure(run.scraperName, result.error, runId);
    } else {
      // Clear from retry queue on success
      this.retryQueue = this.retryQueue.filter(r => r.scraperName !== run.scraperName);
      
      // Clear ALL retry states for this scraper from database on success
      if ('db' in storage) {
        try {
          await storage.db
            .update(scraperHealthLogs)
            .set({ isRetryPending: false, nextRetryAt: null })
            .where(
              and(
                eq(scraperHealthLogs.scraperName, run.scraperName),
                eq(scraperHealthLogs.isRetryPending, true)
              )
            );
          console.log(`✅ Cleared all pending retries for ${run.scraperName}`);
        } catch (err) {
          console.error(`Failed to clear retry state for ${run.scraperName}:`, err);
        }
      }
    }

    this.activeRuns.delete(runId);
  }

  private async handleFailure(scraperName: string, error?: string, runId?: string): Promise<void> {
    // Find existing retry entry
    const existingRetry = this.retryQueue.find(r => r.scraperName === scraperName);
    const retryAttempt = existingRetry ? existingRetry.retryAttempt + 1 : 1;

    if (retryAttempt > this.MAX_RETRIES) {
      console.error(`❌ ${scraperName} failed ${this.MAX_RETRIES} times. Giving up.`);
      await this.sendAlert(scraperName, error || 'Unknown error', retryAttempt);
      // Remove from retry queue and clear ALL database retry states for this scraper
      this.retryQueue = this.retryQueue.filter(r => r.scraperName !== scraperName);
      
      if ('db' in storage) {
        try {
          await storage.db
            .update(scraperHealthLogs)
            .set({ isRetryPending: false, nextRetryAt: null })
            .where(
              and(
                eq(scraperHealthLogs.scraperName, scraperName),
                eq(scraperHealthLogs.isRetryPending, true)
              )
            );
          console.log(`✅ Cleared all pending retries for ${scraperName} after max attempts`);
        } catch (err) {
          console.error(`Failed to clear retry state for ${scraperName}:`, err);
        }
      }
      return;
    }

    // Calculate exponential backoff
    const delayMs = this.BASE_RETRY_DELAY_MS * Math.pow(2, retryAttempt - 1);
    const nextRetryAt = new Date(Date.now() + delayMs);

    // Update or add to retry queue
    if (existingRetry) {
      existingRetry.retryAttempt = retryAttempt;
      existingRetry.nextRetryAt = nextRetryAt;
    } else {
      this.retryQueue.push({ scraperName, retryAttempt, nextRetryAt });
    }

    // Persist retry state to database
    if (runId && 'db' in storage) {
      try {
        await storage.db
          .update(scraperHealthLogs)
          .set({
            isRetryPending: true,
            nextRetryAt,
            retryAttempt
          })
          .where(eq(scraperHealthLogs.id, runId));
      } catch (err) {
        console.error(`Failed to persist retry state for ${scraperName}:`, err);
      }
    }

    console.warn(`⚠️ ${scraperName} failed (attempt ${retryAttempt}/${this.MAX_RETRIES}). Retry scheduled for ${nextRetryAt.toISOString()}`);
  }

  async processRetries(): Promise<Array<{ scraperName: string; retryAttempt: number }>> {
    const now = new Date();
    const dueRetries = this.retryQueue.filter(r => r.nextRetryAt <= now);

    const scrapersToDue: Array<{ scraperName: string; retryAttempt: number }> = [];
    
    for (const retry of dueRetries) {
      console.log(`🔄 Auto-retrying failed scraper: ${retry.scraperName} (attempt ${retry.retryAttempt})`);
      scrapersToDue.push({
        scraperName: retry.scraperName,
        retryAttempt: retry.retryAttempt
      });
      // Remove from queue - will be re-added if it fails again
      this.retryQueue = this.retryQueue.filter(r => r.scraperName !== retry.scraperName);
    }

    return scrapersToDue;
  }

  private async sendAlert(scraperName: string, error: string, attemptNumber: number): Promise<void> {
    const alertMessage = `
🚨 SCRAPER FAILURE ALERT

Scraper: ${scraperName}
Status: Failed after ${attemptNumber} attempts
Error: ${error}
Time: ${new Date().toISOString()}

Action Required: Manual intervention needed to fix ${scraperName} scraper.
    `;

    console.error(alertMessage);

    // TODO: Send email notification when Nodemailer is configured
    // For now, just log to console for visibility
  }

  async getHealthStatus(): Promise<{
    overall: 'healthy' | 'degraded' | 'critical';
    scrapers: Array<{
      name: string;
      type: string;
      status: string;
      lastRun?: Date;
      lastSuccess?: Date;
      successRate24h: number;
      averageDurationMs?: number;
    }>;
    summary: {
      total: number;
      healthy: number;
      failing: number;
      lastCheck: Date;
    };
  }> {
    if (!('db' in storage)) {
      return {
        overall: 'critical',
        scrapers: [],
        summary: {
          total: 0,
          healthy: 0,
          failing: 0,
          lastCheck: new Date()
        }
      };
    }

    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Optimized: Get all logs in one query
    const allLogs = await storage.db
      .select()
      .from(scraperHealthLogs)
      .orderBy(desc(scraperHealthLogs.startedAt));

    // Group by scraper name and calculate stats in memory (much faster than multiple DB queries)
    const scraperMap = new Map<string, any[]>();
    for (const log of allLogs) {
      if (!scraperMap.has(log.scraperName)) {
        scraperMap.set(log.scraperName, []);
      }
      scraperMap.get(log.scraperName)!.push(log);
    }

    const scraperStats = Array.from(scraperMap.entries()).map(([scraperName, logs]) => {
      // Get last run (logs are already sorted by startedAt desc)
      const lastRun = logs[0];

      // Get last successful run
      const lastSuccess = logs.find(l => l.status === 'success');

      // Calculate 24h success rate
      const last24hRuns = logs.filter(l => l.startedAt >= last24h);
      const successfulRuns = last24hRuns.filter(r => r.status === 'success').length;
      const totalRuns = last24hRuns.length;
      const successRate24h = totalRuns > 0 ? (successfulRuns / totalRuns) * 100 : 0;

      // Calculate average duration
      const completedRuns = last24hRuns.filter((r: any) => r.durationMs !== null);
      const averageDurationMs = completedRuns.length > 0
        ? completedRuns.reduce((sum: number, r: any) => sum + (r.durationMs || 0), 0) / completedRuns.length
        : undefined;

      return {
        name: scraperName,
        type: lastRun?.scraperType || 'unknown',
        status: lastRun?.status || 'unknown',
        lastRun: lastRun?.startedAt,
        lastSuccess: lastSuccess?.startedAt,
        successRate24h: Math.round(successRate24h),
        averageDurationMs: averageDurationMs ? Math.round(averageDurationMs) : undefined
      };
    });

    // Determine overall health
    const failing = scraperStats.filter(s => s.successRate24h < 50).length;
    const degraded = scraperStats.filter(s => s.successRate24h >= 50 && s.successRate24h < 90).length;
    const healthy = scraperStats.filter(s => s.successRate24h >= 90).length;

    const overall =
      failing > scraperStats.length / 2 ? 'critical' :
      failing > 0 || degraded > scraperStats.length / 3 ? 'degraded' :
      'healthy';

    return {
      overall,
      scrapers: scraperStats,
      summary: {
        total: scraperStats.length,
        healthy,
        failing,
        lastCheck: new Date()
      }
    };
  }
}

export const scraperHealthMonitor = new ScraperHealthMonitor();
