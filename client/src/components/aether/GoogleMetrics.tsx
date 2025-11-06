import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, MousePointerClick, Users, Target, AlertCircle } from "lucide-react";

export default function GoogleMetrics() {
  // Fetch GSC metrics
  const { data: gscData, isLoading: gscLoading } = useQuery<{
    mock: boolean;
    data: {
      clicks: number;
      impressions: number;
      ctr: number;
      position: number;
    };
    message?: string;
  }>({
    queryKey: ['/api/aether/integrations/google/gsc/metrics'],
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  // Fetch GA4 metrics  
  const { data: ga4Data, isLoading: ga4Loading } = useQuery<{
    mock: boolean;
    data: {
      sessions: number;
      users: number;
      conversions: number;
      bounceRate: number;
      avgSessionDuration: number;
    };
    message?: string;
  }>({
    queryKey: ['/api/aether/integrations/google/ga4/metrics'],
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const isMockMode = gscData?.mock || ga4Data?.mock;

  return (
    <div className="space-y-6">
      {/* Header with Status Badge */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Google Performance Metrics
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Last 7 days · Search Console & Analytics 4
          </p>
        </div>
        <Badge 
          variant={isMockMode ? "outline" : "default"}
          className={isMockMode 
            ? "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700" 
            : "bg-green-100 text-green-900 border-green-300 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700"
          }
        >
          {isMockMode ? "Mock Data" : "Live Data"}
        </Badge>
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

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* GSC Impressions */}
        <Card className="relative overflow-hidden border-2 border-blue-100 dark:border-blue-900 shadow-lg hover:shadow-xl transition-shadow">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full"></div>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Impressions
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-blue-600 dark:text-blue-400">
              {gscLoading ? "..." : (gscData?.data?.impressions || 0).toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
              Google Search visibility
            </p>
          </CardContent>
        </Card>

        {/* GSC Clicks */}
        <Card className="relative overflow-hidden border-2 border-emerald-100 dark:border-emerald-900 shadow-lg hover:shadow-xl transition-shadow">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-full"></div>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg">
                <MousePointerClick className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Clicks
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-emerald-600 dark:text-emerald-400">
              {gscLoading ? "..." : (gscData?.data?.clicks || 0).toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
              {gscData?.data?.ctr ? `${(gscData.data.ctr * 100).toFixed(2)}% CTR` : "0% CTR"}
            </p>
          </CardContent>
        </Card>

        {/* GA4 Users */}
        <Card className="relative overflow-hidden border-2 border-violet-100 dark:border-violet-900 shadow-lg hover:shadow-xl transition-shadow">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500/10 to-transparent rounded-bl-full"></div>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-violet-100 dark:bg-violet-900/40 rounded-lg">
                <Users className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Users
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-violet-600 dark:text-violet-400">
              {ga4Loading ? "..." : (ga4Data?.data?.users || 0).toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
              {ga4Data?.data?.sessions ? `${ga4Data.data.sessions.toLocaleString()} sessions` : "0 sessions"}
            </p>
          </CardContent>
        </Card>

        {/* GA4 Conversions */}
        <Card className="relative overflow-hidden border-2 border-rose-100 dark:border-rose-900 shadow-lg hover:shadow-xl transition-shadow">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-500/10 to-transparent rounded-bl-full"></div>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-100 dark:bg-rose-900/40 rounded-lg">
                <Target className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              </div>
              <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Conversions
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-rose-600 dark:text-rose-400">
              {ga4Loading ? "..." : (ga4Data?.data?.conversions || 0).toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
              {ga4Data?.data?.bounceRate ? `${(ga4Data.data.bounceRate * 100).toFixed(1)}% bounce` : "0% bounce"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
