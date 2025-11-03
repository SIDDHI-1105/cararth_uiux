import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingDown } from "lucide-react";
import IssueRow from "./IssueRow";

interface ImpactMatrixProps {
  issues: Array<{
    id: string;
    page: string;
    severity: string;
    description: string;
    impact_score: number;
    suggested_fix: string;
    module?: string;
    impactRank?: number;
  }>;
}

export default function ImpactMatrix({ issues }: ImpactMatrixProps) {
  // Sort by impactRank if available, otherwise by impact_score
  const sortedIssues = [...issues].sort((a, b) => {
    if (a.impactRank && b.impactRank) {
      return b.impactRank - a.impactRank;
    }
    return b.impact_score - a.impact_score;
  });

  const criticalCount = issues.filter(i => i.severity === "critical").length;
  const highCount = issues.filter(i => i.severity === "high").length;
  const mediumCount = issues.filter(i => i.severity === "medium").length;

  return (
    <Card data-testid="card-impact-matrix">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5" />
          Impact Matrix
        </CardTitle>
        <CardDescription>
          Issues ranked by priority (severity × impact × pages affected)
        </CardDescription>
        <div className="flex gap-2 mt-2">
          {criticalCount > 0 && (
            <Badge variant="destructive" data-testid="badge-count-critical">
              {criticalCount} Critical
            </Badge>
          )}
          {highCount > 0 && (
            <Badge variant="destructive" data-testid="badge-count-high">
              {highCount} High
            </Badge>
          )}
          {mediumCount > 0 && (
            <Badge variant="secondary" data-testid="badge-count-medium">
              {mediumCount} Medium
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {sortedIssues.length > 0 ? (
          <div className="space-y-3">
            {sortedIssues.map((issue) => (
              <IssueRow key={issue.id} issue={issue} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground" data-testid="text-no-issues">
            No issues found. Your SEO is in great shape!
          </div>
        )}
      </CardContent>
    </Card>
  );
}
