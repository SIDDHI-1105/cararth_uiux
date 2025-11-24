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
  DollarSign,
  AlertCircle,
  BookOpen
} from "lucide-react";

export default function InnovaIndiaGuide2025() {
  useEffect(() => {
    document.title = "Used Toyota Innova Buyer's Guide (2025): Prices, Problems & Best Variants | Cararth";
    
    const metaTags = {
      description: "Used Toyota Innova buyer's guide 2025: city-wise prices, best variants, inspection checklist, TCO. Updated for India on Cararth.com",
      keywords: "used Innova India, Toyota Innova price, Innova Crysta, best MPV, Innova inspection, Cararth",
      "og:title": "Used Toyota Innova Buyer's Guide (2025) - Complete Guide",
      "og:description": "City-wise prices, best variants, inspection checklist for buying used Toyota Innova in India",
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
      "headline": "Used Toyota Innova Buyer's Guide (2025): Prices, Problems, Lifespan & Best Variants",
      "description": "Comprehensive guide to buying used Toyota Innova with city-wise prices, inspection checklist, and best variants",
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
        "@id": "https://www.cararth.com/news/used-innova-india-2025"
      },
      "articleSection": "Car Guides",
      "keywords": "Innova India, used Innova price, Innova Crysta, MPV guide",
      "wordCount": 2600
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
            url="https://www.cararth.com/news/used-innova-india-2025"
            title="Used Innova India 2025: Complete Buyer's Guide"
            description="City-wise prices, inspection checklist for Toyota Innova on Cararth.com"
          />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 pt-12 pb-8">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300">
              <Car className="h-3 w-3 mr-1" />
              Toyota Innova
            </Badge>
            <Badge variant="outline" className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300">
              <Clock className="h-3 w-3 mr-1" />
              12 min read
            </Badge>
            <Badge variant="outline" className="bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300">
              MPV Guide
            </Badge>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
            Used Toyota Innova Buyer's Guide (2025)
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Complete guide with city-wise prices, best variants, inspection checklist, and ownership costs for India's most reliable MPV.
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
              The Toyota Innova (Innova Crysta) remains one of India's most reliable used MPVs — strong resale value, robust build and long life make it a sensible family buy, provided you check service history, usage, and perform a thorough inspection.
            </p>

            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-l-4 border-blue-600 p-6 my-8">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-blue-600" />
                Key Takeaways
              </h3>
              <ul className="space-y-2 mb-0">
                <li><strong>Best Value:</strong> 2016–2020 Innova Crysta (2.4/2.8 diesel) — balance of features and remaining life</li>
                <li><strong>Check Thoroughly:</strong> Ownership history, service records and signs of commercial/taxi use over raw odometer</li>
                <li><strong>Common Issues:</strong> Suspension bush wear, brake judder, injector/turbo repairs on high-km diesels</li>
                <li><strong>Life Expectancy:</strong> Many Innovas surpass 300,000 km with regular maintenance</li>
                <li><strong>Resale:</strong> Innova depreciates slowly — high long-term value makes higher upfront cost worthwhile</li>
              </ul>
            </div>

            <Separator className="my-8" />

            <h2 className="text-3xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="h-7 w-7 text-blue-600" />
              Why Innova Still Leads the Used MPV Market
            </h2>
            
            <p>
              The Innova's body-on-frame construction, proven diesel engines and Toyota's service network make it a favourite for families and fleet operators. For value-focused buyers, a properly maintained Innova offers <strong>predictable ownership costs</strong> and <strong>strong resale value</strong>.
            </p>

            <h2 className="text-3xl font-bold mb-4 flex items-center gap-2">
              <DollarSign className="h-7 w-7 text-blue-600" />
              City-Wise Price Guide
            </h2>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Estimated asking price ranges — use these as city-level benchmarks. Prices vary by exact condition, mileage and seller.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900">
                    <th className="border border-gray-300 dark:border-gray-700 p-2 text-left">City</th>
                    <th className="border border-gray-300 dark:border-gray-700 p-2 text-left">Representative Variant</th>
                    <th className="border border-gray-300 dark:border-gray-700 p-2 text-left">Price Range</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="border border-gray-300 dark:border-gray-700 p-2">Delhi NCR</td><td className="border border-gray-300 dark:border-gray-700 p-2">2018 Crysta 2.4 VX (7-seater)</td><td className="border border-gray-300 dark:border-gray-700 p-2">₹10.5–12.5 L</td></tr>
                  <tr><td className="border border-gray-300 dark:border-gray-700 p-2">Mumbai</td><td className="border border-gray-300 dark:border-gray-700 p-2">2017 Crysta 2.8 ZX AT</td><td className="border border-gray-300 dark:border-gray-700 p-2">₹11.0–13.5 L</td></tr>
                  <tr><td className="border border-gray-300 dark:border-gray-700 p-2">Bengaluru</td><td className="border border-gray-300 dark:border-gray-700 p-2">2016–2018 Crysta 2.4 VX</td><td className="border border-gray-300 dark:border-gray-700 p-2">₹10.0–12.0 L</td></tr>
                  <tr><td className="border border-gray-300 dark:border-gray-700 p-2">Chennai</td><td className="border border-gray-300 dark:border-gray-700 p-2">2015 Innova 2.5 G</td><td className="border border-gray-300 dark:border-gray-700 p-2">₹8.0–10.5 L</td></tr>
                  <tr><td className="border border-gray-300 dark:border-gray-700 p-2">Hyderabad</td><td className="border border-gray-300 dark:border-gray-700 p-2">2017 Crysta 2.4 VX</td><td className="border border-gray-300 dark:border-gray-700 p-2">₹9.5–11.5 L</td></tr>
                  <tr><td className="border border-gray-300 dark:border-gray-700 p-2">Pune</td><td className="border border-gray-300 dark:border-gray-700 p-2">2016 Innova Crysta 2.4</td><td className="border border-gray-300 dark:border-gray-700 p-2">₹9.8–11.8 L</td></tr>
                  <tr><td className="border border-gray-300 dark:border-gray-700 p-2">Kolkata</td><td className="border border-gray-300 dark:border-gray-700 p-2">2015–2017 Innova 2.5</td><td className="border border-gray-300 dark:border-gray-700 p-2">₹7.5–10.0 L</td></tr>
                  <tr><td className="border border-gray-300 dark:border-gray-700 p-2">Ahmedabad</td><td className="border border-gray-300 dark:border-gray-700 p-2">2016 Crysta 2.4</td><td className="border border-gray-300 dark:border-gray-700 p-2">₹8.5–10.8 L</td></tr>
                </tbody>
              </table>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-yellow-600 p-4 my-6">
              <p className="mb-0">
                <strong>💡 Note:</strong> These are representative asking ranges aggregated from marketplaces and dealer listings — always validate with inspection and a fresh market search on <Link href="/" className="text-blue-600 hover:text-blue-700">Cararth.com</Link>.
              </p>
            </div>

            <Separator className="my-8" />

            <h2 className="text-3xl font-bold mb-4">Which Variant Should You Buy?</h2>
            
            <p>
              For families, the <strong>2.4 VX or 2.8 ZX (Crysta)</strong> from 2016–2020 provides the best balance of comfort and longevity. Commercial buyers may prioritise earlier gen 2.5 diesels for lower upfront cost but expect higher wear.
            </p>

            <Separator className="my-8" />

            <h2 className="text-3xl font-bold mb-4 flex items-center gap-2">
              <AlertCircle className="h-7 w-7 text-blue-600" />
              Pre-Purchase Inspection Checklist
            </h2>
            
            <ul className="space-y-3">
              <li><strong>Service History & Ownership Records:</strong> Look for consistent dealer records</li>
              <li><strong>Underbody & Frame Inspection:</strong> Check for rust or structural repairs</li>
              <li><strong>Test Drive:</strong> Listen for gearbox/clutch issues, check for brake judder and suspension clunks</li>
              <li><strong>Signs of Taxi/Fleet Use:</strong> Check seat wear, flooring, registration class, sudden ownership changes</li>
              <li><strong>Engine Bay:</strong> Look for oil leaks, check coolant levels, inspect turbo condition on diesels</li>
            </ul>

            <Separator className="my-8" />

            <h2 className="text-3xl font-bold mb-4">Total Cost of Ownership (TCO) Highlights</h2>
            
            <p>
              Expect higher running costs than compact cars but reasonable reliability. Budget for:
            </p>
            <ul className="space-y-2">
              <li>Larger tyres (₹25,000-35,000 per set)</li>
              <li>Periodic injector/turbo servicing on diesels (₹15,000-30,000)</li>
              <li>Potential clutch or suspension work on high-km units (₹8,000-20,000)</li>
              <li>Regular service costs: ₹8,000-12,000 annually</li>
            </ul>

            <Separator className="my-8" />

            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">Is buying a used Innova worth it in 2025?</h3>
                <p>Yes — if the car has solid service records and no history of heavy commercial use. The Innova's reliability and resale value make it an excellent long-term investment.</p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">How many kilometres can an Innova last?</h3>
                <p>Many owners report 300k+ km with proper maintenance. Focus on condition and service history rather than just odometer readings.</p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Which Innova variant offers best value?</h3>
                <p>2016–2020 Crysta trims (2.4/2.8 diesel) — balance of features, performance and longevity. The 2.4 VX is particularly popular for families.</p>
              </div>
            </div>

            <Separator className="my-8" />

            <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 border-2 border-green-600 rounded-lg p-6 my-8">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                Final Recommendation
              </h3>
              <p className="mb-4">
                The Toyota Innova remains the king of used MPVs in India. Target a <strong>2016-2020 Innova Crysta 2.4 VX</strong> with documented service history and no commercial use. Always get a professional inspection and verify ownership records.
              </p>
              <p className="mb-0">
                Use <strong><Link href="/" className="text-blue-600 hover:text-blue-700">Cararth.com</Link></strong> to compare Innova listings across all platforms instantly, helping you find the perfect family MPV at the best price.
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
