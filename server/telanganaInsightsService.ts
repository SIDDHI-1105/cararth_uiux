import { db } from './db';
import { vehicleRegistrations } from '../shared/schema';
import { sql } from 'drizzle-orm';

/**
 * Telangana Market Intelligence Service
 * Provides real-time insights using official Telangana RTA registration data
 */

export interface TelanganaMarketInsights {
  brand: string;
  model: string;
  totalRegistrations: number;
  lastMonthRegistrations: number;
  demandScore: 'HIGH' | 'MEDIUM' | 'LOW';
  demandTrend: 'UP' | 'DOWN' | 'STABLE';
  trendPercentage: number;
  fuelPreferences: {
    type: string;
    count: number;
    percentage: string;
  }[];
  transmissionPreferences: {
    type: string;
    count: number;
    percentage: string;
  }[];
  popularDistricts: {
    city: string;
    count: number;
    percentage: string;
  }[];
  dataSource: string;
  lastUpdated: string;
  insights: string[];
}

/**
 * Get comprehensive market insights for a specific vehicle in Telangana
 */
export async function getTelanganaMarketInsights(
  brand: string,
  model: string,
  city?: string
): Promise<TelanganaMarketInsights | null> {
  try {
    // Get total registrations for this brand/model in Telangana
    const totalResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(${vehicleRegistrations.registrationsCount}), 0)::int`
      })
      .from(vehicleRegistrations)
      .where(sql`
        ${vehicleRegistrations.brand} ILIKE ${brand}
        AND ${vehicleRegistrations.model} ILIKE ${model}
        AND ${vehicleRegistrations.state} = 'Telangana'
      `);

    const totalRegistrations = totalResult[0]?.total || 0;

    if (totalRegistrations === 0) {
      return null; // No data available
    }

    // Get last month's registrations
    const lastMonthResult = await db
      .select({
        count: sql<number>`COALESCE(SUM(${vehicleRegistrations.registrationsCount}), 0)::int`
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

    // Get previous month for trend comparison
    const previousMonthResult = await db
      .select({
        count: sql<number>`COALESCE(SUM(${vehicleRegistrations.registrationsCount}), 0)::int`
      })
      .from(vehicleRegistrations)
      .where(sql`
        ${vehicleRegistrations.brand} ILIKE ${brand}
        AND ${vehicleRegistrations.model} ILIKE ${model}
        AND ${vehicleRegistrations.state} = 'Telangana'
        AND ${vehicleRegistrations.year} = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '2 month')::int
        AND ${vehicleRegistrations.month} = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '2 month')::int
      `);

    const previousMonthCount = previousMonthResult[0]?.count || 0;

    // Calculate trend
    let trendPercentage = 0;
    let demandTrend: 'UP' | 'DOWN' | 'STABLE' = 'STABLE';

    if (previousMonthCount > 0) {
      trendPercentage = Math.round(((lastMonthCount - previousMonthCount) / previousMonthCount) * 100);
      if (trendPercentage > 10) demandTrend = 'UP';
      else if (trendPercentage < -10) demandTrend = 'DOWN';
    }

    // Calculate demand score based on registration volume
    let demandScore: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    if (lastMonthCount > 100) demandScore = 'HIGH';
    else if (lastMonthCount > 30) demandScore = 'MEDIUM';

    // Get fuel type preferences
    const fuelData = await db
      .select({
        fuelType: vehicleRegistrations.fuelType,
        count: sql<number>`COALESCE(SUM(${vehicleRegistrations.registrationsCount}), 0)::int`
      })
      .from(vehicleRegistrations)
      .where(sql`
        ${vehicleRegistrations.brand} ILIKE ${brand}
        AND ${vehicleRegistrations.model} ILIKE ${model}
        AND ${vehicleRegistrations.state} = 'Telangana'
      `)
      .groupBy(vehicleRegistrations.fuelType)
      .orderBy(sql`count DESC`);

    const fuelPreferences = fuelData.map(f => ({
      type: f.fuelType || 'Unknown',
      count: f.count || 0,
      percentage: totalRegistrations > 0 
        ? `${Math.round((f.count || 0) / totalRegistrations * 100)}%`
        : '0%'
    }));

    // Get transmission preferences
    const transmissionData = await db
      .select({
        transmission: vehicleRegistrations.transmission,
        count: sql<number>`COALESCE(SUM(${vehicleRegistrations.registrationsCount}), 0)::int`
      })
      .from(vehicleRegistrations)
      .where(sql`
        ${vehicleRegistrations.brand} ILIKE ${brand}
        AND ${vehicleRegistrations.model} ILIKE ${model}
        AND ${vehicleRegistrations.state} = 'Telangana'
      `)
      .groupBy(vehicleRegistrations.transmission)
      .orderBy(sql`count DESC`);

    const transmissionPreferences = transmissionData.map(t => ({
      type: t.transmission || 'Unknown',
      count: t.count || 0,
      percentage: totalRegistrations > 0
        ? `${Math.round((t.count || 0) / totalRegistrations * 100)}%`
        : '0%'
    }));

    // Get popular districts
    const districtData = await db
      .select({
        city: vehicleRegistrations.city,
        count: sql<number>`COALESCE(SUM(${vehicleRegistrations.registrationsCount}), 0)::int`
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

    const popularDistricts = districtData.map(d => ({
      city: d.city || 'Unknown',
      count: d.count || 0,
      percentage: totalRegistrations > 0
        ? `${Math.round((d.count || 0) / totalRegistrations * 100)}%`
        : '0%'
    }));

    // Generate insights
    const insights: string[] = [];

    // Demand insight
    if (demandScore === 'HIGH') {
      insights.push(`🔥 High demand! ${lastMonthCount} registrations last month - great time to sell!`);
    } else if (demandScore === 'MEDIUM') {
      insights.push(`⚡ Moderate demand with ${lastMonthCount} registrations last month`);
    } else {
      insights.push(`💤 Lower demand - ${lastMonthCount} registrations last month`);
    }

    // Trend insight
    if (demandTrend === 'UP') {
      insights.push(`📈 Trending up ${Math.abs(trendPercentage)}% vs previous month`);
    } else if (demandTrend === 'DOWN') {
      insights.push(`📉 Trending down ${Math.abs(trendPercentage)}% vs previous month`);
    }

    // Fuel preference insight
    if (fuelPreferences.length > 0) {
      const topFuel = fuelPreferences[0];
      insights.push(`⛽ ${topFuel.percentage} of buyers prefer ${topFuel.type}`);
    }

    // Transmission preference insight
    if (transmissionPreferences.length > 0) {
      const topTransmission = transmissionPreferences[0];
      insights.push(`⚙️ ${topTransmission.percentage} of buyers choose ${topTransmission.type}`);
    }

    // Location insight
    if (popularDistricts.length > 0) {
      const topDistrict = popularDistricts[0];
      insights.push(`📍 Most popular in ${topDistrict.city} (${topDistrict.percentage} of registrations)`);
    }

    // City-specific insight
    if (city && popularDistricts.some(d => d.city.toLowerCase().includes(city.toLowerCase()))) {
      insights.push(`✅ Strong demand in your city!`);
    }

    return {
      brand,
      model,
      totalRegistrations,
      lastMonthRegistrations: lastMonthCount,
      demandScore,
      demandTrend,
      trendPercentage,
      fuelPreferences,
      transmissionPreferences,
      popularDistricts,
      dataSource: 'Telangana Open Data Portal (Official RTA)',
      lastUpdated: new Date().toISOString(),
      insights
    };

  } catch (error) {
    console.error('Error fetching Telangana market insights:', error);
    return null;
  }
}

/**
 * Check if market insights are available for a given location
 */
export function isInsightsAvailable(state?: string, city?: string): boolean {
  // Currently only Telangana is supported
  if (!state) return false;
  return state.toLowerCase() === 'telangana';
}

/**
 * Get insights availability message for UI
 */
export function getInsightsAvailabilityMessage(state?: string): string {
  if (isInsightsAvailable(state)) {
    return 'Powered by Official Telangana RTA Data';
  }
  return 'Market insights available for Telangana only. Other states coming soon!';
}
