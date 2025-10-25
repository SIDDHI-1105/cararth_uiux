import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { AlertCircle, CheckCircle, XCircle, TrendingUp, Database, Activity, LogIn, Newspaper, Users, BarChart3, MessageSquare } from "lucide-react";
import { AuthDialog } from "@/components/auth-dialog";

export default function AdminDiagnostics() {

  const { data: user, isLoading: userLoading, error: userError } = useQuery({ queryKey: ['/api/auth/user'] });

  const isAdmin = user && ((user as any).isAdmin || (user as any).role === 'admin');

  const { data: diagnostics, isLoading: diagnosticsLoading, error: diagnosticsError } = useQuery({
    queryKey: ['/api/admin/diagnostics'],
    enabled: !!isAdmin,
    refetchInterval: 60000,
  });

  const { data: metricsData, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/admin/listing-metrics'],
    enabled: !!isAdmin,
    refetchInterval: 300000,
  });

  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ['/api/admin/scraper-logs'],
    enabled: !!isAdmin,
    refetchInterval: 30000,
  });

  const { data: throttleAnalytics, isLoading: throttleLoading } = useQuery({
    queryKey: ['/api/admin/throttle-analytics'],
    enabled: !!isAdmin,
    refetchInterval: 60000,
  });

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Loading...</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (userError || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center" data-testid="text-auth-required">Authentication Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              Please sign in to access the admin dashboard.
            </p>
            <div className="flex justify-center">
              <AuthDialog
                trigger={
                  <Button size="lg" className="w-full max-w-xs" data-testid="button-login">
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </Button>
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-center text-red-600 dark:text-red-400" data-testid="text-access-denied">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground">
            You do not have admin privileges to access this page.
          </CardContent>
        </Card>
      </div>
    );
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-6 md:py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">
              Admin Diagnostics
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              System health monitoring and analytics
            </p>
          </div>
          <Badge variant="outline" className="self-start sm:self-auto" data-testid="badge-admin-access">
            Admin Access
          </Badge>
        </div>

        <Tabs defaultValue="listings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
            <TabsTrigger value="listings" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Car Listings
            </TabsTrigger>
            <TabsTrigger value="throttle" className="flex items-center gap-2">
              <Newspaper className="h-4 w-4" />
              Throttle Talk
            </TabsTrigger>
          </TabsList>

          {/* Car Listings Tab */}
          <TabsContent value="listings" className="space-y-6">

        {diagnosticsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-500" data-testid="card-total-listings">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Total Listings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl md:text-3xl font-bold" data-testid="text-total-count">
                  {(diagnostics as any)?.listings?.total?.toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Across all sources</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500" data-testid="card-ethical-ai">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Ethical AI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400" data-testid="text-ethical-ai-count">
                  {(diagnostics as any)?.listings?.ethicalAi?.toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {(diagnostics as any)?.listings?.total ? Math.round(((diagnostics as any).listings.ethicalAi / (diagnostics as any).listings.total) * 100) : 0}% of total
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500" data-testid="card-exclusive-dealer">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Exclusive Dealer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl md:text-3xl font-bold text-purple-600 dark:text-purple-400" data-testid="text-exclusive-dealer-count">
                  {(diagnostics as any)?.listings?.exclusiveDealer?.toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {(diagnostics as any)?.listings?.total ? Math.round(((diagnostics as any).listings.exclusiveDealer / (diagnostics as any).listings.total) * 100) : 0}% of total
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500" data-testid="card-user-direct">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  User Direct
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl md:text-3xl font-bold text-orange-600 dark:text-orange-400" data-testid="text-user-direct-count">
                  {(diagnostics as any)?.listings?.userDirect?.toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {(diagnostics as any)?.listings?.total ? Math.round(((diagnostics as any).listings.userDirect / (diagnostics as any).listings.total) * 100) : 0}% of total
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card data-testid="card-growth-chart">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                30-Day Growth Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : metricsData && (metricsData as any[]).length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metricsData as any[]}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                    <XAxis
                      dataKey="date"
                      className="text-xs"
                      tick={{ fill: 'currentColor' }}
                    />
                    <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '0.5rem',
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="totalListings" stroke="#3b82f6" name="Total" strokeWidth={2} />
                    <Line type="monotone" dataKey="ethicalAiCount" stroke="#10b981" name="Ethical AI" strokeWidth={2} />
                    <Line type="monotone" dataKey="exclusiveDealerCount" stroke="#a855f7" name="Exclusive Dealer" strokeWidth={2} />
                    <Line type="monotone" dataKey="userDirectCount" stroke="#f97316" name="User Direct" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No trend data available yet
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-portal-breakdown">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Portal Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              {diagnosticsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (diagnostics as any)?.listings?.byPortal ? (
                <div className="space-y-3">
                  {Object.entries((diagnostics as any).listings.byPortal)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .map(([portal, count]) => (
                      <div
                        key={portal}
                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        data-testid={`portal-${portal.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <span className="font-medium">{portal}</span>
                        <Badge variant="secondary" data-testid={`count-${portal.toLowerCase().replace(/\s+/g, '-')}`}>
                          {(count as number).toLocaleString()}
                        </Badge>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No portal data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card data-testid="card-scraper-logs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Recent Scraper Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : logsData && (logsData as any[]).length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {(logsData as any[]).map((log: any, index: number) => (
                  <div
                    key={index}
                    className="p-3 md:p-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10"
                    data-testid={`error-log-${index}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                        <span className="font-medium text-sm text-red-700 dark:text-red-300">
                          {log.scraperName || log.portal || 'Unknown'}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.timestamp || log.lastRun).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-red-600 dark:text-red-400 break-words">
                      {log.errorMessage || log.lastError || 'No error message'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8 flex items-center justify-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                No recent errors - all scrapers healthy!
              </div>
            )}
          </CardContent>
        </Card>
          </TabsContent>

          {/* Throttle Talk Analytics Tab */}
          <TabsContent value="throttle" className="space-y-6">
            {throttleLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-5 w-24" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-16" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <>
                {/* Newsletter Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Newsletter Subscribers
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {(throttleAnalytics as any)?.newsletter?.totalActive?.toLocaleString() || 0}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Active subscriptions</p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Total Polls
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400">
                        {(throttleAnalytics as any)?.polls?.total || 0}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {(throttleAnalytics as any)?.polls?.active || 0} active
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-purple-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        User Stories
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl md:text-3xl font-bold text-purple-600 dark:text-purple-400">
                        {(throttleAnalytics as any)?.stories?.total || 0}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {(throttleAnalytics as any)?.stories?.approved || 0} approved
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-orange-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Poll Votes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl md:text-3xl font-bold text-orange-600 dark:text-orange-400">
                        {(throttleAnalytics as any)?.polls?.totalVotes?.toLocaleString() || 0}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Total engagement</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts and Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Newsletter Frequency Breakdown */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Newsletter Frequency Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(throttleAnalytics as any)?.newsletter?.byFrequency && 
                       Object.keys((throttleAnalytics as any).newsletter.byFrequency).length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                              data={Object.entries((throttleAnalytics as any).newsletter.byFrequency).map(([freq, count]) => ({
                                name: freq.charAt(0).toUpperCase() + freq.slice(1),
                                value: count,
                              }))}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {Object.keys((throttleAnalytics as any).newsletter.byFrequency).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[250px] flex flex-col items-center justify-center text-muted-foreground">
                          <Users className="h-12 w-12 mb-2 opacity-30" />
                          <p>No newsletter subscribers yet</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Story Moderation Status */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Story Moderation Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(throttleAnalytics as any)?.stories?.total > 0 ? (
                        <div className="space-y-3">
                          {['approved', 'flagged', 'rejected'].map((status) => {
                            const count = (throttleAnalytics as any).stories[status] || 0;
                            const total = (throttleAnalytics as any).stories.total || 1;
                            const percentage = Math.round((count / total) * 100);
                            
                            return (
                              <div key={status} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span className="capitalize">{status}</span>
                                  <span className="font-medium">{count}</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${
                                      status === 'approved' ? 'bg-green-500' :
                                      status === 'flagged' ? 'bg-yellow-500' :
                                      'bg-red-500'
                                    }`}
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-muted-foreground py-8">
                          <MessageSquare className="h-12 w-12 mb-2 opacity-30" />
                          <p>No user stories submitted yet</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Content Generations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Recent Content Generations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(throttleAnalytics as any)?.contentGeneration?.recentGenerations?.length > 0 ? (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {(throttleAnalytics as any).contentGeneration.recentGenerations.map((gen: any, index: number) => (
                          <div
                            key={gen.id || index}
                            className={`p-3 rounded-lg border ${
                              gen.status === 'success'
                                ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10'
                                : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2">
                                {gen.status === 'success' ? (
                                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                                )}
                                <span className="font-medium text-sm">
                                  {gen.articlesGenerated || 0} articles via {gen.provider || 'AI'}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(gen.createdAt).toLocaleString()}
                              </span>
                            </div>
                            {gen.error && (
                              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                Error: {gen.error}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-muted-foreground py-8">
                        <Newspaper className="h-12 w-12 mb-2 opacity-30" />
                        <p>No content generation logs yet</p>
                        <p className="text-xs mt-1">Automated articles will appear here</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
