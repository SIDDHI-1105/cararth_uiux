import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { AlertCircle, CheckCircle, XCircle, TrendingUp, Database, Activity } from "lucide-react";

export default function AdminDiagnostics() {

  const { data: user, isLoading: userLoading, error: userError } = useQuery({ queryKey: ['/api/auth/user'] });

  const isAdmin = user && (user as any).isAdmin;

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
          <CardContent className="text-center text-muted-foreground">
            Please sign in to access the admin dashboard.
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-6 md:py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">
              Admin Diagnostics
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              System health monitoring and listing analytics
            </p>
          </div>
          <Badge variant="outline" className="self-start sm:self-auto" data-testid="badge-admin-access">
            Admin Access
          </Badge>
        </div>

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
      </div>
    </div>
  );
}
