import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { learnFromAudits } from './aetherLearn.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCK_FILE = path.join(__dirname, '../../../data/aether/.initial_sweep.lock');

/**
 * Scheduler for AETHER automated tasks
 */
class Scheduler {
  constructor() {
    this.cronEnabled = process.env.AETHER_CRON_ENABLED === 'true';
    this.jobs = new Map();
    this.ensureLockDirectory();
  }

  ensureLockDirectory() {
    const lockDir = path.dirname(LOCK_FILE);
    if (!fs.existsSync(lockDir)) {
      fs.mkdirSync(lockDir, { recursive: true });
    }
  }

  /**
   * Check if initial sweep has already run
   */
  hasInitialSweepRun() {
    return fs.existsSync(LOCK_FILE);
  }

  /**
   * Mark initial sweep as complete
   */
  markInitialSweepComplete() {
    try {
      const lockData = {
        completedAt: new Date().toISOString(),
        version: '1.0'
      };
      fs.writeFileSync(LOCK_FILE, JSON.stringify(lockData, null, 2));
      console.log('[Scheduler] Initial sweep marked as complete');
      return true;
    } catch (error) {
      console.error('[Scheduler] Failed to create lock file:', error);
      return false;
    }
  }

  /**
   * Clear lock file (for testing or manual re-runs)
   */
  clearLock() {
    try {
      if (fs.existsSync(LOCK_FILE)) {
        fs.unlinkSync(LOCK_FILE);
        console.log('[Scheduler] Lock file cleared');
        return true;
      }
      return false;
    } catch (error) {
      console.error('[Scheduler] Failed to clear lock file:', error);
      return false;
    }
  }

  /**
   * Run initial sweep once on startup
   */
  async runInitialSweep(sweepFunction) {
    if (this.hasInitialSweepRun()) {
      console.log('[Scheduler] Initial sweep already completed, skipping');
      return {
        skipped: true,
        reason: 'already_completed',
        lockFile: LOCK_FILE
      };
    }

    console.log('[Scheduler] Running initial sweep (one-time)...');
    
    try {
      const result = await sweepFunction();
      this.markInitialSweepComplete();
      
      return {
        success: true,
        result,
        completedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('[Scheduler] Initial sweep failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Schedule weekly sweeps (if cron enabled)
   */
  scheduleWeeklySweep(sweepFunction) {
    if (!this.cronEnabled) {
      console.log('[Scheduler] Cron disabled, weekly sweeps not scheduled');
      return false;
    }

    // Run every Sunday at 2 AM UTC
    const job = cron.schedule('0 2 * * 0', async () => {
      console.log('[Scheduler] Running weekly sweep...');
      try {
        await sweepFunction();
        console.log('[Scheduler] Weekly sweep completed');
      } catch (error) {
        console.error('[Scheduler] Weekly sweep failed:', error);
      }
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    this.jobs.set('weekly_sweep', job);
    console.log('[Scheduler] Weekly sweep scheduled for Sundays at 2 AM UTC');
    return true;
  }

  /**
   * Schedule custom cron job
   */
  scheduleJob(name, cronExpression, jobFunction) {
    if (!this.cronEnabled) {
      console.log(`[Scheduler] Cron disabled, job "${name}" not scheduled`);
      return false;
    }

    try {
      const job = cron.schedule(cronExpression, async () => {
        console.log(`[Scheduler] Running job: ${name}`);
        try {
          await jobFunction();
          console.log(`[Scheduler] Job "${name}" completed`);
        } catch (error) {
          console.error(`[Scheduler] Job "${name}" failed:`, error);
        }
      }, {
        scheduled: true,
        timezone: 'UTC'
      });

      this.jobs.set(name, job);
      console.log(`[Scheduler] Job "${name}" scheduled with cron: ${cronExpression}`);
      return true;
    } catch (error) {
      console.error(`[Scheduler] Failed to schedule job "${name}":`, error);
      return false;
    }
  }

  /**
   * Stop a scheduled job
   */
  stopJob(name) {
    const job = this.jobs.get(name);
    if (job) {
      job.stop();
      this.jobs.delete(name);
      console.log(`[Scheduler] Stopped job: ${name}`);
      return true;
    }
    return false;
  }

  /**
   * Stop all jobs
   */
  stopAll() {
    for (const [name, job] of this.jobs.entries()) {
      job.stop();
      console.log(`[Scheduler] Stopped job: ${name}`);
    }
    this.jobs.clear();
    return true;
  }

  /**
   * Schedule weekly AETHER learning updates
   */
  scheduleWeeklyLearning() {
    if (!process.env.AETHER_LEARNING_MODE === 'true') {
      console.log('[Scheduler] AETHER_LEARNING_MODE not enabled, weekly learning not scheduled');
      return false;
    }

    if (!this.cronEnabled) {
      console.log('[Scheduler] Cron disabled, weekly learning not scheduled');
      return false;
    }

    // Run every Monday at 3 AM UTC
    const job = cron.schedule('0 3 * * 1', async () => {
      console.log('[AETHER_LEARN] Running scheduled weekly update');
      try {
        learnFromAudits();
        console.log('[AETHER_LEARN] Weekly learning update completed');
      } catch (error) {
        console.error('[AETHER_LEARN] Weekly learning update failed:', error);
      }
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    this.jobs.set('aether_weekly_learning', job);
    console.log('[Scheduler] AETHER weekly learning scheduled for Mondays at 3 AM UTC');
    return true;
  }

  /**
   * Get status of all jobs
   */
  getStatus() {
    const jobs = [];
    for (const [name, job] of this.jobs.entries()) {
      jobs.push({
        name,
        running: job.getStatus() === 'running'
      });
    }

    return {
      cronEnabled: this.cronEnabled,
      initialSweepCompleted: this.hasInitialSweepRun(),
      lockFile: LOCK_FILE,
      activeJobs: jobs.length,
      jobs
    };
  }
}

// Export singleton instance
export const scheduler = new Scheduler();

// Auto-schedule AETHER learning if enabled
if (process.env.AETHER_LEARNING_MODE === 'true') {
  scheduler.scheduleWeeklyLearning();
  console.log('[AETHER_LEARN] ✅ AETHER LEARNING MODE ENABLED');
}
