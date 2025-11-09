import { useState } from "react";
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
        className="w-full md:w-auto"
        data-testid="button-toggle-filters"
      >
        <SlidersHorizontal className="w-4 h-4 mr-2" />
        Filters {activeCount > 0 && `(${activeCount})`}
      </Button>
    );
  }

  return (
    <div className="glass-card p-6 space-y-6" data-testid="panel-filters">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5" />
          Filters
        </h3>
        {activeCount > 0 && (
          <Button
            onClick={handleClearAll}
            variant="ghost"
            size="sm"
            className="text-xs"
            data-testid="button-clear-filters"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Active Filters */}
      {activeCount > 0 && (
        <div className="flex flex-wrap gap-2" data-testid="active-filters-chips">
          {filters.brand && filters.brand !== "all" && (
            <Badge variant="secondary" className="gap-1">
              {filters.brand}
              <button onClick={() => onChange({ ...filters, brand: "all" })}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {(filters.priceMin > 0 || filters.priceMax < 5000000) && (
            <Badge variant="secondary" className="gap-1">
              ₹{(filters.priceMin / 100000).toFixed(1)}L - ₹{(filters.priceMax / 100000).toFixed(1)}L
              <button onClick={() => onChange({ ...filters, priceMin: 0, priceMax: 5000000 })}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.fuelType !== "all" && (
            <Badge variant="secondary" className="gap-1">
              {filters.fuelType}
              <button onClick={() => onChange({ ...filters, fuelType: "all" })}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.transmission !== "all" && (
            <Badge variant="secondary" className="gap-1">
              {filters.transmission}
              <button onClick={() => onChange({ ...filters, transmission: "all" })}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.city !== "all" && (
            <Badge variant="secondary" className="gap-1">
              {filters.city}
              <button onClick={() => onChange({ ...filters, city: "all" })}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Brand */}
      <div className="space-y-2">
        <Label htmlFor="brand" className="text-sm font-medium">Brand</Label>
        <Select value={filters.brand || "all"} onValueChange={(value) => onChange({ ...filters, brand: value })}>
          <SelectTrigger id="brand" data-testid="select-brand">
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
            <SelectItem value="Kia">Kia</SelectItem>
            <SelectItem value="MG">MG</SelectItem>
            <SelectItem value="Renault">Renault</SelectItem>
            <SelectItem value="Nissan">Nissan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Price Range */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Price Range</Label>
        <Slider
          value={[filters.priceMin, filters.priceMax]}
          onValueChange={handlePriceChange}
          min={0}
          max={5000000}
          step={50000}
          className="w-full"
          data-testid="slider-price"
        />
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>₹{(filters.priceMin / 100000).toFixed(1)}L</span>
          <span>₹{(filters.priceMax / 100000).toFixed(1)}L</span>
        </div>
      </div>

      {/* Fuel Type */}
      <div className="space-y-2">
        <Label htmlFor="fuel-type" className="text-sm font-medium">Fuel Type</Label>
        <Select value={filters.fuelType} onValueChange={(value) => onChange({ ...filters, fuelType: value })}>
          <SelectTrigger id="fuel-type" data-testid="select-fuel-type">
            <SelectValue placeholder="All Fuel Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Fuel Types</SelectItem>
            <SelectItem value="Petrol">Petrol</SelectItem>
            <SelectItem value="Diesel">Diesel</SelectItem>
            <SelectItem value="CNG">CNG</SelectItem>
            <SelectItem value="Electric">Electric</SelectItem>
            <SelectItem value="Hybrid">Hybrid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Transmission */}
      <div className="space-y-2">
        <Label htmlFor="transmission" className="text-sm font-medium">Transmission</Label>
        <Select value={filters.transmission} onValueChange={(value) => onChange({ ...filters, transmission: value })}>
          <SelectTrigger id="transmission" data-testid="select-transmission">
            <SelectValue placeholder="All Transmissions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Transmissions</SelectItem>
            <SelectItem value="Manual">Manual</SelectItem>
            <SelectItem value="Automatic">Automatic</SelectItem>
            <SelectItem value="AMT">AMT</SelectItem>
            <SelectItem value="CVT">CVT</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Year Range */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Year</Label>
        <Slider
          value={[filters.yearMin, filters.yearMax]}
          onValueChange={handleYearChange}
          min={2000}
          max={currentYear}
          step={1}
          className="w-full"
          data-testid="slider-year"
        />
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>{filters.yearMin}</span>
          <span>{filters.yearMax}</span>
        </div>
      </div>

      {/* City */}
      <div className="space-y-2">
        <Label htmlFor="city" className="text-sm font-medium">City</Label>
        <Select value={filters.city} onValueChange={(value) => onChange({ ...filters, city: value })}>
          <SelectTrigger id="city" data-testid="select-city">
            <SelectValue placeholder="All Cities" />
          </SelectTrigger>
          <SelectContent>
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

      {/* Apply Button */}
      <Button
        onClick={onSearch}
        className="w-full"
        data-testid="button-apply-filters"
      >
        Apply Filters
      </Button>
    </div>
  );
}
