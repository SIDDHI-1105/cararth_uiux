import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, Building2, Activity, BarChart3, Target } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';

interface SiamData {
  brand: string;
  model: string;
  segment: string;
  unitsSold: number;
  year: number;
  month: number;
}

interface Forecast {
  model: string;
  predictions: Array<{
    date: string;
    value: number;
    lower: number;
    upper: number;
  }>;
}

interface OEMMarketData {
  success: boolean;
  currentMonth: {
    year: number;
    month: number;
    data: SiamData[];
  };
  previousMonth: {
    year: number;
    month: number;
    data: SiamData[];
  };
  trends: {
    latestMonth: { year: number; month: number; units: number };
    previousMonth: { year: number; month: number; units: number };
    monthOverMonthChange: number;
    direction: 'up' | 'down' | 'stable';
  } | null;
  forecast: {
    sarima?: Forecast;
    prophet?: Forecast;
  } | null;
  historicalData: SiamData[];
}

interface Dealer {
  id: string;
  dealerName: string;
  dealerGroup: string;
  oemBrand: string;
  storeCode: string;
  city: string;
  state: string;
  isActive: boolean;
}

interface DealerPerformance {
  success: boolean;
  dealer: Dealer;
  metrics: {
    totalInventory: number;
    avgPrice: number;
    byCondition: Record<string, number>;
    byFuelType: Record<string, number>;
    byTransmission: Record<string, number>;
    byBodyType: Record<string, number>;
  };
  marketComparison: {
    national: {
      brand: string;
      recentMonths: SiamData[];
      avgMonthlySales: number;
    };
    regional: {
      state: string;
      city: string;
      brand: string;
      recentMonths: any[];
      avgMonthlyRegistrations: number;
    };
  } | null;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function MarketIntelligenceDashboard() {
  const [selectedTab, setSelectedTab] = useState('oem');
  const [selectedDealer, setSelectedDealer] = useState<string>('');

  // OEM Market Intelligence Query
  const { data: oemData, isLoading: oemLoading } = useQuery<OEMMarketData>({
    queryKey: ['/api/analytics/oem-market', { forecast: true }],
  });

  // Dealers List Query
  const { data: dealersData } = useQuery<{ success: boolean; dealers: Dealer[]; count: number }>({
    queryKey: ['/api/analytics/dealers'],
  });

  // Dealer Performance Query
  const { data: dealerData, isLoading: dealerLoading } = useQuery<DealerPerformance>({
    queryKey: [`/api/analytics/dealer-performance/${selectedDealer}`, { compareToMarket: true }],
    enabled: !!selectedDealer,
  });

  if (oemLoading) {
    return (
      <div className="flex items-center justify-center h-screen" data-testid="loading-container">
        <Activity className="w-8 h-8 animate-spin" data-testid="loading-spinner" />
      </div>
    );
  }

  // Prepare OEM chart data
  const oemCurrentData = oemData?.currentMonth.data || [];
  const oemPreviousData = oemData?.previousMonth.data || [];
  
  const brandComparisonData = oemCurrentData.reduce((acc, item) => {
    const existing = acc.find(x => x.brand === item.brand);
    if (existing) {
      existing.current += item.unitsSold;
    } else {
      const prevData = oemPreviousData.filter(x => x.brand === item.brand);
      const prevTotal = prevData.reduce((sum, x) => sum + x.unitsSold, 0);
      acc.push({
        brand: item.brand,
        current: item.unitsSold,
        previous: prevTotal,
      });
    }
    return acc;
  }, [] as Array<{ brand: string; current: number; previous: number }>);

  // Prepare forecast chart data
  const forecastData = oemData?.forecast?.prophet?.predictions.map(p => ({
    date: p.date.substring(0, 7),
    forecast: Math.round(p.value),
    lower: Math.round(p.lower),
    upper: Math.round(p.upper),
  })) || [];

  // Calculate dealer metrics charts
  const dealerInventoryByFuel = dealerData?.metrics.byFuelType 
    ? Object.entries(dealerData.metrics.byFuelType).map(([name, value]) => ({ name, value }))
    : [];

  const dealerInventoryByCondition = dealerData?.metrics.byCondition
    ? Object.entries(dealerData.metrics.byCondition).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="market-intelligence-dashboard">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-dashboard">
            Market Intelligence Analytics
          </h1>
          <p className="text-muted-foreground">
            OEM-level market insights & dealer performance analytics
          </p>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="oem" data-testid="tab-oem">
            <BarChart3 className="w-4 h-4 mr-2" />
            OEM Market Intelligence
          </TabsTrigger>
          <TabsTrigger value="dealer" data-testid="tab-dealer">
            <Building2 className="w-4 h-4 mr-2" />
            Dealer Performance
          </TabsTrigger>
        </TabsList>

        {/* OEM Market Intelligence Tab */}
        <TabsContent value="oem" className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card data-testid="card-latest-month">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Latest Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-latest-month">
                  {oemData?.currentMonth.year}-{String(oemData?.currentMonth.month).padStart(2, '0')}
                </div>
                <p className="text-sm text-muted-foreground">
                  Total: {oemCurrentData.reduce((sum, x) => sum + x.unitsSold, 0).toLocaleString()} units
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-mom-change">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Month-over-Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {oemData?.trends?.direction === 'up' ? (
                    <TrendingUp className="w-5 h-5 text-green-500" data-testid="icon-trending-up" />
                  ) : oemData?.trends?.direction === 'down' ? (
                    <TrendingDown className="w-5 h-5 text-red-500" data-testid="icon-trending-down" />
                  ) : null}
                  <span className="text-2xl font-bold" data-testid="text-mom-change">
                    {oemData?.trends?.monthOverMonthChange.toFixed(1)}%
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  vs {oemData?.previousMonth.year}-{String(oemData?.previousMonth.month).padStart(2, '0')}
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-top-brand">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Top OEM Brand
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-top-brand">
                  {brandComparisonData[0]?.brand || 'N/A'}
                </div>
                <p className="text-sm text-muted-foreground">
                  {brandComparisonData[0]?.current.toLocaleString()} units sold
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Brand Comparison Chart */}
          <Card data-testid="card-brand-comparison">
            <CardHeader>
              <CardTitle>OEM Brand Performance (N-1 Month Comparison)</CardTitle>
              <CardDescription>
                Current month vs previous month sales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={brandComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="brand" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="current" fill="#0088FE" name="Current Month" />
                  <Bar dataKey="previous" fill="#00C49F" name="Previous Month" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* ML Forecast Chart */}
          {forecastData.length > 0 && (
            <Card data-testid="card-forecast">
              <CardHeader>
                <CardTitle>3-Month ML Forecast (Prophet Model)</CardTitle>
                <CardDescription>
                  Predicted market trends with confidence intervals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={forecastData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="upper" 
                      stackId="1"
                      stroke="#82ca9d" 
                      fill="#82ca9d" 
                      fillOpacity={0.3}
                      name="Upper Bound"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="forecast" 
                      stackId="2"
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      name="Forecast"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="lower" 
                      stackId="1"
                      stroke="#ffc658" 
                      fill="#ffc658" 
                      fillOpacity={0.3}
                      name="Lower Bound"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Dealer Performance Tab */}
        <TabsContent value="dealer" className="space-y-6">
          {/* Dealer Selector */}
          <Card data-testid="card-dealer-selector">
            <CardHeader>
              <CardTitle>Select Dealer</CardTitle>
              <CardDescription>Choose a dealer to view performance analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedDealer} onValueChange={setSelectedDealer}>
                <SelectTrigger data-testid="select-dealer">
                  <SelectValue placeholder="Select a dealer" />
                </SelectTrigger>
                <SelectContent>
                  {dealersData?.dealers.map((dealer) => (
                    <SelectItem key={dealer.id} value={dealer.id} data-testid={`option-dealer-${dealer.id}`}>
                      {dealer.dealerName} ({dealer.oemBrand}) - {dealer.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Dealer Metrics */}
          {selectedDealer && dealerData && (
            <>
              {/* Dealer Info Card */}
              <Card data-testid="card-dealer-info">
                <CardHeader>
                  <CardTitle>{dealerData.dealer.dealerName}</CardTitle>
                  <CardDescription>
                    {dealerData.dealer.dealerGroup && `${dealerData.dealer.dealerGroup} • `}
                    {dealerData.dealer.oemBrand} • {dealerData.dealer.city}, {dealerData.dealer.state}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Inventory</p>
                      <p className="text-2xl font-bold" data-testid="text-total-inventory">
                        {dealerData.metrics.totalInventory}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Average Price</p>
                      <p className="text-2xl font-bold" data-testid="text-avg-price">
                        ₹{dealerData.metrics.avgPrice.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">OEM Brand</p>
                      <Badge className="mt-1" data-testid="badge-oem-brand">
                        {dealerData.dealer.oemBrand}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Inventory Distribution Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card data-testid="card-fuel-distribution">
                  <CardHeader>
                    <CardTitle>Inventory by Fuel Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={dealerInventoryByFuel}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#0088FE" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card data-testid="card-condition-distribution">
                  <CardHeader>
                    <CardTitle>Inventory by Condition</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={dealerInventoryByCondition}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#00C49F" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Market Comparison */}
              {dealerData.marketComparison && (
                <Card data-testid="card-market-comparison">
                  <CardHeader>
                    <CardTitle>Market Benchmarking</CardTitle>
                    <CardDescription>
                      Compare dealer performance against national & regional market
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold mb-2">National ({dealerData.marketComparison.national.brand})</h3>
                        <p className="text-sm text-muted-foreground">Avg Monthly Sales</p>
                        <p className="text-2xl font-bold" data-testid="text-national-avg">
                          {dealerData.marketComparison.national.avgMonthlySales.toLocaleString()} units
                        </p>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">
                          Regional ({dealerData.marketComparison.regional.city})
                        </h3>
                        <p className="text-sm text-muted-foreground">Avg Monthly Registrations</p>
                        <p className="text-2xl font-bold" data-testid="text-regional-avg">
                          {dealerData.marketComparison.regional.avgMonthlyRegistrations.toLocaleString()} units
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {dealerLoading && selectedDealer && (
            <div className="flex items-center justify-center py-8">
              <Activity className="w-6 h-6 animate-spin" data-testid="loading-dealer" />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
