import schedule from 'node-schedule';

import { crawlAllCompetitors } from './crawlSnapshot.js';
import { probeAllCompetitors } from './aiVisibilityProbe.js';
import { scoreAllCompetitors, scoreCararthCurrent } from './scoreBenchmarks.js';
import { generateRecommendations } from './recommendations.js';

const CRON_ENABLED = process.env.AETHER_BENCHMARK_CRON_ENABLED === 'true';
const CRON_SCHEDULE = process.env.AETHER_BENCHMARK_CRON || '0 2 * * *'; // 2 AM daily

let scheduledJob = null;
let lastRunStatus = null;

async function runNightlyBenchmark() {
  const startTime = Date.now();
  console.info('[AETHER_BENCH_SCHEDULER] Starting nightly benchmark run...');
  
  try {
    const results = {
      timestamp: new Date().toISOString(),
      crawl: [],
      probe: [],
      score: [],
      recommendations: []
    };
    
    console.info('[AETHER_BENCH_SCHEDULER] Step 1/4: Crawling competitor snapshots...');
    results.crawl = await crawlAllCompetitors();
    const successCrawl = results.crawl.filter(r => r.success).length;
    console.info(`[AETHER_BENCH_SCHEDULER] Crawl complete: ${successCrawl}/${results.crawl.length} successful`);
    
    console.info('[AETHER_BENCH_SCHEDULER] Step 2/4: Probing AI visibility...');
    results.probe = await probeAllCompetitors();
    const successProbe = results.probe.filter(r => r.success).length;
    console.info(`[AETHER_BENCH_SCHEDULER] Probe complete: ${successProbe}/${results.probe.length} successful`);
    
    console.info('[AETHER_BENCH_SCHEDULER] Step 3/4: Scoring benchmarks...');
    results.score = await scoreAllCompetitors();
    await scoreCararthCurrent();
    const successScore = results.score.filter(r => r.success).length;
    console.info(`[AETHER_BENCH_SCHEDULER] Scoring complete: ${successScore}/${results.score.length} successful`);
    
    console.info('[AETHER_BENCH_SCHEDULER] Step 4/4: Generating recommendations...');
    results.recommendations = await generateRecommendations();
    console.info(`[AETHER_BENCH_SCHEDULER] Recommendations complete: ${results.recommendations.length} generated`);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    lastRunStatus = {
      timestamp: results.timestamp,
      success: true,
      duration: `${duration}s`,
      summary: {
        crawled: successCrawl,
        probed: successProbe,
        scored: successScore,
        recommendations: results.recommendations.length
      }
    };
    
    console.info(`[AETHER_BENCH_SCHEDULER] ✓ Nightly benchmark complete in ${duration}s`);
    console.info(`[AETHER_BENCH_SCHEDULER] Summary: ${successCrawl} crawled, ${successProbe} probed, ${successScore} scored, ${results.recommendations.length} recommendations`);
    
    return lastRunStatus;
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    lastRunStatus = {
      timestamp: new Date().toISOString(),
      success: false,
      error: error.message,
      duration: `${duration}s`
    };
    
    console.error(`[AETHER_BENCH_SCHEDULER] ✗ Nightly benchmark failed after ${duration}s:`, error);
    throw error;
  }
}

export function startBenchmarkScheduler() {
  if (!CRON_ENABLED) {
    console.info('[AETHER_BENCH_SCHEDULER] Scheduler disabled (AETHER_BENCHMARK_CRON_ENABLED=false)');
    return { enabled: false };
  }
  
  if (scheduledJob) {
    console.warn('[AETHER_BENCH_SCHEDULER] Scheduler already running, skipping initialization');
    return { enabled: true, schedule: CRON_SCHEDULE, alreadyRunning: true };
  }
  
  try {
    scheduledJob = schedule.scheduleJob(CRON_SCHEDULE, async () => {
      console.info('[AETHER_BENCH_SCHEDULER] Cron triggered, starting benchmark run...');
      try {
        await runNightlyBenchmark();
      } catch (error) {
        console.error('[AETHER_BENCH_SCHEDULER] Scheduled run failed:', error);
      }
    });
    
    console.info(`[AETHER_BENCH_SCHEDULER] ✓ Nightly scheduler started with cron: ${CRON_SCHEDULE}`);
    return { enabled: true, schedule: CRON_SCHEDULE };
  } catch (error) {
    console.error('[AETHER_BENCH_SCHEDULER] Failed to start scheduler:', error);
    throw error;
  }
}

export function stopBenchmarkScheduler() {
  if (scheduledJob) {
    scheduledJob.cancel();
    scheduledJob = null;
    console.info('[AETHER_BENCH_SCHEDULER] Scheduler stopped');
    return { stopped: true };
  }
  return { stopped: false, reason: 'not_running' };
}

export function getSchedulerStatus() {
  return {
    enabled: CRON_ENABLED,
    running: scheduledJob !== null,
    schedule: CRON_SCHEDULE,
    lastRun: lastRunStatus,
    nextRun: scheduledJob ? scheduledJob.nextInvocation() : null
  };
}

export function runManualBenchmark() {
  return runNightlyBenchmark();
}
