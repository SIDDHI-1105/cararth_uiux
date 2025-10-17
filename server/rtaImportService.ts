import { parse } from 'csv-parse/sync';
import { db } from './db.js';
import { vehicleRegistrations } from '@shared/schema';
import { sql, eq, and } from 'drizzle-orm';

interface TelanganaRTARow {
  Manufacturer_Name: string;
  Model_Desc: string;
  Fuel: string;
  Colour?: string;
  Make_Yr?: string;
  Apprved_Dt: string; // Date string like "2024-09-15" or "15-SEP-24"
  OfficeCd?: string;
  Transmission?: string; // May or may not exist
}

interface AggregatedRegistration {
  state: string;
  brand: string;
  model: string;
  variant: string;
  fuelType: string;
  transmission: string;
  year: number;
  month: number;
  count: number;
}

// Brand normalization - combines sub-brands into parent brands
const BRAND_MAPPING: Record<string, string> = {
  'TATA MOTORS': 'Tata Motors',
  'TATA': 'Tata Motors',
  'TATA SOLANIS': 'Tata Motors', // EV sub-brand
  'TATA PASSENGER ELECTRIC MOBILITY': 'Tata Motors',
  'MAHINDRA': 'Mahindra',
  'MAHINDRA ELECTRIC': 'Mahindra', // EV sub-brand
  'MAHINDRA & MAHINDRA': 'Mahindra',
  'MARUTI SUZUKI': 'Maruti Suzuki',
  'MARUTI': 'Maruti Suzuki',
  'HYUNDAI': 'Hyundai',
  'KIA': 'Kia',
  'TOYOTA': 'Toyota',
  'HONDA': 'Honda',
  'MG MOTOR': 'MG Motor',
  'MG': 'MG Motor',
  'RENAULT': 'Renault',
  'NISSAN': 'Nissan',
  'VOLKSWAGEN': 'Volkswagen',
  'VW': 'Volkswagen',
  'SKODA': 'Skoda',
  'FORD': 'Ford',
  'CITROEN': 'Citroen',
  'JEEP': 'Jeep',
  'BYD': 'BYD',
};

// Fuel type normalization
const FUEL_MAPPING: Record<string, string> = {
  'PETROL': 'Petrol',
  'DIESEL': 'Diesel',
  'CNG': 'CNG',
  'ELECTRIC': 'Electric',
  'HYBRID': 'Hybrid',
  'LPG': 'LPG',
};

// Transmission normalization
const TRANSMISSION_MAPPING: Record<string, string> = {
  'MANUAL': 'Manual',
  'AUTOMATIC': 'Automatic',
  'AMT': 'Automatic',
  'CVT': 'Automatic',
  'DCT': 'Automatic',
};

export class RTAImportService {
  
