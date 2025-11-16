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
  Car,
  Fuel,
  Settings,
  DollarSign,
  BookOpen
} from "lucide-react";

export default function SwiftHyderabadGuide2025() {
  useEffect(() => {
    document.title = "Used Maruti Swift Hyderabad 2025: 220+ Listings, Prices & AMT vs Manual | Cararth";
    
    const metaTags = {
      description: "Find 220+ used Maruti Swift in Hyderabad from ₹1.3L. VXi ₹4.7L, ZXi ₹5.17L. Compare AMT vs Manual, 2019 best value. Complete guide on Cararth.com",
      keywords: "used Swift Hyderabad, Maruti Swift price, Swift AMT, Swift VXi ZXi, Cars24 Swift, Spinny Swift, Cararth",
      "og:title": "Used Maruti Swift Hyderabad 2025: Complete Buyer's Guide",
      "og:description": "220+ Swift listings from ₹1.3L. VXi, ZXi pricing, AMT vs Manual comparison, best platforms & years",
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
      "headline": "Used Maruti Swift in Hyderabad 2025: Complete Guide with 220+ Listings",
      "description": "Comprehensive guide to buying used Maruti Swift in Hyderabad with 220+ listings, pricing, variant comparison, and AMT vs Manual analysis",
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
        "@id": "https://www.cararth.com/guides/used-swift-hyderabad-2025"
      },
      "articleSection": "Car Guides",
      "keywords": "Swift Hyderabad, used Swift price, AMT vs Manual, VXi ZXi variants",
      "wordCount": 2800
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
            url="https://www.cararth.com/guides/used-swift-hyderabad-2025"
            title="Used Swift Hyderabad 2025: Complete Buyer's Guide"
            description="220+ Swift listings from ₹1.3L. Compare AMT vs Manual, VXi vs ZXi pricing on Cararth.com"
          />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 pt-12 pb-8">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300">
              <Car className="h-3 w-3 mr-1" />
              Maruti Swift
            </Badge>
            <Badge variant="outline" className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300">
              <Clock className="h-3 w-3 mr-1" />
              12 min read
            </Badge>
            <Badge variant="outline" className="bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300">
              220+ Listings
            </Badge>
            <Badge variant="outline" className="bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300">
              <MapPin className="h-3 w-3 mr-1" />
              Hyderabad
            </Badge>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
            Used Maruti Swift in Hyderabad 2025: Complete Guide with 220+ Listings
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Comprehensive pricing, variant comparison (VXi vs ZXi), AMT vs Manual analysis, and platform reviews to find the best Swift deal.
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
              Hyderabad offers <strong>220+ used Maruti Swift</strong> from <strong>₹1.3L-₹8.4L</strong> across Cars24 (71 cars), Spinny (52 cars), CarDekho (107 cars). Popular VXi variant averages <strong>₹4.7L</strong>, ZXi <strong>₹5.17L</strong>. Petrol delivers 18-22 kmpl real-world, AMT adds ₹50K-₹80K premium with 25.75 kmpl efficiency. Best value: 2019 VXi/ZXi at ₹4-5.5L with under 50,000 km. <strong><Link href="/" className="text-blue-600 hover:text-blue-700">Cararth.com</Link></strong> helps you compare all Swift listings across these platforms instantly to find the best deal.
            </p>

            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-l-4 border-blue-600 p-6 my-8">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-blue-600" />
                Key Takeaways
              </h3>
              <ul className="space-y-2 mb-0">
                <li><strong>Market Size:</strong> 220+ Swift available, VXi most popular with 96 listings averaging ₹4.7L</li>
                <li><strong>Platform Options:</strong> Cars24 (71 cars ₹2.38L-₹8.39L), Spinny (52 cars ₹2.54L+), CarWale (221 largest)</li>
                <li><strong>Best Year:</strong> 2019 models offer optimal value at ₹4-5.5L with 45-50% depreciation</li>
                <li><strong>Fuel Type:</strong> 85% buyers choose petrol; diesel discontinued since 2020 due to BS6</li>
                <li><strong>Real Mileage:</strong> Petrol delivers 18-20 kmpl mixed, 22+ kmpl highway; AMT 25.75 kmpl ARAI</li>
                <li><strong>AMT Premium:</strong> ₹50,000-₹80,000 over manual but 25.75 kmpl efficiency vs 24.8 kmpl manual</li>
                <li><strong>Service Costs:</strong> ₹7,000-12,000 annually; 5-year total ₹26,960 for 50,000 km</li>
                <li><strong>Resale Value:</strong> Swift retains 70-75% after 3 years, among top 3 hatchbacks</li>
                <li><strong>Smart Search:</strong> Use <Link href="/" className="text-blue-600 hover:text-blue-700">Cararth.com</Link> to compare all 220+ Hyderabad listings in seconds</li>
              </ul>
            </div>

            <Separator className="my-8" />

            <h2 className="text-3xl font-bold mb-4 flex items-center gap-2">
              <DollarSign className="h-7 w-7 text-blue-600" />
              Used Swift Price in Hyderabad
            </h2>
            
            <p>
              Used Maruti Swift prices in Hyderabad range from <strong>₹1.3 lakh to ₹8.4 lakh</strong> depending on year, variant, mileage, and condition across 220+ available cars. <strong>Cars24</strong> offers 71-73 Swift with detailed year-wise pricing: 2015 models (₹2.51L-₹4.08L), 2019 models (₹3.30L-₹5.23L), 2020 models (₹3.95L-₹5.56L), and 2023 models (₹5.50L-₹8.39L).
            </p>

            <p>
              <strong>Spinny</strong> features 52-53 Spinny Assured cars starting ₹2.54L with 200-point inspection and 1-year warranty. <strong>CarDekho</strong> lists 107 Swift from ₹3.24L-₹7.60L with TrustMark certification. <strong>CarWale</strong> provides the largest inventory of 221 Swift starting ₹1.3L from 61 dealers and individual sellers. <strong>Maruti True Value</strong> offers 56 certified units with industry-leading 376-point inspection.
            </p>

            <h3 className="text-2xl font-semibold mt-6 mb-4">Variant-Wise Pricing Analysis</h3>
            
            <p>
              <strong>VXi mid-spec</strong> averages ₹4.7 lakh with the highest 96 listings, making it the most popular choice. This variant includes automatic climate control, power windows, and central locking—ideal features for value seekers. <strong>ZXi top petrol</strong> averages ₹5.17 lakh with 26 listings, adding alloy wheels, fog lamps, and steering-mounted audio controls.
            </p>

            <p>
              <strong>ZXi Plus premium</strong> averages ₹6.58 lakh with 11 listings, featuring touchscreen infotainment, cruise control, and LED projector headlamps. <strong>LXi base</strong> averages ₹4.14 lakh with 16 listings but offers basic features only. <strong>VDi diesel</strong> averages ₹4.29 lakh with 58 listings, but these discontinued pre-2020 models face resale challenges.
            </p>

            <div className="bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-yellow-600 p-4 my-6">
              <p className="mb-0">
                <strong>💡 Pro Tip:</strong> With 220+ Swift listings spread across Cars24, Spinny, CarDekho, CarWale, Maruti True Value, and local dealers, manually comparing prices wastes hours. <Link href="/" className="text-blue-600 hover:text-blue-700">Cararth.com</Link> lets you search once for "Swift Hyderabad" and instantly see all listings sorted by price.
              </p>
            </div>

            <Separator className="my-8" />

            <h2 className="text-3xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="h-7 w-7 text-blue-600" />
              Best Platforms to Buy Swift in Hyderabad
            </h2>

            <h3 className="text-2xl font-semibold mt-6 mb-4">Online Aggregator Platforms</h3>

            <p>
              <strong>Cars24</strong> runs 4 exclusive hubs across Hyderabad (Kompally, Bachupally, Upperpally, Banjara Hills) with 71-73 verified Swift. The platform conducts 300+ point pre-inspection, offers fixed transparent pricing, provides 7-day return policy, and enables same-day loan disbursal.
            </p>

            <p>
              <strong>Spinny</strong> operates a premium Car Hub at Phoenix Trivium Mall with 52-53 Spinny Assured Swift. Each car undergoes 200-point quality evaluation with 1-year comprehensive warranty—the best in the segment. The unique 5-day money-back guarantee requires no questions asked.
            </p>

            <p>
              <strong>CarDekho</strong> hosts 107 Swift through a network of 78 Hyderabad dealers. TrustMark certification provides 217-point inspection with 6-month warranty on select vehicles. The Rupyy financing arm offers instant eligibility checks with competitive rates.
            </p>

            <h3 className="text-2xl font-semibold mt-6 mb-4">OEM Certified Programs</h3>

            <p>
              <strong>Maruti True Value</strong> provides 56 certified Swift with the industry's most comprehensive 376-point inspection covering mechanical, electrical, exterior, interior, and documentation checks. The 1-year/unlimited km warranty offers the best coverage in the market. Pricing runs 8-10% premium over market but prevents ₹50,000-₹2 lakh unexpected repairs.
            </p>

            <Separator className="my-8" />

            <h2 className="text-3xl font-bold mb-4 flex items-center gap-2">
              <Fuel className="h-7 w-7 text-blue-600" />
              Swift Petrol vs Diesel: Fuel Economy Guide
            </h2>

            <p>
              <strong>Petrol is strongly recommended</strong> for used Swift purchases in Hyderabad as diesel Swift was discontinued since April 2020 due to BS6 emission norms. Only pre-2020 BS4 diesel models remain available, facing resale challenges and potential future restrictions.
            </p>

            <h3 className="text-2xl font-semibold mt-6 mb-4">Real-World Fuel Economy</h3>

            <p>
              Petrol Swift delivers <strong>24.8 kmpl (manual)</strong> and <strong>25.75 kmpl (AMT)</strong> according to ARAI official figures. However, real-world testing reveals 14 kmpl city / 19 kmpl highway for manual and 12.7 kmpl city / 19.1 kmpl highway for AMT. Hyderabad owners consistently report <strong>18-20 kmpl in mixed driving</strong>, with highway-focused usage achieving 22-22.5 kmpl.
            </p>

            <p>
              <strong>Current market reality:</strong> 85% of Hyderabad Swift buyers now choose petrol due to BS6 compliance, better resale prospects, wider availability, improved refinement of the new 3-cylinder engine, and diesel unavailability in 2020+ models.
            </p>

            <Separator className="my-8" />

            <h2 className="text-3xl font-bold mb-4 flex items-center gap-2">
              <Car className="h-7 w-7 text-blue-600" />
              Swift Model Years: 2018 vs 2019 vs 2020
            </h2>

            <p>
              <strong>2019 Swift offers optimal value</strong> in Hyderabad's used car market, balancing affordability, features, reliability, and remaining life. The refined production year resolved early 2018 launch issues through mature quality control. Pricing ranges <strong>₹3.30L-₹5.23L</strong> representing the sweet spot with 45-50% depreciation from ₹8-9L on-road.
            </p>

            <p>
              An excellent example: 2019 ZXi AMT at ₹4.19L provides incredible value compared to the typical ₹5.64L average. Typical mileage sits at 30,000-50,000 km, lower than 2018 models averaging 50,000-70,000 km.
            </p>

            <p>
              <strong>2018 Swift</strong> represents the first year of the third-generation comprehensive redesign. Spinny offers 28 verified 2018 models starting ₹4.34L. Advantages include slightly lower pricing (₹3.5-5L typical) and 6-7 years of proven reliability data.
            </p>

            <p>
              <strong>2020 Swift</strong>, the last year before COVID production impacts, features mature build quality at ₹3.95L-₹5.56L. Advantages include BS6 compliance from start (April 2020 onwards), lowest typical mileage (20,000-40,000 km), and only 4-5 years old with 10-12 years life ahead.
            </p>

            <Separator className="my-8" />

            <h2 className="text-3xl font-bold mb-4 flex items-center gap-2">
              <Settings className="h-7 w-7 text-blue-600" />
              Swift AMT vs Manual Transmission
            </h2>

            <p>
              AMT (automated manual transmission) adds <strong>₹50,000-₹80,000 premium</strong> over manual for the same year and condition. The 5-speed AMT uses electronically controlled clutch actuation with manual gearbox and automatic shifting, offering creep function for traffic convenience and manual mode availability.
            </p>

            <h3 className="text-2xl font-semibold mt-6 mb-4">Real-World Performance</h3>

            <p>
              AMT delivers superior fuel efficiency at <strong>25.75 kmpl</strong> versus manual's 24.8 kmpl according to ARAI. Real-world city driving shows 12.7 kmpl for AMT versus 14 kmpl for manual, while highway performance remains nearly identical at 19.1 kmpl versus 19 kmpl.
            </p>

            <p>
              AMT provides convenience in heavy traffic without clutch pedal fatigue, though 0.5-1 second gear shift lag is noticeable. Manual offers better control and engaging driving but requires more effort in traffic. The trade-off of convenience for 1-2 kmpl loss proves worthwhile for many city commuters.
            </p>

            <h3 className="text-2xl font-semibold mt-6 mb-4">Maintenance Cost Comparison</h3>

            <p>
              AMT adds ₹2,000-5,000 annually due to AMT-specific clutch pack servicing every 40,000-50,000 km. Over 5 years/75,000 km, manual totals <strong>₹32,000</strong> while AMT totals <strong>₹42,000</strong>, a ₹10,000 difference or ₹2,000 per year.
            </p>

            <Separator className="my-8" />

            <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 border-2 border-green-600 rounded-lg p-6 my-8">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                Final Recommendation
              </h3>
              <p className="mb-4">
                For the best value, target a <strong>2019 VXi or ZXi petrol Swift</strong> with under 50,000 km in the <strong>₹4-5.5L range</strong>. Choose AMT if you drive in heavy traffic daily and the ₹50K-80K premium fits your budget. Avoid diesel models due to BS6 restrictions and declining resale value.
              </p>
              <p className="mb-0">
                Use <strong><Link href="/" className="text-blue-600 hover:text-blue-700">Cararth.com</Link></strong> to compare all 220+ Swift listings across Cars24, Spinny, CarDekho, and other platforms instantly, helping you find the perfect Swift at the best price without spending hours on manual searches.
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
