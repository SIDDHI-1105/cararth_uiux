import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

interface CarFiltersProps {
  onApplyFilters: (filters: {
    model?: string;
    fuelType?: string;
    transmission?: string;
    location?: string;
    budgetRange: [number, number];
  }) => void;
}

export default function CarFilters({ onApplyFilters }: CarFiltersProps) {
  const [model, setModel] = useState<string>("");
  const [fuelType, setFuelType] = useState<string>("");
  const [transmission, setTransmission] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [budgetRange, setBudgetRange] = useState<[number, number]>([0, 10000000]);

  const formatPrice = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(0)}k`;
    return `₹${value}`;
  };

  const handleApplyFilters = () => {
    onApplyFilters({ 
      model: model || undefined, 
      fuelType: fuelType || undefined, 
      transmission: transmission || undefined, 
      location: location || undefined, 
      budgetRange 
    });
  };

  const handleClearFilters = () => {
    setModel("");
    setFuelType("");
    setTransmission("");
    setLocation("");
    setBudgetRange([0, 10000000]);
  };


  return (
    <aside className="lg:w-1/4">
      <div className="bg-card rounded-lg border border-border p-6 filter-sidebar">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Search Filters</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClearFilters}
            className="text-muted-foreground hover:text-primary"
            data-testid="button-clear-filters"
          >
            Clear All
          </Button>
        </div>
        
        
        {/* Budget Slider */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">Budget</h4>
            <span className="text-sm text-muted-foreground">
              {formatPrice(budgetRange[0])} - {formatPrice(budgetRange[1])}
            </span>
          </div>
          <div className="px-2">
            <Slider
              value={budgetRange}
              onValueChange={(value) => setBudgetRange(value as [number, number])}
              max={10000000}
              min={0}
              step={500000}
              className="w-full"
              data-testid="slider-budget"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>₹0</span>
              <span>₹1Cr+</span>
            </div>
          </div>
        </div>
        
        {/* Model Filter */}
        <div className="mb-4">
          <h4 className="font-medium mb-2">Model</h4>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger data-testid="select-model">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="swift">Maruti Swift</SelectItem>
              <SelectItem value="baleno">Maruti Baleno</SelectItem>
              <SelectItem value="i20">Hyundai i20</SelectItem>
              <SelectItem value="creta">Hyundai Creta</SelectItem>
              <SelectItem value="nexon">Tata Nexon</SelectItem>
              <SelectItem value="harrier">Tata Harrier</SelectItem>
              <SelectItem value="xuv300">Mahindra XUV300</SelectItem>
              <SelectItem value="city">Honda City</SelectItem>
              <SelectItem value="civic">Honda Civic</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Fuel Type Filter */}
        <div className="mb-4">
          <h4 className="font-medium mb-2">Fuel Type</h4>
          <Select value={fuelType} onValueChange={setFuelType}>
            <SelectTrigger data-testid="select-fuel-type">
              <SelectValue placeholder="Select fuel type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="petrol">Petrol</SelectItem>
              <SelectItem value="diesel">Diesel</SelectItem>
              <SelectItem value="cng">CNG</SelectItem>
              <SelectItem value="electric">Electric</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Transmission Filter */}
        <div className="mb-4">
          <h4 className="font-medium mb-2">Transmission</h4>
          <Select value={transmission} onValueChange={setTransmission}>
            <SelectTrigger data-testid="select-transmission">
              <SelectValue placeholder="Select transmission" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="automatic">Automatic</SelectItem>
              <SelectItem value="cvt">CVT</SelectItem>
              <SelectItem value="amt">AMT</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Location Filter */}
        <div className="mb-6">
          <h4 className="font-medium mb-2">Location</h4>
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger data-testid="select-location">
              <SelectValue placeholder="Select location" />
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
        
        <div className="space-y-2">
          <Button 
            onClick={handleApplyFilters}
            className="w-full bg-primary text-primary-foreground py-2.5 px-4 rounded-md font-medium hover:bg-primary/90 transition-colors"
            data-testid="button-apply-filters"
          >
            Search Used Cars
          </Button>
        </div>
      </div>
    </aside>
  );
}
