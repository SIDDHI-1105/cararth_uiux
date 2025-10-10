import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, AlertCircle, CheckCircle, XCircle, BarChart3, Shield, 
  FileText, Clock, TrendingUp, Database, Users, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

interface PlatformStat {
  platform: string;
  totalListings: number;
  successfulPosts: number;
  failedPosts: number;
  successRate: number;
  lastPostAt: string | null;
}

interface AuditLog {
  id: string;
  platform: string;
  apiEndpoint: string;
  httpMethod: string;
  statusCode: number;
  isError: boolean;
  errorMessage: string | null;
  executionTime: number;
  createdAt: string;
}

interface ConsentLog {
  id: string;
  sellerId: string;
  sellerEmail: string;
  consentType: string;
  grantedAt: string;
  revokedAt: string | null;
  legalVersion: string;
}

export default function AdminSyndication() {
  const { data: healthData, isLoading: healthLoading, refetch: refetchHealth } = useQuery({
    queryKey: ['/admin/syndication/health'],
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  const { data: scraperData, isLoading: scraperLoading, refetch: refetchScrapers } = useQuery({
    queryKey: ['/api/scraper-health'],
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  const platformStats = (healthData as any)?.platforms || [];
  const recentLogs = (healthData as any)?.recentAuditLogs || [];
  const complianceData = (healthData as any)?.compliance || {};
  const scraperStats = (scraperData as any)?.scrapers || [];
  const scraperSummary = (scraperData as any)?.summary || { total: 0, healthy: 0, failing: 0 };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const getStatusColor = (isError: boolean) => {
    return isError ? 'text-red-500' : 'text-green-500';
  };

  const getStatusBadge = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) {
      return <Badge className="bg-green-500/10 text-green-700 border-green-200">Success</Badge>;
    } else if (statusCode >= 400 && statusCode < 500) {
      return <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-200">Client Error</Badge>;
    } else if (statusCode >= 500) {
      return <Badge className="bg-red-500/10 text-red-700 border-red-200">Server Error</Badge>;
    }
    return <Badge variant="outline">{statusCode}</Badge>;
  };

  if (healthLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground dark:text-white flex items-center gap-2">
            <Activity className="w-8 h-8" />
            Syndication Dashboard
          </h1>
          <p className="text-muted-foreground dark:text-gray-400 mt-1">
            Monitor multi-platform syndication, API health, and DPDP Act compliance
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => refetchHealth()}
            className="gap-2"
            data-testid="button-refresh"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Link href="/admin/partners">
            <Button variant="outline" data-testid="button-partners">
              Partner Settings
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="platforms" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="platforms" data-testid="tab-platforms">
            <BarChart3 className="w-4 h-4 mr-2" />
            Platform Stats
          </TabsTrigger>
          <TabsTrigger value="scrapers" data-testid="tab-scrapers">
            <Database className="w-4 h-4 mr-2" />
            Scrapers
          </TabsTrigger>
          <TabsTrigger value="audit" data-testid="tab-audit">
            <FileText className="w-4 h-4 mr-2" />
            Audit Logs
          </TabsTrigger>
          <TabsTrigger value="compliance" data-testid="tab-compliance">
            <Shield className="w-4 h-4 mr-2" />
            Compliance
          </TabsTrigger>
        </TabsList>

        {/* Platform Stats Tab */}
        <TabsContent value="platforms" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700 dark:text-blue-300">Total Platforms</p>
                    <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                      {platformStats.length}
                    </p>
                  </div>
                  <Database className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700 dark:text-green-300">Total Posts</p>
                    <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                      {platformStats.reduce((sum: number, p: PlatformStat) => sum + p.totalListings, 0)}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-700 dark:text-purple-300">Success Rate</p>
                    <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                      {platformStats.length > 0 
                        ? (platformStats.reduce((sum: number, p: PlatformStat) => sum + p.successRate, 0) / platformStats.length).toFixed(1)
                        : '0'}%
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-700 dark:text-orange-300">Active Sellers</p>
                    <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                      {complianceData.totalConsents || 0}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Platform Details */}
          <Card>
            <CardHeader>
              <CardTitle>Platform Performance</CardTitle>
              <CardDescription>
                Real-time syndication metrics for each platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {platformStats.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No syndication data available
                  </p>
                ) : (
                  platformStats.map((stat: PlatformStat) => (
                    <div
                      key={stat.platform}
                      className="p-4 rounded-lg border bg-card"
                      data-testid={`platform-${stat.platform.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">{stat.platform}</h3>
                          <Badge variant={stat.successRate >= 80 ? 'default' : 'destructive'}>
                            {stat.successRate.toFixed(1)}% success
                          </Badge>
                        </div>
                        {stat.lastPostAt && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            Last: {formatDate(stat.lastPostAt)}
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div className="flex items-center gap-2">
                          <Database className="w-4 h-4 text-blue-500" />
                          <span className="text-sm">
                            <strong>{stat.totalListings}</strong> total
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm">
                            <strong>{stat.successfulPosts}</strong> successful
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span className="text-sm">
                            <strong>{stat.failedPosts}</strong> failed
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scrapers Tab */}
        <TabsContent value="scrapers" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700 dark:text-blue-300">Total Scrapers</p>
                    <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                      {scraperSummary.total || 0}
                    </p>
                  </div>
                  <Database className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700 dark:text-green-300">Healthy</p>
                    <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                      {scraperSummary.healthy || 0}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-700 dark:text-red-300">Failing</p>
                    <p className="text-3xl font-bold text-red-900 dark:text-red-100">
                      {scraperSummary.failing || 0}
                    </p>
                  </div>
                  <XCircle className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Active Scrapers</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => refetchScrapers()}
                  data-testid="button-refresh-scrapers"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </CardTitle>
              <CardDescription>
                Monitor scraper health and trigger manual runs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {scraperStats.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No scrapers configured
                  </p>
                ) : (
                  scraperStats.map((scraper: any) => (
                    <div
                      key={scraper.name}
                      className="p-4 rounded-lg border border-border dark:border-gray-700 hover:bg-muted/50 dark:hover:bg-gray-900/50 transition-colors"
                      data-testid={`scraper-${scraper.name}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{scraper.name}</h3>
                            {scraper.status === 'healthy' ? (
                              <Badge className="bg-green-500/10 text-green-700 border-green-200">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Healthy
                              </Badge>
                            ) : scraper.status === 'failing' ? (
                              <Badge className="bg-red-500/10 text-red-700 border-red-200">
                                <XCircle className="w-3 h-3 mr-1" />
                                Failing
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                <Clock className="w-3 h-3 mr-1" />
                                Unknown
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">Total Runs:</span>
                              <span className="font-medium ml-1">{scraper.totalRuns || 0}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Success:</span>
                              <span className="font-medium ml-1 text-green-600">{scraper.successCount || 0}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Failed:</span>
                              <span className="font-medium ml-1 text-red-600">{scraper.failureCount || 0}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Last Run:</span>
                              <span className="font-medium ml-1">
                                {scraper.lastRunAt ? formatDate(scraper.lastRunAt) : 'Never'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {scraper.name === 'OLX Apify Scraper' && (
                          <Button
                            variant="default"
                            size="sm"
                            data-testid="button-trigger-olx-scrape"
                            onClick={async () => {
                              try {
                                const city = prompt('Enter city to scrape (e.g., Delhi, Mumbai):');
                                if (!city) return;
                                
                                const response = await fetch('/api/admin/scrape-olx', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ city, maxListings: 100 })
                                });
                                
                                if (response.ok) {
                                  alert(`OLX scraping started for ${city}!`);
                                  refetchScrapers();
                                } else {
                                  alert('Failed to start scraping');
                                }
                              } catch (error) {
                                alert('Error starting scraper');
                              }
                            }}
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Trigger Scrape
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent API Audit Logs</CardTitle>
              <CardDescription>
                Last 50 external API calls for compliance tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentLogs.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No audit logs available
                  </p>
                ) : (
                  recentLogs.map((log: AuditLog) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-lg border border-border dark:border-gray-700 hover:bg-muted/50 dark:hover:bg-gray-900/50 transition-colors"
                      data-testid={`audit-log-${log.id}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="font-mono text-xs">
                              {log.httpMethod}
                            </Badge>
                            <span className="font-medium text-sm truncate">
                              {log.platform}
                            </span>
                            {getStatusBadge(log.statusCode)}
                            {log.isError && (
                              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground font-mono truncate">
                            {log.apiEndpoint}
                          </p>
                          {log.errorMessage && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                              Error: {log.errorMessage}
                            </p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-muted-foreground">
                            {formatDate(log.createdAt)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {log.executionTime}ms
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700 dark:text-green-300">Active Consents</p>
                    <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                      {complianceData.activeConsents || 0}
                    </p>
                  </div>
                  <Shield className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">Revoked Consents</p>
                    <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">
                      {complianceData.revokedConsents || 0}
                    </p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700 dark:text-blue-300">Total Consents</p>
                    <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                      {complianceData.totalConsents || 0}
                    </p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>DPDP Act 2023 Compliance</CardTitle>
              <CardDescription>
                Seller consent tracking and data protection compliance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                        Compliant Syndication System
                      </h4>
                      <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                        <li>✓ Explicit consent obtained before syndication</li>
                        <li>✓ Consent revocation supported via dashboard</li>
                        <li>✓ All API calls logged for audit trail</li>
                        <li>✓ Seller data minimization implemented</li>
                        <li>✓ Purpose-limited data sharing to authorized platforms</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border border-border dark:border-gray-700">
                    <h4 className="font-semibold mb-2">Consent Management</h4>
                    <p className="text-sm text-muted-foreground">
                      All seller consents are tracked with timestamps, legal version, and revocation status. 
                      Sellers can withdraw consent at any time via their dashboard.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border border-border dark:border-gray-700">
                    <h4 className="font-semibold mb-2">Data Protection</h4>
                    <p className="text-sm text-muted-foreground">
                      Personal data is shared only with explicit consent. Deduplication prevents 
                      duplicate postings, and all API interactions are logged for compliance audits.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
