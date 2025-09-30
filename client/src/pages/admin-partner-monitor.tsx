import { useQuery } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Clock,
} from 'lucide-react';

export default function AdminPartnerMonitorPage() {
  const [, params] = useRoute('/admin/partners/:sourceId/monitor');
  const sourceId = params?.sourceId;

  const { data: partnerData } = useQuery({
    queryKey: [`/api/admin/partners/${sourceId}`],
    enabled: !!sourceId,
  });

  const { data: statsDataRaw, isLoading: isLoadingStats } = useQuery({
    queryKey: [`/api/admin/partners/${sourceId}/stats`],
    enabled: !!sourceId,
  });

  const partner = partnerData as any;
  const statsData = statsDataRaw as any;
  const stats = statsData?.stats;
  const recentLogs = statsData?.recentLogs || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'partial':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-gray-950">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin/partners">
            <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Partners
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground dark:text-white" data-testid="text-page-title">
                {partner?.partnerName || 'Partner'} Monitoring
              </h1>
              <p className="text-muted-foreground dark:text-gray-400 mt-2">
                Ingestion statistics and activity logs
              </p>
            </div>
            {partner && (
              <Badge
                variant={partner.isActive ? 'default' : 'secondary'}
                data-testid="badge-partner-status"
              >
                {partner.isActive ? 'Active' : 'Inactive'}
              </Badge>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        {isLoadingStats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="h-24 bg-muted dark:bg-gray-900" />
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-card dark:bg-gray-900 border-border dark:border-gray-800">
              <CardHeader className="pb-3">
                <CardDescription className="text-muted-foreground dark:text-gray-400">
                  Total Listings
                </CardDescription>
                <CardTitle className="text-3xl text-foreground dark:text-white" data-testid="stat-total-listings">
                  {stats?.totalListings?.toLocaleString() || 0}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-muted-foreground dark:text-gray-400">
                  <Activity className="w-4 h-4 mr-2" />
                  Active in database
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card dark:bg-gray-900 border-border dark:border-gray-800">
              <CardHeader className="pb-3">
                <CardDescription className="text-muted-foreground dark:text-gray-400">
                  Total Processed
                </CardDescription>
                <CardTitle className="text-3xl text-foreground dark:text-white" data-testid="stat-total-processed">
                  {stats?.totalProcessed?.toLocaleString() || 0}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  {stats?.totalNew || 0} new
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card dark:bg-gray-900 border-border dark:border-gray-800">
              <CardHeader className="pb-3">
                <CardDescription className="text-muted-foreground dark:text-gray-400">
                  Successful Runs
                </CardDescription>
                <CardTitle className="text-3xl text-foreground dark:text-white" data-testid="stat-successful-runs">
                  {stats?.successfulRuns || 0}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-muted-foreground dark:text-gray-400">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {stats?.failedRuns || 0} failed
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card dark:bg-gray-900 border-border dark:border-gray-800">
              <CardHeader className="pb-3">
                <CardDescription className="text-muted-foreground dark:text-gray-400">
                  Rejected
                </CardDescription>
                <CardTitle className="text-3xl text-foreground dark:text-white" data-testid="stat-rejected">
                  {stats?.totalRejected?.toLocaleString() || 0}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-red-600 dark:text-red-400">
                  <TrendingDown className="w-4 h-4 mr-2" />
                  Compliance issues
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Activity Tabs */}
        <Tabs defaultValue="logs" className="space-y-6">
          <TabsList className="bg-muted dark:bg-gray-900">
            <TabsTrigger value="logs" data-testid="tab-logs">
              <Clock className="w-4 h-4 mr-2" />
              Recent Logs
            </TabsTrigger>
            <TabsTrigger value="overview" data-testid="tab-overview">
              <Activity className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="logs" className="space-y-4">
            {recentLogs.length === 0 ? (
              <Card className="bg-card dark:bg-gray-900 border-border dark:border-gray-800">
                <CardContent className="py-12 text-center">
                  <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground dark:text-white mb-2">
                    No ingestion logs yet
                  </h3>
                  <p className="text-muted-foreground dark:text-gray-400">
                    Logs will appear here after the first ingestion run
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {recentLogs.map((log: any) => (
                  <Card
                    key={log.id}
                    className="bg-card dark:bg-gray-900 border-border dark:border-gray-800"
                    data-testid={`card-log-${log.id}`}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-start gap-4">
                        <div className="mt-0.5">{getStatusIcon(log.status)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <Badge
                                variant={log.status === 'success' ? 'default' : 'destructive'}
                                data-testid={`badge-log-status-${log.id}`}
                              >
                                {log.status}
                              </Badge>
                              <span className="text-sm text-muted-foreground dark:text-gray-400" data-testid={`text-log-date-${log.id}`}>
                                {new Date(log.startedAt).toLocaleString()}
                              </span>
                            </div>
                            <div className="text-sm font-medium text-foreground dark:text-white">
                              {log.totalProcessed} processed
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground dark:text-gray-400">New: </span>
                              <span className="text-green-600 dark:text-green-400 font-medium" data-testid={`text-log-new-${log.id}`}>
                                {log.newListings}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground dark:text-gray-400">Updated: </span>
                              <span className="text-blue-600 dark:text-blue-400 font-medium" data-testid={`text-log-updated-${log.id}`}>
                                {log.updatedListings}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground dark:text-gray-400">Rejected: </span>
                              <span className="text-red-600 dark:text-red-400 font-medium" data-testid={`text-log-rejected-${log.id}`}>
                                {log.rejectedListings}
                              </span>
                            </div>
                          </div>

                          {log.errorMessage && (
                            <div className="mt-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-2 rounded">
                              {log.errorMessage}
                            </div>
                          )}

                          {log.finishedAt && (
                            <div className="mt-2 text-xs text-muted-foreground dark:text-gray-400">
                              Duration: {Math.round((new Date(log.finishedAt).getTime() - new Date(log.startedAt).getTime()) / 1000)}s
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="overview">
            <Card className="bg-card dark:bg-gray-900 border-border dark:border-gray-800">
              <CardHeader>
                <CardTitle className="text-foreground dark:text-white">Partner Information</CardTitle>
                <CardDescription className="text-muted-foreground dark:text-gray-400">
                  Configuration and sync settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {partner && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground dark:text-gray-400 mb-1">Feed Type</div>
                        <div className="font-medium text-foreground dark:text-white">{partner.feedType.toUpperCase()}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground dark:text-gray-400 mb-1">Health Status</div>
                        <Badge variant={partner.healthStatus === 'healthy' ? 'default' : 'destructive'}>
                          {partner.healthStatus}
                        </Badge>
                      </div>
                    </div>

                    {partner.sourceUrl && (
                      <div>
                        <div className="text-sm text-muted-foreground dark:text-gray-400 mb-1">Source URL</div>
                        <div className="font-mono text-sm text-foreground dark:text-white break-all">
                          {partner.sourceUrl}
                        </div>
                      </div>
                    )}

                    {partner.syncFrequencyHours && (
                      <div>
                        <div className="text-sm text-muted-foreground dark:text-gray-400 mb-1">Sync Frequency</div>
                        <div className="font-medium text-foreground dark:text-white">
                          Every {partner.syncFrequencyHours} hours
                        </div>
                      </div>
                    )}

                    {partner.lastSyncAt && (
                      <div>
                        <div className="text-sm text-muted-foreground dark:text-gray-400 mb-1">Last Sync</div>
                        <div className="font-medium text-foreground dark:text-white">
                          {new Date(partner.lastSyncAt).toLocaleString()}
                        </div>
                      </div>
                    )}

                    {partner.legalComplianceNotes && (
                      <div>
                        <div className="text-sm text-muted-foreground dark:text-gray-400 mb-1">Legal Compliance</div>
                        <div className="text-sm text-foreground dark:text-white whitespace-pre-wrap">
                          {partner.legalComplianceNotes}
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="text-sm text-muted-foreground dark:text-gray-400 mb-1">Field Mapping</div>
                      <pre className="text-xs font-mono bg-muted dark:bg-gray-950 p-3 rounded-md overflow-x-auto text-foreground dark:text-white">
                        {JSON.stringify(partner.fieldMapping || {}, null, 2)}
                      </pre>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
