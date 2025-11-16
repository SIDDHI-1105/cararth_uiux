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
  Sparkles,
  BookOpen,
  LineChart,
  MapPin
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

  const guides = [
    {
      icon: Sparkles,
      title: "AI Verification Guide",
      description: "Ultimate trust guide",
      href: "/guides/ai-verified-used-car-trust-india",
      color: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/20",
    },
    {
      icon: BookOpen,
      title: "Best Used Cars 2025",
      description: "Complete buyer's guide",
      href: "/guides/best-used-cars-india-2025",
      color: "text-rose-600 dark:text-rose-400",
      bgColor: "bg-rose-50 dark:bg-rose-950/20",
    },
    {
      icon: LineChart,
      title: "Market Analysis 2025",
      description: "Growth trends to 2030",
      href: "/guides/used-car-market-india-2025",
      color: "text-teal-600 dark:text-teal-400",
      bgColor: "bg-teal-50 dark:bg-teal-950/20",
    },
    {
      icon: MapPin,
      title: "Hyderabad Guide 2025",
      description: "6,500+ local listings",
      href: "/guides/used-cars-hyderabad-2025",
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-950/20",
    },
  ];

  const sections = [
    {
      icon: TrendingUp,
      title: "Market Intelligence",
      description: "AI insights & trends",
      href: "/news?tab=intelligence",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
    },
    {
      icon: MessageSquare,
      title: "Community Stories",
      description: "Owner experiences",
      href: "/news?tab=community",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/20",
    },
  ];

  if (!isOpen) return null;

  return (
    <div 
      className="absolute left-0 w-screen top-full mt-2 z-[100]"
      style={{ left: '50%', transform: 'translateX(-50%)' }}
      onMouseLeave={onClose}
      data-testid="mega-menu-throttle-talk"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <Card className="overflow-hidden shadow-2xl border-2 bg-background backdrop-blur-sm">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 p-4 sm:p-6">
            {/* Left Section */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Guides Section */}
              <div>
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <h3 className="font-semibold text-base sm:text-lg">Buyer's Guides</h3>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:gap-3">
                  {guides.map((guide) => (
                    <Link 
                      key={guide.title} 
                      href={guide.href}
                      onClick={onClose}
                    >
                      <Button
                        variant="ghost"
                        className="w-full h-auto min-h-[44px] p-3 sm:p-4 justify-start hover:bg-accent/50 transition-all group"
                        data-testid={`mega-menu-guide-${guide.title.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <div className={cn(
                          "p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3 transition-transform group-hover:scale-110",
                          guide.bgColor
                        )}>
                          <guide.icon className={cn("h-4 w-4 sm:h-5 sm:w-5", guide.color)} />
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <div className="font-semibold text-xs sm:text-sm truncate">{guide.title}</div>
                          <div className="text-[10px] sm:text-xs text-muted-foreground truncate">{guide.description}</div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </Button>
                    </Link>
                  ))}
                </div>
              </div>

              {/* News Sections */}
              <div>
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <Newspaper className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <h3 className="font-semibold text-base sm:text-lg">News & Insights</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {sections.map((section) => (
                    <Link 
                      key={section.title} 
                      href={section.href}
                      onClick={onClose}
                    >
                      <Button
                        variant="ghost"
                        className="w-full h-auto min-h-[44px] p-3 sm:p-4 justify-start hover:bg-accent/50 transition-all group"
                        data-testid={`mega-menu-section-${section.title.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <div className={cn(
                          "p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3 transition-transform group-hover:scale-110",
                          section.bgColor
                        )}>
                          <section.icon className={cn("h-4 w-4 sm:h-5 sm:w-5", section.color)} />
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <div className="font-semibold text-xs sm:text-sm truncate">{section.title}</div>
                          <div className="text-[10px] sm:text-xs text-muted-foreground truncate">{section.description}</div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </Button>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="pt-3 sm:pt-4 border-t">
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/news?tab=community" onClick={onClose}>
                    <Button variant="outline" className="w-full text-[10px] sm:text-xs min-h-[44px]" data-testid="button-submit-story">
                      <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Submit Your Story</span>
                      <span className="sm:hidden">Submit Story</span>
                    </Button>
                  </Link>
                  <Link href="/news?tab=community" onClick={onClose}>
                    <Button variant="outline" className="w-full text-[10px] sm:text-xs min-h-[44px]" data-testid="button-join-newsletter">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Join Newsletter</span>
                      <span className="sm:hidden">Newsletter</span>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Featured Articles Section */}
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                <h3 className="font-semibold text-base sm:text-lg">Featured Articles</h3>
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
