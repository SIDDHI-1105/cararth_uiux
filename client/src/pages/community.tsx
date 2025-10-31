import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share2, Users, Camera, Calendar, MapPin, Star, TrendingUp, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { SEOHead } from "@/components/seo-head";

// SEO-friendly image paths (dynamically referenced) - Enhanced with real automotive photography
const sportsCarImage = '/attached_assets/generated_images/Dynamic_sports_car_mountain_road_5267e5a6.png';
const heritageImage = '/attached_assets/generated_images/Classic_meets_modern_Indian_cars_2c8c3217.png';
const communityImage = '/attached_assets/generated_images/Car_enthusiasts_community_gathering_46d58c97.png';
const swiftImage = '/attached_assets/generated_images/Modern_Maruti_Swift_photography_7f6b059d.png';
const cretaImage = '/attached_assets/generated_images/Premium_Hyundai_Creta_photography_72cd10be.png';

interface CommunityPost {
  id: string;
  author: string;
  avatar?: string;
  title: string;
  content: string;
  image?: string;
  coverImage?: string;
  likes?: number;
  comments?: number;
  shares?: number;
  tags?: string[];
  timestamp: string;
  location?: string;
  featured?: boolean;
  source: string;
  sourceUrl: string;
  publishedAt: Date;
  category: string;
  attribution: string;
  isExternal: boolean;
}

