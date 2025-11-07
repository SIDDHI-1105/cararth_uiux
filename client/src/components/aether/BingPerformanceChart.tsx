import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, MousePointerClick, Eye, Percent, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PerformanceData {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export default function BingPerformanceChart() {
  const { data: performanceData, isLoading } = useQuery<{ data: PerformanceData[] }>({
    queryKey: ['/api/aether/bing/data/performance', { days: 30 }],
  });

  if (isLoading) {
    return (
      <Card className="border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Bing Performance Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-slate-500">
            Loading performance data...
          </div>
        </CardContent>
      </Card>
    );
  }

  const data = performanceData?.data || [];
  
  const totalClicks = data.reduce((sum, d) => sum + Number(d.clicks || 0), 0);
  const totalImpressions = data.reduce((sum, d) => sum + Number(d.impressions || 0), 0);
  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions * 100) : 0;
  const avgPosition = data.length > 0 ? data.reduce((sum, d) => sum + Number(d.position || 0), 0) / data.length : 0;

  const chartData = data.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    clicks: Number(item.clicks || 0),
    impressions: Number(item.impressions || 0),
    ctr: Number(item.ctr || 0) * 100,
    position: Number(item.position || 0)
  }));

  return (
    <Card className="border-2 border-blue-200 dark:border-blue-800 shadow-lg bg-gradient-to-br from-white to-blue-50/30 dark:from-slate-900 dark:to-blue-950/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-bold">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Bing Performance Trends
        </CardTitle>
        <CardDescription>Last 30 days performance metrics from Bing Webmaster Tools</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-blue-100 dark:border-blue-900">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
              <MousePointerClick className="h-4 w-4" />
              <span className="text-xs font-medium">Total Clicks</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{totalClicks.toLocaleString()}</p>
          </div>
          
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-blue-100 dark:border-blue-900">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
              <Eye className="h-4 w-4" />
              <span className="text-xs font-medium">Total Impressions</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{totalImpressions.toLocaleString()}</p>
          </div>
          
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-blue-100 dark:border-blue-900">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
              <Percent className="h-4 w-4" />
              <span className="text-xs font-medium">Avg CTR</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{avgCtr.toFixed(2)}%</p>
          </div>
          
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-blue-100 dark:border-blue-900">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
              <Target className="h-4 w-4" />
              <span className="text-xs font-medium">Avg Position</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{avgPosition.toFixed(1)}</p>
          </div>
        </div>

        {/* Charts */}
        <Tabs defaultValue="clicks" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="clicks" data-testid="tab-clicks">Clicks</TabsTrigger>
            <TabsTrigger value="impressions" data-testid="tab-impressions">Impressions</TabsTrigger>
            <TabsTrigger value="ctr" data-testid="tab-ctr">CTR</TabsTrigger>
            <TabsTrigger value="position" data-testid="tab-position">Position</TabsTrigger>
          </TabsList>

          <TabsContent value="clicks" className="mt-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))' 
                  }} 
                />
                <Bar dataKey="clicks" fill="#2563eb" name="Clicks" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="impressions" className="mt-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))' 
                  }} 
                />
                <Bar dataKey="impressions" fill="#3b82f6" name="Impressions" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="ctr" className="mt-4">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" unit="%" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))' 
                  }}
                  formatter={(value: number) => `${value.toFixed(2)}%`}
                />
                <Line type="monotone" dataKey="ctr" stroke="#2563eb" strokeWidth={2} dot={{ fill: '#2563eb' }} name="CTR %" />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="position" className="mt-4">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" reversed domain={[0, 20]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))' 
                  }}
                  formatter={(value: number) => value.toFixed(1)}
                />
                <Line type="monotone" dataKey="position" stroke="#2563eb" strokeWidth={2} dot={{ fill: '#2563eb' }} name="Avg Position" />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-2">
              Lower position is better (1 = top of search results)
            </p>
          </TabsContent>
        </Tabs>

        {data.length === 0 && (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <p>No performance data available yet.</p>
            <p className="text-sm mt-2">Data will appear after Bing syncs your site performance.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
