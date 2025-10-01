/**
 * Internal Scheduler for Batch Ingestion - Cost-Optimized Workflow
 * Runs Firecrawl caching at 11AM & 11PM IST for lean operation
 * Configurable via CACHE_TIMES_IST environment variable
 */

export class InternalScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private isExecuting = false;
  private lastRunTimes = new Map<number, string>(); // hour -> ISO date

  /**
   * Start the scheduler to run batch ingestion twice daily
   * Runs at 11 AM and 11 PM IST (configurable via CACHE_TIMES_IST)
   * Default: 11:00,23:00 for cost-optimized lean workflow
   */
  start() {
    if (this.isRunning) {
      console.log('⏰ Scheduler already running');
      return;
    }

    this.isRunning = true;
    const cacheTimesIST = this.getCacheSchedule();
    console.log(`⏰ Internal scheduler started - will run batch ingestion at ${cacheTimesIST.join(' & ')} IST`);
    
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

  private getCacheSchedule(): string[] {
    const cacheTimesEnv = process.env.CACHE_TIMES_IST || '11:00,23:00';
    const times = cacheTimesEnv.split(',').map(time => time.trim());
    
    // Validate time format
    const validTimes = times.filter(time => {
      const match = time.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
      if (!match) {
        console.warn(`⚠️ Invalid time format in CACHE_TIMES_IST: '${time}'. Expected HH:MM format.`);
        return false;
      }
      return true;
    });
    
    if (validTimes.length === 0) {
      console.warn('⚠️ No valid times found in CACHE_TIMES_IST, falling back to default: 11:00,23:00');
      return ['11:00', '23:00'];
    }
    
    return validTimes;
  }

  private getScheduleHours(): number[] {
    const times = this.getCacheSchedule();
    return times.map(time => parseInt(time.split(':')[0]));
  }
  
  private getISTTime(): { hour: number; minute: number; date: Date } {
    // Use timezone-aware calculation for IST
    const now = new Date();
    const istTimeString = now.toLocaleString('en-US', {
      timeZone: 'Asia/Kolkata',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const [hour, minute] = istTimeString.split(':').map(num => parseInt(num));
    
    // Get full IST date for comparison
    const istDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    
    return { hour, minute, date: istDate };
  }

  private async checkAndRunIngestion() {
    // Prevent concurrent executions
    if (this.isExecuting) {
      console.log('⏳ Ingestion already executing, skipping check');
      return;
    }
    
    const { hour, minute, date: istTime } = this.getISTTime();
    const todayKey = istTime.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Check if current time matches any configured schedule (within ±5 minutes)
    const cacheSchedule = this.getCacheSchedule();
    let shouldRun = false;
    let matchedTime: string | null = null;
    
    for (const timeStr of cacheSchedule) {
      const [scheduleHour, scheduleMinute] = timeStr.split(':').map(num => parseInt(num));
      const timeDiffMinutes = Math.abs((hour * 60 + minute) - (scheduleHour * 60 + scheduleMinute));
      
      // Run within ±5 minutes of scheduled time
      if (timeDiffMinutes <= 5) {
        // Check if we already ran today for this hour
        const lastRun = this.lastRunTimes.get(scheduleHour);
        if (lastRun !== todayKey) {
          shouldRun = true;
          matchedTime = timeStr;
          break;
        }
      }
    }
    
    if (shouldRun && matchedTime) {
      this.isExecuting = true;
      const scheduleHour = parseInt(matchedTime.split(':')[0]);
      
      console.log(`⏰ Firecrawl cache refresh triggered at ${matchedTime} IST (${istTime.toISOString()})`);
      
      try {
        // Use new orchestrated ingestion for cost-optimized workflow
        const pipelineMode = process.env.AI_PIPELINE_MODE || 'lean_v1';
        console.log(`🔄 Running ${pipelineMode} ingestion pipeline`);
        
        if (pipelineMode === 'lean_v1') {
          // Import and run orchestrated ingestion with status check
          const { orchestratedBatchIngestion } = await import('./orchestratedIngestion.js');
          const status = orchestratedBatchIngestion.getSystemStatus();
          
          if (!status.isRunning) {
            const cities = ['hyderabad', 'bangalore', 'mumbai', 'delhi', 'pune', 'chennai'];
            await orchestratedBatchIngestion.runIngestion(cities);
            console.log('✅ Orchestrated lean ingestion completed successfully');
          } else {
            console.log('⏳ Orchestrated ingestion already in progress, skipping scheduled run');
          }
        } else {
          // Fallback to legacy batch ingestion
          const { batchIngestionService } = await import('./batchIngestion.js');
          const status = batchIngestionService.getStatus();
          
          if (!status.isIngesting) {
            const cities = ['hyderabad', 'bangalore', 'mumbai', 'delhi', 'pune', 'chennai'];
            await batchIngestionService.runIngestion(cities);
            console.log('✅ Legacy batch ingestion completed successfully');
          } else {
            console.log('⏳ Batch ingestion already in progress, skipping scheduled run');
          }
        }
        
        // Run forum/marketplace scraping once daily (first scheduled time only)
        if (scheduleHour === this.getScheduleHours()[0]) {
          const { DatabaseStorage } = await import('./dbStorage.js');
          const storage = new DatabaseStorage();
          
          // Team-BHP classifieds
          try {
            const { teamBhpScraper } = await import('./teamBhpScraper.js');
            const result = await teamBhpScraper.scrapeLatestListings(storage.db);
            console.log(`✅ Team-BHP scraping: ${result.newListings} new listings from owner forums`);
          } catch (error) {
            console.error('❌ Team-BHP scraping failed:', error);
          }
          
          // TheAutomotiveIndia marketplace
          try {
            const { automotiveIndiaScraper } = await import('./automotiveIndiaScraper.js');
            const result = await automotiveIndiaScraper.scrapeLatestListings(storage.db);
            console.log(`✅ TheAutomotiveIndia scraping: ${result.newListings} new listings from marketplace`);
          } catch (error) {
            console.error('❌ TheAutomotiveIndia scraping failed:', error);
          }
        }
        
        // Mark this hour as executed for today
        this.lastRunTimes.set(scheduleHour, todayKey);
        
      } catch (error) {
        console.error('❌ Scheduled ingestion failed:', error);
      } finally {
        this.isExecuting = false;
      }
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      nextCheck: this.isRunning ? 'Every hour' : 'Stopped',
      cacheSchedule: this.getCacheSchedule(),
      scheduleHours: this.getScheduleHours(),
      pipelineMode: process.env.AI_PIPELINE_MODE || 'lean_v1'
    };
  }
}

// Export singleton instance
export const internalScheduler = new InternalScheduler();