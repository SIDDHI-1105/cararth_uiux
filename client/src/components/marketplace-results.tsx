import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import CarDetailModal from "@/components/car-detail-modal";
import { 
  TrendingUp, TrendingDown, Minus, ExternalLink, Verified, 
  MapPin, Calendar, Gauge, Fuel, Settings, Star, Filter,
  BarChart3, Users, Clock, Award, Eye, Phone
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
}

export default function MarketplaceResults({ searchResult, isLoading, error }: MarketplaceResultsProps) {
  const [selectedTab, setSelectedTab] = useState("all");
  const [sortBy, setSortBy] = useState("relevance");
  const [selectedCar, setSelectedCar] = useState<MarketplaceListing | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">Scanning Multiple Portals</h3>
              <p className="text-muted-foreground mb-4">
                Searching across CarDekho, OLX, Cars24, CarWale, AutoTrader and more...
              </p>
              <Progress value={45} className="w-full max-w-md mx-auto" />
            </div>
          </CardContent>
        </Card>
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
    const daysSince = Math.ceil((Date.now() - listing.listingDate.getTime()) / (1000 * 60 * 60 * 24));
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

  const renderListingCard = (listing: MarketplaceListing, showSource = true) => {
    const reliabilityScore = calculateReliabilityScore(listing);
    const priceAdvantage = calculatePriceAdvantage(listing);
    const similarListings = findSimilarListings(listing);
    
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

              {/* Location and Actions */}
              <div className="flex justify-between items-center">
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{listing.location}</span>
                  <Clock className="w-4 h-4 ml-3 mr-1" />
                  <span>{Math.ceil((Date.now() - listing.listingDate.getTime()) / (1000 * 60 * 60 * 24))} days ago</span>
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
          {searchResult.listings.map(listing => renderListingCard(listing))}
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