import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { ChevronDown, Filter, X, Search } from "lucide-react";

interface AdvancedFiltersProps {
  onSearch: (filters: any) => void;
  isLoading?: boolean;
}

export default function AdvancedFilters({ onSearch, isLoading }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({
    // Basic filters
    brand: "",
    model: "",
    yearRange: [2015, 2024],
    priceRange: [100000, 2000000], // In rupees
    
    // Location
    city: "",
    state: "",
    radiusKm: 50,
    
    // Vehicle specs
    fuelTypes: [] as string[],
    transmissions: [] as string[],
    mileageMax: 100000,
    owners: [] as number[],
    
    // Condition & verification
    conditions: [] as string[],
    verificationStatus: [] as string[],
    sellerTypes: [] as string[],
    
    // Features
    features: [] as string[],
    hasImages: false,
    hasWarranty: false,
    
    // Listing preferences
    listedWithinDays: 30,
    sources: [] as string[],
    
    // Sort preferences
    sortBy: "relevance",
    sortOrder: "asc",
    limit: 50
  });

  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const brands = [
    "Maruti Suzuki", "Hyundai", "Tata", "Mahindra", "Honda", "Toyota",
    "Ford", "Volkswagen", "Skoda", "Renault", "Nissan", "Chevrolet", "Kia"
  ];

  const cities = [
    "Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad", "Pune",
    "Ahmedabad", "Kolkata", "Surat", "Jaipur", "Lucknow", "Kanpur"
  ];

  const states = [
    "Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "Telangana",
    "Gujarat", "West Bengal", "Rajasthan", "Uttar Pradesh", "Madhya Pradesh"
  ];

  const fuelTypes = ["Petrol", "Diesel", "CNG", "Electric", "Hybrid"];
  const transmissions = ["Manual", "Automatic", "CVT", "AMT"];
  const conditions = ["Excellent", "Good", "Fair", "Average"];
  const verificationStatuses = ["Verified", "Certified", "Unverified"];
  const sellerTypes = ["Individual", "Dealer", "OEM"];
  const sources = [
    "CarDekho", "OLX", "Cars24", "CarWale", "AutoTrader", "Spinny",
    "Facebook Marketplace", "Google Places", "Government Auctions", 
    "Classified Ads", "Dealer Networks", "Partner APIs"
  ];

  const features = [
    "Air Conditioning", "Power Steering", "ABS", "Airbags", "Alloy Wheels",
    "Sunroof", "Leather Seats", "GPS Navigation", "Reverse Camera",
    "Bluetooth", "USB Charging", "Keyless Entry", "Push Button Start"
  ];

  const handleArrayFilterChange = (filterKey: string, value: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: checked 
        ? [...(prev[filterKey as keyof typeof prev] as string[]), value]
        : (prev[filterKey as keyof typeof prev] as string[]).filter(item => item !== value)
    }));
  };

  const handleRangeChange = (filterKey: string, value: number[]) => {
    setFilters(prev => ({ ...prev, [filterKey]: value }));
  };

  const handleInputChange = (filterKey: string, value: any) => {
    setFilters(prev => ({ ...prev, [filterKey]: value }));
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.brand) count++;
    if (filters.model) count++;
    if (filters.city) count++;
    if (filters.fuelTypes.length) count++;
    if (filters.transmissions.length) count++;
    if (filters.conditions.length) count++;
    if (filters.features.length) count++;
    if (filters.sources.length) count++;
    if (filters.hasImages || filters.hasWarranty) count++;
    return count;
  };

  const clearAllFilters = () => {
    setFilters({
      brand: "",
      model: "",
      yearRange: [2015, 2024],
      priceRange: [100000, 2000000],
      city: "",
      state: "",
      radiusKm: 50,
      fuelTypes: [],
      transmissions: [],
      mileageMax: 100000,
      owners: [],
      conditions: [],
      verificationStatus: [],
      sellerTypes: [],
      features: [],
      hasImages: false,
      hasWarranty: false,
      listedWithinDays: 30,
      sources: [],
      sortBy: "relevance",
      sortOrder: "asc",
      limit: 50
    });
    setActiveFilters([]);
  };

  const handleSearch = () => {
    // Convert filters to API format
    const searchFilters = {
      brand: filters.brand, // Keep brand as is, don't convert empty string to undefined
      model: filters.model || undefined,
      yearMin: filters.yearRange[0],
      yearMax: filters.yearRange[1],
      priceMin: filters.priceRange[0],
      priceMax: filters.priceRange[1],
      city: filters.city || undefined,
      state: filters.state || undefined,
      radiusKm: filters.radiusKm,
      fuelType: filters.fuelTypes.length ? filters.fuelTypes : undefined,
      transmission: filters.transmissions.length ? filters.transmissions : undefined,
      mileageMax: filters.mileageMax,
      owners: filters.owners.length ? filters.owners : undefined,
      condition: filters.conditions.length ? filters.conditions : undefined,
      verificationStatus: filters.verificationStatus.length ? filters.verificationStatus : undefined,
      sellerType: filters.sellerTypes.length ? filters.sellerTypes : undefined,
      features: filters.features.length ? filters.features : undefined,
      hasImages: filters.hasImages || undefined,
      hasWarranty: filters.hasWarranty || undefined,
      listedWithinDays: filters.listedWithinDays,
      sources: filters.sources.length ? filters.sources : undefined,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      limit: filters.limit
    };

    onSearch(searchFilters);
    setIsOpen(false);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Advanced Search
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary" className="ml-2">
                {getActiveFiltersCount()} active
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            {getActiveFiltersCount() > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              data-testid="button-toggle-filters"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Basic Filters */}
            <div>
              <h4 className="font-semibold mb-3">Basic Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Brand</Label>
                  <Select value={filters.brand} onValueChange={(value) => handleInputChange("brand", value)}>
                    <SelectTrigger data-testid="select-filter-brand">
                      <SelectValue placeholder="Select Brand" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Brands</SelectItem>
                      {brands.map(brand => (
                        <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Model</Label>
                  <Input
                    placeholder="Enter model"
                    value={filters.model}
                    onChange={(e) => handleInputChange("model", e.target.value)}
                    data-testid="input-filter-model"
                  />
                </div>

                <div>
                  <Label>City</Label>
                  <Select value={filters.city} onValueChange={(value) => handleInputChange("city", value)}>
                    <SelectTrigger data-testid="select-filter-city">
                      <SelectValue placeholder="Select City" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Cities</SelectItem>
                      {cities.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Price & Year Range */}
            <div>
              <h4 className="font-semibold mb-3">Price & Year</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Price Range (₹)</Label>
                  <div className="mt-2">
                    <Slider
                      value={filters.priceRange}
                      onValueChange={(value) => handleRangeChange("priceRange", value)}
                      min={50000}
                      max={5000000}
                      step={50000}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-1">
                      <span>₹{(filters.priceRange[0] / 100000).toFixed(1)}L</span>
                      <span>₹{(filters.priceRange[1] / 100000).toFixed(1)}L</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Year Range</Label>
                  <div className="mt-2">
                    <Slider
                      value={filters.yearRange}
                      onValueChange={(value) => handleRangeChange("yearRange", value)}
                      min={2000}
                      max={2024}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-1">
                      <span>{filters.yearRange[0]}</span>
                      <span>{filters.yearRange[1]}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Vehicle Specifications */}
            <div>
              <h4 className="font-semibold mb-3">Vehicle Specifications</h4>
              <div className="space-y-4">
                <div>
                  <Label>Fuel Type</Label>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mt-2">
                    {fuelTypes.map(fuel => (
                      <label key={fuel} className="flex items-center space-x-2 text-sm">
                        <Checkbox
                          checked={filters.fuelTypes.includes(fuel)}
                          onCheckedChange={(checked) => handleArrayFilterChange("fuelTypes", fuel, checked as boolean)}
                          data-testid={`checkbox-fuel-${fuel.toLowerCase()}`}
                        />
                        <span>{fuel}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Transmission</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                    {transmissions.map(trans => (
                      <label key={trans} className="flex items-center space-x-2 text-sm">
                        <Checkbox
                          checked={filters.transmissions.includes(trans)}
                          onCheckedChange={(checked) => handleArrayFilterChange("transmissions", trans, checked as boolean)}
                          data-testid={`checkbox-transmission-${trans.toLowerCase()}`}
                        />
                        <span>{trans}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Condition & Verification */}
            <div>
              <h4 className="font-semibold mb-3">Condition & Verification</h4>
              <div className="space-y-4">
                <div>
                  <Label>Condition</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                    {conditions.map(condition => (
                      <label key={condition} className="flex items-center space-x-2 text-sm">
                        <Checkbox
                          checked={filters.conditions.includes(condition)}
                          onCheckedChange={(checked) => handleArrayFilterChange("conditions", condition, checked as boolean)}
                          data-testid={`checkbox-condition-${condition.toLowerCase()}`}
                        />
                        <span>{condition}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Seller Type</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {sellerTypes.map(type => (
                      <label key={type} className="flex items-center space-x-2 text-sm">
                        <Checkbox
                          checked={filters.sellerTypes.includes(type)}
                          onCheckedChange={(checked) => handleArrayFilterChange("sellerTypes", type, checked as boolean)}
                          data-testid={`checkbox-seller-${type.toLowerCase()}`}
                        />
                        <span>{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Data Sources */}
            <div>
              <h4 className="font-semibold mb-3">Search Sources</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {sources.map(source => (
                  <label key={source} className="flex items-center space-x-2 text-sm">
                    <Checkbox
                      checked={filters.sources.includes(source)}
                      onCheckedChange={(checked) => handleArrayFilterChange("sources", source, checked as boolean)}
                      data-testid={`checkbox-source-${source.toLowerCase().replace(' ', '-')}`}
                    />
                    <span>{source}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Sort Options */}
            <div>
              <h4 className="font-semibold mb-3">Sort & Display</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Sort By</Label>
                  <Select value={filters.sortBy} onValueChange={(value) => handleInputChange("sortBy", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Relevance</SelectItem>
                      <SelectItem value="price">Price</SelectItem>
                      <SelectItem value="year">Year</SelectItem>
                      <SelectItem value="mileage">Mileage</SelectItem>
                      <SelectItem value="date">Listing Date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Sort Order</Label>
                  <Select value={filters.sortOrder} onValueChange={(value) => handleInputChange("sortOrder", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Low to High</SelectItem>
                      <SelectItem value="desc">High to Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Results Limit</Label>
                  <Select value={filters.limit.toString()} onValueChange={(value) => handleInputChange("limit", parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25 results</SelectItem>
                      <SelectItem value="50">50 results</SelectItem>
                      <SelectItem value="100">100 results</SelectItem>
                      <SelectItem value="200">200 results</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Search Button */}
            <div className="flex gap-4 pt-4 border-t">
              <Button 
                onClick={handleSearch}
                disabled={isLoading}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                data-testid="button-advanced-search"
              >
                <Search className="w-4 h-4 mr-2" />
                {isLoading ? 'Searching...' : `Search Across All Portals`}
              </Button>
              <Button variant="outline" onClick={clearAllFilters}>
                Clear All
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}