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
  TrendingUp,
  CheckCircle2,
  Car,
  Fuel,
  DollarSign,
  Target,
  BookOpen
} from "lucide-react";

export default function CretaIndiaGuide2025() {
  useEffect(() => {
    document.title = "Used Hyundai Creta India 2025: 5,800+ Listings, Best Years & Diesel vs Petrol | Cararth";
    
    const metaTags = {
      description: "Find 5,800+ used Hyundai Creta from ₹2.5L-₹21L. 2018-2020 SX diesel ₹9-12L best value. Complete guide on fuel economy, ownership costs. Compare on Cararth.com",
      keywords: "used Creta India, Hyundai Creta price, Creta diesel vs petrol, Creta 2019 2020, Cars24 Creta, Spinny Creta, Cararth",
      "og:title": "Used Hyundai Creta India 2025: Complete Buyer's Guide",
      "og:description": "5,800+ Creta listings from ₹2.5L. Best years, diesel vs petrol comparison, ownership costs analysis",
      "og:type": "article",
      "article:published_time": "2025-11-16T00:00:00Z",
      "article:author": "Cararth Team",
      "article:section": "Car Guides"
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
      "headline": "Used Hyundai Creta in India 2025: Complete Buying Guide with 5,800+ Listings",
      "description": "Comprehensive guide to buying used Hyundai Creta in India with 5,800+ listings, pricing, diesel vs petrol analysis, and ownership costs",
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
        "@id": "https://www.cararth.com/news/used-creta-india-2025"
      },
      "articleSection": "Car Guides",
      "keywords": "Creta India, used Creta price, diesel vs petrol, first gen second gen",
      "wordCount": 3100
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
            url="https://www.cararth.com/news/used-creta-india-2025"
            title="Used Creta India 2025: Complete Buyer's Guide"
            description="5,800+ Creta listings from ₹2.5L. Compare diesel vs petrol, best years on Cararth.com"
          />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 pt-12 pb-8">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300">
              <Car className="h-3 w-3 mr-1" />
              Hyundai Creta
            </Badge>
            <Badge variant="outline" className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300">
              <Clock className="h-3 w-3 mr-1" />
              14 min read
            </Badge>
            <Badge variant="outline" className="bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300">
              5,800+ Listings
            </Badge>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
            Used Hyundai Creta in India 2025: Complete Buying Guide
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Compare 5,800+ listings from ₹2.5L-₹21L. Find the best years, diesel vs petrol analysis, and complete ownership cost breakdown.
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
              Used Hyundai Creta prices range <strong>₹2.5L-₹21L</strong> across <strong>5,800+ listings</strong> in India. Best value: <strong>2018-2020 SX diesel ₹9-12L</strong> with 40,000-70,000 km. First-gen 1.6L diesel offers 21.4 kmpl efficiency, excellent resale value retaining 70-75% after 3 years. Service costs ₹17,000-21,000 for 5 years. <strong><Link href="/" className="text-blue-600 hover:text-blue-700">Cararth.com</Link></strong> helps you compare all Creta listings across CarWale, Cars24, Spinny, CarDekho instantly to find the best deal.
            </p>

            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-l-4 border-blue-600 p-6 my-8">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-blue-600" />
                Key Takeaways
              </h3>
              <ul className="space-y-2 mb-0">
                <li><strong>Market Size:</strong> 5,800+ used Creta available (CarWale 3,738, CarDekho 1,923, Cars24 584)</li>
                <li><strong>Price Range:</strong> ₹2.5L-₹21L spanning first-gen (2015-2019) and second-gen (2020-2024)</li>
                <li><strong>Best Value:</strong> 2019-2020 SX/SX(O) diesel ₹11-14L with modern features, proven reliability</li>
                <li><strong>Fuel Economy:</strong> Diesel 18-21 kmpl real-world vs petrol 14-17 kmpl (20-25% advantage)</li>
                <li><strong>Service Costs:</strong> Petrol ₹17K-21K, diesel ₹18K-27K for 5 years (₹377-487/month)</li>
                <li><strong>Resale Value:</strong> Creta retains 70-75% after 3 years, among best in segment</li>
                <li><strong>Break-Even:</strong> Diesel justified if driving 15,000+ km/year (1,250+ km/month)</li>
                <li><strong>Top Engine:</strong> First-gen 1.6L diesel (127 bhp) most reliable Creta powertrain</li>
                <li><strong>Smart Search:</strong> Use <Link href="/" className="text-blue-600 hover:text-blue-700">Cararth.com</Link> to compare all 5,800+ listings in seconds</li>
              </ul>
            </div>

            <Separator className="my-8" />

            <h2 className="text-3xl font-bold mb-4 flex items-center gap-2">
              <DollarSign className="h-7 w-7 text-blue-600" />
              Used Creta Price Analysis
            </h2>
            
            <p>
              Used Hyundai Creta prices in India range from <strong>₹2.5 lakh to ₹21 lakh</strong> depending on generation, year, variant, mileage, and condition across 5,800+ available units. <strong>CarWale</strong> offers the largest selection with 3,738 Creta starting ₹2.5L with 7-day money-back guarantee and 167-point certification. <strong>CarDekho</strong> lists 1,923 units across India with TrustMark certification. <strong>Cars24</strong> features 584 verified Creta with 300+ point inspection.
            </p>

            <h3 className="text-2xl font-semibold mt-6 mb-4">First Generation Pricing (2015-2019)</h3>
            
            <p>
              The <strong>2015-2017 models</strong> range <strong>₹6-9 lakhs</strong>, providing the entry point for budget buyers. The 1.6L petrol (121 bhp) starts at ₹6 lakh, 1.4L diesel (89 bhp) ranges ₹6.5-8 lakhs, and the most sought-after 1.6L diesel (127 bhp) commands ₹7-9 lakhs. These models typically show 80,000-1,50,000 km mileage.
            </p>

            <p>
              The <strong>2018-2019 models</strong> represent the sweet spot at <strong>₹7-11 lakhs</strong>. According to Orange Book Value, 2018 models start at ₹9.02 lakh while 2019 models begin at ₹9.99 lakh. These final first-generation years offer proven reliability with 6-7 years of track record and typical mileage of 50,000-1,00,000 km.
            </p>

            <p>
              <strong>Variant-wise pricing</strong> shows E base at ₹6-8 lakhs (basic features), EX mid at ₹7-9 lakhs (essential features, good value), S/SX at ₹8-10 lakhs (comprehensive features, recommended), and SX(O) top at ₹9-11 lakhs (all features, premium justified).
            </p>

            <h3 className="text-2xl font-semibold mt-6 mb-4">Second Generation Pricing (2020-2024)</h3>

            <p>
              The <strong>2020 models</strong> offer best overall value at <strong>₹11-15 lakhs</strong> as the first year of major redesign with modern styling. A Cars24 example shows 2020 SX(O) 1.4-turbo DCT with 57,541 km priced at ₹13.03L, representing 24.24% depreciation from ₹17.20L on-road.
            </p>

            <p>
              <strong>2021-2022 models</strong> range <strong>₹12-17 lakhs</strong> with mature second-generation quality. A 2021 SX 1.5 Petrol MT with 24,000 km sells at ₹12.32L showing 12.8% depreciation from ₹14.13L. These 4-5 year old vehicles offer 10-12 years remaining life and often retain manufacturer warranty.
            </p>

            <div className="bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-yellow-600 p-4 my-6">
              <p className="mb-0">
                <strong>💡 Pro Tip:</strong> With 5,800+ Creta listings across CarWale, CarDekho, Cars24, Spinny, and regional dealers, manually comparing prices wastes hours. <Link href="/" className="text-blue-600 hover:text-blue-700">Cararth.com</Link> lets you search once for "Hyundai Creta" and instantly see all listings sorted by price.
              </p>
            </div>

            <Separator className="my-8" />

            <h2 className="text-3xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="h-7 w-7 text-blue-600" />
              Best Platforms to Buy Used Creta
            </h2>

            <p>
              <strong>CarWale</strong> dominates with 3,738 listings offering the widest ₹2.5L-₹21L spectrum. Regional presence includes 473 units in Delhi (₹2.5L-20.5L), 406 in Mumbai (₹5L-20.5L), and 219 in Bangalore (₹5.62L-21L). The abSure 167-point inspection provides 15,000 km comprehensive warranty with 7-day money-back guarantee.
            </p>

            <p>
              <strong>CarDekho</strong> features 1,923 Creta with TrustMark 217-point inspection and 6-month warranty on certified units. The Rupyy financing arm enables instant eligibility checks with competitive rates through 78+ dealers in major cities.
            </p>

            <p>
              <strong>Cars24</strong> offers 584 verified Creta with the industry's most comprehensive 300+ point inspection. Fixed transparent pricing eliminates haggling, while the 30-day return policy provides the longest guarantee period in the industry.
            </p>

            <p>
              <strong>Spinny</strong> provides premium Spinny Assured Creta with 200-point quality evaluation and industry-best 1-year comprehensive warranty. The unique 5-day money-back guarantee requires no questions asked, while free home test drive and doorstep delivery add convenience.
            </p>

            <Separator className="my-8" />

            <h2 className="text-3xl font-bold mb-4 flex items-center gap-2">
              <Fuel className="h-7 w-7 text-blue-600" />
              Diesel vs Petrol Creta: Which to Choose
            </h2>

            <p>
              <strong>Diesel strongly recommended for 15,000+ km/year</strong> or highway-focused usage, while petrol suits under 10,000 km/year with primarily city driving. The fuel economy comparison shows diesel delivering <strong>21.4 km/l official</strong> (1.4L diesel) and 19.6-19.1 km/l (1.6L diesel) with real-world 18-21 km/l. Petrol delivers 16.8 km/l official (1.6L petrol) and 17.4-17.7 km/l (1.5L petrol) with real-world 14-17 km/l, representing <strong>20-25% lower efficiency</strong> than diesel.
            </p>

            <h3 className="text-2xl font-semibold mt-6 mb-4">Real-World Cost Analysis</h3>

            <p>
              For <strong>15,000 km/year over 5 years</strong> (75,000 km total), petrol costs <strong>₹5,00,000 in fuel</strong> (at 15 km/l average, ₹100/L) while diesel costs <strong>₹3,75,000</strong> (at 19 km/l average, ₹95/L), providing <strong>₹1,25,000 savings over 5 years</strong>. However, diesel service costs run ₹5,565 higher, and diesel purchase premium adds ₹1-1.5 lakhs upfront.
            </p>

            <p>
              The break-even analysis shows diesel justified after 4-6 years or 60,000-90,000 km with annual fuel savings of ₹25,000 at 15,000 km/year usage. Monthly maintenance costs <strong>₹377-462 for petrol versus ₹444-487 for diesel</strong>.
            </p>

            <h3 className="text-2xl font-semibold mt-6 mb-4">Decision Framework</h3>

            <p>
              <strong>Choose diesel if:</strong> Driving 1,800+ km/month (60+ km/day), highway-focused usage requiring 60%+ highway mileage, planning 7-10 year long-term ownership, comfortable with higher service complexity, prioritizing torque for effortless cruising (250-260 Nm diesel vs 144-151 Nm petrol), especially if buying first-gen 1.6L diesel considered most reliable Creta powertrain.
            </p>

            <p>
              <strong>Choose petrol if:</strong> Driving under 830 km/month, city-focused usage comprising 70%+ city driving, planning 3-5 year shorter ownership, concerned about DPF clogging issues in stop-go traffic (BS6 diesel requires monthly highway runs), preferring lower service costs and simpler maintenance, wanting turbo option (1.4L/1.5L) for performance with petrol convenience.
            </p>

            <Separator className="my-8" />

            <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 border-2 border-green-600 rounded-lg p-6 my-8">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Target className="h-6 w-6 text-green-600" />
                Final Recommendation
              </h3>
              <p className="mb-4">
                For the best value, target a <strong>2019-2020 SX or SX(O) diesel Creta</strong> with 40,000-70,000 km in the <strong>₹11-14L range</strong>. The first-gen 1.6L diesel (127 bhp, 260 Nm) remains the most reliable powertrain. Choose diesel if you drive 1,800+ km/month or plan long-term ownership.
              </p>
              <p className="mb-0">
                Use <strong><Link href="/" className="text-blue-600 hover:text-blue-700">Cararth.com</Link></strong> to compare all 5,800+ Creta listings across CarWale (3,738), CarDekho (1,923), Cars24 (584), and Spinny instantly, helping you find the perfect Creta at the best price without spending hours on manual searches.
              </p>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
              <Link href="/news">
                <Button variant="outline" className="gap-2" data-testid="button-back-guides">
                  <BookOpen className="h-4 w-4" />
                  Back to All Guides
                </Button>
              </Link>
            </div>
          </article>
        </Card>
      </div>
    </div>
  );
}
