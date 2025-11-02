import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Search, 
  TrendingUp, 
  FileSearch, 
  FlaskConical, 
  Settings,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  DollarSign,
  Eye
} from "lucide-react";

export default function Aether() {
  const [promptText, setPromptText] = useState("");
  const [promptCategory, setPromptCategory] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch GEO sweep stats
  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalSweeps: number;
    mentionedSweeps: number;
    mentionRate: string;
    totalCost: number;
    avgRelevance: number;
  }>({
    queryKey: ['/api/aether/sweeps/stats'],
  });

  // Fetch recent sweeps
  const { data: sweepsData, isLoading: sweepsLoading } = useQuery<{ sweeps: any[]; total: number }>({
    queryKey: ['/api/aether/sweeps'],
  });

  // Run single sweep mutation
  const runSweepMutation = useMutation({
    mutationFn: async (data: { promptText: string; promptCategory?: string }) => {
      const response = await apiRequest("POST", "/api/aether/sweep", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/aether/sweeps'] });
      queryClient.invalidateQueries({ queryKey: ['/api/aether/sweeps/stats'] });
      setPromptText("");
    },
  });

  // Run demo batch sweeps
  const runDemoSweepMutation = useMutation({
    mutationFn: async () => {
      const demoPrompts = [
        { text: "How to inspect a used Hyundai Creta 2021 before buying in India?", category: "inspection" },
        { text: "AI vs manual car inspection: pros and cons for used cars", category: "inspection" },
        { text: "Best platform to sell used cars without paid listings in India", category: "selling" },
      ];
      const response = await apiRequest("POST", "/api/aether/sweeps/batch", { prompts: demoPrompts });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/aether/sweeps'] });
      queryClient.invalidateQueries({ queryKey: ['/api/aether/sweeps/stats'] });
    },
  });

  const handleRunSweep = () => {
    if (!promptText.trim()) return;
    runSweepMutation.mutate({ promptText, promptCategory });
  };

  const sweeps = sweepsData?.sweeps || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-blue-600" />
            Project AETHER
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Adaptive Engine for Trust, Heuristics & Evolving Rankings
          </p>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="geo" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              GEO Insights
            </TabsTrigger>
            <TabsTrigger value="seo" className="flex items-center gap-2" disabled>
              <FileSearch className="h-4 w-4" />
              SEO Audit
            </TabsTrigger>
            <TabsTrigger value="experiments" className="flex items-center gap-2" disabled>
              <FlaskConical className="h-4 w-4" />
              Experiments
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2" disabled>
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Total Sweeps
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                    {statsLoading ? "..." : stats?.totalSweeps || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    CarArth Mentions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {statsLoading ? "..." : stats?.mentionedSweeps || 0}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {stats?.mentionRate || "0%"} mention rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    Total Cost
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                    ${statsLoading ? "..." : (stats?.totalCost || 0).toFixed(4)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Avg Relevance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {statsLoading ? "..." : (stats?.avgRelevance || 0).toFixed(2)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Run demo sweeps or view recent results</CardDescription>
              </CardHeader>
              <CardContent className="flex gap-3">
                <Button
                  onClick={() => runDemoSweepMutation.mutate()}
                  disabled={runDemoSweepMutation.isPending}
                  data-testid="button-run-demo"
                >
                  {runDemoSweepMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running Demo...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Run Demo Sweeps
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setActiveTab("geo")}>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  View GEO Insights
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            {sweeps.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Sweeps</CardTitle>
                  <CardDescription>Latest 5 GEO monitoring sweeps</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {sweeps.slice(0, 5).map((sweep: any) => (
                    <div key={sweep.id} className="flex items-start justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {sweep.promptText.length > 80 ? sweep.promptText.substring(0, 80) + '...' : sweep.promptText}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={sweep.cararthMentioned ? "default" : "secondary"} className="text-xs">
                            {sweep.cararthMentioned ? "✅ Mentioned" : "❌ Not Mentioned"}
                          </Badge>
                          {sweep.promptCategory && (
                            <Badge variant="outline" className="text-xs">
                              {sweep.promptCategory}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 ml-4">
                        {new Date(sweep.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* GEO Insights Tab */}
          <TabsContent value="geo" className="space-y-6">
            {/* Run New Sweep */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Run GEO Sweep
                </CardTitle>
                <CardDescription>
                  Query AI models with prompts to see if CarArth is recommended
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                    Prompt
                  </label>
                  <Textarea
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder="e.g., What's the best platform to buy used cars in India?"
                    rows={3}
                    className="w-full"
                    data-testid="input-prompt"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                    Category (optional)
                  </label>
                  <Input
                    value={promptCategory}
                    onChange={(e) => setPromptCategory(e.target.value)}
                    placeholder="e.g., buying, selling, inspection"
                    data-testid="input-category"
                  />
                </div>

                <Button
                  onClick={handleRunSweep}
                  disabled={!promptText.trim() || runSweepMutation.isPending}
                  className="w-full"
                  data-testid="button-run-sweep"
                >
                  {runSweepMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running Sweep...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Run GEO Sweep
                    </>
                  )}
                </Button>

                {runSweepMutation.isSuccess && (
                  <Alert className={runSweepMutation.data.cararthMentioned ? "bg-green-50 border-green-200" : "bg-slate-50"}>
                    {runSweepMutation.data.cararthMentioned ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-slate-600" />
                    )}
                    <AlertDescription>
                      {runSweepMutation.data.cararthMentioned 
                        ? "🎉 CarArth was mentioned in the AI response!" 
                        : "CarArth was not mentioned in this response."}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Sweep Results */}
            <Card>
              <CardHeader>
                <CardTitle>Sweep History</CardTitle>
                <CardDescription>All GEO monitoring sweeps</CardDescription>
              </CardHeader>
              <CardContent>
                {sweepsLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-400" />
                  </div>
                ) : sweeps.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    No sweeps yet. Run your first GEO sweep above or click "Run Demo Sweeps" to get started!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sweeps.map((sweep: any) => (
                      <div key={sweep.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-slate-900 dark:text-slate-100">
                              {sweep.promptText}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant={sweep.cararthMentioned ? "default" : "secondary"}>
                                {sweep.cararthMentioned ? (
                                  <>
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Mentioned
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Not Mentioned
                                  </>
                                )}
                              </Badge>
                              {sweep.promptCategory && (
                                <Badge variant="outline">{sweep.promptCategory}</Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {sweep.aiProvider} / {sweep.aiModel}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-xs text-slate-500 ml-4 text-right">
                            <div>{new Date(sweep.createdAt).toLocaleDateString()}</div>
                            <div>{new Date(sweep.createdAt).toLocaleTimeString()}</div>
                          </div>
                        </div>

                        {sweep.mentionContext && (
                          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded p-3">
                            <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">
                              Mention Context:
                            </p>
                            <p className="text-sm text-green-800 dark:text-green-200">
                              "{sweep.mentionContext}"
                            </p>
                          </div>
                        )}

                        {sweep.competitorsMentioned && sweep.competitorsMentioned.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-600 dark:text-slate-400">Competitors:</span>
                            {sweep.competitorsMentioned.map((comp: string) => (
                              <Badge key={comp} variant="outline" className="text-xs">
                                {comp}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>⏱️ {sweep.sweepDuration}ms</span>
                          <span>🪙 {sweep.tokensUsed} tokens</span>
                          <span>💵 ${Number(sweep.cost).toFixed(6)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Placeholder tabs */}
          <TabsContent value="seo">
            <Card>
              <CardHeader>
                <CardTitle>SEO Audit</CardTitle>
                <CardDescription>Coming soon...</CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>

          <TabsContent value="experiments">
            <Card>
              <CardHeader>
                <CardTitle>Experiments</CardTitle>
                <CardDescription>Coming soon...</CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
                <CardDescription>Coming soon...</CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
