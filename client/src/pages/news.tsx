import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MessageSquare, Eye, Calendar, Plus, 
  MessageCircle, Globe, ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

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
}

// Clean, minimal community platform
export default function ThrottleTalkPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Fetch community posts from RSS aggregation
  const { data: communityData, isLoading: isCommunityLoading } = useQuery({
    queryKey: ['/api/community/posts'],
    refetchInterval: 600000, // Refresh every 10 minutes
  });

  // Convert RSS data to forum post format
  const rssContent = communityData?.success ? communityData.posts.map((post: any) => ({
    id: post.id,
    title: post.title,
    author: post.author,
    category: post.category,
    replies: Math.floor(Math.random() * 50),
    views: Math.floor(Math.random() * 1000) + 100,
    lastReply: new Date(post.publishedAt).toLocaleDateString(),
    isExternal: true,
    sourceUrl: post.sourceUrl,
    attribution: post.attribution
  })) : [];

  // Placeholder for user-generated posts (will be real data once auth is implemented)
  const userPosts: ForumPost[] = [];

  // Combine RSS and user content
  const allPosts = [...userPosts, ...rssContent].slice(0, 20);

  const categories = [
    { id: 'all', name: 'All Posts' },
    { id: 'reviews', name: 'Reviews' },
    { id: 'questions', name: 'Questions' },
    { id: 'market', name: 'Market Insights' },
    { id: 'community', name: 'Community' }
  ];

  if (isCommunityLoading) {
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

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Clean header */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Throttle Talk
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Automotive community discussions
              </p>
            </div>
            <Button className="bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100">
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Simple category filter */}
          <div className="lg:col-span-1">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                Categories
              </h3>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
                    selectedCategory === category.id
                      ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
                      : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-900"
                  )}
                  data-testid={`button-category-${category.id}`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Clean posts list */}
          <div className="lg:col-span-3 space-y-4">
            {allPosts.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No posts yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Be the first to start a discussion
                </p>
              </div>
            ) : (
              allPosts.map((post) => (
                <Card key={post.id} className="hover:shadow-sm transition-shadow cursor-pointer border border-gray-200 dark:border-gray-800" data-testid={`card-post-${post.id}`}>
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

                        {/* Attribution for external content */}
                        {post.isExternal && post.attribution && (
                          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {post.attribution}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}

            {/* Simple load more */}
            {allPosts.length > 0 && (
              <div className="text-center pt-6">
                <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
                  Load more posts
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}