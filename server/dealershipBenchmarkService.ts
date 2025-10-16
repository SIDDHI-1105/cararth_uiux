/**
 * Dealership Benchmarking Service with Advanced ML Forecasting
 * Prophet/SARIMA-like predictions using JavaScript
 */

import regression from 'regression';
import * as stats from 'simple-statistics';
import { db } from './db';
import { vehicleRegistrations, siamSalesData } from '../shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getROIAverageSalesPerDealer } from './vahanService';

export interface DealershipBenchmarkInput {
  oem: string;
  month: string; // 'YYYY-MM' format
  mtdSales: number;
}

export interface BenchmarkComparison {
  mtdSales: number;
  telanganaAvg: number;
  roiAvg: number;
  siamYoY: number | null;
  momGrowth: number | null;
  yoyGrowth: number | null;
  vsTelanganaPct: number;
  vsROIPct: number;
}

export interface MLForecast {
  nextMonthPrediction: number;
  predictionChange: number;
  forecastMethod: 'hybrid' | 'seasonal' | 'linear' | 'arima-like';
  confidence: number; // 0-100
  seasonalTrend: 'rising' | 'falling' | 'stable';
}

export interface ActionableInsight {
  type: 'warning' | 'opportunity' | 'success';
  message: string;
  recommendation: string;
}

export interface DealershipBenchmarkReport {
  comparison: BenchmarkComparison;
  forecast: MLForecast;
  insights: ActionableInsight[];
  chartData: {
    months: string[];
    dealerSales: number[];
    telanganaAvg: number[];
    roiAvg: number[];
    prediction: number;
  };
}

/**
 * Seasonal Decomposition (additive model)
 * Separates time series into: Trend + Seasonal + Residual
 */
function seasonalDecomposition(
  data: number[],
  period: number = 12
): { trend: number[]; seasonal: number[]; residual: number[] } {
  const n = data.length;
  
  // Calculate trend using moving average
  const trend: number[] = [];
  const halfPeriod = Math.floor(period / 2);
  
  for (let i = 0; i < n; i++) {
    if (i < halfPeriod || i >= n - halfPeriod) {
      trend.push(data[i]); // Use original value at boundaries
    } else {
      const window = data.slice(i - halfPeriod, i + halfPeriod + 1);
      trend.push(stats.mean(window));
    }
  }
  
  // Calculate seasonal component
  const detrended = data.map((val, i) => val - trend[i]);
  const seasonal: number[] = new Array(n).fill(0);
  
  for (let i = 0; i < period && i < n; i++) {
    const seasonalValues = [];
    for (let j = i; j < n; j += period) {
      seasonalValues.push(detrended[j]);
    }
    const seasonalAvg = stats.mean(seasonalValues);
    for (let j = i; j < n; j += period) {
      seasonal[j] = seasonalAvg;
    }
  }
  
  // Calculate residual
  const residual = data.map((val, i) => val - trend[i] - seasonal[i]);
  
  return { trend, seasonal, residual };
}

/**
 * ARIMA-like prediction using exponential smoothing + trend
 */
function arimaLikeForecast(data: number[], alpha: number = 0.3): number {
  if (data.length === 0) return 0;
  if (data.length === 1) return data[0];
  
  // Double exponential smoothing (Holt's method)
  let level = data[0];
  let trend = data[1] - data[0];
  
  for (let i = 1; i < data.length; i++) {
    const prevLevel = level;
    level = alpha * data[i] + (1 - alpha) * (level + trend);
    trend = alpha * (level - prevLevel) + (1 - alpha) * trend;
  }
  
  // Forecast next period
  return level + trend;
}

/**
 * Hybrid ML Forecasting Engine
 * Combines: Seasonal Decomposition + ARIMA-like + Linear Regression
 */
