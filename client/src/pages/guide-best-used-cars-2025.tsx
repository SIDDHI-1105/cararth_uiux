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
  BookOpen,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  IndianRupee,
  Car,
  Wrench,
  Calendar,
  Percent
} from "lucide-react";

export default function BestUsedCars2025Guide() {
  useEffect(() => {
    document.title = "Best Used Cars in India 2025: Complete Buyer's Guide with Prices, Models & Expert Tips | Cararth";
    
    const metaTags = {
      description: "Complete buyer's guide to the best used cars in India 2025. Expert insights on Maruti Swift, WagonR, Honda City, Hyundai Creta, and Tata Nexon with prices, maintenance costs, and resale value.",
      keywords: "best used cars India 2025, used car buying guide, Maruti Swift used, Honda City resale value, used car prices India, certified pre-owned cars",
      "og:title": "Best Used Cars in India 2025: Complete Buyer's Guide",
      "og:description": "Expert guide covering top used cars in India with prices, maintenance costs, resale values, and buying tips. Compare across 100+ platforms instantly.",
      "og:type": "article",
      "article:published_time": "2025-11-16T00:00:00Z",
      "article:author": "Cararth Team",
      "article:section": "Buyer's Guide"
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
      "headline": "Best Used Cars in India 2025: Complete Buyer's Guide with Prices, Models & Expert Tips",
      "description": "Comprehensive guide covering the best used cars to buy in India, including Maruti Swift, WagonR, Honda City, Hyundai Creta, and Toyota Innova with expert analysis on pricing, maintenance, and resale value.",
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
        "@id": "https://www.cararth.com/guides/best-used-cars-india-2025"
      },
      "articleSection": "Buyer's Guide",
      "keywords": "best used cars 2025, used car India, Maruti Swift, Honda City, resale value",
      "wordCount": 3500
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
            url="https://www.cararth.com/guides/best-used-cars-india-2025"
            title="Best Used Cars in India 2025: Complete Buyer's Guide"
            description="Expert guide to the best used cars in India with prices, maintenance costs, and resale values"
          />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 pt-12 pb-8">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300">
              <BookOpen className="h-3 w-3 mr-1" />
              Comprehensive Guide
            </Badge>
            <Badge variant="outline" className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300">
              <Clock className="h-3 w-3 mr-1" />
              15 min read
            </Badge>
            <Badge variant="outline" className="bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300">
              Updated 2025
            </Badge>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
            Best Used Cars in India 2025: Complete Buyer's Guide with Prices, Models & Expert Tips
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Complete buyer's guide to the best used cars in India 2025. Expert insights on Maruti Swift, WagonR, Honda City, Hyundai Creta, and Tata Nexon with prices, maintenance costs, and resale value. Use Cararth.com to compare 100+ platforms instantly.
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
              The best used cars in India include <strong>Maruti Suzuki Swift</strong>, <strong>WagonR</strong>, <strong>Honda City</strong>, <strong>Hyundai Creta</strong>, and <strong>Toyota Innova</strong>, offering excellent reliability, low maintenance costs (₹3,000-₹10,000/year), strong resale value (70-80% after 3 years), and comprehensive warranty options through certified pre-owned programs. Use <strong><Link href="/" className="text-blue-600 hover:text-blue-700">Cararth.com</Link></strong> to compare prices across multiple platforms and find the best deals on verified used cars in your city.
            </p>

            <div className="bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-600 p-6 my-8">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-blue-600" />
                Key Takeaways
              </h3>
              <ul className="space-y-2 mb-0">
                <li><strong>Top Budget Pick:</strong> Maruti WagonR offers lowest maintenance at ₹9,000/year for 50,000 km with 23-25 kmpl fuel economy</li>
                <li><strong>Best Resale Value:</strong> Toyota Innova retains 80% value after 3 years, highest in the market</li>
                <li><strong>Optimal Age:</strong> Purchase 3-5 year old cars for maximum value (30-50% depreciated but 10+ years life remaining)</li>
                <li><strong>Timing Matters:</strong> Buy during December for ₹40,000-₹80,000 discounts during year-end clearance</li>
                <li><strong>Inspection Investment:</strong> Professional inspection (₹2,000-₹3,500) prevents ₹50,000-₹2 lakh unexpected repairs</li>
                <li><strong>Market Growth:</strong> India's used car market reached 5.9 million units in 2024, projected to hit 9.5 million by 2030</li>
                <li><strong>Smart Shopping:</strong> Use <strong><Link href="/" className="text-blue-600 hover:text-blue-700">Cararth.com</Link></strong> to search across 100+ used car platforms and compare prices in real-time</li>
              </ul>
            </div>

            <Separator className="my-8" />

            <h2 className="text-3xl font-bold mb-4">Why Buy a Used Car in India? Market Overview & Benefits</h2>
            <p>
              India's used car market has matured significantly, reaching 5.9 million units in 2024 with projections to touch 9.5 million units by 2030. The organized sector now accounts for increasing market share as platforms like Cars24, Spinny, and manufacturer-backed programs provide certified options with warranties and inspections.
            </p>
            <p>
              The primary advantage of buying used cars is the 40-50% cost savings compared to new vehicles while avoiding the steepest depreciation curve. New cars lose 15-20% value in the first year alone, making 3-5 year old vehicles the sweet spot for value-conscious buyers.
            </p>

            <div className="bg-gradient-to-br from-orange-50 to-blue-50 dark:from-orange-950/20 dark:to-blue-950/20 p-6 rounded-lg my-8">
              <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-orange-600" />
                Smart Shopping Tip
              </h3>
              <p className="mb-0">
                <strong>Finding the right used car at the best price</strong> requires comparing listings across multiple platforms. <strong><Link href="/" className="text-blue-600 hover:text-blue-700">Cararth.com</Link></strong> aggregates inventory from all major used car websites, allowing you to search once and compare prices from Cars24, Spinny, CarDekho, OLX, and 100+ other platforms instantly. This saves hours of manual searching and ensures you don't miss the best deals.
              </p>
            </div>

            <h2 className="text-3xl font-bold mb-4 mt-8">Top 10 Best Used Cars in India Under ₹5 Lakhs</h2>

            <h3 className="text-2xl font-semibold mb-3 flex items-center gap-2">
              <Car className="h-5 w-5 text-blue-600" />
              1. Maruti Suzuki Swift: The Reliability Champion
            </h3>
            <p>
              The Swift dominates India's used car market with the highest reliability ratings and best resale value in the hatchback segment. Available between <strong>₹2.5-4.8 lakhs</strong> for 2015-2019 models, the Swift offers exceptional fuel economy at 20+ kmpl and incredibly low maintenance costs of just ₹3,000-5,000 per service.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2 mb-2">
                  <IndianRupee className="h-4 w-4 text-green-600" />
                  <span className="font-semibold">Price Range</span>
                </div>
                <p className="text-sm mb-0">₹2.5-4.8 Lakhs (2015-2019)</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2 mb-2">
                  <Wrench className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold">Maintenance</span>
                </div>
                <p className="text-sm mb-0">₹3,000-5,000/service</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2 mb-2">
                  <Percent className="h-4 w-4 text-purple-600" />
                  <span className="font-semibold">Resale Value</span>
                </div>
                <p className="text-sm mb-0">70-75% after 3 years</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-orange-600" />
                  <span className="font-semibold">Service Network</span>
                </div>
                <p className="text-sm mb-0">4,000+ touchpoints</p>
              </div>
            </div>
            <p>
              With Maruti's extensive service network spanning 4,000+ touchpoints, finding affordable repairs is never challenging. First-time buyers particularly appreciate the Swift's easy handling, compact dimensions for parking, and proven track record spanning over 15 years in India.
            </p>

            <div className="bg-green-50 dark:bg-green-950/20 border-l-4 border-green-600 p-4 my-6">
              <p className="mb-0">
                <strong>Pro Tip:</strong> Search for <strong><Link href="/" className="text-green-700 dark:text-green-400 hover:underline">used Maruti Swift on Cararth.com</Link></strong> to compare prices across all platforms and find the best deal in your budget.
              </p>
            </div>

            <h3 className="text-2xl font-semibold mb-3 mt-8 flex items-center gap-2">
              <Car className="h-5 w-5 text-blue-600" />
              2. Maruti WagonR: Budget King
            </h3>
            <p>
              The WagonR is India's favorite family hatchback, known for spacious interiors and rock-bottom running costs. Available at <strong>₹2-4 lakhs</strong> for 2014-2018 models, it delivers unbeatable value with 23-25 kmpl fuel economy and annual maintenance of just ₹9,000 for 50,000 km.
            </p>

            <h3 className="text-2xl font-semibold mb-3 mt-8 flex items-center gap-2">
              <Car className="h-5 w-5 text-blue-600" />
              3. Honda City: Premium Sedan Choice
            </h3>
            <p>
              The Honda City remains the gold standard for used sedans in India. With prices ranging <strong>₹4-7.5 lakhs</strong> for 2014-2017 models, the City offers premium features, refined driving experience, and legendary Honda reliability with minimal depreciation.
            </p>

            <h3 className="text-2xl font-semibold mb-3 mt-8 flex items-center gap-2">
              <Car className="h-5 w-5 text-blue-600" />
              4. Hyundai Creta: The SUV Favorite
            </h3>
            <p>
              Hyundai's Creta dominates the compact SUV segment with strong demand in both new and used markets. Priced at <strong>₹7-12 lakhs</strong> for 2015-2018 models, the Creta combines SUV stance, feature-rich interiors, and Hyundai's proven reliability.
            </p>

            <h3 className="text-2xl font-semibold mb-3 mt-8 flex items-center gap-2">
              <Car className="h-5 w-5 text-blue-600" />
              5. Toyota Innova: The Resale Value King
            </h3>
            <p>
              The Toyota Innova holds the crown for best resale value in India, retaining an incredible 80% of its value after 3 years. Available at <strong>₹8-15 lakhs</strong> for 2012-2016 models, the Innova is virtually bulletproof with minimal maintenance needs and unmatched reliability.
            </p>

            <Separator className="my-8" />

            <h2 className="text-3xl font-bold mb-4">Essential Buying Tips</h2>
            
            <h3 className="text-2xl font-semibold mb-3">Professional Inspection is Critical</h3>
            <p>
              Never skip a professional inspection. Spending ₹2,000-₹3,500 on a thorough check can save you from ₹50,000-₹2 lakh in hidden repairs. Look for frame damage, engine issues, transmission problems, and odometer tampering.
            </p>

            <h3 className="text-2xl font-semibold mb-3 mt-6">Timing Your Purchase</h3>
            <p>
              The best time to buy used cars in India is during December year-end clearance or during festival seasons. Dealers offer ₹40,000-₹80,000 discounts to clear inventory, and private sellers are more negotiable during these periods.
            </p>

            <h3 className="text-2xl font-semibold mb-3 mt-6">Document Verification</h3>
            <p>
              Always verify RC transfer, insurance validity, NOC from previous financier, service history, and PUC certificate. Cross-check chassis and engine numbers with RC book to prevent buying stolen vehicles.
            </p>

            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-6 rounded-lg my-8">
              <h3 className="text-2xl font-bold mb-3">Use Cararth.com to Find the Best Deals</h3>
              <p className="mb-4">
                Stop wasting time visiting multiple websites. <strong><Link href="/" className="text-blue-600 hover:text-blue-700">Cararth.com</Link></strong> is India's first used car search engine that lets you compare prices across 100+ platforms including:
              </p>
              <ul className="space-y-1">
                <li>Cars24, Spinny, CarDekho, OLX</li>
                <li>Manufacturer certified pre-owned programs</li>
                <li>Local dealer inventories</li>
                <li>Private seller listings</li>
              </ul>
              <p className="mb-0 mt-4">
                Search once, compare everything, and save thousands on your next used car purchase.
              </p>
            </div>

            <Separator className="my-8" />

            <h2 className="text-3xl font-bold mb-4">Conclusion</h2>
            <p>
              Buying a used car in India offers tremendous value when done right. Focus on models with proven reliability like Maruti Swift, WagonR, Honda City, Hyundai Creta, and Toyota Innova. Always get professional inspections, verify documents thoroughly, and use <strong><Link href="/" className="text-blue-600 hover:text-blue-700">Cararth.com</Link></strong> to compare prices across all platforms and find the best deal.
            </p>
            <p>
              Remember: The sweet spot is 3-5 year old cars from reliable brands with complete service history. These vehicles have already absorbed the steepest depreciation but still have 10+ years of reliable service ahead at a fraction of new car prices.
            </p>

            <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Share this guide:</p>
                  <SocialShareButtons
                    url="https://www.cararth.com/guides/best-used-cars-india-2025"
                    title="Best Used Cars in India 2025: Complete Buyer's Guide"
                    description="Expert guide to the best used cars in India with prices, maintenance costs, and resale values"
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
