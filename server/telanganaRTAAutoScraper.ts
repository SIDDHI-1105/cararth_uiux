import axios from 'axios';
import { rtaImportService } from './rtaImportService.js';

interface TelanganaAPIResponse {
  success: boolean;
  result?: {
    records: Array<{
      _id: number;
      Manufacturer_Name: string;
      Model_Desc: string;
      Fuel: string;
      Apprved_Dt: string;
      Transmission?: string;
    }>;
    total: number;
  };
}

export class TelanganaRTAAutoScraper {
  
  private readonly API_BASE = 'https://data.telangana.gov.in/api/action/datastore/search.json';
  
  /**
   * Fetch vehicle registration data for a specific month from Telangana Open Data Portal
   * @param year - Year (e.g., 2025)
   * @param month - Month (1-12)
   * @param resourceId - Dataset resource ID from Telangana portal
   */
  async fetchMonthData(year: number, month: number, resourceId: string): Promise<{
    success: boolean;
    message: string;
    totalRecords?: number;
  }> {
    try {
      // Build date filters for the month
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0); // Last day of month
      const endDateStr = `${year}-${String(month).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

      console.log(`Fetching Telangana RTA data for ${month}/${year} (${startDate} to ${endDateStr})`);

      let allRecords: any[] = [];
      let offset = 0;
      const limit = 1000; // API limit per request
      let hasMore = true;

      // Paginated fetch
      while (hasMore) {
        const response = await axios.get<TelanganaAPIResponse>(this.API_BASE, {
          params: {
            resource_id: resourceId,
            limit,
            offset,
          },
          timeout: 90000, // 90 second timeout (Telangana API can be slow)
        });

        if (!response.data.success || !response.data.result) {
          throw new Error('API returned unsuccessful response');
        }

        const records = response.data.result.records;
        
        // Filter by month locally (API might not support date range filters)
        const monthRecords = records.filter(record => {
          const approvalDate = record.Apprved_Dt;
          return approvalDate >= startDate && approvalDate <= endDateStr;
        });

        allRecords = allRecords.concat(monthRecords);

        console.log(`Fetched batch: ${records.length} records (${monthRecords.length} in target month)`);

        // Check if we need to continue paginating
        if (records.length < limit) {
          hasMore = false;
        } else {
          offset += limit;
        }

        // Safety limit: stop after 100k records
        if (allRecords.length > 100000) {
          console.warn('Reached safety limit of 100k records');
          break;
        }
      }

      if (allRecords.length === 0) {
        return {
          success: false,
          message: `No records found for ${month}/${year}`,
        };
      }

      // Convert to CSV format for import
      const csvHeaders = 'Manufacturer_Name,Model_Desc,Fuel,Apprved_Dt,Transmission\n';
      const csvRows = allRecords.map(record => 
        `${record.Manufacturer_Name},${record.Model_Desc},${record.Fuel},${record.Apprved_Dt},${record.Transmission || ''}`
      ).join('\n');
      const csvContent = csvHeaders + csvRows;

      // Import into database using existing service
      const importResult = await rtaImportService.importTelanganaRTACSV(csvContent, true); // Clear existing

      if (importResult.success) {
        console.log(`✅ Auto-import successful: ${importResult.message}`);
      }

      return {
        success: importResult.success,
        message: importResult.message,
        totalRecords: allRecords.length,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Telangana RTA auto-scraper error:`, errorMessage);
      
      return {
        success: false,
        message: `Auto-scraping failed: ${errorMessage}`,
      };
    }
  }

  /**
   * Fetch latest available month data
   * Tries current month, falls back to previous month if current not available
   */
  async fetchLatestMonth(resourceId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-based

    // Try current month first
    let result = await this.fetchMonthData(currentYear, currentMonth, resourceId);
    
    if (!result.success && result.message.includes('No records found')) {
      // Try previous month
      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      
      console.log(`Current month not available, trying previous month: ${prevMonth}/${prevYear}`);
      result = await this.fetchMonthData(prevYear, prevMonth, resourceId);
    }

    return result;
  }
}

export const telanganaRTAAutoScraper = new TelanganaRTAAutoScraper();
