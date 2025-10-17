import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Calendar, Activity, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

interface OEMPerformance {
  brand: string;
  actual: number;
  stateTotal: number;
  nationalTotal: number;
  nationalOEMCount: number;
  stateShare: number;
  nationalShare: number;
  vsNational: number;
}

interface MonthlyReport {
  success: boolean;
  reportPeriod: {
    month: number;
    year: number;
    label: string;
  };
  summary: {
    totalOEMs: number;
    stateTotal: number;
    nationalTotal: number;
  };
  performance: OEMPerformance[];
  monthlyTrends: Array<{
    brand: string;
    year: number;
    month: number;
    registrations: number;
    monthLabel: string;
  }>;
  predictions: Array<{
    brand: string;
    forecasts: Array<{ month: string; predicted: number }>;
  }>;
}

export default function MonthlyOEMReport() {
  const { data: reportData, isLoading } = useQuery<MonthlyReport>({
    queryKey: ['/api/dealer/analytics/monthly-report'],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Activity className="w-8 h-8 animate-spin" data-testid="loading-spinner" />
      </div>
    );
  }

  if (!reportData?.success) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">No report data available</p>
      </div>
    );
  }

  const { reportPeriod, summary, performance, monthlyTrends, predictions } = reportData;

  // Prepare benchmark comparison chart data
  const chartData = performance.map(oem => ({
    brand: oem.brand,
    'Telangana': oem.actual,
    'National': oem.nationalOEMCount,
  }));

  // Prepare month-wise trend chart data
  const uniqueMonths = [...new Set(monthlyTrends.map(t => t.monthLabel))].sort();
  const trendChartData = uniqueMonths.map(monthLabel => {
    const dataPoint: any = { month: monthLabel };
    performance.slice(0, 5).forEach(oem => {
      const trend = monthlyTrends.find(t => t.brand === oem.brand && t.monthLabel === monthLabel);
      if (trend) {
        dataPoint[oem.brand] = trend.registrations;
      }
    });
    return dataPoint;
  });

  // Prepare prediction chart data
  const predictionChartData = predictions.length > 0 ? predictions[0].forecasts.map((f, idx) => {
    const dataPoint: any = { month: f.month.substring(5, 7) };
    predictions.forEach(p => {
      if (p.forecasts[idx]) {
        dataPoint[p.brand] = p.forecasts[idx].predicted;
      }
    });
    return dataPoint;
  }) : [];

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="monthly-oem-report">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-report">OEM Monthly Performance Report</h1>
          <p className="text-muted-foreground mt-1" data-testid="text-report-period">
            <Calendar className="inline w-4 h-4 mr-1" />
            {reportPeriod.label} (N-1 Month)
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Telangana State Total</p>
          <p className="text-3xl font-bold" data-testid="text-state-total">{summary.stateTotal.toLocaleString()}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">OEMs Tracked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalOEMs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Top Performer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500" />
              <div className="text-lg font-bold">{performance[0]?.brand}</div>
            </div>
            <p className="text-xs text-muted-foreground">{performance[0]?.stateShare}% market share</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">National Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.nationalTotal.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All India registrations</p>
          </CardContent>
        </Card>
      </div>

      {/* Month-wise Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Month-wise OEM Performance Trends</CardTitle>
          <CardDescription>Last 12+ months registration trends for top OEMs</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={trendChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              {performance.slice(0, 5).map((oem, idx) => (
                <Line 
                  key={oem.brand} 
                  type="monotone" 
                  dataKey={oem.brand} 
                  stroke={['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'][idx]}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Benchmark Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Telangana vs National Performance ({reportPeriod.label})</CardTitle>
          <CardDescription>Current month comparison: Telangana state vs All India</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="brand" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Telangana" fill="#0088FE" />
              <Bar dataKey="National" fill="#FFBB28" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed OEM Performance Analysis</CardTitle>
          <CardDescription>Benchmark comparison with variance indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>OEM Brand</TableHead>
                <TableHead className="text-right">Telangana</TableHead>
                <TableHead className="text-right">All India</TableHead>
                <TableHead className="text-right">TG vs National</TableHead>
                <TableHead className="text-right">TG Share %</TableHead>
                <TableHead className="text-right">National Share %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {performance.map((oem) => (
                <TableRow key={oem.brand} data-testid={`row-oem-${oem.brand}`}>
                  <TableCell className="font-medium">{oem.brand}</TableCell>
                  <TableCell className="text-right font-semibold">{oem.actual.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-semibold">{oem.nationalOEMCount.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <div className={`flex items-center justify-end gap-1 ${oem.vsNational >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {oem.vsNational >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      <span className="font-medium">{oem.vsNational > 0 ? '+' : ''}{oem.vsNational}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={oem.stateShare > 15 ? 'default' : 'secondary'}>
                      {oem.stateShare}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline">
                      {oem.nationalShare}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Predictions */}
      {predictions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>3-Month Predictive Forecast (N+1, N+2, N+3)</CardTitle>
            <CardDescription>SARIMA model predictions for top OEMs</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={predictionChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                {predictions.map((p, idx) => (
                  <Line 
                    key={p.brand} 
                    type="monotone" 
                    dataKey={p.brand} 
                    stroke={['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'][idx % 5]}
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