  /**
   * Parse Telangana RTA CSV and import into database
   */
  async importTelanganaRTACSV(csvContent: string): Promise<{
    success: boolean;
    message: string;
    stats: {
      totalRows: number;
      imported: number;
      skipped: number;
      errors: string[];
    };
  }> {
    try {
      // Parse CSV
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as TelanganaRTARow[];

      const stats = {
        totalRows: records.length,
        imported: 0,
        skipped: 0,
        errors: [] as string[],
      };

      // Aggregate by brand/model/month/year
      const aggregationMap = new Map<string, AggregatedRegistration>();

      for (const row of records) {
        try {
          // Parse approval date
          const date = this.parseDate(row.Apprved_Dt);
          if (!date) {
            stats.skipped++;
            continue;
          }

          // Normalize brand
          const rawBrand = (row.Manufacturer_Name || '').trim().toUpperCase();
          const brand = BRAND_MAPPING[rawBrand] || this.titleCase(rawBrand);
          
          if (!brand || brand.length < 2) {
            stats.skipped++;
            continue;
          }

          // Normalize fuel type
          const rawFuel = (row.Fuel || 'PETROL').trim().toUpperCase();
          const fuelType = FUEL_MAPPING[rawFuel] || 'Petrol';

          // Normalize transmission (default to Manual if not specified)
          const rawTransmission = (row.Transmission || 'MANUAL').trim().toUpperCase();
          const transmission = TRANSMISSION_MAPPING[rawTransmission] || 'Manual';

          // Model and variant
          const model = this.titleCase((row.Model_Desc || 'Unknown').trim());
          const variant = 'Standard'; // RTA data doesn't have variant info

          // Create aggregation key
          const key = `${brand}|${model}|${variant}|${fuelType}|${transmission}|${date.year}|${date.month}`;

          if (aggregationMap.has(key)) {
            aggregationMap.get(key)!.count++;
          } else {
            aggregationMap.set(key, {
              state: 'Telangana',
              brand,
              model,
              variant,
              fuelType,
              transmission,
              year: date.year,
              month: date.month,
              count: 1,
            });
          }
        } catch (error) {
          stats.errors.push(`Row error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          stats.skipped++;
        }
      }

      // Insert aggregated data into database
      for (const [_, record] of Array.from(aggregationMap.entries())) {
        try {
          // Check if record already exists
          const existing = await db
            .select()
            .from(vehicleRegistrations)
            .where(
              and(
                eq(vehicleRegistrations.state, record.state),
                eq(vehicleRegistrations.brand, record.brand),
                eq(vehicleRegistrations.model, record.model),
                eq(vehicleRegistrations.variant, record.variant),
                eq(vehicleRegistrations.fuelType, record.fuelType),
                eq(vehicleRegistrations.transmission, record.transmission),
                eq(vehicleRegistrations.year, record.year),
                eq(vehicleRegistrations.month, record.month)
              )
            )
            .limit(1);

          if (existing.length > 0) {
            // Update existing record
            await db
              .update(vehicleRegistrations)
              .set({
                registrationsCount: record.count,
              })
              .where(eq(vehicleRegistrations.id, existing[0].id));
          } else {
            // Insert new record
            await db.insert(vehicleRegistrations).values({
              state: record.state,
              brand: record.brand,
              model: record.model,
              variant: record.variant,
              fuelType: record.fuelType,
              transmission: record.transmission,
              year: record.year,
              month: record.month,
              registrationsCount: record.count,
            });
          }

          stats.imported++;
        } catch (error) {
          stats.errors.push(
            `Insert error for ${record.brand} ${record.model}: ${error instanceof Error ? error.message : 'Unknown'}`
          );
        }
      }

      return {
        success: true,
        message: `Successfully imported ${stats.imported} aggregated records from ${stats.totalRows} raw rows`,
        stats,
      };
    } catch (error) {
      return {
        success: false,
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        stats: {
          totalRows: 0,
          imported: 0,
          skipped: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        },
      };
    }
  }

  /**
   * Parse date from various formats
   */
  private parseDate(dateStr: string): { year: number; month: number } | null {
    if (!dateStr) return null;

    try {
      // Try ISO format: 2024-09-15
      if (dateStr.includes('-') && dateStr.length >= 10) {
        const parts = dateStr.split('-');
        if (parts.length >= 3) {
          const year = parseInt(parts[0]);
          const month = parseInt(parts[1]);
          if (year >= 2000 && year <= 2030 && month >= 1 && month <= 12) {
            return { year, month };
          }
        }
      }

      // Try DD-MMM-YY format: 15-SEP-24
      if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          const monthMap: Record<string, number> = {
            JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
            JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12,
          };
          const monthStr = parts[1].toUpperCase();
          const month = monthMap[monthStr];
          let year = parseInt(parts[2]);
          
          // Convert 2-digit year to 4-digit
          if (year < 100) {
            year = year >= 50 ? 1900 + year : 2000 + year;
          }

          if (month && year >= 2000 && year <= 2030) {
            return { year, month };
          }
        }
      }
    } catch (error) {
      // Ignore parse errors
    }

    return null;
  }

  /**
   * Convert string to title case
   */
  private titleCase(str: string): string {
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Clear existing Telangana data for a specific month/year (for re-import)
   */
  async clearTelanganaData(year: number, month: number): Promise<void> {
    await db
      .delete(vehicleRegistrations)
      .where(
        and(
          eq(vehicleRegistrations.state, 'Telangana'),
          eq(vehicleRegistrations.year, year),
          eq(vehicleRegistrations.month, month)
        )
      );
  }
}

export const rtaImportService = new RTAImportService();
