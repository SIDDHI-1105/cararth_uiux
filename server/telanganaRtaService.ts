import axios from 'axios';
import { parse } from 'csv-parse/sync';
import { db } from './db';
import { vehicleRegistrations } from '../shared/schema';
import { sql } from 'drizzle-orm';

/**
 * Telangana RTA Data Ingestion Service
 * Fetches vehicle registration statistics from Telangana Open Data Portal
 * FREE alternative to VAHAAN API for Telangana-specific data
 */

interface TelanganaRegistrationRecord {
  year: number;
  month: number;
  state: string;
  city?: string;
  rtoCode?: string;
  brand: string;
  model: string;
  variant?: string;
  fuelType: string;
  transmission: string;
  registrationsCount: number;
}

/**
 * Download and parse Telangana vehicle registration CSV from Open Data Portal
 */
export async function downloadTelanganaRegistrationData(
  datasetUrl?: string
): Promise<TelanganaRegistrationRecord[]> {
  // Default to latest dataset URL
  const url = datasetUrl || 
    'https://data.telangana.gov.in/dataset/regional-transport-authority-vehicle-registrations-data/resource/latest.csv';

  console.log(`📥 Downloading Telangana RTA data from: ${url}`);

  try {
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'CarArth-MarketIntelligence/1.0 (research purposes)'
      }
    });

    console.log(`✅ Downloaded ${response.data.length} bytes`);

    // Parse CSV data
    const records = parse(response.data, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    console.log(`📊 Parsed ${records.length} registration records`);

    // Transform to our format
    const transformedRecords: TelanganaRegistrationRecord[] = records
      .map((record: any) => {
        // Handle different CSV column name variations
        const year = parseInt(record.Year || record.year || record.YEAR || '0');
        const month = parseInt(record.Month || record.month || record.MONTH || '0');
        const registrations = parseInt(
          record.Registrations || 
          record.registrations || 
          record.Count || 
          record.count ||
          record.REGISTRATIONS ||
          '0'
        );

        if (!year || !month || !registrations) {
          return null;
        }

        return {
          year,
          month,
          state: 'Telangana',
          city: record.District || record.district || record.City || record.city || null,
          rtoCode: record.RTO_Code || record.rto_code || record.RTOCode || null,
          brand: record.Brand || record.brand || record.Make || record.make || 'Unknown',
          model: record.Model || record.model || 'Unknown',
          variant: record.Variant || record.variant || null,
          fuelType: record.FuelType || record.fuel_type || record.Fuel || 'Petrol',
          transmission: record.Transmission || record.transmission || 'Manual',
          registrationsCount: registrations
        };
      })
      .filter(record => record !== null) as TelanganaRegistrationRecord[];

    console.log(`✅ Transformed ${transformedRecords.length} valid records`);
    return transformedRecords;

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`❌ Download failed: ${error.message}`);
      if (error.response) {
        console.error(`   Status: ${error.response.status}`);
      }
    } else {
      console.error(`❌ Error downloading Telangana data:`, error);
    }
    throw error;
  }
}

/**
 * Import Telangana registration records into database
 */
export async function importTelanganaRegistrationData(
  records: TelanganaRegistrationRecord[]
): Promise<{ inserted: number; skipped: number; errors: number }> {
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  console.log(`💾 Importing ${records.length} records to database...`);

  for (const record of records) {
    try {
      // Check if record already exists (avoid duplicates)
      const existing = await db.select()
        .from(vehicleRegistrations)
        .where(sql`
          ${vehicleRegistrations.state} = ${record.state}
          AND ${vehicleRegistrations.year} = ${record.year}
          AND ${vehicleRegistrations.month} = ${record.month}
          AND ${vehicleRegistrations.brand} = ${record.brand}
          AND ${vehicleRegistrations.model} = ${record.model}
          AND ${vehicleRegistrations.fuelType} = ${record.fuelType}
          AND ${vehicleRegistrations.transmission} = ${record.transmission}
          AND COALESCE(${vehicleRegistrations.city}, '') = COALESCE(${record.city}, '')
        `)
        .limit(1);

      if (existing.length > 0) {
        skipped++;
        continue;
      }

      // Insert new record
      await db.insert(vehicleRegistrations).values({
        state: record.state,
        city: record.city || null,
        brand: record.brand,
        model: record.model,
        variant: record.variant || null,
        fuelType: record.fuelType,
        transmission: record.transmission,
        year: record.year,
        month: record.month,
        registrationsCount: record.registrationsCount,
        dataSource: 'Telangana Open Data Portal',
        verifiedAt: new Date(),
      });

      inserted++;

      if (inserted % 100 === 0) {
        console.log(`   ✓ Inserted ${inserted} records...`);
      }

    } catch (error) {
      console.error(`   ❌ Error inserting record:`, error);
      errors++;
    }
  }

  console.log(`✅ Import complete: ${inserted} inserted, ${skipped} skipped, ${errors} errors`);

  return { inserted, skipped, errors };
}

/**
 * Get Telangana registration statistics for specific vehicle
 */
