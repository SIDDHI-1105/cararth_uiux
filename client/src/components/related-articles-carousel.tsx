import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Calendar, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface RelatedArticlesCarouselProps {
  currentArticleId: string;
  category?: string;
}

export function RelatedArticlesCarousel({ currentArticleId, category }: RelatedArticlesCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(3); // desktop by default

  // Fetch all articles
  const { data: articlesData, isLoading } = useQuery({
    queryKey: ['/api/community/posts'],
  });

  // Responsive items per view
  useEffect(() => {
    const updateItemsPerView = () => {
      if (window.matchMedia('(max-width: 768px)').matches) {
        setItemsPerView(1); // mobile
        setCurrentIndex(0); // Reset on breakpoint change
      } else if (window.matchMedia('(max-width: 1024px)').matches) {
        setItemsPerView(2); // tablet
        setCurrentIndex(0);
      } else {
        setItemsPerView(3); // desktop
        setCurrentIndex(0);
      }
    };

    updateItemsPerView();
    window.addEventListener('resize', updateItemsPerView);
    return () => window.removeEventListener('resize', updateItemsPerView);
  }, []);

  // Filter and get related articles (exclude current, prefer same category)
  const allArticles = articlesData?.posts || [];
  const relatedArticles = allArticles
    .filter((article: any) => article.id !== currentArticleId)
    .sort((a: any, b: any) => {
      // Prioritize same category
      if (category) {
        const aMatch = a.category === category ? 1 : 0;
        const bMatch = b.category === category ? 1 : 0;
        if (aMatch !== bMatch) return bMatch - aMatch;
      }
      // Then by views
      return (b.views || 0) - (a.views || 0);
    })
    .slice(0, 6); // Get top 6 related articles

  const maxIndex = Math.max(0, relatedArticles.length - itemsPerView);

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  if (isLoading || relatedArticles.length === 0) {
    return null;
  }

  return (
    <div className="w-full py-8 border-t" data-testid="related-articles-carousel">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Related Articles</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            data-testid="button-carousel-prev"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNext}
            disabled={currentIndex >= maxIndex}
            data-testid="button-carousel-next"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="relative overflow-hidden">
        <div 
          className="flex transition-transform duration-300 ease-in-out gap-4"
          style={{ transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)` }}
        >
          {relatedArticles.map((article: any) => (
            <div
              key={article.id}
              className="flex-shrink-0 w-full md:w-1/2 lg:w-1/3"
              data-testid={`related-article-${article.id}`}
            >
              <Link href={`/news/${article.id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                  {article.coverImage && (
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={article.coverImage}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {article.category && (
                        <Badge 
                          className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm"
                          variant="secondary"
                        >
                          {article.category}
                        </Badge>
                      )}
                    </div>
                  )}
                  <CardContent className="p-4">
                    <h3 className="font-semibold line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                      {article.title}
                    </h3>
                    {article.content && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {article.content.substring(0, 120)}...
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-3">
                        {article.views !== undefined && article.views !== null && (
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            <span>{article.views.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {article.lastReply 
                              ? new Date(article.lastReply).toLocaleDateString()
                              : 'Recent'}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile/Tablet dots indicator */}
      {itemsPerView < 3 && relatedArticles.length > itemsPerView && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: Math.ceil(relatedArticles.length / itemsPerView) }).map((_, idx) => {
            const targetIndex = Math.min(idx * itemsPerView, maxIndex);
            const isActive = Math.floor(currentIndex / itemsPerView) === idx;
            
            return (
              <button
                key={idx}
                onClick={() => setCurrentIndex(targetIndex)}
                className={cn(
                  "h-2 rounded-full transition-all",
                  isActive ? "w-8 bg-primary" : "w-2 bg-muted-foreground/30"
                )}
                aria-label={`Go to slide ${idx + 1}`}
                data-testid={`button-carousel-dot-${idx}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
