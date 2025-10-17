import { telanganaRTAAutoScraper } from './telanganaRTAAutoScraper.js';
import { siamAutoScraper } from './siamAutoScraper.js';
import schedule from 'node-schedule';

/**
 * Automated data import service
 * Runs scheduled imports for Telangana RTA and SIAM data
 */
export class DataAutoImportService {
  
  private telanganaResourceId: string | null = null;
  private isScheduled: boolean = false;

  /**
   * Configure Telangana RTA resource ID
   * Get this from: https://data.telangana.gov.in/dataset/regional-transport-authority-vehicle-registrations-data
   */
  setTelanganaResourceId(resourceId: string) {
    this.telanganaResourceId = resourceId;
    console.log(`✅ Telangana RTA resource ID configured: ${resourceId}`);
  }

  /**
   * Run complete monthly import (both Telangana RTA + SIAM)
   */
  async runMonthlyImport(): Promise<{
    success: boolean;
    telanganaResult?: any;
    siamResult?: any;
    errors: string[];
  }> {
    console.log('🔄 Starting automated monthly import...');
    
    const errors: string[] = [];
    let telanganaResult: any;
    let siamResult: any;

    // Import Telangana RTA data
    if (this.telanganaResourceId) {
      try {
        telanganaResult = await telanganaRTAAutoScraper.fetchLatestMonth(this.telanganaResourceId);
        if (!telanganaResult.success) {
          errors.push(`Telangana: ${telanganaResult.message}`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Telangana import failed: ${message}`);
      }
    } else {
      errors.push('Telangana resource ID not configured');
    }

    // Import SIAM data
    try {
      siamResult = await siamAutoScraper.scrapeLatestPressRelease();
      if (!siamResult.success) {
        errors.push(`SIAM: ${siamResult.message}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`SIAM import failed: ${message}`);
    }

    const success = errors.length === 0;
    
    if (success) {
      console.log('✅ Automated monthly import completed successfully');
    } else {
      console.error('❌ Automated import completed with errors:', errors);
    }

    return {
      success,
      telanganaResult,
      siamResult,
      errors,
    };
  }

  /**
   * Import specific month data
   */
  async importSpecificMonth(month: number, year: number): Promise<{
    success: boolean;
    telanganaResult?: any;
    siamResult?: any;
    errors: string[];
  }> {
    console.log(`🔄 Importing data for ${month}/${year}...`);
    
    const errors: string[] = [];
    let telanganaResult: any;
    let siamResult: any;

    // Import Telangana RTA data
    if (this.telanganaResourceId) {
      try {
        telanganaResult = await telanganaRTAAutoScraper.fetchMonthData(year, month, this.telanganaResourceId);
        if (!telanganaResult.success) {
          errors.push(`Telangana: ${telanganaResult.message}`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Telangana import failed: ${message}`);
      }
    } else {
      errors.push('Telangana resource ID not configured');
    }

    // Import SIAM data
    try {
      siamResult = await siamAutoScraper.scrapeMonthData(month, year);
      if (!siamResult.success) {
        errors.push(`SIAM: ${siamResult.message}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`SIAM import failed: ${message}`);
    }

    const success = errors.length === 0;
    
    if (success) {
      console.log(`✅ Import for ${month}/${year} completed successfully`);
    } else {
      console.error(`❌ Import for ${month}/${year} completed with errors:`, errors);
    }

    return {
      success,
      telanganaResult,
      siamResult,
      errors,
    };
  }

  /**
   * Schedule automatic imports
   * Runs on the 5th of each month at 2 AM IST (imports previous month data)
   */
  startScheduledImports() {
    if (this.isScheduled) {
      console.log('⚠️ Scheduled imports already running');
      return;
    }

    // Run on 5th of month at 2:00 AM IST (20:30 UTC previous day)
    const cronExpression = '30 20 4 * *'; // Day 4, 8:30 PM UTC = Day 5, 2:00 AM IST
    
    schedule.scheduleJob(cronExpression, async () => {
      console.log('⏰ Scheduled monthly import triggered');
      await this.runMonthlyImport();
    });

    this.isScheduled = true;
    console.log('✅ Scheduled imports started (runs 5th of each month at 2 AM IST)');
  }

  /**
   * Stop scheduled imports
   */
  stopScheduledImports() {
    schedule.gracefulShutdown().then(() => {
      this.isScheduled = false;
      console.log('🛑 Scheduled imports stopped');
    });
  }
}

export const dataAutoImportService = new DataAutoImportService();
