import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface IssueRowProps {
  issue: {
    id: string;
    page: string;
    severity: string;
    description: string;
    impact_score: number;
    suggested_fix: string;
    module?: string;
  };
}

export default function IssueRow({ issue }: IssueRowProps) {
  const [expanded, setExpanded] = useState(false);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getImpactColor = (score: number) => {
    if (score >= 0.7) return "text-red-600 dark:text-red-400";
    if (score >= 0.4) return "text-orange-600 dark:text-orange-400";
    return "text-yellow-600 dark:text-yellow-400";
  };

  return (
    <div
      className={cn(
        "border rounded-lg p-4 transition-all",
        expanded && "bg-muted/50"
      )}
      data-testid={`row-issue-${issue.id}`}
    >
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="p-0 h-auto hover:bg-transparent"
          data-testid={`button-expand-${issue.id}`}
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>

        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={getSeverityColor(issue.severity)} data-testid={`badge-severity-${issue.severity}`}>
              {issue.severity}
            </Badge>
            {issue.module && (
              <Badge variant="outline" data-testid={`badge-module-${issue.module}`}>
                {issue.module}
              </Badge>
            )}
            <span className={cn("text-sm font-medium", getImpactColor(issue.impact_score))}>
              Impact: {(issue.impact_score * 100).toFixed(0)}%
            </span>
          </div>

          <div className="text-sm font-medium" data-testid={`text-description-${issue.id}`}>
            {issue.description}
          </div>

          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Info className="h-3 w-3" />
            Page: {issue.page}
          </div>

          {expanded && (
            <div className="mt-3 pt-3 border-t space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                <div className="flex-1">
                  <div className="text-xs font-medium mb-1">Suggested Fix</div>
                  <div className="text-sm text-muted-foreground" data-testid={`text-suggested-fix-${issue.id}`}>
                    {issue.suggested_fix}
                  </div>
                </div>
              </div>

              <div className="text-xs text-green-600 dark:text-green-400">
                Expected SEO uplift: +{Math.round(issue.impact_score * 20)}%
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
