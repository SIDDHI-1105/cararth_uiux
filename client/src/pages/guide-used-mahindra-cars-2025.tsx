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

export default function UsedMahindraGuide2025() {
  useEffect(() => {
    document.title = "Used Mahindra Cars India 2025: Complete Buying Guide, 1,270+ Listings, XUV700, Thar Prices | Cararth";
    
    const metaTags = {
      description: "Complete guide to 1,270+ used Mahindra cars in India 2025. Compare XUV700 (₹10.87L-₹26.33L), Thar (₹5-20L), Scorpio prices across Cars24, CarWale, Spinny. Depreciation, resale value, certifications.",
      keywords: "used mahindra cars india, used xuv700, used thar, used scorpio, mahindra resale value, mahindra depreciation, used mahindra hyderabad",
      "og:title": "Used Mahindra Cars India 2025: Complete Buying Guide with 1,270+ Listings",
      "og:description": "Compare 1,270+ used Mahindra cars across all platforms. XUV700, Thar, Scorpio prices, depreciation data, and warranty comparison.",
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
      "headline": "Used Mahindra Cars India 2025: Complete Buying Guide with 1,270+ Listings",
      "description": "Comprehensive guide to buying used Mahindra cars in India with pricing, depreciation, and warranty details.",
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
        "@id": "https://www.cararth.com/news/used-mahindra-cars-india-2025"
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
            url="https://www.cararth.com/news/used-mahindra-cars-india-2025"
            title="Used Mahindra Cars India 2025: Complete Buying Guide with 1,270+ Listings"
            description="Compare 1,270+ used Mahindra cars, pricing, depreciation, and warranties."
          />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 pt-12 pb-8">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300">
              <TrendingUp className="h-3 w-3 mr-1" />
              Market Guide
            </Badge>
            <Badge variant="outline" className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300">
              <Award className="h-3 w-3 mr-1" />
              1,270+ Listings
            </Badge>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
            Used Mahindra Cars India 2025
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Complete Buying Guide with 1,270+ Listings, XUV700, Thar, Scorpio Prices & Resale Value
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
            <div className="bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-600 p-6 my-8">
              <p className="text-lg font-semibold mb-2">Quick Answer</p>
              <p>Used Mahindra cars range ₹0.78L–₹26.33L across 1,270 India listings. Cars24 offers 1,270 cars (304 XUV500, 75 XUV700), CarWale lists 441 Hyderabad (Thar ₹6L+). XUV700 shows slowest depreciation (25–30% over 5 years), Thar retains 30–40% value. Cararth helps compare all 1,270+ Mahindra across platforms instantly to find best value, warranty, and certification.</p>
            </div>

            <Separator className="my-8" />

            <h2 className="text-3xl font-bold mb-4">Key Takeaways</h2>
            <ul>
              <li><strong>Market Size:</strong> 1,270+ used Mahindra nationwide (Cars24), 441 Hyderabad (CarWale)</li>
              <li><strong>Pricing:</strong> ₹0.78L–₹26.33L spanning entry to premium</li>
              <li><strong>Top Models:</strong> XUV500 (304 units), XUV700 (75 units), Thar (1,118 nationwide), Scorpio (124 units)</li>
              <li><strong>XUV700 Premium:</strong> Slowest depreciation in segment (25–30% over 5 years)</li>
              <li><strong>Thar Lifestyle:</strong> 30–40% retention, strong off-road demand</li>
              <li><strong>XUV500 Discontinued:</strong> 20–25% depreciation, affordability bargains</li>
              <li><strong>Scorpio Workhorse:</strong> Excellent 35–45% resale retention</li>
              <li><strong>Sweet Spot:</strong> 2019–2022 models ₹9–14L offering modern features, proven 3–6 year reliability</li>
            </ul>

            <Separator className="my-8" />

            <h2 className="text-3xl font-bold mb-4 flex items-center gap-2">
              <Award className="h-7 w-7 text-blue-600" />
              Best Used Mahindra Models: Complete Product Guide
            </h2>

            <h3 className="text-2xl font-semibold mb-3 mt-6">Mahindra XUV700 – Premium Leader</h3>
            <p>
              Newest premium SUV (75 Cars24 units, 42 CarWale Hyderabad ₹10.33L+) featuring 2.0L diesel (165 bhp) or 1.5L petrol turbo (200 bhp), spacious 5-seater interiors, ADAS safety tech, panoramic sunroof, premium touchscreen, advanced connectivity. Hyderabad pricing: ₹15.50L–₹18L typical. Slowest depreciation in segment—diesel-manual variant best resale.
            </p>

            <h3 className="text-2xl font-semibold mb-3 mt-6">Mahindra Thar – Lifestyle 4×4</h3>
            <p>
              Adventure SUV (1,118 nationwide, 75 Hyderabad) delivering full-time 4×4 capability, 2.0L mHawk diesel (152 bhp/320 Nm), ladder-frame chassis. Pricing: ₹5L–₹20L+ (Hyderabad ₹13.64L average LX variant). Exceptional 30–40% resale retention over 5 years due to lifestyle appeal and dedicated enthusiast buyer base.
            </p>

            <h3 className="text-2xl font-semibold mb-3 mt-6">Mahindra XUV500 – Discontinued Bargains</h3>
            <p>
              Discontinued (2023) but valuable—304 Cars24 units (largest availability), pricing ₹1.90L–₹15L. Depreciation 20–25% over 5 years (80–85% retention excellent). Valuation: 2014–2016 ₹5–7.5L, 2017–2019 ₹7.5–10L, 2020+ ₹10–12L. Discontinued advantage: bargains available with established enthusiast demand.
            </p>

            <h3 className="text-2xl font-semibold mb-3 mt-6">Mahindra Scorpio – Workhorse Reliable</h3>
            <p>
              Established workhorse (124 Cars24 units, multiple Hyderabad availability), ₹2.07L–₹16.55L. 2.2L mHawk diesel (150 bhp), strong torque delivery. Exceptional value retention: 35–45% after 5 years. Strong resale due to fleet buyer preference, commercial reputation, and reliability.
            </p>

            <Separator className="my-8" />

            <h2 className="text-3xl font-bold mb-4 flex items-center gap-2">
              <DollarSign className="h-7 w-7 text-green-600" />
              Depreciation & Resale Reality
            </h2>

            <p>
              <strong>Mahindra depreciation patterns vary by segment:</strong> XUV700 (25–30% over 5 years—slowest, premium positioning), Thar (30–40% retention—lifestyle appeal), XUV500 (20–25% depreciation—discontinued bargains), Scorpio (35–45% retention—excellent, commercial demand).
            </p>

            <p>
              <strong>Factors affecting resale:</strong> Service records (continuous authorized Mahindra service mandatory), first-owner status (10–15% premium), mileage (under 10,000 km/year ideal), accident-free history (even minor accidents reduce 20%+), warranty balance (remaining 6–12 months adds significant value).
            </p>

            <Separator className="my-8" />

            <h2 className="text-3xl font-bold mb-4">₹5–10L Sweet Spot (RECOMMENDED)</h2>

            <p>
              <strong>Thar 2020–2022</strong> (₹9–13L, modern features, proven reliability, strong 30–40% resale). <strong>Scorpio 2018–2021</strong> (₹8–11L, established reputation, excellent resale). <strong>XUV500 2018–2020</strong> (₹9–12L, discontinued bargain with modern features). Certified purchase justified here (₹50K–₹1L peace of mind).
            </p>

            <Separator className="my-8" />

            <h2 className="text-3xl font-bold mb-4 flex items-center gap-2">
              <AlertCircle className="h-7 w-7 text-red-600" />
              Warranty & Certification Options
            </h2>

            <p>
              <strong>Cars24 Certification</strong> (300+ point inspection)—most comprehensive, instant financing, RC transfer assistance, fixed transparent pricing.
            </p>

            <p>
              <strong>CarWale abSure Certification</strong> (167-point)—7-day money-back guarantee, 15,000 km comprehensive warranty covering engine, transmission, electrical, suspension, AC.
            </p>

            <p>
              <strong>Spinny Assured Certification</strong> (200-point)—1-year warranty (industry-best), 5-day money-back, free home test drive, doorstep delivery.
            </p>

            <p>
              <strong>CardEkho TrustMark Certification</strong> (217-point)—6-month warranty, integrated Rupyy financing, 78 verified Hyderabad dealers.
            </p>

            <p>
              <strong>Mahindra First Choice OEM-Certification</strong>—54 Hyderabad units starting ₹95,000, manufacturer-backed, guaranteed buyback program, 5-day return assurance.
            </p>

            <Separator className="my-8" />

            <h2 className="text-3xl font-bold mb-4">Best Year to Buy: 2019–2022</h2>

            <p>
              Sweet spot price/age: Thar LX ₹13.64L, Scorpio M ₹9–11L, XUV500 W10 ₹9–12L. Modern features (touchscreen, connectivity), 3–6 year age (passed infant mortality), 8–10 years remaining useful life, potential remaining manufacturer warranty (1–2 years on 2021–2022 models), proven reliability.
            </p>

            <Separator className="my-8" />

            <h2 className="text-3xl font-bold mb-4">Why Use Cararth for Mahindra Shopping?</h2>

            <p>
              With 1,270+ Mahindra spread across platforms (Cars24 nationwide, CarWale 441 Hyderabad, CardEkho 138, Spinny 47, Mahindra First Choice 54), manually comparing prices, warranty terms, and certification levels wastes 8–12 hours.
            </p>

            <p>
              <strong>Search all 1,270+ instantly:</strong> Enter "used Thar Hyderabad" and see all platform listings unified with pricing, mileage, variant, warranty duration, and certification level.
            </p>

            <p>
              <strong>Real-time warranty comparison:</strong> See identical 2021 Thar LX at different prices with different warranty terms—all in one screen.
            </p>

            <p>
              <strong>Depreciation analysis:</strong> Filter 2019–2022 Thar showing 30–40% retention versus 2024 model with marginal savings.
            </p>

            <Separator className="my-8" />

            <h2 className="text-2xl font-bold mb-4">Related Guides</h2>
            <ul>
              <li><Link href="/news/best-used-cars-india-2025" className="text-blue-600 hover:text-blue-700">Best Used Cars 2025</Link></li>
              <li><Link href="/news/used-tata-cars-india-2025" className="text-blue-600 hover:text-blue-700">Used Tata Cars Guide</Link></li>
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
