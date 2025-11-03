import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

interface AuditSummaryCardProps {
  score: number;
  timestamp: string;
  topIssues: Array<{
    id: string;
    severity: string;
    description: string;
  }>;
}

export default function AuditSummaryCard({ score, timestamp, topIssues }: AuditSummaryCardProps) {
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

        {topIssues && topIssues.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Top Issues</div>
            {topIssues.slice(0, 3).map((issue, idx) => (
              <div
                key={issue.id}
                className="flex items-start gap-2 text-sm"
                data-testid={`issue-top-${idx}`}
              >
                <Badge
                  variant={
                    issue.severity === "critical" || issue.severity === "high"
                      ? "destructive"
                      : "secondary"
                  }
                  data-testid={`badge-severity-${issue.severity}`}
                >
                  {issue.severity}
                </Badge>
                <span className="text-muted-foreground flex-1">{issue.description}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
