import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle, RefreshCw, Loader2, AlertCircle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function GoogleIntegrationSettings() {
  const { toast } = useToast();
  const [serviceAccountEmail, setServiceAccountEmail] = useState("");
  const [serviceAccountPrivateKey, setServiceAccountPrivateKey] = useState("");
  const [gscSiteUrl, setGscSiteUrl] = useState("");
  const [ga4PropertyId, setGa4PropertyId] = useState("");

  // Fetch integration status
  const { data: status, isLoading: statusLoading } = useQuery<{
    connected: boolean;
    tokenType: string | null;
    gscConfigured: boolean;
    gscSiteUrl: string | null;
    ga4Configured: boolean;
    ga4PropertyId: string | null;
    error?: string;
  }>({
    queryKey: ['/api/aether/integrations/google/status'],
  });

  // Setup mutation
  const setupMutation = useMutation({
    mutationFn: async (data: {
      serviceAccountEmail: string;
      serviceAccountPrivateKey: string;
      gscSiteUrl?: string;
      ga4PropertyId?: string;
    }) => {
      const response = await apiRequest("POST", "/api/aether/integrations/google/setup", data);
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Success!",
          description: "Google integration configured successfully.",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/aether/integrations/google/status'] });
        queryClient.invalidateQueries({ queryKey: ['/api/aether/integrations/google/gsc/metrics'] });
        queryClient.invalidateQueries({ queryKey: ['/api/aether/integrations/google/ga4/metrics'] });
        
        // Clear form
        setServiceAccountEmail("");
        setServiceAccountPrivateKey("");
        setGscSiteUrl("");
        setGa4PropertyId("");
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to configure integration.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to configure integration.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!serviceAccountEmail || !serviceAccountPrivateKey) {
      toast({
        title: "Validation Error",
        description: "Service account email and private key are required.",
        variant: "destructive",
      });
      return;
    }

    setupMutation.mutate({
      serviceAccountEmail,
      serviceAccountPrivateKey,
      gscSiteUrl: gscSiteUrl || undefined,
      ga4PropertyId: ga4PropertyId || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card className="border-2 border-slate-200 dark:border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                Google Integration Status
              </CardTitle>
              <CardDescription className="mt-1">
                Current connection status for Search Console and Analytics
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
                  <p className="font-medium text-sm">Connection Type</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {status.tokenType === 'service_account' ? 'Service Account' : 'OAuth'}
                  </p>
                </div>
                <Badge variant="outline">
                  {status.tokenType}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <div>
                  <p className="font-medium text-sm">Search Console</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {status.gscConfigured ? status.gscSiteUrl : 'Not configured'}
                  </p>
                </div>
                {status.gscConfigured ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircle className="h-5 w-5 text-slate-400" />
                )}
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <div>
                  <p className="font-medium text-sm">Google Analytics 4</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {status.ga4Configured ? `Property ID: ${status.ga4PropertyId}` : 'Not configured'}
                  </p>
                </div>
                {status.ga4Configured ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircle className="h-5 w-5 text-slate-400" />
                )}
              </div>
            </div>
          )}

          {!status?.connected && (
            <Alert className="border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-900 dark:text-blue-200">
                Configure your Google Service Account below to start tracking real Search Console and Analytics data.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Configuration Form */}
      <Card className="border-2 border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-xl font-bold">
            {status?.connected ? 'Update Configuration' : 'Setup Google Integration'}
          </CardTitle>
          <CardDescription>
            Add your Google Service Account credentials to enable real-time data tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Alert className="border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-amber-900 dark:text-amber-200 text-sm">
                <strong>New credentials will override existing configuration.</strong> Make sure you have the service account added to both Search Console and GA4.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="service-account-email">Service Account Email *</Label>
              <Input
                id="service-account-email"
                type="email"
                placeholder="name@project-id.iam.gserviceaccount.com"
                value={serviceAccountEmail}
                onChange={(e) => setServiceAccountEmail(e.target.value)}
                required
                data-testid="input-service-account-email"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                The email address from your service account JSON file
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-account-key">Service Account Private Key *</Label>
              <Textarea
                id="service-account-key"
                placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                value={serviceAccountPrivateKey}
                onChange={(e) => setServiceAccountPrivateKey(e.target.value)}
                required
                rows={6}
                className="font-mono text-sm"
                data-testid="input-service-account-key"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Copy the entire private_key value from your service account JSON file
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gsc-site-url">Search Console Site URL</Label>
              <Input
                id="gsc-site-url"
                type="text"
                placeholder="sc-domain:cararth.com or https://www.cararth.com/"
                value={gscSiteUrl}
                onChange={(e) => setGscSiteUrl(e.target.value)}
                data-testid="input-gsc-site-url"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Use "sc-domain:yourdomain.com" for domain property or full URL for specific site
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ga4-property-id">GA4 Property ID</Label>
              <Input
                id="ga4-property-id"
                type="text"
                placeholder="123456789"
                value={ga4PropertyId}
                onChange={(e) => setGa4PropertyId(e.target.value)}
                data-testid="input-ga4-property-id"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Just the numeric property ID (not the full "properties/123456789" path)
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={setupMutation.isPending}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                data-testid="button-save-configuration"
              >
                {setupMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {status?.connected ? 'Update Configuration' : 'Connect Google'}
                  </>
                )}
              </Button>

              {status?.connected && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    queryClient.invalidateQueries({ queryKey: ['/api/aether/integrations/google/status'] });
                    queryClient.invalidateQueries({ queryKey: ['/api/aether/integrations/google/gsc/metrics'] });
                    queryClient.invalidateQueries({ queryKey: ['/api/aether/integrations/google/ga4/metrics'] });
                    toast({
                      title: "Refreshed",
                      description: "Integration status and metrics refreshed.",
                    });
                  }}
                  data-testid="button-refresh"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Status
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Help Card */}
      <Card className="border-2 border-blue-100 dark:border-blue-900 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-slate-900">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            How to Get Your Service Account Credentials
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3 text-slate-700 dark:text-slate-300">
          <div>
            <p className="font-semibold mb-1">1. Create a Google Cloud Project</p>
            <p className="text-slate-600 dark:text-slate-400">
              Go to console.cloud.google.com and create a new project or select an existing one
            </p>
          </div>
          <div>
            <p className="font-semibold mb-1">2. Create a Service Account</p>
            <p className="text-slate-600 dark:text-slate-400">
              Navigate to IAM & Admin → Service Accounts → Create Service Account
            </p>
          </div>
          <div>
            <p className="font-semibold mb-1">3. Generate a Key</p>
            <p className="text-slate-600 dark:text-slate-400">
              Click on your service account → Keys tab → Add Key → Create new key (JSON format)
            </p>
          </div>
          <div>
            <p className="font-semibold mb-1">4. Grant Permissions</p>
            <p className="text-slate-600 dark:text-slate-400">
              • In Search Console: Add service account email as an owner or full user
              <br />
              • In GA4: Add service account email with Viewer role
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
