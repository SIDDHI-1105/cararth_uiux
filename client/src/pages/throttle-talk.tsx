// FILE: client/src/pages/throttle-talk.tsx – Spinny-inspired Throttle Talk with three tabs

import { useState } from "react";
import { Link } from "wouter";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp, Users, BookOpen, Calendar,
  Eye, MessageSquare, ThumbsUp, ExternalLink,
  BarChart3, Star, Award, ChevronRight
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface Article {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  views: number;
  likes: number;
  comments: number;
  image: string;
  trending?: boolean;
}

interface CommunityPost {
  id: string;
  title: string;
  author: string;
  category: string;
  replies: number;
  views: number;
  lastReply: string;
}

interface Guide {
  id: string;
  title: string;
  description: string;
  category: string;
  readTime: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  icon: string;
}

export default function ThrottleTalk() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState("insights");

  // Dummy data for Market Insights
  const marketInsights: Article[] = [
    {
      id: "1",
      title: "Used Car Market Analysis 2025: Hyderabad Leading the Charge",
      excerpt: "Hyderabad emerges as the fastest-growing used car market in India with 23% YoY growth. Discover the key factors driving this trend.",
      category: "Market Trends",
      author: "CarArthX Research",
      date: "2025-12-01",
      readTime: "5 min",
      views: 1250,
      likes: 89,
      comments: 23,
      image: "https://placehold.co/600x400/0071E3/ffffff?text=Market+Analysis",
      trending: true
    },
    {
      id: "2",
      title: "EV Resale Value: Are Electric Cars Holding Their Worth?",
      excerpt: "Analysis of electric vehicle depreciation rates compared to traditional ICE vehicles in the Indian market.",
      category: "Electric Vehicles",
      author: "Tech Team",
      date: "2025-11-28",
      readTime: "7 min",
      views: 980,
      likes: 65,
      comments: 18,
      image: "https://placehold.co/600x400/16a34a/ffffff?text=EV+Analysis"
    },
    {
      id: "3",
      title: "Top 10 Most Searched Used Cars in India - December 2025",
      excerpt: "Swift, Baleno, and Creta dominate search trends. Here's what buyers are looking for this month.",
      category: "Buyer Trends",
      author: "Data Insights",
      date: "2025-11-25",
      readTime: "4 min",
      views: 2100,
      likes: 145,
      comments: 42,
      image: "https://placehold.co/600x400/3b82f6/ffffff?text=Top+Searches"
    }
  ];

  // Dummy data for Community
  const communityPosts: CommunityPost[] = [
    {
      id: "1",
      title: "Should I buy a 2018 Honda City with 60k km?",
      author: "RajeshK",
      category: "Buying Advice",
      replies: 15,
      views: 450,
      lastReply: "2 hours ago"
    },
    {
      id: "2",
      title: "Best time to sell my car for maximum value?",
      author: "PriyaM",
      category: "Selling Tips",
      replies: 12,
      views: 320,
      lastReply: "5 hours ago"
    },
    {
      id: "3",
      title: "Hyderabad vs Mumbai: Better used car deals?",
      author: "VikasS",
      category: "Market Discussion",
      replies: 28,
      views: 890,
      lastReply: "1 day ago"
    },
    {
      id: "4",
      title: "My experience buying from verified dealers",
      author: "AnuragB",
      category: "Experiences",
      replies: 34,
      views: 1200,
      lastReply: "3 hours ago"
    }
  ];

  // Dummy data for Guides
  const guides: Guide[] = [
    {
      id: "1",
      title: "Complete Guide to Buying a Used Car in India",
      description: "Everything you need to know before purchasing a pre-owned vehicle - from inspection to paperwork.",
      category: "Buyer Guides",
      readTime: "15 min",
      difficulty: "Beginner",
      icon: "🚗"
    },
    {
      id: "2",
      title: "How to Verify Car Documents and RC Transfer",
      description: "Step-by-step guide to checking authenticity of car documents and completing RC transfer.",
      category: "Legal & Paperwork",
      readTime: "10 min",
      difficulty: "Intermediate",
      icon: "📄"
    },
    {
      id: "3",
      title: "Best Used Cars Under 5 Lakhs in 2025",
      description: "Curated list of reliable, value-for-money used cars available in the sub-5L segment.",
      category: "Recommendations",
      readTime: "8 min",
      difficulty: "Beginner",
      icon: "💰"
    },
    {
      id: "4",
      title: "Car Inspection Checklist: 50+ Points to Check",
      description: "Professional inspection checklist covering engine, body, electrical, and safety aspects.",
      category: "Inspection",
      readTime: "12 min",
      difficulty: "Intermediate",
      icon: "🔍"
    },
    {
      id: "5",
      title: "Understanding Car Insurance Transfer Process",
      description: "Navigate the insurance transfer and claim process when buying a used car.",
      category: "Insurance",
      readTime: "7 min",
      difficulty: "Beginner",
      icon: "🛡️"
    },
    {
      id: "6",
      title: "Negotiation Tactics for Used Car Buyers",
      description: "Expert tips on getting the best deal and negotiating with sellers and dealers.",
      category: "Negotiation",
      readTime: "6 min",
      difficulty: "Advanced",
      icon: "💬"
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return isDark ? "bg-green-500/20 text-green-300 border-green-500/30" : "bg-green-100 text-green-700 border-green-300";
      case "Intermediate":
        return isDark ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" : "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "Advanced":
        return isDark ? "bg-red-500/20 text-red-300 border-red-500/30" : "bg-red-100 text-red-700 border-red-300";
      default:
        return "";
    }
  };

  return (
    <Layout containerSize="xl">
      <div className="py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className={`text-5xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
            🚗 Throttle Talk
          </h1>
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'} max-w-3xl mx-auto`}>
            Market insights, community discussions, and expert guides for car enthusiasts
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full max-w-2xl mx-auto grid-cols-3 h-14 ${
            isDark ? 'bg-white/5' : 'bg-gray-100'
          }`}>
            <TabsTrigger
              value="insights"
              className="text-base font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <TrendingUp className="w-5 h-5 mr-2" />
              Market Insights
            </TabsTrigger>
            <TabsTrigger
              value="community"
              className="text-base font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <Users className="w-5 h-5 mr-2" />
              Community
            </TabsTrigger>
            <TabsTrigger
              value="guides"
              className="text-base font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <BookOpen className="w-5 h-5 mr-2" />
              Guides
            </TabsTrigger>
          </TabsList>

          {/* Market Insights Tab */}
          <TabsContent value="insights" className="mt-8 space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {marketInsights.map((article) => (
                <Card key={article.id} className={`overflow-hidden transition-all duration-300 hover:scale-105 ${
                  isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
                }`}>
                  <div className="relative">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-48 object-cover"
                    />
                    {article.trending && (
                      <Badge className="absolute top-3 right-3 bg-red-600 text-white">
                        <Star className="w-3 h-3 mr-1" />
                        Trending
                      </Badge>
                    )}
                    <Badge className={`absolute top-3 left-3 ${
                      isDark ? 'bg-blue-600/90 text-white' : 'bg-blue-500 text-white'
                    }`}>
                      {article.category}
                    </Badge>
                  </div>
                  <CardHeader>
                    <CardTitle className={`text-lg line-clamp-2 ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      {article.title}
                    </CardTitle>
                    <p className={`text-sm line-clamp-2 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {article.excerpt}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className={`flex items-center justify-between text-sm ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(article.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </span>
                      <span>{article.readTime} read</span>
                    </div>
                    <div className={`flex items-center gap-4 text-sm ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {article.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-4 h-4" />
                        {article.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {article.comments}
                      </span>
                    </div>
                    <Link href={`/news/${article.id}`}>
                      <Button className="w-full" variant="outline">
                        Read Article <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Community Tab */}
          <TabsContent value="community" className="mt-8 space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Latest Discussions
              </h2>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <MessageSquare className="w-4 h-4 mr-2" />
                Start Discussion
              </Button>
            </div>

            <div className="space-y-4">
              {communityPosts.map((post) => (
                <Card key={post.id} className={`transition-all duration-300 hover:shadow-lg ${
                  isDark ? 'bg-white/5 border-white/10 hover:bg-white/8' : 'bg-white border-gray-200 hover:shadow-xl'
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className={
                            isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'
                          }>
                            {post.category}
                          </Badge>
                        </div>
                        <h3 className={`text-xl font-bold hover:text-blue-600 cursor-pointer ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}>
                          {post.title}
                        </h3>
                        <div className={`flex items-center gap-4 text-sm ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          <span>By <strong>{post.author}</strong></span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            {post.replies} replies
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {post.views} views
                          </span>
                          <span className={`ml-auto ${
                            isDark ? 'text-gray-500' : 'text-gray-500'
                          }`}>
                            Last reply {post.lastReply}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Guides Tab */}
          <TabsContent value="guides" className="mt-8 space-y-6">
            <div className="mb-6">
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Expert Guides & Resources
              </h2>
              <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Comprehensive guides to help you navigate the used car market
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {guides.map((guide) => (
                <Card key={guide.id} className={`transition-all duration-300 hover:scale-105 ${
                  isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
                }`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="text-4xl">{guide.icon}</div>
                      <Badge className={getDifficultyColor(guide.difficulty)} variant="outline">
                        {guide.difficulty}
                      </Badge>
                    </div>
                    <CardTitle className={`text-xl mt-4 ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      {guide.title}
                    </CardTitle>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {guide.description}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className={`flex items-center justify-between text-sm ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      <Badge variant="outline" className={
                        isDark ? 'border-white/20' : 'border-gray-300'
                      }>
                        {guide.category}
                      </Badge>
                      <span>{guide.readTime} read</span>
                    </div>
                    <Link href={`/news/${guide.id}`}>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Read Guide
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
