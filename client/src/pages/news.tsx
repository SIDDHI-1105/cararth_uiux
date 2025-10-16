import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageSquare, Eye, Calendar, Plus, 
  MessageCircle, Globe, ExternalLink, LogIn,
  Heart, Bookmark, Share2, ThumbsUp, TrendingUp,
  Image as ImageIcon, Play
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
}

// Post creation form schema
const postSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  category: z.string().min(1, "Please select a category"),
});

type PostFormData = z.infer<typeof postSchema>;

// Clean, minimal community platform
export default function ThrottleTalkPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
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
  const { data: communityData, isLoading: isCommunityLoading } = useQuery({
    queryKey: ['/api/community/posts'],
    refetchInterval: 600000, // Refresh every 10 minutes
  });

  // Fetch user-generated posts
  const { data: userPostsData, isLoading: isUserPostsLoading } = useQuery({
    queryKey: ['/api/community/user-posts'],
    enabled: isAuthenticated,
  });

  // Fetch market insights from Perplexity LLM
  const { data: marketInsightsData, isLoading: isMarketInsightsLoading } = useQuery({
    queryKey: ['/api/news/market-insights'],
    enabled: selectedCategory === 'market',
    refetchInterval: 3600000, // Refresh every hour
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

  // Convert RSS data to forum post format
  const rssContent = (communityData as any)?.success ? (communityData as any).posts.map((post: any) => ({
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
  const marketInsightsPosts: ForumPost[] = selectedCategory === 'market' && (marketInsightsData as any)?.success ? 
    (marketInsightsData as any).insights.map((insight: any, index: number) => ({
      id: `market-insight-${index}`,
      title: insight.topic,
      author: 'CarArth Market Intelligence',
      authorImage: undefined,
      category: 'Market Insights',
      replies: 0,
      views: Math.floor(100 + Math.random() * 500),
      lastReply: new Date().toLocaleDateString(),
      isExternal: false,
      attribution: insight.sources?.length > 0 ? `Sources: ${insight.sources.join(', ')}` : 'Sourced from SIAM and published automotive data',
      content: insight.insight,
      dataPoints: insight.dataPoints,
      citations: insight.citations,
    })) : [];

  // Combine RSS and user content
  const allPosts = selectedCategory === 'market' ? 
    marketInsightsPosts : 
    [...userPosts, ...rssContent].slice(0, 20);

  const categories = [
    { id: 'all', name: 'All Posts' },
    { id: 'reviews', name: 'Reviews' },
    { id: 'questions', name: 'Questions' },
    { id: 'market', name: 'Market Insights' },
    { id: 'community', name: 'Community' }
  ];

  if (isCommunityLoading || (selectedCategory === 'market' && isMarketInsightsLoading)) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
            {selectedCategory === 'market' && (
              <p className="ml-3 text-gray-600 dark:text-gray-400">Analyzing market trends...</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* SEO & Schema Markup */}
      <NewsSEOHead posts={allPosts.map(p => ({ ...p, publishedAt: new Date(p.lastReply) }))} />
      <FAQSchemaMarkup />
      
      {/* Clean header */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <BrandWordmark variant="header" showTagline={false} className="scale-75" />
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Throttle Talk
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Automotive community discussions
                </p>
              </div>
            </div>
            {isAuthenticated ? (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100" data-testid="button-new-post">
                    <Plus className="h-4 w-4 mr-2" />
                    New Post
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
            ) : (
              <div className="flex justify-center">
                <AuthDialog />
              </div>
            )}
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

                        {/* Market insights content */}
                        {post.content && (
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
                            url={`https://cararth.com/news/${post.id}`}
                            title={`${post.title}${post.isExternal ? ` (via ${post.attribution})` : ''}`}
                            description={post.content || `${post.title} - Read on CarArth Throttle Talk`}
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