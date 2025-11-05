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
  Eye,
  Brain,
  ShieldCheck
} from "lucide-react";
import AuditPage from "./admin/AuditPage";
import Top5Today from "./admin/Top5Today";
import Benchmark from "./admin/Benchmark";
import CreateArticle from "./admin/CreateArticle";
import NeedleMovement from "@/components/admin/NeedleMovement";

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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Enigmatic Hero Header - Hidden Intelligence */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-purple-900/50 to-indigo-900/50 p-8 shadow-2xl border border-purple-500/20">
          {/* Mysterious Glow Effect */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-600/20 via-transparent to-transparent"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-600/20 via-transparent to-transparent"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              {/* CarArth x ÆTHER Brain Logo */}
              <div className="relative">
                <div className="p-3 bg-purple-500/10 backdrop-blur-sm rounded-xl border border-purple-500/30 shadow-lg shadow-purple-500/20">
                  <Brain className="h-10 w-10 text-purple-300 animate-pulse" />
                </div>
                {/* CarArth DNA marker */}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-green-500 to-blue-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                  <span className="text-white text-[8px] font-black">C</span>
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-indigo-200 to-pink-200 tracking-tight">
                    ÆTHER
                  </h1>
                  <span className="text-xs font-bold text-purple-400/70 tracking-wider">by CarArth</span>
                </div>
                <p className="text-purple-300/90 text-sm font-mono mt-1 tracking-widest uppercase">
                  Adaptive Engine for Trust, Heuristics & Evolving Rankings
                </p>
              </div>
            </div>
            <p className="text-slate-300/80 text-base max-w-3xl leading-relaxed font-light italic">
              See what AI sees. Understand how search engines think. Uncover the hidden patterns that shape your digital presence. 
              Strategic intelligence meets intuitive insight—revealing what others miss.
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <Badge className="bg-purple-500/20 text-purple-200 border-purple-400/30 hover:bg-purple-500/30 text-xs px-4 py-1.5 font-mono backdrop-blur-sm">
                ∴ Perception Tracking
              </Badge>
              <Badge className="bg-indigo-500/20 text-indigo-200 border-indigo-400/30 hover:bg-indigo-500/30 text-xs px-4 py-1.5 font-mono backdrop-blur-sm">
                ◇ Pattern Analysis
              </Badge>
              <Badge className="bg-pink-500/20 text-pink-200 border-pink-400/30 hover:bg-pink-500/30 text-xs px-4 py-1.5 font-mono backdrop-blur-sm">
                ∞ Deep Intelligence
              </Badge>
              <Badge className="bg-violet-500/20 text-violet-200 border-violet-400/30 hover:bg-violet-500/30 text-xs px-4 py-1.5 font-mono backdrop-blur-sm">
                ◊ Hidden Insights
              </Badge>
            </div>
          </div>
        </div>

        {/* Main Tabs - Premium Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 gap-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-2 rounded-xl shadow-lg border-2 border-slate-200 dark:border-slate-800">
            <TabsTrigger 
              value="overview" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white font-semibold rounded-lg transition-all"
            >
              <Eye className="h-4 w-4" />
              Today
            </TabsTrigger>
            <TabsTrigger 
              value="seo" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white font-semibold rounded-lg transition-all"
            >
              <FileSearch className="h-4 w-4" />
              Audit
            </TabsTrigger>
            <TabsTrigger 
              value="geo" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white font-semibold rounded-lg transition-all"
            >
              <Search className="h-4 w-4" />
              Sweep
            </TabsTrigger>
            <TabsTrigger 
              value="benchmark" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white font-semibold rounded-lg transition-all"
            >
              <ShieldCheck className="h-4 w-4" />
              Benchmark
            </TabsTrigger>
            <TabsTrigger 
              value="create" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white font-semibold rounded-lg transition-all"
            >
              <Sparkles className="h-4 w-4" />
              Create
            </TabsTrigger>
            <TabsTrigger 
              value="content" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white font-semibold rounded-lg transition-all"
            >
              <TrendingUp className="h-4 w-4" />
              Briefs
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="flex items-center gap-2 font-semibold rounded-lg opacity-50" 
              disabled
            >
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Needle Movement Widget */}
            <NeedleMovement />
            
            {/* Top 5 Actions Today */}
            <Top5Today />

            {/* Premium Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Sweeps Card */}
              <Card className="relative overflow-hidden border-2 border-indigo-100 dark:border-indigo-900 shadow-lg hover:shadow-xl transition-shadow">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-bl-full"></div>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg">
                      <Search className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                      Total Scans
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black text-indigo-600 dark:text-indigo-400">
                    {statsLoading ? "..." : stats?.totalSweeps || 0}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                    AI visibility checks
                  </p>
                </CardContent>
              </Card>

              {/* CarArth Mentions Card */}
              <Card className="relative overflow-hidden border-2 border-green-100 dark:border-green-900 shadow-lg hover:shadow-xl transition-shadow">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-transparent rounded-bl-full"></div>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-green-100 dark:bg-green-900/40 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                      Visibility Score
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black text-green-600 dark:text-green-400">
                    {statsLoading ? "..." : stats?.mentionedSweeps || 0}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                    {stats?.mentionRate || "0%"} detection rate
                  </p>
                </CardContent>
              </Card>

              {/* Total Cost Card */}
              <Card className="relative overflow-hidden border-2 border-purple-100 dark:border-purple-900 shadow-lg hover:shadow-xl transition-shadow">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-bl-full"></div>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
                      <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                      Intelligence Cost
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black text-purple-600 dark:text-purple-400">
                    ${statsLoading ? "..." : (stats?.totalCost || 0).toFixed(4)}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                    Analysis investment
                  </p>
                </CardContent>
              </Card>

              {/* Avg Relevance Card */}
              <Card className="relative overflow-hidden border-2 border-pink-100 dark:border-pink-900 shadow-lg hover:shadow-xl transition-shadow">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-500/10 to-transparent rounded-bl-full"></div>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-pink-100 dark:bg-pink-900/40 rounded-lg">
                      <Sparkles className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                    </div>
                    <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                      Relevance
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black text-pink-600 dark:text-pink-400">
                    {statsLoading ? "..." : (stats?.avgRelevance || 0).toFixed(1)}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                    Average quality score
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="border-2 border-indigo-100 dark:border-indigo-900 shadow-lg bg-gradient-to-br from-white to-indigo-50/30 dark:from-slate-900 dark:to-indigo-950/30">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-50">∴ Intelligence Hub</CardTitle>
                <CardDescription className="text-base italic">
                  Run scans to reveal hidden patterns and competitor insights
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button
                  onClick={() => runDemoSweepMutation.mutate()}
                  disabled={runDemoSweepMutation.isPending}
                  data-testid="button-run-demo"
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-6 shadow-lg"
                  size="lg"
                >
                  {runDemoSweepMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Running Scan...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Run Demo Scan
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab("geo")}
                  className="border-2 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 font-semibold px-6"
                  size="lg"
                >
                  <Search className="mr-2 h-5 w-5" />
                  View Insights
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab("seo")}
                  className="border-2 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950 font-semibold px-6"
                  size="lg"
                >
                  <FileSearch className="mr-2 h-5 w-5" />
                  Audit Site
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity - Enhanced */}
            {sweeps.length > 0 && (
              <Card className="border-2 border-slate-200 dark:border-slate-800 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                  <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                    <Eye className="h-5 w-5 text-indigo-600" />
                    Recent Scans
                  </CardTitle>
                  <CardDescription className="text-base italic">
                    Your latest visibility checks and pattern discoveries
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-6">
                  {sweeps.slice(0, 5).map((sweep: any) => (
                    <div 
                      key={sweep.id} 
                      className="flex items-start justify-between p-4 border-2 border-slate-100 dark:border-slate-800 rounded-xl hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-md transition-all bg-white dark:bg-slate-900"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
                          {sweep.promptText.length > 80 ? sweep.promptText.substring(0, 80) + '...' : sweep.promptText}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge 
                            variant={sweep.cararthMentioned ? "default" : "secondary"} 
                            className={`text-xs font-semibold ${
                              sweep.cararthMentioned 
                                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100' 
                                : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100'
                            }`}
                          >
                            {sweep.cararthMentioned ? "✅ Brand Mentioned" : "❌ Not Mentioned"}
                          </Badge>
                          {sweep.promptCategory && (
                            <Badge variant="outline" className="text-xs font-medium border-indigo-200 text-indigo-700 dark:border-indigo-700 dark:text-indigo-300">
                              {sweep.promptCategory}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 ml-4 font-medium">
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
            <AuditPage />
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

          {/* Benchmark Tab */}
          <TabsContent value="benchmark" className="space-y-6">
            <Benchmark />
          </TabsContent>

          {/* Create Tab */}
          <TabsContent value="create" className="space-y-6">
            <CreateArticle />
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
