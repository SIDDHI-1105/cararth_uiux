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
  CheckCircle2,
  Building2,
  Shield,
  AlertCircle,
  BookOpen,
  Star
} from "lucide-react";

export default function DealersHyderabadGuide2025() {
  useEffect(() => {
    document.title = "Best Used Car Dealers in Hyderabad 2025: Top 15 Showrooms & Platform Comparison | Cararth";
    
    const metaTags = {
      description: "Best used car dealers in Hyderabad 2025: Cars24, Spinny, Maruti True Value, top locations, inspection standards, warranties. Compare 6,500+ cars on Cararth.com",
      keywords: "used car dealers Hyderabad, Cars24, Spinny, Maruti True Value, Madhapur dealers, Jubilee Hills, Cararth",
      "og:title": "Best Used Car Dealers in Hyderabad 2025 - Complete Guide",
      "og:description": "Top 15 showrooms, platform comparison, locations & buying guide for Hyderabad used car dealers",
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
      "headline": "Best Used Car Dealers in Hyderabad 2025: Top 15 Showrooms, Platform Comparison & Complete Buying Guide",
      "description": "Comprehensive guide to Hyderabad's best used car dealers with platform comparison, locations, and buying tips",
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
        "@id": "https://www.cararth.com/news/used-car-dealers-hyderabad-2025"
      },
      "articleSection": "Car Guides",
      "keywords": "Hyderabad dealers, Cars24, Spinny, used car showrooms",
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
            url="https://www.cararth.com/news/used-car-dealers-hyderabad-2025"
            title="Best Used Car Dealers in Hyderabad 2025"
            description="Top 15 showrooms, platform comparison & buying guide on Cararth.com"
          />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 pt-12 pb-8">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300">
              <MapPin className="h-3 w-3 mr-1" />
              Hyderabad
            </Badge>
            <Badge variant="outline" className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300">
              <Clock className="h-3 w-3 mr-1" />
              14 min read
            </Badge>
            <Badge variant="outline" className="bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300">
              Dealer Guide
            </Badge>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
            Best Used Car Dealers in Hyderabad 2025
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Top 15 showrooms, platform comparison, locations & complete buying guide with inspection standards and warranties.
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
              Hyderabad's best used car dealers include <strong>Cars24 (4 hubs, 1,681 cars)</strong>, <strong>Spinny (Phoenix Trivium Mall, 1,075+ cars)</strong>, <strong>Maruti True Value (361 certified)</strong>, Auto Engineers Madhapur (58+ cars), and Tristar Motor Group (75+ cars). Platforms offer warranties, inspections, and financing with transparent pricing across Madhapur and Jubilee Hills locations.
            </p>

            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-l-4 border-blue-600 p-6 my-8">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-blue-600" />
                Key Takeaways
              </h3>
              <ul className="space-y-2 mb-0">
                <li><strong>Platform Leaders:</strong> Cars24 (4 hubs, 1,681 cars, 30-day return), Spinny (1,075+ cars, 1-year warranty)</li>
                <li><strong>Dealer Networks:</strong> CarWale (61+ dealers, 3,990+ cars), CarDekho (78 dealers, 1,923+ cars)</li>
                <li><strong>OEM Programs:</strong> Maruti True Value (361 certified, 376-point inspection), Toyota U Trust (2-year warranty)</li>
                <li><strong>Top Locations:</strong> Madhapur (highest concentration), Jubilee Hills (luxury), 100 Feet Road (dealer cluster)</li>
                <li><strong>Warranties:</strong> 6 months-2 years coverage, 5-30 day return policies across platforms</li>
                <li><strong>Customer Ratings:</strong> Spinny 4.5+ stars, Cars24 3.9/5 from 639 reviews</li>
              </ul>
            </div>

            <Separator className="my-8" />

            <h2 className="text-3xl font-bold mb-4 flex items-center gap-2">
              <Building2 className="h-7 w-7 text-blue-600" />
              Top Online Platform Dealers in Hyderabad
            </h2>
            
            <h3 className="text-2xl font-semibold mb-3">Cars24</h3>
            <p>
              Operates <strong>4 exclusive hubs</strong> across Hyderabad at Attapur (main hub with 45+ cars), Kompally, Bachupally, and Upperpally Old MLA Quarters, offering <strong>1,681 second-hand cars</strong> with the industry's most comprehensive <strong>300+ point pre-inspection</strong>.
            </p>
            <ul className="space-y-2">
              <li>Fixed transparent pricing</li>
              <li>Up to 30-day return policy (longest in industry)</li>
              <li>Instant online loan eligibility checks</li>
              <li>Same-day financing approval with partner NBFCs</li>
              <li>639 Justdial reviews averaging 3.9/5</li>
            </ul>

            <h3 className="text-2xl font-semibold mb-3 mt-6">Spinny</h3>
            <p>
              Features a premium Car Hub at <strong>Phoenix Trivium Mall Madhapur</strong> with <strong>1,075+ Spinny Assured cars</strong>, each undergoing <strong>200-point quality inspection</strong> with the industry-best <strong>1-year comprehensive warranty</strong>.
            </p>
            <ul className="space-y-2">
              <li>5-day money-back guarantee (no questions asked)</li>
              <li>Free home test drive and doorstep delivery</li>
              <li>Customer reviews consistently rate 4.5+ stars</li>
              <li>Premium service experience at Phoenix Mall location</li>
            </ul>

            <h3 className="text-2xl font-semibold mb-3 mt-6">CarWale Network</h3>
            <p>
              Aggregates the largest network with <strong>61+ dealers and 3,990+ cars</strong> across Hyderabad, offering <strong>abSure 167-point certification</strong>, 15,000 km comprehensive warranty, and 7-day money-back guarantee.
            </p>
            <ul className="space-y-2">
              <li>Auto Engineers Madhapur (58+ cars, 12 years business)</li>
              <li>Tristar Motor Group (75+ cars)</li>
              <li>Cars Now Banjara Hills (88+ cars)</li>
              <li>Excellent for comparison shopping across dealers</li>
            </ul>

            <h3 className="text-2xl font-semibold mb-3 mt-6">CarDekho</h3>
            <p>
              Lists <strong>78 verified dealers</strong> across Hyderabad with <strong>1,923+ used cars</strong>, featuring <strong>TrustMark 217-point inspection</strong> and 6-month warranty on certified units.
            </p>
            <ul className="space-y-2">
              <li>Sri Car Z Gandhi Bhawan (92 cars, largest dealer)</li>
              <li>Om Cars Uppal (48 cars)</li>
              <li>AKSHAYA VINTAGE (44 cars)</li>
              <li>Integrated Rupyy financing for one-stop solutions</li>
            </ul>

            <Separator className="my-8" />

            <h2 className="text-3xl font-bold mb-4 flex items-center gap-2">
              <MapPin className="h-7 w-7 text-blue-600" />
              Best Used Car Dealer Locations in Hyderabad
            </h2>
            
            <h3 className="text-2xl font-semibold mb-3">Madhapur & Hi-Tech City</h3>
            <p>
              Hosts Hyderabad's <strong>highest dealer concentration</strong> serving IT corridor professionals from Gachibowli and Kondapur.
            </p>
            <ul className="space-y-2">
              <li><strong>Auto Engineers:</strong> 58+ cars, 12 years business, CarWale abSure certified</li>
              <li><strong>Tristar Motor Group:</strong> 75+ cars, largest Madhapur inventory</li>
              <li><strong>Car Cart:</strong> 43+ luxury cars</li>
              <li><strong>100 Feet Road Madhapur:</strong> Multiple dealer showrooms with exchange car deals</li>
            </ul>

            <h3 className="text-2xl font-semibold mb-3 mt-6">Jubilee Hills & Banjara Hills</h3>
            <p>
              Hyderabad's <strong>luxury car hub</strong> with premium showrooms focusing on high-end vehicles.
            </p>
            <ul className="space-y-2">
              <li><strong>Speeds Pre-Owned Cars:</strong> 32+ less-driven quality vehicles, 4.8-star rating</li>
              <li><strong>Ingens By Auto Arena:</strong> 31+ premium cars</li>
              <li><strong>Budget Cars Premium:</strong> Road 36 location</li>
              <li>Emphasis on luxury SUVs and premium sedans</li>
            </ul>

            <h3 className="text-2xl font-semibold mb-3 mt-6">Kukatpally & LB Nagar</h3>
            <p>
              Value-focused areas with <strong>5-10% lower prices</strong> than premium Madhapur/Jubilee Hills areas.
            </p>
            <ul className="space-y-2">
              <li><strong>Om Cars Uppal:</strong> 54+ cars, 20 years business experience</li>
              <li><strong>Wings Cars LB Nagar:</strong> 44+ cars, southern suburbs access</li>
              <li><strong>Varun Cars & ANAVI ENTERPRISES:</strong> 50+ cars each, ₹3-8 lakh segment</li>
            </ul>

            <Separator className="my-8" />

            <h2 className="text-3xl font-bold mb-4 flex items-center gap-2">
              <Shield className="h-7 w-7 text-blue-600" />
              OEM Certified Pre-Owned Programs
            </h2>
            
            <h3 className="text-2xl font-semibold mb-3">Maruti Suzuki True Value</h3>
            <p>
              Leads with <strong>361 certified cars</strong> in Hyderabad through India's oldest pre-owned program (established 2001), now operating 606 outlets across 305 cities nationwide.
            </p>
            <ul className="space-y-2">
              <li><strong>376-point inspection</strong> (industry-leading)</li>
              <li>Manufacturer warranty backing</li>
              <li>Assured buyback program</li>
              <li>3 free services included</li>
              <li>Complete RC transfer assistance</li>
            </ul>

            <h3 className="text-2xl font-semibold mb-3 mt-6">Toyota U Trust</h3>
            <p>
              Operated by Harsha Toyota (Kothaguda Kondapur) with <strong>203-point quality inspection</strong> and up to <strong>2 years/30,000 km warranty</strong> (longest coverage in industry).
            </p>
            <ul className="space-y-2">
              <li>3 free labor services</li>
              <li>Stringent quality filters</li>
              <li>8-10% premium for exceptional quality assurance</li>
              <li>Best for long-term ownership planning</li>
            </ul>

            <h3 className="text-2xl font-semibold mb-3 mt-6">Hyundai Promise</h3>
            <p>
              Available through Kun United Hyundai Shaikpet (25+ cars, 25 years business, 4.0-star rating).
            </p>
            <ul className="space-y-2">
              <li>Manufacturer-backed certification</li>
              <li>Comprehensive multi-point inspection</li>
              <li>Warranty coverage and financing programs</li>
              <li>5-8% premium for manufacturer assurance</li>
            </ul>

            <Separator className="my-8" />

            <h2 className="text-3xl font-bold mb-4 flex items-center gap-2">
              <AlertCircle className="h-7 w-7 text-blue-600" />
              Choosing Best Used Car Dealer: Essential Checklist
            </h2>
            
            <h3 className="text-2xl font-semibold mb-3">Business Verification</h3>
            <ul className="space-y-2">
              <li><strong>Longevity:</strong> Look for 10-20+ years experience (Auto Engineers 12 years, Om Cars 20 years, Kun United 25 years)</li>
              <li><strong>Certifications:</strong> Verify CarWale abSure (167-point), CarDekho TrustMark (217-point), Spinny Assured (200-point), or OEM programs</li>
              <li><strong>Physical Presence:</strong> Established Madhapur/Jubilee Hills locations indicate legitimate operations</li>
            </ul>

            <h3 className="text-2xl font-semibold mb-3 mt-6">Review Analysis</h3>
            <ul className="space-y-2">
              <li>Cross-reference Justdial ratings, Google reviews, Reddit experiences</li>
              <li>Spinny: 4.5+ stars with specific customer testimonials</li>
              <li>Cars24: 3.9/5 average with 639 detailed reviews</li>
              <li>Look for consistent patterns across platforms</li>
            </ul>

            <h3 className="text-2xl font-semibold mb-3 mt-6">Documentation Essentials</h3>
            <ul className="space-y-2">
              <li>Registration Certificate (original)</li>
              <li>Insurance papers (current)</li>
              <li>Service history from authorized centers</li>
              <li>Valid PUC certificate</li>
              <li>Form 35 transfer documents</li>
              <li>NOC if financed</li>
            </ul>

            <h3 className="text-2xl font-semibold mb-3 mt-6">Inspection Requirements</h3>
            <ul className="space-y-2">
              <li>Bring trusted mechanic for independent inspection (₹2,000-5,000 investment)</li>
              <li>Test drive minimum 30-45 minutes</li>
              <li>Check for accident damage via paint thickness meter</li>
              <li>Verify VIN/chassis numbers match RC</li>
              <li>Inspect for flood damage</li>
            </ul>

            <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-600 p-4 my-6">
              <h4 className="font-bold mb-2 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Red Flags to Avoid
              </h4>
              <ul className="space-y-1 text-sm mb-0">
                <li>Pressure tactics rushing purchase decisions</li>
                <li>Unwillingness to allow independent mechanic inspection</li>
                <li>Missing or incomplete documentation</li>
                <li>Price significantly below market (₹1-2L under typical pricing)</li>
                <li>Reluctance to provide vehicle history reports</li>
                <li>Unregistered business locations</li>
              </ul>
            </div>

            <Separator className="my-8" />

            <h2 className="text-3xl font-bold mb-4 flex items-center gap-2">
              <Star className="h-7 w-7 text-blue-600" />
              Why Use Cararth.com for Dealer Search in Hyderabad?
            </h2>
            
            <p>
              With <strong>6,500+ used cars</strong> spread across Cars24 (4 hubs, 1,681 cars), Spinny (Phoenix Trivium Mall, 1,075+ cars), CarWale (61+ dealers, 3,990+ cars), CarDekho (78 dealers, 1,923+ cars), and dozens of independent showrooms, manually comparing options wastes 15-20 hours.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">1. Search All 6,500+ Hyderabad Cars Simultaneously</h3>
            <p>
              Enter "used cars Hyderabad" once and Cararth instantly searches across all platforms, showing every available car in one unified view.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">2. Real-Time Dealer & Price Comparison</h3>
            <p>
              See the same 2019 Swift listed at ₹5.2L at Auto Engineers, ₹4.9L on Cars24, ₹5.5L at Tristar, ₹5L on Spinny—all in one screen. Typical <strong>8-15% price variation</strong> across dealers means <strong>₹40,000-₹75,000 savings</strong> on a ₹5L purchase.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">3. Advanced Filters for Precise Discovery</h3>
            <p>
              Filter by location (Madhapur for IT professionals, Jubilee Hills for luxury, LB Nagar for value), certification (True Value, U Trust, Spinny Assured), price range, and more to find the perfect dealer match.
            </p>

            <Separator className="my-8" />

            <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 border-2 border-green-600 rounded-lg p-6 my-8">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                Final Recommendation
              </h3>
              <p className="mb-4">
                For <strong>platform reliability and warranties</strong>, choose Cars24 (30-day return) or Spinny (1-year warranty, 4.5+ stars). For <strong>dealer variety</strong>, use CarWale (61+ dealers) or CarDekho (78 dealers). For <strong>manufacturer backing</strong>, opt for Maruti True Value (376-point inspection) or Toyota U Trust (2-year warranty).
              </p>
              <p className="mb-0">
                Use <strong><Link href="/" className="text-blue-600 hover:text-blue-700">Cararth.com</Link></strong> to compare all 6,500+ Hyderabad listings instantly, saving 15-20 hours and potentially ₹40,000-₹75,000 by identifying the best deals across all platforms.
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
