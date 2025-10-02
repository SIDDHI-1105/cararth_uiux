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
import { hasValidImages } from "@/lib/car-utils";

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
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showFeaturedModal, setShowFeaturedModal] = useState(false);
  const [selectedCarForFeatured, setSelectedCarForFeatured] = useState<{id: string, title: string} | null>(null);
  const [showSearchLimitPopup, setShowSearchLimitPopup] = useState(false);
  const [searchLimitData, setSearchLimitData] = useState<any>(null);
  const [usageStatus, setUsageStatus] = useState<any>(null);
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

  // Memoize filters to create stable query key
  const queryKeyFilters = useMemo(() => JSON.stringify(filters), [JSON.stringify(filters)]);
  
  const { data: cars = [], isLoading } = useQuery<CarListing[]>({
    queryKey: ["/api/marketplace/search", queryKeyFilters],
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
        limit: 50
      };

      try {
        const response = await apiRequest('POST', '/api/marketplace/search', searchFilters);
        const result = await response.json();
        
        // Manually refresh usage status after successful local search
        queryClient.invalidateQueries({ queryKey: ["/api/usage/status"] });
        
        const listings = result.listings || [];
        return listings;
      } catch (error: any) {
        console.error('❌ Local search error:', error);
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
    setHasSearched(true);
    setActiveTab("local");
    
    // Convert hero search to filter format
    const newFilters: Record<string, any> = {};
    
    if (searchFilters.brand && searchFilters.brand !== "all") {
      newFilters.brand = searchFilters.brand;
    }
    if (searchFilters.city && searchFilters.city !== "all") {
      newFilters.city = searchFilters.city;
    }
    if (searchFilters.fuelType && searchFilters.fuelType !== "all") {
      newFilters.fuelType = searchFilters.fuelType;
    }
    if (searchFilters.budget && searchFilters.budget !== "all") {
      const [min, max] = searchFilters.budget.split("-").map(Number);
      if (min) newFilters.priceMin = min;
      if (max && max !== 99999999) newFilters.priceMax = max;
    }
    
    // Update filters state - this will trigger the local query to refetch
    setFilters(newFilters);
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
    
    feedback.selection(); // Haptic feedback on filter change
    setFilters(newFilters);
    
    // Query will auto-refetch when filters change
    if (Object.keys(newFilters).length > 0) {
      setHasSearched(true);
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
    setActiveTab("local");
    // Filters are already updated by handleFilterChange
    // The query will auto-refetch with the new filters
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

  const sortedCars = useMemo(() => {
    return [...cars].sort((a, b) => {
      // First priority: Listings with images come first
      const aHasImages = hasValidImages(a);
      const bHasImages = hasValidImages(b);
      
      if (aHasImages && !bHasImages) return -1;
      if (!aHasImages && bHasImages) return 1;
      
      // Second priority: Apply user's selected sort criteria
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
          isSearching={isLoading}
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
                <span className="hidden sm:inline">Info</span>
                <span className="sm:hidden">Info</span>
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
              <div className="text-center py-12">
                <Globe className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">All Results Shown in Local Tab</h3>
                <p className="text-muted-foreground mb-4">
                  Search results from all platforms (CarDekho, OLX, Cars24, CarWale, etc.) are displayed in the Local Listings tab.
                </p>
                <p className="text-sm text-muted-foreground">
                  Use the search form above to filter by brand, budget, city, and more.
                </p>
              </div>
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