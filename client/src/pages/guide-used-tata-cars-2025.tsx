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
  TrendingUp,
  AlertCircle,
  DollarSign,
  Zap,
  Award
} from "lucide-react";

export default function UsedTataGuide2025() {
  useEffect(() => {
    document.title = "Used Tata Cars India 2025: Complete Buying Guide, 5,000+ Listings, Nexon, Punch Prices | Cararth";
    
    const metaTags = {
      description: "Complete guide to 5,000+ used Tata cars in India 2025. Compare Nexon (₹5-13L), Punch (₹5-8L), Harrier prices across CarWale, Cars24, Spinny. Depreciation, resale value, certifications, and warranty comparison.",
      keywords: "used tata cars india, used nexon india, used punch, used harrier, tata resale value, tata depreciation, used tata hyderabad, tata cars 2025",
      "og:title": "Used Tata Cars India 2025: Complete Buying Guide with 5,000+ Listings",
      "og:description": "Compare 5,000+ used Tata cars across all platforms. Nexon, Punch, Harrier prices, depreciation data, and certification comparison.",
      "og:type": "article",
      "article:published_time": "2025-11-24T00:00:00Z",
      "article:author": "Cararth Editorial"
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
      "headline": "Used Tata Cars India 2025: Complete Buying Guide with 5,000+ Listings",
      "description": "Comprehensive guide to buying used Tata cars in India with pricing, depreciation, and certification details.",
      "author": {
        "@type": "Organization",
        "name": "Cararth"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Cararth",
        "url": "https://www.cararth.com"
      },
      "datePublished": "2025-11-24",
      "dateModified": "2025-11-24",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://www.cararth.com/news/used-tata-cars-india-2025"
      }
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
            url="https://www.cararth.com/news/used-tata-cars-india-2025"
            title="Used Tata Cars India 2025: Complete Buying Guide with 5,000+ Listings"
            description="Compare 5,000+ used Tata cars, pricing, depreciation, and certifications."
          />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 pt-12 pb-8">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300">
              <TrendingUp className="h-3 w-3 mr-1" />
              Market Guide
            </Badge>
            <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300">
              <Award className="h-3 w-3 mr-1" />
              Comprehensive
            </Badge>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
            Used Tata Cars India 2025
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Complete Buying Guide with 5,000+ Listings, Nexon, Punch, Harrier Prices & Resale Value
          </p>

          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span>By Cararth Editorial</span>
            <span>•</span>
            <span>November 17, 2025</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-16">
        <Card className="p-6 sm:p-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <article className="prose prose-lg dark:prose-invert max-w-none">
            <div className="bg-orange-50 dark:bg-orange-950/20 border-l-4 border-orange-600 p-6 my-8">
              <p className="text-lg font-semibold mb-2">Quick Answer</p>
              <p>Used Tata cars range ₹30,000–₹30L across 5,000+ India listings. CarWale offers 441 Hyderabad (Nexon ₹5L+, Tiago ₹2.5L+, Harrier ₹12.5L+), Cars24 has 165 (₹0.46L–₹24.58L). Punch depreciates only 25.55% first year, Nexon retains strong resale with 5-star safety. Cararth helps compare all 5,000+ used Tata listings across platforms instantly to find best value.</p>
            </div>

            <Separator className="my-8" />

            <h2 className="text-3xl font-bold mb-4">Key Takeaways</h2>
            <ul>
              <li><strong>Market Size:</strong> 5,082 used Tata nationwide (CarDekho), 441 Hyderabad (CarWale)</li>
              <li><strong>Pricing:</strong> ₹30,000–₹30L range spanning entry to premium segments</li>
              <li><strong>Top Models:</strong> Nexon (2,015 units), Punch (754 units), Tiago (₹2.5L+), Harrier (₹12.5L+)</li>
              <li><strong>Nexon Safety:</strong> 5-star Global NCAP first Indian car, ₹5–13L sweet spot</li>
              <li><strong>Punch Value:</strong> Only 25.55% first-year depreciation (best in segment)</li>
              <li><strong>Resale:</strong> Nexon 30% depreciation, Punch 25%, Harrier 64% (5 years)</li>
              <li><strong>Sweet Spot:</strong> 2019–2021 models ₹7–11L with 4–6 years age, 8–10 years remaining</li>
              <li><strong>Certifications:</strong> CarWale abSure 167-point, Cars24 300+ point, Spinny 1-year warranty</li>
            </ul>

            <Separator className="my-8" />

            <h2 className="text-3xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="h-7 w-7 text-blue-600" />
              Best Used Tata Models: Complete Product Guide
            </h2>

            <h3 className="text-2xl font-semibold mb-3 mt-6">Tata Nexon – Segment Leader</h3>
            <p>
              Dominates with 2,015 nationwide units offering India's first 5-star Global NCAP safety rating, starting ₹5L with sweet spot ₹7–11L for 2020–2021 models. The 1.2L turbo petrol (120 bhp) delivers 14–17 kmpl real-world, while 1.5L diesel (110–115 bhp) achieves 17–22 kmpl efficiency. XZ/XZ+ variants provide best value-to-features ratio with touchscreen, alloys, and cruise control. Hyderabad inventory: 114 CarWale, 19 Spinny, 51 CarDekho across platforms.
            </p>

            <h3 className="text-2xl font-semibold mb-3 mt-6">Tata Punch – Micro-SUV Value King</h3>
            <p>
              Leads micro-SUV segment with 754 units displaying exceptional 25.55% first-year depreciation (segment-best), substantially better than comparable hatchbacks. The 1.2L petrol (86 bhp) delivers 18–20 kmpl with commanding 187mm ground clearance and 5-star 2024 safety rating. Entry Pure through Creative top trim offer progressive features, with 2021–2023 models ₹5–8L representing optimal value.
            </p>

            <h3 className="text-2xl font-semibold mb-3 mt-6">Tata Tiago – Budget-Friendly Entry</h3>
            <p>
              Serves entry segment at ₹3.5–5.5L (2016+) with 4-star safety, 1.2L petrol (18–23 kmpl), and reliable basic transportation. Post-2018 BS6 models include dual airbags standard. XZ/XZ+ variants provide well-rounded features at sub-₹5L, ideal for city commuters.
            </p>

            <h3 className="text-2xl font-semibold mb-3 mt-6">Tata Altroz – Premium Hatchback</h3>
            <p>
              Premium hatchback (₹4L–₹12.95L, ₹5–9L typical) featuring 5-star safety (safest hatchback), premium build quality, spacious interiors, and Harman sound. Strong safety differentiation makes it compelling versus Maruti or Hyundai competitors.
            </p>

            <h3 className="text-2xl font-semibold mb-3 mt-6">Tata Harrier/Safari – Premium SUVs</h3>
            <p>
              Premium SUVs (₹12.5L+ Harrier, ₹14–30L Safari) feature Land Rover platform and 2.0L diesel power. However, documented ₹22L depreciation to ₹8L (5 years = 64%) warns of steep value loss. Safari 7-seater shows better retention (55–60% vs 60–65%) due to family appeal.
            </p>

            <Separator className="my-8" />

            <h2 className="text-3xl font-bold mb-4 flex items-center gap-2">
              <DollarSign className="h-7 w-7 text-green-600" />
              Depreciation & Resale Reality
            </h2>

            <p>
              <strong>Tata Punch</strong> demonstrates segment-leading 25.55% first-year depreciation holding value well years 2–4 through sustained demand and positioning appeal. <strong>Tata Nexon</strong> maintains strong 30% cumulative depreciation over 3–4 years driven by 5-star safety, established reliability, and consistent demand. <strong>Tata Harrier</strong> faces steeper 60–65% depreciation over 5 years versus Creta/Seltos competitors.
            </p>

            <p>
              <strong>Maximize Tata resale:</strong> Authorized service center maintenance only, complete documentation, accident-free condition, selling within 3–4 year window before steep post-5-year depreciation. 2019–2022 Nexon/Punch hold value better than 2024+ models with minimal depreciation justifying new car purchase versus used.
            </p>

            <Separator className="my-8" />

            <h2 className="text-3xl font-bold mb-4">₹5–10L Sweet Spot (RECOMMENDED)</h2>

            <p>
              <strong>Nexon 2019–2021</strong> (₹7–10L optimal value—modern features, BS6, 40,000–70,000 km, 4–6 years, 8–10 years remaining life with potential warranty). <strong>Punch 2021–2023</strong> (₹5–8L—all variants equipped, lower mileage 20,000–50,000 km). <strong>Altroz 2020–2022</strong> (₹5–9L—premium quality, 5-star safety). Certified purchase justified here (₹50K–₹1L peace of mind).
            </p>

            <Separator className="my-8" />

            <h2 className="text-3xl font-bold mb-4 flex items-center gap-2">
              <AlertCircle className="h-7 w-7 text-red-600" />
              Platform Certifications & Warranty Protection
            </h2>

            <p>
              <strong>Cars24</strong> (300+ point inspection)—industry-most-comprehensive, 30-day return (longest), 6-month warranty, fixed pricing. <strong>Spinny Assured</strong> (200-point)—1-year warranty (industry-best), 5-day money-back, free home test drive. <strong>CarWale abSure</strong> (167-point)—7-day money-back, 15,000 km warranty, largest dealer network.
            </p>

            <p>
              <strong>Manufacturer warranty</strong> (3 years/1L km standard)—transferable to second owner requiring 30-day Tata notification and ASC service continuity.
            </p>

            <Separator className="my-8" />

            <h2 className="text-3xl font-bold mb-4">Why Use Cararth for Tata Car Shopping?</h2>

            <p>
              With 5,000+ used Tata spread across platforms (CarWale 441 Hyderabad, Cars24 165, Spinny 61, CarDekho 204, CartTrade 433), manually comparing certifications, warranties, prices, and resale values wastes precious time.
            </p>

            <p>
              <strong>Search all 5,000+ Tata cars simultaneously:</strong> Enter "used Nexon Hyderabad" once and instantly see all CarWale, Spinny, CarDekho listings unified with pricing, mileage, year, variant, and certification level.
            </p>

            <p>
              <strong>Real-time warranty comparison:</strong> See identical 2020 Nexon XZ listed at different prices with different certifications—all in one screen helping identify warranty-to-price value equation.
            </p>

            <p>
              <strong>Depreciation analysis:</strong> Filter 2019–2021 Nexon (40,000–70,000 km sweet spot) showing 30% depreciation versus 2024 model (only 20% minimal savings), identifying optimal purchase window.
            </p>

            <p>
              <strong>Save 5–10 hours:</strong> Manual platform checking reduced to 5 minutes. Money saved: 5–10% price negotiation advantage through market visibility.
            </p>

            <Separator className="my-8" />

            <h2 className="text-2xl font-bold mb-4">Related Guides</h2>
            <ul>
              <li><Link href="/news/best-used-cars-india-2025" className="text-blue-600 hover:text-blue-700">Best Used Cars 2025</Link></li>
              <li><Link href="/news/used-electric-cars-2025" className="text-blue-600 hover:text-blue-700">Used Electric Cars Guide</Link></li>
              <li><Link href="/news/the-verification-economy-india-used-cars" className="text-blue-600 hover:text-blue-700">Verification Economy</Link></li>
            </ul>

            <Separator className="my-8" />

            <Link href="/">
              <Button className="mt-6 px-8 py-3 text-lg">
                Back to Cararth Home
              </Button>
            </Link>
          </article>
        </Card>
      </div>
    </div>
  );
}
