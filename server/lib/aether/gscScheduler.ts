import { scheduler } from './scheduler.js';
import { createGscClient } from './gscClient';
import { db } from '../../db';
import { gscAnalytics } from '../../../shared/schema';

export function scheduleGscSyncJobs() {
  const enabled = process.env.AETHER_GSC_SYNC_ENABLED === 'true';
  
  if (!enabled) {
    console.log('[GSC Scheduler] AETHER_GSC_SYNC_ENABLED not set to true, skipping GSC sync jobs');
    scheduler.stopJob('gsc_daily_sync');
    return false;
  }

  if (!scheduler.cronEnabled) {
    console.log('[GSC Scheduler] Cron disabled, skipping GSC sync jobs');
    scheduler.stopJob('gsc_daily_sync');
    return false;
  }

  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!serviceAccountEmail || !privateKey) {
    console.log('[GSC Scheduler] Google Service Account credentials not configured, skipping GSC sync jobs');
    scheduler.stopJob('gsc_daily_sync');
    return false;
  }

  scheduler.stopJob('gsc_daily_sync');

  scheduler.scheduleJob(
    'gsc_daily_sync',
    '0 3 * * *',
    async () => {
      console.log('[GSC Scheduler] Running daily GSC data sync...');
      try {
        const result = await runGscSync();
        if (result.success) {
          console.log(`[GSC Scheduler] ✓ Sync completed: ${result.records} records synced`);
        } else {
          console.error(`[GSC Scheduler] ✗ Sync completed with errors:`, result.error);
        }
      } catch (error) {
        console.error('[GSC Scheduler] ✗ Daily sync failed:', error);
      }
    }
  );

  console.log('[GSC Scheduler] ✓ Daily GSC sync scheduled for 3 AM UTC (8:30 AM IST)');
  return true;
}

export async function runGscSync(days: number = 7): Promise<{
  success: boolean;
  records: number;
  dateRange: { startDate: string; endDate: string };
  error?: string;
}> {
  console.log(`[GSC Scheduler] Starting GSC sync for last ${days} days...`);
  
  try {
    const gscClient = createGscClient();
    
    if (gscClient.isMockMode()) {
      console.log('[GSC Scheduler] GSC client in mock mode, skipping sync');
      return {
        success: false,
        records: 0,
        dateRange: { startDate: '', endDate: '' },
        error: 'GSC client in mock mode - credentials not configured'
      };
    }

    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    console.log(`[GSC Scheduler] Fetching analytics from ${startDate} to ${endDate}...`);
    
    const analytics = await gscClient.getSearchAnalytics({
      startDate,
      endDate,
      dimensions: ['date'],
    });

    console.log(`[GSC Scheduler] Received ${analytics.length} records from GSC API`);

    let inserted = 0;
    let skipped = 0;

    for (const data of analytics) {
      try {
        const result = await db.insert(gscAnalytics)
          .values({
            date: data.date,
            clicks: data.clicks,
            impressions: data.impressions,
            ctr: data.ctr.toString(),
            position: data.position.toString(),
          })
          .onConflictDoNothing()
          .returning();

        if (result.length > 0) {
          inserted++;
        } else {
          skipped++;
        }
      } catch (error) {
        console.error(`[GSC Scheduler] Error inserting record for ${data.date}:`, error);
      }
    }

    console.log(`[GSC Scheduler] ✓ Sync complete: ${inserted} inserted, ${skipped} skipped (already exists)`);

    return {
      success: true,
      records: inserted,
      dateRange: { startDate, endDate },
    };
  } catch (error: any) {
    console.error('[GSC Scheduler] ✗ Sync failed:', error);
    return {
      success: false,
      records: 0,
      dateRange: { startDate: '', endDate: '' },
      error: error.message || 'Unknown error',
    };
  }
}

export async function runGscSyncNow(days?: number) {
  console.log('[GSC Scheduler] Running manual GSC sync...');
  try {
    const result = await runGscSync(days);
    console.log('[GSC Scheduler] Manual sync completed:', result);
    return result;
  } catch (error) {
    console.error('[GSC Scheduler] Manual sync failed:', error);
    throw error;
  }
}
