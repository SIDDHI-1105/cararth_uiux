#!/usr/bin/env python3
"""
Time Series Forecasting Service
Implements SARIMA and Prophet models for automotive market predictions
"""

import sys
import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from prophet import Prophet
from statsmodels.tsa.statespace.sarimax import SARIMAX
import warnings
warnings.filterwarnings('ignore')

def sanitize_nan(value):
    """Convert NaN to None for JSON serialization"""
    if pd.isna(value) or (isinstance(value, float) and np.isnan(value)):
        return None
    return value

def prepare_data(records):
    """Convert JSON records to time series dataframe"""
    df = pd.DataFrame(records)
    df['date'] = pd.to_datetime(df['year'].astype(str) + '-' + df['month'].astype(str) + '-01')
    df = df.sort_values('date')
    
    # Handle both SIAM data (units_sold) and RTA data (registrations_count)
    if 'units_sold' in df.columns:
        df['value'] = df['units_sold']
    elif 'registrations_count' in df.columns:
        df['value'] = df['registrations_count']
    else:
        raise ValueError("Data must contain either 'units_sold' or 'registrations_count' column")
    
    return df

def sarima_forecast(df, periods=6):
    """SARIMA forecasting with seasonal patterns (monthly seasonality)"""
    try:
        # Aggregate to monthly totals
        monthly = df.groupby('date')['value'].sum().reset_index()
        monthly.columns = ['date', 'value']
        
        # SARIMA(1,1,1)(1,1,1,12) - seasonal period of 12 months
        model = SARIMAX(monthly['value'], 
                       order=(1, 1, 1),
                       seasonal_order=(1, 1, 1, 12),
                       enforce_stationarity=False,
                       enforce_invertibility=False)
        
        fitted = model.fit(disp=False, maxiter=100)
        
        # Forecast
        forecast = fitted.forecast(steps=periods)
        forecast_dates = pd.date_range(start=monthly['date'].max() + timedelta(days=32), periods=periods, freq='MS')
        
        # Get confidence intervals
        forecast_obj = fitted.get_forecast(steps=periods)
        conf_int = forecast_obj.conf_int()
        
        return {
            'model': 'SARIMA',
            'predictions': [
                {
                    'date': date.strftime('%Y-%m-%d'),
                    'value': float(val),
                    'lower': float(conf_int.iloc[i, 0]),
                    'upper': float(conf_int.iloc[i, 1])
                }
                for i, (date, val) in enumerate(zip(forecast_dates, forecast))
            ],
            'aic': sanitize_nan(fitted.aic),
            'bic': sanitize_nan(fitted.bic)
        }
    except Exception as e:
        return {'error': f'SARIMA failed: {str(e)}'}

def prophet_forecast(df, periods=6):
    """Prophet forecasting with automatic seasonality detection"""
    try:
        # Prepare data for Prophet
        monthly = df.groupby('date')['value'].sum().reset_index()
        monthly.columns = ['ds', 'y']
        
        # Initialize Prophet with Indian holidays
        model = Prophet(
            yearly_seasonality=True,
            weekly_seasonality=False,
            daily_seasonality=False,
            changepoint_prior_scale=0.05,
            seasonality_prior_scale=10
        )
        
        # Add custom seasonality for festive months
        model.add_seasonality(name='festive', period=365.25/12*2, fourier_order=5)
        
        model.fit(monthly)
        
        # Create future dataframe
        future = model.make_future_dataframe(periods=periods, freq='MS')
        forecast = model.predict(future)
        
        # Extract predictions
        predictions = forecast.tail(periods)[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].to_dict('records')
        
        return {
            'model': 'Prophet',
            'predictions': [
                {
                    'date': pred['ds'].strftime('%Y-%m-%d'),
                    'value': float(max(0, pred['yhat'])),
                    'lower': float(max(0, pred['yhat_lower'])),
                    'upper': float(max(0, pred['yhat_upper']))
                }
                for pred in predictions
            ],
            'trend': forecast['trend'].tolist()[-12:],  # Last 12 months trend
            'seasonality': forecast['yearly'].tolist()[-12:] if 'yearly' in forecast else []
        }
    except Exception as e:
        return {'error': f'Prophet failed: {str(e)}'}

def brand_forecast(df, brand, periods=6):
    """Forecast for specific brand"""
    brand_df = df[df['brand'] == brand].copy()
    
    if len(brand_df) < 24:  # Need at least 2 years
        return {'error': f'Insufficient data for {brand}. Need 24+ months, got {len(brand_df)}'}
    
    sarima_result = sarima_forecast(brand_df, periods)
    prophet_result = prophet_forecast(brand_df, periods)
    
    return {
        'brand': brand,
        'sarima': sarima_result,
        'prophet': prophet_result,
        'historical_months': len(brand_df)
    }

def main():
    """Main entry point for forecasting service"""
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'Usage: forecastingService.py <command> [args]'}))
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == 'forecast':
        # Read data from stdin
        input_data = json.loads(sys.stdin.read())
        records = input_data.get('records', [])
        brand = input_data.get('brand')
        periods = input_data.get('periods', 6)
        
        df = prepare_data(records)
        
        if brand:
            result = brand_forecast(df, brand, periods)
        else:
            # Overall market forecast
            sarima_result = sarima_forecast(df, periods)
            prophet_result = prophet_forecast(df, periods)
            result = {
                'market': 'Telangana Overall',
                'sarima': sarima_result,
                'prophet': prophet_result
            }
        
        print(json.dumps(result, indent=2))
    
    elif command == 'test':
        print(json.dumps({'status': 'ok', 'message': 'Forecasting service ready'}))
    
    else:
        print(json.dumps({'error': f'Unknown command: {command}'}))
        sys.exit(1)

if __name__ == '__main__':
    main()
