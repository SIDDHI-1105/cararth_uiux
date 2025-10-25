import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Newspaper, 
  TrendingUp, 
  MessageSquare, 
  BarChart3,
  Users,
  Calendar,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface ThrottleTalkMegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ThrottleTalkMegaMenu({ isOpen, onClose }: ThrottleTalkMegaMenuProps) {
  // Fetch featured articles
  const { data: articlesData } = useQuery({
    queryKey: ['/api/community/posts'],
    enabled: isOpen,
  });

  const featuredArticles = articlesData?.posts?.slice(0, 3) || [];

  const categories = [
    {
      icon: TrendingUp,
      title: "Market Intelligence",
      description: "AI-powered insights & trends",
      href: "/news?tab=intelligence",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
    },
    {
      icon: MessageSquare,
      title: "Community",
      description: "Stories & discussions",
      href: "/news?tab=community",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/20",
    },
    {
      icon: BarChart3,
      title: "OEM Analytics",
      description: "Sales data & benchmarks",
      href: "/news?tab=intelligence",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
    },
    {
      icon: Users,
      title: "Road Tales",
      description: "Owner experiences",
      href: "/news?tab=community",
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
    },
  ];

  if (!isOpen) return null;

  return (
    <div 
      className="absolute left-0 right-0 top-full mt-2 z-50"
      onMouseLeave={onClose}
      data-testid="mega-menu-throttle-talk"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="overflow-hidden shadow-2xl border-2 bg-background/95 backdrop-blur-sm">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
            {/* Categories Section */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Newspaper className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Explore Throttle Talk</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categories.map((category) => (
                  <Link 
                    key={category.title} 
                    href={category.href}
                    onClick={onClose}
                  >
                    <Button
                      variant="ghost"
                      className="w-full h-auto p-4 justify-start hover:bg-accent/50 transition-all group"
                      data-testid={`mega-menu-category-${category.title.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <div className={cn(
                        "p-2 rounded-lg mr-3 transition-transform group-hover:scale-110",
                        category.bgColor
                      )}>
                        <category.icon className={cn("h-5 w-5", category.color)} />
                      </div>
                      <div className="text-left flex-1">
                        <div className="font-semibold text-sm">{category.title}</div>
                        <div className="text-xs text-muted-foreground">{category.description}</div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Button>
                  </Link>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/news?tab=community" onClick={onClose}>
                    <Button variant="outline" size="sm" className="w-full" data-testid="button-submit-story">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Submit Your Story
                    </Button>
                  </Link>
                  <Link href="/news?tab=community" onClick={onClose}>
                    <Button variant="outline" size="sm" className="w-full" data-testid="button-join-newsletter">
                      <Calendar className="h-4 w-4 mr-2" />
                      Join Newsletter
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Featured Articles Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Featured Articles</h3>
              </div>
              <div className="space-y-3">
                {featuredArticles.length > 0 ? (
                  featuredArticles.map((article: any) => (
                    <Link 
                      key={article.id} 
                      href={`/news/${article.id}`}
                      onClick={onClose}
                    >
                      <div 
                        className="p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors cursor-pointer group"
                        data-testid={`mega-menu-article-${article.id}`}
                      >
                        <div className="flex items-start gap-3">
                          {article.coverImage && (
                            <img 
                              src={article.coverImage} 
                              alt={article.title}
                              className="w-16 h-16 rounded object-cover flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                              {article.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {article.category}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {article.views || 0} views
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    <Newspaper className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p>Loading articles...</p>
                  </div>
                )}
              </div>

              <Link href="/news" onClick={onClose}>
                <Button variant="link" size="sm" className="w-full mt-2" data-testid="button-view-all-articles">
                  View All Articles
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
