import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CrawlIssue {
  id: string;
  date: string;
  siteUrl: string;
  url: string;
  issueType: string;
  severity: 'critical' | 'warning' | 'info';
  details: any;
  resolved: boolean;
  resolvedAt: string | null;
  createdAt: string;
}

export default function BingCrawlIssues() {
  const { data: issuesData, isLoading } = useQuery<{ data: CrawlIssue[] }>({
    queryKey: ['/api/aether/bing/data/crawl-issues'],
  });

  if (isLoading) {
    return (
      <Card className="border-amber-200 dark:border-amber-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Crawl Issues
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500">Loading crawl issues...</div>
        </CardContent>
      </Card>
    );
  }

  const issues = issuesData?.data || [];
  const unresolvedIssues = issues.filter(i => !i.resolved);
  const criticalCount = unresolvedIssues.filter(i => i.severity === 'critical').length;
  const warningCount = unresolvedIssues.filter(i => i.severity === 'warning').length;

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'warning':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    }
  };

  const getIssueTypeLabel = (type: string) => {
    switch (type) {
      case 'crawl_error':
        return 'Crawl Error';
      case 'not_found':
        return '404 Not Found';
      case 'blocked':
        return 'Blocked by robots.txt';
      case 'redirect':
        return 'Redirect Chain';
      default:
        return type;
    }
  };

  return (
    <Card className="border-2 border-amber-200 dark:border-amber-800 shadow-lg bg-gradient-to-br from-white to-amber-50/30 dark:from-slate-900 dark:to-amber-950/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-bold">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          Crawl Issues
        </CardTitle>
        <CardDescription>Issues detected by Bing when crawling your site</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-red-200 dark:border-red-900">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-1">
              <XCircle className="h-4 w-4" />
              <span className="text-xs font-medium">Critical</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{criticalCount}</p>
          </div>
          
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-amber-200 dark:border-amber-900">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs font-medium">Warnings</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{warningCount}</p>
          </div>
          
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-green-200 dark:border-green-900">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
              <CheckCircle className="h-4 w-4" />
              <span className="text-xs font-medium">Resolved</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{issues.filter(i => i.resolved).length}</p>
          </div>
        </div>

        {/* Issues List */}
        {unresolvedIssues.length > 0 ? (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-2">Unresolved Issues</h4>
            {unresolvedIssues.slice(0, 10).map((issue) => (
              <div 
                key={issue.id} 
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                data-testid={`issue-${issue.id}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {getSeverityIcon(issue.severity)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge className={getSeverityColor(issue.severity)}>
                          {issue.severity.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">{getIssueTypeLabel(issue.issueType)}</Badge>
                      </div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate" title={issue.url}>
                        {issue.url}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Detected: {new Date(issue.date).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {unresolvedIssues.length > 10 && (
              <p className="text-sm text-center text-slate-500 dark:text-slate-400 pt-2">
                Showing 10 of {unresolvedIssues.length} unresolved issues
              </p>
            )}
          </div>
        ) : issues.length > 0 ? (
          <Alert className="border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-900 dark:text-green-200">
              Great! All crawl issues have been resolved.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
            <p>No crawl issues detected.</p>
            <p className="text-sm mt-2">Your site is being crawled successfully by Bing.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
