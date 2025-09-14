import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { BrandWordmark } from "@/components/brand-wordmark";
import { TooltipWrapper } from "@/components/tooltip-wrapper";

interface HeroSearchProps {
  onSearch: (filters: {
    brand?: string;
    budget?: string;
    city?: string;
    fuelType?: string;
  }) => void;
}

export default function HeroSection({ onSearch }: HeroSearchProps) {
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
    <section className="bg-background dark:bg-background py-16 md:py-20 px-4">
      <div className="max-w-6xl mx-auto text-center">
        {/* CarArth Logo */}
        <div className="mb-6">
          <BrandWordmark variant="hero" showTagline={false} className="justify-center items-center" />
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 text-foreground leading-tight">India's First Used Car Search Engine</h1>
        <p className="text-lg sm:text-xl md:text-2xl mb-6 text-muted-foreground max-w-4xl mx-auto leading-relaxed">
          Your dream car is out there. We'll find it across every platform in India. One search, endless possibilities.
        </p>
        
        {/* Legal Compliance Badge */}
        <div className="mb-6">
          <div className="inline-flex items-center px-4 py-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-full text-sm font-medium text-blue-700 dark:text-blue-300">
            <span className="mr-2">🔒</span>
            <span>We index public listings from multiple platforms</span>
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
                  <SelectItem value="0-200000">Under ₹2 Lakh</SelectItem>
                  <SelectItem value="200000-500000">₹2-5 Lakh</SelectItem>
                  <SelectItem value="500000-1000000">₹5-10 Lakh</SelectItem>
                  <SelectItem value="1000000-1500000">₹10-15 Lakh</SelectItem>
                  <SelectItem value="1500000-2000000">₹15-20 Lakh</SelectItem>
                  <SelectItem value="2000000-3000000">₹20-30 Lakh</SelectItem>
                  <SelectItem value="3000000-5000000">₹30-50 Lakh</SelectItem>
                  <SelectItem value="5000000-7500000">₹50-75 Lakh</SelectItem>
                  <SelectItem value="7500000-10000000">₹75 Lakh-1 Cr</SelectItem>
                  <SelectItem value="10000000-99999999">Above ₹1 Cr</SelectItem>
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
          
          <Button 
            onClick={handleSearch}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4 px-6 rounded-lg font-bold text-base md:text-lg tracking-wide transition-all duration-200 shadow-lg hover:shadow-xl min-h-[44px] touch-manipulation"
            data-testid="button-search-cars"
          >
            <Search className="mr-2 h-5 w-5" />
            Search Cars
          </Button>
          </div>
        </TooltipWrapper>
        
        <p className="text-sm text-muted-foreground mt-8 max-w-3xl mx-auto">
          We aggregate millions of listings from dealers and private sellers across India. 
          Our goal is to capture all the results in a single search, to save you time and help you find your ideal next car.
        </p>
      </div>
    </section>
  );
}
