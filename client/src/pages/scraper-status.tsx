import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Clock, TrendingUp } from "lucide-react";

interface ScraperHealth {
  success: boolean;
  overall: 'healthy' | 'degraded' | 'critical';
  scrapers: Array<{
    name: string;
    type: string;
    status: string;
    lastRun?: string;
    lastSuccess?: string;
    successRate24h: number;
    averageDurationMs?: number;
  }>;
  summary: {
    total: number;
    healthy: number;
    failing: number;
    lastCheck: string;
  };
  timestamp: string;
}

export default function ScraperStatus() {
  const { data: health, isLoading } = useQuery<ScraperHealth>({
    queryKey: ['/api/scraper-health'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-500';
      case 'running': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getOverallColor = (overall: string) => {
    switch (overall) {
      case 'healthy': return 'text-green-600 dark:text-green-400';
      case 'degraded': return 'text-yellow-600 dark:text-yellow-400';
      case 'critical': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600';
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-foreground">Scraper Health Monitor</h1>
          <p className="text-muted-foreground">Real-time monitoring of all listing ingestion sources</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-pulse text-muted-foreground">Loading status...</div>
          </div>
        ) : (
          <>
            {/* Overall Status */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  System Overview
                  <span className={`text-2xl ${getOverallColor(health?.overall || 'critical')}`}>
                    {health?.overall === 'healthy' ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                  </span>
                </CardTitle>
                <CardDescription>
                  Last updated: {health?.timestamp ? new Date(health.timestamp).toLocaleString() : 'Unknown'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-3xl font-bold text-foreground">{health?.summary.total || 0}</div>
                    <div className="text-sm text-muted-foreground">Total Scrapers</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">{health?.summary.healthy || 0}</div>
                    <div className="text-sm text-green-700 dark:text-green-300">Healthy</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                    <div className="text-3xl font-bold text-red-600 dark:text-red-400">{health?.summary.failing || 0}</div>
                    <div className="text-sm text-red-700 dark:text-red-300">Failing</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <div className={`text-3xl font-bold ${getOverallColor(health?.overall || 'critical')}`}>
                      {health?.overall?.toUpperCase() || 'UNKNOWN'}
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">Status</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Individual Scrapers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {health?.scrapers.map((scraper) => (
                <Card key={scraper.name} className="border-l-4" style={{ borderLeftColor: scraper.successRate24h >= 90 ? '#22c55e' : scraper.successRate24h >= 50 ? '#eab308' : '#ef4444' }}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {scraper.name}
                          <Badge variant={scraper.status === 'success' ? 'default' : 'destructive'}>
                            {scraper.status}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="mt-1">
                          <span className="capitalize">{scraper.type}</span> scraper
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold" style={{ color: scraper.successRate24h >= 90 ? '#22c55e' : scraper.successRate24h >= 50 ? '#eab308' : '#ef4444' }}>
                          {scraper.successRate24h}%
                        </div>
                        <div className="text-xs text-muted-foreground">24h success</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">Last Run</div>
                          <div className="text-muted-foreground">{formatTime(scraper.lastRun)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <div>
                          <div className="font-medium">Last Success</div>
                          <div className="text-muted-foreground">{formatTime(scraper.lastSuccess)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-500" />
                        <div>
                          <div className="font-medium">Avg Duration</div>
                          <div className="text-muted-foreground">{formatDuration(scraper.averageDurationMs)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(scraper.status)}`}></div>
                        <div>
                          <div className="font-medium">Current</div>
                          <div className="text-muted-foreground capitalize">{scraper.status}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {(!health?.scrapers || health.scrapers.length === 0) && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No scraper data available yet. Scrapers will appear here after their first run.
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
