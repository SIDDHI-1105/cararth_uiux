import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BrandWordmark } from "@/components/brand-wordmark";
import SocialShareButtons from "@/components/social-share-buttons";
import {
  Home,
  Clock,
  MapPin,
  TrendingUp,
  CheckCircle2,
  Building2,
  Car,
  CreditCard,
  Search,
  BookOpen
} from "lucide-react";

export default function HyderabadUsedCarsGuide2025() {
  useEffect(() => {
    document.title = "Used Cars Hyderabad 2025: 6500+ Listings, Best Dealers & Prices | Cararth";
    
    const metaTags = {
      description: "Find 6,500+ used cars in Hyderabad from ₹35K. Compare prices across Cars24, Spinny, CarDekho on Cararth.com. Swift (222), Creta (150), Nexon (132) with instant loans & inspection services.",
      keywords: "used cars Hyderabad, second hand cars Hyderabad, Madhapur dealers, Jubilee Hills luxury cars, Cars24 Hyderabad, Spinny Hyderabad, Cararth",
      "og:title": "Used Cars in Hyderabad 2025: Complete Guide with 6,500+ Listings",
      "og:description": "Comprehensive guide to buying used cars in Hyderabad. 6,500+ listings from Madhapur to Jubilee Hills with financing and inspection services.",
      "og:type": "article",
      "article:published_time": "2025-11-16T00:00:00Z",
      "article:author": "Cararth Team",
      "article:section": "City Guides"
    };

    Object.entries(metaTags).forEach(([key, value]) => {
      const isProperty = key.startsWith('og:') || key.startsWith('article:');
      const selector = isProperty ? `meta[property="${key}"]` : `meta[name="${key}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (isProperty) {
          meta.setAttribute('property', key);
        } else {
          meta.setAttribute('name', key);
        }
        document.head.appendChild(meta);
      }
      meta.content = value;
    });

    const articleSchema = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "Used Cars in Hyderabad 2025: Complete Guide with 6,500+ Listings, Best Dealers, Prices & Financing",
      "description": "Comprehensive guide to Hyderabad's used car market with 6,500+ listings across Madhapur, Jubilee Hills, and Kukatpally. Includes dealer reviews, financing options, and inspection services.",
      "author": {
        "@type": "Organization",
        "name": "Cararth",
        "url": "https://www.cararth.com"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Cararth",
        "logo": {
          "@type": "ImageObject",
          "url": "https://www.cararth.com/cararth-logo-full.png"
        }
      },
      "datePublished": "2025-11-16",
      "dateModified": "2025-11-16",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://www.cararth.com/guides/used-cars-hyderabad-2025"
      },
      "articleSection": "City Guides",
      "keywords": "Hyderabad used cars, Madhapur dealers, Jubilee Hills, car financing",
      "wordCount": 3200
    };

    let script = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(articleSchema, null, 2);

    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50/30 to-white dark:from-gray-950 dark:via-gray-900/30 dark:to-gray-950">
      <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm" data-testid="button-home">
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
          </Link>
          <BrandWordmark variant="header" showTagline={false} className="scale-75" />
          <SocialShareButtons
            url="https://www.cararth.com/guides/used-cars-hyderabad-2025"
            title="Used Cars in Hyderabad 2025: Complete Buyer's Guide"
            description="6,500+ used cars in Hyderabad from ₹35K. Compare prices across all platforms instantly on Cararth.com"
          />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 pt-12 pb-8">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300">
              <MapPin className="h-3 w-3 mr-1" />
              Hyderabad Guide
            </Badge>
            <Badge variant="outline" className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300">
              <Clock className="h-3 w-3 mr-1" />
              15 min read
            </Badge>
            <Badge variant="outline" className="bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300">
              6,500+ Listings
            </Badge>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
            Used Cars in Hyderabad 2025: Complete Guide with 6,500+ Listings
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Find trusted dealers across Madhapur, Jubilee Hills, Kukatpally with prices from ₹35K. Swift (222), Creta (150), Nexon (132) with instant financing.
          </p>

          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span>By Cararth Team</span>
            <span>•</span>
            <span>November 16, 2025</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-16">
        <Card className="p-6 sm:p-8 glass-card">
          <article className="prose prose-lg dark:prose-invert max-w-none">
            <h2 className="text-3xl font-bold mb-4">Quick Answer</h2>
            <p className="text-lg leading-relaxed">
              Hyderabad offers <strong>6,500+ used cars</strong> from trusted dealers across Madhapur, Jubilee Hills, Kukatpally, LB Nagar with prices starting <strong>₹35,000</strong>. Popular models include Swift (222 listings from ₹1.3L), Baleno (200 from ₹3L), Creta (150 from ₹5.6L), and Nexon (132 from ₹4.79L). <strong><Link href="/" className="text-blue-600 hover:text-blue-700">Cararth.com</Link></strong> helps you search across Cars24, Spinny, CarDekho, OLX, and 100+ platforms simultaneously to compare prices and find the best deals instantly.
            </p>

            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-l-4 border-blue-600 p-6 my-8">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-blue-600" />
                Key Takeaways
              </h3>
              <ul className="space-y-2 mb-0">
                <li><strong>Market Size:</strong> 6,565+ cars from ₹35,000 to ₹16 crore</li>
                <li><strong>Top Platforms:</strong> Spinny (1,075), Cars24 (1,672), CarDekho (3,047)</li>
                <li><strong>Prime Locations:</strong> Madhapur (IT hub), Jubilee Hills (luxury), Kukatpally (value)</li>
                <li><strong>Popular Models:</strong> Swift (222), Baleno (200), WagonR (163), Creta (150)</li>
                <li><strong>Best Budget:</strong> Under ₹5L segment has 669 cars</li>
                <li><strong>Growth:</strong> 30% YoY in 2024, 50% surge in inspections</li>
                <li><strong>Financing:</strong> HDFC (30 min), Bajaj (48 hrs), 57% use loans</li>
                <li><strong>Smart Search:</strong> <Link href="/" className="text-blue-600 hover:text-blue-700">Cararth.com</Link> compares all platforms in seconds</li>
              </ul>
            </div>

            <Separator className="my-8" />

            <h2 className="text-3xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="h-7 w-7 text-blue-600" />
              Hyderabad Market Overview
            </h2>
            <p>
              Hyderabad ranks among <strong>India's top 3 cities</strong> for used car transactions, alongside Bengaluru and Delhi, with over 6,565 vehicles available. The market experienced robust <strong>30% year-on-year growth in 2024</strong>, driven by increasing buyer confidence in organized platforms.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
              <div className="bg-white dark:bg-gray-900 p-5 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="text-3xl font-bold text-blue-600 mb-2">6,565+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Listings</div>
              </div>
              <div className="bg-white dark:bg-gray-900 p-5 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="text-3xl font-bold text-green-600 mb-2">30%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Market Growth 2024</div>
              </div>
              <div className="bg-white dark:bg-gray-900 p-5 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="text-3xl font-bold text-purple-600 mb-2">₹35K</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Starting Price</div>
              </div>
              <div className="bg-white dark:bg-gray-900 p-5 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="text-3xl font-bold text-orange-600 mb-2">669</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Cars Under ₹5L</div>
              </div>
            </div>

            <p>
              <strong>Maruti Suzuki dominates with 1,595 listings</strong>, reflecting strong brand preference. Swift leads with 222 listings starting ₹1.3L, followed by Baleno (200 from ₹3L) and WagonR (163 from ₹70K). Hyundai commands 800+ listings with Creta (150 from ₹5.6L) as the compact SUV favorite.
            </p>

            <h2 className="text-3xl font-bold mb-4 mt-8 flex items-center gap-2">
              <Building2 className="h-7 w-7 text-purple-600" />
              Best Dealerships by Location
            </h2>

            <h3 className="text-2xl font-semibold mb-3 mt-6">Madhapur: IT Hub</h3>
            <p>
              Madhapur hosts the <strong>highest dealer concentration</strong>, strategically located near Hi-Tech City and Gachibowli. Key dealers include:
            </p>
            <ul>
              <li><strong>Auto Engineers:</strong> 58+ multi-brand cars with comprehensive services</li>
              <li><strong>Tristar Motor Group:</strong> 75+ inventory with integrated financing</li>
              <li><strong>Car Cart:</strong> 43 luxury vehicles for premium buyers</li>
            </ul>

            <h3 className="text-2xl font-semibold mb-3 mt-6">Jubilee Hills: Premium Destination</h3>
            <p>
              Jubilee Hills serves as Hyderabad's <strong>luxury car hub</strong>:
            </p>
            <ul>
              <li><strong>Speeds Pre-Owned Cars:</strong> 32 less-driven luxury vehicles</li>
              <li><strong>SK Car Lounge:</strong> Rolls Royce to mid-segment luxury</li>
              <li><strong>TJ King of Cars:</strong> 200-point inspection, 3-year warranties</li>
            </ul>

            <h3 className="text-2xl font-semibold mb-3 mt-6">Online Platforms</h3>
            <div className="space-y-3 my-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="font-semibold text-lg mb-1">Spinny Hyderabad</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  1,075+ cars • Phoenix Trivium Mall • 200-point inspection • 1-year warranty
                </div>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="font-semibold text-lg mb-1">Cars24</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  1,672 cars • 4 hubs • 300+ point inspection • 7-day return
                </div>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="font-semibold text-lg mb-1">CarDekho</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  3,047 cars • 78 dealers • TrustMark certified • 669 under ₹5L
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-600 p-4 my-6">
              <p className="mb-0">
                <strong>Comparing prices across all these platforms is time-consuming.</strong> <Link href="/" className="text-blue-700 dark:text-blue-400 hover:underline font-semibold">Cararth.com</Link> shows you the same car model across Spinny, Cars24, CarDekho, local dealers, and OLX simultaneously.
              </p>
            </div>

            <h2 className="text-3xl font-bold mb-4 mt-8 flex items-center gap-2">
              <Car className="h-7 w-7 text-green-600" />
              Top Cars Under ₹5 Lakhs
            </h2>

            <div className="grid grid-cols-1 gap-4 my-6">
              <div className="bg-white dark:bg-gray-900 p-5 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-bold text-lg">Maruti Suzuki Swift</div>
                  <Badge variant="secondary">222 listings</Badge>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  From ₹1.3L • 20+ kmpl • 75-78% resale value
                </div>
                <p className="text-sm">
                  Legendary reliability with widespread service network. 2015-2019 models in ₹2.5-4.8L range offer excellent value.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-900 p-5 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-bold text-lg">Maruti Baleno</div>
                  <Badge variant="secondary">200 listings</Badge>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  From ₹3L • 19-25 kmpl • Premium features
                </div>
                <p className="text-sm">
                  Premium hatchback with touchscreen, climate control, cruise control. 2016-2020 models priced ₹3.5-5L.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-900 p-5 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-bold text-lg">Hyundai Creta</div>
                  <Badge variant="secondary">150 listings</Badge>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  From ₹5.6L • Best resale • Compact SUV
                </div>
                <p className="text-sm">
                  Compact SUV favorite commanding highest resale value in segment. Premium features and build quality.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-900 p-5 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-bold text-lg">Tata Nexon</div>
                  <Badge variant="secondary">132 listings</Badge>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  From ₹4.79L • 5-star safety • Connected tech
                </div>
                <p className="text-sm">
                  5-star Global NCAP safety rating. 2018-2019 models offer connected car tech and modern design at budget prices.
                </p>
              </div>
            </div>

            <h2 className="text-3xl font-bold mb-4 mt-8 flex items-center gap-2">
              <CreditCard className="h-7 w-7 text-orange-600" />
              Instant Financing Options
            </h2>
            <p>
              <strong>57% of Hyderabad purchases involve loans</strong>, among the highest adoption rates nationally.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
              <div className="bg-white dark:bg-gray-900 p-5 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="font-semibold text-lg mb-3">HDFC Bank Xpress</div>
                <ul className="text-sm space-y-1 mb-0">
                  <li>• 30-minute approval</li>
                  <li>• Up to ₹10L, 90% financing</li>
                  <li>• 10.5-13% interest</li>
                  <li>• Fully digital</li>
                </ul>
              </div>
              <div className="bg-white dark:bg-gray-900 p-5 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="font-semibold text-lg mb-3">Bajaj Finance</div>
                <ul className="text-sm space-y-1 mb-0">
                  <li>• 48-hour disbursal</li>
                  <li>• Up to ₹1.02 crore</li>
                  <li>• 12-16% interest</li>
                  <li>• Doorstep service</li>
                </ul>
              </div>
            </div>

            <h3 className="text-2xl font-semibold mb-3 mt-6">Typical Loan Parameters</h3>
            <ul>
              <li><strong>Loan-to-Value:</strong> 70-90% depending on vehicle age</li>
              <li><strong>Interest Rates:</strong> 9.5-14% (banks), 12-18% (NBFCs)</li>
              <li><strong>Tenure:</strong> 12-84 months (1-7 years)</li>
              <li><strong>Eligibility:</strong> ₹2.5L+ income, 650+ credit score</li>
            </ul>

            <h2 className="text-3xl font-bold mb-4 mt-8 flex items-center gap-2">
              <Search className="h-7 w-7 text-indigo-600" />
              Professional Inspection Services
            </h2>
            <p>
              Professional inspections cost <strong>₹799-₹2,499</strong> and prevent ₹50,000-₹2L unexpected repairs. The <strong>50% surge in inspections during 2024</strong> reflects growing buyer sophistication.
            </p>

            <div className="grid grid-cols-1 gap-3 my-6">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="font-semibold mb-2">Metre Per Second • ₹799-₹2,499</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  2,500+ inspections • 4.9 rating • 50-120 point checks • Paint thickness meter • Compression test
                </div>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="font-semibold mb-2">CarVaidya • ₹1,499-₹3,499</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  AI-enabled 360° • OBD2 scanning • Same-day report • Digital documentation
                </div>
              </div>
            </div>

            <h3 className="text-2xl font-semibold mb-3 mt-6">Key Inspection Points</h3>
            <ul>
              <li><strong>Exterior:</strong> Paint thickness meter, panel gaps, rust check</li>
              <li><strong>Engine:</strong> Cold start test, compression test, oil condition</li>
              <li><strong>Interior:</strong> Odometer verification, controls test, musty odors</li>
              <li><strong>Test Drive:</strong> 30-45 minutes covering varied conditions</li>
              <li><strong>Documents:</strong> RC verification on Parivahan portal</li>
            </ul>

            <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 p-6 rounded-lg my-8">
              <h3 className="text-2xl font-bold mb-3">Why Use Cararth.com for Hyderabad?</h3>
              <p className="mb-4">
                With 6,500+ cars across 100+ platforms, manually comparing wastes 10-15 hours. <strong><Link href="/" className="text-orange-700 dark:text-orange-400 hover:underline">Cararth.com</Link></strong> solves this:
              </p>
              <ul className="space-y-2">
                <li><strong>Search All Platforms:</strong> Cars24, Spinny, CarDekho, OLX, local dealers simultaneously</li>
                <li><strong>Price Comparison:</strong> Save ₹30K-₹80K by comparing 8-15% variations</li>
                <li><strong>Location Filters:</strong> Find cars in Madhapur, Jubilee Hills, Kukatpally</li>
                <li><strong>Price Alerts:</strong> Get notified of new listings and price drops</li>
                <li><strong>Complete Visibility:</strong> Never miss deals with 30% market growth</li>
              </ul>
            </div>

            <Separator className="my-8" />

            <h2 className="text-3xl font-bold mb-4">Conclusion</h2>
            <p>
              Hyderabad's dynamic market offers 6,500+ vehicles from ₹35K to ₹16 crore across Madhapur, Jubilee Hills, and Kukatpally. With 30% growth, organized platforms, instant financing, and professional inspections, the market has never been more buyer-friendly.
            </p>
            <p>
              However, manually comparing prices across dozens of platforms wastes time and risks overpaying. In a market where the same car varies 8-15% in price (₹30K-₹80K on a ₹5L purchase), comprehensive comparison is essential.
            </p>
            <p className="font-semibold">
              <Link href="/" className="text-blue-600 hover:text-blue-700">Visit Cararth.com now</Link> to search all 6,500+ Hyderabad listings, compare prices in real-time, and find your perfect car with complete market visibility.
            </p>

            <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Share this guide:</p>
                  <SocialShareButtons
                    url="https://www.cararth.com/guides/used-cars-hyderabad-2025"
                    title="Used Cars in Hyderabad 2025: Complete Buyer's Guide"
                    description="6,500+ used cars in Hyderabad from ₹35K. Complete guide with dealers, financing & inspection services"
                  />
                </div>
                <Link href="/news">
                  <Button variant="outline" data-testid="button-more-guides">
                    <BookOpen className="h-4 w-4 mr-2" />
                    More Guides
                  </Button>
                </Link>
              </div>
            </div>
          </article>
        </Card>
      </div>
    </div>
  );
}
