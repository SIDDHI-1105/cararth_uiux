/**
 * VAHAN National Data Ingestion Service
 * Fetches vehicle registration data from data.gov.in
 * Calculates Rest of India (ROI) by subtracting Telangana
 */

import axios from 'axios';
import { parse } from 'csv-parse/sync';
import { db } from './db';
import { vehicleRegistrations } from '../shared/schema';
import { sql, and, eq } from 'drizzle-orm';

interface VahanRegistrationRecord {
  year: number;
  month: number;
  state: string;
  vehicleClass: string;
  fuelType: string;
  count: number;
}

/**
 * Fetch and parse VAHAN national registration data from data.gov.in
 */
export async function downloadVahanNationalData(
  datasetUrl?: string
): Promise<VahanRegistrationRecord[]> {
  // Default to latest VAHAN dataset
  const url = datasetUrl || 
    'https://www.data.gov.in/sites/default/files/resource/year_wise_number_registered_electric_vehicles_e_vahan_portal_2019_20_2023_24.csv';

  console.log(`📥 Downloading VAHAN national data from: ${url}`);

  try {
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'CarArth-MarketIntelligence/1.0'
      }
    });

    console.log(`✅ Downloaded ${response.data.length} bytes`);

    // Parse CSV
    const records = parse(response.data, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    console.log(`📊 Parsed ${records.length} VAHAN records`);

    // Transform to our format
    const transformedRecords: VahanRegistrationRecord[] = records
      .map((record: any) => {
        const year = parseInt(record.Year || record.year || '0');
        const month = parseInt(record.Month || record.month || '0') || 1; // Default to Jan if not specified
        const count = parseInt(
          record.Count || 
          record.count ||
          record.Registrations ||
          record.registrations ||
          '0'
        );

        if (!year || !count) {
          return null;
        }

        return {
          year,
          month,
          state: record.State || record.state || 'National',
          vehicleClass: record.VehicleClass || record.vehicle_class || 'Passenger',
          fuelType: record.FuelType || record.fuel_type || 'All',
          count
        };
      })
      .filter(record => record !== null) as VahanRegistrationRecord[];

    console.log(`✅ Transformed ${transformedRecords.length} valid VAHAN records`);
    return transformedRecords;

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`❌ VAHAN download failed: ${error.message}`);
    } else {
      console.error(`❌ Error downloading VAHAN data:`, error);
    }
    throw error;
  }
}

/**
 * Calculate Rest of India (ROI) registrations by subtracting Telangana
 */
export async function calculateROIRegistrations(
  year: number,
  month: number,
  brand?: string,
  model?: string
): Promise<number> {
  try {
    // Build where conditions
    const conditions = [
      eq(vehicleRegistrations.year, year),
      eq(vehicleRegistrations.month, month),
      sql`${vehicleRegistrations.state} != 'Telangana'`
    ];

    if (brand) {
      conditions.push(eq(vehicleRegistrations.brand, brand));
    }
    if (model) {
      conditions.push(eq(vehicleRegistrations.model, model));
    }

    // Get national total from vehicleRegistrations
    const result = await db
      .select({
        total: sql<number>`SUM(${vehicleRegistrations.registrationsCount})::int`
      })
      .from(vehicleRegistrations)
      .where(and(...conditions));

    const roiTotal = result[0]?.total || 0;

    console.log(`📊 ROI registrations for ${year}-${month}: ${roiTotal}`);
    return roiTotal;

  } catch (error) {
    console.error('❌ Error calculating ROI registrations:', error);
    return 0;
  }
}

/**
 * Get ROI average sales per dealership (proxy: ROI total / 100 dealers)
 */
export async function getROIAverageSalesPerDealer(
  year: number,
  month: number,
  brand?: string
): Promise<number> {
  const roiTotal = await calculateROIRegistrations(year, month, brand);
  // Assuming ~100 major dealers across Rest of India (conservative estimate)
  const avgPerDealer = roiTotal / 100;
  return Math.round(avgPerDealer);
}

/**
 * Import VAHAN data and calculate ROI benchmarks
 */
export async function importVahanData(
  records: VahanRegistrationRecord[]
): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0;
  let skipped = 0;

  console.log(`💾 Importing ${records.length} VAHAN records...`);

  for (const record of records) {
    try {
      // Check if exists
      const existing = await db.select()
        .from(vehicleRegistrations)
        .where(
          and(
            eq(vehicleRegistrations.year, record.year),
            eq(vehicleRegistrations.month, record.month),
            eq(vehicleRegistrations.state, record.state),
            eq(vehicleRegistrations.dataSource, 'VAHAN')
          )
        )
        .limit(1);

      if (existing.length > 0) {
        skipped++;
        continue;
      }

      // Insert new record
      await db.insert(vehicleRegistrations).values({
        state: record.state,
        city: null,
        brand: 'All', // VAHAN data is often aggregated
        model: 'All',
        variant: null,
        fuelType: record.fuelType,
        transmission: 'All',
        year: record.year,
        month: record.month,
        registrationsCount: record.count,
        dataSource: 'VAHAN',
        verifiedAt: new Date()
      });

      inserted++;

    } catch (error) {
      console.error(`❌ Error importing VAHAN record:`, error);
    }
  }

  console.log(`✅ VAHAN import complete: ${inserted} inserted, ${skipped} skipped`);
  return { inserted, skipped };
}

/**
 * Main sync function - downloads and imports VAHAN data
 */
export async function syncVahanData(datasetUrl?: string): Promise<{
  success: boolean;
  inserted?: number;
  skipped?: number;
  error?: string;
}> {
  try {
    const records = await downloadVahanNationalData(datasetUrl);
    const result = await importVahanData(records);
    
    return {
      success: true,
      ...result
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
