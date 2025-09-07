import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Newspaper, TrendingUp, Building2, MapPin, Calendar, Star, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewsArticle {
  title: string;
  summary: string;
  source: string;
  relevance: 'high' | 'medium' | 'low';
  category: 'market' | 'pricing' | 'industry' | 'technology' | 'regulatory';
  publishedAt: string;
  impact: string;
}

interface MarketInsight {
  topic: string;
  insight: string;
  dataPoints: string[];
  marketImpact: 'positive' | 'negative' | 'neutral';
  confidence: number;
}

export default function NewsPage() {
  const [selectedBrand, setSelectedBrand] = useState('Maruti Suzuki');

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

  const getRelevanceBadge = (relevance: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    };
    return colors[relevance as keyof typeof colors] || colors.medium;
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      market: BarChart3,
      pricing: TrendingUp,
      industry: Building2,
      technology: Star,
      regulatory: MapPin
    };
    const IconComponent = icons[category as keyof typeof icons] || Newspaper;
    return <IconComponent className="h-4 w-4" />;
  };

  const getImpactColor = (impact: string) => {
    if (impact === 'positive') return 'text-green-600 dark:text-green-400';
    if (impact === 'negative') return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className="container mx-auto px-4 py-8" data-testid="news-page">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Newspaper className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Automotive Market Intelligence</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-300" data-testid="text-page-description">
          Real-time news, market insights, and price intelligence powered by advanced market analysis
        </p>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline" className="text-xs">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Live Intelligence
          </Badge>
          <Badge variant="outline" className="text-xs">
            Updated {(newsData as any)?.meta?.lastUpdated ? new Date((newsData as any).meta.lastUpdated).toLocaleTimeString() : 'recently'}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="news" className="w-full">
        <TabsList className="grid w-full grid-cols-3" data-testid="tabs-news-sections">
          <TabsTrigger value="news" data-testid="tab-latest-news">Latest News</TabsTrigger>
          <TabsTrigger value="market" data-testid="tab-market-insights">Market Insights</TabsTrigger>
          <TabsTrigger value="brands" data-testid="tab-brand-analysis">Brand Analysis</TabsTrigger>
        </TabsList>

        {/* Latest News */}
        <TabsContent value="news" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold" data-testid="text-news-heading">Latest Automotive News</h2>
            <Button 
              onClick={() => refetchNews()} 
              variant="outline" 
              size="sm"
              data-testid="button-refresh-news"
            >
              Refresh
            </Button>
          </div>

          {newsLoading ? (
            <div className="grid gap-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mt-2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4" data-testid="news-articles-list">
              {(newsData as any)?.articles?.map((article: NewsArticle, index: number) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-lg leading-tight mb-2" data-testid={`text-article-title-${index}`}>
                          {article.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          {getCategoryIcon(article.category)}
                          <span data-testid={`text-article-category-${index}`}>{article.category}</span>
                          <span>•</span>
                          <Calendar className="h-3 w-3" />
                          <span data-testid={`text-article-date-${index}`}>
                            {new Date(article.publishedAt).toLocaleDateString()}
                          </span>
                          <span>•</span>
                          <span data-testid={`text-article-source-${index}`}>{article.source}</span>
                        </div>
                      </div>
                      <Badge 
                        className={cn("text-xs", getRelevanceBadge(article.relevance))}
                        data-testid={`badge-relevance-${index}`}
                      >
                        {article.relevance}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm mb-3" data-testid={`text-article-summary-${index}`}>
                      {article.summary}
                    </CardDescription>
                    <div className="flex items-center gap-2 text-xs">
                      <TrendingUp className="h-3 w-3 text-blue-500" />
                      <span className="text-blue-600 dark:text-blue-400" data-testid={`text-article-impact-${index}`}>
                        {article.impact}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Market Insights */}
        <TabsContent value="market" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4" data-testid="text-market-heading">Market Intelligence</h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Comprehensive analysis of the Indian used car market trends and dynamics
            </p>
          </div>

          {marketLoading ? (
            <div className="grid gap-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4" data-testid="market-insights-list">
              {(marketInsights as any)?.insights?.map((insight: MarketInsight, index: number) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg" data-testid={`text-insight-topic-${index}`}>
                        {insight.topic}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge 
                          className={cn("text-xs", getImpactColor(insight.marketImpact))}
                          data-testid={`badge-market-impact-${index}`}
                        >
                          {insight.marketImpact}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Star className="h-3 w-3" />
                          <span data-testid={`text-confidence-${index}`}>
                            {Math.round(insight.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-3" data-testid={`text-insight-description-${index}`}>
                      {insight.insight}
                    </CardDescription>
                    {insight.dataPoints.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {insight.dataPoints.map((point, i) => (
                          <Badge 
                            key={i} 
                            variant="outline" 
                            className="text-xs"
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

        {/* Brand Analysis */}
        <TabsContent value="brands" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4" data-testid="text-brands-heading">Brand Market Analysis</h2>
            <div className="flex flex-wrap gap-2 mb-6">
              {brands.map((brand) => (
                <Button
                  key={brand}
                  variant={selectedBrand === brand ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedBrand(brand)}
                  data-testid={`button-brand-${brand.replace(' ', '-').toLowerCase()}`}
                >
                  {brand}
                </Button>
              ))}
            </div>
          </div>

          {brandLoading ? (
            <div className="grid gap-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4" data-testid="brand-insights-list">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-lg mb-2" data-testid="text-selected-brand">
                  {selectedBrand} Market Intelligence
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Comprehensive analysis of {selectedBrand}'s position in the used car market
                </p>
              </div>

              {(brandInsights as any)?.insights?.map((insight: MarketInsight, index: number) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg" data-testid={`text-brand-insight-topic-${index}`}>
                        {insight.topic}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge 
                          className={cn("text-xs", getImpactColor(insight.marketImpact))}
                          data-testid={`badge-brand-impact-${index}`}
                        >
                          {insight.marketImpact}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Star className="h-3 w-3" />
                          <span data-testid={`text-brand-confidence-${index}`}>
                            {Math.round(insight.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-3" data-testid={`text-brand-insight-description-${index}`}>
                      {insight.insight}
                    </CardDescription>
                    {insight.dataPoints.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {insight.dataPoints.map((point, i) => (
                          <Badge 
                            key={i} 
                            variant="outline" 
                            className="text-xs"
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