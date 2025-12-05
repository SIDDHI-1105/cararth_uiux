import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ShieldCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/contexts/ThemeContext";

interface HeroSearchProps {
  onSearch: (filters: {
    brand?: string;
    budget?: string;
    city?: string;
    fuelType?: string;
    year?: string;
  }) => void;
  hasSearched?: boolean;
  isSearching?: boolean;
  redirectToResults?: boolean;
}

interface HeroStats {
  success: boolean;
  totalListings: number;
  totalPlatforms: number;
  platforms: Array<{
    name: string;
    count: number;
  }>;
  sourceBreakdown: {
    ethicalAi: number;
    exclusiveDealer: number;
    userDirect: number;
  };
  lastUpdated: string;
}

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 20 }, (_, i) => currentYear - i);

export default function HeroSection({ onSearch, hasSearched = false, isSearching = false, redirectToResults = false }: HeroSearchProps) {
  const { theme } = useTheme();
  const [, setLocation] = useLocation();
  const [brand, setBrand] = useState("");
  const [budget, setBudget] = useState("");
  const [city, setCity] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [year, setYear] = useState("");

  // Fetch dynamic hero stats
  const { data: heroStats, isLoading: statsLoading } = useQuery<HeroStats>({
    queryKey: ['/api/hero-stats'],
    refetchInterval: 60000,
  });

  const handleSearch = () => {
    if (redirectToResults) {
      const params = new URLSearchParams();
      if (brand && brand !== "all") params.set("brand", brand);
      if (budget && budget !== "all") params.set("budget", budget);
      if (city && city !== "all") params.set("city", city);
      if (fuelType && fuelType !== "all") params.set("fuelType", fuelType);
      if (year && year !== "all") params.set("year", year);
      
      const queryString = params.toString();
      const path = queryString ? `/results?${queryString}` : '/results';
      setLocation(path);
    } else {
      onSearch({ 
        brand: brand || undefined, 
        budget: budget || undefined, 
        city: city || undefined, 
        fuelType: fuelType || undefined,
        year: year || undefined
      });
    }
  };

  return (
    <section className="relative overflow-hidden h-screen min-h-[600px] flex items-center">
      {/* Full-screen Hero Background */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Background Image - Full Width & Height */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'url(/assets/hero_custom.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat',
          }}
        />

        {/* Left-to-Right White Gradient Overlay for Text Readability */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.7) 35%, rgba(255,255,255,0.3) 60%, rgba(255,255,255,0) 100%)',
          }}
        />
      </div>

      <div className="container mx-auto px-4 md:px-8 lg:px-16 w-full relative z-10">
        
        {/* Enhanced Headline */}
        <div className="text-left md:max-w-xl mb-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-4 border border-purple-200 dark:border-purple-800">
            <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">India's Trusted Car Discovery Platform</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 text-gray-900 dark:text-white leading-tight">
            One trusted place for<br />every verified car
          </h1>

          <p className="text-base sm:text-lg text-gray-700 dark:text-gray-200 md:max-w-lg font-medium">
            {statsLoading ? (
              "Loading live data..."
            ) : heroStats ? (
              <>
                <span className="text-purple-600 dark:text-purple-400 font-bold">{heroStats.totalListings.toLocaleString()}+</span> verified listings from{" "}
                <span className="text-purple-600 dark:text-purple-400 font-bold">{heroStats.totalPlatforms}</span> platforms · List once · No paid listings
              </>
            ) : (
              "Verified listings from multiple platforms · List once · No paid listings"
            )}
          </p>
        </div>

        {/* Central Search Card with Glass Effect */}
        <div className="glass-card max-w-4xl md:max-w-2xl mb-6" data-testid="hero-search-form">
          {/* Desktop: Grid Layout */}
          <div className="hidden md:grid md:grid-cols-5 gap-2 mb-3">
            <Select value={brand} onValueChange={setBrand}>
              <SelectTrigger className="h-10" data-testid="select-brand">
                <SelectValue placeholder="Brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                <SelectItem value="Maruti Suzuki">Maruti Suzuki</SelectItem>
                <SelectItem value="Hyundai">Hyundai</SelectItem>
                <SelectItem value="Tata">Tata</SelectItem>
                <SelectItem value="Mahindra">Mahindra</SelectItem>
                <SelectItem value="Honda">Honda</SelectItem>
                <SelectItem value="Toyota">Toyota</SelectItem>
                <SelectItem value="Kia">Kia</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="h-10" data-testid="select-city">
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                <SelectItem value="Hyderabad">🚀 Hyderabad</SelectItem>
                <SelectItem value="Delhi NCR">Delhi NCR</SelectItem>
                <SelectItem value="Mumbai">Mumbai</SelectItem>
                <SelectItem value="Bangalore">Bangalore</SelectItem>
                <SelectItem value="Chennai">Chennai</SelectItem>
                <SelectItem value="Pune">Pune</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={budget} onValueChange={setBudget}>
              <SelectTrigger className="h-10" data-testid="select-budget">
                <SelectValue placeholder="Price" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Budget</SelectItem>
                <SelectItem value="0-200000">Under ₹2L</SelectItem>
                <SelectItem value="200000-500000">₹2L - ₹5L</SelectItem>
                <SelectItem value="500000-1000000">₹5L - ₹10L</SelectItem>
                <SelectItem value="1000000-1500000">₹10L - ₹15L</SelectItem>
                <SelectItem value="1500000-99999999">Above ₹15L</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={fuelType} onValueChange={setFuelType}>
              <SelectTrigger className="h-10" data-testid="select-fuel-type">
                <SelectValue placeholder="Fuel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Fuels</SelectItem>
                <SelectItem value="Petrol">Petrol</SelectItem>
                <SelectItem value="Diesel">Diesel</SelectItem>
                <SelectItem value="CNG">CNG</SelectItem>
                <SelectItem value="Electric">Electric</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="h-10" data-testid="select-year">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Year</SelectItem>
                {yearOptions.map(y => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mobile: Horizontal Scrollable Chips */}
          <div className="md:hidden mb-3 -mx-2 px-2">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
              <div className="snap-start shrink-0">
                <Select value={brand} onValueChange={setBrand}>
                  <SelectTrigger className="h-10 w-32" data-testid="select-brand-mobile">
                    <SelectValue placeholder="Brand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="Maruti Suzuki">Maruti</SelectItem>
                    <SelectItem value="Hyundai">Hyundai</SelectItem>
                    <SelectItem value="Tata">Tata</SelectItem>
                    <SelectItem value="Mahindra">Mahindra</SelectItem>
                    <SelectItem value="Honda">Honda</SelectItem>
                    <SelectItem value="Toyota">Toyota</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="snap-start shrink-0">
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger className="h-10 w-32" data-testid="select-city-mobile">
                    <SelectValue placeholder="City" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="Hyderabad">Hyderabad</SelectItem>
                    <SelectItem value="Delhi NCR">Delhi NCR</SelectItem>
                    <SelectItem value="Mumbai">Mumbai</SelectItem>
                    <SelectItem value="Bangalore">Bangalore</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="snap-start shrink-0">
                <Select value={budget} onValueChange={setBudget}>
                  <SelectTrigger className="h-10 w-32" data-testid="select-price-mobile">
                    <SelectValue placeholder="Price" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any</SelectItem>
                    <SelectItem value="0-200000">Under ₹2L</SelectItem>
                    <SelectItem value="200000-500000">₹2-5L</SelectItem>
                    <SelectItem value="500000-1000000">₹5-10L</SelectItem>
                    <SelectItem value="1000000-99999999">Above ₹10L</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="snap-start shrink-0">
                <Select value={fuelType} onValueChange={setFuelType}>
                  <SelectTrigger className="h-10 w-28" data-testid="select-fuel-mobile">
                    <SelectValue placeholder="Fuel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="Petrol">Petrol</SelectItem>
                    <SelectItem value="Diesel">Diesel</SelectItem>
                    <SelectItem value="CNG">CNG</SelectItem>
                    <SelectItem value="Electric">EV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="snap-start shrink-0">
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger className="h-10 w-28" data-testid="select-year-mobile">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any</SelectItem>
                    {yearOptions.slice(0, 10).map(y => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={handleSearch}
            disabled={isSearching}
            className="w-full h-11 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            data-testid="button-search-cars"
          >
            <Search className="mr-2 h-4 w-4" />
            {isSearching ? 'Searching...' : 'Search Cars'}
          </Button>
        </div>

        {/* Enhanced Trust Badges with Glass Effect */}
        <div className="flex flex-wrap justify-start md:justify-start gap-3 max-w-2xl">
          <div className="glass px-4 py-2.5 rounded-full flex items-center gap-2 border-green-200/30 dark:border-green-800/30" data-testid="badge-verified">
            <ShieldCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-semibold text-green-700 dark:text-green-300">Verified by CarArthX</span>
          </div>
          <div className="glass px-4 py-2.5 rounded-full flex items-center gap-2 border-blue-200/30 dark:border-blue-800/30" data-testid="badge-no-paid">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">No Paid Listings</span>
          </div>
        </div>
      </div>
    </section>
  );
}
