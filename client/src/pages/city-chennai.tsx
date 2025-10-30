import { useQuery } from "@tanstack/react-query";
import { SEOHead } from "@/components/seo-head";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, TrendingUp, Shield, Search } from "lucide-react";
import { Link } from "wouter";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export default function ChennaiCityPage() {
  const { data: stats } = useQuery({
    queryKey: ['/api/hero-stats'],
  });

  const cityData = {
    name: "Chennai",
    slug: "chennai",
    tagline: "Find Your Perfect Car in Chennai",
    description: "Browse verified used cars in Chennai with CarArth. Discover authentic listings from established dealers and sellers across Tamil Nadu's capital. AI-verified quality, competitive pricing, and comprehensive South Indian market insights.",
    marketInsights: [
      { label: "Active Listings", value: "65+", icon: Search },
      { label: "Avg. Price Range", value: "₹3-10L", icon: TrendingUp },
      { label: "AI-Verified", value: "100%", icon: Shield }
    ],
    popularBrands: ["Maruti Suzuki", "Hyundai", "Honda", "Renault", "Tata", "Toyota"],
    whyChoose: [
      "Strong automotive market with premium options",
      "Connect with verified dealers across Chennai",
      "Instant comparisons from leading platforms",
      "AI verification tailored for Tamil Nadu market"
    ]
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `https://cararth.com/used-cars-${cityData.slug}#business`,
    "name": `CarArth - Used Cars in ${cityData.name}`,
    "description": cityData.description,
    "url": `https://cararth.com/used-cars-${cityData.slug}`,
    "areaServed": {
      "@type": "City",
      "name": cityData.name,
      "alternateName": "Madras",
      "containedIn": {
        "@type": "State",
        "name": "Tamil Nadu"
      }
    },
    "serviceType": "Used Car Marketplace",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": `Used Cars in ${cityData.name}`,
      "itemListElement": cityData.popularBrands.map((brand) => ({
        "@type": "Offer",
        "itemOffered": {
          "@type": "Car",
          "name": `${brand} Used Cars`
        }
      }))
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "13.0827",
      "longitude": "80.2707"
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <SEOHead
        title={`Used Cars in ${cityData.name} | CarArth - AI-Verified Listings`}
        description={cityData.description}
        keywords={`used cars chennai, second hand cars chennai, pre owned cars chennai, chennai car dealers, buy used cars chennai, car marketplace chennai`}
        canonical={`https://cararth.com/used-cars-${cityData.slug}`}
        structuredData={structuredData}
      />
      
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-medium">{cityData.name}, Tamil Nadu</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            {cityData.tagline}
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
            {cityData.description}
          </p>
          
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/">
              <Button size="lg" className="gap-2" data-testid="button-search-cars">
                <Search className="w-4 h-4" />
                Search All Cars
              </Button>
            </Link>
            <Link href="/news">
              <Button size="lg" variant="outline" data-testid="button-market-insights">
                <TrendingUp className="w-4 h-4" />
                Market Insights
              </Button>
            </Link>
          </div>
        </div>

        {/* Market Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {cityData.marketInsights.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <stat.icon className="w-8 h-8 mx-auto mb-3 text-primary" />
                <p className="text-3xl font-bold mb-2">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* About Section */}
        <Card className="mb-12 border-2">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-6">Why Choose CarArth for Used Cars in {cityData.name}?</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-lg mb-3">AI-Powered Verification</h3>
                <p className="text-muted-foreground mb-4">
                  Every listing in {cityData.name} is verified using our advanced AI technology. We check for odometer fraud, 
                  document authenticity, and ensure you get accurate vehicle information.
                </p>
                
                <h3 className="font-semibold text-lg mb-3">Chennai Market Insights</h3>
                <p className="text-muted-foreground">
                  Access exclusive {cityData.name} market data with price trends, demand patterns, and best deals 
                  across South India's automotive hub.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-lg mb-3">Key Benefits</h3>
                <ul className="space-y-3">
                  {cityData.whyChoose.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Popular Brands */}
        <Card className="mb-12">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-6">Popular Car Brands in {cityData.name}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {cityData.popularBrands.map((brand, index) => (
                <Link key={index} href={`/?make=${encodeURIComponent(brand)}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4 text-center">
                      <p className="font-medium text-sm">{brand}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-2 border-primary/20">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Find Your Perfect Car?</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Start your search now and discover the best used car deals in {cityData.name}. 
              All listings are AI-verified for your peace of mind.
            </p>
            <Link href="/">
              <Button size="lg" className="gap-2" data-testid="button-start-search">
                <Search className="w-4 h-4" />
                Start Searching
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Breadcrumb Links */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/news" className="hover:text-primary">Throttle Talk</Link>
          <span className="mx-2">/</span>
          <Link href="/guides/ai-verified-used-car-trust-india" className="hover:text-primary">AI Verification Guide</Link>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
