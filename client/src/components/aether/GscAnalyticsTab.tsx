import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, MousePointerClick, Eye, Percent, Target, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

interface AnalyticsData {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface IndexingStatus {
  totalPages: number;
  indexed: number;
  notIndexed: number;
  excluded: number;
  errors: number;
}

interface TopPage {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface TopQuery {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export default function GscAnalyticsTab() {
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery<{ 
    data: AnalyticsData[]; 
    mock: boolean;
    source: 'live' | 'cached';
  }>({
    queryKey: ['/api/aether/gsc/data/analytics', { days: 7 }],
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const { data: indexingData, isLoading: indexingLoading } = useQuery<{ 
    data: IndexingStatus;
    mock: boolean;
  }>({
    queryKey: ['/api/aether/gsc/data/indexing'],
    refetchInterval: 300000,
  });

  const { data: topPagesData, isLoading: topPagesLoading } = useQuery<{ 
    data: TopPage[];
    mock: boolean;
  }>({
    queryKey: ['/api/aether/gsc/data/top-pages', { limit: 10 }],
    refetchInterval: 300000,
  });

  const { data: topQueriesData, isLoading: topQueriesLoading } = useQuery<{ 
    data: TopQuery[];
    mock: boolean;
  }>({
    queryKey: ['/api/aether/gsc/data/top-queries', { limit: 10 }],
    refetchInterval: 300000,
  });

  if (analyticsLoading) {
    return (
      <div className="space-y-6">
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Google Search Console Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-slate-500">
              Loading performance data...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const analytics = analyticsData?.data || [];
  const isMockMode = analyticsData?.mock || false;
  const dataSource = analyticsData?.source || 'live';
  
  const totalClicks = analytics.reduce((sum, d) => sum + Number(d.clicks || 0), 0);
  const totalImpressions = analytics.reduce((sum, d) => sum + Number(d.impressions || 0), 0);
  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions * 100) : 0;
  const avgPosition = analytics.length > 0 ? analytics.reduce((sum, d) => sum + Number(d.position || 0), 0) / analytics.length : 0;

  const chartData = analytics.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    clicks: Number(item.clicks || 0),
    impressions: Number(item.impressions || 0),
    ctr: Number(item.ctr || 0) * 100,
    position: Number(item.position || 0)
  }));

  const indexingStatus = indexingData?.data;
  const indexationRate = indexingStatus ? 
    (indexingStatus.indexed / indexingStatus.totalPages * 100) : 0;

  const topPages = topPagesData?.data || [];
  const topQueries = topQueriesData?.data || [];

