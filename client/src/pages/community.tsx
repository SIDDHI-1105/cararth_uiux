import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share2, Users, Camera, Calendar, MapPin, Star, TrendingUp, Award } from "lucide-react";
import { cn } from "@/lib/utils";

// SEO-friendly image paths (dynamically referenced)
const sportsCarImage = '/attached_assets/generated_images/Dynamic_sports_car_mountain_road_5267e5a6.png';
const heritageImage = '/attached_assets/generated_images/Classic_meets_modern_Indian_cars_2c8c3217.png';
const communityImage = '/attached_assets/generated_images/Car_enthusiasts_community_gathering_46d58c97.png';

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

  // Fetch real RSS content from Throttle Talk
  const { data: rssData, isLoading: rssLoading, error: rssError } = useQuery({
    queryKey: ['/api/community/posts'],
    select: (data: any) => {
      console.log('RSS API Response:', data); // Debug logging
      // Transform RSS data to match frontend format
      return data.posts?.map((post: any) => {
        console.log('Processing post:', post.title, 'CoverImage:', post.coverImage); // Debug logging
        return {
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
        }
      }) || []
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
      image: '/api/placeholder/300/200',
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
      image: '/api/placeholder/300/200', 
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
      {/* SEO Meta Tags */}
      <div style={{ display: 'none' }}>
        <meta name="description" content="Join India's most passionate car enthusiasts community. Share experiences, discover amazing rides, and connect with fellow automotive lovers across the country." />
        <meta name="keywords" content="car enthusiasts, automotive community India, car lovers, vehicle enthusiasts, car meets, automotive passion" />
        <meta property="og:title" content="Car Enthusiasts Community - The Mobility Hub" />
        <meta property="og:description" content="Connect with India's most passionate car community. Share rides, experiences, and automotive knowledge." />
        <meta property="og:image" content={communityImage} />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={`${window.location.origin}/community`} />
      </div>

      <div className="container mx-auto px-4 py-8" data-testid="community-page">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold" data-testid="text-community-title">
              Car Enthusiasts Hub
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
            className="relative rounded-xl overflow-hidden mb-8 h-64 bg-cover bg-center"
            style={{ backgroundImage: `url(${sportsCarImage})` }}
          >
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
              <div className="text-center text-white">
                <h2 className="text-2xl font-bold mb-2">Join the Ride</h2>
                <p className="text-lg mb-4">Share your automotive passion with like-minded enthusiasts</p>
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700" data-testid="button-join-community">
                  Join Our Community
                </Button>
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
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold" data-testid="text-feed-heading">Latest from the Community</h2>
              <Button variant="outline" size="sm" data-testid="button-create-post">
                Share Your Story
              </Button>
            </div>

            <div className="grid gap-6" data-testid="community-posts-list">
              {communityPosts.map((post: CommunityPost, index: number) => (
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
                      <div className="rounded-lg overflow-hidden mb-4">
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

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleLike(post.id)}
                          className="text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                          data-testid={`button-like-${index}`}
                        >
                          <Heart className="h-4 w-4 mr-1" />
                          {post.likes}
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400" data-testid={`button-comment-${index}`}>
                          <MessageCircle className="h-4 w-4 mr-1" />
                          {post.comments}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleShare(post.id)}
                          className="text-gray-600 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400"
                          data-testid={`button-share-${index}`}
                        >
                          <Share2 className="h-4 w-4 mr-1" />
                          {post.shares}
                        </Button>
                      </div>
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
            <div>
              <h2 className="text-xl font-semibold mb-4" data-testid="text-events-heading">Upcoming Events</h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Join fellow enthusiasts at meetups, drives, and automotive events across India
              </p>
            </div>

            <div className="grid gap-4">
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Hyderabad Monthly Meet</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      <Calendar className="h-3 w-3 mr-1" />
                      Oct 15, 2024
                    </Badge>
                  </div>
                  <CardDescription>
                    Monthly gathering of car enthusiasts in Hyderabad. All brands, all stories welcome!
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Gachibowli, Hyderabad
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      150+ Expected
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Resources */}
          <TabsContent value="resources" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4" data-testid="text-resources-heading">Community Resources</h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
                Curated resources for car enthusiasts - from maintenance tips to buying guides
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Market Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Latest trends, pricing analysis, and market intelligence for informed decisions
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Expert Reviews
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    In-depth reviews and comparisons from automotive experts and community members
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Community Guides
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Member-created guides on maintenance, modifications, and automotive best practices
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* SEO-friendly Footer Links */}
        <div className="mt-12 pt-8 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
            <div>
              <h3 className="font-semibold mb-2">Community</h3>
              <ul className="space-y-1 text-gray-600 dark:text-gray-300">
                <li><a href="/community/guidelines" className="hover:text-blue-600">Community Guidelines</a></li>
                <li><a href="/community/events" className="hover:text-blue-600">Upcoming Events</a></li>
                <li><a href="/community/members" className="hover:text-blue-600">Member Directory</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Resources</h3>
              <ul className="space-y-1 text-gray-600 dark:text-gray-300">
                <li><a href="/guides/buying" className="hover:text-blue-600">Car Buying Guide</a></li>
                <li><a href="/guides/maintenance" className="hover:text-blue-600">Maintenance Tips</a></li>
                <li><a href="/guides/finance" className="hover:text-blue-600">Financing Options</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Popular Brands</h3>
              <ul className="space-y-1 text-gray-600 dark:text-gray-300">
                <li><a href="/community/maruti" className="hover:text-blue-600">Maruti Suzuki Enthusiasts</a></li>
                <li><a href="/community/hyundai" className="hover:text-blue-600">Hyundai Community</a></li>
                <li><a href="/community/tata" className="hover:text-blue-600">Tata Motors Club</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Connect</h3>
              <ul className="space-y-1 text-gray-600 dark:text-gray-300">
                <li><a href="/community/join" className="hover:text-blue-600">Join Our Community</a></li>
                <li><a href="/contact" className="hover:text-blue-600">Contact Us</a></li>
                <li><a href="/news" className="hover:text-blue-600">Latest News</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}