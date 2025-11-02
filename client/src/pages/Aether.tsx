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
  const [targetUrl, setTargetUrl] = useState("https://cararth.com");
  const [contentTopic, setContentTopic] = useState("");
  const [contentKeywords, setContentKeywords] = useState("");

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

  // Fetch SEO audits
  const { data: auditsData, isLoading: auditsLoading } = useQuery<{ audits: any[]; total: number }>({
    queryKey: ['/api/aether/seo-audits'],
  });

  // Run SEO audit mutation
  const runSeoAuditMutation = useMutation({
    mutationFn: async (data: { targetUrl: string; auditType?: string }) => {
      const response = await apiRequest("POST", "/api/aether/seo-audit", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/aether/seo-audits'] });
    },
  });

  // Generate content brief mutation
  const generateBriefMutation = useMutation({
    mutationFn: async (data: { topic: string; targetKeywords?: string[]; contentType?: string }) => {
      const response = await apiRequest("POST", "/api/aether/content-brief", data);
      return await response.json();
    },
  });

  const handleRunSweep = () => {
    if (!promptText.trim()) return;
    runSweepMutation.mutate({ promptText, promptCategory });
  };

  const handleRunSeoAudit = () => {
    if (!targetUrl.trim()) return;
    runSeoAuditMutation.mutate({ targetUrl, auditType: 'full' });
  };

  const handleGenerateBrief = () => {
    if (!contentTopic.trim()) return;
    const keywords = contentKeywords.split(',').map(k => k.trim()).filter(Boolean);
    generateBriefMutation.mutate({ 
      topic: contentTopic, 
      targetKeywords: keywords.length > 0 ? keywords : undefined,
      contentType: 'blog post'
    });
  };

  const sweeps = sweepsData?.sweeps || [];
  const audits = auditsData?.audits || [];

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
            <TabsTrigger value="seo" className="flex items-center gap-2">
              <FileSearch className="h-4 w-4" />
              SEO Audit
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Content
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

          {/* SEO Audit Tab */}
          <TabsContent value="seo" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Run SEO Audit</CardTitle>
                <CardDescription>
                  Analyze your site's SEO health - sitemap, canonicals, schema markup, meta tags
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Target URL</label>
                  <Input
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    placeholder="https://cararth.com"
                    data-testid="input-target-url"
                  />
                </div>
                <Button 
                  onClick={handleRunSeoAudit}
                  disabled={runSeoAuditMutation.isPending}
                  data-testid="button-run-seo-audit"
                >
                  {runSeoAuditMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running Audit...
                    </>
                  ) : (
                    <>
                      <FileSearch className="mr-2 h-4 w-4" />
                      Run SEO Audit
                    </>
                  )}
                </Button>

                {runSeoAuditMutation.data && (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      SEO Audit complete! Score: {runSeoAuditMutation.data.audit.overallScore}/100
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Audits</CardTitle>
                <CardDescription>Historical SEO audit results</CardDescription>
              </CardHeader>
              <CardContent>
                {auditsLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-400" />
                  </div>
                ) : audits.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    No audits yet. Run your first SEO audit above!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {audits.map((audit: any) => (
                      <div key={audit.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-slate-900 dark:text-slate-100">
                              SEO Audit ({audit.auditType})
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant={audit.overallScore >= 80 ? "default" : audit.overallScore >= 60 ? "secondary" : "destructive"}>
                                Score: {audit.overallScore}/100
                              </Badge>
                              <Badge variant="outline">
                                {Array.isArray(audit.criticalIssues) ? audit.criticalIssues.length : audit.criticalIssues || 0} critical
                              </Badge>
                              <Badge variant="outline">
                                {Array.isArray(audit.warnings) ? audit.warnings.length : audit.warnings || 0} warnings
                              </Badge>
                              <Badge variant="outline">
                                {audit.pagesChecked || 0} pages
                              </Badge>
                            </div>
                          </div>
                          <div className="text-xs text-slate-500">
                            {new Date(audit.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        {audit.recommendations && audit.recommendations.length > 0 && (
                          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded p-3">
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                              Top Recommendations:
                            </p>
                            <ul className="text-sm text-blue-800 dark:text-blue-200 list-disc list-inside space-y-1">
                              {audit.recommendations.slice(0, 3).map((rec: string, idx: number) => (
                                <li key={idx}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Generation Tab */}
          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Generate Content Brief</CardTitle>
                <CardDescription>
                  AI-powered SEO content briefs with outlines, keywords, and recommendations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Topic</label>
                  <Input
                    value={contentTopic}
                    onChange={(e) => setContentTopic(e.target.value)}
                    placeholder="E.g., Best used cars to buy in India 2024"
                    data-testid="input-content-topic"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Target Keywords (comma-separated, optional)</label>
                  <Input
                    value={contentKeywords}
                    onChange={(e) => setContentKeywords(e.target.value)}
                    placeholder="used cars, India, 2024, best deals"
                    data-testid="input-content-keywords"
                  />
                </div>
                <Button 
                  onClick={handleGenerateBrief}
                  disabled={generateBriefMutation.isPending}
                  data-testid="button-generate-brief"
                >
                  {generateBriefMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Brief
                    </>
                  )}
                </Button>

                {generateBriefMutation.data && (
                  <div className="space-y-4 border rounded-lg p-4 mt-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">SEO Title</h3>
                      <p className="text-slate-700 dark:text-slate-300">
                        {generateBriefMutation.data.brief.title}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Meta Description</h3>
                      <p className="text-slate-700 dark:text-slate-300">
                        {generateBriefMutation.data.brief.metaDescription}
                      </p>
                    </div>

                    {generateBriefMutation.data.brief.keywords && generateBriefMutation.data.brief.keywords.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Keywords</h3>
                        <div className="flex flex-wrap gap-2">
                          {generateBriefMutation.data.brief.keywords.map((kw: string, idx: number) => (
                            <Badge key={idx} variant="outline">{kw}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {generateBriefMutation.data.brief.outline && generateBriefMutation.data.brief.outline.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Content Outline</h3>
                        <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                          {generateBriefMutation.data.brief.outline.map((item: string, idx: number) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div>
                      <h3 className="font-semibold text-lg mb-2">Recommended Word Count</h3>
                      <p className="text-slate-700 dark:text-slate-300">
                        {generateBriefMutation.data.brief.wordCount} words
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
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
