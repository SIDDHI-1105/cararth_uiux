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
  TrendingUp,
  CheckCircle2,
  BarChart3,
  Target,
  MapPin,
  CreditCard,
  Smartphone
} from "lucide-react";

export default function UsedCarMarketAnalysis2025() {
  useEffect(() => {
    document.title = "Used Car Market India 2025: Complete Market Analysis & 9.5M Growth to 2030 | Cararth";
    
    const metaTags = {
      description: "India's used car market hit 5.9M units (USD 36Bn) growing to 9.5M by 2030. Comprehensive analysis of SUV demand, tier 2/3 growth, organized sector expansion, and financing trends. Compare prices across 100+ platforms on Cararth.com.",
      keywords: "used car market India 2025, market size analysis, growth forecast 2030, SUV demand, organized sector, tier 2 cities growth, car financing, Cararth",
      "og:title": "Used Car Market India 2025: Complete Market Analysis & Future Outlook to 2030",
      "og:description": "Comprehensive analysis of India's 5.9M unit used car market growing to 9.5M by 2030. SUV premiumization, digital adoption, and tier 2/3 expansion trends.",
      "og:type": "article",
      "article:published_time": "2025-11-16T00:00:00Z",
      "article:author": "Cararth Team",
      "article:section": "Market Analysis"
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
      "headline": "Used Car Market India 2025: Complete Market Analysis, Growth Trends & Future Outlook to 2030",
      "description": "Comprehensive analysis of India's used car market reaching 5.9 million units and projected to hit 9.5 million by 2030, covering SUV dominance, organized sector growth, tier 2/3 expansion, and financing revolution.",
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
        "@id": "https://www.cararth.com/news/used-car-market-india-2025"
      },
      "articleSection": "Market Analysis",
      "keywords": "used car market India, market analysis 2025, growth forecast, SUV trends, organized platforms",
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
            url="https://www.cararth.com/news/used-car-market-india-2025"
            title="Used Car Market India 2025: Complete Market Analysis"
            description="India's used car market analysis: 5.9M units to 9.5M by 2030 with SUV demand, tier 2/3 growth, and digital transformation"
          />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 pt-12 pb-8">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300">
              <BarChart3 className="h-3 w-3 mr-1" />
              Market Analysis
            </Badge>
            <Badge variant="outline" className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300">
              <Clock className="h-3 w-3 mr-1" />
              18 min read
            </Badge>
            <Badge variant="outline" className="bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300">
              Updated 2025
            </Badge>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
            Used Car Market India 2025: Complete Market Analysis, Growth Trends & Future Outlook to 2030
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400">
            India's used car market hit 5.9M units (USD 36Bn) growing to 9.5M by 2030. Comprehensive analysis of SUV demand, tier 2/3 growth, organized sector expansion, and financing trends.
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
              India's used car market reached <strong>5.9 million units (USD 35-36 billion)</strong> in FY25, projected to hit <strong>9.5 million units (USD 73 billion) by 2030</strong> at 10-15% CAGR, driven by SUV demand (50%+ share), digital adoption, organized sector growth (45% by FY25), tier 2/3 expansion, and improved financing penetration (35% by 2025). <strong><Link href="/" className="text-blue-600 hover:text-blue-700">Cararth.com</Link></strong> helps buyers navigate this growing market by comparing listings across 100+ platforms to find the best deals instantly.
            </p>

            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-l-4 border-blue-600 p-6 my-8">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-blue-600" />
                Key Takeaways
              </h3>
              <ul className="space-y-2 mb-0">
                <li><strong>Market Size:</strong> 5.9 million units sold in FY25, valued at USD 36 billion (Rs 4 lakh crore)</li>
                <li><strong>Growth Trajectory:</strong> Projected 9.5 million units by 2030, growing at 10-15.5% CAGR</li>
                <li><strong>Organized Sector:</strong> Rising from 18-25% to 45% market share by FY25, growing at 27.50% CAGR</li>
                <li><strong>SUV Dominance:</strong> SUVs capture 50%+ market share, up from 23% four years ago, with Tata Nexon leading</li>
                <li><strong>Tier 2/3 Growth:</strong> Non-metro markets showing 30%+ growth with 68% repurchase intent</li>
                <li><strong>Financing Boom:</strong> Penetration rising from 23% to 35%, USD 8.77Bn market growing at 15.8% CAGR</li>
                <li><strong>Digital Adoption:</strong> 75% buyers use digital channels, 150M yearly visits to major platforms</li>
                <li><strong>Smart Search:</strong> Use <strong><Link href="/" className="text-blue-600 hover:text-blue-700">Cararth.com</Link></strong> to compare prices across Cars24, Spinny, CarDekho, OLX, and 100+ other platforms in seconds</li>
              </ul>
            </div>

            <Separator className="my-8" />

            <h2 className="text-3xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="h-7 w-7 text-blue-600" />
              Market Size & Growth Projections: 9.5 Million Units by 2030
            </h2>
            <p>
              India's used car market has achieved remarkable momentum, reaching <strong>5.9 million units in FY2024-25</strong> with market valuation between USD 32.9-36.39 billion. At approximately <strong>Rs 4 lakh crore</strong>, the market value now nearly matches new car sales revenue, signaling maturation and growing buyer confidence.
            </p>
            <p>
              The growth trajectory remains exceptionally strong with projections indicating the market will reach <strong>9.5-10.8 million units by 2030</strong>, representing a CAGR of 10-15.5%. This substantially outpaces the new car market's 5-7% annual growth, driven by rising new car prices (up 32% in 2024 due to BS-6 norms), expanding middle-class incomes, and improved product quality through certified programs.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
              <div className="bg-white dark:bg-gray-900 p-5 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="text-3xl font-bold text-blue-600 mb-2">5.9M</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Units Sold FY25</div>
              </div>
              <div className="bg-white dark:bg-gray-900 p-5 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="text-3xl font-bold text-green-600 mb-2">9.5M</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Target by 2030</div>
              </div>
              <div className="bg-white dark:bg-gray-900 p-5 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="text-3xl font-bold text-purple-600 mb-2">10-15%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Annual CAGR</div>
              </div>
            </div>

            <p>
              The used-to-new car sales ratio has climbed to <strong>1.4:1</strong> from below 1.0 just five years ago. However, India still lags developed markets like the United States (2.5:1) and United Kingdom (4.0:1), indicating substantial headroom for continued expansion.
            </p>

            <div className="bg-green-50 dark:bg-green-950/20 border-l-4 border-green-600 p-4 my-6">
              <p className="mb-0">
                <strong>Finding the best deal in this massive market requires comparing prices across dozens of platforms.</strong> <Link href="/" className="text-green-700 dark:text-green-400 hover:underline font-semibold">Cararth.com</Link> aggregates all listings in one place, helping you compare prices and find genuine deals in seconds.
              </p>
            </div>

            <h2 className="text-3xl font-bold mb-4 mt-8 flex items-center gap-2">
              <Target className="h-7 w-7 text-purple-600" />
              Organized vs Unorganized Sector: 45% Digital Share
            </h2>
            <p>
              The structural transformation represents one of the most significant shifts in the automotive landscape. While unorganized local dealers maintain <strong>71.43% market share</strong>, the organized sector is growing at <strong>14-27.50% annually</strong> and projected to reach <strong>45% by FY25</strong>.
            </p>
            <p>
              <strong>Online platforms achieve the fastest growth at 27.50% CAGR</strong>, with Cars24 leading at 200,000 annual units handled. CarTrade attracts 150 million yearly unique visitors with 90% organic traffic. Other major players include Spinny (premium positioning with 1-year warranty), CarDekho (with Rupyy financing arm disbursing INR 12,000 crore annually), and OLX Autos.
            </p>

            <h3 className="text-2xl font-semibold mb-3 mt-6">OEM-Certified Programs</h3>
            <ul>
              <li><strong>Maruti True Value:</strong> 606 outlets, 376-point inspection, 1-year warranty</li>
              <li><strong>Mahindra First Choice:</strong> 1,200+ touchpoints, industry-leading 2-year comprehensive warranty</li>
              <li><strong>Toyota U Trust:</strong> 203-point inspection, up to 3 free services</li>
            </ul>

            <p className="mt-4">
              The organized sector's value proposition centers on quality assurance through multi-point inspections, comprehensive warranties, integrated financing and insurance, transparent pricing, and technology-enabled customer experience. Despite commanding <strong>5-7% price premiums</strong>, quality-conscious buyers prefer organized channels.
            </p>

            <div className="bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-600 p-4 my-6">
              <p className="mb-0">
                <strong>With so many organized platforms available, comparing prices is crucial.</strong> <Link href="/" className="text-blue-700 dark:text-blue-400 hover:underline font-semibold">Cararth.com</Link> shows you the same car model across all platforms simultaneously, revealing which seller offers the best value.
              </p>
            </div>

            <h2 className="text-3xl font-bold mb-4 mt-8 flex items-center gap-2">
              <TrendingUp className="h-7 w-7 text-orange-600" />
              SUV Dominance & Premiumization: 50%+ Market Share
            </h2>
            <p>
              The most dramatic segment shift is the SUV surge. SUVs now capture <strong>over 50% market share</strong>, up from just 23% four years ago. This transformation has driven the <strong>36% average selling price increase</strong> over the same period.
            </p>
            <p>
              The <strong>Tata Nexon leads with 22,000+ units sold in October 2025 alone</strong>, demonstrating unprecedented demand across petrol, diesel, and electric variants. The Nexon's 5-star Global NCAP safety rating particularly resonates with family buyers.
            </p>

            <h3 className="text-2xl font-semibold mb-3 mt-6">Popular Used SUV Models</h3>
            <div className="grid grid-cols-1 gap-3 my-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="font-semibold text-lg mb-1">Hyundai Creta</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">₹7.0-10.0 lakhs • Highest resale value in segment</div>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="font-semibold text-lg mb-1">Maruti Vitara Brezza</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">₹5.5-8.5 lakhs • Best fuel economy 18-24 kmpl</div>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="font-semibold text-lg mb-1">Mahindra XUV300</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">₹6.0-9.0 lakhs • Segment-leading 7 airbags</div>
              </div>
            </div>

            <p>
              Interestingly, <strong>luxury SUV demand in tier 2 cities grew 30%</strong>, with models like Audi Q3, BMW X1, and Mercedes GLA finding strong acceptance. Depreciation makes these premium vehicles accessible at mainstream prices, typically ₹12-25 lakhs for 2015-2019 models.
            </p>

            <h2 className="text-3xl font-bold mb-4 mt-8 flex items-center gap-2">
              <MapPin className="h-7 w-7 text-red-600" />
              Tier 2 & Tier 3 Cities: 30%+ Growth Frontier
            </h2>
            <p>
              Non-metro markets represent the next growth frontier. <strong>Tier 2 and tier 3 cities show 30%+ demand growth</strong>, with South India projected to command 27% market share and North India holding 30-36.50%.
            </p>
            <p>
              Cities like Jaipur, Coimbatore, and Kochi demonstrated 30%+ growth, with Coimbatore recording highest financing adoption at 65%+. Remarkably, <strong>68% of tier 2/3 buyers are likely to repurchase used cars</strong> compared to lower rates in metros, indicating strong satisfaction.
            </p>

            <h3 className="text-2xl font-semibold mb-3 mt-6">Growth Drivers</h3>
            <ul>
              <li>Limited public transport infrastructure necessitating personal vehicles</li>
              <li>Improved road connectivity with expressways linking towns to metros</li>
              <li>Rising disposable incomes among younger demographics (age 31-34)</li>
              <li>Digital adoption enabling research and price comparison</li>
              <li>Expanded financing access through NBFCs and digital lending</li>
            </ul>

            <h2 className="text-3xl font-bold mb-4 mt-8 flex items-center gap-2">
              <CreditCard className="h-7 w-7 text-green-600" />
              Financing Revolution: 35% Penetration by 2025
            </h2>
            <p>
              Used car finance penetration reached <strong>23% in 2024</strong>, up from 15% in 2010, and is projected to hit <strong>35% by 2025</strong>. The used car finance market, valued at <strong>USD 8.77+ billion</strong>, is growing at a robust <strong>15.8% CAGR</strong>.
            </p>
            <p>
              <strong>NBFCs dominate with 51-54% market share</strong>, offering flexible criteria and faster approvals than banks (40% share). Platform-integrated financing is transforming customer experience, with CarDekho's Rupyy reporting INR 12,000 crore annual disbursement.
            </p>

            <h3 className="text-2xl font-semibold mb-3 mt-6">Typical Loan Parameters</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Loan-to-Value</div>
                <div className="font-semibold text-lg">70-90%</div>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tenure</div>
                <div className="font-semibold text-lg">1-7 years</div>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Interest Rate</div>
                <div className="font-semibold text-lg">11-16%</div>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Processing Fee</div>
                <div className="font-semibold text-lg">1-2%</div>
              </div>
            </div>

            <h2 className="text-3xl font-bold mb-4 mt-8 flex items-center gap-2">
              <Smartphone className="h-7 w-7 text-indigo-600" />
              Digital Adoption & Technology Transformation
            </h2>
            <p>
              Technology is fundamentally reshaping the buying journey. <strong>75% of car buyers now use at least one digital channel</strong> during their purchase journey. CarTrade alone attracts 150 million yearly unique visitors with 90% organic traffic.
            </p>
            <p>
              Virtual inspections with 360-degree photography are becoming standard. AI-based pricing considers 100+ parameters for accurate valuations. Blockchain pilot programs promise immutable vehicle history records for enhanced transparency.
            </p>

            <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 p-6 rounded-lg my-8">
              <h3 className="text-2xl font-bold mb-3">Why Use Cararth.com?</h3>
              <p className="mb-4">
                With India's used car market becoming increasingly digital and fragmented across 100+ platforms, smart buyers need smart tools. <strong><Link href="/" className="text-orange-700 dark:text-orange-400 hover:underline">Cararth.com</Link></strong> is India's first used car meta-search engine.
              </p>
              <ul className="space-y-2">
                <li><strong>Comprehensive Search:</strong> Search Cars24, Spinny, CarDekho, OLX, and 100+ platforms simultaneously</li>
                <li><strong>Real-Time Comparison:</strong> Save ₹30,000-₹80,000 by comparing 8-15% price variations</li>
                <li><strong>Advanced Filters:</strong> Transmission, fuel type, year, mileage, city filters</li>
                <li><strong>Price Alerts:</strong> Get notified of drops and new listings instantly</li>
                <li><strong>Never Miss a Deal:</strong> See every option matching your criteria</li>
              </ul>
            </div>

            <Separator className="my-8" />

            <h2 className="text-3xl font-bold mb-4">Conclusion</h2>
            <p>
              India's used car market stands at a transformative inflection point in 2025, having reached 5.9 million units and poised to nearly double to 9.5 million by 2030. The organized sector's rise, SUV premiumization, tier 2/3 expansion, and financing penetration collectively signal a maturing, dynamic market.
            </p>
            <p>
              With 75% of buyers using digital channels and 100+ platforms competing for attention, the challenge isn't finding used cars—it's finding the right car at the best price. <strong>This is exactly what <Link href="/" className="text-blue-600 hover:text-blue-700">Cararth.com</Link> solves.</strong>
            </p>
            <p>
              Smart buyers compare before they buy. In a market where the same car can be priced 8-15% differently across platforms, comprehensive comparison isn't optional—it's essential to avoid overpaying by ₹30,000-₹80,000 or more.
            </p>

            <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Share this analysis:</p>
                  <SocialShareButtons
                    url="https://www.cararth.com/news/used-car-market-india-2025"
                    title="Used Car Market India 2025: Complete Market Analysis"
                    description="India's used car market analysis: 5.9M units to 9.5M by 2030"
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
