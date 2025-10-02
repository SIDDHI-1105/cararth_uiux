import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { BrandWordmark } from "@/components/brand-wordmark";
import { TooltipWrapper } from "@/components/tooltip-wrapper";
import { HapticButton } from "@/components/haptic-feedback";

interface HeroSearchProps {
  onSearch: (filters: {
    brand?: string;
    budget?: string;
    city?: string;
    fuelType?: string;
  }) => void;
  hasSearched?: boolean;
  isSearching?: boolean;
}

interface HeroStats {
  success: boolean;
  totalListings: number;
  totalPlatforms: number;
  platforms: Array<{
    name: string;
    count: number;
  }>;
  lastUpdated: string;
}

export default function HeroSection({ onSearch, hasSearched = false, isSearching = false }: HeroSearchProps) {
  const [brand, setBrand] = useState("");
  const [budget, setBudget] = useState("");
  const [city, setCity] = useState("");
  const [fuelType, setFuelType] = useState("");

  // Fetch dynamic hero stats
  const { data: heroStats, isLoading: statsLoading } = useQuery<HeroStats>({
    queryKey: ['/api/hero-stats'],
    refetchInterval: 60000, // Refetch every minute for real-time updates
  });

  const handleSearch = () => {
    onSearch({ 
      brand: brand || undefined, 
      budget: budget || undefined, 
      city: city || undefined, 
      fuelType: fuelType || undefined 
    });
  };

  return (
    <section className={`bg-background dark:bg-background px-4 transition-all duration-700 ease-in-out ${
      hasSearched ? 'py-8' : 'py-16 md:py-20'
    }`}>
      <div className="max-w-6xl mx-auto text-center">
        {/* CarArth Logo */}
        <div className="mb-6">
          <BrandWordmark variant="hero" showTagline={false} className="justify-center items-center" />
        </div>
        
        {/* Contextual Content - Only show if no search has been performed */}
        {!hasSearched && (
          <div className="transition-all duration-700 ease-in-out">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 text-foreground leading-tight">
              India's Multi-Platform Car Marketplace
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl mb-4 text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              Buyers: Search all platforms in one place. Sellers: Post once, reach everywhere.
            </p>
            
            {/* Live Stats - Dynamic */}
            <div className="flex justify-center items-center gap-6 mb-6 text-sm sm:text-base">
              <div className="flex items-center gap-2">
                <span className="text-3xl sm:text-4xl font-bold text-primary" data-testid="stat-total-listings">
                  {statsLoading ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    `${heroStats?.totalListings || 0}+`
                  )}
                </span>
                <span className="text-muted-foreground">Verified Listings</span>
              </div>
              <div className="h-8 w-px bg-border"></div>
              <div className="flex items-center gap-2">
                <span className="text-3xl sm:text-4xl font-bold text-primary" data-testid="stat-total-platforms">
                  {statsLoading ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    heroStats?.totalPlatforms || 0
                  )}
                </span>
                <span className="text-muted-foreground">Live Platforms</span>
              </div>
            </div>
            
            {/* Connected Platforms Display - Dynamic real-time data */}
            <div className="mb-8">
              <p className="text-sm text-muted-foreground mb-4">Aggregating Live Listings From:</p>
              <div className="flex flex-wrap justify-center items-center gap-3 opacity-80">
                {statsLoading ? (
                  <div className="animate-pulse flex gap-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="h-8 w-32 bg-muted rounded-md"></div>
                    ))}
                  </div>
                ) : (
                  <>
                    {heroStats?.platforms.map((platform) => (
                      <div 
                        key={platform.name} 
                        className="text-sm font-medium px-3 py-1.5 rounded-md border shadow-sm text-foreground bg-background/70 dark:bg-card/70 border-border flex items-center gap-2"
                        data-testid={`platform-${platform.name.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <span>{platform.name}</span>
                        <span className="text-xs text-primary font-bold">({platform.count})</span>
                      </div>
                    ))}
                    <div className="text-sm font-medium text-primary font-bold px-3 py-1.5 bg-primary/10 rounded-md border border-primary/20">
                      + More Coming Soon
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        
        <TooltipWrapper trigger="hero-search-form">
          <div className="bg-background/95 dark:bg-card/95 backdrop-blur-sm rounded-xl p-4 sm:p-6 md:p-8 border shadow-lg max-w-4xl mx-auto" data-testid="hero-search-form">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div>
              <label className="block text-foreground text-sm sm:text-base font-medium mb-2">Brand</label>
              <Select value={brand} onValueChange={setBrand}>
                <SelectTrigger className="w-full min-h-[48px] text-base text-foreground bg-background border-border" data-testid="select-brand">
                  <SelectValue placeholder="All Brands" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  <SelectItem value="Maruti Suzuki">Maruti Suzuki</SelectItem>
                  <SelectItem value="Hyundai">Hyundai</SelectItem>
                  <SelectItem value="Tata">Tata</SelectItem>
                  <SelectItem value="Mahindra">Mahindra</SelectItem>
                  <SelectItem value="Honda">Honda</SelectItem>
                  <SelectItem value="Toyota">Toyota</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-foreground text-sm sm:text-base font-medium mb-2">Budget</label>
              <Select value={budget} onValueChange={setBudget}>
                <SelectTrigger className="w-full min-h-[48px] text-base text-foreground bg-background border-border" data-testid="select-budget">
                  <SelectValue placeholder="Any Budget" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Budget</SelectItem>
                  <SelectItem value="0-200000">Under ₹2,00,000</SelectItem>
                  <SelectItem value="200000-500000">₹2,00,000-5,00,000</SelectItem>
                  <SelectItem value="500000-1000000">₹5,00,000-10,00,000</SelectItem>
                  <SelectItem value="1000000-1500000">₹10,00,000-15,00,000</SelectItem>
                  <SelectItem value="1500000-2000000">₹15,00,000-20,00,000</SelectItem>
                  <SelectItem value="2000000-3000000">₹20,00,000-30,00,000</SelectItem>
                  <SelectItem value="3000000-5000000">₹30,00,000-50,00,000</SelectItem>
                  <SelectItem value="5000000-7500000">₹50,00,000-75,00,000</SelectItem>
                  <SelectItem value="7500000-10000000">₹75,00,000-1,00,00,000</SelectItem>
                  <SelectItem value="10000000-99999999">Above ₹1,00,00,000</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-foreground text-sm sm:text-base font-medium mb-2">City</label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger className="w-full min-h-[48px] text-base text-foreground bg-background border-border" data-testid="select-city">
                  <SelectValue placeholder="Select City" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hyderabad">🚀 Hyderabad - Live Now!</SelectItem>
                  <SelectItem value="Delhi NCR">🔄 Delhi NCR - Coming Soon</SelectItem>
                  <SelectItem value="Mumbai">🔄 Mumbai - Coming Soon</SelectItem>
                  <SelectItem value="Bangalore">🔄 Bangalore - Coming Soon</SelectItem>
                  <SelectItem value="Chennai">🔄 Chennai - Coming Soon</SelectItem>
                  <SelectItem value="Pune">🔄 Pune - Coming Soon</SelectItem>
                  <SelectItem value="Kolkata">🔄 Kolkata - Coming Soon</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-foreground text-sm sm:text-base font-medium mb-2">Fuel Type</label>
              <Select value={fuelType} onValueChange={setFuelType}>
                <SelectTrigger className="w-full min-h-[48px] text-base text-foreground bg-background border-border" data-testid="select-fuel-type">
                  <SelectValue placeholder="Any Fuel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Fuel</SelectItem>
                  <SelectItem value="Petrol">Petrol</SelectItem>
                  <SelectItem value="Diesel">Diesel</SelectItem>
                  <SelectItem value="CNG">CNG</SelectItem>
                  <SelectItem value="Electric">Electric</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <HapticButton 
            onClick={handleSearch}
            disabled={isSearching}
            hapticType="button"
            className={`w-full py-4 sm:py-5 px-6 rounded-lg font-bold text-lg sm:text-xl tracking-wide min-h-[56px] sm:min-h-[60px] touch-manipulation transition-all duration-300 transform ${
              isSearching 
                ? 'bg-primary/70 cursor-not-allowed scale-98 shadow-inner' 
                : 'bg-primary hover:bg-primary/90 hover:scale-102 active:scale-98 shadow-lg hover:shadow-xl active:shadow-inner'
            } text-primary-foreground`}
            data-testid="button-search-cars"
          >
            <Search className={`mr-2 h-6 w-6 transition-transform duration-300 ${isSearching ? 'animate-pulse' : ''}`} />
            {isSearching ? 'Searching...' : 'Search Cars'}
          </HapticButton>
          </div>
        </TooltipWrapper>
      </div>
    </section>
  );
}
