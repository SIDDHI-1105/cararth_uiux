import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { X, Search, Filter, SlidersHorizontal, ChevronDown } from "lucide-react";
import { useHapticFeedback, HapticButton } from "@/components/haptic-feedback";
import { cn } from "@/lib/utils";

export interface UnifiedFilters {
  // Core filters
  brand?: string;
  model?: string;
  city?: string;
  fuelType?: string;
  transmission?: string;
  
  // Price range
  priceMin?: number;
  priceMax?: number;
  
  // Year range
  yearMin?: number;
  yearMax?: number;
  
  // Other filters
  owners?: number;
  mileageMax?: number;
  
  // Search and sort
  query?: string;
  sortBy?: 'price' | 'year' | 'mileage' | 'relevance';
  sortOrder?: 'asc' | 'desc';
}

interface UnifiedFiltersProps {
  filters: UnifiedFilters;
  onFiltersChange: (filters: UnifiedFilters) => void;
  onSearch: () => void;
  resultsCount?: number;
  isLoading?: boolean;
  showAdvanced?: boolean;
}

export default function UnifiedFilters({
  filters,
  onFiltersChange,
  onSearch,
  resultsCount = 0,
  isLoading = false,
  showAdvanced = false
}: UnifiedFiltersProps) {
  const { feedback } = useHapticFeedback();
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000000]);
  const [yearRange, setYearRange] = useState<[number, number]>([2005, 2024]);

  // Update internal ranges when filters change
  useEffect(() => {
    setPriceRange([filters.priceMin || 0, filters.priceMax || 10000000]);
  }, [filters.priceMin, filters.priceMax]);

  useEffect(() => {
    setYearRange([filters.yearMin || 2005, filters.yearMax || 2024]);
  }, [filters.yearMin, filters.yearMax]);

  // Update filters when internal ranges change
  const handlePriceChange = (values: number[]) => {
    setPriceRange([values[0], values[1]]);
    onFiltersChange({
      ...filters,
      priceMin: values[0] > 0 ? values[0] : undefined,
      priceMax: values[1] < 10000000 ? values[1] : undefined,
    });
  };

  const handleYearChange = (values: number[]) => {
    setYearRange([values[0], values[1]]);
    onFiltersChange({
      ...filters,
      yearMin: values[0] > 2005 ? values[0] : undefined,
      yearMax: values[1] < 2024 ? values[1] : undefined,
    });
  };

  const handleFilterChange = (key: keyof UnifiedFilters, value: string | undefined) => {
    feedback.selection();
    onFiltersChange({
      ...filters,
      [key]: value === 'all' || value === '' ? undefined : value,
    });
  };

  const handleSearch = () => {
    feedback.button();
    onSearch();
  };

  const clearAllFilters = () => {
    feedback.navigation();
    onFiltersChange({
      sortBy: filters.sortBy || 'relevance',
      sortOrder: filters.sortOrder || 'desc',
    });
    setPriceRange([0, 10000000]);
    setYearRange([2005, 2024]);
  };

  const formatPrice = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    return `₹${(value / 1000).toFixed(0)}K`;
  };

  // Count active filters
  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => 
    value !== undefined && value !== '' && !['sortBy', 'sortOrder'].includes(key)
  ).length;

  return (
    <div className="bg-background border-b border-border sticky top-0 z-40 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-3">
        {/* Main Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 mb-3">
          {/* Primary Filters - Always Visible */}
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
            {/* Brand */}
            <Select value={filters.brand || 'all'} onValueChange={(value) => handleFilterChange('brand', value)}>
              <SelectTrigger className="w-[140px] h-10 text-sm">
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
                <SelectItem value="Ford">Ford</SelectItem>
                <SelectItem value="Renault">Renault</SelectItem>
                <SelectItem value="Nissan">Nissan</SelectItem>
              </SelectContent>
            </Select>

            {/* City */}
            <Select value={filters.city || 'all'} onValueChange={(value) => handleFilterChange('city', value)}>
              <SelectTrigger className="w-[120px] h-10 text-sm">
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                <SelectItem value="Hyderabad">🚀 Hyderabad</SelectItem>
                <SelectItem value="Delhi">Delhi NCR</SelectItem>
                <SelectItem value="Mumbai">Mumbai</SelectItem>
                <SelectItem value="Bangalore">Bangalore</SelectItem>
                <SelectItem value="Chennai">Chennai</SelectItem>
                <SelectItem value="Pune">Pune</SelectItem>
              </SelectContent>
            </Select>

            {/* Fuel Type */}
            <Select value={filters.fuelType || 'all'} onValueChange={(value) => handleFilterChange('fuelType', value)}>
              <SelectTrigger className="w-[100px] h-10 text-sm">
                <SelectValue placeholder="Fuel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Fuel</SelectItem>
                <SelectItem value="Petrol">Petrol</SelectItem>
                <SelectItem value="Diesel">Diesel</SelectItem>
                <SelectItem value="CNG">CNG</SelectItem>
                <SelectItem value="Electric">Electric</SelectItem>
              </SelectContent>
            </Select>

            {/* Price Range Quick Select */}
            <Select 
              value={
                filters.priceMin === 200000 && filters.priceMax === 500000 ? "2-5L" :
                filters.priceMin === 500000 && filters.priceMax === 1000000 ? "5-10L" :
                filters.priceMin === 1000000 && filters.priceMax === 2000000 ? "10-20L" :
                "custom"
              }
              onValueChange={(value) => {
                if (value === "2-5L") {
                  handleFilterChange('priceMin', '200000');
                  handleFilterChange('priceMax', '500000');
                } else if (value === "5-10L") {
                  handleFilterChange('priceMin', '500000');
                  handleFilterChange('priceMax', '1000000');
                } else if (value === "10-20L") {
                  handleFilterChange('priceMin', '1000000');
                  handleFilterChange('priceMax', '2000000');
                } else if (value === "all") {
                  handleFilterChange('priceMin', undefined);
                  handleFilterChange('priceMax', undefined);
                }
              }}
            >
              <SelectTrigger className="w-[110px] h-10 text-sm">
                <SelectValue placeholder="Budget" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Budget</SelectItem>
                <SelectItem value="2-5L">₹2,00,000-5,00,000</SelectItem>
                <SelectItem value="5-10L">₹5,00,000-10,00,000</SelectItem>
                <SelectItem value="10-20L">₹10,00,000-20,00,000</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* More Filters Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                feedback.navigation();
                setShowFilters(!showFilters);
              }}
              className={cn(
                "h-10 px-3 text-sm",
                activeFiltersCount > 0 && "border-primary text-primary"
              )}
            >
              <SlidersHorizontal className="w-4 h-4 mr-1" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1 text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>

            {/* Sort */}
            <Select 
              value={`${filters.sortBy || 'relevance'}-${filters.sortOrder || 'desc'}`} 
              onValueChange={(value) => {
                const [sortBy, sortOrder] = value.split('-');
                handleFilterChange('sortBy', sortBy);
                handleFilterChange('sortOrder', sortOrder);
              }}
            >
              <SelectTrigger className="w-[130px] h-10 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance-desc">Most Relevant</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="year-desc">Year: Newest First</SelectItem>
                <SelectItem value="year-asc">Year: Oldest First</SelectItem>
                <SelectItem value="mileage-asc">Mileage: Low to High</SelectItem>
              </SelectContent>
            </Select>

            {/* Search Button */}
            <HapticButton
              onClick={handleSearch}
              disabled={isLoading}
              size="md"
              className="h-10 px-4 min-w-[100px]"
              hapticType="button"
            >
              <Search className="w-4 h-4 mr-1" />
              {isLoading ? 'Searching...' : 'Search'}
            </HapticButton>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            {resultsCount > 0 ? (
              <span>{resultsCount.toLocaleString()} cars found</span>
            ) : (
              <span>Search for your perfect car</span>
            )}
          </div>
          
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-auto p-1 text-xs hover:text-foreground"
            >
              Clear all filters
            </Button>
          )}
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-accent/30 rounded-lg border border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Model */}
              <div>
                <label className="block text-sm font-medium mb-2">Model</label>
                <Select value={filters.model || 'all'} onValueChange={(value) => handleFilterChange('model', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any Model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Model</SelectItem>
                    <SelectItem value="Swift">Swift</SelectItem>
                    <SelectItem value="Alto">Alto</SelectItem>
                    <SelectItem value="i20">i20</SelectItem>
                    <SelectItem value="Creta">Creta</SelectItem>
                    <SelectItem value="City">City</SelectItem>
                    <SelectItem value="Amaze">Amaze</SelectItem>
                    <SelectItem value="Nexon">Nexon</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Transmission */}
              <div>
                <label className="block text-sm font-medium mb-2">Transmission</label>
                <Select value={filters.transmission || 'all'} onValueChange={(value) => handleFilterChange('transmission', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any</SelectItem>
                    <SelectItem value="Manual">Manual</SelectItem>
                    <SelectItem value="Automatic">Automatic</SelectItem>
                    <SelectItem value="AMT">AMT</SelectItem>
                    <SelectItem value="CVT">CVT</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Owners */}
              <div>
                <label className="block text-sm font-medium mb-2">Owners</label>
                <Select 
                  value={filters.owners?.toString() || 'all'} 
                  onValueChange={(value) => handleFilterChange('owners', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any</SelectItem>
                    <SelectItem value="1">1st Owner</SelectItem>
                    <SelectItem value="2">2nd Owner</SelectItem>
                    <SelectItem value="3">3rd Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range Slider */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Price Range: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                </label>
                <Slider
                  value={priceRange}
                  onValueChange={handlePriceChange}
                  max={10000000}
                  min={0}
                  step={100000}
                  className="w-full"
                />
              </div>

              {/* Year Range Slider */}
              <div className="md:col-span-1">
                <label className="block text-sm font-medium mb-2">
                  Year: {yearRange[0]} - {yearRange[1]}
                </label>
                <Slider
                  value={yearRange}
                  onValueChange={handleYearChange}
                  max={2024}
                  min={2005}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>

            {/* Active Filters */}
            {activeFiltersCount > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex flex-wrap gap-2">
                  {Object.entries(filters).map(([key, value]) => {
                    if (!value || ['sortBy', 'sortOrder'].includes(key)) return null;
                    
                    return (
                      <Badge key={key} variant="secondary" className="flex items-center gap-1">
                        <span className="text-xs">
                          {key === 'priceMin' ? `Min: ${formatPrice(Number(value))}` :
                           key === 'priceMax' ? `Max: ${formatPrice(Number(value))}` :
                           key === 'yearMin' ? `From: ${value}` :
                           key === 'yearMax' ? `To: ${value}` :
                           key === 'owners' ? `${value} Owner${Number(value) > 1 ? 's' : ''}` :
                           `${key}: ${value}`}
                        </span>
                        <X 
                          className="w-3 h-3 cursor-pointer hover:text-destructive" 
                          onClick={() => {
                            feedback.selection();
                            handleFilterChange(key as keyof UnifiedFilters, undefined);
                          }}
                        />
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}