export async function generateMLForecast(
  historicalSales: number[],
  months: string[]
): Promise<MLForecast> {
  const dataPoints = historicalSales.length;
  
  // Fallback for insufficient data
  if (dataPoints < 3) {
    const lastValue = historicalSales[dataPoints - 1] || 0;
    return {
      nextMonthPrediction: lastValue,
      predictionChange: 0,
      forecastMethod: 'linear',
      confidence: 30,
      seasonalTrend: 'stable'
    };
  }
  
  let prediction = 0;
  let method: 'hybrid' | 'seasonal' | 'linear' | 'arima-like' = 'linear';
  
  if (dataPoints >= 12) {
    // Full seasonal decomposition + hybrid forecasting
    const decomposed = seasonalDecomposition(historicalSales, 12);
    
    // Forecast trend
    const trendData = decomposed.trend.map((val, i) => [i, val]);
    const trendRegression = regression.linear(trendData as [number, number][]);
    const trendPrediction = trendRegression.predict(dataPoints)[1];
    
    // Get seasonal component for next period
    const seasonalIndex = dataPoints % 12;
    const seasonalComponent = decomposed.seasonal[seasonalIndex] || 0;
    
    // ARIMA-like smoothing
    const arimaPredict = arimaLikeForecast(historicalSales);
    
    // Hybrid: Average of methods (3 models)
    prediction = (trendPrediction + seasonalComponent + arimaPredict) / 3;
    method = 'hybrid';
    
  } else if (dataPoints >= 5) {
    // Seasonal + ARIMA-like
    const arimaPredict = arimaLikeForecast(historicalSales);
    const linearData = historicalSales.map((val, i) => [i, val]);
    const linearRegression = regression.linear(linearData as [number, number][]);
    const linearPredict = linearRegression.predict(dataPoints)[1];
    
    prediction = (arimaPredict + linearPredict) / 2;
    method = 'seasonal';
    
  } else {
    // Simple linear regression
    const linearData = historicalSales.map((val, i) => [i, val]);
    const linearRegression = regression.linear(linearData as [number, number][]);
    prediction = linearRegression.predict(dataPoints)[1];
    method = 'linear';
  }
  
  // Calculate trend direction
  const recentTrend = historicalSales.slice(-3);
  const avgRecent = stats.mean(recentTrend);
  const avgAll = stats.mean(historicalSales);
  const seasonalTrend: 'rising' | 'falling' | 'stable' = 
    avgRecent > avgAll * 1.05 ? 'rising' : 
    avgRecent < avgAll * 0.95 ? 'falling' : 'stable';
  
  // Confidence based on data points and variance
  const variance = stats.variance(historicalSales);
  const mean = stats.mean(historicalSales);
  const cv = variance > 0 ? Math.sqrt(variance) / mean : 0; // Coefficient of variation
  const confidence = Math.min(95, Math.max(40, 90 - cv * 100));
  
  const currentSales = historicalSales[dataPoints - 1] || 0;
  const predictionChange = currentSales > 0 
    ? ((prediction - currentSales) / currentSales) * 100 
    : 0;
  
  return {
    nextMonthPrediction: Math.round(prediction),
    predictionChange: Math.round(predictionChange * 10) / 10,
    forecastMethod: method,
    confidence: Math.round(confidence),
    seasonalTrend
  };
}

/**
 * Generate actionable insights based on comparisons and forecast
 */
function generateInsights(
  comparison: BenchmarkComparison,
  forecast: MLForecast,
  oem: string
): ActionableInsight[] {
  const insights: ActionableInsight[] = [];
  
  // Performance vs benchmarks
  if (comparison.vsTelanganaPct < -10) {
    insights.push({
      type: 'warning',
      message: `${Math.abs(comparison.vsTelanganaPct).toFixed(1)}% below Telangana average`,
      recommendation: `Review pricing strategy and inventory mix for ${oem}. Regional competitors are outperforming.`
    });
  } else if (comparison.vsTelanganaPct > 15) {
    insights.push({
      type: 'success',
      message: `${comparison.vsTelanganaPct.toFixed(1)}% above Telangana average`,
      recommendation: `Strong performance! Maintain current sales tactics and consider expanding ${oem} inventory.`
    });
  }
  
  // YoY performance
  if (comparison.yoyGrowth !== null && comparison.yoyGrowth < 0) {
    insights.push({
      type: 'warning',
      message: `${Math.abs(comparison.yoyGrowth).toFixed(1)}% YoY decline`,
      recommendation: `Market contraction detected. Focus on high-demand variants and promotional activities.`
    });
  }
  
  // ML Forecast insights
  if (forecast.predictionChange > 10) {
    insights.push({
      type: 'opportunity',
      message: `ML predicts ${forecast.predictionChange.toFixed(1)}% growth next month`,
      recommendation: `Stock up on ${oem} SUVs and premium variants. Seasonal demand rising (${forecast.seasonalTrend} trend).`
    });
  } else if (forecast.predictionChange < -10) {
    insights.push({
      type: 'warning',
      message: `ML predicts ${Math.abs(forecast.predictionChange).toFixed(1)}% decline next month`,
      recommendation: `Reduce new inventory. Focus on clearing existing stock with targeted offers.`
    });
  }
  
  // ROI comparison
  if (comparison.vsROIPct < -15) {
    insights.push({
      type: 'warning',
      message: `Significantly below Rest of India average`,
      recommendation: `Regional market dynamics require attention. Benchmark against national best practices.`
    });
  }
  
  // Default positive insight if performing well
  if (insights.length === 0) {
    insights.push({
      type: 'success',
      message: `On track with regional and national benchmarks`,
      recommendation: `Maintain current strategy. Monitor ${forecast.seasonalTrend} seasonal trends for next month.`
    });
  }
  
  return insights;
}

