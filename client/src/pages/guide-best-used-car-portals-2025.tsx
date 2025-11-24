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
  Shield,
  Award,
  DollarSign,
  Star,
  BarChart3,
  BookOpen
} from "lucide-react";

export default function BestUsedCarPortalsGuide2025() {
  useEffect(() => {
    document.title = "Best Used Car Portals India 2025: Cars24 vs Spinny vs CarWale vs CarDekho Comparison | Cararth";
    
    const metaTags = {
      description: "Complete comparison of India's top used car platforms: Cars24 (₹6,917 Cr, 300+ inspection), Spinny (1-year warranty), CarWale (4.6★), CarDekho, OLX. Compare ratings, warranties & features on Cararth.com",
      keywords: "used car portal India, Cars24 vs Spinny, CarWale comparison, CarDekho review, best used car website, warranty comparison, inspection standards, Cararth",
      "og:title": "Best Used Car Portals India 2025: Complete Comparison of Cars24, Spinny, CarWale, CarDekho & OLX",
      "og:description": "Compare India's top 5 used car platforms by revenue, ratings, warranties, inspection standards. Cars24, Spinny, CarWale, CarDekho, OLX detailed analysis.",
      "og:type": "article",
      "article:published_time": "2025-11-24T00:00:00Z",
      "article:author": "Cararth Team",
      "article:section": "Platform Guides"
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
      "headline": "Best Used Car Portals India 2025: Complete Comparison of Cars24, Spinny, CarWale, CarDekho, OLX with Ratings, Warranties & Features",
      "description": "Comprehensive comparison of India's top used car platforms. Cars24 ₹6,917 Cr revenue, Spinny 1-year warranty, CarWale 4.6★, inspection standards 167-300 points.",
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
      "datePublished": "2025-11-24",
      "dateModified": "2025-11-24",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://www.cararth.com/news/best-used-car-portals-india-2025"
      },
      "articleSection": "Platform Guides",
      "keywords": "Cars24, Spinny, CarWale, CarDekho, OLX, used car portal, warranty, inspection",
      "wordCount": 1850
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
            url="https://www.cararth.com/news/best-used-car-portals-india-2025"
            title="Best Used Car Portals India 2025: Complete Platform Comparison"
            description="Compare Cars24, Spinny, CarWale, CarDekho, OLX - ratings, warranties, inspection standards & features on Cararth.com"
          />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 pt-12 pb-8">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300">
              <BarChart3 className="h-3 w-3 mr-1" />
              Platform Comparison 2025
            </Badge>
            <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300">
              <Clock className="h-3 w-3 mr-1" />
              10 min read
            </Badge>
            <Badge variant="outline" className="bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300">
              1,000+ Dealers
            </Badge>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight">
            Best Used Car Portals in India 2025: Complete Comparison of Cars24, Spinny, CarWale, CarDekho, OLX
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-400">
            Compare India's top 5 used car platforms by revenue, ratings, warranties, inspection standards, and features to find the perfect match for your next purchase.
          </p>

          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span>By Cararth Team</span>
            <span>•</span>
            <span>November 24, 2025</span>
            <span>•</span>
            <span>Updated Nov 24, 2025</span>
          </div>

          <Separator className="my-6" />
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
          <Card className="glass-contrast border-2 border-orange-500/30 dark:border-blue-500/30 p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-orange-600 dark:text-blue-400" />
              Quick Answer
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Best used car platforms: <strong>Cars24</strong> (₹6,917 Cr revenue, 300+ inspection, 7-day return, 4.3★ rating) market leader; <strong>Spinny</strong> (₹3,261 Cr GMV, 1-year warranty, 5-day return, 4.1★); <strong>CarWale</strong> (4.6★, abSure 167-point); <strong>CarDekho</strong> (4.6★, AI-financing); <strong>OLX</strong> (affordability). <strong><a href="https://www.cararth.com" className="text-orange-600 dark:text-blue-400 hover:underline">Cararth.com</a></strong> helps compare all platforms instantly to find best warranty, certification, pricing across all 1,000+ dealer options.
            </p>
          </Card>

          <section>
            <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="h-7 w-7 text-orange-600 dark:text-blue-400" />
              Key Takeaways
            </h2>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                <span><strong>Market Leader:</strong> Cars24 dominates with ₹6,917 Cr FY24 revenue, 300+ point inspection, 7-day return (longest), 3-year warranty, 10M downloads</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                <span><strong>Growth Star:</strong> Spinny ₹3,261 Cr GMV (30X growth), 1-year warranty (best duration), 5-day money-back (fastest), premium quality focus, 1M+ downloads</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                <span><strong>Regional Champion:</strong> CarWale 4.6 stars (highest rating), 200+ locations, abSure 167-point certification, 7-day money-back, 5M+ downloads</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                <span><strong>Finance Integration:</strong> CarDekho 4.6 stars, ₹2,074 Cr (54% growth), TrustMark 217-point, integrated Rupyy financing, 15% used-car market share, 10M+ downloads</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                <span><strong>Budget Option:</strong> OLX classifieds marketplace, seller-direct negotiation, affordability leader, maximum flexibility</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                <span><strong>Inspection Standards:</strong> Cars24 300+ (comprehensive physical) vs Spinny 200-point (curated quality) vs CarWale 167-point (balanced) vs CarDekho 217-point (AI-driven)</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                <span><strong>Warranty Comparison:</strong> Spinny 1-year best duration, Cars24 3-year/45K km best total coverage, CarWale 15,000 km conservative, Cars24 includes RSA+servicing</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                <span><strong>Return Policies:</strong> Spinny 5-day fastest, Cars24 7-day longest, CarWale 7-day, OLX marketplace variable by seller</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                <span><strong>Smart Search:</strong> Use <strong><a href="https://www.cararth.com" className="text-orange-600 dark:text-blue-400 hover:underline">Cararth.com</a></strong> to compare all platform certifications, warranty balances, and pricing instantly</span>
              </li>
            </ul>
          </section>

          <Separator className="my-8" />

          <section>
            <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <Award className="h-7 w-7 text-orange-600 dark:text-blue-400" />
              Used Car Portal Market Leadership: India's Top Platforms by Revenue, Market Share & User Ratings
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              India's used car market spans 5+ million vehicles annually with digital penetration accelerating from 5-15% (2020) to 25-30% (2025), creating explosive growth in certified marketplace platforms.
            </p>
            
            <h3 className="text-2xl font-semibold mt-6 mb-3 text-gray-900 dark:text-white">Cars24: Market Leader</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              <strong>Cars24</strong> dominates as undisputed market leader with ₹6,917 Cr FY24 revenue, $3.3B valuation, 10M+ app downloads, 4.3-star Google rating (192K reviews), capturing largest market mind-share through comprehensive platform model. Operating unified marketplace accommodating 50,000+ vehicles across pre-inspected inventory, verified dealers (2,000+ network), and D2C sellers, Cars24 employs industry-leading 300+ point AI-backed inspection powered by 10L+ transaction dataset enabling fair market pricing algorithm that buyers trust for transparency.
            </p>

            <h3 className="text-2xl font-semibold mt-6 mb-3 text-gray-900 dark:text-white">Spinny: Growth Star</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              <strong>Spinny</strong> emerges as growth star with ₹3,261 Cr GMV FY24 (30X growth trajectory), $2.5B+ valuation, 1M+ downloads representing quality-focused premium segment. Growth star specializes in curated inventory model through D2C-only positioning (5,000-8,000 vehicles vs Cars24's 50,000+), 200-point certified inspection prioritizing quality over quantity, industry-best 1-year comprehensive warranty offering 12-month peace of mind, fastest 5-day money-back guarantee unconditional reversal, charging 5-8% market premium for quality assurance and convenience justifying premium positioning among quality-conscious first-time buyers.
            </p>

            <h3 className="text-2xl font-semibold mt-6 mb-3 text-gray-900 dark:text-white">CarWale: Regional Champion</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              <strong>CarWale</strong> provides highest user satisfaction with 4.6-star rating (highest platform rating India), 5M+ downloads, 200+ regional locations demonstrating regional network leadership. CarTrade-owned platform emphasizes regional presence aggregation with 441 Hyderabad demonstrating strength, abSure 167-point standardized certification across all locations ensuring consistency, 7-day money-back guarantee for buyer confidence, 15,000 km comprehensive warranty covering critical components.
            </p>

            <h3 className="text-2xl font-semibold mt-6 mb-3 text-gray-900 dark:text-white">CarDekho: Finance Integration Leader</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              <strong>CarDekho</strong> integrates used car marketplace with Rupyy fintech lending and InsuranceDekho insurance services, ₹2,074 Cr FY24 revenue (54% growth YoY), 10M+ downloads, 4.6-star rating (209K reviews), unicorn valuation (1B+) reflecting investor confidence. TrustMark 217-point AI-driven inspection combined with seamless Rupyy financing underwriting captures 15% used-car finance market share, positioning CarDekho as one-stop solution for buyers needing integrated financial support.
            </p>

            <h3 className="text-2xl font-semibold mt-6 mb-3 text-gray-900 dark:text-white">OLX: Budget & Flexibility Champion</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              <strong>OLX</strong> maintains pure marketplace classifieds model emphasizing seller-direct negotiation, maximum affordability through commission-light structure, seller identity verification for safety, 4.6+ platform rating.
            </p>

            <Card className="glass-contrast border-l-4 border-orange-500 dark:border-blue-500 p-6 mt-6">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                <strong>With 1,000+ dealer options spread across Cars24 (50,000+ inventory), Spinny (5,000-8,000 curated), CarWale (200+ locations), CarDekho (integrated platform), OLX (classifieds), manually comparing platform certifications (300+ vs 200-point vs 167-point), warranty balances (1-year vs 3-year vs 15,000 km), return policies (5-day vs 7-day), and pricing across platforms wastes 8-12 hours—this is exactly what <a href="https://www.cararth.com" className="text-orange-600 dark:text-blue-400 hover:underline font-semibold">Cararth.com</a> solves instantly.</strong>
              </p>
            </Card>
          </section>

          <Separator className="my-8" />

          <section>
            <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <Shield className="h-7 w-7 text-orange-600 dark:text-blue-400" />
              Cars24 vs Spinny vs CarWale: Feature Comparison, Inspection Standards & Warranty Coverage
            </h2>

            <h3 className="text-2xl font-semibold mt-6 mb-3 text-gray-900 dark:text-white">Cars24: Comprehensive Protection</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              300+ point AI-backed physical evaluation by certified field engineers examining engine (smoke, noise, leaks, compression), transmission (smoothness, fluid condition), electrical (battery health, alternator output), suspension (shock absorbers, control arms), brakes (pad thickness, rotor condition), AC/heating, exterior/interior condition, and safety systems. Features include:
            </p>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300 ml-6">
              <li>• Transparent pricing algorithm (10L+ transaction dataset)</li>
              <li>• 7-day return policy (longest available)</li>
              <li>• 3-year warranty up to 45,000 km (largest coverage)</li>
              <li>• RSA 24/7 roadside assistance + annual servicing</li>
              <li>• Assured buyback program</li>
            </ul>

            <h3 className="text-2xl font-semibold mt-6 mb-3 text-gray-900 dark:text-white">Spinny: Premium Quality Focus</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              200-point certified inspection covering mechanical reliability, electrical functionality, safety systems, aesthetic condition, reliability assessment. Features include:
            </p>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300 ml-6">
              <li>• Fixed transparent pricing (no negotiation required)</li>
              <li>• 1-year comprehensive warranty (industry-best duration)</li>
              <li>• 5-day money-back guarantee (fastest reversal)</li>
              <li>• Spinny360 detailed visualization</li>
              <li>• Free doorstep delivery</li>
            </ul>

            <h3 className="text-2xl font-semibold mt-6 mb-3 text-gray-900 dark:text-white">CarWale: Regional Network Advantage</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              abSure 167-point standardized inspection across 200+ locations. Features include:
            </p>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300 ml-6">
              <li>• 7-day money-back guarantee</li>
              <li>• 15,000 km comprehensive warranty</li>
              <li>• Dealer-based pricing (negotiation room)</li>
              <li>• Offline showroom visits possible</li>
              <li>• 4.6-star highest rating</li>
            </ul>

            <Card className="glass-contrast border-l-4 border-green-500 dark:border-green-400 p-6 mt-6">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                <strong>Warranty Strategy:</strong> Spinny 1-year best for newer vehicles (<40,000 km), Cars24 3-year/45,000 km best for high-usage buyers (15,000+ km/year), CarWale 15,000 km conservative for shorter ownership (2-3 years). Cars24 includes RSA + servicing, Spinny focuses on duration, CarWale emphasizes dealer-backed assurance.
              </p>
            </Card>
          </section>

          <Separator className="my-8" />

          <section>
            <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <Star className="h-7 w-7 text-orange-600 dark:text-blue-400" />
              Platform Ratings, Return Policies & Warranty Protection Comparison
            </h2>

            <h3 className="text-2xl font-semibold mt-6 mb-3 text-gray-900 dark:text-white">Return Policy Hierarchy</h3>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-orange-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                <span><strong>Spinny:</strong> 5-day money-back (fastest reversal, unconditional, full refund, doorstep pickup)</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-orange-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                <span><strong>Cars24:</strong> 7-day return policy (longest timeline, 40% advantage vs Spinny, full refund)</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-orange-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                <span><strong>CarWale:</strong> 7-day money-back guarantee (dealer-backed reversal)</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-orange-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                <span><strong>OLX:</strong> Marketplace (seller-dependent, highly variable)</span>
              </li>
            </ul>

            <h3 className="text-2xl font-semibold mt-6 mb-3 text-gray-900 dark:text-white">Warranty Coverage Depth</h3>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-3">
                <Award className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                <span><strong>Spinny:</strong> 1-year comprehensive (best duration for newer vehicles, ₹50-100K protection)</span>
              </li>
              <li className="flex items-start gap-3">
                <Award className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                <span><strong>Cars24:</strong> 3-year warranty up to 45,000 km (best total coverage, ₹75-150K protection, RSA+servicing)</span>
              </li>
              <li className="flex items-start gap-3">
                <Award className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                <span><strong>CarWale:</strong> 15,000 km conservative (₹30-60K protection)</span>
              </li>
            </ul>

            <h3 className="text-2xl font-semibold mt-6 mb-3 text-gray-900 dark:text-white">User Ratings Analysis</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              <strong>Cars24:</strong> 4.3 stars (192K reviews—comprehensive but not premium positioning, volume leadership)<br/>
              <strong>Spinny:</strong> 4.1 stars (28.6K reviews—loyal premium segment, selective D2C approach)<br/>
              <strong>CarWale:</strong> 4.6 stars (197K reviews—highest regional satisfaction, network appreciation)<br/>
              <strong>CarDekho:</strong> 4.6 stars (209K reviews—integrated experience satisfaction)
            </p>
          </section>

          <Separator className="my-8" />

          <section>
            <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <BookOpen className="h-7 w-7 text-orange-600 dark:text-blue-400" />
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <Card className="glass-contrast p-6">
                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                  Which platform offers best value considering warranty, inspection, and price together?
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  <strong>Quality+peace-of-mind buyers</strong> → Cars24 (300+ inspection, 3-year warranty, 7-day return, 4.3★) or Spinny (1-year warranty, 5-day return, 200-point curated, 4.1★). <strong>Negotiation-savvy value-seekers</strong> → OLX (affordability, seller-direct) or CarWale (dealer negotiation, 4.6★). <strong>Finance-integrated buyers</strong> → CarDekho (15% market share, Rupyy lending, 4.6★). Use <a href="https://www.cararth.com" className="text-orange-600 dark:text-blue-400 hover:underline font-semibold">Cararth.com</a> to calculate total cost of ownership across all platforms.
                </p>
              </Card>

              <Card className="glass-contrast p-6">
                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                  How do inspection standards differ and which matters most?
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Cars24 300+ (comprehensive physical AI-backed) enables highest confidence, 40-50% fewer post-purchase complaints. Spinny 200-point (curated quality) suitable for confidence-seeking buyers, 95%+ satisfaction retention. CarWale 167-point (standardized balanced) adequate for dealer-backed assurance, 4.6★ reflects regional confidence. CarDekho 217-point (AI-driven algorithmic) sufficient for transparent valuation. Real-world outcomes matter more than point numbers.
                </p>
              </Card>

              <Card className="glass-contrast p-6">
                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                  What warranty duration should I prioritize for my situation?
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  <strong>New vehicles (<40,000 km), high-usage (15,000+ km/year):</strong> Spinny 1-year (best duration, ₹50-100K protection). <strong>Older vehicles (>60,000 km), extended ownership (5+ years):</strong> Cars24 3-year/45,000 km (most comprehensive, RSA included, ₹75-150K protection). <strong>Budget ownership (2-3 years, lower usage):</strong> CarWale 15,000 km (conservative but adequate, ₹30-60K protection). Calculate planned annual km × ownership years to select optimal warranty.
                </p>
              </Card>

              <Card className="glass-contrast p-6">
                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                  Should I use marketplace (Cars24/CarWale) or D2C (Spinny) model?
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  <strong>Marketplace advantages:</strong> Massive inventory (50,000+ Cars24), price competition, negotiation room, flexibility, value discovery. <strong>D2C advantages:</strong> Quality filtering (curated 5,000-8,000 Spinny), fixed transparent pricing, premium service (1-year warranty, 5-day return), convenience (delivery, financing), decision simplification. <strong>Marketplace better for:</strong> Variety seekers, negotiation-comfortable, budget-conscious. <strong>D2C better for:</strong> Quality-focused, convenience-priority, purchase-confident, younger demographics. Compare all options on <a href="https://www.cararth.com" className="text-orange-600 dark:text-blue-400 hover:underline font-semibold">Cararth.com</a>.
                </p>
              </Card>

              <Card className="glass-contrast p-6">
                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                  Which platform has fastest return process if I'm uncertain?
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  <strong>Spinny 5-day money-back</strong> (fastest reversal, unconditional, full refund, doorstep pickup, no questions). <strong>Cars24 7-day return</strong> (longest timeline, 40% advantage vs Spinny, more consideration room). <strong>CarWale 7-day money-back</strong> (dealer-backed process, regional coordination). <strong>OLX marketplace</strong> (seller-variable, 3-30 days range). <a href="https://www.cararth.com" className="text-orange-600 dark:text-blue-400 hover:underline font-semibold">Cararth.com</a> price alerts enable early listing discovery—catch perfect match immediately, reducing return need through better initial selection.
                </p>
              </Card>
            </div>
          </section>

          <Separator className="my-8" />

          <Card className="glass-contrast border-2 border-orange-500/30 dark:border-blue-500/30 p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white text-center">
              Compare All Platforms Instantly on Cararth.com
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-center mb-6">
              Search 1,000+ dealers across Cars24, Spinny, CarWale, CarDekho, and OLX. Compare certifications (167-300 points), warranty balances (1-year vs 3-year), return policies (5-day vs 7-day), and pricing sorted by best warranty-to-value ratio.
            </p>
            <div className="flex justify-center">
              <Link href="/">
                <Button size="lg" className="bg-orange-600 hover:bg-orange-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white" data-testid="button-search-cararth">
                  <DollarSign className="mr-2 h-5 w-5" />
                  Search All Platforms Now
                </Button>
              </Link>
            </div>
          </Card>

          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6 mt-8">
            <p className="text-sm text-gray-600 dark:text-gray-400 italic">
              Last Updated: November 24, 2025
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              <strong>About Cararth.com:</strong> India's first used car meta-search engine helping buyers compare prices, inspections, certifications, and warranties across 100+ platforms (Cars24, Spinny, CarWale, CarDekho, OLX, and 1,000+ dealers). Save time, eliminate overpayment risk, compare warranty duration, find best inspection certification—all on <a href="https://www.cararth.com" className="text-orange-600 dark:text-blue-400 hover:underline">Cararth.com</a>.
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Related Guides</h3>
            <div className="grid gap-3">
              <Link href="/news/used-tata-cars-india-2025">
                <Card className="glass-contrast hover:shadow-md transition-shadow cursor-pointer p-4">
                  <p className="text-orange-600 dark:text-blue-400 font-medium">Used Tata Cars India 2025: Nexon, Harrier & Altroz Buyer's Guide →</p>
                </Card>
              </Link>
              <Link href="/news/used-mahindra-cars-india-2025">
                <Card className="glass-contrast hover:shadow-md transition-shadow cursor-pointer p-4">
                  <p className="text-orange-600 dark:text-blue-400 font-medium">Used Mahindra Cars India 2025: XUV500, Bolero & Scorpio Guide →</p>
                </Card>
              </Link>
              <Link href="/news/used-electric-cars-2025">
                <Card className="glass-contrast hover:shadow-md transition-shadow cursor-pointer p-4">
                  <p className="text-orange-600 dark:text-blue-400 font-medium">Used Electric Cars India 2025: Complete EV Buyer's Guide →</p>
                </Card>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
