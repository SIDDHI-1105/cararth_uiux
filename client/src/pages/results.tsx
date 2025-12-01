import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { SEOHead } from "@/components/seo-head";
import Layout from "@/components/layout";
import { FilterPanel, FilterState } from "@/components/filter-panel";
import { ListingCard } from "@/components/listing-card";
import { SkeletonCard } from "@/components/skeleton-card";
import { BadgeLegend } from "@/components/badge-legend";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function Results() {
  const currentYear = new Date().getFullYear();
  
  const [filters, setFilters] = useState<FilterState>({
    brand: "all",
    priceMin: 0,
    priceMax: 5000000,
    fuelType: "all",
    transmission: "all",
    yearMin: 2000,
    yearMax: currentYear,
    city: "all",
  });

  // Parse URL query params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const newFilters: Partial<FilterState> = {};
    
    if (params.has("brand")) {
      newFilters.brand = params.get("brand")!;
    }
    if (params.has("city")) {
      newFilters.city = params.get("city")!;
    }
    if (params.has("fuelType")) {
      newFilters.fuelType = params.get("fuelType")!;
    }
    if (params.has("budget")) {
      const budget = params.get("budget")!;
      const [min, max] = budget.split("-").map(Number);
      if (min) newFilters.priceMin = min;
      if (max && max !== 99999999) newFilters.priceMax = max;
    }
    
    if (Object.keys(newFilters).length > 0) {
      setFilters(prev => ({ ...prev, ...newFilters }));
    }
  }, []);

  const [sortBy, setSortBy] = useState("price-low");
  const [showFilters, setShowFilters] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  // Fetch cars based on filters
  const { data: cars = [], isLoading, error } = useQuery<any[]>({
    queryKey: ["/api/marketplace/search", filters],
    queryFn: async () => {
      const searchFilters: any = {
        brand: filters.brand && filters.brand !== "all" ? filters.brand : undefined,
        priceMin: filters.priceMin > 0 ? filters.priceMin : undefined,
        priceMax: filters.priceMax < 5000000 ? filters.priceMax : undefined,
        fuelType: filters.fuelType !== "all" ? [filters.fuelType] : undefined,
        transmission: filters.transmission !== "all" ? [filters.transmission] : undefined,
        city: filters.city !== "all" ? filters.city : undefined,
        limit: 50,
      };

      try {
        const response = await apiRequest('POST', '/api/marketplace/search', searchFilters);
        const result = await response.json();
        const listings = result.listings || [];
        return listings;
      } catch (error) {
        console.error('Search error:', error);
        return [];
      }
    },
  });

  // Helper function to check if listing has valid images
  const hasValidImages = (car: any): boolean => {
    if (!car.images || !Array.isArray(car.images) || car.images.length === 0) {
      return false;
    }
    
    // Check if the first image is a placeholder or invalid
    const firstImage = car.images[0];
    const placeholderPatterns = [
      'placehold.co',
      'placeholder',
      'spacer',
      'no-image',
      'no+image'
    ];
    
    return !placeholderPatterns.some(pattern => 
      firstImage.toLowerCase().includes(pattern)
    );
  };

  // Filter by source and sort cars
  const sortedCars = useMemo(() => {
    if (!cars.length) return [];
    
    // Filter by source type
    let filtered = cars;
    if (sourceFilter !== "all") {
      filtered = cars.filter(car => car.listingSource === sourceFilter);
    }
    
    // Sort filtered results - ALWAYS prioritize listings with valid images
    return [...filtered].sort((a, b) => {
      // First priority: listings with valid images come first
      const aHasImages = hasValidImages(a);
      const bHasImages = hasValidImages(b);
      
      if (aHasImages && !bHasImages) return -1;
      if (!aHasImages && bHasImages) return 1;
      
      // If both have images or both don't, apply user-selected sort
      switch (sortBy) {
        case "price-low":
          return parseFloat(a.price) - parseFloat(b.price);
        case "price-high":
          return parseFloat(b.price) - parseFloat(a.price);
        case "year-new":
          return b.year - a.year;
        case "mileage-low":
          return (a.mileage || a.kmDriven || 0) - (b.mileage || b.kmDriven || 0);
        default:
          return 0;
      }
    });
  }, [cars, sortBy, sourceFilter]);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleSearch = () => {
    setShowFilters(false);
  };

  // Helper function to safely parse price from various Indian formats
  // Handles all variants: ₹ 12,45,000, ₹ 12.45 Lakh, ₹ 5 Lakhs, ₹ 1 Cr 25 Lakh 50 Thousand
  const parseSafePrice = (price: any): number | undefined => {
    if (price === null || price === undefined || price === "") return undefined;
    
    // If already a number, return it (including 0)
    if (typeof price === "number") return isNaN(price) ? undefined : price;
    
    // If string, handle Indian formats by detecting and summing ALL components
    if (typeof price === "string") {
      let str = price.toLowerCase().trim();
      
      // Remove currency symbols
      str = str.replace(/[₹$]/g, "");
      
      let total = 0;
      
      // Extract crore component(s) - handle singular/plural (word boundary to avoid "across")
      const croreMatches = str.match(/(\d+(?:\.\d+)?)\s*(?:crores?|crs?)\b/g);
      if (croreMatches) {
        croreMatches.forEach(match => {
          const num = parseFloat(match.match(/(\d+(?:\.\d+)?)/)?.[1] || "0");
          total += num * 10000000;
          str = str.replace(match, "");
        });
      }
      
      // Extract lakh component(s) - handle singular/plural/lac/lacs
      const lakhMatches = str.match(/(\d+(?:\.\d+)?)\s*(?:lakhs?|lacs?)\b/g);
      if (lakhMatches) {
        lakhMatches.forEach(match => {
          const num = parseFloat(match.match(/(\d+(?:\.\d+)?)/)?.[1] || "0");
          total += num * 100000;
          str = str.replace(match, "");
        });
      }
      
      // Extract thousand component(s) - handle K and spelled-out
      const thousandMatches = str.match(/(\d+(?:\.\d+)?)\s*(?:thousands?|ths?|k)\b/g);
      if (thousandMatches) {
        thousandMatches.forEach(match => {
          const num = parseFloat(match.match(/(\d+(?:\.\d+)?)/)?.[1] || "0");
          total += num * 1000;
          str = str.replace(match, "");
        });
      }
      
      // If no unit found, try to parse as plain number (with commas)
      if (total === 0) {
        const cleaned = str.replace(/[,\s]/g, "").replace(/[^\d.]/g, "");
        const parsed = parseFloat(cleaned);
        if (!isNaN(parsed)) {
          return parsed;
        }
      } else {
        // Add any remaining plain number (e.g., "1 Cr 50" → crore + 50)
        const remaining = str.replace(/[,\s]/g, "").replace(/[^\d.]/g, "");
        if (remaining && !isNaN(parseFloat(remaining))) {
          total += parseFloat(remaining);
        }
      }
      
      return total >= 0 ? total : undefined;
    }
    
    return undefined;
  };

  // Schema.org ItemList markup for search results (only include vehicles with valid data)
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Used Cars for Sale in India",
    description: "Browse verified used car listings from across India with AI-powered verification and authenticity checks.",
    numberOfItems: sortedCars.length,
    itemListElement: sortedCars.slice(0, 20).map((car, index) => {
      const safePrice = parseSafePrice(car.price);
      
      return {
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": ["Vehicle", "Product"],
          name: car.title || `${car.make} ${car.model} ${car.year}`,
          url: `https://www.cararth.com/listing/${car.id}`,
          ...(car.images?.[0] || car.imageUrl ? { image: car.images?.[0] || car.imageUrl } : {}),
          ...(car.make || car.brand ? { manufacturer: car.make || car.brand } : {}),
          ...(car.model && { model: car.model }),
          ...(car.year && { vehicleModelDate: car.year.toString() }),
          ...((car.mileage || car.kmDriven) && {
            mileageFromOdometer: {
              "@type": "QuantitativeValue",
              value: car.mileage || car.kmDriven,
              unitCode: "KMT"
            }
          }),
          ...(car.fuelType && { fuelType: car.fuelType }),
          ...(car.transmission && { vehicleTransmission: car.transmission }),
          ...(safePrice !== undefined && {
            offers: {
              "@type": "Offer",
              price: safePrice,
              priceCurrency: "INR",
              availability: "https://schema.org/InStock",
              url: `https://www.cararth.com/listing/${car.id}`
            }
          })
        }
      };
    })
  };

  return (
    <>
      <SEOHead
        title="Used Cars for Sale in India | CarArth Search Results"
        description="Browse verified used cars on CarArth. No paid listings, no bias — just AI-verified cars from across India."
        keywords="used cars for sale, buy used cars India, verified car listings, AI-verified cars, second hand cars"
        canonical="https://www.cararth.com/results"
        structuredData={itemListSchema}
      />
      
      <Layout containerSize="2xl">
        <div className="py-8">
          {/* Header - Glassmorphic */}
          <div
            className="mb-6 mt-2 p-6 rounded-2xl backdrop-blur-md border transition-all duration-300"
            style={{
              backgroundColor: 'var(--glass-bg)',
              borderColor: 'var(--glass-border)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
            }}
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900 dark:text-gray-100" data-testid="text-results-heading">
              Used Cars Matching Your Search
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Showing {sortedCars.length} {sortedCars.length === 1 ? "result" : "results"}
            </p>
          </div>

          {/* Badge Legend */}
          <BadgeLegend />

          {/* Source Filter Buttons - Glassmorphic */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSourceFilter("all")}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 backdrop-blur-sm border ${
                  sourceFilter === "all"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105 border-blue-500"
                    : "bg-white/10 hover:bg-white/20 dark:bg-white/5 dark:hover:bg-white/10 hover:scale-105 border-white/20"
                }`}
                data-testid="filter-all"
              >
                All Listings
              </button>
              <button
                onClick={() => setSourceFilter("ethical_ai")}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 backdrop-blur-sm border ${
                  sourceFilter === "ethical_ai"
                    ? "bg-green-600 text-white shadow-lg shadow-green-500/30 scale-105 border-green-500"
                    : "bg-green-50/50 text-green-700 dark:bg-green-950/30 dark:text-green-300 hover:scale-105 hover:border-green-400 border-green-200 dark:border-green-800"
                }`}
                data-testid="filter-ethical-ai"
              >
                🧠 Ethical AI
              </button>
              <button
                onClick={() => setSourceFilter("exclusive_dealer")}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 backdrop-blur-sm border ${
                  sourceFilter === "exclusive_dealer"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105 border-blue-500"
                    : "bg-blue-50/50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300 hover:scale-105 hover:border-blue-400 border-blue-200 dark:border-blue-800"
                }`}
                data-testid="filter-dealer"
              >
                🤝 Dealer Listings
              </button>
              <button
                onClick={() => setSourceFilter("user_direct")}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 backdrop-blur-sm border ${
                  sourceFilter === "user_direct"
                    ? "bg-orange-600 text-white shadow-lg shadow-orange-500/30 scale-105 border-orange-500"
                    : "bg-orange-50/50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-300 hover:scale-105 hover:border-orange-400 border-orange-200 dark:border-orange-800"
                }`}
                data-testid="filter-user"
              >
                👤 User Listings
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Filters Panel - Desktop */}
            <aside className="hidden lg:block lg:w-1/4">
              <div className="sticky top-4">
                <FilterPanel
                  filters={filters}
                  onChange={handleFilterChange}
                  onSearch={handleSearch}
                />
              </div>
            </aside>

            {/* Mobile Filter Button */}
            <div className="lg:hidden flex justify-between items-center gap-4 mb-4">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="flex-1"
                data-testid="button-toggle-mobile-filters"
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
              </Button>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="flex-1" data-testid="select-sort-mobile">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="year-new">Year: Newest First</SelectItem>
                  <SelectItem value="mileage-low">Mileage: Low to High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mobile Filters Panel */}
            {showFilters && (
              <div className="lg:hidden mb-4">
                <FilterPanel
                  filters={filters}
                  onChange={handleFilterChange}
                  onSearch={handleSearch}
                />
              </div>
            )}

            {/* Results Grid */}
            <div className="lg:w-3/4">
              {/* Sort Dropdown - Desktop */}
              <div className="hidden lg:flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">All Listings</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Sort:</span>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-48" data-testid="select-sort-desktop">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="year-new">Year: Newest First</SelectItem>
                      <SelectItem value="mileage-low">Mileage: Low to High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Loading State */}
              {isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" data-testid="loading-skeleton">
                  {[...Array(9)].map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="text-center py-12">
                  <p className="text-red-600 dark:text-red-400 mb-4">Failed to load listings. Please try again.</p>
                  <Button onClick={() => window.location.reload()}>Reload Page</Button>
                </div>
              )}

              {/* No Results State - Glassmorphic */}
              {!isLoading && !error && sortedCars.length === 0 && (
                <div
                  className="text-center py-12 rounded-3xl backdrop-blur-md border transition-all duration-300"
                  style={{
                    backgroundColor: 'var(--glass-bg)',
                    borderColor: 'var(--glass-border)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                  }}
                  data-testid="no-results"
                >
                  <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">No Cars Found</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Try expanding your search or changing filters
                  </p>
                  <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                    <p>• Try a broader price range</p>
                    <p>• Remove some filters</p>
                    <p>• Search in nearby cities</p>
                  </div>
                  <Button
                    onClick={() => {
                      setFilters({
                        priceMin: 0,
                        priceMax: 5000000,
                        fuelType: "all",
                        transmission: "all",
                        yearMin: 2000,
                        yearMax: currentYear,
                        city: "all",
                      });
                    }}
                    className="mt-6"
                    data-testid="button-clear-all-filters"
                  >
                    Clear All Filters
                  </Button>
                </div>
              )}

              {/* Results Grid */}
              {!isLoading && !error && sortedCars.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" data-testid="results-grid">
                  {sortedCars.map((car) => (
                    <ListingCard
                      key={car.id}
                      id={car.id}
                      image={car.images?.[0] || car.imageUrl || "https://placehold.co/400x300/e5e7eb/6b7280?text=No+Image"}
                      title={car.title || `${car.make} ${car.model} ${car.year}`}
                      price={parseFloat(car.price)}
                      year={car.year}
                      mileage={car.mileage || car.kmDriven}
                      fuelType={car.fuelType || "Petrol"}
                      transmission={car.transmission || "Manual"}
                      city={car.city || car.location || "India"}
                      isVerified={car.verificationStatus === "approved" || car.isVerified}
                      sellerType={car.isVerified ? "verified" : "private"}
                      listingSource={car.listingSource || "user_direct"}
                      listingScore={car.listingScore}
                      googleCompliant={car.googleComplianceScore >= 100}
                      priceFairnessLabel={car.priceFairnessLabel}
                      trustScore={car.trustScore}
                      trustScoreLabel={car.trustScoreLabel}
                      trustScoreColor={car.trustScoreColor}
                      trustScoreBreakdown={car.trustScoreBreakdown}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}
