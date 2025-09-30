import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { FullWidthLayout } from "@/components/layout";
import HeroSection from "@/components/hero-section";
import UnifiedFilters from "@/components/unified-filters";
import TheAssistant from "@/components/the-assistant";
import MinimalCarCard from "@/components/minimal-car-card";
import MarketplaceResults from "@/components/marketplace-results";
import FeaturedListingModal from "@/components/featured-listing-modal";
import PremiumUpgrade from "@/components/premium-upgrade";
import RecentlyViewed from "@/components/recently-viewed";
import SearchLimitPopup from "@/components/search-limit-popup";
import { HapticProvider, useHapticFeedback, HapticButton } from "@/components/haptic-feedback";
import { SEOHead, createWebsiteSchema, createOrganizationSchema } from "@/components/seo-head";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Search, Globe, Star, Crown, MessageSquare, Users, Phone } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type CarListing } from "@shared/schema";

// Type definition for usage status data
interface UsageStatus {
  isAuthenticated: boolean;
  searchesLeft: number;
  totalLimit: number;
}
import { BrandWordmark } from "@/components/brand-wordmark";
import { Link } from "wouter";

function HomeContent() {
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [sortBy, setSortBy] = useState("price-low");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("local");
  const [marketplaceResult, setMarketplaceResult] = useState<any>(null);
  const [marketplaceError, setMarketplaceError] = useState<string | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showFeaturedModal, setShowFeaturedModal] = useState(false);
  const [selectedCarForFeatured, setSelectedCarForFeatured] = useState<{id: string, title: string} | null>(null);
  const [showSearchLimitPopup, setShowSearchLimitPopup] = useState(false);
  const [searchLimitData, setSearchLimitData] = useState<any>(null);
  const [usageStatus, setUsageStatus] = useState<any>(null);
  const [currentSearchQuery, setCurrentSearchQuery] = useState<string>('');
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [selectedCarForContact, setSelectedCarForContact] = useState<{id: string, title: string} | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  
  const { feedback } = useHapticFeedback();

  // Dynamic SEO based on search filters
  const dynamicSEO = useMemo(() => {
    const hasFilters = Object.keys(filters).length > 0;
    let title = "CarArth - India's Very Own Used Car Search Engine";
    let description = "India's very own used car search engine. Compare cars across platforms, discover true value with AI intelligence. Buy & sell with confidence on CarArth.";
    
    if (hasFilters) {
      const filterParts = [];
      if (filters.brand) filterParts.push(filters.brand);
      if (filters.model) filterParts.push(filters.model);
      if (filters.city) filterParts.push(`in ${filters.city}`);
      if (filters.fuelType) filterParts.push(filters.fuelType);
      
      if (filterParts.length > 0) {
        title = `${filterParts.join(' ')} Used Cars - CarArth`;
        description = `Find ${filterParts.join(' ')} used cars on CarArth. Compare prices across all major platforms with AI intelligence. Authentic listings, verified sellers.`;
      }
    }
    
    return { title, description };
  }, [filters]);

  // Structured data for homepage
  const structuredData = useMemo(() => {
    const baseSchema = createWebsiteSchema();
    const orgSchema = createOrganizationSchema();
    
    return {
      "@context": "https://schema.org",
      "@graph": [baseSchema, orgSchema]
    };
  }, []);

  const { data: cars = [], isLoading } = useQuery<CarListing[]>({
    queryKey: ["/api/marketplace/search", filters],
    queryFn: async () => {
      const searchFilters = {
        brand: filters.brand,
        model: filters.model,
        priceMin: filters.priceMin,
        priceMax: filters.priceMax,
        fuelType: filters.fuelType ? [filters.fuelType] : undefined,
        transmission: filters.transmission ? [filters.transmission] : undefined,
        city: filters.city,
        sortBy: "price",
        sortOrder: "asc",
        limit: 10
      };

      try {
        const response = await apiRequest('POST', '/api/marketplace/search', searchFilters);
        const result = await response.json();
        console.log('🔍 DEBUG API response images:', result.listings?.slice(0, 2)?.map((c: CarListing) => ({ title: c.title, images: c.images })));
        
        // Manually refresh usage status after successful local search
        queryClient.invalidateQueries({ queryKey: ["/api/usage/status"] });
        
        return result.listings || [];
      } catch (error: any) {
        if (error.isSearchLimitExceeded) {
          // Handle search limit exceeded - show popup
          setSearchLimitData(error.data);
          setShowSearchLimitPopup(true);
          return []; // Return empty results
        }
        throw error; // Re-throw other errors
      }
    },
  });

  // FIXED: Removed sortedCars reference that was causing component crash

  const handleHeroSearch = (searchFilters: any) => {
    console.log('🔍 Hero search called with:', searchFilters);
    setHasSearched(true);
    setActiveTab("marketplace");
    
    // Create search query string for AI display
    const queryParts = [];
    if (searchFilters.brand && searchFilters.brand !== "all") queryParts.push(searchFilters.brand);
    if (searchFilters.city && searchFilters.city !== "all") queryParts.push(searchFilters.city);
    if (searchFilters.fuelType && searchFilters.fuelType !== "all") queryParts.push(searchFilters.fuelType);
    if (searchFilters.budget && searchFilters.budget !== "all") {
      const [min, max] = searchFilters.budget.split("-").map(Number);
      if (min && max && max !== 99999999) {
        queryParts.push(`₹${min/100000}L-${max/100000}L`);
      }
    }
    setCurrentSearchQuery(queryParts.join(' ') || 'All Cars');
    
    // Convert hero search to marketplace search format
    const marketplaceFilters: any = {
      limit: 50,
      sortBy: "price",
      sortOrder: "asc"
    };
    
    if (searchFilters.brand && searchFilters.brand !== "all") {
      marketplaceFilters.brand = searchFilters.brand;
      console.log('✅ Brand filter set to:', searchFilters.brand);
    }
    if (searchFilters.city && searchFilters.city !== "all") {
      marketplaceFilters.city = searchFilters.city;
    }
    if (searchFilters.fuelType && searchFilters.fuelType !== "all") {
      marketplaceFilters.fuelType = [searchFilters.fuelType];
    }
    
    if (searchFilters.budget && searchFilters.budget !== "all") {
      const [min, max] = searchFilters.budget.split("-").map(Number);
      if (min) marketplaceFilters.priceMin = min;
      if (max && max !== 99999999) marketplaceFilters.priceMax = max;
    }
    
    console.log('🔄 Converted to marketplace filters:', marketplaceFilters);
    
    // Call marketplace search
    handleMarketplaceSearch(marketplaceFilters);
  };

  const handleFilterChange = (filterData: any) => {
    const newFilters: Record<string, any> = {};
    
    // Handle budget range
    if (filterData.budgetRange && Array.isArray(filterData.budgetRange) && filterData.budgetRange.length >= 2) {
      if (filterData.budgetRange[0] > 0 || filterData.budgetRange[1] < 2000000) {
        newFilters.priceMin = filterData.budgetRange[0];
        newFilters.priceMax = filterData.budgetRange[1];
      }
    }
    
    // Handle other filters
    if (filterData.brand && filterData.brand !== 'all') {
      newFilters.brand = filterData.brand;
    }
    if (filterData.model) {
      newFilters.model = filterData.model;
    }
    if (filterData.fuelType && filterData.fuelType !== 'all') {
      newFilters.fuelType = filterData.fuelType;
    }
    if (filterData.transmission && filterData.transmission !== 'all') {
      newFilters.transmission = filterData.transmission;
    }
    if (filterData.city && filterData.city !== 'all') {
      newFilters.city = filterData.city;
    }
    if (filterData.location) {
      newFilters.city = filterData.location;
    }
    
    console.log('🔧 Applied filters:', newFilters);
    feedback.selection(); // Haptic feedback on filter change
    setFilters(newFilters);
    
    // Auto-trigger marketplace search when filters change for better UX
    if (Object.keys(newFilters).length > 0) {
      setTimeout(() => {
        const searchFilters: any = { sortBy: "price", sortOrder: "asc" };
        
        if (newFilters.brand) searchFilters.brand = newFilters.brand;
        if (newFilters.city) searchFilters.city = newFilters.city;
        if (newFilters.fuelType) searchFilters.fuelType = [newFilters.fuelType];
        if (newFilters.transmission) searchFilters.transmission = newFilters.transmission;
        if (newFilters.priceMin) searchFilters.priceMin = newFilters.priceMin;
        if (newFilters.priceMax) searchFilters.priceMax = newFilters.priceMax;
        
        console.log('🔄 Auto-search triggered with filters:', searchFilters);
        setHasSearched(true);
        handleMarketplaceSearch(searchFilters);
      }, 500); // Small delay to batch rapid filter changes
    }
  };

  const handleFavoriteToggle = (carId: string) => {
    feedback.selection(); // Haptic feedback for favorite action
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(carId)) {
        newFavorites.delete(carId);
      } else {
        newFavorites.add(carId);
      }
      return newFavorites;
    });
  };

  const handleContactSeller = (carId: string) => {
    const car = cars.find(c => c.id === carId);
    if (car) {
      feedback.button(); // Haptic feedback for button action
      setSelectedCarForContact({ id: carId, title: car.title });
      setShowContactDialog(true);
    }
  };

  const handleAdvancedSearch = () => {
    feedback.button(); // Haptic feedback for search action
    setHasSearched(true);
    
    // Convert filters to marketplace search format
    const searchFilters: any = {
      sortBy: "price",
      sortOrder: "asc"
    };
    
    if (filters.brand && filters.brand !== "all") {
      searchFilters.brand = filters.brand;
    }
    if (filters.city && filters.city !== "all") {
      searchFilters.city = filters.city;
    }
    if (filters.fuelType && filters.fuelType !== "all") {
      searchFilters.fuelType = [filters.fuelType];
    }
    if (filters.transmission && filters.transmission !== "all") {
      searchFilters.transmission = filters.transmission;
    }
    if (filters.priceMin) {
      searchFilters.priceMin = filters.priceMin;
    }
    if (filters.priceMax) {
      searchFilters.priceMax = filters.priceMax;
    }
    if (filters.yearMin) {
      searchFilters.yearMin = filters.yearMin;
    }
    if (filters.yearMax) {
      searchFilters.yearMax = filters.yearMax;
    }
    
    console.log('🔄 Advanced search with filters:', searchFilters);
    handleMarketplaceSearch(searchFilters);
  };

  const handleMakeFeatured = (car: CarListing) => {
    setSelectedCarForFeatured({ id: car.id, title: car.title });
    setShowFeaturedModal(true);
  };

  // Usage status query for showing remaining searches
  const { data: usageStatusData } = useQuery({
    queryKey: ["/api/usage/status"],
    refetchOnWindowFocus: true, // Refetch when user returns to window
    staleTime: 5 * 60 * 1000, // Data is fresh for 5 minutes
    // Removed excessive refetchInterval to reduce server load
  });

  const marketplaceSearch = useMutation({
    mutationFn: async (searchFilters: any) => {
      console.log('🌐 Marketplace search with filters:', searchFilters);
      
      // Create a timeout controller for the request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes timeout
      
      try {
        const response = await fetch('/api/marketplace/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Visitor-ID': await (await import('@/lib/visitorId')).getVisitorId(),
          },
          body: JSON.stringify(searchFilters),
          credentials: 'include',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Search failed: ${errorText}`);
        }
        
        return response.json();
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error('Search is taking longer than expected. Please try again with more specific filters.');
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('✅ Marketplace search successful:', data);
      
      // Manually refetch usage status after search to update remaining searches
      queryClient.invalidateQueries({ queryKey: ["/api/usage/status"] });
      
      // Auto-switch to All Portals tab to show search results
      setActiveTab("marketplace");
      
      // Transform API response to match MarketplaceResults expected structure
      const transformedResult = {
        listings: data.listings || [],
        analytics: {
          totalListings: data.total || 0,
          avgPrice: data.listings && data.listings.length > 0 ? 
            data.listings.reduce((sum: number, car: any) => sum + car.price, 0) / data.listings.length : 0,
          priceRange: {
            min: data.listings && data.listings.length > 0 ? 
              Math.min(...data.listings.map((car: any) => car.price)) : 0,
            max: data.listings && data.listings.length > 0 ? 
              Math.max(...data.listings.map((car: any) => car.price)) : 0
          },
          mostCommonFuelType: 'Petrol', // Default for now
          avgMileage: data.listings && data.listings.length > 0 ? 
            data.listings.reduce((sum: number, car: any) => sum + car.mileage, 0) / data.listings.length : 0,
          sourcesCount: data.listings ? 
            data.listings.reduce((acc: Record<string, number>, car: any) => {
              acc[car.source] = (acc[car.source] || 0) + 1;
              return acc;
            }, {}) : {},
          locationDistribution: data.listings ? 
            data.listings.reduce((acc: Record<string, number>, car: any) => {
              acc[car.city || car.location] = (acc[car.city || car.location] || 0) + 1;
              return acc;
            }, {}) : {},
          priceByLocation: {},
          historicalTrend: 'stable' as const
        },
        recommendations: {
          bestDeals: data.listings ? data.listings.slice(0, 3) : [],
          overpriced: [],
          newListings: data.listings ? data.listings.slice(0, 5) : [],
          certified: data.listings ? data.listings.filter((car: any) => car.verificationStatus === 'certified').slice(0, 3) : []
        }
      };
      
      setMarketplaceResult(transformedResult);
      setMarketplaceError(null);
    },
    onError: (error: any) => {
      console.error('❌ Marketplace search failed:', error);
      
      // Handle search limit exceeded
      if (error.isSearchLimitExceeded) {
        console.log('🔥 Search limit exceeded in marketplace search');
        setSearchLimitData(error.data);
        setShowSearchLimitPopup(true);
        setMarketplaceResult(null);
      } else {
        setMarketplaceError(error.message || 'Failed to search marketplace');
        setMarketplaceResult(null);
      }
    }
  });

  const handleMarketplaceSearch = (searchFilters: any) => {
    console.log('🔄 Starting marketplace search...');
    
    // Update search query if not already set
    if (!currentSearchQuery) {
      const queryParts = [];
      if (searchFilters.brand) queryParts.push(searchFilters.brand);
      if (searchFilters.city) queryParts.push(searchFilters.city);
      if (searchFilters.fuelType) queryParts.push(searchFilters.fuelType);
      if (searchFilters.priceMin || searchFilters.priceMax) {
        const min = searchFilters.priceMin || 0;
        const max = searchFilters.priceMax || 1000000;
        queryParts.push(`₹${min/100000}L-${max/100000}L`);
      }
      setCurrentSearchQuery(queryParts.join(' ') || 'All Cars');
    }
    
    // Clean up filters
    const cleanFilters = { ...searchFilters };
    Object.keys(cleanFilters).forEach(key => {
      if (cleanFilters[key] === undefined || cleanFilters[key] === null) {
        delete cleanFilters[key];
      }
      // Convert empty string brand to undefined so backend handles it correctly
      if (key === 'brand' && cleanFilters[key] === "") {
        delete cleanFilters[key];
      }
    });
    
    marketplaceSearch.mutate(cleanFilters);
  };

  const sortedCars = useMemo(() => {
    return [...cars].sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return parseFloat(a.price) - parseFloat(b.price);
        case "price-high":
          return parseFloat(b.price) - parseFloat(a.price);
        case "year-new":
          return b.year - a.year;
        case "mileage-low":
          return (a.mileage || 0) - (b.mileage || 0);
        default:
          return 0;
      }
    });
  }, [cars, sortBy]);

  return (
    <FullWidthLayout>
      <SEOHead 
        title={dynamicSEO.title}
        description={dynamicSEO.description}
        keywords="used cars India, car search engine, compare cars, authentic car listings, AI car recommendations, cross-platform car search, car marketplace India, used car price comparison, CarDekho, OLX, Cars24"
        structuredData={structuredData}
        canonical="https://cararth.com/"
      />
      <div>
        <HeroSection 
          onSearch={handleHeroSearch}
          hasSearched={hasSearched}
          isSearching={marketplaceSearch.isPending}
        />
        
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6 sm:mb-8">
            <TabsList className="grid w-full grid-cols-2 h-12 sm:h-14">
              <TabsTrigger value="local" className="flex items-center gap-2 text-sm sm:text-base font-medium">
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Local Listings ({cars.length})</span>
                <span className="sm:hidden">Local ({cars.length})</span>
              </TabsTrigger>
              <TabsTrigger value="marketplace" className="flex items-center gap-2 text-sm sm:text-base font-medium">
                <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">
                  {marketplaceResult ? 
                    `Search Results (${marketplaceResult.analytics?.totalListings || 0})` : 
                    'All Portals'
                  }
                </span>
                <span className="sm:hidden">
                  {marketplaceResult ? 
                    `Results (${marketplaceResult.analytics?.totalListings || 0})` : 
                    'Portals'
                  }
                </span>
                {(() => {
                  const usage = usageStatusData as UsageStatus | undefined;
                  return usage && !usage.isAuthenticated ? (
                    <Badge variant="secondary" className="text-xs ml-1">
                      <span className="hidden sm:inline">{usage.searchesLeft}/{usage.totalLimit} in 30d</span>
                      <span className="sm:hidden">{usage.searchesLeft}/{usage.totalLimit}</span>
                    </Badge>
                  ) : null;
                })()}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="local">
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="lg:w-1/4 space-y-6">
                  <UnifiedFilters 
                    filters={filters}
                    onFiltersChange={handleFilterChange}
                    onSearch={handleAdvancedSearch}
                  />
                  
                  {/* AI Assistant - Less prominent position */}
                  <div className="hidden lg:block">
                    <div className="scale-90 transform origin-top">
                      <TheAssistant 
                        isAuthenticated={false}
                        userEmail={null}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="lg:w-3/4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold" data-testid="text-results-title">
                      Verified Cars in India
                    </h2>
                    <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
                      <span className="text-muted-foreground text-sm">Sort:</span>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-full sm:w-48 min-h-[44px]" data-testid="select-sort">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="price-low">Price: Low to High</SelectItem>
                          <SelectItem value="price-high">Price: High to Low</SelectItem>
                          <SelectItem value="year-new">Year: Newest First</SelectItem>
                          <SelectItem value="mileage-low">Mileage: Low to High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {isLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-card border border-border rounded-lg overflow-hidden animate-pulse">
                          <div className="w-full h-48 bg-muted"></div>
                          <div className="p-4 space-y-3">
                            <div className="h-6 bg-muted rounded w-3/4"></div>
                            <div className="h-8 bg-muted rounded w-1/2"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {!isLoading && (
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8" data-testid="grid-car-listings">
                        {sortedCars.map((car) => (
                          <MinimalCarCard
                            key={car.id}
                            car={car}
                            onFavoriteToggle={handleFavoriteToggle}
                            isFavorite={favorites.has(car.id)}
                            onContactSeller={handleContactSeller}
                          />
                        ))}
                      </div>
                      
                      {sortedCars.length === 0 && (
                        <div className="text-center py-12" data-testid="text-no-results">
                          <p className="text-muted-foreground text-lg">No cars found matching your criteria.</p>
                          <p className="text-muted-foreground">Try adjusting your filters to see more results.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="marketplace">
              {marketplaceResult ? (
                <MarketplaceResults 
                  searchResult={marketplaceResult}
                  isLoading={marketplaceSearch.isPending}
                  error={marketplaceError}
                  searchQuery={currentSearchQuery}
                />
              ) : marketplaceSearch.isPending ? (
                <MarketplaceResults 
                  searchResult={null as any}
                  isLoading={true}
                  error={null}
                  searchQuery={currentSearchQuery}
                />
              ) : (
                <div className="text-center py-12">
                  <Globe className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Search Across All Portals</h3>
                  <p className="text-muted-foreground mb-4">
                    Use the advanced search above to find cars from CarDekho, OLX, Cars24, CarWale, and more.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Get comprehensive market insights, price comparisons, and access to thousands of verified listings.
                  </p>
                </div>
              )}
            </TabsContent>

          </Tabs>
          
          {/* Enterprise Partnership Section */}
          <div className="mt-6 sm:mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-4 sm:p-6 border border-blue-200 dark:border-blue-800">
            <div className="text-center">
              <h3 className="text-xl sm:text-2xl font-bold text-blue-800 dark:text-blue-200 mb-2 sm:mb-3">Enterprise Partnerships & Subscriptions</h3>
              <p className="text-sm sm:text-base text-blue-700 dark:text-blue-300 mb-3 sm:mb-4 max-w-2xl mx-auto">
                Looking for bulk car data, API access, or custom automotive solutions? Partner with CarArth for enterprise-level services.
              </p>
              <Button 
                onClick={() => {
                  window.location.href = 'mailto:connect@cararth.com?subject=Enterprise Partnership Inquiry&body=Hi! I\'m interested in enterprise partnerships and subscriptions with CarArth. Please share more details about your enterprise services.';
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-3 rounded-lg font-semibold text-sm sm:text-base min-h-[44px]"
                data-testid="button-enterprise-contact"
              >
                📧 email us: connect@cararth.com
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Limit Popup */}
      <SearchLimitPopup
        isOpen={showSearchLimitPopup}
        onClose={() => setShowSearchLimitPopup(false)}
        onSignUp={() => {
          console.log('🚀 Sign up clicked from search limit popup');
          // TODO: Implement sign up functionality
        }}
        onLogin={() => {
          console.log('🔑 Login clicked from search limit popup');
          // TODO: Implement login functionality
        }}
        data={searchLimitData}
      />

      {/* Contact Seller Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Contact Seller
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {selectedCarForContact?.title && `Interested in "${selectedCarForContact.title}"`}
            </p>
            <div className="flex flex-col gap-3">
              <HapticButton 
                className="w-full" 
                hapticType="button"
                onClick={() => {
                  feedback.success();
                  // TODO: Implement contact seller functionality
                  console.log('📞 Contact seller for car:', selectedCarForContact?.id);
                  setShowContactDialog(false);
                }}
              >
                <Phone className="w-4 h-4 mr-2" />
                Get Seller Contact
              </HapticButton>
              <Button 
                variant="outline" 
                onClick={() => setShowContactDialog(false)}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </FullWidthLayout>
  );
}

// Wrap everything in HapticProvider
export default function Home() {
  return (
    <HapticProvider>
      <HomeContent />
    </HapticProvider>
  );
}