import { useState } from "react";
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

export default function HeroSection({ onSearch, hasSearched = false, isSearching = false }: HeroSearchProps) {
  const [brand, setBrand] = useState("");
  const [budget, setBudget] = useState("");
  const [city, setCity] = useState("");
  const [fuelType, setFuelType] = useState("");

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
              Every car, every platform, one search.
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl mb-6 text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              Find your perfect car from CarDekho, OLX, Cars24, CarWale & more - all in one place.
            </p>
            
            {/* Legal Compliance Badge */}
            <div className="mb-6">
              <div className="inline-flex items-center px-4 py-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-full text-sm font-medium text-blue-700 dark:text-blue-300">
                <span className="mr-2">🔒</span>
                <span>We aggregate millions of listings from dealers and private sellers across India</span>
              </div>
            </div>
            
            {/* Platform Sources - Legally Compliant Display */}
            <div className="mb-8">
              <p className="text-sm text-muted-foreground mb-4">Data sources (public listings aggregated with compliance):</p>
              <div className="flex flex-wrap justify-center items-center gap-3 opacity-80">
                {[
                  "CarDekho", "OLX Autos", "Cars24", "CarWale", "AutoTrader", "Spinny"
                ].map((source) => (
                  <div 
                    key={source} 
                    className="text-sm font-medium px-3 py-1.5 rounded-md border shadow-sm text-muted-foreground bg-background/70 dark:bg-card/70 border-border"
                  >
                    <span>{source}</span>
                  </div>
                ))}
                <div className="text-sm font-medium text-primary font-bold px-3 py-1.5 bg-primary/10 rounded-md border border-primary/20">
                  + Government Auctions & More
                </div>
              </div>
            </div>
          </div>
        )}
        
        <TooltipWrapper trigger="hero-search-form">
          <div className="bg-background/95 dark:bg-card/95 backdrop-blur-sm rounded-xl p-6 md:p-8 border shadow-lg max-w-4xl mx-auto" data-testid="hero-search-form">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-foreground text-sm font-medium mb-2">Brand</label>
              <Select value={brand} onValueChange={setBrand}>
                <SelectTrigger className="w-full text-foreground bg-background border-border" data-testid="select-brand">
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
              <label className="block text-foreground text-sm font-medium mb-2">Budget</label>
              <Select value={budget} onValueChange={setBudget}>
                <SelectTrigger className="w-full text-foreground bg-background border-border" data-testid="select-budget">
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
              <label className="block text-foreground text-sm font-medium mb-2">City</label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger className="w-full text-foreground bg-background border-border" data-testid="select-city">
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
              <label className="block text-foreground text-sm font-medium mb-2">Fuel Type</label>
              <Select value={fuelType} onValueChange={setFuelType}>
                <SelectTrigger className="w-full text-foreground bg-background border-border" data-testid="select-fuel-type">
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
            className={`w-full py-4 px-6 rounded-lg font-bold text-base md:text-lg tracking-wide min-h-[44px] touch-manipulation transition-all duration-300 transform ${
              isSearching 
                ? 'bg-primary/70 cursor-not-allowed scale-98 shadow-inner' 
                : 'bg-primary hover:bg-primary/90 hover:scale-102 active:scale-98 shadow-lg hover:shadow-xl active:shadow-inner'
            } text-primary-foreground`}
            data-testid="button-search-cars"
          >
            <Search className={`mr-2 h-5 w-5 transition-transform duration-300 ${isSearching ? 'animate-pulse' : ''}`} />
            {isSearching ? 'Searching...' : 'Search Cars'}
          </HapticButton>
          </div>
        </TooltipWrapper>
      </div>
    </section>
  );
}
