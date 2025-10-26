import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageSquare, Eye, Calendar, Plus, 
  MessageCircle, Globe, ExternalLink, LogIn,
  Heart, Bookmark, Share2, ThumbsUp, TrendingUp,
  Image as ImageIcon, Play, BarChart3, Users, Info, HelpCircle, Download, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { BrandWordmark } from "@/components/brand-wordmark";
import { AuthDialog } from "@/components/auth-dialog";
import { NewsSEOHead, FAQSchemaMarkup } from "@/components/news-seo-head";
import SocialShareButtons from "@/components/social-share-buttons";
import { McKinseyInsightCard } from "@/components/mckinsey-insight-card";
import MarketIntelligenceDashboard from "@/pages/MarketIntelligenceDashboard";
import { StorySubmissionForm } from "@/components/story-submission-form";
import { RoadTalesCarousel } from "@/components/road-tales-carousel";
import { PollWidget } from "@/components/poll-widget";

interface ForumPost {
  id: string;
  title: string;
  author: string;
  authorImage?: string;
  category: string;
  replies: number;
  views: number;
  lastReply: string;
  isExternal?: boolean;
  sourceUrl?: string;
  attribution?: string;
  coverImage?: string;
  likes?: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  readTime?: string;
  trending?: boolean;
  content?: string;
  dataPoints?: string[];
  citations?: string[];
  infographic?: any; // McKinsey-style infographic data
}

// Post creation form schema
const postSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  category: z.string().min(1, "Please select a category"),
});

type PostFormData = z.infer<typeof postSchema>;

// Benchmark creation form schema
const benchmarkSchema = z.object({
  oem: z.enum(["Maruti Suzuki", "Hyundai", "Tata Motors", "Mahindra", "Kia", "Honda", "Toyota", "Renault", "Nissan", "Volkswagen"], {
    required_error: "Please select an OEM"
  }),
  month: z.string().min(1, "Please select a month"),
  mtdSales: z.coerce.number().int().min(1, "MTD sales must be at least 1"),
  dealerName: z.string().optional(),
});

type BenchmarkFormData = z.infer<typeof benchmarkSchema>;

