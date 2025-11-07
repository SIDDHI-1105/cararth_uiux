import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Sitemap {
  id: string;
  date: string;
  siteUrl: string;
  sitemapUrl: string;
  status: 'pending' | 'processed' | 'error';
  urlsSubmitted: number;
  urlsIndexed: number;
  lastSubmitted: string | null;
  lastProcessed: string | null;
  errors: any[];
  createdAt: string;
}

export default function BingSitemaps() {
  const { data: sitemapsData, isLoading } = useQuery<{ data: Sitemap[] }>({
    queryKey: ['/api/aether/bing/data/sitemaps'],
  });

  if (isLoading) {
    return (
      <Card className="border-purple-200 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600" />
            Sitemaps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500">Loading sitemap data...</div>
        </CardContent>
      </Card>
    );
  }

  const sitemaps = sitemapsData?.data || [];
  const totalSubmitted = sitemaps.reduce((sum, s) => sum + (s.urlsSubmitted || 0), 0);
  const totalIndexed = sitemaps.reduce((sum, s) => sum + (s.urlsIndexed || 0), 0);
  const indexationRate = totalSubmitted > 0 ? (totalIndexed / totalSubmitted) * 100 : 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processed':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Processed
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'error':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
            <XCircle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="border-2 border-purple-200 dark:border-purple-800 shadow-lg bg-gradient-to-br from-white to-purple-50/30 dark:from-slate-900 dark:to-purple-950/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-bold">
          <FileText className="h-5 w-5 text-purple-600" />
          Sitemaps
        </CardTitle>
        <CardDescription>Track sitemap submission and indexation status</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-purple-200 dark:border-purple-900">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
              <FileText className="h-4 w-4" />
              <span className="text-xs font-medium">Total Sitemaps</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{sitemaps.length}</p>
          </div>
          
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-purple-200 dark:border-purple-900">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
              <CheckCircle className="h-4 w-4" />
              <span className="text-xs font-medium">URLs Indexed</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{totalIndexed.toLocaleString()}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">of {totalSubmitted.toLocaleString()} submitted</p>
          </div>
          
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-purple-200 dark:border-purple-900">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
              <CheckCircle className="h-4 w-4" />
              <span className="text-xs font-medium">Indexation Rate</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{indexationRate.toFixed(1)}%</p>
            <Progress value={indexationRate} className="mt-2 h-2" />
          </div>
        </div>

        {/* Sitemaps List */}
        {sitemaps.length > 0 ? (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-2">Submitted Sitemaps</h4>
            {sitemaps.map((sitemap) => {
              const sitemapIndexationRate = sitemap.urlsSubmitted > 0 
                ? (sitemap.urlsIndexed / sitemap.urlsSubmitted) * 100 
                : 0;

              return (
                <div 
                  key={sitemap.id} 
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                  data-testid={`sitemap-${sitemap.id}`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {getStatusBadge(sitemap.status)}
                      </div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate" title={sitemap.sitemapUrl}>
                        {sitemap.sitemapUrl}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">URLs Submitted</p>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{sitemap.urlsSubmitted.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">URLs Indexed</p>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{sitemap.urlsIndexed.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-slate-500 dark:text-slate-400">Indexation Progress</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{sitemapIndexationRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={sitemapIndexationRate} className="h-2" />
                  </div>

                  {sitemap.lastProcessed && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      Last processed: {new Date(sitemap.lastProcessed).toLocaleDateString('en-IN')}
                    </p>
                  )}

                  {sitemap.errors && sitemap.errors.length > 0 && (
                    <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs">
                      <div className="flex items-center gap-1 text-red-700 dark:text-red-300 mb-1">
                        <AlertTriangle className="h-3 w-3" />
                        <span className="font-semibold">Errors detected</span>
                      </div>
                      <p className="text-red-600 dark:text-red-400">{sitemap.errors.length} issue(s) found</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <FileText className="h-12 w-12 mx-auto mb-2 text-purple-400" />
            <p>No sitemaps submitted yet.</p>
            <p className="text-sm mt-2">Submit your sitemap through Bing Webmaster Tools.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
