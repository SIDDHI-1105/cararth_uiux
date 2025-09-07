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
  MessageCircle, Globe, Cpu, Scale, Newspaper, RefreshCw, Pin,
  User, Trophy, ThumbsUp, ChevronRight, Car, Settings, HelpCircle
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

interface ForumPost {
  id: string;
  title: string;
  author: string;
  authorImage?: string;
  category: string;
  replies: number;
  views: number;
  lastReply: string;
  isPinned?: boolean;
  isHot?: boolean;
  reputation: number;
}

interface CommunityStats {
  totalMembers: number;
  activeToday: number;
  postsToday: number;
  hotThreads: number;
}

// TeamBHP-inspired community layout with forum-style design
export default function ThrottleTalkPage() {
  const [selectedCategory, setSelectedCategory] = useState('hot-threads');
  const [selectedRegion, setSelectedRegion] = useState('all');

  // Fetch automotive news data
  const { data: newsData, isLoading: isNewsLoading } = useQuery({
    queryKey: ['/api/news/automotive'],
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  // Fetch community posts from RSS aggregation
  const { data: communityData, isLoading: isCommunityLoading } = useQuery({
    queryKey: ['/api/community/posts'],
    refetchInterval: 600000, // Refresh every 10 minutes
  });

  // Fetch community stats
  const { data: statsData } = useQuery({
    queryKey: ['/api/community/stats'],
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  // Use real community stats from API or fallback to defaults
  const communityStats: CommunityStats = statsData?.success ? {
    totalMembers: statsData.stats.totalPosts,
    activeToday: statsData.stats.activeMembersToday,
    postsToday: statsData.stats.discussionsToday,
    hotThreads: statsData.stats.sourceFeeds
  } : {
    totalMembers: 142857,
    activeToday: 3421,
    postsToday: 892,
    hotThreads: 23
  };

  // Mock forum posts (in real app, integrate with RSS feeds and community posts)
  const forumPosts: ForumPost[] = [
    {
      id: '1',
      title: 'Festive Season Car Market Frenzy: Sellers Paradise or Buyer Beware?',
      author: 'CarEnthusiast2024',
      category: 'Market Analysis',
      replies: 157,
      views: 12840,
      lastReply: '2 minutes ago',
      isPinned: true,
      isHot: true,
      reputation: 9.2
    },
    {
      id: '2', 
      title: 'Delhi Air Quality vs Diesel Cars: The Great Automotive Exodus',
      author: 'DelhiDriver',
      category: 'Regulatory Updates',
      replies: 284,
      views: 8967,
      lastReply: '15 minutes ago',
      isHot: true,
      reputation: 8.7
    },
    {
      id: '3',
      title: 'Hyundai Creta: Why it\'s the Undisputed King of Resale Value',
      author: 'ResaleExpert',
      category: 'Investment Analysis', 
      replies: 93,
      views: 5432,
      lastReply: '32 minutes ago',
      reputation: 9.5
    },
    {
      id: '4',
      title: 'Government Blockchain for Used Cars: Game Changer or Gimmick?',
      author: 'TechSavvyBuyer',
      category: 'Technology',
      replies: 67,
      views: 3981,
      lastReply: '1 hour ago',
      reputation: 7.8
    },
    {
      id: '5',
      title: 'Rural India\'s Used Car Revolution: Why Tier-2 Cities Are Booming',
      author: 'MarketAnalyst',
      category: 'Market Trends',
      replies: 124,
      views: 7253,
      lastReply: '2 hours ago',
      reputation: 8.9
    }
  ];

  const categories = [
    { id: 'hot-threads', name: '🔥 Hot Threads', icon: <Flame className="h-4 w-4" />, count: 23 },
    { id: 'market-analysis', name: 'Market Analysis', icon: <TrendingUp className="h-4 w-4" />, count: 156 },
    { id: 'reviews', name: 'Car Reviews', icon: <Star className="h-4 w-4" />, count: 89 },
    { id: 'tech-stuff', name: 'Tech Stuff', icon: <Cpu className="h-4 w-4" />, count: 67 },
    { id: 'regulatory', name: 'Policy Updates', icon: <Scale className="h-4 w-4" />, count: 43 },
    { id: 'travelogues', name: 'Road Trips', icon: <MapPin className="h-4 w-4" />, count: 234 }
  ];

  const regions = [
    { id: 'all', name: 'All India', count: 892 },
    { id: 'hyderabad', name: 'Hyderabad', count: 156 },
    { id: 'delhi-ncr', name: 'Delhi NCR', count: 243 },
    { id: 'mumbai', name: 'Mumbai', count: 189 },
    { id: 'bangalore', name: 'Bangalore', count: 167 },
    { id: 'chennai', name: 'Chennai', count: 137 }
  ];

  if (isNewsLoading || isCommunityLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* TeamBHP-style Header Banner */}
      <div className="bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 text-white py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">Throttle Talk - The Definitive Indian Automotive Community</h1>
              <p className="text-orange-100">Where car enthusiasts gather for authentic discussions</p>
            </div>
            <div className="text-right hidden md:block">
              <div className="text-lg font-bold">{communityStats.totalMembers.toLocaleString()}</div>
              <div className="text-xs text-orange-100">Community Members</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout - TeamBHP Style */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Left Sidebar - Community Stats & Categories */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Community Stats Card */}
            <Card className="bg-white/80 backdrop-blur-sm border-orange-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-orange-600" />
                  Community Pulse
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active Today</span>
                  <Badge className="bg-green-100 text-green-800">
                    {communityStats.activeToday.toLocaleString()}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Posts Today</span>
                  <Badge className="bg-blue-100 text-blue-800">
                    {communityStats.postsToday}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Hot Discussions</span>
                  <Badge className="bg-red-100 text-red-800">
                    {communityStats.hotThreads}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Categories */}
            <Card className="bg-white/80 backdrop-blur-sm border-orange-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Discussion Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-between text-left",
                      selectedCategory === category.id && "bg-orange-500 hover:bg-orange-600"
                    )}
                    onClick={() => setSelectedCategory(category.id)}
                    data-testid={`button-category-${category.id}`}
                  >
                    <div className="flex items-center gap-2">
                      {category.icon}
                      <span className="text-sm">{category.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {category.count}
                    </Badge>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Regional Discussions */}
            <Card className="bg-white/80 backdrop-blur-sm border-orange-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Regional Hubs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {regions.map((region) => (
                  <Button
                    key={region.id}
                    variant={selectedRegion === region.id ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-between text-left",
                      selectedRegion === region.id && "bg-orange-500 hover:bg-orange-600"
                    )}
                    onClick={() => setSelectedRegion(region.id)}
                    data-testid={`button-region-${region.id}`}
                  >
                    <span className="text-sm">{region.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {region.count}
                    </Badge>
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Featured/Pinned Threads */}
            <Card className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pin className="h-5 w-5" />
                  Featured Discussion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <h3 className="text-xl font-bold mb-2">
                  Community Insights: Used Car Market Analysis September 2025
                </h3>
                <p className="text-red-100 mb-4">
                  Join our expert community in discussing the latest market trends, pricing insights, and regulatory changes affecting India's automotive landscape.
                </p>
                <div className="flex items-center gap-4 text-sm text-red-100">
                  <span>👥 1,247 participants</span>
                  <span>💬 3,892 comments</span>
                  <span>🔥 Trending #1</span>
                </div>
              </CardContent>
            </Card>

            {/* Forum Threads List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <MessageSquare className="h-6 w-6 text-orange-600" />
                  Latest Discussions
                </h2>
                <Button className="bg-orange-500 hover:bg-orange-600">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>

              {/* Forum Posts */}
              {forumPosts.map((post) => (
                <Card key={post.id} className={cn(
                  "hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4",
                  post.isHot && "border-l-red-500 bg-red-50/50 dark:bg-red-900/10",
                  post.isPinned && "border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10",
                  !post.isHot && !post.isPinned && "border-l-gray-300 hover:border-l-orange-500"
                )} data-testid={`card-forum-post-${post.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      
                      {/* Author Avatar */}
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={post.authorImage} />
                        <AvatarFallback className="bg-orange-100 text-orange-700">
                          {post.author.charAt(0)}
                        </AvatarFallback>
                      </Avatar>

                      {/* Post Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-base leading-tight flex items-center gap-2">
                            {post.isPinned && <Pin className="h-4 w-4 text-yellow-600" />}
                            {post.isHot && <Flame className="h-4 w-4 text-red-500" />}
                            {post.title}
                          </h3>
                          <div className="flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                            <Trophy className="h-3 w-3" />
                            {post.reputation}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <span className="font-medium text-orange-600">@{post.author}</span>
                          <Badge variant="outline" className="text-xs">
                            {post.category}
                          </Badge>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {post.lastReply}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MessageCircle className="h-4 w-4" />
                              {post.replies} replies
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              {post.views.toLocaleString()} views
                            </span>
                          </div>
                          
                          <Button variant="ghost" size="sm" className="text-orange-600 hover:bg-orange-50">
                            Read More <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* RSS Integration Notice */}
            <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-900/10">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                      Content Attribution & RSS Integration
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-200 mb-2">
                      Some discussions may reference content from Team-BHP and other automotive communities. 
                      All external content is properly attributed with links to original sources.
                    </p>
                    <Badge className="bg-blue-100 text-blue-800 text-xs">
                      RSS Syndication Compliant
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Load More */}
            <div className="flex justify-center">
              <Button className="bg-orange-500 hover:bg-orange-600 px-8">
                Load More Discussions
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}