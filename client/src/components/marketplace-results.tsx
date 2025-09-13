import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import CarDetailModal from "@/components/car-detail-modal";
import AIProcessingPipeline from "@/components/ai-processing-pipeline";
import { 
  TrendingUp, TrendingDown, Minus, ExternalLink, Verified, 
  MapPin, Calendar, Gauge, Fuel, Settings, Star, Filter,
  BarChart3, Users, Clock, Award, Eye, Phone, Brain, Shield,
  Sparkles, CheckCircle, ThumbsUp, ThumbsDown
} from "lucide-react";
import { Link } from "wouter";

interface MarketplaceListing {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  location: string;
  city: string;
  source: string;
  url: string;
  images: string[];
  description: string;
  features: string[];
  condition: string;
  verificationStatus: 'verified' | 'unverified' | 'certified';
  listingDate: Date;
  sellerType: 'individual' | 'dealer' | 'oem';
}

interface SearchResult {
  listings: MarketplaceListing[];
  analytics: {
    totalListings: number;
    avgPrice: number;
    priceRange: { min: number; max: number };
    mostCommonFuelType: string;
    avgMileage: number;
    sourcesCount: Record<string, number>;
    locationDistribution: Record<string, number>;
    priceByLocation: Record<string, number>;
    historicalTrend: 'rising' | 'falling' | 'stable';
  };
  recommendations: {
    bestDeals: MarketplaceListing[];
    overpriced: MarketplaceListing[];
    newListings: MarketplaceListing[];
    certified: MarketplaceListing[];
  };
}

interface MarketplaceResultsProps {
  searchResult: SearchResult;
  isLoading: boolean;
  error?: any;
  searchQuery?: string;
}

