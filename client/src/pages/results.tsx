import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { SEOHead } from "@/components/seo-head";
import Navbar from "@/components/navbar";
import { FilterPanel, FilterState } from "@/components/filter-panel";
import { ListingCard } from "@/components/listing-card";
import { SkeletonCard } from "@/components/skeleton-card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function Results() {
  const [, setLocation] = useLocation();
  const currentYear = new Date().getFullYear();
  
  const [filters, setFilters] = useState<FilterState>({
    priceMin: 0,
    priceMax: 5000000,
    fuelType: "all",
    transmission: "all",
    yearMin: 2000,
    yearMax: currentYear,
    city: "all",
  });

  const [sortBy, setSortBy] = useState("price-low");
  const [showFilters, setShowFilters] = useState(false);

  // Fetch cars based on filters
  const { data: cars = [], isLoading, error } = useQuery<any[]>({
    queryKey: ["/api/marketplace/search", filters],
    queryFn: async () => {
      const searchFilters: any = {
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

  // Sort cars
  const sortedCars = useMemo(() => {
    if (!cars.length) return [];
    
    return [...cars].sort((a, b) => {
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
  }, [cars, sortBy]);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleSearch = () => {
    setShowFilters(false);
  };

  return (
    <>
      <SEOHead
        title="Used Cars for Sale in India | CarArth Search Results"
        description="Browse verified used cars on CarArth. No paid listings, no bias — just AI-verified cars from across India."
        keywords="used cars for sale, buy used cars India, verified car listings, AI-verified cars, second hand cars"
        canonical="https://cararth.com/results"
      />
      
      <Navbar />
      
      <main className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900 dark:text-gray-100" data-testid="text-results-heading">
              Used Cars Matching Your Search
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Showing {sortedCars.length} {sortedCars.length === 1 ? "result" : "results"}
            </p>
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

              {/* No Results State */}
              {!isLoading && !error && sortedCars.length === 0 && (
                <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800" data-testid="no-results">
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
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
