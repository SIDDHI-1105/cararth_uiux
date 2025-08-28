import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

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
    <section className="hero-gradient text-white py-16 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">Find Your Perfect Car</h1>
        <p className="text-xl md:text-2xl mb-8 text-blue-100">Discover thousands of verified cars across India</p>
        
        <div className="bg-white rounded-lg p-6 shadow-xl">
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
                  <SelectItem value="1500000-99999999">Above ₹15 Lakh</SelectItem>
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
                  <SelectItem value="all">Select City</SelectItem>
                  <SelectItem value="Mumbai">Mumbai</SelectItem>
                  <SelectItem value="Delhi">Delhi</SelectItem>
                  <SelectItem value="Bangalore">Bangalore</SelectItem>
                  <SelectItem value="Chennai">Chennai</SelectItem>
                  <SelectItem value="Hyderabad">Hyderabad</SelectItem>
                  <SelectItem value="Pune">Pune</SelectItem>
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
            className="w-full bg-accent text-accent-foreground py-3 px-6 rounded-md font-semibold hover:bg-accent/90 transition-colors"
            data-testid="button-search-cars"
          >
            <Search className="mr-2 h-4 w-4" />
            Search Cars
          </Button>
        </div>
      </div>
    </section>
  );
}