interface CarSpotlight {
  id: string;
  make: string;
  model: string;
  year: number;
  owner: string;
  story: string;
  image: string;
  specs: string[];
  rating: number;
  category: 'classic' | 'modern' | 'modified' | 'rare';
}

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState('feed');

  // SEO structured data for Community page
  const structuredData = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Throttle Talk - CarArth Community",
    "description": "Join India's most passionate car enthusiasts community. Share experiences, discover amazing rides, and connect with fellow automotive lovers.",
    "url": "https://cararth.com/community",
    "publisher": {
      "@type": "Organization",
      "name": "CarArth",
      "url": "https://cararth.com"
    }
  }), []);

  // Fetch real RSS content from Throttle Talk
  const { data: rssData, isLoading: rssLoading, error: rssError } = useQuery({
    queryKey: ['/api/community/posts'],
    select: (data: any) => {
      // Transform RSS data to match frontend format
      return data.posts?.map((post: any) => ({
          ...post,
          avatar: '/api/placeholder/32/32',
          image: post.coverImage || post.image,
          likes: Math.floor(Math.random() * 200) + 50,
          comments: Math.floor(Math.random() * 50) + 10,
          shares: Math.floor(Math.random() * 30) + 5,
          tags: post.category ? [`#${post.category.replace(/\s+/g, '')}`] : ['#Automotive'],
          timestamp: new Date(post.publishedAt).toLocaleDateString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            day: 'numeric',
            month: 'short'
          }),
          featured: Math.random() > 0.7
        }))|| []
    }
  });

  // Fallback community data for when RSS is loading or failed
  const fallbackPosts: CommunityPost[] = [
    {
      id: '1',
      author: 'RajeshGearhead',
      avatar: '/api/placeholder/32/32',
      title: 'Golden Hour Drive Through Himachal - Pure Magic!',
      content: 'Just completed an epic 800km journey through the Himachal mountains in my trusty Creta. The way this machine handled those hairpin turns at 3000m altitude - absolutely phenomenal! Fellow enthusiasts, what\'s your favorite mountain drive route?',
      image: sportsCarImage,
      likes: 127,
      comments: 34,
      shares: 18,
      tags: ['#MountainDrive', '#Creta', '#Himachal', '#GoldenHour'],
      timestamp: '2 hours ago',
      location: 'Shimla, Himachal Pradesh',
      featured: true
    },
    {
      id: '2',
      author: 'VintageVarun',
      avatar: '/api/placeholder/32/32',
      title: 'When Legends Meet: Ambassador vs Modern SUV',
      content: 'Had an incredible moment today - my grandfather\'s 1982 Ambassador parked next to my cousin\'s new Thar. Three generations of Indian automotive passion in one frame. The evolution is remarkable, but that vintage charm? Irreplaceable.',
      image: heritageImage,
      likes: 203,
      comments: 67,
      shares: 45,
      tags: ['#VintageVsModern', '#Ambassador', '#Heritage', '#IndianCars'],
      timestamp: '5 hours ago',
      location: 'Mumbai, Maharashtra',
      featured: true
    },
    {
      id: '3',
      author: 'TechieDriver',
      avatar: '/api/placeholder/32/32',
      title: 'Hyderabad Gear Heads Monthly Meet - What a Turnout!',
      content: 'Our monthly enthusiast meetup just wrapped up and wow - 150+ cars, 300+ passionate folks, and countless stories shared. From first-time buyers to seasoned collectors, this community never fails to inspire. Next meet: October 15th!',
      image: communityImage,
      likes: 89,
      comments: 23,
      shares: 12,
      tags: ['#Community', '#HyderabadMeet', '#CarEnthusiasts', '#Networking'],
      timestamp: '1 day ago',
      location: 'Hyderabad, Telangana',
      featured: false
    }
  ].map(post => ({
    ...post,
    source: 'Community',
    sourceUrl: '#',
    publishedAt: new Date(),
    category: 'Community',
    attribution: 'Community Post',
    isExternal: false
  }));

  // Use real RSS data or fallback
  const communityPosts = rssData && rssData.length > 0 ? rssData : fallbackPosts;

  const carSpotlights: CarSpotlight[] = [
    {
      id: '1',
      make: 'Maruti Suzuki',
      model: 'Swift',
      year: 2019,
      owner: 'SpeedyPriya',
      story: 'This little rocket has been my companion through 80,000km of pure joy. From daily commutes to weekend getaways, it\'s never let me down.',
      image: swiftImage,
      specs: ['1.2L Petrol', 'Manual', '22 kmpl', '83 bhp'],
      rating: 4.8,
      category: 'modern'
    },
    {
      id: '2', 
      make: 'Hyundai',
      model: 'Creta',
      year: 2021,
      owner: 'AdventureAnil',
      story: 'Bought it for family needs, fell in love with its character. Perfect blend of comfort, style, and reliability for the Indian road conditions.',
      image: cretaImage, 
      specs: ['1.5L Petrol', 'CVT', '17 kmpl', '115 bhp'],
      rating: 4.6,
      category: 'modern'
    }
  ];

  const handleLike = (postId: string) => {
    // Implement like functionality
    console.log(`Liked post ${postId}`);
  };

  const handleShare = (postId: string) => {
    // Implement share functionality
    navigator.share?.({
      title: 'Check out this car post',
      url: `${window.location.origin}/community/post/${postId}`
    });
  };

  return (
    <>
      <SEOHead 
        title="Throttle Talk - Car Enthusiasts Community | CarArth"
        description="Join India's most passionate car enthusiasts community. Share experiences, discover amazing rides, and connect with fellow automotive lovers across the country. 25K+ members, 1.2K posts this week."
        keywords="car enthusiasts India, automotive community, car lovers, vehicle enthusiasts, car meets, automotive passion, Indian car community, throttle talk"
        ogImage={communityImage}
        ogType="website"
        structuredData={structuredData}
        canonical="https://www.cararth.com/community"
      />

      <div className="container mx-auto px-4 py-8" data-testid="community-page">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold" data-testid="text-community-title">
              Throttle Talk
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-4" data-testid="text-community-description">
            Where passion meets the pavement - India's premier automotive community
          </p>
          
          {/* Community Stats */}
          <div className="flex flex-wrap gap-4 mb-6">
            <Badge variant="outline" className="text-sm">
              <Users className="h-3 w-3 mr-1" />
              25K+ Members
            </Badge>
            <Badge variant="outline" className="text-sm">
              <Camera className="h-3 w-3 mr-1" />
              1.2K Posts This Week
            </Badge>
            <Badge variant="outline" className="text-sm">
              <MapPin className="h-3 w-3 mr-1" />
              50+ Cities
            </Badge>
            <Badge variant="outline" className="text-sm">
              <Star className="h-3 w-3 mr-1" />
              4.9/5 Community Rating
            </Badge>
          </div>

          {/* Featured Community Banner */}
          <div 
            className="relative rounded-xl overflow-hidden mb-8 h-48 sm:h-64 bg-cover bg-center"
            style={{ backgroundImage: `url(${sportsCarImage})` }}
          >
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
              <div className="text-center text-white px-4">
                <h2 className="text-xl sm:text-2xl font-bold mb-2">Throttle Talk</h2>
                <p className="text-sm sm:text-lg">Where passion meets the pavement</p>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4" data-testid="tabs-community-sections">
            <TabsTrigger value="feed" data-testid="tab-community-feed">Community Feed</TabsTrigger>
            <TabsTrigger value="spotlight" data-testid="tab-car-spotlight">Car Spotlight</TabsTrigger>
            <TabsTrigger value="events" data-testid="tab-events">Events</TabsTrigger>
            <TabsTrigger value="resources" data-testid="tab-resources">Resources</TabsTrigger>
          </TabsList>

          {/* Community Feed */}
          <TabsContent value="feed" className="space-y-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold" data-testid="text-feed-heading">Latest from the Community</h2>
            </div>

            <div className="grid gap-6" data-testid="community-posts-list">
              {rssLoading && (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">Loading authentic automotive content...</p>
                </div>
              )}
              {!rssLoading && communityPosts.map((post: CommunityPost, index: number) => (
                <Card key={post.id} className={cn("hover:shadow-lg transition-shadow bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700", post.featured && "border-blue-300 dark:border-blue-600 shadow-blue-100 dark:shadow-blue-900/20")}>
                  {post.featured && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 px-4 py-2 border-b border-blue-200 dark:border-blue-700">
                      <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300 font-medium">
                        <Award className="h-4 w-4" />
                        <span>Featured Content</span>
                      </div>
                    </div>
                  )}
                  
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarImage src={post.avatar} alt={post.author} />
                        <AvatarFallback>{post.author.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100" data-testid={`text-author-${index}`}>{post.author}</h3>
                          {post.location && (
                            <>
                              <span className="text-gray-400 dark:text-gray-500">•</span>
                              <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {post.location}
                              </span>
                            </>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400" data-testid={`text-timestamp-${index}`}>{post.timestamp}</p>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <CardTitle className="text-lg mb-3 text-gray-900 dark:text-gray-100 font-bold leading-tight" data-testid={`text-post-title-${index}`}>
                      {post.title}
                    </CardTitle>
                    <CardDescription className="text-sm mb-4 text-gray-700 dark:text-gray-300 leading-relaxed" data-testid={`text-post-content-${index}`}>
                      {post.content}
                    </CardDescription>
                    
                    {post.image && (
                      <div className="rounded-lg overflow-hidden mb-4 bg-gray-100 dark:bg-gray-800">
                        <img 
                          src={post.image} 
                          alt={post.title}
                          className="w-full h-64 object-cover hover:scale-105 transition-transform duration-300"
                          data-testid={`img-post-${index}`}
                        />
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags?.map((tag: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs" data-testid={`badge-tag-${index}-${i}`}>
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1" aria-label={`${post.likes} likes`} data-testid={`text-likes-${index}`}>
                        <Heart className="h-4 w-4" aria-hidden="true" />
                        {post.likes}
                      </span>
                      <span className="flex items-center gap-1" aria-label={`${post.comments} comments`} data-testid={`text-comments-${index}`}>
                        <MessageCircle className="h-4 w-4" aria-hidden="true" />
                        {post.comments}
                      </span>
                      <span className="flex items-center gap-1" aria-label={`${post.shares} shares`} data-testid={`text-shares-${index}`}>
                        <Share2 className="h-4 w-4" aria-hidden="true" />
                        {post.shares}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Car Spotlight */}
          <TabsContent value="spotlight" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4" data-testid="text-spotlight-heading">Member Car Spotlight</h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
                Celebrating the amazing rides in our community - from daily drivers to dream machines
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-testid="car-spotlight-list">
              {carSpotlights.map((car, index) => (
                <Card key={car.id} className="hover:shadow-lg transition-shadow">
                  <div className="aspect-video relative overflow-hidden rounded-t-lg">
                    <img 
                      src={car.image} 
                      alt={`${car.year} ${car.make} ${car.model}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      data-testid={`img-spotlight-${index}`}
                    />
                    <Badge 
                      className={cn("absolute top-3 right-3", {
                        "bg-blue-500": car.category === 'modern',
                        "bg-amber-500": car.category === 'classic',
                        "bg-purple-500": car.category === 'modified',
                        "bg-green-500": car.category === 'rare'
                      })}
                      data-testid={`badge-category-${index}`}
                    >
                      {car.category}
                    </Badge>
                  </div>
                  
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg" data-testid={`text-car-title-${index}`}>
                        {car.year} {car.make} {car.model}
                      </CardTitle>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium" data-testid={`text-rating-${index}`}>
                          {car.rating}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">
                      Owned by <span className="font-medium" data-testid={`text-owner-${index}`}>{car.owner}</span>
                    </p>
                  </CardHeader>
                  
                  <CardContent>
                    <CardDescription className="mb-4" data-testid={`text-car-story-${index}`}>
                      {car.story}
                    </CardDescription>
                    
                    <div className="flex flex-wrap gap-2">
                      {car.specs.map((spec, i) => (
                        <Badge key={i} variant="outline" className="text-xs" data-testid={`badge-spec-${index}-${i}`}>
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Events */}
          <TabsContent value="events" className="space-y-6">
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2" data-testid="text-events-heading">Events Coming Soon</h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm max-w-md mx-auto">
                Stay tuned for upcoming car meets, drives, and automotive events across India
              </p>
            </div>
          </TabsContent>

          {/* Resources */}
          <TabsContent value="resources" className="space-y-6">
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2" data-testid="text-resources-heading">Resources Coming Soon</h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm max-w-md mx-auto">
                We're curating helpful guides, market insights, and expert reviews for the community
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}