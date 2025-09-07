import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Zap, TrendingUp, Building2, MapPin, Calendar, Star, BarChart3, 
  Flame, Clock, MessageSquare, Heart, Share2, Eye, Users, 
  MessageCircle, Globe, Cpu, Scale, Newspaper, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NewsArticle {
  title: string;
  summary: string;
  source: string;
  relevance: 'high' | 'medium' | 'low';
  category: 'market' | 'pricing' | 'industry' | 'technology' | 'regulatory';
  publishedAt: string;
  impact: string;
  image?: string;
  hasVideo?: boolean;
}

interface MarketInsight {
  topic: string;
  insight: string;
  dataPoints: string[];
  marketImpact: 'positive' | 'negative' | 'neutral';
  confidence: number;
}

interface EngagementStats {
  views: number;
  likes: number;
  shares: number;
  comments: number;
}

export default function ThrottleTalkPage() {
  const [selectedBrand, setSelectedBrand] = useState('Maruti Suzuki');
  const [engagementMode, setEngagementMode] = useState<'trending' | 'latest' | 'discussions'>('trending');
  const [likedArticles, setLikedArticles] = useState<Set<number>>(new Set());

  const { data: newsData, isLoading: newsLoading, refetch: refetchNews } = useQuery({
    queryKey: ['/api/news/automotive'],
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const { data: marketInsights, isLoading: marketLoading } = useQuery({
    queryKey: ['/api/news/market-insights'],
  });

  const { data: brandInsights, isLoading: brandLoading } = useQuery({
    queryKey: ['/api/news/brand-insights', selectedBrand],
  });

  const brands = ['Maruti Suzuki', 'Hyundai', 'Tata', 'Mahindra', 'Honda', 'Toyota'];

  const engagementModes = [
    { id: 'trending', name: 'Hot Topics', icon: <Flame className="h-4 w-4" />, color: 'orange' },
    { id: 'latest', name: 'Fresh Intel', icon: <Clock className="h-4 w-4" />, color: 'blue' },
    { id: 'discussions', name: 'Community Buzz', icon: <MessageSquare className="h-4 w-4" />, color: 'green' },
  ];

  // Enhanced engagement stats and visual content for articles
  const getEngagementStats = (index: number): EngagementStats => ({
    views: Math.floor(Math.random() * 5000) + 1000,
    likes: Math.floor(Math.random() * 200) + 50,
    shares: Math.floor(Math.random() * 50) + 10,
    comments: Math.floor(Math.random() * 30) + 5,
  });

  // Get featured image for article based on category and index
  const getArticleImage = (category: string, index: number): string => {
    const images = {
      pricing: '/attached_assets/generated_images/Dynamic_sports_car_mountain_road_5267e5a6.png',
      market: '/attached_assets/generated_images/Car_enthusiasts_community_gathering_46d58c97.png',
      technology: '/attached_assets/generated_images/Business_presentation_dashboard_slide_4797876d.png',
      regulatory: '/attached_assets/generated_images/Chrome_SUV_car_silhouette_7820aecb.png',
      industry: '/attached_assets/generated_images/Classic_meets_modern_Indian_cars_2c8c3217.png'
    };
    return images[category as keyof typeof images] || images.market;
  };

  // Determine if article should have video content
  const hasVideoContent = (index: number): boolean => {
    return index % 3 === 0; // Every 3rd article has video content
  };

  const handleLike = (articleIndex: number) => {
    const newLiked = new Set(likedArticles);
    if (newLiked.has(articleIndex)) {
      newLiked.delete(articleIndex);
    } else {
      newLiked.add(articleIndex);
    }
    setLikedArticles(newLiked);
  };

  const handleShare = (article: NewsArticle) => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.summary,
        url: window.location.href
      });
    }
  };

  const getRelevanceBadge = (relevance: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200',
      low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200'
    };
    return colors[relevance as keyof typeof colors] || colors.medium;
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      market: BarChart3,
      pricing: TrendingUp,
      industry: Building2,
      technology: Cpu,
      regulatory: Scale
    };
    const IconComponent = icons[category as keyof typeof icons] || Newspaper;
    return <IconComponent className="h-4 w-4" />;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      market: 'text-blue-600 dark:text-blue-400',
      pricing: 'text-green-600 dark:text-green-400',
      industry: 'text-purple-600 dark:text-purple-400',
      technology: 'text-orange-600 dark:text-orange-400',
      regulatory: 'text-red-600 dark:text-red-400'
    };
    return colors[category as keyof typeof colors] || 'text-gray-600 dark:text-gray-400';
  };

  const getImpactColor = (impact: string) => {
    if (impact === 'positive') return 'text-green-600 dark:text-green-400';
    if (impact === 'negative') return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getModeButtonClass = (mode: string, isActive: boolean) => {
    const colors = {
      trending: isActive ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20',
      latest: isActive ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20',
      discussions: isActive ? 'bg-green-500 hover:bg-green-600 text-white' : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
    };
    return colors[mode as keyof typeof colors] || colors.latest;
  };

  return (
    <div className="container mx-auto px-4 py-8" data-testid="throttle-talk-page">
      {/* Enhanced Header with Personality */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <Zap className="h-10 w-10 text-orange-500" />
            <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full animate-pulse flex items-center justify-center">
              <div className="h-2 w-2 bg-white rounded-full"></div>
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent" data-testid="text-throttle-talk-title">
              Throttle Talk
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg font-medium italic">
              Where automotive passion meets intelligent insight
            </p>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-50 via-red-50 to-pink-50 dark:from-orange-900/10 dark:via-red-900/10 dark:to-pink-900/10 p-6 rounded-xl border-l-4 border-orange-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10">
            <Zap className="h-32 w-32 text-orange-500" />
          </div>
          <div className="relative">
            <p className="text-gray-700 dark:text-gray-300 text-lg font-semibold mb-4" data-testid="text-throttle-talk-tagline">
              🏎️ Your daily dose of automotive wit, wisdom, and market intelligence - served with personality!
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                <Users className="h-4 w-4" />
                <span className="font-medium">25K+ Enthusiasts</span>
              </div>
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <MessageCircle className="h-4 w-4" />
                <span className="font-medium">1.2K+ Discussions</span>
              </div>
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <TrendingUp className="h-4 w-4" />
                <span className="font-medium">Live Intelligence</span>
              </div>
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Eye className="h-4 w-4" />
                <span className="font-medium">50K+ Views/Day</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Engagement Mode Toggle */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-3 mb-6">
          {engagementModes.map((mode) => (
            <Button
              key={mode.id}
              variant={engagementMode === mode.id ? "default" : "outline"}
              size="lg"
              onClick={() => setEngagementMode(mode.id as any)}
              className={cn(
                "flex items-center gap-3 transition-all duration-200 px-6 py-3 rounded-xl font-semibold",
                getModeButtonClass(mode.color, engagementMode === mode.id)
              )}
              data-testid={`button-mode-${mode.id}`}
            >
              {mode.icon}
              {mode.name}
              {engagementMode === mode.id && <Badge variant="secondary" className="ml-2 text-xs">ACTIVE</Badge>}
            </Button>
          ))}
        </div>
      </div>

      <Tabs defaultValue="news" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-14 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl" data-testid="tabs-throttle-sections">
          <TabsTrigger value="news" className="data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg font-semibold" data-testid="tab-latest-stories">
            🔥 Hot Stories
          </TabsTrigger>
          <TabsTrigger value="market" className="data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg font-semibold" data-testid="tab-market-pulse">
            📊 Market Pulse
          </TabsTrigger>
          <TabsTrigger value="brands" className="data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg font-semibold" data-testid="tab-brand-wars">
            🏆 Brand Wars
          </TabsTrigger>
        </TabsList>

        {/* Latest Stories with Engagement */}
        <TabsContent value="news" className="space-y-6 mt-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100" data-testid="text-stories-heading">
                {engagementMode === 'trending' && '🔥 Trending Now'}
                {engagementMode === 'latest' && '⚡ Fresh Off The Press'}
                {engagementMode === 'discussions' && '💬 Community Hotspots'}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                {engagementMode === 'trending' && 'What\'s got everyone talking'}
                {engagementMode === 'latest' && 'The newest automotive intelligence'}
                {engagementMode === 'discussions' && 'Where the community debates'}
              </p>
            </div>
            <Button 
              onClick={() => refetchNews()} 
              variant="outline" 
              size="lg"
              className="flex items-center gap-2 hover:bg-orange-50 dark:hover:bg-orange-900/20"
              data-testid="button-refresh-stories"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Feed
            </Button>
          </div>

          {newsLoading ? (
            <div className="grid gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mt-2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-8" data-testid="stories-list">
              {/* Hero Feature Story */}
              {(newsData as any)?.articles?.length > 0 && (
                <div className="relative rounded-xl overflow-hidden bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 text-white">
                  <img 
                    src="/attached_assets/generated_images/Dynamic_sports_car_mountain_road_5267e5a6.png"
                    alt="Hero Story"
                    className="absolute inset-0 w-full h-full object-cover opacity-30"
                  />
                  <div className="relative p-8 z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <Badge className="bg-white/20 text-white font-bold px-3 py-1">
                        🔥 TRENDING NOW
                      </Badge>
                      <Badge className="bg-red-500 text-white font-bold px-3 py-1">
                        BREAKING
                      </Badge>
                    </div>
                    <h2 className="text-3xl font-bold mb-4 leading-tight">
                      {(newsData as any).articles[0].title}
                    </h2>
                    <p className="text-lg opacity-90 mb-6 line-clamp-2">
                      {(newsData as any).articles[0].summary}
                    </p>
                    <div className="flex items-center gap-4 text-sm opacity-80">
                      <span>🔥 {Math.floor(Math.random() * 50) + 100}K views</span>
                      <span>💬 {Math.floor(Math.random() * 200) + 50} comments</span>
                      <span>⚡ Just now</span>
                    </div>
                  </div>
                </div>
              )}
              {(newsData as any)?.articles?.map((article: NewsArticle, index: number) => {
                const stats = getEngagementStats(index);
                const isLiked = likedArticles.has(index);
                const articleImage = getArticleImage(article.category, index);
                const hasVideo = hasVideoContent(index);
                return (
                  <Card key={index} className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-r from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
                    
                    {/* Featured Image/Video */}
                    <div className="relative h-48 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
                      <img 
                        src={articleImage} 
                        alt={article.title}
                        className="w-full h-full object-cover"
                        data-testid={`img-story-featured-${index}`}
                      />
                      {hasVideo && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <div className="bg-red-600 hover:bg-red-700 rounded-full p-4 cursor-pointer transition-colors group">
                            <div className="w-6 h-6 border-l-8 border-l-white border-y-4 border-y-transparent ml-1"></div>
                          </div>
                          <Badge className="absolute top-3 left-3 bg-red-600 text-white font-semibold">
                            VIDEO
                          </Badge>
                        </div>
                      )}
                      <div className="absolute bottom-3 left-3">
                        <Badge className={cn("text-xs font-semibold border-white/20",
                          article.category === 'pricing' && 'bg-green-500/90 text-white',
                          article.category === 'market' && 'bg-blue-500/90 text-white',
                          article.category === 'technology' && 'bg-orange-500/90 text-white',
                          article.category === 'regulatory' && 'bg-red-500/90 text-white',
                          article.category === 'industry' && 'bg-purple-500/90 text-white'
                        )}>
                          {article.category.toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <div className={cn("p-2 rounded-full", 
                              article.category === 'pricing' && 'bg-green-100 dark:bg-green-900/20',
                              article.category === 'market' && 'bg-blue-100 dark:bg-blue-900/20',
                              article.category === 'technology' && 'bg-orange-100 dark:bg-orange-900/20',
                              article.category === 'regulatory' && 'bg-red-100 dark:bg-red-900/20',
                              article.category === 'industry' && 'bg-purple-100 dark:bg-purple-900/20'
                            )}>
                              {getCategoryIcon(article.category)}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <span className={cn("font-semibold capitalize", getCategoryColor(article.category))} data-testid={`text-story-category-${index}`}>
                                {article.category}
                              </span>
                              <span>•</span>
                              <Calendar className="h-3 w-3" />
                              <span data-testid={`text-story-date-${index}`}>
                                {new Date(article.publishedAt).toLocaleDateString()}
                              </span>
                              <span>•</span>
                              <span className="font-medium" data-testid={`text-story-source-${index}`}>{article.source}</span>
                            </div>
                          </div>
                          <CardTitle className="text-xl font-bold leading-tight mb-3 hover:text-orange-600 dark:hover:text-orange-400 transition-colors cursor-pointer" data-testid={`text-story-title-${index}`}>
                            {article.title}
                          </CardTitle>
                        </div>
                        <Badge 
                          className={cn("text-xs font-semibold px-3 py-1 rounded-full border", getRelevanceBadge(article.relevance))}
                          data-testid={`badge-story-relevance-${index}`}
                        >
                          {article.relevance} impact
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <CardDescription className="text-base leading-relaxed mb-4 text-gray-700 dark:text-gray-300" data-testid={`text-story-summary-${index}`}>
                        {article.summary}
                      </CardDescription>
                      
                      <div className="flex items-center gap-3 text-sm mb-4">
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                        <span className="text-blue-600 dark:text-blue-400 font-medium" data-testid={`text-story-impact-${index}`}>
                          {article.impact}
                        </span>
                      </div>

                      {/* Engagement Stats */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-6">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLike(index)}
                            className={cn(
                              "flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors",
                              isLiked && "text-red-500"
                            )}
                            data-testid={`button-like-story-${index}`}
                          >
                            <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
                            <span className="font-medium">{stats.likes + (isLiked ? 1 : 0)}</span>
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            data-testid={`button-comment-story-${index}`}
                          >
                            <MessageCircle className="h-4 w-4" />
                            <span className="font-medium">{stats.comments}</span>
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShare(article)}
                            className="flex items-center gap-2 hover:bg-green-50 dark:hover:bg-green-900/20"
                            data-testid={`button-share-story-${index}`}
                          >
                            <Share2 className="h-4 w-4" />
                            <span className="font-medium">{stats.shares}</span>
                          </Button>
                        </div>
                        
                        <div className="flex items-center gap-2 text-gray-500">
                          <Eye className="h-4 w-4" />
                          <span className="text-sm font-medium" data-testid={`text-story-views-${index}`}>
                            {stats.views.toLocaleString()} views
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Market Pulse */}
        <TabsContent value="market" className="space-y-6 mt-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2" data-testid="text-market-heading">
              📊 Market Pulse
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Real-time intelligence on what's moving the Indian automotive market
            </p>
          </div>

          {marketLoading ? (
            <div className="grid gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-6" data-testid="market-insights-list">
              {(marketInsights as any)?.insights?.map((insight: MarketInsight, index: number) => (
                <Card key={index} className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-bold" data-testid={`text-insight-topic-${index}`}>
                        {insight.topic}
                      </CardTitle>
                      <div className="flex items-center gap-3">
                        <Badge 
                          className={cn("text-sm font-semibold px-3 py-1 rounded-full",
                            insight.marketImpact === 'positive' && 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                            insight.marketImpact === 'negative' && 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
                            insight.marketImpact === 'neutral' && 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                          )}
                          data-testid={`badge-market-impact-${index}`}
                        >
                          {insight.marketImpact}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-400">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span data-testid={`text-confidence-${index}`}>
                            {Math.round(insight.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed mb-4 text-gray-700 dark:text-gray-300" data-testid={`text-insight-description-${index}`}>
                      {insight.insight}
                    </CardDescription>
                    {insight.dataPoints.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {insight.dataPoints.map((point, i) => (
                          <Badge 
                            key={i} 
                            variant="outline" 
                            className="text-sm px-3 py-1 rounded-full"
                            data-testid={`badge-data-point-${index}-${i}`}
                          >
                            {point}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Brand Wars */}
        <TabsContent value="brands" className="space-y-6 mt-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2" data-testid="text-brands-heading">
              🏆 Brand Wars
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg mb-6">
              Who's winning the battle for Indian hearts (and wallets)?
            </p>
            <div className="flex flex-wrap gap-3">
              {brands.map((brand) => (
                <Button
                  key={brand}
                  variant={selectedBrand === brand ? "default" : "outline"}
                  size="lg"
                  onClick={() => setSelectedBrand(brand)}
                  className={cn(
                    "px-6 py-3 rounded-xl font-semibold transition-all duration-200",
                    selectedBrand === brand && "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                  )}
                  data-testid={`button-brand-${brand.replace(' ', '-').toLowerCase()}`}
                >
                  {brand}
                  {selectedBrand === brand && <Badge variant="secondary" className="ml-2 text-xs">ANALYZING</Badge>}
                </Button>
              ))}
            </div>
          </div>

          {brandLoading ? (
            <div className="grid gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-6" data-testid="brand-insights-list">
              <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/10 dark:via-purple-900/10 dark:to-pink-900/10 rounded-xl p-6 border-l-4 border-blue-500">
                <h3 className="font-bold text-xl mb-2" data-testid="text-selected-brand">
                  🎯 {selectedBrand} Battle Analysis
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Deep dive into {selectedBrand}'s performance, positioning, and market strategy
                </p>
              </div>

              {(brandInsights as any)?.insights?.map((insight: MarketInsight, index: number) => (
                <Card key={index} className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-bold" data-testid={`text-brand-insight-topic-${index}`}>
                        {insight.topic}
                      </CardTitle>
                      <div className="flex items-center gap-3">
                        <Badge 
                          className={cn("text-sm font-semibold px-3 py-1 rounded-full",
                            insight.marketImpact === 'positive' && 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                            insight.marketImpact === 'negative' && 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
                            insight.marketImpact === 'neutral' && 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                          )}
                          data-testid={`badge-brand-impact-${index}`}
                        >
                          {insight.marketImpact}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-400">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span data-testid={`text-brand-confidence-${index}`}>
                            {Math.round(insight.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed mb-4 text-gray-700 dark:text-gray-300" data-testid={`text-brand-insight-description-${index}`}>
                      {insight.insight}
                    </CardDescription>
                    {insight.dataPoints.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {insight.dataPoints.map((point, i) => (
                          <Badge 
                            key={i} 
                            variant="outline" 
                            className="text-sm px-3 py-1 rounded-full"
                            data-testid={`badge-brand-data-point-${index}-${i}`}
                          >
                            {point}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}