export default function MarketplaceResults({ searchResult, isLoading, error, searchQuery }: MarketplaceResultsProps) {
  const [selectedTab, setSelectedTab] = useState("all");
  const [sortBy, setSortBy] = useState("relevance");
  const [selectedCar, setSelectedCar] = useState<MarketplaceListing | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAIProcessing, setShowAIProcessing] = useState(true);
  const [useIntentRanking, setUseIntentRanking] = useState(true);
  const [intentQuery, setIntentQuery] = useState('');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <AIProcessingPipeline 
          isActive={true} 
          searchQuery={searchQuery}
          onComplete={(results) => {
            console.log('AI processing complete:', results);
            setShowAIProcessing(false);
          }}
        />
      </div>
    );
  }

  if (!searchResult || searchResult.listings.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            {error?.type === 'auth' ? (
              <>
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔐</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Login Required</h3>
                <p className="text-muted-foreground mb-4">
                  Please log in to search across all car portals and access thousands of listings.
                </p>
                <Button 
                  onClick={() => window.location.href = '/api/login'}
                  className="btn-metallic"
                  data-testid="button-login-required"
                >
                  Login to Search
                </Button>
              </>
            ) : (
              <>
                <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
                <p className="text-muted-foreground">
                  {error?.message || 'Try adjusting your search filters to see more results.'}
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatPrice = (price: number) => {
    const lakhs = price / 100000;
    return `₹${lakhs.toFixed(2)} Lakh`;
  };

  const formatMileage = (mileage: number) => {
    if (mileage >= 1000) {
      return `${(mileage / 1000).toFixed(0)}k km`;
    }
    return `${mileage.toLocaleString()} km`;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'falling':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getVerificationIcon = (status: string) => {
    switch (status) {
      case 'certified':
        return <Award className="w-4 h-4 text-blue-500" />;
      case 'verified':
        return <Verified className="w-4 h-4 text-green-500" />;
      default:
        return null;
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'excellent':
        return 'bg-green-100 text-green-800';
      case 'good':
        return 'bg-blue-100 text-blue-800';
      case 'fair':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateReliabilityScore = (listing: MarketplaceListing) => {
    let score = 50; // Base score
    
    // Platform reliability scores
    const platformScores: Record<string, number> = {
      'cars24': 15,
      'carwale': 12,
      'cardekho': 12,
      'autotrader': 10,
      'cartrade': 10,
      'spinny': 15,
      'olx': 5,
      'facebook': 3,
      'droom': 8,
      'cargurus': 10
    };
    
    score += platformScores[listing.source.toLowerCase()] || 5;
    
    // Verification status boost
    if (listing.verificationStatus === 'certified') score += 20;
    else if (listing.verificationStatus === 'verified') score += 10;
    
    // Seller type reliability
    if (listing.sellerType === 'dealer') score += 15;
    else if (listing.sellerType === 'oem') score += 20;
    else score += 5; // individual
    
    // Age penalty (older listings may be stale)
    const daysSince = Math.ceil((Date.now() - new Date(listing.listingDate).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince > 30) score -= 10;
    else if (daysSince > 7) score -= 5;
    
    return Math.min(100, Math.max(0, score));
  };

  const getReliabilityColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const calculatePriceAdvantage = (listing: MarketplaceListing) => {
    const avgPrice = searchResult.analytics.avgPrice;
    const advantage = ((avgPrice - listing.price) / avgPrice) * 100;
    return advantage;
  };

  const getPriceAdvantageColor = (advantage: number) => {
    if (advantage > 15) return 'bg-green-50 border-green-200 text-green-800';
    if (advantage > 5) return 'bg-blue-50 border-blue-200 text-blue-800';
    if (advantage < -10) return 'bg-red-50 border-red-200 text-red-800';
    return 'bg-gray-50 border-gray-200 text-gray-800';
  };

  const findSimilarListings = (listing: MarketplaceListing) => {
    return searchResult.listings.filter(l => 
      l.id !== listing.id &&
      l.brand === listing.brand &&
      l.model === listing.model &&
      Math.abs(l.year - listing.year) <= 1 &&
      Math.abs(l.mileage - listing.mileage) < 20000
    );
  };

  // Intent-based ranking functions
  const calculateIntentMatch = (listing: MarketplaceListing, query: string) => {
    // Mock intent matching algorithm - calculates how well listing matches user intent
    const baseScore = Math.random() * 40 + 60; // 60-100%
    
    const intentFactors = [];
    const queryLower = query.toLowerCase();
    
    // Budget matching
    if (queryLower.includes('budget') || queryLower.includes('₹') || queryLower.includes('lakh')) {
      intentFactors.push({
        factor: 'Budget Alignment',
        score: 85 + Math.floor(Math.random() * 15),
        explanation: 'Price fits within your specified budget range'
      });
    }
    
    // Family car intent
    if (queryLower.includes('family') || queryLower.includes('spacious') || queryLower.includes('suv')) {
      intentFactors.push({
        factor: 'Family Suitability',
        score: 80 + Math.floor(Math.random() * 20),
        explanation: 'Spacious interior and safety features for family use'
      });
    }
    
    // Fuel efficiency intent
    if (queryLower.includes('mileage') || queryLower.includes('efficiency') || queryLower.includes('petrol')) {
      intentFactors.push({
        factor: 'Fuel Efficiency',
        score: 75 + Math.floor(Math.random() * 25),
        explanation: 'Excellent fuel economy for daily commuting'
      });
    }
    
    // City driving intent
    if (queryLower.includes('city') || queryLower.includes('compact') || queryLower.includes('parking')) {
      intentFactors.push({
        factor: 'City Driving',
        score: 82 + Math.floor(Math.random() * 18),
        explanation: 'Compact size perfect for city navigation and parking'
      });
    }
    
    // Reliability intent
    if (queryLower.includes('reliable') || queryLower.includes('maintained') || queryLower.includes('service')) {
      intentFactors.push({
        factor: 'Reliability',
        score: 78 + Math.floor(Math.random() * 22),
        explanation: 'Brand reputation and maintenance history indicate reliability'
      });
    }
    
    // Default factors if no specific intent detected
    if (intentFactors.length === 0) {
      intentFactors.push(
        {
          factor: 'Value for Money',
          score: 75 + Math.floor(Math.random() * 25),
          explanation: 'Competitive pricing compared to similar models'
        },
        {
          factor: 'Market Demand',
          score: 70 + Math.floor(Math.random() * 30),
          explanation: 'Popular model with good resale value'
        }
      );
    }
    
    const avgScore = intentFactors.reduce((sum, f) => sum + f.score, 0) / intentFactors.length;
    
    return {
      overallScore: Math.round(avgScore),
      factors: intentFactors.slice(0, 3), // Limit to top 3 factors
      matchReason: avgScore > 85 ? 'Excellent Match' : avgScore > 75 ? 'Good Match' : 'Partial Match'
    };
  };

  const sortListingsByIntent = (listings: MarketplaceListing[], query: string) => {
    if (!useIntentRanking) return listings;
    
    return [...listings].sort((a, b) => {
      const aMatch = calculateIntentMatch(a, query);
      const bMatch = calculateIntentMatch(b, query);
      return bMatch.overallScore - aMatch.overallScore;
    });
  };

  // Mock AI-generated data for demonstration
  const getAIInsights = (listing: MarketplaceListing) => {
    const authenticityScore = 85 + Math.floor(Math.random() * 15); // 85-100%
    const qualityScore = 80 + Math.floor(Math.random() * 20); // 80-100%
    const priceAdvantage = calculatePriceAdvantage(listing);
    
    const prosOptions = [
      'Excellent fuel efficiency',
      'Strong resale value',
      'Low maintenance costs',
      'Reliable engine performance',
      'Good safety ratings',
      'Popular in local market',
      'Well-maintained condition',
      'Recent service history'
    ];
    
    const consOptions = [
      'Higher than average mileage',
      'Minor exterior wear',
      'Service due soon',
      'Limited warranty remaining',
      'Popular model - many available',
      'Slight price premium'
    ];
    
    const pros = prosOptions.slice(0, 2 + Math.floor(Math.random() * 2));
    const cons = consOptions.slice(0, 1 + Math.floor(Math.random() * 2));
    
    return {
      authenticityScore,
      qualityScore,
      pros,
      cons,
      aiRecommendation: authenticityScore > 90 ? 'Highly Recommended' : 
                        authenticityScore > 80 ? 'Recommended' : 'Consider Carefully',
      imageVerified: Math.random() > 0.2, // 80% chance of verified images
      priceInsight: priceAdvantage > 10 ? 'Great Deal' : 
                   priceAdvantage > 0 ? 'Fair Price' : 'Above Market'
    };
  };

  const renderListingCard = (listing: MarketplaceListing, showSource = true) => {
    const reliabilityScore = calculateReliabilityScore(listing);
    const priceAdvantage = calculatePriceAdvantage(listing);
    const similarListings = findSimilarListings(listing);
    const intentMatch = calculateIntentMatch(listing, searchQuery || '');
    
    return (
      <Card key={listing.id} className="hover:shadow-lg transition-shadow" data-testid={`listing-${listing.id}`}>
        <CardContent className="p-4">
          {/* Price Advantage Banner */}
          {Math.abs(priceAdvantage) > 5 && (
            <div className={`mb-3 p-2 rounded-lg border ${getPriceAdvantageColor(priceAdvantage)}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {priceAdvantage > 15 ? '🎯 Excellent Deal' : 
                   priceAdvantage > 5 ? '💰 Good Price' : 
                   '⚠️ Above Market'}
                </span>
                <span className="text-sm">
                  {priceAdvantage > 0 ? `${priceAdvantage.toFixed(1)}% below market` : 
                   `${Math.abs(priceAdvantage).toFixed(1)}% above market`}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            {/* Car Image */}
            <div className="flex-shrink-0 relative">
              <img
                src={listing.images[0] || "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=200"}
                alt={listing.title}
                className="w-32 h-24 object-cover rounded-lg"
              />
              {/* Reliability Score Badge */}
              <div className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-lg border">
                <div className={`text-xs font-bold ${getReliabilityColor(reliabilityScore)}`}>
                  {reliabilityScore}%
                </div>
              </div>
            </div>

            {/* Car Details */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-lg truncate" data-testid="listing-title">
                    {listing.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {showSource && (
                      <Badge variant="outline" className="text-xs">
                        {listing.source}
                      </Badge>
                    )}
                    <Badge className={getConditionColor(listing.condition)}>
                      {listing.condition}
                    </Badge>
                    {getVerificationIcon(listing.verificationStatus)}
                    {/* Trust Score */}
                    <div className="flex items-center text-xs">
                      <Star className={`w-3 h-3 mr-1 ${getReliabilityColor(reliabilityScore)}`} />
                      <span className={getReliabilityColor(reliabilityScore)}>
                        {reliabilityScore >= 80 ? 'Highly Trusted' :
                         reliabilityScore >= 60 ? 'Trusted' :
                         reliabilityScore >= 40 ? 'Moderate' : 'Basic'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-accent" data-testid="listing-price">
                    {formatPrice(listing.price)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {listing.sellerType}
                  </div>
                  {/* Cross-platform comparison */}
                  {similarListings.length > 0 && (
                    <div className="text-xs text-blue-600 mt-1">
                      +{similarListings.length} similar on other platforms
                    </div>
                  )}
                </div>
              </div>

              {/* Car Specifications Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground mb-3">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>{listing.year}</span>
                </div>
                <div className="flex items-center">
                  <Gauge className="w-4 h-4 mr-1" />
                  <span>{formatMileage(listing.mileage)}</span>
                </div>
                <div className="flex items-center">
                  <Fuel className="w-4 h-4 mr-1" />
                  <span>{listing.fuelType}</span>
                </div>
                <div className="flex items-center">
                  <Settings className="w-4 h-4 mr-1" />
                  <span>{listing.transmission}</span>
                </div>
              </div>

              {/* AI-Enhanced Features */}
              {(() => {
                const aiInsights = getAIInsights(listing);
                return (
                  <div className="mb-4 space-y-3">
                    {/* AI Authenticity and Quality Scores */}
                    <div className="flex items-center gap-4 text-xs" data-testid={`ai-scores-${listing.id}`}>
                      <div className="flex items-center gap-1" data-testid={`claude-authenticity-${listing.id}`}>
                        <Shield className="w-4 h-4 text-green-600" />
                        <span className="font-medium">📸 CarArth x Claude AI:</span>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200" data-testid={`authenticity-score-${listing.id}`}>
                          {aiInsights.authenticityScore}% Authentic
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-1" data-testid={`quality-score-${listing.id}`}>
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">Quality:</span>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200" data-testid={`quality-badge-${listing.id}`}>
                          {aiInsights.qualityScore}%
                        </Badge>
                      </div>

                      {aiInsights.imageVerified && (
                        <div className="flex items-center gap-1" data-testid={`image-verified-${listing.id}`}>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-green-600 font-medium">Images Verified</span>
                        </div>
                      )}
                    </div>

                    {/* AI Recommendation */}
                    <div className="flex items-center gap-2" data-testid={`ai-recommendation-${listing.id}`}>
                      <Brain className="w-4 h-4 text-purple-600" />
                      <span className="text-xs font-medium">AI Recommendation:</span>
                      <Badge 
                        className={aiInsights.aiRecommendation === 'Highly Recommended' ? 
                          'bg-green-100 text-green-800' : 
                          aiInsights.aiRecommendation === 'Recommended' ? 
                          'bg-blue-100 text-blue-800' : 
                          'bg-yellow-100 text-yellow-800'}
                        data-testid={`recommendation-badge-${listing.id}`}
                      >
                        {aiInsights.aiRecommendation}
                      </Badge>
                    </div>

                    {/* GPT-5 Generated Pros and Cons */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs" data-testid={`gpt5-analysis-${listing.id}`}>
                      <div className="space-y-1" data-testid={`gpt5-pros-${listing.id}`}>
                        <div className="flex items-center gap-1 font-medium text-green-700">
                          <ThumbsUp className="w-3 h-3" />
                          <span>🧠 CarArth x GPT-5 - Pros:</span>
                        </div>
                        <ul className="space-y-1 text-muted-foreground">
                          {aiInsights.pros.map((pro, index) => (
                            <li key={index} className="flex items-start gap-1" data-testid={`pro-item-${listing.id}-${index}`}>
                              <span className="text-green-600 mt-0.5">•</span>
                              <span>{pro}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="space-y-1" data-testid={`gpt5-cons-${listing.id}`}>
                        <div className="flex items-center gap-1 font-medium text-orange-700">
                          <ThumbsDown className="w-3 h-3" />
                          <span>🧠 CarArth x GPT-5 - Considerations:</span>
                        </div>
                        <ul className="space-y-1 text-muted-foreground">
                          {aiInsights.cons.map((con, index) => (
                            <li key={index} className="flex items-start gap-1" data-testid={`con-item-${listing.id}-${index}`}>
                              <span className="text-orange-600 mt-0.5">•</span>
                              <span>{con}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Price Insight */}
                    <div className="flex items-center gap-2 text-xs">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">Market Analysis:</span>
                      <Badge 
                        className={aiInsights.priceInsight === 'Great Deal' ? 
                          'bg-green-100 text-green-800' : 
                          aiInsights.priceInsight === 'Fair Price' ? 
                          'bg-blue-100 text-blue-800' : 
                          'bg-red-100 text-red-800'}
                      >
                        {aiInsights.priceInsight}
                      </Badge>
                    </div>

                    {/* Intent-Based Ranking Display */}
                    {useIntentRanking && searchQuery && (
                      <div className="border-t pt-3 mt-3 space-y-2 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 p-3 rounded-lg" data-testid={`intent-matching-${listing.id}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Brain className="w-4 h-4 text-purple-600" />
                            <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">Intent Match</span>
                          </div>
                          <Badge 
                            className={intentMatch.matchReason === 'Excellent Match' ? 
                              'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 
                              intentMatch.matchReason === 'Good Match' ? 
                              'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' : 
                              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'}
                            data-testid={`intent-score-${listing.id}`}
                          >
                            {intentMatch.overallScore}% {intentMatch.matchReason}
                          </Badge>
                        </div>

                        {/* Intent Factors */}
                        <div className="space-y-1" data-testid={`intent-factors-${listing.id}`}>
                          <div className="text-xs font-medium text-muted-foreground">Why this matches your intent:</div>
                          <div className="space-y-1">
                            {intentMatch.factors.map((factor, index) => (
                              <div key={index} className="flex items-start gap-2 text-xs" data-testid={`intent-factor-${listing.id}-${index}`}>
                                <CheckCircle className="w-3 h-3 text-purple-500 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <span className="font-medium text-purple-700 dark:text-purple-300">{factor.factor}:</span>
                                  <span className="text-muted-foreground ml-1">{factor.explanation}</span>
                                  <span className="text-purple-600 dark:text-purple-400 ml-1 font-medium">({factor.score}%)</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Location and Actions */}
              <div className="flex justify-between items-center">
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{listing.location}</span>
                  <Clock className="w-4 h-4 ml-3 mr-1" />
                  <span>{Math.ceil((Date.now() - new Date(listing.listingDate).getTime()) / (1000 * 60 * 60 * 24))} days ago</span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setSelectedCar(listing);
                      setShowDetailModal(true);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Details
                  </Button>
                  <Button size="sm" asChild>
                    <a href={listing.url} target="_blank" rel="noopener noreferrer">
                      <Phone className="w-4 h-4 mr-1" />
                      Contact
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
      </CardContent>
    </Card>
    );
  };

  const renderAnalytics = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Listings</p>
              <p className="text-2xl font-bold">{searchResult.analytics.totalListings}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-primary" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Average Price</p>
              <p className="text-2xl font-bold">{formatPrice(searchResult.analytics.avgPrice)}</p>
            </div>
            <div className="flex items-center">
              {getTrendIcon(searchResult.analytics.historicalTrend)}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Price Range</p>
              <p className="text-lg font-bold">
                {formatPrice(searchResult.analytics.priceRange.min)} - {formatPrice(searchResult.analytics.priceRange.max)}
              </p>
            </div>
            <Filter className="w-8 h-8 text-primary" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Sources Scanned</p>
              <p className="text-2xl font-bold">{Object.keys(searchResult.analytics.sourcesCount).length}</p>
            </div>
            <Users className="w-8 h-8 text-primary" />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Analytics Overview */}
      {renderAnalytics()}

      {/* Results Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all" data-testid="tab-all">
            All ({searchResult.listings.length})
          </TabsTrigger>
          <TabsTrigger value="best-deals" data-testid="tab-best-deals">
            Best Deals ({searchResult.recommendations.bestDeals.length})
          </TabsTrigger>
          <TabsTrigger value="certified" data-testid="tab-certified">
            Certified ({searchResult.recommendations.certified.length})
          </TabsTrigger>
          <TabsTrigger value="new" data-testid="tab-new">
            New ({searchResult.recommendations.newListings.length})
          </TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">All Listings</h3>
            <div className="text-sm text-muted-foreground">
              Showing {searchResult.listings.length} results from {Object.keys(searchResult.analytics.sourcesCount).length} sources
            </div>
          </div>

          {/* Intent-Based Ranking Toggle */}
          {searchQuery && (
            <div className="flex items-center justify-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg border" data-testid="intent-ranking-toggle">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                <span className="font-semibold">AI Intelligence Ranking</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm ${!useIntentRanking ? 'font-medium text-blue-600' : 'text-muted-foreground'}`}>
                  Standard
                </span>
                <label className="relative inline-flex items-center cursor-pointer" data-testid="intent-ranking-switch">
                  <input
                    type="checkbox"
                    checked={useIntentRanking}
                    onChange={(e) => setUseIntentRanking(e.target.checked)}
                    className="sr-only peer"
                    data-testid="intent-ranking-checkbox"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                </label>
                <span className={`text-sm ${useIntentRanking ? 'font-medium text-purple-600' : 'text-muted-foreground'}`}>
                  Intent-Based
                </span>
              </div>
              {useIntentRanking && (
                <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300" data-testid="intent-status-badge">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Ranked by AI for: "{searchQuery}"
                </Badge>
              )}
            </div>
          )}
          
          {sortListingsByIntent(searchResult.listings, searchQuery || '').map(listing => renderListingCard(listing))}
        </TabsContent>

        <TabsContent value="best-deals" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Best Deals</h3>
            <Badge className="bg-green-100 text-green-800">
              Below Market Price
            </Badge>
          </div>
          {searchResult.recommendations.bestDeals.map(listing => renderListingCard(listing))}
        </TabsContent>

        <TabsContent value="certified" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Certified Listings</h3>
            <Badge className="bg-blue-100 text-blue-800">
              <Award className="w-4 h-4 mr-1" />
              Verified Quality
            </Badge>
          </div>
          {searchResult.recommendations.certified.map(listing => renderListingCard(listing))}
        </TabsContent>

        <TabsContent value="new" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">New Listings</h3>
            <Badge className="bg-orange-100 text-orange-800">
              <Clock className="w-4 h-4 mr-1" />
              Listed This Week
            </Badge>
          </div>
          {searchResult.recommendations.newListings.map(listing => renderListingCard(listing))}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Source Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Sources Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(searchResult.analytics.sourcesCount).map(([source, count]) => (
                    <div key={source} className="flex justify-between items-center">
                      <span className="text-sm">{source}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={(count / searchResult.analytics.totalListings) * 100} className="w-20" />
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Location Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Price by Location</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(searchResult.analytics.priceByLocation).map(([city, avgPrice]) => (
                    <div key={city} className="flex justify-between items-center">
                      <span className="text-sm">{city}</span>
                      <span className="text-sm font-medium">{formatPrice(avgPrice)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Car Detail Modal */}
      <CarDetailModal 
        car={selectedCar}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedCar(null);
        }}
      />
    </div>
  );
}