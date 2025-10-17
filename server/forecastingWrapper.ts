import { spawn } from 'child_process';
import path from 'path';

export interface ForecastPrediction {
  date: string;
  value: number;
  lower: number;
  upper: number;
}

export interface SARIMAResult {
  model: 'SARIMA';
  predictions: ForecastPrediction[];
  aic?: number;
  bic?: number;
  error?: string;
}

export interface ProphetResult {
  model: 'Prophet';
  predictions: ForecastPrediction[];
  trend?: number[];
  seasonality?: number[];
  error?: string;
}

export interface BrandForecast {
  brand: string;
  sarima: SARIMAResult;
  prophet: ProphetResult;
  historical_months: number;
  error?: string;
}

export interface MarketForecast {
  market: string;
  sarima: SARIMAResult;
  prophet: ProphetResult;
}

/**
 * Call Python forecasting service
 */
async function callForecastingService(command: string, inputData?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const pythonPath = 'python3';
    const scriptPath = path.join(__dirname, 'forecastingService.py');
    
    const python = spawn(pythonPath, [scriptPath, command]);
    
    let stdout = '';
    let stderr = '';
    
    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    python.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python process exited with code ${code}: ${stderr}`));
      } else {
        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (e) {
          reject(new Error(`Failed to parse JSON: ${stdout}`));
        }
      }
    });
    
    // Send input data if provided
    if (inputData) {
      python.stdin.write(JSON.stringify(inputData));
      python.stdin.end();
    }
  });
}

/**
 * Generate forecast for a specific brand
 */
export async function forecastBrand(
  records: any[],
  brand: string,
  periods: number = 6
): Promise<BrandForecast> {
  const inputData = {
    records,
    brand,
    periods
  };
  
  return await callForecastingService('forecast', inputData);
}

/**
 * Generate overall market forecast
 */
export async function forecastMarket(
  records: any[],
  periods: number = 6
): Promise<MarketForecast> {
  const inputData = {
    records,
    periods
  };
  
  return await callForecastingService('forecast', inputData);
}

/**
 * Test forecasting service availability
 */
export async function testForecastingService(): Promise<{ status: string; message: string }> {
  return await callForecastingService('test');
}
