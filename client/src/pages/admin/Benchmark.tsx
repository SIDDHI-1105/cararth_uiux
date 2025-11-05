import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Trophy, TrendingUp, TrendingDown, Target, AlertCircle, Play, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PillarOverview {
  pillar: string;
  cararth: string;
  leader: string;
  diff: string;
  status: 'win' | 'lose' | 'parity';
}

interface Competitor {
  domain: string;
  label: string;
  avgScore: string;
  aiMentionRate: string;
  lastUpdated: string | null;
  pillars: { pillar: string; score: string }[];
}

interface Recommendation {
  id: string;
  pillar: string;
  severity: string;
  title: string;
  do: string;
  dont: string;
  evidence: any;
  expectedUplift: string;
  effort: string;
  confidence: string;
  status: string;
}

interface Gap {
  kpi: string;
  cararth: number;
  leader: number;
  gap: number;
  gapPercent: string;
}

export default function Benchmark() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState('overview');

  const { data: overviewData, isLoading: loadingOverview } = useQuery<{ overview: PillarOverview[] }>({
    queryKey: ['/api/aether/bench/overview'],
  });

  const { data: competitorsData, isLoading: loadingCompetitors } = useQuery<{ competitors: Competitor[] }>({
    queryKey: ['/api/aether/bench/competitors'],
  });

  const { data: recommendationsData, isLoading: loadingRecommendations } = useQuery<{ recommendations: Recommendation[] }>({
    queryKey: ['/api/aether/bench/recommendations'],
  });

  const { data: gapsData, isLoading: loadingGaps } = useQuery<{ gaps: Gap[] }>({
    queryKey: ['/api/aether/bench/gaps'],
  });

  const runBenchmarkMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/aether/bench/run', {}),
    onSuccess: () => {
      toast({
        title: "✓ Benchmark Run Started",
        description: "Competitor analysis is running. This may take a few minutes.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/aether/bench/overview'] });
      queryClient.invalidateQueries({ queryKey: ['/api/aether/bench/competitors'] });
      queryClient.invalidateQueries({ queryKey: ['/api/aether/bench/recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/aether/bench/gaps'] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Benchmark run failed",
        description: error.message,
      });
    },
  });

  const getStatusBadge = (status: string) => {
    if (status === 'win') {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Win ✓</Badge>;
    } else if (status === 'lose') {
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Lose ✗</Badge>;
    } else {
      return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">Parity =</Badge>;
    }
  };

  const getPillarColor = (pillar: string) => {
    const colors: Record<string, string> = {
      'Indexability': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Performance': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Content': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Internal Linking': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'GEO': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    };
    return colors[pillar] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      'critical': 'bg-red-100 text-red-800 border-red-200',
      'high': 'bg-orange-100 text-orange-800 border-orange-200',
      'medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'low': 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return colors[severity] || 'bg-gray-100 text-gray-800';
  };

  const getEffortColor = (effort: string) => {
    const colors: Record<string, string> = {
      'low': 'bg-green-50 text-green-700 border-green-200',
      'medium': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'high': 'bg-red-50 text-red-700 border-red-200',
    };
    return colors[effort] || 'bg-gray-50 text-gray-700';
  };

  if (loadingOverview && loadingCompetitors && loadingRecommendations) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-lg">Loading benchmark data...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="benchmark-container">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Competitive Benchmarking
          </h2>
          <p className="text-muted-foreground mt-1">
            Track how CarArth compares to CarDekho, Cars24, Spinny & others
          </p>
        </div>
        <Button 
          onClick={() => runBenchmarkMutation.mutate()}
          disabled={runBenchmarkMutation.isPending}
          data-testid="button-run-benchmark"
        >
          {runBenchmarkMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Run Benchmark
            </>
          )}
        </Button>
      </div>

      {/* Pillar Score Cards */}
      {overviewData?.overview && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {overviewData.overview.map((pillar) => (
            <Card key={pillar.pillar} className="p-4" data-testid={`card-pillar-${pillar.pillar.toLowerCase().replace(' ', '-')}`}>
              <div className="flex items-start justify-between mb-2">
                <Badge className={getPillarColor(pillar.pillar)} data-testid={`badge-${pillar.pillar.toLowerCase()}`}>
                  {pillar.pillar}
                </Badge>
                {getStatusBadge(pillar.status)}
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold" data-testid={`text-cararth-score-${pillar.pillar}`}>{pillar.cararth}</span>
                  <span className="text-sm text-muted-foreground">/ 100</span>
                </div>
                <div className="flex items-center gap-1 mt-1 text-sm">
                  {parseFloat(pillar.diff) >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={parseFloat(pillar.diff) >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {Math.abs(parseFloat(pillar.diff)).toFixed(1)} pts
                  </span>
                  <span className="text-muted-foreground">vs leader ({pillar.leader})</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="competitors" data-testid="tab-competitors">Competitors</TabsTrigger>
          <TabsTrigger value="gaps" data-testid="tab-gaps">Opportunity Gaps</TabsTrigger>
          <TabsTrigger value="playbooks" data-testid="tab-playbooks">Do/Don't Playbooks</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Pillar Performance Summary</h3>
            <div className="space-y-3">
              {overviewData?.overview.map((pillar) => (
                <div key={pillar.pillar} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`row-pillar-${pillar.pillar}`}>
                  <div className="flex items-center gap-3">
                    <Badge className={getPillarColor(pillar.pillar)}>{pillar.pillar}</Badge>
                    {getStatusBadge(pillar.status)}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">CarArth: </span>
                      <span className="font-semibold">{pillar.cararth}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Leader: </span>
                      <span className="font-semibold">{pillar.leader}</span>
                    </div>
                    <div className={parseFloat(pillar.diff) >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {parseFloat(pillar.diff) >= 0 ? '+' : ''}{pillar.diff} pts
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Competitors Tab */}
        <TabsContent value="competitors" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Competitor Comparison</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Competitor</th>
                    <th className="text-left py-3 px-4">Avg Score</th>
                    <th className="text-left py-3 px-4">AI Mention Rate</th>
                    <th className="text-left py-3 px-4">Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {competitorsData?.competitors.map((competitor) => (
                    <tr key={competitor.domain} className="border-b hover:bg-muted/50" data-testid={`row-competitor-${competitor.domain}`}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{competitor.label}</span>
                          <span className="text-xs text-muted-foreground">{competitor.domain}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-lg font-semibold" data-testid={`text-avg-score-${competitor.domain}`}>{competitor.avgScore}</span>
                        <span className="text-sm text-muted-foreground">/100</span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" data-testid={`badge-ai-mention-${competitor.domain}`}>{competitor.aiMentionRate}%</Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {competitor.lastUpdated ? new Date(competitor.lastUpdated).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Opportunity Gaps Tab */}
        <TabsContent value="gaps" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-500" />
              Top Opportunity Gaps
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Areas where competitors lead by the largest margin
            </p>
            <div className="space-y-3">
              {gapsData?.gaps.slice(0, 10).map((gap, idx) => (
                <div key={gap.kpi} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`row-gap-${gap.kpi}`}>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-medium">{gap.kpi.replace(/_/g, ' ').toUpperCase()}</div>
                      <div className="text-sm text-muted-foreground">
                        CarArth: {gap.cararth.toFixed(2)} | Leader: {gap.leader.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-red-600">-{gap.gapPercent}%</div>
                    <div className="text-xs text-muted-foreground">Gap</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Playbooks Tab */}
        <TabsContent value="playbooks" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-500" />
              Actionable Do/Don't Playbooks
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Recommendations ranked by expected uplift and confidence
            </p>
            <div className="space-y-4">
              {recommendationsData?.recommendations.slice(0, 10).map((rec, idx) => (
                <Card key={rec.id} className="p-4 border-l-4 border-l-primary" data-testid={`card-recommendation-${idx}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground font-semibold text-xs">
                        {idx + 1}
                      </div>
                      <h4 className="font-semibold">{rec.title}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getSeverityColor(rec.severity)}>{rec.severity}</Badge>
                      <Badge className={getPillarColor(rec.pillar)}>{rec.pillar}</Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="text-xs font-semibold text-green-800 dark:text-green-200 mb-1">✓ DO</div>
                      <p className="text-sm text-green-900 dark:text-green-100">{rec.do}</p>
                    </div>
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="text-xs font-semibold text-red-800 dark:text-red-200 mb-1">✗ DON'T</div>
                      <p className="text-sm text-red-900 dark:text-red-100">{rec.dont}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-4 pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-semibold">+{(parseFloat(rec.expectedUplift) * 100).toFixed(1)}%</span>
                      <span className="text-xs text-muted-foreground">expected uplift</span>
                    </div>
                    <Badge variant="outline" className={getEffortColor(rec.effort)}>
                      {rec.effort} effort
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      {(parseFloat(rec.confidence) * 100).toFixed(0)}% confidence
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
