import { useEffect, useRef } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Globe, ExternalLink, ArrowLeft } from "lucide-react";
import SocialShareButtons from "@/components/social-share-buttons";
import { NewsSEOHead } from "@/components/news-seo-head";
import { McKinseyInsightCard } from "@/components/mckinsey-insight-card";
import { DisqusComments } from "@/components/disqus-comments";
import { RelatedArticlesCarousel } from "@/components/related-articles-carousel";
import { GA4Events } from "@/hooks/use-ga4";
import { useTimeOnPage, useScrollTracking } from "@/hooks/use-ga4";

export default function NewsDetail() {
  const params = useParams();
  const id = params.id;
  const trackedArticleIdRef = useRef<string | null>(null);

  const { data: post, isLoading, error, refetch } = useQuery({
    queryKey: [`/api/community/posts/${id}`],
    enabled: Boolean(id),
    retry: 2, // Retry twice before failing
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  // Track page engagement
  useTimeOnPage(`/news/${id}`);
  useScrollTracking();

  // Track article view (only once per article)
  useEffect(() => {
    if (post) {
      const postData = (post as any).post || post;
      
      // Only track if this is a new article (not a refetch of the same article)
      if (postData.id && trackedArticleIdRef.current !== postData.id) {
        GA4Events.articleView(
          postData.id, 
          postData.category || 'article',
          postData.attribution || 'cararth'
        );
        trackedArticleIdRef.current = postData.id;
      }
    }
  }, [post]);

  if (!id || isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state - connection issue or server error
  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-4xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Unable to Load Article
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                We're having trouble loading this article. This could be due to a temporary connection issue.
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => refetch()} data-testid="button-retry-article">
                  Try Again
                </Button>
                <Link href="/news">
                  <Button variant="outline" data-testid="button-back-news">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Throttle Talk
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Not found state - article doesn't exist
  if (!post) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-4xl mb-4">📄</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Article Not Found
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                This article may have been removed or doesn't exist. Check out our latest articles instead.
              </p>
              <Link href="/news">
                <Button data-testid="button-browse-articles">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Browse Articles
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const postData = (post as any).post || post;
  const isExternal = postData.isExternal || false;
  const sourceUrl = postData.sourceUrl;
  const attribution = postData.attribution;
  
  // Normalize author data (handle both object and string formats)
  const authorName = typeof postData.author === 'object' && postData.author 
    ? (postData.author.firstName || 'CarArth Community')
    : (postData.author || 'CarArth Community');

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* SEO Head */}
      <NewsSEOHead 
        isDetailPage={true}
        singlePost={{ 
          id: postData.id,
          title: postData.title,
          content: postData.content,
          author: authorName,
          publishedAt: new Date(postData.createdAt || Date.now()),
          category: postData.category,
          coverImage: postData.coverImage
        }} 
      />

      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/news">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Throttle Talk
            </Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8">
            {/* Cover Image */}
            {postData.coverImage && (
              <img 
                src={postData.coverImage} 
                alt={postData.title}
                className="w-full h-64 object-cover rounded-lg mb-6"
              />
            )}

            {/* Title & Meta */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {postData.title}
              </h1>
              
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={postData.author?.profileImageUrl} />
                    <AvatarFallback className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      {(postData.author?.firstName || postData.author || 'A').charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span>by {authorName}</span>
                </div>
                
                <Badge variant="outline" className="text-xs">
                  {postData.category}
                </Badge>
                
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(postData.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* McKinsey-style infographic for market insights */}
            {postData.infographic && (
              <div className="mb-6">
                <McKinseyInsightCard insight={{ infographic: postData.infographic }} />
              </div>
            )}

            {/* Content */}
            <div className="prose dark:prose-invert max-w-none mb-6">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {postData.content}
              </p>
            </div>

            {/* Data Points for Market Insights */}
            {postData.dataPoints && postData.dataPoints.length > 0 && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Key Data Points
                </h3>
                <ul className="space-y-2">
                  {postData.dataPoints.map((point: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <span className="text-blue-500">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Citations for Market Insights */}
            {postData.citations && postData.citations.length > 0 && (
              <div className="mb-6 p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Data Sources
                </h3>
                <ul className="space-y-1">
                  {postData.citations.map((citation: string, idx: number) => (
                    <li key={idx} className="text-xs text-gray-600 dark:text-gray-400">
                      {idx + 1}. {citation}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* External Source Link */}
            {isExternal && sourceUrl && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  This content is aggregated from external sources with proper attribution.
                </p>
                <Button variant="outline" asChild>
                  <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Read Original Article
                  </a>
                </Button>
              </div>
            )}

            {/* Social Sharing */}
            <div className="border-t border-gray-200 dark:border-gray-800 pt-6 mb-6">
              <SocialShareButtons
                url={`/news/${postData.id}`}
                title={postData.category === 'Market Insights' && authorName 
                  ? `${postData.title} - ${authorName}` 
                  : isExternal && attribution 
                    ? `${postData.title} (via ${attribution})` 
                    : postData.title}
                description={postData.content || `India's premier automotive insights and market intelligence - Powered by CarArth`}
              />
            </div>

            {/* Attribution */}
            {attribution && (
              <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  {attribution}
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-800 mt-6 pt-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Cararth.com is a unit of Aaro7 Fintech Private Limited
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Disqus Comments */}
        <DisqusComments
          articleId={postData.id}
          articleTitle={postData.title}
          articleUrl={`https://cararth.com/news/${postData.id}`}
        />

        {/* Related Articles Carousel */}
        <RelatedArticlesCarousel 
          currentArticleId={postData.id}
          category={postData.category}
        />
      </div>
    </div>
  );
}