  return (
    <div className="space-y-6">
      {/* Header with Status Badges */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Google Search Console Analytics
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Last 7 days · Real-time search performance
          </p>
        </div>
        <div className="flex gap-2">
          <Badge 
            variant={isMockMode ? "outline" : "default"}
            className={isMockMode 
              ? "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700" 
              : "bg-green-100 text-green-900 border-green-300 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700"
            }
          >
            {isMockMode ? "Mock Data" : "Live Data"}
          </Badge>
          {!isMockMode && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300">
              {dataSource === 'live' ? '🟢 Real-time' : '💾 Cached'}
            </Badge>
          )}
        </div>
      </div>

      {/* Mock Mode Warning */}
      {isMockMode && (
        <Alert className="border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-amber-900 dark:text-amber-200">
            Using sample data. Configure Google Service Account credentials in Settings to see real metrics.
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-slate-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <MousePointerClick className="h-4 w-4" />
              Total Clicks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-400">
              {totalClicks.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Last 7 days
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-slate-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Impressions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700 dark:text-purple-400">
              {totalImpressions.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Search appearances
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-slate-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Avg CTR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700 dark:text-green-400">
              {avgCtr.toFixed(2)}%
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Click-through rate
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-slate-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Avg Position
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-700 dark:text-amber-400">
              {avgPosition.toFixed(1)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Search ranking
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      <Card className="border-2 border-blue-200 dark:border-blue-800 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-bold">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Search Performance Trends
          </CardTitle>
          <CardDescription>
            Daily metrics from Google Search Console
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="clicks" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="clicks">Clicks</TabsTrigger>
              <TabsTrigger value="impressions">Impressions</TabsTrigger>
              <TabsTrigger value="ctr">CTR</TabsTrigger>
              <TabsTrigger value="position">Position</TabsTrigger>
            </TabsList>

            <TabsContent value="clicks" className="mt-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="clicks" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center mt-2">
                Number of clicks from Google Search results
              </p>
            </TabsContent>

            <TabsContent value="impressions" className="mt-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="impressions" fill="#a855f7" />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center mt-2">
                Number of times your site appeared in search results
              </p>
            </TabsContent>

            <TabsContent value="ctr" className="mt-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                  <Line type="monotone" dataKey="ctr" stroke="#22c55e" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center mt-2">
                Percentage of impressions that resulted in clicks
              </p>
            </TabsContent>

            <TabsContent value="position" className="mt-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis reversed domain={[0, 20]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="position" stroke="#f59e0b" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center mt-2">
                Lower position is better (1 = top of search results)
              </p>
            </TabsContent>
          </Tabs>

          {chartData.length === 0 && (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <p>No performance data available yet.</p>
              <p className="text-sm mt-2">Data will appear after Google syncs your site performance.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Indexing Status */}
      {indexingStatus && (
        <Card className="border-2 border-green-200 dark:border-green-800 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Indexing Status
            </CardTitle>
            <CardDescription>
              Overview of how Google indexes your pages
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                  {indexingStatus.totalPages.toLocaleString()}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Total Pages
                </div>
              </div>

              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-3xl font-bold text-green-700 dark:text-green-400">
                  {indexingStatus.indexed.toLocaleString()}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                  Indexed
                </div>
              </div>

              <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <div className="text-3xl font-bold text-amber-700 dark:text-amber-400">
                  {indexingStatus.notIndexed.toLocaleString()}
                </div>
                <div className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                  Not Indexed
                </div>
              </div>

              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-3xl font-bold text-red-700 dark:text-red-400">
                  {indexingStatus.errors.toLocaleString()}
                </div>
                <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                  Errors
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-600 dark:text-slate-400">Indexation Rate</span>
                <span className="font-semibold text-slate-900 dark:text-slate-50">
                  {indexationRate.toFixed(1)}%
                </span>
              </div>
              <Progress value={indexationRate} className="h-2" />
            </div>

            {indexingStatus.notIndexed > 0 && (
              <Alert className="border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription className="text-amber-900 dark:text-amber-200">
                  {indexingStatus.notIndexed} pages are not indexed. This may include pages excluded by robots.txt, 
                  duplicate content, or pages pending crawl. GSC updates can take 2-4 weeks to reflect recent changes.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Top Pages and Queries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-indigo-200 dark:border-indigo-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
              Top Pages
            </CardTitle>
            <CardDescription>
              Best performing pages by clicks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPages.slice(0, 5).map((page, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">
                      {page.page}
                    </p>
                    <div className="flex gap-4 mt-1 text-xs text-slate-600 dark:text-slate-400">
                      <span>{page.clicks} clicks</span>
                      <span>{page.impressions.toLocaleString()} impr.</span>
                      <span>Pos. {page.position.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              ))}
              {topPages.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                  No page data available yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-violet-200 dark:border-violet-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-violet-600" />
              Top Queries
            </CardTitle>
            <CardDescription>
              Best performing search queries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topQueries.slice(0, 5).map((query, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">
                      {query.query}
                    </p>
                    <div className="flex gap-4 mt-1 text-xs text-slate-600 dark:text-slate-400">
                      <span>{query.clicks} clicks</span>
                      <span>{query.impressions.toLocaleString()} impr.</span>
                      <span>Pos. {query.position.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              ))}
              {topQueries.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                  No query data available yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
