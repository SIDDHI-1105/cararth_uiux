import { useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Home, ChevronRight, Car, TrendingUp, MapPin, Building2 } from "lucide-react";
import { ListingCard } from "@/components/listing-card";

interface CityData {
  success: boolean;
  city: string;
  citySlug: string;
  totalListings: number;
  averagePrices: {
    hatchback: number;
    sedan: number;
    suv: number;
  };
  topBrands: Array<{ brand: string; count: number }>;
  topDealers: Array<{ dealer: string; count: number }>;
  latestListings: Array<any>;
  lastUpdated: string;
  metaDescription: string;
}

export default function CityLandingPage() {
  const params = useParams();
  const citySlug = params.city || 'hyderabad';
  
  const { data: cityData, isLoading } = useQuery<CityData>({
    queryKey: [`/api/city/${citySlug}`],
  });

  // Set page title dynamically - MUST be before any conditional returns
  useEffect(() => {
    if (cityData?.city) {
      document.title = `Used Cars in ${cityData.city} — Verified Listings | CarArth`;
      
      // Update meta description
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', cityData.metaDescription);
      }
    }
  }, [cityData]);

  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined || isNaN(price) || price === 0) {
      return 'Price on request';
    }
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
    if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
    return `₹${price.toLocaleString('en-IN')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50/30 via-white to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!cityData?.success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50/30 via-white to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">City Not Found</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">We couldn't find data for this city.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-orange-50/30 via-white to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-6" data-testid="breadcrumb">
            <Link href="/" className="hover:text-orange-600 dark:hover:text-orange-400 flex items-center gap-1">
              <Home className="h-4 w-4" />
              Home
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="font-semibold text-gray-900 dark:text-white">{cityData.city}</span>
          </nav>

          {/* Header */}
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-3">
              <MapPin className="h-10 w-10 text-orange-600" />
              Used Cars in {cityData.city}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Find verified, no-paid-ads used car listings in {cityData.city} — real owner and dealer inventory, transparent prices and inspection reports.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Why Buy Section */}
              <section className="glass-card p-6 rounded-xl border border-orange-100/50 dark:border-blue-500/30">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Why buy a used car in {cityData.city} on CarArth?
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  CarArth organizes local inventory in {cityData.city} with standardized listing templates, verified seller badges and active dealer citations. Our GEO structure connects dealers, city pages and CarArth to improve discoverability and trust.
                </p>
              </section>

              {/* Latest Listings */}
              <section className="glass-card p-6 rounded-xl border border-orange-100/50 dark:border-blue-500/30">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Car className="h-6 w-6 text-orange-600" />
                  Latest verified listings in {cityData.city}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6" data-testid="listings-container">
                  {cityData.latestListings.slice(0, 6).map((listing, idx) => (
                    <ListingCard
                      key={listing.id}
                      id={listing.id}
                      title={listing.title}
                      price={listing.price}
                      year={listing.year}
                      mileage={listing.mileage}
                      fuelType={listing.fuelType}
                      transmission={listing.transmission}
                      city={listing.location || cityData.city}
                      sellerType={listing.sellerType || "owner"}
                      imageUrl={listing.images?.[0]}
                      portal={listing.portal}
                      isVerified={listing.isVerified}
                      googleCompliant={listing.googleCompliant}
                      listingScore={listing.listingScore}
                      trustScore={listing.trustScore}
                      trustScoreLabel={listing.trustScoreLabel}
                      trustScoreColor={listing.trustScoreColor}
                      trustScoreBreakdown={listing.trustScoreBreakdown}
                      priceFairnessLabel={listing.priceFairnessLabel}
                    />
                  ))}
                </div>

                <Link 
                  href="/" 
                  className="mt-2 inline-block bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg transition-colors"
                  data-testid="view-all-link"
                >
                  View all {cityData.totalListings} listings →
                </Link>
              </section>

              {/* Market Snapshot */}
              <section className="glass-card p-6 rounded-xl border border-orange-100/50 dark:border-blue-500/30">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                  Market snapshot — average asking price in {cityData.city}
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-orange-50 dark:bg-orange-950/30 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Avg - Hatchbacks</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {formatPrice(cityData.averagePrices.hatchback)}
                    </div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Avg - Sedans</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {formatPrice(cityData.averagePrices.sedan)}
                    </div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Avg - SUVs / MPVs</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {formatPrice(cityData.averagePrices.suv)}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
                  Prices updated: {new Date(cityData.lastUpdated).toLocaleDateString('en-IN')} • These are representative asking prices — inspect before buying.
                </p>
              </section>

              {/* Buying Guide */}
              <section className="glass-card p-6 rounded-xl border border-orange-100/50 dark:border-blue-500/30">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  How to choose the right used car in {cityData.city}
                </h2>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                  <li>Check registration & service history for local garages/dealers.</li>
                  <li>Prefer cars with full-service records and fewer owners.</li>
                  <li>Get a pre-purchase inspection and a detailed test drive on local roads.</li>
                  <li>Compare similar listings across CarArth to validate pricing.</li>
                </ol>
              </section>

              {/* FAQs */}
              <section className="glass-card p-6 rounded-xl border border-orange-100/50 dark:border-blue-500/30">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Frequently asked questions
                </h2>
                <dl className="space-y-4">
                  <div>
                    <dt className="font-semibold text-gray-900 dark:text-white">
                      Where can I find certified used cars in {cityData.city}?
                    </dt>
                    <dd className="mt-1 text-gray-600 dark:text-gray-400">
                      Use the "Certified" filter on the main search page or check listings tagged <em>Certified</em> by CarArth; certified deals include inspection reports and short warranties.
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-gray-900 dark:text-white">
                      How do I check dealer credibility in {cityData.city}?
                    </dt>
                    <dd className="mt-1 text-gray-600 dark:text-gray-400">
                      Look for Dealer badges, verified status and CarArth dealer citations listed on their profile — verified dealers have completed onboarding steps.
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-gray-900 dark:text-white">
                      Are prices negotiable on CarArth?
                    </dt>
                    <dd className="mt-1 text-gray-600 dark:text-gray-400">
                      Yes — most listings are owner/dealer quoted prices; use comparative listings and the price insights to negotiate.
                    </dd>
                  </div>
                </dl>
              </section>
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Top Brands */}
              <div className="glass-card p-6 rounded-xl border border-orange-100/50 dark:border-blue-500/30">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Top brands in {cityData.city}
                </h3>
                <ul className="space-y-2">
                  {cityData.topBrands.map((brand, idx) => (
                    <li key={idx} className="flex justify-between items-center text-gray-700 dark:text-gray-300">
                      <span>{brand.brand}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-500">{brand.count} listings</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Top Dealers */}
              {cityData.topDealers.length > 0 && (
                <div className="glass-card p-6 rounded-xl border border-orange-100/50 dark:border-blue-500/30">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-orange-600" />
                    Top dealers in {cityData.city}
                  </h3>
                  <ul className="space-y-2">
                    {cityData.topDealers.map((dealer, idx) => (
                      <li key={idx} className="text-sm">
                        <div className="font-medium text-gray-900 dark:text-white">{dealer.dealer}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">{dealer.count} listings</div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* CTA */}
              <div className="glass-card p-6 rounded-xl border border-orange-100/50 dark:border-blue-500/30 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/20">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  Ready to find your car?
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Browse {cityData.totalListings}+ verified listings in {cityData.city}
                </p>
                <Link 
                  href="/" 
                  className="block w-full bg-orange-600 hover:bg-orange-700 text-white text-center px-4 py-3 rounded-lg font-semibold transition-colors"
                  data-testid="cta-browse-all"
                >
                  Browse All Cars
                </Link>
              </div>
            </aside>
          </div>

          {/* Footer */}
          <footer className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>
              CarArth — India's first no-paid-ads search engine for used cars
            </p>
          </footer>
        </div>
      </div>
    </>
  );
}