/**
 * Main benchmarking function - generates complete report
 */
export async function generateDealershipBenchmark(
  input: DealershipBenchmarkInput
): Promise<DealershipBenchmarkReport> {
  const [year, month] = input.month.split('-').map(Number);
  
  // Fetch Telangana average
  const telanganaData = await db.select({
    avg: sql<number>`AVG(${vehicleRegistrations.registrationsCount})::int`
  })
  .from(vehicleRegistrations)
  .where(
    and(
      eq(vehicleRegistrations.state, 'Telangana'),
      eq(vehicleRegistrations.year, year),
      eq(vehicleRegistrations.month, month),
      eq(vehicleRegistrations.brand, input.oem)
    )
  );
  
  const telanganaAvg = telanganaData[0]?.avg || 0;
  const telanganaAvgPerDealer = Math.round(telanganaAvg / 10); // ~10 dealers in Telangana
  
  // Fetch ROI average
  const roiAvg = await getROIAverageSalesPerDealer(year, month, input.oem);
  
  // Fetch SIAM YoY
  const siamData = await db.select()
    .from(siamSalesData)
    .where(
      and(
        eq(siamSalesData.brand, input.oem),
        eq(siamSalesData.year, year),
        eq(siamSalesData.month, month)
      )
    )
    .limit(1);
  
  const siamYoY = siamData[0]?.growthYoY ? Number(siamData[0].growthYoY) : null;
  
  // Calculate MoM and YoY
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  
  const prevMonthData = await db.select({
    avg: sql<number>`AVG(${vehicleRegistrations.registrationsCount})::int`
  })
  .from(vehicleRegistrations)
  .where(
    and(
      eq(vehicleRegistrations.state, 'Telangana'),
      eq(vehicleRegistrations.year, prevYear),
      eq(vehicleRegistrations.month, prevMonth),
      eq(vehicleRegistrations.brand, input.oem)
    )
  );
  
  const prevMonthSales = Math.round((prevMonthData[0]?.avg || 0) / 10);
  const momGrowth = prevMonthSales > 0 ? ((input.mtdSales - prevMonthSales) / prevMonthSales) * 100 : null;
  
  const yoyData = await db.select({
    avg: sql<number>`AVG(${vehicleRegistrations.registrationsCount})::int`
  })
  .from(vehicleRegistrations)
  .where(
    and(
      eq(vehicleRegistrations.state, 'Telangana'),
      eq(vehicleRegistrations.year, year - 1),
      eq(vehicleRegistrations.month, month),
      eq(vehicleRegistrations.brand, input.oem)
    )
  );
  
  const yoySales = Math.round((yoyData[0]?.avg || 0) / 10);
  const yoyGrowth = yoySales > 0 ? ((input.mtdSales - yoySales) / yoySales) * 100 : null;
  
  const comparison: BenchmarkComparison = {
    mtdSales: input.mtdSales,
    telanganaAvg: telanganaAvgPerDealer,
    roiAvg,
    siamYoY,
    momGrowth,
    yoyGrowth,
    vsTelanganaPct: telanganaAvgPerDealer > 0 
      ? ((input.mtdSales - telanganaAvgPerDealer) / telanganaAvgPerDealer) * 100 
      : 0,
    vsROIPct: roiAvg > 0 
      ? ((input.mtdSales - roiAvg) / roiAvg) * 100 
      : 0
  };
  
  // Fetch historical data for ML forecast (last 12 months)
  const historicalData = await db.select()
    .from(vehicleRegistrations)
    .where(
      and(
        eq(vehicleRegistrations.state, 'Telangana'),
        eq(vehicleRegistrations.brand, input.oem),
        sql`${vehicleRegistrations.year} >= ${year - 1}`
      )
    )
    .orderBy(vehicleRegistrations.year, vehicleRegistrations.month);
  
  const months: string[] = [];
  const salesData: number[] = [];
  
  historicalData.forEach(record => {
    months.push(`${record.year}-${String(record.month).padStart(2, '0')}`);
    salesData.push(Math.round(record.registrationsCount / 10));
  });
  
  // Add current month
  months.push(input.month);
  salesData.push(input.mtdSales);
  
  const forecast = await generateMLForecast(salesData, months);
  const insights = generateInsights(comparison, forecast, input.oem);
  
  return {
    comparison,
    forecast,
    insights,
    chartData: {
      months,
      dealerSales: salesData,
      telanganaAvg: new Array(salesData.length).fill(telanganaAvgPerDealer),
      roiAvg: new Array(salesData.length).fill(roiAvg),
      prediction: forecast.nextMonthPrediction
    }
  };
}
