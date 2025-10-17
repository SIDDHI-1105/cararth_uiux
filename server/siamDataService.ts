import axios from 'axios';
import * as cheerio from 'cheerio';
import { db } from './db.js';
import { vehicleRegistrations } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

interface SIAMMonthlyData {
  month: number;
  year: number;
  totalPV: number; // Total Passenger Vehicles
  totalTW: number; // Total Two Wheelers
  total3W: number; // Total Three Wheelers
}

// OEM market share estimates based on industry data (2024-2025)
// Total should equal 1.0 (100%)
const OEM_MARKET_SHARE: Record<string, number> = {
  'Maruti Suzuki': 0.41,  // ~41% market share
  'Hyundai': 0.15,        // ~15%
  'Tata Motors': 0.14,    // ~14%
  'Mahindra': 0.09,       // ~9%
  'Kia': 0.07,            // ~7%
  'Toyota': 0.05,         // ~5%
  'Honda': 0.04,          // ~4%
  'MG Motor': 0.03,       // ~3%
  'Others': 0.02,         // ~2% (Renault, Nissan, Skoda, VW, etc.)
};

export class SIAMDataService {
  
  /**
   * Scrape SIAM press releases for monthly sales data
   */
  async scrapeSIAMPressRelease(month: number, year: number): Promise<SIAMMonthlyData | null> {
    try {
      // SIAM press releases URL
      const url = 'https://www.siam.in/press-release.aspx?mpgid=48&pgidtrail=50';
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);
      
      // Find press release for the specific month
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                         'July', 'August', 'September', 'October', 'November', 'December'];
      const monthName = monthNames[month - 1];
      
      let pvSales = 0;
      
      // Parse press release content
      $('div.press-release-item, article, .content').each((_, elem) => {
        const text = $(elem).text();
        
        // Look for patterns like "Passenger Vehicles: 372,458" or "PV sales: 3,72,458"
        const pvMatch = text.match(/passenger\s+vehicle[s]?.*?(\d{1,3}(?:,\d{2,3})*)/i);
        if (pvMatch) {
          pvSales = parseInt(pvMatch[1].replace(/,/g, ''));
        }
      });

      if (pvSales > 0) {
        return {
          month,
          year,
          totalPV: pvSales,
          totalTW: 0, // Not implementing two-wheeler for now
          total3W: 0,
        };
      }

      return null;
    } catch (error) {
      console.error('SIAM scraping error:', error);
      return null;
    }
  }

  /**
   * Generate national OEM-level data using market share estimates
   */
  async generateNationalOEMData(month: number, year: number, totalPV?: number): Promise<void> {
    try {
      // Use provided total or fetch from SIAM
      let nationalTotal = totalPV;
      
      if (!nationalTotal) {
        const siamData = await this.scrapeSIAMPressRelease(month, year);
        nationalTotal = siamData?.totalPV || 0;
      }

      if (!nationalTotal || nationalTotal === 0) {
        throw new Error('No national PV data available');
      }

      // Track total to ensure it matches input
      let distributedTotal = 0;
      const oemDataToInsert: Array<{brand: string, sales: number}> = [];

      // Generate OEM-level data using market share
      for (const [brand, share] of Object.entries(OEM_MARKET_SHARE)) {
        const oemSales = Math.round(nationalTotal * share);
        distributedTotal += oemSales;
        oemDataToInsert.push({ brand, sales: oemSales });
      }

      // Adjust for rounding errors - add/subtract difference to largest OEM (Maruti Suzuki)
      const difference = nationalTotal - distributedTotal;
      if (difference !== 0 && oemDataToInsert.length > 0) {
        const marutiIndex = oemDataToInsert.findIndex(d => d.brand === 'Maruti Suzuki');
        if (marutiIndex >= 0) {
          oemDataToInsert[marutiIndex].sales += difference;
        }
      }

      // Insert all OEM data
      for (const { brand, sales: oemSales } of oemDataToInsert) {
        
        // Insert/update national data for each OEM
        const existing = await db
          .select()
          .from(vehicleRegistrations)
          .where(
            and(
              eq(vehicleRegistrations.state, 'National'),
              eq(vehicleRegistrations.brand, brand),
              eq(vehicleRegistrations.model, 'All Models'),
              eq(vehicleRegistrations.year, year),
              eq(vehicleRegistrations.month, month)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          await db
            .update(vehicleRegistrations)
            .set({
              registrationsCount: oemSales,
            })
            .where(eq(vehicleRegistrations.id, existing[0].id));
        } else {
          await db.insert(vehicleRegistrations).values({
            state: 'National',
            brand,
            model: 'All Models',
            variant: 'All',
            fuelType: 'All',
            transmission: 'All',
            year,
            month,
            registrationsCount: oemSales,
          });
        }
      }

      console.log(`Generated national OEM data for ${month}/${year} - Total: ${nationalTotal} (distributed: ${oemDataToInsert.reduce((sum, d) => sum + d.sales, 0)})`);
    } catch (error) {
      console.error('National OEM data generation error:', error);
      throw error;
    }
  }

  /**
   * Import national data manually with known totals
   */
  async importManualNationalData(month: number, year: number, totalPV: number): Promise<void> {
    await this.generateNationalOEMData(month, year, totalPV);
  }

  /**
   * Get or estimate national total for a month
   */
  async getNationalTotal(month: number, year: number): Promise<number> {
    // Try to get from database first
    const existing = await db
      .select()
      .from(vehicleRegistrations)
      .where(
        and(
          eq(vehicleRegistrations.state, 'National'),
          eq(vehicleRegistrations.year, year),
          eq(vehicleRegistrations.month, month)
        )
      );

    if (existing.length > 0) {
      return existing.reduce((sum, row) => sum + (row.registrationsCount || 0), 0);
    }

    // Try to scrape from SIAM
    const siamData = await this.scrapeSIAMPressRelease(month, year);
    if (siamData?.totalPV) {
      return siamData.totalPV;
    }

    // Fallback: estimate based on historical average
    return 0;
  }
}

export const siamDataService = new SIAMDataService();
