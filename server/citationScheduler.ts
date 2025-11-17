import cron from 'node-cron';
import { geoCitationMonitor } from './geoCitationMonitor.js';

class CitationScheduler {
  private job: cron.ScheduledTask | null = null;

  start() {
    if (this.job) {
      console.log('⏭️  Citation scheduler already running');
      return;
    }

    this.job = cron.schedule('*/10 * * * *', async () => {
      console.log('⏰ Citation sweep scheduled task triggered');
      try {
        await geoCitationMonitor.runSweep();
      } catch (error) {
        console.error('❌ Scheduled citation sweep failed:', error);
      }
    });

    console.log('✅ Citation scheduler started (runs every 10 minutes)');
    
    console.log('🚀 Running initial citation sweep...');
    geoCitationMonitor.runSweep().catch(error => {
      console.error('❌ Initial citation sweep failed:', error);
    });
  }

  stop() {
    if (this.job) {
      this.job.stop();
      this.job = null;
      console.log('⏹️  Citation scheduler stopped');
    }
  }
}

export const citationScheduler = new CitationScheduler();
