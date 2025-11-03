import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, PlayCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AuditSummaryCard from "@/components/aether/AuditSummaryCard";
import ImpactMatrix from "@/components/aether/ImpactMatrix";
import AuditFilters from "@/components/aether/AuditFilters";
import AuditExportBtn from "@/components/aether/AuditExportBtn";

export default function AuditPage() {
  const { toast } = useToast();
  const [url, setUrl] = useState("https://www.cararth.com");
  const [selectedModules, setSelectedModules] = useState({
    indexability: true,
    schema: true,
    content: true,
    performance: true,
    geo: true,
  });
  const [currentAuditId, setCurrentAuditId] = useState<string | null>(null);
  const [pollingEnabled, setPollingEnabled] = useState(false);

  // Filters
  const [severityFilter, setSeverityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [pageFilter, setPageFilter] = useState("");

  // Fetch list of recent audits
  const { data: auditsData } = useQuery<{ audits: any[]; total: number }>({
    queryKey: ['/api/aether/audits'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Poll current audit status
  const { data: currentAudit } = useQuery({
    queryKey: ['/api/aether/audit', currentAuditId],
    enabled: pollingEnabled && !!currentAuditId,
    refetchInterval: 2000, // Poll every 2 seconds
  });

  // Stop polling when audit is completed or failed
  useEffect(() => {
    if (currentAudit && (currentAudit.status === 'completed' || currentAudit.status === 'failed')) {
      setPollingEnabled(false);
      queryClient.invalidateQueries({ queryKey: ['/api/aether/audits'] });
    }
  }, [currentAudit]);

  // Run audit mutation
  const runAuditMutation = useMutation({
    mutationFn: async () => {
      const modules = Object.entries(selectedModules)
        .filter(([_, enabled]) => enabled)
        .map(([name, _]) => name);

      const response = await apiRequest("POST", "/api/aether/audit/run", {
        url,
        modules: modules.length > 0 ? modules : undefined,
      });
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Audit started",
        description: `Audit ${data.audit_id} is now running...`,
      });
      setCurrentAuditId(data.audit_id);
      setPollingEnabled(true);
    },
    onError: (error: any) => {
      toast({
        title: "Audit failed",
        description: error.message || "Failed to start audit",
        variant: "destructive",
      });
    },
  });

  // Filter issues
  const filteredIssues = currentAudit?.impactMatrix?.filter((issue: any) => {
    if (severityFilter !== "all" && issue.severity !== severityFilter) return false;
    if (categoryFilter !== "all" && issue.module !== categoryFilter) return false;
    if (pageFilter && !issue.page.toLowerCase().includes(pageFilter.toLowerCase())) return false;
    return true;
  }) || [];

  const latestAudit = auditsData?.audits?.[0];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Run Audit Form */}
      <Card data-testid="card-run-audit">
        <CardHeader>
          <CardTitle>Run SEO Audit</CardTitle>
          <CardDescription>
            Comprehensive technical SEO analysis with GEO visibility correlation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="audit-url">URL to Audit</Label>
            <Input
              id="audit-url"
              type="url"
              placeholder="https://www.cararth.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              data-testid="input-audit-url"
            />
          </div>

          <div className="space-y-2">
            <Label>Modules to Run</Label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.entries(selectedModules).map(([module, enabled]) => (
                <div key={module} className="flex items-center space-x-2">
                  <Checkbox
                    id={`module-${module}`}
                    checked={enabled}
                    onCheckedChange={(checked) =>
                      setSelectedModules({ ...selectedModules, [module]: !!checked })
                    }
                    data-testid={`checkbox-module-${module}`}
                  />
                  <label
                    htmlFor={`module-${module}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                  >
                    {module}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={() => runAuditMutation.mutate()}
            disabled={runAuditMutation.isPending || pollingEnabled || !url}
            className="w-full"
            data-testid="button-run-audit"
          >
            {runAuditMutation.isPending || pollingEnabled ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {pollingEnabled ? "Audit Running..." : "Starting..."}
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4 mr-2" />
                Run Audit
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Current Audit Status */}
      {currentAudit && (
        <Alert data-testid="alert-audit-status">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>
                Audit {currentAudit.audit_id} - Status: <strong>{currentAudit.status}</strong>
              </span>
              {currentAudit.status === "completed" && (
                <AuditExportBtn auditId={currentAudit.audit_id} />
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Latest Audit Summary */}
      {(currentAudit?.status === "completed" || latestAudit) && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <AuditSummaryCard
                score={currentAudit?.score || latestAudit?.score || 0}
                timestamp={currentAudit?.timestamp || latestAudit?.timestamp || new Date().toISOString()}
                topIssues={currentAudit?.impactMatrix?.slice(0, 3) || []}
              />
            </div>

            {currentAudit?.modules && (
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Module Scores</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(currentAudit.modules).map(([name, data]: [string, any]) => (
                        <div key={name} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="capitalize font-medium">{name}</span>
                            <span className={`font-bold ${
                              data.categoryScore >= 75 ? 'text-green-600' :
                              data.categoryScore >= 60 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {data.categoryScore}/100
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                data.categoryScore >= 75 ? 'bg-green-600' :
                                data.categoryScore >= 60 ? 'bg-yellow-600' :
                                'bg-red-600'
                              }`}
                              style={{ width: `${data.categoryScore}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Filters */}
          {currentAudit?.impactMatrix && currentAudit.impactMatrix.length > 0 && (
            <AuditFilters
              severity={severityFilter}
              category={categoryFilter}
              page={pageFilter}
              onSeverityChange={setSeverityFilter}
              onCategoryChange={setCategoryFilter}
              onPageChange={setPageFilter}
            />
          )}

          {/* Impact Matrix */}
          {currentAudit?.impactMatrix && (
            <ImpactMatrix issues={filteredIssues} />
          )}
        </>
      )}

      {/* Recent Audits List */}
      {auditsData && auditsData.audits.length > 0 && (
        <Card data-testid="card-recent-audits">
          <CardHeader>
            <CardTitle>Recent Audits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {auditsData.audits.slice(0, 10).map((audit) => (
                <div
                  key={audit.audit_id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => {
                    setCurrentAuditId(audit.audit_id);
                    setPollingEnabled(false);
                    queryClient.invalidateQueries({ queryKey: ['/api/aether/audit', audit.audit_id] });
                  }}
                  data-testid={`row-audit-${audit.audit_id}`}
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium">{audit.url}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(audit.timestamp).toLocaleString()} • {audit.issueCount || 0} issues
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      audit.score >= 75 ? 'text-green-600' :
                      audit.score >= 60 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {audit.score}/100
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