// Helper function to generate downloadable HTML benchmark report
function generateBenchmarkPDF(benchmark: any): string {
  if (!benchmark) return '';
  
  const { comparison, forecast, insights, dealerName, oem, month } = benchmark;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Benchmark Report - ${dealerName} - ${oem} - ${month}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
    h1 { color: #1a73e8; border-bottom: 3px solid #1a73e8; padding-bottom: 10px; }
    h2 { color: #333; margin-top: 30px; }
    .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
    .metric-card { border: 2px solid #e0e0e0; border-radius: 8px; padding: 15px; }
    .metric-card.positive { border-color: #34a853; }
    .metric-card.negative { border-color: #ea4335; }
    .metric-label { font-size: 12px; color: #666; margin-bottom: 5px; }
    .metric-value { font-size: 28px; font-weight: bold; margin: 5px 0; }
    .metric-value.positive { color: #34a853; }
    .metric-value.negative { color: #ea4335; }
    .metric-sublabel { font-size: 11px; color: #999; }
    .forecast-box { background: #e8f0fe; border-left: 4px solid #1a73e8; padding: 20px; margin: 20px 0; }
    .insight { background: #f8f9fa; padding: 15px; margin: 10px 0; border-left: 3px solid #1a73e8; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666; text-align: center; }
  </style>
</head>
<body>
  <h1>Performance Benchmark Report</h1>
  <p><strong>Dealership:</strong> ${dealerName}</p>
  <p><strong>OEM:</strong> ${oem}</p>
  <p><strong>Period:</strong> ${month}</p>
  
  <h2>Performance Overview</h2>
  <div class="metric-grid">
    <div class="metric-card">
      <div class="metric-label">MTD Sales</div>
      <div class="metric-value">${comparison.mtdSales}</div>
      <div class="metric-sublabel">units</div>
    </div>
    <div class="metric-card ${comparison.vsTelanganaPct >= 0 ? 'positive' : 'negative'}">
      <div class="metric-label">vs Telangana Average</div>
      <div class="metric-value ${comparison.vsTelanganaPct >= 0 ? 'positive' : 'negative'}">
        ${comparison.vsTelanganaPct >= 0 ? '+' : ''}${comparison.vsTelanganaPct.toFixed(1)}%
      </div>
      <div class="metric-sublabel">${comparison.telanganaAvg} units avg</div>
    </div>
    <div class="metric-card ${comparison.vsROIPct >= 0 ? 'positive' : 'negative'}">
      <div class="metric-label">vs Rest of India Average</div>
      <div class="metric-value ${comparison.vsROIPct >= 0 ? 'positive' : 'negative'}">
        ${comparison.vsROIPct >= 0 ? '+' : ''}${comparison.vsROIPct.toFixed(1)}%
      </div>
      <div class="metric-sublabel">${comparison.roiAvg} units avg</div>
    </div>
    ${comparison.momGrowth !== null ? `
    <div class="metric-card ${comparison.momGrowth >= 0 ? 'positive' : 'negative'}">
      <div class="metric-label">Month-over-Month Growth</div>
      <div class="metric-value ${comparison.momGrowth >= 0 ? 'positive' : 'negative'}">
        ${comparison.momGrowth >= 0 ? '+' : ''}${comparison.momGrowth.toFixed(1)}%
      </div>
    </div>` : ''}
  </div>
  
  <h2>ML-Powered Forecast</h2>
  <div class="forecast-box">
    <p><strong>Method:</strong> ${forecast.forecastMethod}</p>
    <p><strong>Next Month Prediction:</strong> ${forecast.nextMonthPrediction} units</p>
    <p><strong>Expected Change:</strong> ${forecast.predictionChange >= 0 ? '+' : ''}${forecast.predictionChange.toFixed(1)}%</p>
  </div>
  
  <h2>Key Insights</h2>
  ${insights.map((insight: string, idx: number) => `
    <div class="insight">
      <strong>${idx + 1}.</strong> ${insight}
    </div>
  `).join('')}
  
  <div class="footer">
    <p>Generated by CarArth Machine Learning Benchmarking</p>
    <p>Data Sources: Telangana RTA, VAHAN, SIAM</p>
    <p>Generated on: ${new Date().toLocaleString()}</p>
  </div>
</body>
</html>
  `.trim();
}

// Clean, minimal community platform
export default function ThrottleTalkPage() {
  const [activeTab, setActiveTab] = useState('intelligence');
  const [communityFilter, setCommunityFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isBenchmarkDialogOpen, setIsBenchmarkDialogOpen] = useState(false);
  const [benchmarkResults, setBenchmarkResults] = useState<any>(null);
  const [isBenchmarkResultsOpen, setIsBenchmarkResultsOpen] = useState(false);
  const [isStoryDialogOpen, setIsStoryDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if user is authenticated
  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ['/api/auth/user'],
    retry: false,
    refetchOnWindowFocus: false,
  });

  const isAuthenticated = !!user;

  // Fetch community posts from RSS aggregation
  const { data: communityData, isLoading: isCommunityLoading, error: communityError, refetch: refetchCommunity } = useQuery({
    queryKey: ['/api/community/posts'],
    refetchInterval: 600000, // Refresh every 10 minutes
    retry: 2, // Retry twice before failing
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  // Fetch user-generated posts
  const { data: userPostsData, isLoading: isUserPostsLoading } = useQuery({
    queryKey: ['/api/community/user-posts'],
    enabled: isAuthenticated,
  });

  // Fetch market insights from Perplexity LLM (always load for unified tab)
  const { data: marketInsightsData, isLoading: isMarketInsightsLoading, error: marketInsightsError, refetch: refetchMarketInsights } = useQuery({
    queryKey: ['/api/news/market-insights'],
    enabled: activeTab === 'intelligence',
    refetchInterval: 3600000, // Refresh every hour
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Fetch leadership articles
  const { data: leadershipData, isLoading: isLeadershipLoading } = useQuery({
    queryKey: ['/api/leadership/articles'],
    enabled: activeTab === 'community',
    refetchInterval: 600000, // Refresh every 10 minutes
    retry: 2,
  });

  // Post creation form
  const form = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: "",
      content: "",
      category: "",
    },
  });

  // Benchmark creation form
  const benchmarkForm = useForm<BenchmarkFormData>({
    resolver: zodResolver(benchmarkSchema),
    defaultValues: {
      oem: undefined,
      month: "",
      mtdSales: undefined,
      dealerName: "",
    },
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (data: PostFormData) => {
      return await apiRequest("POST", "/api/community/posts", data);
    },
    onSuccess: () => {
      toast({
        title: "Post created",
        description: "Your post has been published successfully.",
      });
      setIsCreateDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/community/user-posts'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create post",
        variant: "destructive",
      });
    },
  });

  // Create benchmark mutation
  const createBenchmarkMutation = useMutation({
    mutationFn: async (data: BenchmarkFormData) => {
      return await apiRequest("POST", "/api/dealership/benchmark", data);
    },
    onSuccess: (response: any) => {
      // Response has { success, benchmark, message } structure
      setBenchmarkResults(response.benchmark);
      setIsBenchmarkDialogOpen(false);
      setIsBenchmarkResultsOpen(true);
      benchmarkForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate benchmark",
        variant: "destructive",
      });
    },
  });

  // Convert RSS data to forum post format
  const rssContent = (communityData as any)?.success ? (communityData as any).posts.map((post: any) => ({
    id: post.id,
    title: post.title,
    author: post.author,
    category: post.category,
    replies: Math.floor(Math.random() * 50),
    views: Math.floor(Math.random() * 1000) + 100,
    lastReply: new Date(post.publishedAt).toLocaleDateString(),
    isExternal: post.category !== 'Market Intelligence', // Benchmarks are internal
    sourceUrl: post.sourceUrl,
    attribution: post.attribution,
    content: post.content // Include HTML content for benchmarks
  })) : [];

  // Convert user posts data to forum post format
  const userPosts: ForumPost[] = (userPostsData as any)?.posts?.map((post: any) => ({
    id: post.id,
    title: post.title,
    author: post.author?.firstName || 'Anonymous',
    authorImage: post.author?.profileImageUrl,
    category: post.category,
    replies: 0, // Will be implemented with comments
    views: post.views || 0,
    lastReply: new Date(post.createdAt).toLocaleDateString(),
    isExternal: false,
  })) || [];

  // Convert market insights to post format for display
  const marketInsightsPosts: ForumPost[] = activeTab === 'intelligence' && (marketInsightsData as any)?.success ? 
    (marketInsightsData as any).insights.map((insight: any, index: number) => ({
      id: `market-insight-${index}`,
      title: insight.topic,
      author: `${(marketInsightsData as any).meta?.source || 'CarArth Market Intelligence'}`,
      authorImage: undefined,
      category: 'Market Insights',
      replies: 0,
      views: Math.floor(100 + Math.random() * 500),
      lastReply: new Date().toLocaleDateString(),
      isExternal: false,
      attribution: insight.sources?.length > 0 ? `Sources: ${insight.sources.join(', ')}` : 'SIAM, RTA, VAHAAN, CarDekho, Cars24 Data',
      content: insight.insight,
      dataPoints: insight.dataPoints,
      citations: insight.citations,
      infographic: insight.infographic, // McKinsey-style data
    })) : [];

  // Convert leadership articles to post format
  const leadershipPosts: ForumPost[] = (leadershipData as any)?.success ? 
    (leadershipData as any).articles.map((article: any) => ({
      id: article.id,
      title: article.title,
      author: article.source,
      category: 'Leadership & Promotions',
      replies: 0,
      views: Math.floor(Math.random() * 500) + 100,
      lastReply: new Date(article.publishedAt).toLocaleDateString(),
      isExternal: true,
      sourceUrl: article.sourceUrl,
      attribution: article.attribution,
      content: article.enhancedContent || article.content,
    })) : [];

  // Filter community posts based on selected filter
  let communityPosts = [...userPosts, ...rssContent];
  if (communityFilter === 'reviews') {
    communityPosts = communityPosts.filter(p => p.category === 'Reviews');
  } else if (communityFilter === 'questions') {
    communityPosts = communityPosts.filter(p => p.category === 'Questions');
  } else if (communityFilter === 'leadership') {
    communityPosts = leadershipPosts;
  }
  communityPosts = communityPosts.slice(0, 20);

  if (isCommunityLoading || (activeTab === 'intelligence' && isMarketInsightsLoading)) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
            {activeTab === 'intelligence' && (
              <p className="ml-3 text-gray-600 dark:text-gray-400">Analyzing market trends...</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Error state handling with retry
  if (communityError || (activeTab === 'intelligence' && marketInsightsError)) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-4xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Unable to Load Content
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {communityError 
                  ? "We're having trouble loading Throttle Talk articles. This could be due to a temporary connection issue."
                  : "Market insights are temporarily unavailable. Our team is working to restore the service."}
              </p>
              <div className="flex gap-3 justify-center">
                <Button 
                  onClick={() => communityError ? refetchCommunity() : refetchMarketInsights()}
                  data-testid="button-retry-load"
                >
                  Try Again
                </Button>
                <Link href="/">
                  <Button variant="outline" data-testid="button-back-home">
                    Go to Homepage
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Combine all posts for SEO
  const allPostsForSEO = [...marketInsightsPosts, ...communityPosts];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* SEO & Schema Markup */}
      <NewsSEOHead posts={allPostsForSEO.map((p: ForumPost) => ({ ...p, publishedAt: new Date(p.lastReply) }))} />
      <FAQSchemaMarkup />
      
      {/* Clean header */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <BrandWordmark variant="header" showTagline={false} className="scale-75 sm:scale-75 hidden sm:block" />
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                  Throttle Talk
                </h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1">
                  Automotive community discussions
                </p>
              </div>
            </div>
            {isAuthenticated ? (
              <div className="flex gap-1.5 sm:gap-2 flex-wrap w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/news/oem-report'}
                  data-testid="button-oem-report"
                  className="flex-1 sm:flex-none text-xs sm:text-sm min-h-[44px]"
                >
                  <TrendingUp className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">OEM Report</span>
                </Button>
                <Button 
                  onClick={() => setIsStoryDialogOpen(true)}
                  variant="outline" 
                  className="border-purple-600 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950 flex-1 sm:flex-none text-xs sm:text-sm min-h-[44px]" 
                  data-testid="button-share-story"
                >
                  <MessageSquare className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Share Story</span>
                </Button>
                <Dialog open={isBenchmarkDialogOpen} onOpenChange={setIsBenchmarkDialogOpen}>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                          <Button variant="outline" data-testid="button-new-benchmark" className="flex-1 sm:flex-none text-xs sm:text-sm min-h-[44px]">
                            <TrendingUp className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Machine Learning Benchmarking</span>
                          </Button>
                        </DialogTrigger>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm" side="bottom">
                        <p className="text-xs">
                          Compare your dealership's sales performance against regional and national averages using AI-powered forecasting. 
                          Get ML predictions for next month based on historical RTA, VAHAN, and SIAM data.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Machine Learning Benchmarking</DialogTitle>
                      <DialogDescription>
                        Create ML-powered performance forecast with market comparisons
                      </DialogDescription>
                    </DialogHeader>
                    
                    {/* Info Banner */}
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex gap-2">
                      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        We're working on integrating real-time data feeds. Current data has a 2-3 month lag due to RTA reporting schedules.
                      </p>
                    </div>
                    
                    {/* Data Sources Badge */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <BarChart3 className="h-3.5 w-3.5" />
                      <span className="font-medium">Data Sources:</span>
                      <Badge variant="outline" className="text-xs">Telangana RTA</Badge>
                      <Badge variant="outline" className="text-xs">VAHAN</Badge>
                      <Badge variant="outline" className="text-xs">SIAM</Badge>
                    </div>
                    <Form {...benchmarkForm}>
                      <form onSubmit={benchmarkForm.handleSubmit((data) => createBenchmarkMutation.mutate(data))} className="space-y-4">
                        <TooltipProvider>
                          <div className="space-y-4">
                            <FormField
                              control={benchmarkForm.control}
                              name="oem"
                              render={({ field }) => (
                                <FormItem>
                                  <div className="flex items-center gap-2">
                                    <FormLabel>OEM Brand</FormLabel>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-xs">
                                        <p className="text-xs">Select the car manufacturer to benchmark against regional market data from RTA and VAHAN databases.</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </div>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger data-testid="select-benchmark-oem">
                                        <SelectValue placeholder="Select brand" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="Maruti Suzuki">Maruti Suzuki</SelectItem>
                                      <SelectItem value="Hyundai">Hyundai</SelectItem>
                                      <SelectItem value="Tata Motors">Tata Motors</SelectItem>
                                      <SelectItem value="Mahindra">Mahindra</SelectItem>
                                      <SelectItem value="Kia">Kia</SelectItem>
                                      <SelectItem value="Honda">Honda</SelectItem>
                                      <SelectItem value="Toyota">Toyota</SelectItem>
                                      <SelectItem value="Renault">Renault</SelectItem>
                                      <SelectItem value="Nissan">Nissan</SelectItem>
                                      <SelectItem value="Volkswagen">Volkswagen</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={benchmarkForm.control}
                              name="month"
                              render={({ field }) => {
                                // Generate last 24 months, starting from 3 months ago
                                const today = new Date();
                                const months = [];
                                const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                                                  'July', 'August', 'September', 'October', 'November', 'December'];
                                
                                for (let i = 3; i < 27; i++) {
                                  const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
                                  const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                                  const label = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
                                  months.push({ value, label });
                                }
                                
                                return (
                                  <FormItem>
                                    <div className="flex items-center gap-2">
                                      <FormLabel>Month</FormLabel>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                          <p className="text-xs">Choose a historical month with available RTA registration data. Data is available 3 months after the period ends.</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </div>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger data-testid="select-benchmark-month">
                                          <SelectValue placeholder="Select month" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {months.map(month => (
                                          <SelectItem key={month.value} value={month.value}>
                                            {month.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                );
                              }}
                            />
                            <FormField
                              control={benchmarkForm.control}
                              name="mtdSales"
                              render={({ field }) => (
                                <FormItem>
                                  <div className="flex items-center gap-2">
                                    <FormLabel>MTD Sales</FormLabel>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-xs">
                                        <p className="text-xs">Month-to-Date sales: How many cars did you sell in the selected month? This will be compared against other dealers in your region.</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </div>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="e.g., 130"
                                      {...field}
                                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                      value={field.value ?? ''}
                                      data-testid="input-benchmark-mtd"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={benchmarkForm.control}
                              name="dealerName"
                              render={({ field }) => (
                                <FormItem>
                                  <div className="flex items-center gap-2">
                                    <FormLabel>Dealer Name (Optional)</FormLabel>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-xs">
                                        <p className="text-xs">Add your dealership name to personalize the generated benchmark report.</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </div>
                                  <FormControl>
                                    <Input placeholder="Your dealership name" {...field} data-testid="input-benchmark-dealer" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </TooltipProvider>
                        <div className="flex justify-end gap-3">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsBenchmarkDialogOpen(false)}
                            data-testid="button-cancel-benchmark"
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={createBenchmarkMutation.isPending}
                            data-testid="button-submit-benchmark"
                          >
                            {createBenchmarkMutation.isPending ? "Generating..." : "Generate Benchmark"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>

                {/* Benchmark Results Dialog */}
                <Dialog open={isBenchmarkResultsOpen} onOpenChange={setIsBenchmarkResultsOpen}>
                  <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <DialogTitle className="text-xl">Performance Benchmark Results</DialogTitle>
                          <DialogDescription>
                            {benchmarkResults?.dealerName} - {benchmarkResults?.oem} - {benchmarkResults?.month}
                          </DialogDescription>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const content = generateBenchmarkPDF(benchmarkResults);
                            const blob = new Blob([content], { type: 'text/html' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `benchmark-${benchmarkResults?.oem}-${benchmarkResults?.month}.html`;
                            a.click();
                            URL.revokeObjectURL(url);
                            toast({
                              title: "Downloaded",
                              description: "Benchmark report downloaded successfully",
                            });
                          }}
                          data-testid="button-download-benchmark"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </DialogHeader>

                    {benchmarkResults && (
                      <div className="space-y-6 mt-4">
                        {/* Performance Overview */}
                        <div className="space-y-3">
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Performance Overview
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <Card className="p-4">
                              <p className="text-xs text-muted-foreground mb-1">MTD Sales</p>
                              <p className="text-2xl font-bold">{benchmarkResults.comparison.mtdSales}</p>
                              <p className="text-xs text-muted-foreground">units</p>
                            </Card>
                            <Card className={cn("p-4", benchmarkResults.comparison.vsTelanganaPct >= 0 ? "border-green-500 dark:border-green-700" : "border-red-500 dark:border-red-700")}>
                              <p className="text-xs text-muted-foreground mb-1">vs Telangana Avg</p>
                              <p className={cn("text-2xl font-bold", benchmarkResults.comparison.vsTelanganaPct >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                                {benchmarkResults.comparison.vsTelanganaPct >= 0 ? '+' : ''}{benchmarkResults.comparison.vsTelanganaPct.toFixed(1)}%
                              </p>
                              <p className="text-xs text-muted-foreground">{benchmarkResults.comparison.telanganaAvg} avg</p>
                            </Card>
                            <Card className={cn("p-4", benchmarkResults.comparison.vsROIPct >= 0 ? "border-green-500 dark:border-green-700" : "border-red-500 dark:border-red-700")}>
                              <p className="text-xs text-muted-foreground mb-1">vs ROI Avg</p>
                              <p className={cn("text-2xl font-bold", benchmarkResults.comparison.vsROIPct >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                                {benchmarkResults.comparison.vsROIPct >= 0 ? '+' : ''}{benchmarkResults.comparison.vsROIPct.toFixed(1)}%
                              </p>
                              <p className="text-xs text-muted-foreground">{benchmarkResults.comparison.roiAvg} avg</p>
                            </Card>
                            {benchmarkResults.comparison.momGrowth !== null && (
                              <Card className={cn("p-4", benchmarkResults.comparison.momGrowth >= 0 ? "border-green-500 dark:border-green-700" : "border-red-500 dark:border-red-700")}>
                                <p className="text-xs text-muted-foreground mb-1">MoM Growth</p>
                                <p className={cn("text-2xl font-bold", benchmarkResults.comparison.momGrowth >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                                  {benchmarkResults.comparison.momGrowth >= 0 ? '+' : ''}{benchmarkResults.comparison.momGrowth.toFixed(1)}%
                                </p>
                              </Card>
                            )}
                          </div>
                        </div>

                        {/* ML Forecast */}
                        <div className="space-y-3">
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            ML-Powered Forecast
                          </h3>
                          <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Next Month Prediction</p>
                                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                  {benchmarkResults.forecast.nextMonthPrediction} units
                                </p>
                                <p className={cn("text-sm", benchmarkResults.forecast.predictionChange >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                                  {benchmarkResults.forecast.predictionChange >= 0 ? '+' : ''}{benchmarkResults.forecast.predictionChange.toFixed(1)}% change
                                </p>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {benchmarkResults.forecast.forecastMethod}
                              </Badge>
                            </div>
                          </Card>
                        </div>

                        {/* AI Insights */}
                        <div className="space-y-3">
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            <Info className="h-5 w-5" />
                            Key Insights
                          </h3>
                          <div className="space-y-2">
                            {benchmarkResults.insights.map((insight: string, idx: number) => (
                              <div key={idx} className="flex gap-2 p-3 bg-muted rounded-lg">
                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                                  {idx + 1}
                                </div>
                                <p className="text-sm">{insight}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Data Attribution */}
                        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground border-t pt-4">
                          <BarChart3 className="h-3.5 w-3.5" />
                          <span>Powered by: Telangana RTA, VAHAN, SIAM</span>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
                
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 flex-1 sm:flex-none text-xs sm:text-sm min-h-[44px]" data-testid="button-new-post">
                      <Plus className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">New Post</span>
                    </Button>
                  </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Create New Post</DialogTitle>
                    <DialogDescription>
                      Share your thoughts with the automotive community
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit((data) => createPostMutation.mutate(data))} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input placeholder="What's on your mind? #cararth.com" {...field} data-testid="input-post-title" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-post-category">
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="reviews">Reviews</SelectItem>
                                <SelectItem value="questions">Questions</SelectItem>
                                <SelectItem value="market-insights">Market Insights</SelectItem>
                                <SelectItem value="discussion">Discussion</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Content</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Share your thoughts, experiences, or ask questions with #cararth.com community..."
                                className="min-h-[120px]"
                                {...field}
                                data-testid="textarea-post-content"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-3">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsCreateDialogOpen(false)}
                          data-testid="button-cancel-post"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createPostMutation.isPending}
                          data-testid="button-submit-post"
                        >
                          {createPostMutation.isPending ? "Publishing..." : "Publish Post"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              </div>
            ) : (
              <div className="flex justify-center">
                <AuthDialog />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content with tabs */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-8">
            <TabsTrigger value="intelligence" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm py-2 sm:py-3" data-testid="tab-intelligence">
              <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Market Intelligence</span>
              <span className="sm:hidden">Intelligence</span>
            </TabsTrigger>
            <TabsTrigger value="community" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm py-2 sm:py-3" data-testid="tab-community">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Community
            </TabsTrigger>
          </TabsList>

          {/* Unified Market Intelligence Tab - Combines Insights & Analytics */}
          <TabsContent value="intelligence" className="space-y-6">
            {/* Market Insights Section - AI-Powered Analysis */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                  AI-Powered Market Insights
                </h2>
              </div>
              
              {marketInsightsPosts.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <TrendingUp className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">
                    Loading market insights...
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    AI-powered analysis of India's automotive market
                  </p>
                </div>
              ) : (
                marketInsightsPosts.map((post) => (
                <Card 
                  key={post.id} 
                  className="hover:shadow-sm transition-shadow cursor-pointer border border-gray-200 dark:border-gray-800" 
                  data-testid={`card-post-${post.id}`}
                  onClick={() => {
                    if (post.isExternal && post.sourceUrl) {
                      window.open(post.sourceUrl, '_blank');
                    }
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      
                      {/* Author avatar */}
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={post.authorImage} />
                        <AvatarFallback className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          {post.author.charAt(0)}
                        </AvatarFallback>
                      </Avatar>

                      {/* Post content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h3 className="font-medium text-gray-900 dark:text-white leading-tight">
                            {post.title}
                          </h3>
                          {post.isExternal && (
                            <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                          <span>by {post.author}</span>
                          <Badge variant="outline" className="text-xs">
                            {post.category}
                          </Badge>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {post.lastReply}
                          </span>
                        </div>

                        {/* Dealership Benchmark Card - Special rendering for ML-powered benchmarks */}
                        {post.id.startsWith('dealership-benchmark-') && post.content && (
                          <div className="mt-4 -mx-6 px-6 py-4 border-t border-gray-200 dark:border-gray-800" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-2 mb-3">
                              <Badge variant="default" className="bg-blue-500 text-white">
                                🤖 ML Forecast
                              </Badge>
                              <Badge variant="outline">
                                {post.attribution?.split('with ')[1] || 'Hybrid Prediction'}
                              </Badge>
                            </div>
                            <div 
                              className="prose prose-sm dark:prose-invert max-w-none"
                              dangerouslySetInnerHTML={{ __html: post.content }}
                            />
                          </div>
                        )}

                        {/* McKinsey-style infographic */}
                        {!post.id.startsWith('dealership-benchmark-') && post.infographic && (
                          <div className="mt-4 -mx-6 px-6 py-4 bg-gray-50 dark:bg-gray-900/50" onClick={(e) => e.stopPropagation()}>
                            <McKinseyInsightCard insight={{ infographic: post.infographic }} />
                          </div>
                        )}

                        {/* Standard market insights content (fallback) */}
                        {!post.id.startsWith('dealership-benchmark-') && !post.infographic && post.content && (
                          <div className="mt-3 text-sm text-gray-700 dark:text-gray-300">
                            <p>{post.content}</p>
                          </div>
                        )}

                        {/* Data points for market insights */}
                        {post.dataPoints && post.dataPoints.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Key Data Points:</p>
                            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                              {post.dataPoints.map((point: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-gray-400">•</span>
                                  <span>{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400 mt-3">
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4" />
                            {post.replies} replies
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {post.views} views
                          </span>
                        </div>

                        {/* Social Sharing - Always link to CarArth for backlinks */}
                        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                          <SocialShareButtons
                            url={`/news/${post.id}`}
                            title={post.category === 'Market Insights' && post.author 
                              ? `${post.title} - ${post.author}` 
                              : post.isExternal 
                                ? `${post.title} (via ${post.attribution})` 
                                : post.title}
                            description={post.content || `India's premier automotive insights and market intelligence - Read on CarArth`}
                          />
                        </div>

                        {/* Attribution and citations */}
                        {post.attribution && (
                          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {post.attribution}
                            </p>
                            {/* Citations for market insights */}
                            {post.citations && post.citations.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Citations:</p>
                                <ul className="text-xs text-gray-500 dark:text-gray-500 space-y-1">
                                  {post.citations.slice(0, 3).map((citation: string, idx: number) => (
                                    <li key={idx} className="truncate">
                                      {idx + 1}. {citation}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
            </div>

            {/* Market Analytics Dashboard - OEM Performance Data */}
            <div className="space-y-4 mt-8">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Market Analytics Dashboard
                </h2>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Updated monthly with OEM performance data and dealer analytics
                </p>
                <MarketIntelligenceDashboard />
              </div>
            </div>
          </TabsContent>

          {/* Community Tab */}
          <TabsContent value="community" className="space-y-6">
            {/* Road Tales Carousel - Featured Car Stories */}
            <RoadTalesCarousel />
            
            {/* Poll Section */}
            <PollWidget />
            
            {/* Filter for Reviews and Questions */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
              <button
                onClick={() => setCommunityFilter('all')}
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-colors border-b-2",
                  communityFilter === 'all'
                    ? "border-gray-900 text-gray-900 dark:border-white dark:text-white"
                    : "border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                )}
                data-testid="filter-all"
              >
                All
              </button>
              <button
                onClick={() => setCommunityFilter('reviews')}
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-colors border-b-2",
                  communityFilter === 'reviews'
                    ? "border-gray-900 text-gray-900 dark:border-white dark:text-white"
                    : "border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                )}
                data-testid="filter-reviews"
              >
                Reviews
              </button>
              <button
                onClick={() => setCommunityFilter('questions')}
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-colors border-b-2",
                  communityFilter === 'questions'
                    ? "border-gray-900 text-gray-900 dark:border-white dark:text-white"
                    : "border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                )}
                data-testid="filter-questions"
              >
                Questions
              </button>
              <button
                onClick={() => setCommunityFilter('leadership')}
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-colors border-b-2",
                  communityFilter === 'leadership'
                    ? "border-gray-900 text-gray-900 dark:border-white dark:text-white"
                    : "border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                )}
                data-testid="filter-leadership"
              >
                Leadership & Promotions
              </button>
            </div>

            {/* Community Posts */}
            <div className="space-y-4">
              {communityPosts.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No posts yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Be the first to start a discussion
                  </p>
                </div>
              ) : (
                communityPosts.map((post) => (
                  <Card 
                    key={post.id} 
                    className="hover:shadow-sm transition-shadow cursor-pointer border border-gray-200 dark:border-gray-800" 
                    data-testid={`card-post-${post.id}`}
                    onClick={() => {
                      if (post.isExternal && post.sourceUrl) {
                        window.open(post.sourceUrl, '_blank');
                      }
                    }}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={post.authorImage} />
                          <AvatarFallback className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                            {post.author.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <h3 className="font-medium text-gray-900 dark:text-white leading-tight">
                              {post.title}
                            </h3>
                            {post.isExternal && (
                              <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                            <span>by {post.author}</span>
                            <Badge variant="outline" className="text-xs">
                              {post.category}
                            </Badge>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {post.lastReply}
                            </span>
                          </div>
                          <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <MessageCircle className="h-4 w-4" />
                              {post.replies} replies
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              {post.views} views
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Story Submission Form Dialog */}
      <StorySubmissionForm 
        open={isStoryDialogOpen} 
        onOpenChange={setIsStoryDialogOpen} 
      />
    </div>
  );
}