import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface CarFiltersProps {
  onApplyFilters: (filters: {
    priceRanges: string[];
    brands: string[];
    years: string[];
    transmissions: string[];
  }) => void;
}

export default function CarFilters({ onApplyFilters }: CarFiltersProps) {
  const [priceRanges, setPriceRanges] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [years, setYears] = useState<string[]>([]);
  const [transmissions, setTransmissions] = useState<string[]>([]);

  const handlePriceChange = (price: string, checked: boolean) => {
    if (checked) {
      setPriceRanges([...priceRanges, price]);
    } else {
      setPriceRanges(priceRanges.filter(p => p !== price));
    }
  };

  const handleBrandChange = (brand: string, checked: boolean) => {
    if (checked) {
      setBrands([...brands, brand]);
    } else {
      setBrands(brands.filter(b => b !== brand));
    }
  };

  const handleYearChange = (year: string, checked: boolean) => {
    if (checked) {
      setYears([...years, year]);
    } else {
      setYears(years.filter(y => y !== year));
    }
  };

  const handleTransmissionChange = (transmission: string, checked: boolean) => {
    if (checked) {
      setTransmissions([...transmissions, transmission]);
    } else {
      setTransmissions(transmissions.filter(t => t !== transmission));
    }
  };

  const handleApplyFilters = () => {
    onApplyFilters({ priceRanges, brands, years, transmissions });
  };

  return (
    <aside className="lg:w-1/4">
      <div className="bg-card rounded-lg border border-border p-6 filter-sidebar">
        <h3 className="text-lg font-semibold mb-4">Filters</h3>
        
        {/* Price Filter */}
        <div className="mb-6">
          <h4 className="font-medium mb-3">Price Range</h4>
          <div className="space-y-2">
            {[
              { label: "Under ₹2 Lakh", value: "0-200000" },
              { label: "₹2-5 Lakh", value: "200000-500000" },
              { label: "₹5-10 Lakh", value: "500000-1000000" },
              { label: "₹10-15 Lakh", value: "1000000-1500000" }
            ].map((price) => (
              <div key={price.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`price-${price.value}`}
                  checked={priceRanges.includes(price.value)}
                  onCheckedChange={(checked) => handlePriceChange(price.value, checked as boolean)}
                  data-testid={`checkbox-price-${price.value}`}
                />
                <label htmlFor={`price-${price.value}`} className="text-sm cursor-pointer">
                  {price.label}
                </label>
              </div>
            ))}
          </div>
        </div>
        
        {/* Brand Filter */}
        <div className="mb-6">
          <h4 className="font-medium mb-3">Brand</h4>
          <div className="space-y-2">
            {["Maruti Suzuki", "Hyundai", "Tata", "Mahindra"].map((brand) => (
              <div key={brand} className="flex items-center space-x-2">
                <Checkbox
                  id={`brand-${brand}`}
                  checked={brands.includes(brand)}
                  onCheckedChange={(checked) => handleBrandChange(brand, checked as boolean)}
                  data-testid={`checkbox-brand-${brand.toLowerCase().replace(' ', '-')}`}
                />
                <label htmlFor={`brand-${brand}`} className="text-sm cursor-pointer">
                  {brand}
                </label>
              </div>
            ))}
          </div>
        </div>
        
        {/* Year Filter */}
        <div className="mb-6">
          <h4 className="font-medium mb-3">Year</h4>
          <div className="space-y-2">
            {[
              { label: "2020 & Above", value: "2020-2024" },
              { label: "2015-2019", value: "2015-2019" },
              { label: "2010-2014", value: "2010-2014" }
            ].map((year) => (
              <div key={year.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`year-${year.value}`}
                  checked={years.includes(year.value)}
                  onCheckedChange={(checked) => handleYearChange(year.value, checked as boolean)}
                  data-testid={`checkbox-year-${year.value}`}
                />
                <label htmlFor={`year-${year.value}`} className="text-sm cursor-pointer">
                  {year.label}
                </label>
              </div>
            ))}
          </div>
        </div>
        
        {/* Transmission Filter */}
        <div className="mb-6">
          <h4 className="font-medium mb-3">Transmission</h4>
          <div className="space-y-2">
            {["Manual", "Automatic"].map((transmission) => (
              <div key={transmission} className="flex items-center space-x-2">
                <Checkbox
                  id={`transmission-${transmission}`}
                  checked={transmissions.includes(transmission)}
                  onCheckedChange={(checked) => handleTransmissionChange(transmission, checked as boolean)}
                  data-testid={`checkbox-transmission-${transmission.toLowerCase()}`}
                />
                <label htmlFor={`transmission-${transmission}`} className="text-sm cursor-pointer">
                  {transmission}
                </label>
              </div>
            ))}
          </div>
        </div>
        
        <Button 
          onClick={handleApplyFilters}
          className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md font-medium hover:bg-primary/90 transition-colors"
          data-testid="button-apply-filters"
        >
          Apply Filters
        </Button>
      </div>
    </aside>
  );
}
