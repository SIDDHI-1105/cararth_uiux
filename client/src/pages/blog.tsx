import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  Clock, 
  User, 
  Search, 
  RefreshCw, 
  ExternalLink,
  BookOpen,
  TrendingUp,
  Car,
  Zap
} from "lucide-react";
import SocialShare from "@/components/social-share";
import VideoThumbnail from "@/components/video-thumbnail";
import { QuickTipCard, ComparisonTable, PriceCalculator, NewsBrief, MarketChart } from "@/components/content-types";

interface BlogArticle {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string[];
  author: string;
  publishedAt: string;
  readTime: number;
  sources: string[];
  image?: string;
}

export default function BlogPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedArticle, setSelectedArticle] = useState<BlogArticle | null>(null);
  const queryClient = useQueryClient();

  // Fetch blog articles
  const { data: articles = [], isLoading } = useQuery({
    queryKey: ['/api/blog/articles'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch trending topics
  const { data: trendingTopics = [] } = useQuery({
    queryKey: ['/api/blog/trending-topics'],
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  // Generate new article mutation
  const generateArticle = useMutation({
    mutationFn: async (topic: string) => {
      return fetch('/api/blog/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, category: 'automotive' }),
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog/articles'] });
    },
  });

  // Refresh articles mutation
  const refreshArticles = useMutation({
    mutationFn: async () => {
      return fetch('/api/blog/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog/articles'] });
    },
  });

  const filteredArticles = (articles as BlogArticle[]).filter((article: BlogArticle) => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleGenerateArticle = (topic: string) => {
    generateArticle.mutate(topic);
  };

  if (selectedArticle) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-6">
          <Button 
            variant="outline" 
            onClick={() => setSelectedArticle(null)}
            className="mb-6"
            data-testid="button-back-to-blog"
          >
            ← Back to Blog
          </Button>
          
          <article className="prose prose-lg max-w-none">
            <header className="mb-8">
              <h1 className="text-4xl font-bold mb-4" data-testid="text-article-title">
                {selectedArticle.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-4">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{selectedArticle.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(selectedArticle.publishedAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{selectedArticle.readTime} min read</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedArticle.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" data-testid={`badge-tag-${index}`}>
                    {tag}
                  </Badge>
                ))}
              </div>
              
              <div className="flex items-center gap-4 mb-6">
                <SocialShare 
                  url={`/blog/${selectedArticle.id}`}
                  title={selectedArticle.title}
                  description={selectedArticle.excerpt}
                  imageUrl={selectedArticle.image}
                />
              </div>
            </header>
            
            {selectedArticle.image && (
              <img 
                src={selectedArticle.image} 
                alt={selectedArticle.title}
                className="w-full h-64 object-cover rounded-lg mb-8"
                data-testid="img-article-hero"
              />
            )}
            
            <div 
              className="article-content"
              dangerouslySetInnerHTML={{ 
                __html: selectedArticle.content.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              }}
              data-testid="content-article-body"
            />
            
            {selectedArticle.sources.length > 0 && (
              <div className="mt-8 p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Sources:</h3>
                <ul className="space-y-1">
                  {selectedArticle.sources.map((source, index) => (
                    <li key={index}>
                      <a 
                        href={source} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                        data-testid={`link-source-${index}`}
                      >
                        <ExternalLink className="w-3 h-3" />
                        {source}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-blog-title">
            <Car className="inline w-8 h-8 mr-2" />
            Latest Automotive News
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Real-time updates on automotive trends, market analysis, and expert insights for smart car buying decisions in India.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Badge variant="outline" className="text-blue-600">
              #live-updates
            </Badge>
            <Badge variant="outline" className="text-green-600">
              #market-trends
            </Badge>
            <Badge variant="outline" className="text-purple-600">
              #india-automotive
            </Badge>
          </div>
        </div>

        {/* Trending Topics Section */}
        {trendingTopics.length > 0 && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 border">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">🔥 Trending Now</h2>
                <Badge variant="secondary" className="ml-2">Live</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {trendingTopics.slice(0, 8).map((topic: string, index: number) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateArticle(topic)}
                    disabled={generateArticle.isPending}
                    className="hover:bg-blue-50 border-blue-200 text-blue-700 hover:text-blue-800"
                    data-testid={`button-trending-${index}`}
                  >
                    <Zap className="w-3 h-3 mr-1" />
                    {topic}
                  </Button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                💡 Click any topic to generate fresh automotive insights instantly
              </p>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-articles"
              />
            </div>
          </div>
          
          <Button
            onClick={() => refreshArticles.mutate()}
            disabled={refreshArticles.isPending}
            variant="outline"
            data-testid="button-refresh-articles"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshArticles.isPending ? 'animate-spin' : ''}`} />
            Refresh Content
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-card rounded-lg p-6 border overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer"></div>
                    <div className="h-32 bg-gradient-to-r from-muted to-muted/50 rounded mb-4 animate-pulse"></div>
                    <div className="h-4 bg-gradient-to-r from-muted to-muted/50 rounded mb-2 animate-pulse"></div>
                    <div className="h-4 bg-gradient-to-r from-muted to-muted/50 rounded mb-4 w-3/4 animate-pulse"></div>
                    <div className="h-3 bg-gradient-to-r from-muted to-muted/50 rounded w-1/2 animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredArticles.map((article: BlogArticle) => (
                  <article 
                    key={article.id} 
                    className="bg-card rounded-lg p-6 border hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer group overflow-hidden relative"
                    onClick={() => setSelectedArticle(article)}
                    data-testid={`card-article-${article.id}`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10">
                    {article.image && (
                      <div className="relative overflow-hidden rounded mb-4 group-hover:scale-105 transition-transform duration-300">
                        <img 
                          src={article.image} 
                          alt={article.title}
                          className="w-full h-32 object-cover"
                          data-testid={`img-article-${article.id}`}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute top-2 right-2 bg-white/90 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <BookOpen className="w-3 h-3 text-blue-600" />
                        </div>
                      </div>
                    )}
                    
                    <h2 className="text-xl font-bold mb-3 line-clamp-2" data-testid={`text-title-${article.id}`}>
                      {article.title}
                    </h2>
                    
                    <p className="text-muted-foreground mb-4 line-clamp-3" data-testid={`text-excerpt-${article.id}`}>
                      {article.excerpt}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(article.publishedAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {article.readTime} min
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {article.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs hover:bg-blue-100 transition-colors">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Interactive Price Calculator */}
            <PriceCalculator 
              title="Quick Price Estimator"
              basePrices={{
                'Maruti Alto': 350000,
                'Hyundai i10': 450000,
                'Tata Tiago': 420000,
                'Honda City': 650000,
                'Maruti Swift': 480000
              }}
            />
            {/* Trending Topics */}
            <div className="bg-card rounded-lg p-6 border">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Trending Topics
              </h3>
              <div className="space-y-2">
                {(trendingTopics as string[]).slice(0, 5).map((topic: string, index: number) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-left h-auto p-2 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 transition-all duration-300 group"
                    onClick={() => handleGenerateArticle(topic)}
                    disabled={generateArticle.isPending}
                    data-testid={`button-topic-${index}`}
                  >
                    <Zap className="w-3 h-3 mr-2 flex-shrink-0 group-hover:text-blue-600 group-hover:animate-pulse" />
                    <span className="line-clamp-2">{topic}</span>
                    <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-1 h-1 bg-blue-500 rounded-full animate-ping"></div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Market Data Visualization */}
            <MarketChart 
              title="Popular Car Brands"
              data={[
                { label: 'Maruti', value: 41 },
                { label: 'Hyundai', value: 17 },
                { label: 'Tata', value: 14 },
                { label: 'Mahindra', value: 9 },
                { label: 'Others', value: 19 }
              ]}
            />
            
            {/* Quick Tips */}
            <QuickTipCard
              title="Car Buying Tips"
              tips={[
                'Check vehicle history and service records',
                'Inspect for accident damage and rust',
                'Verify ownership documents',
                'Test drive in different conditions',
                'Compare prices across platforms'
              ]}
              variant="success"
            />
            
            {/* Latest News Briefs */}
            <NewsBrief 
              items={[
                {
                  type: 'price',
                  title: 'Used car prices drop 12% in Q1',
                  summary: 'Best time to buy in 3 years',
                  date: '2 days ago'
                },
                {
                  type: 'launch',
                  title: 'New Maruti Fronx bookings open',
                  summary: 'Starting at ₹7.46 lakhs',
                  date: '1 day ago'
                },
                {
                  type: 'policy',
                  title: 'New emission norms delayed',
                  summary: 'BS-VII implementation postponed',
                  date: '3 days ago'
                }
              ]}
            />

            {/* Generate Custom Article */}
            <div className="bg-card rounded-lg p-6 border">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Generate Article
              </h3>
              <div className="space-y-3">
                <Input
                  placeholder="Enter topic..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const target = e.target as HTMLInputElement;
                      if (target.value.trim()) {
                        handleGenerateArticle(target.value.trim());
                        target.value = '';
                      }
                    }
                  }}
                  data-testid="input-custom-topic"
                />
                <p className="text-xs text-muted-foreground">
                  Press Enter to generate a fresh article on any automotive topic
                </p>
              </div>
            </div>

            {/* Categories */}
            <div className="bg-card rounded-lg p-6 border">
              <h3 className="font-bold mb-4">Categories</h3>
              <div className="space-y-1">
                {['all', 'market-trends', 'buying-guides', 'technology', 'policy'].map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "ghost"}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setSelectedCategory(category)}
                    data-testid={`button-category-${category}`}
                  >
                    {category.replace('-', ' ').toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}