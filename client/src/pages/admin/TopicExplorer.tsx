import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, TrendingUp, Zap, FileText, Globe, CheckCircle2, XCircle, Coins, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CITIES = ['Hyderabad', 'Bangalore', 'Mumbai', 'Delhi', 'Pune', 'Chennai'];

export default function TopicExplorer() {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("Hyderabad");
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  // Start exploration mutation
  const exploreMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/aether/topic/explore", {
        query,
        city
      });
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Exploration started",
        description: `Analyzing "${query}" in ${city}...`,
      });
      setCurrentJobId(data.jobId);
    },
    onError: (error: any) => {
      toast({
        title: "Exploration failed",
        description: error.message || "Failed to start exploration",
        variant: "destructive",
      });
    },
  });

  // Poll for results
  const { data: result, isLoading: isPolling } = useQuery<any>({
    queryKey: ['/api/aether/topic/result', currentJobId],
    queryFn: async () => {
      if (!currentJobId) return null;
      const response = await fetch(`/api/aether/topic/result/${currentJobId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch result: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!currentJobId,
    refetchInterval: (data) => {
      if (!data) return 2000;
      if (data.status === 'completed' || data.status === 'failed') return false;
      return 2000;
    },
    retry: 3,
  });

  // Get recent topics
  const { data: suggestionsData } = useQuery<any>({
    queryKey: ['/api/aether/topic/suggest', { limit: 10 }],
    refetchInterval: 30000,
  });

  // Action mutations
  const briefMutation = useMutation({
    mutationFn: async (topicId: string) => {
      const response = await apiRequest("POST", `/api/aether/topic/action/${topicId}/brief`, {});
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "Content brief generated!", description: "Check your dashboard for the brief." });
    }
  });

  const articleMutation = useMutation({
    mutationFn: async (topicId: string) => {
      const response = await apiRequest("POST", `/api/aether/topic/action/${topicId}/article`, {});
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "Article generation queued!", description: "Your article will be ready soon." });
    }
  });

  const lpMutation = useMutation({
    mutationFn: async (topicId: string) => {
      const response = await apiRequest("POST", `/api/aether/topic/action/${topicId}/lp`, {});
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "Landing page queued!", description: "Your landing page is being generated." });
    }
  });

  const isExploring = exploreMutation.isPending || (currentJobId && result?.status === 'running');

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
          Topic Explorer
        </h1>
        <p className="text-muted-foreground mt-2">
          Find winnable topics ranked by SEO demand + GEO (AI mentionability)
        </p>
      </div>

      {/* Search Form */}
      <Card data-testid="card-topic-search">
        <CardHeader>
          <CardTitle>Explore Topic</CardTitle>
          <CardDescription>
            Enter a search query to discover winnability scores and get content recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="topic-query">Search Query</Label>
              <Input
                id="topic-query"
                type="text"
                placeholder="e.g., used cars under 5 lakh"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                data-testid="input-topic-query"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="topic-city">City</Label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger id="topic-city" data-testid="select-topic-city">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CITIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={() => exploreMutation.mutate()}
            disabled={isExploring || !query}
            className="w-full"
            data-testid="button-explore-topic"
          >
            {isExploring ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {result?.stage || 'Exploring...'}
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Explore Topic
              </>
            )}
          </Button>

          {isExploring && result?.progress !== undefined && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{result.progress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 transition-all"
                  style={{ width: `${result.progress}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {result?.status === 'completed' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Winnability Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Winnability
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Win Score */}
                <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg">
                  <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    {(result.scores.winScore * 100).toFixed(0)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">Win Score</div>
                </div>

                {/* Component Scores */}
                <div className="space-y-3">
                  <ScoreChip
                    label="SEO Score"
                    value={result.scores.seoScore}
                    color="blue"
                  />
                  <ScoreChip
                    label="GEO Score"
                    value={result.scores.geoScore}
                    color="green"
                  />
                  <ScoreChip
                    label="Competition"
                    value={result.scores.competition}
                    color="orange"
                    inverse
                  />
                  <ScoreChip
                    label="Difficulty"
                    value={result.scores.difficulty}
                    color="red"
                    inverse
                  />
                </div>

                {/* Rationale */}
                <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
                  {result.scores.winScore > 0.7 ? "🎯 High opportunity topic! Strong potential for both SEO rankings and AI mentions." :
                   result.scores.winScore > 0.5 ? "✅ Good opportunity. Moderate competition with decent upside." :
                   result.scores.winScore > 0.3 ? "⚠️ Challenging topic. High competition but some opportunity exists." :
                   "❌ Highly competitive. Consider alternative angles or long-tail variations."}
                </div>

                {/* Metadata */}
                {result.mock && (
                  <Badge variant="outline" className="w-full justify-center">
                    <Database className="h-3 w-3 mr-1" />
                    Mock Data (Add API keys for live analysis)
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Middle: Sources Table */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top SERP Sources ({result.sources.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {result.sources.slice(0, 10).map((source: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">#{source.serpPosition}</Badge>
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium hover:underline truncate"
                          >
                            {source.domain}
                          </a>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 truncate">
                          {source.title}
                        </div>
                        <div className="flex gap-3 mt-2 text-xs">
                          <span>📊 {source.estTraffic?.toLocaleString() || 0}/mo</span>
                          <span>🔗 {source.backlinks?.toLocaleString() || 0} links</span>
                          <span>📝 {source.wordcount?.toLocaleString() || 0} words</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        {source.entities && Object.keys(source.entities).length > 0 ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" title="Has structured data" />
                        ) : (
                          <XCircle className="h-5 w-5 text-gray-400" title="No structured data" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {result?.status === 'completed' && result.recommendations && result.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommended Actions</CardTitle>
            <CardDescription>
              One-click content generation based on winnability analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {result.recommendations.map((reco: any) => (
                <ActionCard
                  key={reco.id}
                  reco={reco}
                  topicId={result.topic.id}
                  onBrief={() => briefMutation.mutate(result.topic.id)}
                  onArticle={() => articleMutation.mutate(result.topic.id)}
                  onLP={() => lpMutation.mutate(result.topic.id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Topics */}
      {suggestionsData?.topics && suggestionsData.topics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Explorations</CardTitle>
            <CardDescription>
              Topics sorted by Win Score (highest opportunity first)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {suggestionsData.topics.slice(0, 5).map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => {
                    setQuery(item.query);
                    setCity(item.city);
                    setCurrentJobId(null);
                  }}
                >
                  <div>
                    <div className="font-medium">{item.query}</div>
                    <div className="text-xs text-muted-foreground">{item.city}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      Win: {((item.scores?.winScore || 0) * 100).toFixed(0)}%
                    </Badge>
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

function ScoreChip({ label, value, color, inverse = false }: any) {
  const percentage = value * 100;
  const displayValue = inverse ? 100 - percentage : percentage;
  
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    green: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
    red: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">{label}</span>
      <Badge className={colorClasses[color as keyof typeof colorClasses]}>
        {displayValue.toFixed(0)}%
      </Badge>
    </div>
  );
}

function ActionCard({ reco, topicId, onBrief, onArticle, onLP }: any) {
  const icons = {
    'generate_brief': FileText,
    'generate_article': Globe,
    'generate_lp': Zap
  };

  const titles = {
    'generate_brief': 'Generate Brief',
    'generate_article': 'Generate Article',
    'generate_lp': 'Generate Landing Page'
  };

  const Icon = icons[reco.recoType as keyof typeof icons] || FileText;
  const title = titles[reco.recoType as keyof typeof titles] || 'Generate';

  const onClick = reco.recoType === 'generate_brief' ? onBrief :
                  reco.recoType === 'generate_article' ? onArticle :
                  reco.recoType === 'generate_lp' ? onLP :
                  () => {};

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center gap-3">
          <Icon className="h-8 w-8 text-purple-600" />
          <div>
            <div className="font-semibold">{title}</div>
            <div className="text-xs text-muted-foreground">{reco.effort} effort</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Expected Uplift</span>
            <span className="font-semibold text-green-600">
              +{(reco.expectedUplift * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Confidence</span>
            <span className="font-semibold">
              {(reco.confidence * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        <Button
          onClick={onClick}
          className="w-full"
          variant="outline"
          data-testid={`button-action-${reco.recoType}`}
        >
          <Icon className="h-4 w-4 mr-2" />
          {title}
        </Button>
      </CardContent>
    </Card>
  );
}
