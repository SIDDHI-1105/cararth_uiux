import axios from 'axios';
import * as cheerio from 'cheerio';
import { siamDataService } from './siamDataService.js';

interface SIAMData {
  month: number;
  year: number;
  pvSales: number;
  pressReleaseId: number;
}

export class SIAMAutoScraper {
  
  private readonly PRESS_RELEASE_BASE = 'https://www.siam.in/pressrelease-details.aspx';
  private readonly PRESS_RELEASE_LIST = 'https://www.siam.in/press-release.aspx?mpgid=48&pgidtrail=50';
  
  /**
   * Scrape latest SIAM press release for PV sales data
   */
  async scrapeLatestPressRelease(): Promise<{
    success: boolean;
    message: string;
    data?: SIAMData;
  }> {
    try {
      console.log('Fetching latest SIAM press release...');

      // Fetch press release list page
      const listResponse = await axios.get(this.PRESS_RELEASE_LIST, {
        timeout: 30000,
      });

      const $ = cheerio.load(listResponse.data);
      
      // Find the latest press release link
      // Pattern: pressrelease-details.aspx?mpgid=48&pgidtrail=50&pid=XXX
      const latestLink = $('a[href*="pressrelease-details.aspx"]').first().attr('href');
      
      if (!latestLink) {
        throw new Error('Could not find latest press release link');
      }

      // Extract PID from URL
      const pidMatch = latestLink.match(/pid=(\d+)/);
      if (!pidMatch) {
        throw new Error('Could not extract press release ID');
      }

      const pid = parseInt(pidMatch[1]);
      console.log(`Found latest press release: PID ${pid}`);

      // Fetch the press release details
      return await this.scrapePressReleaseByPID(pid);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('SIAM auto-scraper error:', errorMessage);
      
      return {
        success: false,
        message: `Auto-scraping failed: ${errorMessage}`,
      };
    }
  }

  /**
   * Scrape specific press release by PID
   */
  async scrapePressReleaseByPID(pid: number): Promise<{
    success: boolean;
    message: string;
    data?: SIAMData;
  }> {
    try {
      const url = `${this.PRESS_RELEASE_BASE}?mpgid=48&pgidtrail=50&pid=${pid}`;
      console.log(`Fetching press release: ${url}`);

      const response = await axios.get(url, {
        timeout: 30000,
      });

      const $ = cheerio.load(response.data);
      const content = $('body').text();

      // Extract month and year from title or content
      // Pattern: "August 2025" or "August-2025"
      const monthYearMatch = content.match(/(?:Auto Industry Performance of|Monthly Performance:)\s*([A-Za-z]+)[\s-]?(\d{4})/i);
      
      if (!monthYearMatch) {
        throw new Error('Could not extract month/year from press release');
      }

      const monthName = monthYearMatch[1];
      const year = parseInt(monthYearMatch[2]);
      
      const monthMap: Record<string, number> = {
        'january': 1, 'february': 2, 'march': 3, 'april': 4, 
        'may': 5, 'june': 6, 'july': 7, 'august': 8,
        'september': 9, 'october': 10, 'november': 11, 'december': 12
      };
      
      const month = monthMap[monthName.toLowerCase()];
      if (!month) {
        throw new Error(`Could not parse month: ${monthName}`);
      }

      // Extract PV sales number
      // Pattern: "Passenger Vehicles sales were 3,21,840 units"
      // Or: "without Tata Motors, 'Total PV' would be 2,80,839"
      const pvMatch = content.match(/Passenger Vehicles.*?were\s+([\d,]+)\s+units/i) ||
                     content.match(/Total PV.*?(\d{1,2},\d{2},\d{3})/i) ||
                     content.match(/PV.*?(\d{1,2},\d{2},\d{3})/i);

      if (!pvMatch) {
        throw new Error('Could not extract PV sales number from press release');
      }

      const pvSalesStr = pvMatch[1].replace(/,/g, '');
      const pvSales = parseInt(pvSalesStr);

      if (isNaN(pvSales) || pvSales === 0) {
        throw new Error(`Invalid PV sales number: ${pvSalesStr}`);
      }

      console.log(`✅ Extracted: ${monthName} ${year} - PV Sales: ${pvSales.toLocaleString()}`);

      // Import into database
      const importResult = await siamDataService.generateNationalOEMData(month, year, pvSales);

      return {
        success: true,
        message: `Successfully imported SIAM data for ${monthName} ${year}: ${pvSales.toLocaleString()} PV units`,
        data: {
          month,
          year,
          pvSales,
          pressReleaseId: pid,
        },
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Press release scraping error:', errorMessage);
      
      return {
        success: false,
        message: `Scraping failed: ${errorMessage}`,
      };
    }
  }

  /**
   * Scrape specific month/year press release
   * Searches press release list for matching title
   */
  async scrapeMonthData(month: number, year: number): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const monthNames = [
        '', 'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];

      const targetMonthName = monthNames[month];
      console.log(`Searching for press release: ${targetMonthName} ${year}`);

      // Fetch press release list
      const listResponse = await axios.get(this.PRESS_RELEASE_LIST, {
        timeout: 30000,
      });

      const $ = cheerio.load(listResponse.data);
      
      // Find matching press release link
      let foundPID: number | null = null;
      
      $('a[href*="pressrelease-details.aspx"]').each((_, element) => {
        const text = $(element).text().trim();
        const href = $(element).attr('href') || '';
        
        // Check if title matches target month/year
        if (text.toLowerCase().includes(targetMonthName.toLowerCase()) && 
            text.includes(String(year))) {
          const pidMatch = href.match(/pid=(\d+)/);
          if (pidMatch) {
            foundPID = parseInt(pidMatch[1]);
            return false; // Break loop
          }
        }
      });

      if (!foundPID) {
        return {
          success: false,
          message: `No press release found for ${targetMonthName} ${year}`,
        };
      }

      // Scrape the found press release
      const result = await this.scrapePressReleaseByPID(foundPID);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Month data scraping error:', errorMessage);
      
      return {
        success: false,
        message: `Scraping failed: ${errorMessage}`,
      };
    }
  }
}

export const siamAutoScraper = new SIAMAutoScraper();
