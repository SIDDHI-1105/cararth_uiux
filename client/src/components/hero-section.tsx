import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import logoImage from "@/assets/logo.png";

interface HeroSearchProps {
  onSearch: (filters: {
    brand: string;
    budget: string;
    city: string;
    fuelType: string;
  }) => void;
}

export default function HeroSection({ onSearch }: HeroSearchProps) {
  const [brand, setBrand] = useState("");
  const [budget, setBudget] = useState("");
  const [city, setCity] = useState("");
  const [fuelType, setFuelType] = useState("");

  const handleSearch = () => {
    onSearch({ brand, budget, city, fuelType });
  };

  return (
    <section className="bg-gradient-to-br from-chrome-primary via-chrome-secondary to-white py-20 px-4">
      <div className="max-w-6xl mx-auto text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-4 text-foreground">Best Used Cars. One Search.</h1>
        <p className="text-xl md:text-2xl mb-6 text-muted-foreground max-w-4xl mx-auto">
          Compare pre-owned cars from verified dealers across India's most trusted platforms:
        </p>
        
        {/* Legal Compliance Badge */}
        <div className="mb-6">
          <div className="inline-flex items-center px-4 py-2 bg-green-50 border border-green-200 rounded-full text-sm font-medium text-green-700">
            <span className="mr-2">🔒</span>
            <span>Authentic Listings • Verified by Source Platforms</span>
          </div>
        </div>
        
        {/* Source Logos - AutoTempest Style */}
        <div className="flex flex-wrap justify-center items-center gap-4 mb-8 opacity-80">
          {[
            "CarDekho", "OLX", "Cars24", "CarWale", "AutoTrader", "Spinny",
            "Facebook Marketplace", "Google Places", "Government Auctions"
          ].map((source) => (
            <div key={source} className="text-sm font-medium text-muted-foreground bg-white/70 px-3 py-1 rounded-md border shadow-sm">
              {source}
            </div>
          ))}
          <div className="text-sm font-medium text-muted-foreground font-bold">& More!</div>
        </div>
        
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-8 border shadow-lg max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Brand</label>
              <Select value={brand} onValueChange={setBrand}>
                <SelectTrigger className="w-full text-gray-900" data-testid="select-brand">
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
              <label className="block text-gray-700 text-sm font-medium mb-2">Budget</label>
              <Select value={budget} onValueChange={setBudget}>
                <SelectTrigger className="w-full text-gray-900" data-testid="select-budget">
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
              <label className="block text-gray-700 text-sm font-medium mb-2">City</label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger className="w-full text-gray-900" data-testid="select-city">
                  <SelectValue placeholder="Select City" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Delhi NCR">🟢 Delhi NCR - Available Now</SelectItem>
                  <SelectItem value="Hyderabad">🟢 Hyderabad - Available Now</SelectItem>
                  <SelectItem value="Mumbai">🔄 Mumbai - Coming Soon</SelectItem>
                  <SelectItem value="Bangalore">🔄 Bangalore - Coming Soon</SelectItem>
                  <SelectItem value="Chennai">🔄 Chennai - Coming Soon</SelectItem>
                  <SelectItem value="Pune">🔄 Pune - Coming Soon</SelectItem>
                  <SelectItem value="Kolkata">🔄 Kolkata - Coming Soon</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Fuel Type</label>
              <Select value={fuelType} onValueChange={setFuelType}>
                <SelectTrigger className="w-full text-gray-900" data-testid="select-fuel-type">
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
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground py-4 px-6 rounded-lg font-bold text-lg tracking-wide transition-all duration-200 shadow-lg hover:shadow-xl"
            data-testid="button-search-cars"
          >
            <Search className="mr-2 h-5 w-5" />
            Search Cars
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground mt-8 max-w-3xl mx-auto">
          We aggregate millions of listings from dealers and private sellers across India. 
          Our goal is to capture all the results in a single search, to save you time and help you find your ideal next car.
        </p>
      </div>
    </section>
  );
}
