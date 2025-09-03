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
import { apiRequest } from "@/lib/queryClient";
import SocialShare from "@/components/social-share";

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
      return apiRequest('/api/blog/generate', {
        method: 'POST',
        body: JSON.stringify({ topic, category: 'automotive' }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog/articles'] });
    },
  });

  // Refresh articles mutation
  const refreshArticles = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/blog/refresh', {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog/articles'] });
    },
  });

  const filteredArticles = articles.filter((article: BlogArticle) => {
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
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-blog-title">
            <Car className="inline w-8 h-8 mr-2" />
            Pre-owned Cars News
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Stay updated with the latest automotive insights, market trends, and expert advice for smart car buying and selling decisions.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Badge variant="outline" className="text-blue-600">
              #themobilityhub
            </Badge>
            <Badge variant="outline" className="text-green-600">
              #automotiveindia
            </Badge>
            <Badge variant="outline" className="text-purple-600">
              #preownedcars
            </Badge>
          </div>
        </div>

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
                  <div key={i} className="bg-card rounded-lg p-6 animate-pulse">
                    <div className="h-4 bg-muted rounded mb-4"></div>
                    <div className="h-20 bg-muted rounded mb-4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredArticles.map((article: BlogArticle) => (
                  <article 
                    key={article.id} 
                    className="bg-card rounded-lg p-6 border hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setSelectedArticle(article)}
                    data-testid={`card-article-${article.id}`}
                  >
                    {article.image && (
                      <img 
                        src={article.image} 
                        alt={article.title}
                        className="w-full h-32 object-cover rounded mb-4"
                        data-testid={`img-article-${article.id}`}
                      />
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
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trending Topics */}
            <div className="bg-card rounded-lg p-6 border">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Trending Topics
              </h3>
              <div className="space-y-2">
                {trendingTopics.slice(0, 5).map((topic: string, index: number) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-left h-auto p-2"
                    onClick={() => handleGenerateArticle(topic)}
                    disabled={generateArticle.isPending}
                    data-testid={`button-topic-${index}`}
                  >
                    <Zap className="w-3 h-3 mr-2 flex-shrink-0" />
                    <span className="line-clamp-2">{topic}</span>
                  </Button>
                ))}
              </div>
            </div>

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