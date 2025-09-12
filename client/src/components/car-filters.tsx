import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Sparkles, Zap, Target } from "lucide-react";

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
  const [showAISuggestions, setShowAISuggestions] = useState(true);

  // AI-powered search suggestions
  const aiSuggestions = [
    {
      id: 'family-budget',
      title: 'Family Car Under ₹8L',
      description: 'Good mileage, spacious, reliable',
      icon: '👨‍👩‍👧‍👦',
      filters: { model: 'swift', fuelType: 'petrol', budgetRange: [300000, 800000], location: 'Hyderabad' },
      popularity: 'Most Popular'
    },
    {
      id: 'daily-commute',
      title: 'Reliable Sedan for Commute',
      description: 'Fuel efficient, comfortable, automatic',
      icon: '🚗',
      filters: { model: 'city', fuelType: 'petrol', transmission: 'automatic', budgetRange: [500000, 1200000], location: 'Hyderabad' },
      popularity: 'Trending'
    },
    {
      id: 'luxury-suv',
      title: 'Premium SUV Experience',
      description: 'Feature-rich, spacious, low maintenance',
      icon: '🚙',
      filters: { model: 'creta', fuelType: 'diesel', transmission: 'automatic', budgetRange: [1000000, 2000000], location: 'Hyderabad' },
      popularity: 'AI Recommended'
    },
    {
      id: 'first-car',
      title: 'Perfect First Car',
      description: 'Easy to drive, affordable, good resale',
      icon: '🔰',
      filters: { model: 'i20', fuelType: 'petrol', transmission: 'manual', budgetRange: [400000, 700000], location: 'Hyderabad' },
      popularity: 'Great for Beginners'
    },
    {
      id: 'eco-friendly',
      title: 'Eco-Friendly Choice',
      description: 'Electric/hybrid, low emissions, modern',
      icon: '🌱',
      filters: { fuelType: 'electric', budgetRange: [800000, 1500000], location: 'Hyderabad' },
      popularity: 'Future Ready'
    },
    {
      id: 'weekend-adventure',
      title: 'Weekend Adventure Car',
      description: 'Rugged SUV, high ground clearance',
      icon: '🏔️',
      filters: { model: 'nexon', fuelType: 'diesel', budgetRange: [700000, 1200000], location: 'Hyderabad' },
      popularity: 'Adventure Ready'
    }
  ];

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
    setShowAISuggestions(true);
  };

  const handleAISuggestionClick = (suggestion: typeof aiSuggestions[0]) => {
    const filters = suggestion.filters;
    
    // Apply suggestion filters
    if (filters.model) setModel(filters.model);
    if (filters.fuelType) setFuelType(filters.fuelType);
    if (filters.transmission) setTransmission(filters.transmission);
    if (filters.location) setLocation(filters.location);
    if (filters.budgetRange) setBudgetRange(filters.budgetRange as [number, number]);
    
    // Hide suggestions after selection
    setShowAISuggestions(false);
    
    // Automatically apply the filters
    setTimeout(() => {
      onApplyFilters({
        model: filters.model,
        fuelType: filters.fuelType,
        transmission: filters.transmission,
        location: filters.location,
        budgetRange: filters.budgetRange as [number, number] || [0, 10000000]
      });
    }, 100);
  };

  return (
    <aside className="lg:w-1/4">
      <div className="bg-card rounded-lg border border-border p-6 filter-sidebar">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" />
            AI-Powered Search
          </h3>
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
        
        {/* AI Search Suggestions */}
        {showAISuggestions && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-sm flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-purple-600" />
                Smart Suggestions
              </h4>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowAISuggestions(false)}
                className="text-xs text-muted-foreground hover:text-primary"
              >
                Hide
              </Button>
            </div>
            <div className="space-y-2">
              {aiSuggestions.map((suggestion) => (
                <Card 
                  key={suggestion.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-blue-500"
                  onClick={() => handleAISuggestionClick(suggestion)}
                  data-testid={`ai-suggestion-${suggestion.id}`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <span className="text-lg">{suggestion.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h5 className="font-medium text-sm">{suggestion.title}</h5>
                          <Badge 
                            variant="outline" 
                            className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                          >
                            {suggestion.popularity}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{suggestion.description}</p>
                        <div className="flex items-center gap-1 mt-2">
                          <Target className="w-3 h-3 text-green-600" />
                          <span className="text-xs text-green-600 font-medium">AI Matched</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 text-xs text-blue-700">
                <Zap className="w-3 h-3" />
                <span className="font-medium">Click any suggestion to auto-fill your search criteria</span>
              </div>
            </div>
          </div>
        )}
        
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
