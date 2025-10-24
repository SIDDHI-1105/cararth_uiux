/**
 * Daily Listing Metrics Service
 * Captures daily snapshot of listing counts by source for trend tracking
 * Runs automatically at midnight IST
 */

import { DatabaseStorage } from './dbStorage.js';
import { listingMetrics } from '@shared/schema';
import { logError, ErrorCategory, createAppError } from './errorHandling.js';
import { sql } from 'drizzle-orm';

export class ListingMetricsService {
  private storage: DatabaseStorage;
  private lastSnapshotDate: Date | null = null;

  constructor(storage: DatabaseStorage) {
    this.storage = storage;
  }

  /**
   * Capture daily snapshot of listing metrics
   * Should be called once per day at midnight IST
   */
  async captureDailySnapshot(): Promise<void> {
    try {
      console.log('📊 Capturing daily listing metrics snapshot...');

      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize to midnight

      // Check if we already captured today's snapshot
      if (this.lastSnapshotDate && this.isSameDay(this.lastSnapshotDate, today)) {
        console.log('⏭️ Daily snapshot already captured for today, skipping');
        return;
      }

      // Get current listing counts by source
      const counts = await this.storage.getListingCountsBySource();

      // Get yesterday's snapshot for comparison
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const previousMetrics = await this.storage.db
        .select()
        .from(listingMetrics)
        .where(sql`date >= ${yesterday} AND date < ${today}`)
        .limit(1);

      const prevTotal = previousMetrics[0]?.totalListings || 0;
      const newAdditions = Math.max(0, counts.total - prevTotal);
      const removals = Math.max(0, prevTotal - counts.total);
      const netChange = counts.total - prevTotal;

      // Insert today's snapshot
      await this.storage.db.insert(listingMetrics).values({
        date: today,
        totalListings: counts.total,
        activeListings: counts.total, // All listings are considered active for now
        ethicalAiCount: counts.ethicalAi,
        exclusiveDealerCount: counts.exclusiveDealer,
        userDirectCount: counts.userDirect,
        newAdditions,
        removals,
        netChange,
        carDekhoCount: counts.byPortal['CarDekho'] || 0,
        olxCount: counts.byPortal['OLX'] || 0,
        cars24Count: counts.byPortal['Cars24'] || 0,
        carWaleCount: counts.byPortal['CarWale'] || 0,
        teamBhpCount: counts.byPortal['Team-BHP'] || 0,
        otherPortalsCount: Object.entries(counts.byPortal)
          .filter(([portal]) => !['CarDekho', 'OLX', 'Cars24', 'CarWale', 'Team-BHP'].includes(portal))
          .reduce((sum, [_, count]) => sum + count, 0)
      });

      this.lastSnapshotDate = today;

      console.log(`✅ Daily metrics snapshot captured:
        Total: ${counts.total} listings
        Ethical AI: ${counts.ethicalAi}
        Exclusive Dealer: ${counts.exclusiveDealer}
        User Direct: ${counts.userDirect}
        Net Change: ${netChange >= 0 ? '+' : ''}${netChange}
      `);

      logError({ 
        message: 'Daily listing metrics snapshot captured successfully', 
        statusCode: 200 
      }, 'Daily metrics service');

    } catch (error) {
      console.error('❌ Failed to capture daily metrics:', error);
      logError(
        createAppError('Failed to capture daily listing metrics', 500, ErrorCategory.DATABASE),
        'Daily metrics snapshot'
      );
      throw error;
    }
  }

  /**
   * Check if two dates are the same day (ignoring time)
   */
  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  /**
   * Start the daily snapshot scheduler
   * Runs at midnight IST (18:30 UTC)
   */
  startScheduler(): void {
    // Calculate next midnight IST
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const nowIST = new Date(now.getTime() + istOffset);
    
    // Set to midnight IST
    const nextMidnightIST = new Date(nowIST);
    nextMidnightIST.setHours(24, 0, 0, 0);
    
    const msUntilMidnight = nextMidnightIST.getTime() - nowIST.getTime();

    console.log(`⏰ Daily metrics snapshot scheduler started`);
    console.log(`   Next snapshot in: ${Math.round(msUntilMidnight / 1000 / 60)} minutes`);

    // Schedule first run at next midnight
    setTimeout(() => {
      this.captureDailySnapshot().catch(console.error);
      
      // Then run every 24 hours
      setInterval(() => {
        this.captureDailySnapshot().catch(console.error);
      }, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);
  }
}

// Global instance
let metricsService: ListingMetricsService | null = null;

/**
 * Initialize the listing metrics service
 */
export function initializeMetricsService(storage: DatabaseStorage): ListingMetricsService {
  if (!metricsService) {
    metricsService = new ListingMetricsService(storage);
    metricsService.startScheduler();
    console.log('✅ Listing metrics service initialized');
  }
  return metricsService;
}

/**
 * Get the metrics service instance
 */
export function getMetricsService(): ListingMetricsService | null {
  return metricsService;
}

/**
 * Manually trigger a snapshot (for testing or manual runs)
 */
export async function captureMetricsSnapshot(storage: DatabaseStorage): Promise<void> {
  const service = new ListingMetricsService(storage);
  await service.captureDailySnapshot();
}
