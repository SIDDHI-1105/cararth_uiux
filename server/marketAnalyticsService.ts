import { spawn } from 'child_process';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { siamSalesData, vehicleRegistrations, dealers, dealerVehicles } from '../shared/schema.js';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';

// Initialize database connection
const sqlConnection = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlConnection);

/**
 * Market Analytics Service
 * Provides OEM-level and dealer-level market intelligence with ML forecasts
 */

interface ForecastResult {
  model: string;
  predictions: Array<{
    date: string;
    value: number;
    lower: number;
    upper: number;
  }>;
  trend?: number[];
  seasonality?: number[];
  aic?: number;
  bic?: number;
}

interface ProphetForecastResponse {
  sarima?: ForecastResult;
  prophet?: ForecastResult;
  brand?: string;
  market?: string;
  historical_months?: number;
  error?: string;
}

export class MarketAnalyticsService {
  
  /**
   * Call Python Prophet forecasting service
   */
  private async callProphetForecast(
    records: any[],
    brand?: string,
    periods: number = 3
  ): Promise<ProphetForecastResponse> {
    return new Promise((resolve, reject) => {
      const python = spawn('python3', ['server/forecastingService.py', 'forecast']);
      
      const inputData = JSON.stringify({
        records,
        brand,
        periods
      });
      
      let output = '';
      let error = '';
      
      python.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      python.stderr.on('data', (data) => {
        error += data.toString();
      });
      
      python.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Prophet forecast failed: ${error}`));
        } else {
          try {
            resolve(JSON.parse(output));
          } catch (e) {
            reject(new Error(`Failed to parse forecast output: ${output}`));
          }
        }
      });
      
      python.stdin.write(inputData);
      python.stdin.end();
    });
  }
  
  /**
   * Get OEM Market Intelligence (SIAM National Data)
   */
  async getOEMMarketIntelligence(options: {
    year?: number;
    month?: number;
    brand?: string;
    forecast?: boolean;
  } = {}) {
    try {
      // Build where conditions array
      const conditions = [];
      if (options.year) {
        conditions.push(eq(siamSalesData.year, options.year));
      }
      if (options.month) {
        conditions.push(eq(siamSalesData.month, options.month));
      }
      if (options.brand) {
        conditions.push(eq(siamSalesData.brand, options.brand));
      }
      
      // Get SIAM sales data with combined where clause
      let query = db.select().from(siamSalesData);
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
      
      const salesData = await query.orderBy(desc(siamSalesData.year), desc(siamSalesData.month));
      
      // Defensive check: return empty result if no data
      if (salesData.length === 0) {
        return {
          success: true,
          currentMonth: { year: 0, month: 0, data: [] },
          previousMonth: { year: 0, month: 0, data: [] },
          trends: null,
          forecast: null,
          historicalData: []
        };
      }
      
      // Get latest month for N-1 benchmarking
      const latestData = salesData[0];
      const previousMonthData = salesData.filter(d => 
        d.year === (latestData.month === 1 ? latestData.year - 1 : latestData.year) &&
        d.month === (latestData.month === 1 ? 12 : latestData.month - 1)
      );
      
      // Calculate trends
      const trends = this.calculateTrends(salesData);
      
      // ML Forecast (if requested)
      let forecast = null;
      if (options.forecast && salesData.length >= 6) {
        forecast = await this.callProphetForecast(
          salesData.map(d => ({
            year: d.year,
            month: d.month,
            units_sold: d.unitsSold
          })),
          options.brand
        );
      }
      
      return {
        success: true,
        currentMonth: {
          year: latestData.year,
          month: latestData.month,
          data: salesData.filter(d => d.year === latestData.year && d.month === latestData.month)
        },
        previousMonth: {
          year: latestData.month === 1 ? latestData.year - 1 : latestData.year,
          month: latestData.month === 1 ? 12 : latestData.month - 1,
          data: previousMonthData
        },
        trends,
        forecast,
        historicalData: salesData
      };
    } catch (error) {
      throw new Error(`OEM market intelligence failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get Telangana RTA Market Intelligence
   */
  async getTelanganaMarketIntelligence(options: {
    year?: number;
    month?: number;
    brand?: string;
    city?: string;
    forecast?: boolean;
  } = {}) {
    try {
      // Build where conditions array
      const conditions = [eq(vehicleRegistrations.state, 'Telangana')];
      
      if (options.year) {
        conditions.push(eq(vehicleRegistrations.year, options.year));
      }
      if (options.month) {
        conditions.push(eq(vehicleRegistrations.month, options.month));
      }
      if (options.brand) {
        conditions.push(eq(vehicleRegistrations.brand, options.brand));
      }
      if (options.city) {
        conditions.push(eq(vehicleRegistrations.city, options.city));
      }
      
      const rtaData = await db.select()
        .from(vehicleRegistrations)
        .where(and(...conditions))
        .orderBy(desc(vehicleRegistrations.year), desc(vehicleRegistrations.month));
      
      // Calculate aggregates
      const monthlyAggregates = this.aggregateByMonth(rtaData);
      
      // ML Forecast (if requested)
      let forecast = null;
      if (options.forecast && rtaData.length >= 12) {
        forecast = await this.callProphetForecast(
          rtaData.map(d => ({
            year: d.year,
            month: d.month,
            registrations_count: d.registrationsCount
          })),
          options.brand
        );
      }
      
      return {
        success: true,
        state: 'Telangana',
        monthlyData: monthlyAggregates,
        forecast,
        totalRecords: rtaData.length
      };
    } catch (error) {
      throw new Error(`Telangana RTA intelligence failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get All Dealers List
   */
  async getAllDealers() {
    try {
      const dealersList = await db.select({
        id: dealers.id,
        dealerName: dealers.dealerName,
        dealerGroup: dealers.dealerGroup,
        oemBrand: dealers.oemBrand,
        storeCode: dealers.storeCode,
        city: dealers.city,
        state: dealers.state,
        isActive: dealers.isActive
      }).from(dealers)
        .where(eq(dealers.isActive, true))
        .orderBy(dealers.dealerName);
      
      return {
        success: true,
        dealers: dealersList,
        count: dealersList.length
      };
    } catch (error) {
      throw new Error(`Failed to fetch dealers: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get Dealer Performance Analytics
   */
  async getDealerPerformance(dealerId: string, options: {
    compareToMarket?: boolean;
    forecast?: boolean;
  } = {}) {
    try {
      // Get dealer info
      const dealer = await db.select().from(dealers)
        .where(eq(dealers.id, dealerId))
        .limit(1);
      
      if (!dealer.length) {
        throw new Error('Dealer not found');
      }
      
      const dealerInfo = dealer[0];
      
      // Get dealer inventory
      const inventory = await db.select().from(dealerVehicles)
        .where(eq(dealerVehicles.dealerId, dealerId));
      
      // Calculate dealer metrics
      const metrics = {
        totalInventory: inventory.length,
        avgPrice: inventory.reduce((sum, v) => sum + v.price, 0) / inventory.length || 0,
        byCondition: this.groupBy(inventory, 'condition'),
        byFuelType: this.groupBy(inventory, 'fuelType'),
        byTransmission: this.groupBy(inventory, 'transmission'),
        byBodyType: this.groupBy(inventory, 'bodyType'),
      };
      
      // Market comparison (if requested)
      let marketComparison = null;
      if (options.compareToMarket) {
        // Get SIAM data for this dealer's OEM brand
        const siamData = await db.select().from(siamSalesData)
          .where(eq(siamSalesData.brand, dealerInfo.oemBrand))
          .orderBy(desc(siamSalesData.year), desc(siamSalesData.month))
          .limit(12);
        
        // Get Telangana RTA data for this brand and city
        const rtaData = await db.select().from(vehicleRegistrations)
          .where(
            and(
              eq(vehicleRegistrations.state, dealerInfo.state),
              eq(vehicleRegistrations.city, dealerInfo.city),
              eq(vehicleRegistrations.brand, dealerInfo.oemBrand)
            )
          )
          .orderBy(desc(vehicleRegistrations.year), desc(vehicleRegistrations.month))
          .limit(12);
        
        marketComparison = {
          national: {
            brand: dealerInfo.oemBrand,
            recentMonths: siamData,
            avgMonthlySales: siamData.reduce((sum, d) => sum + d.unitsSold, 0) / siamData.length || 0
          },
          regional: {
            state: dealerInfo.state,
            city: dealerInfo.city,
            brand: dealerInfo.oemBrand,
            recentMonths: rtaData,
            avgMonthlyRegistrations: rtaData.reduce((sum, d) => sum + d.registrationsCount, 0) / rtaData.length || 0
          }
        };
      }
      
      return {
        success: true,
        dealer: dealerInfo,
        metrics,
        marketComparison,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Dealer performance analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Helper: Calculate trends from sales data
   */
  private calculateTrends(data: any[]) {
    if (data.length < 2) return null;
    
    const latest = data[0];
    const previous = data[1];
    
    const momChange = ((latest.unitsSold - previous.unitsSold) / previous.unitsSold) * 100;
    
    return {
      latestMonth: {
        year: latest.year,
        month: latest.month,
        units: latest.unitsSold
      },
      previousMonth: {
        year: previous.year,
        month: previous.month,
        units: previous.unitsSold
      },
      monthOverMonthChange: momChange,
      direction: momChange > 0 ? 'up' : momChange < 0 ? 'down' : 'stable'
    };
  }
  
  /**
   * Helper: Aggregate data by month
   */
  private aggregateByMonth(data: any[]) {
    const grouped = data.reduce((acc, item) => {
      const key = `${item.year}-${String(item.month).padStart(2, '0')}`;
      if (!acc[key]) {
        acc[key] = { year: item.year, month: item.month, total: 0, brands: {} };
      }
      acc[key].total += item.registrationsCount;
      if (!acc[key].brands[item.brand]) {
        acc[key].brands[item.brand] = 0;
      }
      acc[key].brands[item.brand] += item.registrationsCount;
      return acc;
    }, {} as any);
    
    return Object.values(grouped).sort((a: any, b: any) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  }
  
  /**
   * Helper: Group by field
   */
  private groupBy(data: any[], field: string) {
    return data.reduce((acc, item) => {
      const key = item[field] || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}

export const marketAnalyticsService = new MarketAnalyticsService();
