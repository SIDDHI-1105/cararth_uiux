import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { useHapticFeedback, HapticButton } from "@/components/haptic-feedback";

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


  return (
    <div className="bg-background border-b border-border sticky top-0 z-40 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-3">
        {/* Streamlined Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
          {/* Essential Filters */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 flex-1 min-w-0">
            {/* Brand */}
            <Select value={filters.brand || 'all'} onValueChange={(value) => handleFilterChange('brand', value)}>
              <SelectTrigger className="w-full sm:w-[140px] h-9 sm:h-10 text-sm">
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
              <SelectTrigger className="w-full sm:w-[120px] h-9 sm:h-10 text-sm">
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
              <SelectTrigger className="w-full sm:w-[100px] h-9 sm:h-10 text-sm">
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
              <SelectTrigger className="w-full sm:w-[110px] h-9 sm:h-10 text-sm">
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
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            {/* Sort */}
            <Select 
              value={`${filters.sortBy || 'relevance'}-${filters.sortOrder || 'desc'}`} 
              onValueChange={(value) => {
                const [sortBy, sortOrder] = value.split('-');
                handleFilterChange('sortBy', sortBy);
                handleFilterChange('sortOrder', sortOrder);
              }}
            >
              <SelectTrigger className="w-full sm:w-[130px] h-9 sm:h-10 text-sm">
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
              className="h-9 sm:h-10 px-4 w-full sm:min-w-[100px] sm:w-auto"
              hapticType="button"
            >
              <Search className="w-4 h-4 mr-1" />
              {isLoading ? 'Searching...' : 'Search'}
            </HapticButton>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
          <div>
            {resultsCount > 0 ? (
              <span>{resultsCount.toLocaleString()} cars found</span>
            ) : (
              <>
                <span className="hidden sm:inline">Search for your perfect car</span>
                <span className="sm:hidden">Find your car</span>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}