import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { FullWidthLayout } from "@/components/layout";
import HeroSection from "@/components/hero-section";
import CarFilters from "@/components/car-filters";
import CarCard from "@/components/car-card";
import AdvancedFilters from "@/components/advanced-filters";
import MarketplaceResults from "@/components/marketplace-results";
import PremiumUpgrade from "@/components/premium-upgrade";
import FeaturedListingModal from "@/components/featured-listing-modal";
import RecentlyViewed from "@/components/recently-viewed";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Search, Globe, Star, Crown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { type Car } from "@shared/schema";
import logoImage from "@/assets/logo.png";

export default function Home() {
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [sortBy, setSortBy] = useState("price-low");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("local");
  const [marketplaceResult, setMarketplaceResult] = useState<any>(null);
  const [marketplaceError, setMarketplaceError] = useState<any>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showFeaturedModal, setShowFeaturedModal] = useState(false);
  const [selectedCarForFeatured, setSelectedCarForFeatured] = useState<{id: string, title: string} | null>(null);

  const { data: cars = [], isLoading } = useQuery<Car[]>({
    queryKey: ["/api/marketplace/search", filters],
    queryFn: async () => {
      const searchFilters = {
        brand: filters.brand,
        city: filters.city,
        fuelType: filters.fuelType ? [filters.fuelType] : undefined,
        priceMin: filters.priceMin ? filters.priceMin * 100000 : undefined,
        priceMax: filters.priceMax ? filters.priceMax * 100000 : undefined,
        yearMin: filters.yearMin,
        yearMax: filters.yearMax,
        limit: 50
      };

      const response = await fetch('/api/marketplace/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchFilters)
      });
      
      if (!response.ok) throw new Error("Failed to fetch cars");
      const result = await response.json();
      return result.listings || [];
    },
  });

  const handleHeroSearch = (searchFilters: any) => {
    console.log('🔍 Hero search called with:', searchFilters);
    
    // Convert hero search to marketplace search format
    const marketplaceFilters: any = {
      limit: 50,
      sortBy: "relevance",
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
    
    console.log('🎯 Final marketplace filters:', marketplaceFilters);
    
    // Trigger marketplace search and switch to marketplace tab
    handleMarketplaceSearch(marketplaceFilters);
  };

  const handleFilterChange = (filterData: {
    model: string;
    fuelType: string;
    transmission: string;
    location: string;
    budgetRange: [number, number];
  }) => {
    const newFilters: Record<string, any> = {};
    
    // Handle budget range
    if (filterData.budgetRange[0] > 0 || filterData.budgetRange[1] < 2000000) {
      newFilters.priceMin = filterData.budgetRange[0];
      newFilters.priceMax = filterData.budgetRange[1];
    }
    
    // Handle other filters
    if (filterData.model) {
      newFilters.model = filterData.model;
    }
    if (filterData.fuelType) {
      newFilters.fuelType = filterData.fuelType;
    }
    if (filterData.transmission) {
      newFilters.transmission = filterData.transmission;
    }
    if (filterData.location) {
      newFilters.city = filterData.location;
    }
    
    console.log('🔍 Simplified filters applied:', newFilters);
    setFilters(newFilters);
  };

  const handleFavoriteToggle = (carId: string) => {
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

  const handleMakeFeatured = (car: Car) => {
    setSelectedCarForFeatured({ id: car.id, title: car.title });
    setShowFeaturedModal(true);
  };

  // Marketplace search mutation
  const marketplaceSearch = useMutation({
    mutationFn: async (searchFilters: any) => {
      console.log('Sending marketplace search:', searchFilters);
      return apiRequest("POST", "/api/marketplace/search", searchFilters);
    },
    onSuccess: (data) => {
      console.log('Marketplace search success:', data);
      setMarketplaceResult(data);
      setMarketplaceError(null); // Clear any previous error
      setActiveTab("marketplace");
    },
    onError: (error: any) => {
      console.error('Marketplace search error:', error);
      
      // Check if it's an authentication error
      if (error.message && error.message.includes('401')) {
        setMarketplaceError({
          type: 'auth',
          message: 'Please log in to search across all car portals',
          action: 'Login Required'
        });
      } else {
        setMarketplaceError({
          type: 'general',
          message: 'Search failed. Please try again.',
          action: 'Retry Search'
        });
      }
      
      // Set empty result to trigger the error display
      setMarketplaceResult({ 
        listings: [], 
        analytics: null, 
        recommendations: null 
      });
      setActiveTab("marketplace");
    }
  });

  const handleMarketplaceSearch = (searchFilters: any) => {
    // Ensure all required fields are present and properly formatted
    const cleanFilters = {
      ...searchFilters,
      limit: searchFilters.limit || 50,
      sortBy: searchFilters.sortBy || "relevance",
      sortOrder: searchFilters.sortOrder || "asc"
    };
    
    // Clean undefined values
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

  const sortedCars = [...cars].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return parseFloat(a.price) - parseFloat(b.price);
      case "price-high":
        return parseFloat(b.price) - parseFloat(a.price);
      case "year-new":
        return b.year - a.year;
      case "mileage-low":
        return a.mileage - b.mileage;
      default:
        return 0;
    }
  });

  return (
    <FullWidthLayout>
      <HeroSection onSearch={handleHeroSearch} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Advanced Search Section */}
        <div className="mb-8">
          <AdvancedFilters 
            onSearch={handleMarketplaceSearch}
            isLoading={marketplaceSearch.isPending}
          />
        </div>

        {/* Premium Upgrade Banner */}
        <div className="mb-8">
          <div className="steel-gradient rounded-lg border-2 border-yellow-500/50 p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-amber-500/10"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center gap-4 mb-4 md:mb-0">
                <div className="p-3 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full">
                  <Crown className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Upgrade to Premium</h3>
                  <p className="text-muted-foreground">Get advanced filters, price alerts, and market analytics</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Dialog open={showPremiumModal} onOpenChange={setShowPremiumModal}>
                  <DialogTrigger asChild>
                    <Button className="btn-metallic" data-testid="button-upgrade-premium">
                      <Star className="w-4 h-4 mr-2" />
                      Upgrade Now
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="steel-gradient max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>Choose Your Premium Plan</DialogTitle>
                    </DialogHeader>
                    <PremiumUpgrade onUpgrade={() => setShowPremiumModal(false)} />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>

        {/* Results Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="local" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Local Listings ({cars.length})
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              All Portals {marketplaceResult ? `(${marketplaceResult.analytics?.totalListings || 0})` : ''}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="local">
            <div className="flex flex-col lg:flex-row gap-8">
              <CarFilters onApplyFilters={handleFilterChange} />
              
              <div className="lg:w-3/4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold" data-testid="text-results-title">
                Verified Cars in India
              </h2>
              <div className="flex items-center space-x-4">
                <span className="text-muted-foreground text-sm">Sort by:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48" data-testid="select-sort">
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

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-card border border-border rounded-lg overflow-hidden animate-pulse">
                    <div className="w-full h-48 bg-muted"></div>
                    <div className="p-4 space-y-3">
                      <div className="h-6 bg-muted rounded w-3/4"></div>
                      <div className="h-8 bg-muted rounded w-1/2"></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="h-4 bg-muted rounded"></div>
                        <div className="h-4 bg-muted rounded"></div>
                        <div className="h-4 bg-muted rounded"></div>
                        <div className="h-4 bg-muted rounded"></div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="h-4 bg-muted rounded w-1/3"></div>
                        <div className="h-8 bg-muted rounded w-20"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8" data-testid="grid-car-listings">
                  {sortedCars.map((car) => (
                    <CarCard
                      key={car.id}
                      car={car}
                      onFavoriteToggle={handleFavoriteToggle}
                      isFavorite={favorites.has(car.id)}
                    />
                  ))}
                </div>
                
                {/* Seller Actions */}
                {sortedCars.length > 0 && (
                  <div className="mt-8 p-4 steel-gradient rounded-lg border border-steel-primary/30">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-500" />
                      Boost Your Listings
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Make your car stand out with featured placement and get 5x more visibility
                    </p>
                    <Button 
                      onClick={() => handleMakeFeatured(sortedCars[0])}
                      className="btn-metallic"
                      data-testid="button-make-featured"
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Make Listing Featured
                    </Button>
                  </div>
                )}

                {sortedCars.length === 0 && (
                  <div className="text-center py-12" data-testid="text-no-results">
                    <p className="text-muted-foreground text-lg">No cars found matching your criteria.</p>
                    <p className="text-muted-foreground">Try adjusting your filters to see more results.</p>
                  </div>
                )}

                {sortedCars.length > 0 && (
                  <div className="flex justify-center items-center space-x-2 mt-8" data-testid="pagination-controls">
                    <Button variant="outline" size="sm" data-testid="button-prev-page">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button size="sm" className="bg-primary text-primary-foreground" data-testid="button-page-1">1</Button>
                    <Button variant="outline" size="sm" data-testid="button-page-2">2</Button>
                    <Button variant="outline" size="sm" data-testid="button-page-3">3</Button>
                    <span className="px-3 py-2">...</span>
                    <Button variant="outline" size="sm" data-testid="button-page-10">10</Button>
                    <Button variant="outline" size="sm" data-testid="button-next-page">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
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
      </main>

      {/* Featured Listing Modal */}
      {selectedCarForFeatured && (
        <FeaturedListingModal
          carId={selectedCarForFeatured.id}
          carTitle={selectedCarForFeatured.title}
          isOpen={showFeaturedModal}
          onClose={() => {
            setShowFeaturedModal(false);
            setSelectedCarForFeatured(null);
          }}
        />
      )}
    </FullWidthLayout>
  );
}
