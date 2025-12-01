// FILE: client/src/components/filter-panel.tsx – Luxury Glassmorphic redesign applied

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { X, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface FilterState {
  brand?: string;
  priceMin: number;
  priceMax: number;
  fuelType: string;
  transmission: string;
  yearMin: number;
  yearMax: number;
  city: string;
}

interface FilterPanelProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onSearch: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function FilterPanel({ filters, onChange, onSearch, isCollapsed = false, onToggleCollapse }: FilterPanelProps) {
  const currentYear = new Date().getFullYear();

  const handlePriceChange = (values: number[]) => {
    onChange({ ...filters, priceMin: values[0], priceMax: values[1] });
  };

  const handleYearChange = (values: number[]) => {
    onChange({ ...filters, yearMin: values[0], yearMax: values[1] });
  };

  const handleClearAll = () => {
    onChange({
      brand: "all",
      priceMin: 0,
      priceMax: 5000000,
      fuelType: "all",
      transmission: "all",
      yearMin: 2000,
      yearMax: currentYear,
      city: "all",
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.brand && filters.brand !== "all") count++;
    if (filters.priceMin > 0 || filters.priceMax < 5000000) count++;
    if (filters.fuelType !== "all") count++;
    if (filters.transmission !== "all") count++;
    if (filters.yearMin > 2000 || filters.yearMax < currentYear) count++;
    if (filters.city !== "all") count++;
    return count;
  };

  const activeCount = getActiveFiltersCount();

  if (isCollapsed) {
    return (
      <Button
        onClick={onToggleCollapse}
        variant="outline"
        className="w-full md:w-auto btn-primary-premium"
        data-testid="button-toggle-filters"
      >
        <SlidersHorizontal className="w-4 h-4 mr-2" />
        Filters {activeCount > 0 && `(${activeCount})`}
      </Button>
    );
  }

  return (
    <div
      className="glass-card-premium p-8 space-y-8 transition-all duration-500 animate-slide-in-up"
      data-testid="panel-filters"
    >
      {/* Header with Icon */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div
            className="p-3 rounded-2xl transition-all duration-300"
            style={{
              backgroundColor: 'rgba(0, 113, 227, 0.1)',
              boxShadow: '0 0 20px rgba(0, 113, 227, 0.2)'
            }}
          >
            <SlidersHorizontal className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 dark:text-white">
            Filters
          </h3>
        </div>
        {activeCount > 0 && (
          <Button
            onClick={handleClearAll}
            variant="ghost"
            size="sm"
            className="text-sm font-bold hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-all duration-300 hover:scale-105"
            data-testid="button-clear-filters"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Active Filters - Premium Glass Badges */}
      {activeCount > 0 && (
        <div className="flex flex-wrap gap-3 animate-slide-in-up" data-testid="active-filters-chips">
          {filters.brand && filters.brand !== "all" && (
            <Badge
              variant="secondary"
              className="gap-2 backdrop-blur-md bg-blue-500/10 text-blue-700 border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20 px-4 py-2 text-sm font-bold transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              {filters.brand}
              <button
                onClick={() => onChange({ ...filters, brand: "all" })}
                className="hover:text-red-600 transition-colors hover:scale-110"
              >
                <X className="w-4 h-4" />
              </button>
            </Badge>
          )}
          {(filters.priceMin > 0 || filters.priceMax < 5000000) && (
            <Badge
              variant="secondary"
              className="gap-2 backdrop-blur-md bg-green-500/10 text-green-700 border-green-500/20 dark:bg-green-500/10 dark:text-green-300 dark:border-green-500/20 px-4 py-2 text-sm font-bold transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              ₹{(filters.priceMin / 100000).toFixed(1)}L - ₹{(filters.priceMax / 100000).toFixed(1)}L
              <button
                onClick={() => onChange({ ...filters, priceMin: 0, priceMax: 5000000 })}
                className="hover:text-red-600 transition-colors hover:scale-110"
              >
                <X className="w-4 h-4" />
              </button>
            </Badge>
          )}
          {filters.fuelType !== "all" && (
            <Badge
              variant="secondary"
              className="gap-2 backdrop-blur-md bg-purple-500/10 text-purple-700 border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-500/20 px-4 py-2 text-sm font-bold transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              {filters.fuelType}
              <button
                onClick={() => onChange({ ...filters, fuelType: "all" })}
                className="hover:text-red-600 transition-colors hover:scale-110"
              >
                <X className="w-4 h-4" />
              </button>
            </Badge>
          )}
          {filters.transmission !== "all" && (
            <Badge
              variant="secondary"
              className="gap-2 backdrop-blur-md bg-orange-500/10 text-orange-700 border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-300 dark:border-orange-500/20 px-4 py-2 text-sm font-bold transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              {filters.transmission}
              <button
                onClick={() => onChange({ ...filters, transmission: "all" })}
                className="hover:text-red-600 transition-colors hover:scale-110"
              >
                <X className="w-4 h-4" />
              </button>
            </Badge>
          )}
          {filters.city !== "all" && (
            <Badge
              variant="secondary"
              className="gap-2 backdrop-blur-md bg-indigo-500/10 text-indigo-700 border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/20 px-4 py-2 text-sm font-bold transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              {filters.city}
              <button
                onClick={() => onChange({ ...filters, city: "all" })}
                className="hover:text-red-600 transition-colors hover:scale-110"
              >
                <X className="w-4 h-4" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Brand Filter */}
      <div className="space-y-3">
        <Label htmlFor="brand" className="text-sm font-bold text-gray-700 dark:text-gray-300">
          Brand
        </Label>
        <Select value={filters.brand || "all"} onValueChange={(value) => onChange({ ...filters, brand: value })}>
          <SelectTrigger
            id="brand"
            data-testid="select-brand"
            className="backdrop-blur-md bg-white/50 dark:bg-white/5 border-2 hover:border-blue-500/50 transition-all duration-300 h-12 rounded-2xl font-semibold"
          >
            <SelectValue placeholder="All Brands" />
          </SelectTrigger>
          <SelectContent className="backdrop-blur-2xl bg-white/95 dark:bg-gray-900/95 border-2">
            <SelectItem value="all">All Brands</SelectItem>
            <SelectItem value="Maruti Suzuki">Maruti Suzuki</SelectItem>
            <SelectItem value="Hyundai">Hyundai</SelectItem>
            <SelectItem value="Tata">Tata</SelectItem>
            <SelectItem value="Mahindra">Mahindra</SelectItem>
            <SelectItem value="Honda">Honda</SelectItem>
            <SelectItem value="Toyota">Toyota</SelectItem>
            <SelectItem value="Kia">Kia</SelectItem>
            <SelectItem value="MG">MG</SelectItem>
            <SelectItem value="Renault">Renault</SelectItem>
            <SelectItem value="Nissan">Nissan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Price Range Slider */}
      <div className="space-y-4">
        <Label className="text-sm font-bold text-gray-700 dark:text-gray-300">
          Price Range
        </Label>
        <div
          className="p-4 rounded-2xl backdrop-blur-md border-2 transition-all duration-300"
          style={{
            backgroundColor: 'rgba(0, 113, 227, 0.03)',
            borderColor: 'rgba(0, 113, 227, 0.1)'
          }}
        >
          <Slider
            value={[filters.priceMin, filters.priceMax]}
            onValueChange={handlePriceChange}
            min={0}
            max={5000000}
            step={50000}
            className="w-full"
            data-testid="slider-price"
          />
          <div className="flex justify-between mt-4 text-sm font-bold">
            <span className="text-blue-600 dark:text-blue-400">₹{(filters.priceMin / 100000).toFixed(1)}L</span>
            <span className="text-blue-600 dark:text-blue-400">₹{(filters.priceMax / 100000).toFixed(1)}L</span>
          </div>
        </div>
      </div>

      {/* Fuel Type Filter */}
      <div className="space-y-3">
        <Label htmlFor="fuel-type" className="text-sm font-bold text-gray-700 dark:text-gray-300">
          Fuel Type
        </Label>
        <Select value={filters.fuelType} onValueChange={(value) => onChange({ ...filters, fuelType: value })}>
          <SelectTrigger
            id="fuel-type"
            data-testid="select-fuel-type"
            className="backdrop-blur-md bg-white/50 dark:bg-white/5 border-2 hover:border-blue-500/50 transition-all duration-300 h-12 rounded-2xl font-semibold"
          >
            <SelectValue placeholder="All Fuel Types" />
          </SelectTrigger>
          <SelectContent className="backdrop-blur-2xl bg-white/95 dark:bg-gray-900/95 border-2">
            <SelectItem value="all">All Fuel Types</SelectItem>
            <SelectItem value="Petrol">Petrol</SelectItem>
            <SelectItem value="Diesel">Diesel</SelectItem>
            <SelectItem value="CNG">CNG</SelectItem>
            <SelectItem value="Electric">Electric</SelectItem>
            <SelectItem value="Hybrid">Hybrid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Transmission Filter */}
      <div className="space-y-3">
        <Label htmlFor="transmission" className="text-sm font-bold text-gray-700 dark:text-gray-300">
          Transmission
        </Label>
        <Select value={filters.transmission} onValueChange={(value) => onChange({ ...filters, transmission: value })}>
          <SelectTrigger
            id="transmission"
            data-testid="select-transmission"
            className="backdrop-blur-md bg-white/50 dark:bg-white/5 border-2 hover:border-blue-500/50 transition-all duration-300 h-12 rounded-2xl font-semibold"
          >
            <SelectValue placeholder="All Transmissions" />
          </SelectTrigger>
          <SelectContent className="backdrop-blur-2xl bg-white/95 dark:bg-gray-900/95 border-2">
            <SelectItem value="all">All Transmissions</SelectItem>
            <SelectItem value="Manual">Manual</SelectItem>
            <SelectItem value="Automatic">Automatic</SelectItem>
            <SelectItem value="AMT">AMT</SelectItem>
            <SelectItem value="CVT">CVT</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Year Range Slider */}
      <div className="space-y-4">
        <Label className="text-sm font-bold text-gray-700 dark:text-gray-300">
          Year Range
        </Label>
        <div
          className="p-4 rounded-2xl backdrop-blur-md border-2 transition-all duration-300"
          style={{
            backgroundColor: 'rgba(0, 245, 160, 0.03)',
            borderColor: 'rgba(0, 245, 160, 0.1)'
          }}
        >
          <Slider
            value={[filters.yearMin, filters.yearMax]}
            onValueChange={handleYearChange}
            min={2000}
            max={currentYear}
            step={1}
            className="w-full"
            data-testid="slider-year"
          />
          <div className="flex justify-between mt-4 text-sm font-bold">
            <span className="text-green-600 dark:text-green-400">{filters.yearMin}</span>
            <span className="text-green-600 dark:text-green-400">{filters.yearMax}</span>
          </div>
        </div>
      </div>

      {/* City Filter */}
      <div className="space-y-3">
        <Label htmlFor="city" className="text-sm font-bold text-gray-700 dark:text-gray-300">
          City
        </Label>
        <Select value={filters.city} onValueChange={(value) => onChange({ ...filters, city: value })}>
          <SelectTrigger
            id="city"
            data-testid="select-city"
            className="backdrop-blur-md bg-white/50 dark:bg-white/5 border-2 hover:border-blue-500/50 transition-all duration-300 h-12 rounded-2xl font-semibold"
          >
            <SelectValue placeholder="All Cities" />
          </SelectTrigger>
          <SelectContent className="backdrop-blur-2xl bg-white/95 dark:bg-gray-900/95 border-2">
            <SelectItem value="all">All Cities</SelectItem>
            <SelectItem value="Hyderabad">Hyderabad</SelectItem>
            <SelectItem value="Delhi">Delhi</SelectItem>
            <SelectItem value="Mumbai">Mumbai</SelectItem>
            <SelectItem value="Bangalore">Bangalore</SelectItem>
            <SelectItem value="Pune">Pune</SelectItem>
            <SelectItem value="Chennai">Chennai</SelectItem>
            <SelectItem value="Kolkata">Kolkata</SelectItem>
            <SelectItem value="Ahmedabad">Ahmedabad</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Apply Button - Premium */}
      <Button
        onClick={onSearch}
        className="w-full btn-primary-premium h-14 text-lg font-bold shadow-2xl"
        data-testid="button-apply-filters"
      >
        Apply Filters
      </Button>
    </div>
  );
}
