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
  Zap,
  TrendingUp,
  CheckCircle2,
  Battery,
  DollarSign,
  Wrench,
  BookOpen
} from "lucide-react";

export default function UsedElectricCarsGuide2025() {
  useEffect(() => {
    document.title = "Used Electric Cars India 2025: 500+ EVs, Battery Health & Warranty Guide | Cararth";
    
    const metaTags = {
      description: "Find 500+ used electric cars in India from ₹2.2L-₹37L. Compare Nexon EV, MG ZS EV, Tata Tiago with battery health, depreciation data, and warranties on Cararth.com",
      keywords: "used electric cars India, used EV, Nexon EV price, MG ZS EV, battery health, EV depreciation, used electric vehicle, Cararth",
      "og:title": "Used Electric Cars India 2025: Complete Buying Guide with Battery Health & Warranties",
      "og:description": "Comprehensive guide to 500+ used EVs across India. Battery degradation data, depreciation curves, warranty comparisons, and smart buying strategies.",
      "og:type": "article",
      "article:published_time": "2025-11-19T00:00:00Z",
      "article:author": "Cararth Team",
      "article:section": "Buying Guides"
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
      "headline": "Used Electric Cars India 2025: Complete Buying Guide with Battery Health, Depreciation & Warranties",
      "description": "Comprehensive guide to 500+ used EVs in India. Battery degradation at 1.8%/year, depreciation 42% in 2 years, warranties 8-15 years.",
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
      "datePublished": "2025-11-19",
      "dateModified": "2025-11-19",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://www.cararth.com/guides/used-electric-cars-2025"
      },
      "articleSection": "Buying Guides",
      "keywords": "used EV, electric car, battery health, depreciation, warranty",
      "wordCount": 4000
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
            url="https://www.cararth.com/guides/used-electric-cars-2025"
            title="Used Electric Cars India 2025: Complete Buyer's Guide"
            description="500+ used EVs from ₹2.2L with battery health data, depreciation analysis, and warranty comparisons on Cararth.com"
          />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 pt-12 pb-8">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300">
              <Zap className="h-3 w-3 mr-1" />
              EV Guide 2025
            </Badge>
            <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300">
              <Clock className="h-3 w-3 mr-1" />
              12 min read
            </Badge>
            <Badge variant="outline" className="bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300">
              500+ Listings
            </Badge>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
            Used Electric Cars India 2025: Complete Guide
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400">
            500+ certified used EVs from ₹2.2L-₹37L. Master battery health, depreciation curves, warranties, and smart buying strategies.
          </p>

          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span>By Cararth Team</span>
            <span>•</span>
            <span>November 19, 2025</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-16">
        <Card className="p-6 sm:p-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <article className="prose prose-lg dark:prose-invert max-w-none">
            <h2 className="text-3xl font-bold mb-4">Quick Answer</h2>
            <p className="text-lg leading-relaxed">
              India's used electric car market offers <strong>500+ certified EVs</strong> ranging from <strong>₹2.2L to ₹37L</strong>. Tata Nexon EV dominates with 392+ listings (₹6.92L-₹15.76L), followed by MG ZS EV (₹11.84L-₹20.05L), and entry-level Tata Tiago EV. <strong><Link href="/" className="text-blue-600 hover:text-blue-700">Cararth.com</Link></strong> helps compare all 500+ used EVs across Cars24 (132 units), CarWale (392 Nexon EVs), Spinny, and CarDekho instantly with verified battery health data.
            </p>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-l-4 border-green-600 p-6 my-8">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                Key Takeaways
              </h3>
              <ul className="space-y-2 mb-0">
                <li><strong>Market Size:</strong> 500+ certified used EVs across all platforms</li>
                <li><strong>Price Range:</strong> ₹2.2L-₹37L (Nexon EV ₹6.92L-₹15.76L, MG ZS EV ₹11.84L-₹20.05L)</li>
                <li><strong>Battery Degradation:</strong> 1.8% annually, 91% capacity after 5 years</li>
                <li><strong>Depreciation:</strong> EVs lose 42% in 2 years (vs 20% ICE), 49% in 5 years</li>
                <li><strong>Warranties:</strong> Tata 15 years/unlimited km (1st owner), MG 8 years/1.5L km, Hyundai 8 years/1.6L km</li>
                <li><strong>SOH Standards:</strong> 90%+ excellent for &lt;5 year cars, 70% minimum threshold</li>
                <li><strong>Smart Search:</strong> Use Cararth battery health filter to compare all EVs instantly</li>
              </ul>
            </div>

            <Separator className="my-8" />

            <h2 className="text-3xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="h-7 w-7 text-blue-600" />
              India's Used EV Market Overview
            </h2>
            <p>
              India's used electric vehicle market has matured significantly in 2025 with <strong>500+ certified listings</strong> addressing early adopter trade-ins and lease returns. <strong>Cars24</strong> leads with 132 verified electric cars including 60 Tata Nexon EV units, offering industry's most comprehensive 300+ point inspection. <strong>CarWale</strong> aggregates 392 used Nexon EVs, providing the largest inventory for comprehensive dealer comparison.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
              <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-3xl font-bold text-green-600 mb-2">500+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total EV Listings</div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-3xl font-bold text-blue-600 mb-2">1.8%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Annual Degradation Rate</div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-3xl font-bold text-purple-600 mb-2">₹2.2L</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Starting Price</div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-3xl font-bold text-orange-600 mb-2">15 Years</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Tata Battery Warranty</div>
              </div>
            </div>

            <p>
              <strong>Tata Nexon EV dominates with 392+ listings</strong> at ₹6.92L-₹15.76L, establishing itself as India's most liquid used EV. The 465 km ARAI range (250-300 km real-world) and established service network make it ideal for used car buyers.
            </p>

            <h2 className="text-3xl font-bold mb-4 mt-8 flex items-center gap-2">
              <Battery className="h-7 w-7 text-green-600" />
              Battery Health: The Critical Factor
            </h2>

            <h3 className="text-2xl font-semibold mb-3 mt-6">Battery Degradation Reality</h3>
            <p>
              Modern EV batteries degrade at <strong>1.8% annually</strong>, translating to <strong>91% capacity retention after 5 years</strong>, 82% after 10 years. This predictable degradation supports realistic <strong>15-20 year lifespans</strong>.
            </p>

            <h3 className="text-2xl font-semibold mb-3 mt-6">State of Health (SOH) Standards</h3>
            <ul>
              <li><strong>90%+ SOH:</strong> Excellent for cars under 5 years</li>
              <li><strong>85-90% SOH:</strong> Acceptable for 5-8 year vehicles</li>
              <li><strong>70% SOH:</strong> Warranty threshold and end-of-useful-life marker</li>
            </ul>

            <div className="bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-yellow-600 p-6 my-6">
              <p className="text-lg font-semibold mb-2">💡 Pro Tip:</p>
              <p>When searching used EVs on Cararth.com, use the battery health filter to show only listings with SOH {'>'}90% for cars under 5 years. This instantly narrows 500+ listings to quality options across all platforms.</p>
            </div>

            <Separator className="my-8" />

            <h2 className="text-3xl font-bold mb-4 flex items-center gap-2">
              <DollarSign className="h-7 w-7 text-red-600" />
              EV Depreciation: 49% in 5 Years vs 39% for ICE
            </h2>

            <p>
              Electric vehicles depreciate faster than internal combustion vehicles, with <strong>EVs losing 42% value in 2 years</strong> versus 20% for ICE cars, and <strong>49% in 5 years</strong> versus 39% average.
            </p>

            <h3 className="text-2xl font-semibold mb-3 mt-6">Year-by-Year Depreciation</h3>
            <ul>
              <li><strong>Year 1:</strong> 20-25% (new car premium evaporation)</li>
              <li><strong>Year 2:</strong> 15-20% additional (total 42%)</li>
              <li><strong>Year 3:</strong> 10-15% additional</li>
              <li><strong>Years 4-5:</strong> 8-10% annually (stabilizes at 49%)</li>
            </ul>

            <p className="mt-4">
              However, faster depreciation creates opportunity: <strong>2-3 year old EVs available at 50-60% of original price</strong> offer excellent value if battery health verified ({'>'}90% SOH) and remaining warranty substantial (5-8 years typical).
            </p>

            <Separator className="my-8" />

            <h2 className="text-3xl font-bold mb-4 flex items-center gap-2">
              <Wrench className="h-7 w-7 text-purple-600" />
              Warranty Comparison: Which OEM Offers Best Coverage?
            </h2>

            <h3 className="text-2xl font-semibold mb-3 mt-6">Tata Motors: Industry-Leading 15-Year Warranty</h3>
            <ul>
              <li><strong>Coverage:</strong> 15 years from first registration (termed "Lifetime")</li>
              <li><strong>1st Owner:</strong> Unlimited kilometers</li>
              <li><strong>2nd Owner (Nexon EV):</strong> 10 years / 2 lakh km</li>
              <li><strong>2nd Owner (Tiago EV, Punch EV):</strong> 8 years / 1.6 lakh km</li>
            </ul>

            <h3 className="text-2xl font-semibold mb-3 mt-6">MG Motor: 8 Years / 1.5 Lakh Km</h3>
            <p>
              ZS EV offers <strong>8 years/1.5 lakh km</strong> transferable coverage, supporting its premium positioning at ₹11.84L-₹20.05L used. Coverage includes battery pack and electric motor.
            </p>

            <h3 className="text-2xl font-semibold mb-3 mt-6">Hyundai: 8 Years / 1.6 Lakh Km</h3>
            <p>
              Kona Electric and Ioniq 5 feature <strong>8 years/1.6 lakh km battery warranty</strong>, transferable with ownership notification and service history verification.
            </p>

            <h3 className="text-2xl font-semibold mb-3 mt-6">Warranty Transfer Process</h3>
            <ol>
              <li>Complete RC transfer at RTO with new owner name</li>
              <li>Notify manufacturer within 30-90 days (brand-specific)</li>
              <li>Provide sale documents (invoice, RC, NOC if applicable)</li>
              <li>Verify previous service history at authorized centers</li>
              <li>Obtain warranty transfer certificate from manufacturer</li>
            </ol>

            <div className="bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-600 p-6 my-6">
              <p className="font-semibold mb-2">🔍 Finding the Best Used EV Deals</p>
              <p>Smart buyers use <Link href="/" className="text-blue-600 hover:text-blue-700">Cararth.com</Link> to filter 2019-2021 models (3-5 years old in 2025) for the 50-60% depreciation sweet spot, then sort by battery SOH (90%+) and remaining warranty (5+ years), instantly identifying value propositions like 2020 Nexon EVs originally ₹14L now ₹7L with 91% SOH and 8 years warranty remaining.</p>
            </div>

            <Separator className="my-8" />

            <h2 className="text-2xl font-bold mb-4">Start Your Smart Used EV Search Today</h2>
            <p>
              With 500+ used EVs spread across multiple platforms, manual comparison wastes 10-15 hours. <Link href="/" className="text-blue-600 hover:text-blue-700">Cararth.com</Link> instantly compares all listings with battery SOH data, remaining warranty years, and platform certifications—saving you hours while ensuring you find the best value.
            </p>

            <Link href="/">
              <Button className="mt-6 px-8 py-3 text-lg">
                Search 500+ Used EVs Now
              </Button>
            </Link>
          </article>
        </Card>
      </div>
    </div>
  );
}