export async function getTelanganaVehicleStats(
  brand: string,
  model: string,
  city?: string
): Promise<{
  totalRegistrations: number;
  lastMonthCount: number;
  avgMonthlyCount: number;
  popularCities: { city: string; count: number }[];
  monthlyTrend: { year: number; month: number; count: number }[];
}> {
  try {
    // Get total registrations
    const totalResult = await db
      .select({
        total: sql<number>`SUM(${vehicleRegistrations.registrationsCount})::int`
      })
      .from(vehicleRegistrations)
      .where(sql`
        ${vehicleRegistrations.brand} ILIKE ${brand}
        AND ${vehicleRegistrations.model} ILIKE ${model}
        AND ${vehicleRegistrations.state} = 'Telangana'
        ${city ? sql`AND ${vehicleRegistrations.city} ILIKE ${city}` : sql``}
      `);

    const totalRegistrations = totalResult[0]?.total || 0;

    // Get last month count
    const lastMonthResult = await db
      .select({
        count: sql<number>`SUM(${vehicleRegistrations.registrationsCount})::int`
      })
      .from(vehicleRegistrations)
      .where(sql`
        ${vehicleRegistrations.brand} ILIKE ${brand}
        AND ${vehicleRegistrations.model} ILIKE ${model}
        AND ${vehicleRegistrations.state} = 'Telangana'
        AND ${vehicleRegistrations.year} = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')::int
        AND ${vehicleRegistrations.month} = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month')::int
      `);

    const lastMonthCount = lastMonthResult[0]?.count || 0;

    // Get average monthly count
    const avgResult = await db
      .select({
        avg: sql<number>`AVG(${vehicleRegistrations.registrationsCount})::int`
      })
      .from(vehicleRegistrations)
      .where(sql`
        ${vehicleRegistrations.brand} ILIKE ${brand}
        AND ${vehicleRegistrations.model} ILIKE ${model}
        AND ${vehicleRegistrations.state} = 'Telangana'
      `);

    const avgMonthlyCount = avgResult[0]?.avg || 0;

    // Get popular cities
    const citiesResult = await db
      .select({
        city: vehicleRegistrations.city,
        count: sql<number>`SUM(${vehicleRegistrations.registrationsCount})::int`
      })
      .from(vehicleRegistrations)
      .where(sql`
        ${vehicleRegistrations.brand} ILIKE ${brand}
        AND ${vehicleRegistrations.model} ILIKE ${model}
        AND ${vehicleRegistrations.state} = 'Telangana'
        AND ${vehicleRegistrations.city} IS NOT NULL
      `)
      .groupBy(vehicleRegistrations.city)
      .orderBy(sql`count DESC`)
      .limit(5);

    const popularCities = citiesResult.map(r => ({
      city: r.city || 'Unknown',
      count: r.count || 0
    }));

    // Get monthly trend (last 12 months)
    const trendResult = await db
      .select({
        year: vehicleRegistrations.year,
        month: vehicleRegistrations.month,
        count: sql<number>`SUM(${vehicleRegistrations.registrationsCount})::int`
      })
      .from(vehicleRegistrations)
      .where(sql`
        ${vehicleRegistrations.brand} ILIKE ${brand}
        AND ${vehicleRegistrations.model} ILIKE ${model}
        AND ${vehicleRegistrations.state} = 'Telangana'
        AND (
          ${vehicleRegistrations.year} > EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '12 months')::int
          OR (
            ${vehicleRegistrations.year} = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '12 months')::int
            AND ${vehicleRegistrations.month} >= EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '12 months')::int
          )
        )
      `)
      .groupBy(vehicleRegistrations.year, vehicleRegistrations.month)
      .orderBy(vehicleRegistrations.year, vehicleRegistrations.month);

    const monthlyTrend = trendResult.map(r => ({
      year: r.year,
      month: r.month,
      count: r.count || 0
    }));

    return {
      totalRegistrations,
      lastMonthCount,
      avgMonthlyCount,
      popularCities,
      monthlyTrend
    };

  } catch (error) {
    console.error('Error fetching Telangana vehicle stats:', error);
    return {
      totalRegistrations: 0,
      lastMonthCount: 0,
      avgMonthlyCount: 0,
      popularCities: [],
      monthlyTrend: []
    };
  }
}

/**
 * Run full Telangana RTA data sync
 */
export async function syncTelanganaRtaData(datasetUrl?: string) {
  console.log('🚀 Starting Telangana RTA data sync...');
  
  const startTime = Date.now();

  try {
    // Step 1: Download data
    const records = await downloadTelanganaRegistrationData(datasetUrl);

    if (records.length === 0) {
      console.log('⚠️  No records found to import');
      return { success: false, message: 'No data available' };
    }

    // Step 2: Import to database
    const result = await importTelanganaRegistrationData(records);

    const duration = Date.now() - startTime;

    console.log(`✅ Telangana RTA sync complete in ${duration}ms`);

    return {
      success: true,
      duration,
      ...result
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Telangana RTA sync failed after ${duration}ms:`, error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration
    };
  }
}
