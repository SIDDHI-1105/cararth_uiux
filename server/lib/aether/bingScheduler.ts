import { scheduler } from './scheduler.js';
import { runBingSync, BingDataSync } from './bingDataSync';
import { db } from '../../db';
import { aetherBingTokens } from '../../../shared/schema';
import { sql } from 'drizzle-orm';

async function getAllBingUsers(): Promise<string[]> {
  const tokens = await db.selectDistinct({ userId: aetherBingTokens.userId })
    .from(aetherBingTokens)
    .where(sql`${aetherBingTokens.accessToken} IS NOT NULL`);
  
  return tokens.map(t => t.userId);
}

export function scheduleBingSyncJobs() {
  const enabled = process.env.AETHER_BING_SYNC_ENABLED === 'true';
  
  if (!enabled) {
    console.log('[Bing Scheduler] AETHER_BING_SYNC_ENABLED not set, skipping Bing sync jobs');
    
    scheduler.stopJob('bing_nightly_sync');
    return false;
  }

  if (!scheduler.cronEnabled) {
    console.log('[Bing Scheduler] Cron disabled, skipping Bing sync jobs');
    scheduler.stopJob('bing_nightly_sync');
    return false;
  }

  scheduler.stopJob('bing_nightly_sync');

  scheduler.scheduleJob(
    'bing_nightly_sync',
    '0 2 * * *',
    async () => {
      console.log('[Bing Scheduler] Running nightly Bing data sync for all users...');
      try {
        const userIds = await getAllBingUsers();
        console.log(`[Bing Scheduler] Found ${userIds.length} users with Bing connections`);
        
        for (const userId of userIds) {
          try {
            const result = await runBingSync(userId);
            if (result.success) {
              console.log(`[Bing Scheduler] ✓ Sync completed for user ${userId}`);
            } else {
              console.error(`[Bing Scheduler] ✗ Sync completed with errors for user ${userId}:`, result.results);
            }
          } catch (error) {
            console.error(`[Bing Scheduler] ✗ Sync failed for user ${userId}:`, error);
          }
        }
        
        console.log('[Bing Scheduler] ✓ Nightly Bing sync batch completed');
      } catch (error) {
        console.error('[Bing Scheduler] ✗ Nightly Bing sync batch failed:', error);
      }
    }
  );

  console.log('[Bing Scheduler] ✓ Nightly Bing sync scheduled for 2 AM UTC (daily)');
  return true;
}

export async function runBingSyncNow(userId: string) {
  if (!userId) {
    throw new Error('userId is required for Bing sync');
  }
  
  console.log(`[Bing Scheduler] Running manual Bing sync for user ${userId}...`);
  try {
    const result = await runBingSync(userId);
    console.log('[Bing Scheduler] Manual sync completed:', result);
    return result;
  } catch (error) {
    console.error('[Bing Scheduler] Manual sync failed:', error);
    throw error;
  }
}
