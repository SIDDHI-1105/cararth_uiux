/**
 * Internal Scheduler for Batch Ingestion
 * Temporary solution until external cron services are set up
 */

export class InternalScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * Start the scheduler to run batch ingestion twice daily
   * Runs at 6 AM and 6 PM IST (12:30 AM and 12:30 PM UTC)
   */
  start() {
    if (this.isRunning) {
      console.log('⏰ Scheduler already running');
      return;
    }

    this.isRunning = true;
    console.log('⏰ Internal scheduler started - will run batch ingestion twice daily');
    
    // Check every hour if it's time to run
    this.intervalId = setInterval(() => {
      this.checkAndRunIngestion();
    }, 60 * 60 * 1000); // Check every hour

    // Also run immediately if it's been more than 12 hours since last run
    this.checkAndRunIngestion();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      console.log('⏰ Internal scheduler stopped');
    }
  }

  private async checkAndRunIngestion() {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const istTime = new Date(now.getTime() + istOffset);
    const hour = istTime.getHours();
    
    // Run at 6 AM and 6 PM IST (approximately)
    const shouldRun = (hour === 6 || hour === 18) && istTime.getMinutes() < 30;
    
    if (shouldRun) {
      console.log('⏰ Scheduled batch ingestion triggered at', istTime.toISOString());
      
      try {
        // Import and run batch ingestion
        const { batchIngestionService } = await import('./batchIngestion.js');
        const status = batchIngestionService.getStatus();
        
        if (!status.isIngesting) {
          const cities = ['hyderabad', 'bangalore', 'mumbai', 'delhi', 'pune', 'chennai'];
          await batchIngestionService.runIngestion(cities);
          console.log('✅ Scheduled batch ingestion completed successfully');
        } else {
          console.log('⏳ Batch ingestion already in progress, skipping scheduled run');
        }
      } catch (error) {
        console.error('❌ Scheduled batch ingestion failed:', error);
      }
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      nextCheck: this.isRunning ? 'Every hour' : 'Stopped'
    };
  }
}

// Export singleton instance
export const internalScheduler = new InternalScheduler();