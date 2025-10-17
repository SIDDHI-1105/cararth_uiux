import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Calendar, Activity } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface MonthlyData {
  year: number;
  month: number;
  count: number;
}

interface OEMAnalytics {
  brand: string;
  totalRegistrations: number;
  marketShare: number;
  avgMonthlyRegistrations: number;
  yoyGrowth: number;
  monthlyData: MonthlyData[];
  dataMonths: number;
}

interface ForecastPrediction {
  date: string;
  value: number;
  lower: number;
  upper: number;
}

interface ForecastResult {
  model: 'SARIMA' | 'Prophet';
  predictions: ForecastPrediction[];
}

interface BrandForecast {
  brand: string;
  sarima: ForecastResult;
  prophet: ForecastResult;
  historical_months: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B9D'];

export default function OemAnalyticsDashboard() {
  const [selectedOEM, setSelectedOEM] = useState<string | null>(null);
  const [forecastPeriods, setForecastPeriods] = useState(6);

  const { data: dashboardData, isLoading } = useQuery<{ success: boolean; data: { oems: OEMAnalytics[]; totalMarket: number; dataRange: { from: string; to: string; months: number } } }>({
    queryKey: ['/api/dealer/analytics/oem-dashboard'],
  });

  const { data: forecastData, isLoading: forecastLoading } = useQuery<{ success: boolean; forecast: BrandForecast }>({
    queryKey: ['/api/dealer/analytics/forecast/brand', selectedOEM, forecastPeriods],
    enabled: !!selectedOEM,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Activity className="w-8 h-8 animate-spin" data-testid="loading-spinner" />
      </div>
    );
  }

  if (!dashboardData?.success || !dashboardData.data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  const { oems, totalMarket, dataRange } = dashboardData.data;

  // Prepare market share pie chart data
  const marketShareData = oems.map(oem => ({
    name: oem.brand,
    value: oem.marketShare,
  }));

  // Prepare time series data for selected OEM
  const selectedOEMData = selectedOEM ? oems.find(o => o.brand === selectedOEM) : null;
  const timeSeriesData = selectedOEMData?.monthlyData.map(d => ({
    date: `${d.year}-${String(d.month).padStart(2, '0')}`,
    registrations: d.count,
  })) || [];

  // Combine historical + forecast data
  const combinedForecastData = forecastData?.success && forecastData.forecast ? [
    ...timeSeriesData,
    ...forecastData.forecast.sarima.predictions.map(p => ({
      date: p.date.substring(0, 7),
      forecast_sarima: p.value,
      sarima_lower: p.lower,
      sarima_upper: p.upper,
    }))
  ] : timeSeriesData;

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="oem-analytics-dashboard">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-dashboard">Telangana OEM Market Intelligence</h1>
          <p className="text-muted-foreground" data-testid="text-data-range">
            <Calendar className="inline w-4 h-4 mr-1" />
            {dataRange.from} to {dataRange.to} ({dataRange.months} months)
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Total Market</p>
          <p className="text-3xl font-bold" data-testid="text-total-market">{totalMarket.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {oems.slice(0, 4).map((oem, idx) => (
          <Card key={oem.brand} data-testid={`card-oem-${oem.brand}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{oem.brand}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid={`text-market-share-${oem.brand}`}>{oem.marketShare}%</div>
              <p className="text-xs text-muted-foreground">Market Share</p>
              <div className={`flex items-center mt-2 ${oem.yoyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`} data-testid={`text-growth-${oem.brand}`}>
                {oem.yoyGrowth >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                <span className="text-sm font-medium">{oem.yoyGrowth.toFixed(1)}% YoY</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="market-share" className="space-y-4">
        <TabsList data-testid="tabs-analytics">
          <TabsTrigger value="market-share" data-testid="tab-market-share">Market Share</TabsTrigger>
          <TabsTrigger value="trends" data-testid="tab-trends">Historical Trends</TabsTrigger>
          <TabsTrigger value="forecast" data-testid="tab-forecast">ML Forecasts</TabsTrigger>
        </TabsList>

        <TabsContent value="market-share" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Market Share Distribution</CardTitle>
                <CardDescription>Current market share by OEM</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={marketShareData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {marketShareData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total Registrations by OEM</CardTitle>
                <CardDescription>Last {dataRange.months} months performance</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={oems}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="brand" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="totalRegistrations" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Select OEM for Trend Analysis</CardTitle>
              <CardDescription>View monthly registration trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {oems.map(oem => (
                  <Button
                    key={oem.brand}
                    variant={selectedOEM === oem.brand ? 'default' : 'outline'}
                    onClick={() => setSelectedOEM(oem.brand)}
                    data-testid={`button-select-${oem.brand}`}
                  >
                    {oem.brand}
                  </Button>
                ))}
              </div>

              {selectedOEMData && (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="registrations" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SARIMA + Prophet Forecasting</CardTitle>
              <CardDescription>ML-powered 6-month predictions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex flex-wrap gap-2">
                  {oems.map(oem => (
                    <Button
                      key={oem.brand}
                      variant={selectedOEM === oem.brand ? 'default' : 'outline'}
                      onClick={() => setSelectedOEM(oem.brand)}
                      data-testid={`button-forecast-${oem.brand}`}
                    >
                      {oem.brand}
                    </Button>
                  ))}
                </div>
              </div>

              {forecastLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Activity className="w-6 h-6 animate-spin" />
                </div>
              ) : forecastData?.success ? (
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={combinedForecastData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="registrations" stroke="#8884d8" strokeWidth={2} name="Historical" />
                      <Line type="monotone" dataKey="forecast_sarima" stroke="#82ca9d" strokeWidth={2} strokeDasharray="5 5" name="SARIMA Forecast" />
                    </LineChart>
                  </ResponsiveContainer>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">SARIMA Model</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2" data-testid="sarima-predictions">
                          {forecastData.forecast.sarima.predictions.slice(0, 3).map((pred, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span>{pred.date}</span>
                              <span className="font-medium">{Math.round(pred.value).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Prophet Model</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2" data-testid="prophet-predictions">
                          {forecastData.forecast.prophet.predictions.slice(0, 3).map((pred, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span>{pred.date}</span>
                              <span className="font-medium">{Math.round(pred.value).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : selectedOEM ? (
                <p className="text-center text-muted-foreground py-8">Select an OEM to view forecasts</p>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
