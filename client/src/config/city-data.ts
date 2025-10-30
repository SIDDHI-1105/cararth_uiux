import { CityData } from "@/components/city-landing-page";

export const CITY_CONFIG: Record<string, CityData> = {
  hyderabad: {
    name: "Hyderabad",
    slug: "hyderabad",
    state: "Telangana",
    tagline: "Find Your Perfect Car in Hyderabad",
    description: "Discover verified used cars in Hyderabad with CarArth. Browse authentic listings from top dealers and individual sellers across the city. AI-verified quality, transparent pricing, and comprehensive market insights.",
    marketInsights: {
      activeListings: "50+",
      avgPriceRange: "₹3-8L"
    },
    popularBrands: ["Maruti Suzuki", "Hyundai", "Honda", "Tata", "Mahindra", "Toyota"],
    whyChoose: [
      "Special Hyderabad market intelligence for better deals",
      "Connect directly with verified sellers in your city",
      "Compare prices across multiple platforms instantly",
      "AI-powered fraud detection and listing verification"
    ],
    geo: {
      latitude: "17.3850",
      longitude: "78.4867"
    },
    keywords: "used cars hyderabad, second hand cars hyderabad, pre owned cars hyderabad, hyderabad car dealers, buy used cars hyderabad, car marketplace hyderabad",
    uniqueContent: {
      title: "Local Market Intelligence",
      description: "Access exclusive Hyderabad market data including price trends, demand patterns, and best deals. Our platform aggregates listings from multiple sources to give you the complete picture."
    }
  },
  "delhi-ncr": {
    name: "Delhi NCR",
    slug: "delhi-ncr",
    state: "Delhi",
    tagline: "Find Your Perfect Car in Delhi NCR",
    description: "Explore verified used cars across Delhi, Noida, Gurgaon, and Ghaziabad with CarArth. Access authentic listings from premium dealers and trusted sellers. AI-verified quality, competitive pricing, and comprehensive market insights for the NCR region.",
    marketInsights: {
      activeListings: "100+",
      avgPriceRange: "₹4-12L"
    },
    popularBrands: ["Maruti Suzuki", "Hyundai", "Honda", "Toyota", "Mahindra", "Tata"],
    whyChoose: [
      "Largest used car market in North India with extensive inventory",
      "Connect with verified dealers across Delhi, Noida, and Gurgaon",
      "Real-time price comparisons from multiple platforms",
      "AI-powered verification for NCR's diverse market"
    ],
    geo: {
      latitude: "28.7041",
      longitude: "77.1025"
    },
    keywords: "used cars delhi ncr, second hand cars delhi, pre owned cars noida, gurgaon car dealers, buy used cars delhi, car marketplace ncr",
    uniqueContent: {
      title: "NCR-Wide Coverage",
      description: "Access comprehensive listings across Delhi, Noida, Gurgaon, and Ghaziabad. Our platform aggregates inventory from multiple sources to give you the widest selection."
    }
  },
  mumbai: {
    name: "Mumbai",
    slug: "mumbai",
    state: "Maharashtra",
    tagline: "Find Your Perfect Car in Mumbai",
    description: "Browse verified used cars in Mumbai with CarArth. Discover authentic listings from trusted dealers and sellers across Mumbai, Navi Mumbai, and Thane. AI-verified quality, transparent pricing, and real-time market insights for India's financial capital.",
    marketInsights: {
      activeListings: "80+",
      avgPriceRange: "₹5-15L"
    },
    popularBrands: ["Maruti Suzuki", "Hyundai", "Honda", "Tata", "Toyota", "Mahindra"],
    whyChoose: [
      "Premium car market with luxury and compact options",
      "Verified dealers across Mumbai Metropolitan Region",
      "Instant price comparisons from leading platforms",
      "AI fraud detection tailored for Mumbai's market"
    ],
    geo: {
      latitude: "19.0760",
      longitude: "72.8777"
    },
    keywords: "used cars mumbai, second hand cars mumbai, pre owned cars navi mumbai, thane car dealers, buy used cars mumbai, car marketplace mumbai",
    uniqueContent: {
      title: "Mumbai Market Insights",
      description: "Get exclusive access to Mumbai's premium car market data including price trends, demand patterns, and best deals across the Metropolitan Region."
    }
  },
  bangalore: {
    name: "Bangalore",
    slug: "bangalore",
    state: "Karnataka",
    alternateName: "Bengaluru",
    tagline: "Find Your Perfect Car in Bangalore",
    description: "Discover verified used cars in Bangalore (Bengaluru) with CarArth. Browse authentic listings from top dealers and sellers across India's tech capital. AI-verified quality, competitive pricing, and comprehensive Karnataka market insights.",
    marketInsights: {
      activeListings: "70+",
      avgPriceRange: "₹4-10L"
    },
    popularBrands: ["Maruti Suzuki", "Hyundai", "Honda", "Toyota", "Tata", "Mahindra"],
    whyChoose: [
      "Tech-savvy market with premium car options",
      "Connect with verified dealers across Bangalore",
      "Real-time comparisons from all major platforms",
      "AI verification optimized for Karnataka market"
    ],
    geo: {
      latitude: "12.9716",
      longitude: "77.5946"
    },
    keywords: "used cars bangalore, second hand cars bengaluru, pre owned cars bangalore, bangalore car dealers, buy used cars bangalore, car marketplace bengaluru",
    uniqueContent: {
      title: "Local Market Intelligence",
      description: "Access exclusive Bangalore market data including price trends, demand patterns, and best deals. Perfect for the tech-savvy buyer in India's Silicon Valley."
    }
  },
  pune: {
    name: "Pune",
    slug: "pune",
    state: "Maharashtra",
    tagline: "Find Your Perfect Car in Pune",
    description: "Explore verified used cars in Pune with CarArth. Access authentic listings from reputable dealers and individual sellers across the Oxford of the East. AI-verified quality, transparent pricing, and real-time Maharashtra market insights.",
    marketInsights: {
      activeListings: "60+",
      avgPriceRange: "₹3-9L"
    },
    popularBrands: ["Maruti Suzuki", "Hyundai", "Honda", "Tata", "Toyota", "Mahindra"],
    whyChoose: [
      "Growing automotive hub with diverse inventory",
      "Trusted dealers across Pune and Pimpri-Chinchwad",
      "Comprehensive price comparisons in real-time",
      "AI-powered fraud detection for Pune market"
    ],
    geo: {
      latitude: "18.5204",
      longitude: "73.8567"
    },
    keywords: "used cars pune, second hand cars pune, pre owned cars pune, pune car dealers, buy used cars pune, car marketplace pune",
    uniqueContent: {
      title: "Pune Market Insights",
      description: "Get access to comprehensive Pune market data with price trends, demand patterns, and best deals across the city's automotive landscape."
    }
  },
  chennai: {
    name: "Chennai",
    slug: "chennai",
    state: "Tamil Nadu",
    alternateName: "Madras",
    tagline: "Find Your Perfect Car in Chennai",
    description: "Browse verified used cars in Chennai with CarArth. Discover authentic listings from established dealers and sellers across Tamil Nadu's capital. AI-verified quality, competitive pricing, and comprehensive South Indian market insights.",
    marketInsights: {
      activeListings: "65+",
      avgPriceRange: "₹3-10L"
    },
    popularBrands: ["Maruti Suzuki", "Hyundai", "Honda", "Renault", "Tata", "Toyota"],
    whyChoose: [
      "Strong automotive market with premium options",
      "Connect with verified dealers across Chennai",
      "Instant comparisons from leading platforms",
      "AI verification tailored for Tamil Nadu market"
    ],
    geo: {
      latitude: "13.0827",
      longitude: "80.2707"
    },
    keywords: "used cars chennai, second hand cars chennai, pre owned cars chennai, chennai car dealers, buy used cars chennai, car marketplace chennai",
    uniqueContent: {
      title: "Chennai Market Insights",
      description: "Access exclusive Chennai market data with price trends, demand patterns, and best deals across South India's automotive hub."
    }
  }
};
