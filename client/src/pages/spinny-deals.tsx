import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Car, IndianRupee } from 'lucide-react';

interface SpinnyListing {
  title: string;
  price: number;
  link: string;
  year?: number;
  mileage?: string;
}

// Hardcoded sample Spinny listings for Hyderabad
// This will be replaced with real curated data
const SPINNY_SAMPLE_DATA: SpinnyListing[] = [
  {
    title: 'Hyundai Creta 1.5 SX Diesel',
    price: 950000,
    link: 'https://www.spinny.com/buy-used-car/hyderabad/hyundai-creta-1-5-sx-diesel-hyd123',
    year: 2020,
    mileage: '35,000 km'
  },
  {
    title: 'Maruti Suzuki Swift VXI',
    price: 520000,
    link: 'https://www.spinny.com/buy-used-car/hyderabad/maruti-suzuki-swift-vxi-hyd456',
    year: 2019,
    mileage: '28,000 km'
  },
  {
    title: 'Honda City ZX CVT',
    price: 780000,
    link: 'https://www.spinny.com/buy-used-car/hyderabad/honda-city-zx-cvt-hyd789',
    year: 2021,
    mileage: '22,000 km'
  },
  {
    title: 'Tata Nexon XZ Plus Diesel',
    price: 850000,
    link: 'https://www.spinny.com/buy-used-car/hyderabad/tata-nexon-xz-plus-diesel-hyd101',
    year: 2020,
    mileage: '31,000 km'
  },
  {
    title: 'Hyundai Venue SX Turbo',
    price: 920000,
    link: 'https://www.spinny.com/buy-used-car/hyderabad/hyundai-venue-sx-turbo-hyd202',
    year: 2021,
    mileage: '18,000 km'
  },
  {
    title: 'Maruti Suzuki Baleno Delta',
    price: 630000,
    link: 'https://www.spinny.com/buy-used-car/hyderabad/maruti-suzuki-baleno-delta-hyd303',
    year: 2020,
    mileage: '26,000 km'
  },
  {
    title: 'Mahindra XUV300 W8 Diesel',
    price: 980000,
    link: 'https://www.spinny.com/buy-used-car/hyderabad/mahindra-xuv300-w8-diesel-hyd404',
    year: 2021,
    mileage: '20,000 km'
  },
  {
    title: 'Kia Seltos HTX Plus',
    price: 1250000,
    link: 'https://www.spinny.com/buy-used-car/hyderabad/kia-seltos-htx-plus-hyd505',
    year: 2021,
    mileage: '24,000 km'
  },
  {
    title: 'Volkswagen Polo Highline Plus',
    price: 680000,
    link: 'https://www.spinny.com/buy-used-car/hyderabad/volkswagen-polo-highline-plus-hyd606',
    year: 2019,
    mileage: '32,000 km'
  },
  {
    title: 'Renault Kwid RXT',
    price: 320000,
    link: 'https://www.spinny.com/buy-used-car/hyderabad/renault-kwid-rxt-hyd707',
    year: 2020,
    mileage: '29,000 km'
  }
];

export default function SpinnyDeals() {
  // Fetch Spinny listings with TanStack Query
  // Cache for 24 hours as specified
  const { data: listings, isLoading } = useQuery<SpinnyListing[]>({
    queryKey: ['spinny-deals-hyderabad'],
    queryFn: async () => {
      // For now, return static data
      // In the future, this can fetch from an API endpoint
      return new Promise((resolve) => {
        setTimeout(() => resolve(SPINNY_SAMPLE_DATA), 500);
      });
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 24 * 60 * 60 * 1000,
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Car className="h-12 w-12 text-green-600 dark:text-green-400" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Spinny Certified Deals in Hyderabad
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Hand-picked certified pre-owned cars from Spinny.com. Every car comes with a 200-point inspection and warranty.
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        )}

        {/* Listings Grid */}
        {!isLoading && listings && listings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing, index) => (
              <Card 
                key={index}
                className="hover:shadow-xl transition-shadow duration-300 border-2 hover:border-green-500"
                data-testid={`card-spinny-${index}`}
              >
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white line-clamp-2">
                      {listing.title}
                    </CardTitle>
                    <Badge 
                      className="bg-green-500 text-white hover:bg-green-600 shrink-0 ml-2"
                      data-testid={`badge-certified-${index}`}
                    >
                      Spinny Certified
                    </Badge>
                  </div>
                  
                  {/* Price */}
                  <div className="flex items-center gap-2">
                    <IndianRupee className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span 
                      className="text-2xl font-bold text-green-600 dark:text-green-400"
                      data-testid={`text-price-${index}`}
                    >
                      {formatPrice(listing.price)}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Details */}
                  <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                    {listing.year && (
                      <span data-testid={`text-year-${index}`}>📅 {listing.year}</span>
                    )}
                    {listing.mileage && (
                      <span data-testid={`text-mileage-${index}`}>🛣️ {listing.mileage}</span>
                    )}
                  </div>

                  {/* View Link */}
                  <a
                    href={listing.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                    data-testid={`link-view-${index}`}
                  >
                    View on Spinny
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && (!listings || listings.length === 0) && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              No Spinny listings available at the moment. Check back soon!
            </p>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-16 text-center">
          <div className="inline-block bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              💡 <strong>Pro Tip:</strong> These listings are manually curated for quality. 
              Updated weekly with the best Spinny deals in Hyderabad.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
