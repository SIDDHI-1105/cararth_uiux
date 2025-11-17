import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Loader2, Play, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export default function CitationMonitorDashboard() {
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<{
    success: boolean;
    totalCitations: number;
    byDomain: Record<string, number>;
    byModel: Record<string, number>;
    recentCitations: any[];
  }>({
    queryKey: ['/api/citations/stats'],
    refetchInterval: autoRefresh ? 10000 : false,
  });

  const triggerSweepMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/citations/trigger-sweep");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/citations/stats'] });
    },
  });

  const handleTriggerSweep = () => {
    triggerSweepMutation.mutate();
  };

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
            Total Citations
          </div>
          <div className="text-3xl font-black text-orange-600 dark:text-orange-400">
            {stats?.totalCitations || 0}
          </div>
        </Card>

        <Card className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
            Domains Tracked
          </div>
          <div className="text-3xl font-black text-blue-600 dark:text-blue-400">
            {Object.keys(stats?.byDomain || {}).length}
          </div>
        </Card>

        <Card className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
            AI Models
          </div>
          <div className="text-3xl font-black text-purple-600 dark:text-purple-400">
            {Object.keys(stats?.byModel || {}).length}
          </div>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleTriggerSweep}
          disabled={triggerSweepMutation.isPending}
          className="bg-orange-600 hover:bg-orange-700 text-white"
          data-testid="button-trigger-sweep"
        >
          {triggerSweepMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Trigger Citation Sweep
            </>
          )}
        </Button>

        <Button
          variant="outline"
          onClick={() => setAutoRefresh(!autoRefresh)}
          data-testid="button-auto-refresh"
        >
          {autoRefresh ? "⏸ Pause Auto-Refresh" : "▶ Resume Auto-Refresh"}
        </Button>
      </div>

      {/* Model Breakdown */}
      {stats && Object.keys(stats.byModel).length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Citations by AI Model
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.byModel).map(([model, count]) => (
              <Badge key={model} className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                {model}: {count}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Domain Breakdown */}
      {stats && Object.keys(stats.byDomain).length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Citations by Domain
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.byDomain).map(([domain, count]) => (
              <Badge key={domain} className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                {domain}: {count}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Recent Citations */}
      <div className="space-y-3">
        <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          Live Citation Feed
          {autoRefresh && (
            <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Live
            </span>
          )}
        </div>

        {stats?.recentCitations && stats.recentCitations.length > 0 ? (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {stats.recentCitations.map((citation) => (
              <Card key={citation.id} className="p-3 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-slate-900/80 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 text-xs">
                        {citation.domain}
                      </Badge>
                      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs">
                        {citation.model}
                      </Badge>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {citation.timestamp ? format(new Date(citation.timestamp), 'MMM d, h:mm a') : 'Unknown time'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      "{citation.quote}"
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                      Prompt: {citation.prompt}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <div className="flex flex-col items-center justify-center text-center space-y-2">
              <AlertCircle className="h-12 w-12 text-slate-400" />
              <p className="text-sm text-slate-600 dark:text-slate-400">
                No citations detected yet. Click "Trigger Citation Sweep" to start monitoring AI models.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
