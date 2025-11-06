import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TrendingUp, AlertTriangle, CheckCircle2, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface AuditSummaryCardProps {
  score: number;
  timestamp: string;
  topIssues: Array<{
    id: string;
    severity: string;
    description: string;
    module?: string;
    page?: string;
  }>;
  allIssues?: Array<{
    id: string;
    severity: string;
    description: string;
    module?: string;
    page?: string;
  }>;
}

export default function AuditSummaryCard({ score, timestamp, topIssues, allIssues }: AuditSummaryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 dark:text-green-400";
    if (score >= 75) return "text-blue-600 dark:text-blue-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    if (score >= 40) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 75) return "Good";
    if (score >= 60) return "Fair";
    if (score >= 40) return "Needs Improvement";
    return "Critical Issues";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 75) return <CheckCircle2 className="h-8 w-8" />;
    if (score >= 40) return <AlertTriangle className="h-8 w-8" />;
    return <XCircle className="h-8 w-8" />;
  };
  
  // Group issues by severity (normalize to lowercase)
  const issuesBySeverity = (allIssues || topIssues || []).reduce((acc, issue) => {
    const severity = (issue.severity || 'low').toLowerCase();
    if (!acc[severity]) acc[severity] = [];
    acc[severity].push(issue);
    return acc;
  }, {} as Record<string, typeof topIssues>);
  
  // Use all found severities, sorted by priority
  const knownOrder = ['critical', 'high', 'medium', 'low', 'info', 'warning'];
  const foundSeverities = Object.keys(issuesBySeverity);
  const severityOrder = [
    ...knownOrder.filter(s => foundSeverities.includes(s)),
    ...foundSeverities.filter(s => !knownOrder.includes(s)).sort()
  ];
  
  const totalIssues = (allIssues || topIssues || []).length;

  return (
    <Card data-testid="card-audit-summary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Audit Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className={`text-5xl font-bold ${getScoreColor(score)}`} data-testid="text-audit-score">
              {score}
            </div>
            <div className="text-sm text-muted-foreground">
              {getScoreLabel(score)}
            </div>
          </div>
          <div className={getScoreColor(score)}>
            {getScoreIcon(score)}
          </div>
        </div>

        <div>
          <div className="text-sm mb-2">SEO Health</div>
          <Progress value={score} className="h-3" data-testid="progress-seo-health" />
        </div>

        <div className="text-xs text-muted-foreground" data-testid="text-last-run">
          Last run: {new Date(timestamp).toLocaleString()}
        </div>

        {totalIssues > 0 && (
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <button
                className="flex items-center justify-between w-full p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                data-testid="button-toggle-issues"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-sm font-medium">
                    {totalIssues} Issue{totalIssues !== 1 ? 's' : ''} Found
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="mt-3 space-y-3">
              {severityOrder.map(severity => {
                const issues = issuesBySeverity[severity];
                if (!issues || issues.length === 0) return null;
                
                return (
                  <div key={severity} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          severity === "critical" || severity === "high"
                            ? "destructive"
                            : severity === "medium"
                            ? "default"
                            : "secondary"
                        }
                        className="capitalize"
                      >
                        {severity}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {issues.length} issue{issues.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    <div className="space-y-2 pl-2 border-l-2 border-muted">
                      {issues.map((issue, idx) => (
                        <div
                          key={issue.id || idx}
                          className="text-sm text-muted-foreground pl-3"
                          data-testid={`issue-${severity}-${idx}`}
                        >
                          <div className="font-medium text-foreground mb-1">
                            {issue.description}
                          </div>
                          {(issue.module || issue.page) && (
                            <div className="text-xs flex gap-3">
                              {issue.module && (
                                <span className="text-blue-600 dark:text-blue-400">
                                  {issue.module}
                                </span>
                              )}
                              {issue.page && (
                                <span className="text-muted-foreground truncate max-w-[200px]">
                                  {issue.page}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}
