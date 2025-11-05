import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Target, AlertCircle, Copy, FileText, Play, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AetherAction {
  id: string;
  priority: number;
  page: string;
  city: string;
  pillar: string;
  title: string;
  do: string;
  dont: string;
  expectedUplift: string;
  effort: string;
  confidence: string;
  evidence: any;
  asset?: {
    type: string;
    content: string;
    preview: string;
  };
}

interface Digest {
  id: string;
  runAt: string;
  city: string;
  actions: AetherAction[];
  tokenCostUsd: string;
  notes: string;
}

export default function Top5Today() {
  const { toast } = useToast();
  const [city] = useState('Hyderabad');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch latest digest
  const { data: digest, isLoading, refetch } = useQuery<Digest>({
    queryKey: ['/api/aether/today/digest', city],
  });

  // Run Top-5 generation
  const runMutation = useMutation({
    mutationFn: () => apiRequest('POST', `/api/aether/today/run?city=${city}`),
    onSuccess: () => {
      toast({
        title: "✓ Top 5 Actions Generated",
        description: `Generated new recommendations for ${city}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/aether/today/digest', city] });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to generate actions",
        description: error.message,
      });
    },
  });

  const handleCopyAsset = async (action: AetherAction) => {
    if (!action.asset) return;
    
    try {
      await navigator.clipboard.writeText(action.asset.content);
      setCopiedId(action.id);
      setTimeout(() => setCopiedId(null), 2000);
      
      toast({
        title: "✓ Copied to clipboard",
        description: `${action.asset.type.replace('_', ' ').toUpperCase()} copied`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to copy",
        description: "Could not copy to clipboard",
      });
    }
  };

  const getPillarColor = (pillar: string) => {
    const colors: Record<string, string> = {
      'Schema': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Content': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Performance': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Internal Linking': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    };
    return colors[pillar] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  };

  const getEffortColor = (effort: string) => {
    const colors: Record<string, string> = {
      'low': 'bg-green-50 text-green-700 border-green-200',
      'medium': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'high': 'bg-red-50 text-red-700 border-red-200',
    };
    return colors[effort] || 'bg-gray-50 text-gray-700';
  };

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-lg">Loading Top 5 actions...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="top5-today-container">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            🔥 Top 5 Actions — {city} (Today)
          </h2>
          <p className="text-muted-foreground mt-1">
            Prioritized SEO/GEO actions with ready-to-use assets
          </p>
        </div>
        <Button
          onClick={() => runMutation.mutate()}
          disabled={runMutation.isPending}
          data-testid="button-generate-actions"
        >
          {runMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Generate New
            </>
          )}
        </Button>
      </div>

      {!digest && (
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No actions generated yet</h3>
          <p className="text-muted-foreground mb-4">
            Click "Generate New" to create your first Top 5 recommendations for {city}
          </p>
        </Card>
      )}

      {digest && (
        <>
          <div className="text-sm text-muted-foreground">
            Last generated: {new Date(digest.runAt).toLocaleString()} • {digest.notes}
          </div>

          {/* Action Cards */}
          <div className="space-y-4">
            {digest.actions.map((action) => (
              <Card
                key={action.id}
                className="p-6 hover:shadow-md transition-shadow"
                data-testid={`card-action-${action.priority}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-lg">
                      {action.priority}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getPillarColor(action.pillar)}>
                          {action.pillar}
                        </Badge>
                        <Badge variant="outline" className={getEffortColor(action.effort)}>
                          {action.effort} effort
                        </Badge>
                      </div>
                      <h3 className="text-lg font-semibold mb-1">{action.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Page: <code className="bg-muted px-1 py-0.5 rounded">{action.page}</code>
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
                      <TrendingUp className="h-4 w-4" />
                      +{action.expectedUplift}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {(parseFloat(action.confidence) * 100).toFixed(0)}% confidence
                    </div>
                  </div>
                </div>

                {/* Do/Don't */}
                <div className="grid md:grid-cols-2 gap-4 mb-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-sm">Do:</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{action.do}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span className="font-medium text-sm">Don't:</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{action.dont}</p>
                  </div>
                </div>

                {/* Evidence */}
                {action.evidence && (
                  <div className="mb-4 text-xs text-muted-foreground">
                    <Target className="h-3 w-3 inline mr-1" />
                    Rule: {action.evidence.rule_id} • Gap Score: {action.evidence.gap_score?.toFixed(1)} • 
                    Learning Weight: {action.evidence.learning_weight?.toFixed(2)}
                  </div>
                )}

                {/* Asset Actions */}
                <div className="flex gap-2">
                  {action.asset && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyAsset(action)}
                      data-testid={`button-copy-asset-${action.priority}`}
                    >
                      {copiedId === action.id ? (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy {action.asset.type === 'faq_schema' ? 'FAQ JSON-LD' : 
                                action.asset.type === 'content_brief' ? 'Content Brief' : 
                                'Asset'}
                        </>
                      )}
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    <FileText className="mr-2 h-4 w-4" />
                    View Details
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
