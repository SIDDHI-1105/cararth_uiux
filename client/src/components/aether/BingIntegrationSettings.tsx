import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, RefreshCw, Loader2, AlertCircle, Info, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function BingIntegrationSettings() {
  const { toast } = useToast();

  const { data: status, isLoading: statusLoading } = useQuery<{
    connected: boolean;
    sites: Array<{ url: string; verified: boolean; indexed: boolean }>;
    tokenExpiry: string | null;
    needsRefresh: boolean;
    error?: string;
  }>({
    queryKey: ['/api/aether/bing/auth/status'],
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/aether/bing/auth/disconnect");
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Success!",
          description: "Bing Webmaster Tools disconnected successfully.",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/aether/bing/auth/status'] });
        queryClient.invalidateQueries({ queryKey: ['/api/aether/bing/data'] });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to disconnect.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to disconnect.",
        variant: "destructive",
      });
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/aether/bing/data/sync");
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Success!",
          description: `Sync completed. ${data.results.successful} succeeded, ${data.results.failed} failed.`,
        });
        queryClient.invalidateQueries({ queryKey: ['/api/aether/bing/data'] });
      } else {
        toast({
          title: "Error",
          description: data.error || "Sync failed.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Sync failed.",
        variant: "destructive",
      });
    },
  });

  const handleConnect = () => {
    window.location.href = '/api/aether/bing/auth/start';
  };

  const handleDisconnect = () => {
    if (confirm('Are you sure you want to disconnect Bing Webmaster Tools? This will remove all stored tokens and data.')) {
      disconnectMutation.mutate();
    }
  };

  const handleSync = () => {
    syncMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-slate-200 dark:border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                Bing Webmaster Tools Status
              </CardTitle>
              <CardDescription className="mt-1">
                Current connection status for Bing Search indexation and performance
              </CardDescription>
            </div>
            {statusLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            ) : status?.connected ? (
              <Badge className="bg-green-100 text-green-900 border-green-300 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge className="bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700">
                <XCircle className="h-4 w-4 mr-1" />
                Not Connected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {status?.connected && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <div>
                  <p className="font-medium text-sm">Token Status</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {status.needsRefresh ? 'Needs refresh' : 'Active'}
                  </p>
                </div>
                <Badge variant={status.needsRefresh ? "destructive" : "outline"}>
                  {status.needsRefresh ? 'Refresh Required' : 'Valid'}
                </Badge>
              </div>

              {status.tokenExpiry && (
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Token Expiry</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {new Date(status.tokenExpiry).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {status.sites && status.sites.length > 0 && (
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <p className="font-medium text-sm mb-2">Connected Sites</p>
                  <div className="space-y-2">
                    {status.sites.map((site, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">{site.url}</span>
                        <div className="flex gap-2">
                          {site.verified && (
                            <Badge variant="outline" className="text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                          {site.indexed && (
                            <Badge variant="outline" className="text-xs">
                              Indexed
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!status?.connected && (
            <Alert className="border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-900 dark:text-blue-200">
                Connect Bing Webmaster Tools to track search performance, indexation status, and crawl issues across Bing Search.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3 pt-2">
            {!status?.connected ? (
              <Button
                onClick={handleConnect}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                data-testid="button-connect-bing"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Connect Bing
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleSync}
                  disabled={syncMutation.isPending}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                  data-testid="button-sync-bing"
                >
                  {syncMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Sync Now
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    queryClient.invalidateQueries({ queryKey: ['/api/aether/bing/auth/status'] });
                    queryClient.invalidateQueries({ queryKey: ['/api/aether/bing/data'] });
                    toast({
                      title: "Refreshed",
                      description: "Bing integration status refreshed.",
                    });
                  }}
                  data-testid="button-refresh-bing"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>

                <Button
                  variant="destructive"
                  onClick={handleDisconnect}
                  disabled={disconnectMutation.isPending}
                  data-testid="button-disconnect-bing"
                >
                  {disconnectMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Disconnecting...
                    </>
                  ) : (
                    <>
                      <XCircle className="mr-2 h-4 w-4" />
                      Disconnect
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-blue-100 dark:border-blue-900 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-slate-900">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            About Bing Webmaster Tools Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3 text-slate-700 dark:text-slate-300">
          <div>
            <p className="font-semibold mb-1">What You'll Get</p>
            <p className="text-slate-600 dark:text-slate-400">
              • Real-time search performance metrics (impressions, clicks, CTR)<br />
              • Crawl issue detection and monitoring<br />
              • Sitemap status and indexation tracking<br />
              • Backlink analysis and quality scoring<br />
              • Automated nightly data synchronization
            </p>
          </div>
          <div>
            <p className="font-semibold mb-1">Prerequisites</p>
            <p className="text-slate-600 dark:text-slate-400">
              • Microsoft account with access to Bing Webmaster Tools<br />
              • At least one verified website in your Bing Webmaster account<br />
              • Admin permissions for your Bing Webmaster Tools account
            </p>
          </div>
          <div>
            <p className="font-semibold mb-1">Security & Privacy</p>
            <p className="text-slate-600 dark:text-slate-400">
              We only request read-only access to your Bing Webmaster data. Your Microsoft credentials are never stored on our servers.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
