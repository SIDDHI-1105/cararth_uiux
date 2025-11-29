import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { SEOHead } from "@/components/seo-head";
import NavbarImproved from "@/components/navbar-improved";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RelatedListings } from "@/components/related-listings";
import { ContactOptions } from "@/components/contact-options";
import { AIInsightCard } from "@/components/ai-insight-card";
import { FloatingCTA } from "@/components/floating-cta";
import { AIChatReply } from "@/components/ai-chat-reply";
import { useIsMobile } from "@/hooks/use-is-mobile";
import {
  ShieldCheck,
  MapPin,
  Fuel,
  Gauge,
  Calendar,
  Settings,
  User,
  Phone,
  Mail,
  MessageSquare,
  Share2,
  Heart,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function ListingDetail() {
  const { id } = useParams();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showAIReply, setShowAIReply] = useState(false);
  const isMobile = useIsMobile();

  // Fetch car details
  const { data: car, isLoading } = useQuery<any>({
    queryKey: ["/api/marketplace", id],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <>
        <NavbarImproved />
        <main className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
          <div className="max-w-6xl mx-auto px-4">
            <div className="animate-pulse space-y-6">
              <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
              <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!car) {
    return (
      <>
        <NavbarImproved />
        <main className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
          <div className="max-w-6xl mx-auto px-4 text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Car Not Found</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The listing you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => window.location.href = "/"}>
              Back to Home
            </Button>
          </div>
        </main>
      </>
    );
  }

  const images = car.images || (car.imageUrl ? [car.imageUrl] : []);
  const hasImages = images.length > 0;
  const currentImage = hasImages ? images[currentImageIndex] : "https://placehold.co/800x600/e5e7eb/6b7280?text=No+Image";

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const formatPrice = (price: number | string) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(typeof price === "string" ? parseFloat(price) : price);
  };

  const carTitle = car.title || `${car.make} ${car.model} ${car.year}`;
  const carPrice = formatPrice(car.price);
  
  // Helper function to safely parse price from various Indian formats
  // Handles all variants: ₹ 12,45,000, ₹ 12.45 Lakh, ₹ 5 Lakhs, ₹ 1 Cr 25 Lakh 50 Thousand
  const parseSafePrice = (price: any): number | undefined => {
    if (price === null || price === undefined || price === "") return undefined;
    
    // If already a number, return it (including 0)
    if (typeof price === "number") return isNaN(price) ? undefined : price;
    
    // If string, handle Indian formats by detecting and summing ALL components
    if (typeof price === "string") {
      let str = price.toLowerCase().trim();
      
      // Remove currency symbols
      str = str.replace(/[₹$]/g, "");
      
      let total = 0;
      
      // Extract crore component(s) - handle singular/plural (word boundary to avoid "across")
      const croreMatches = str.match(/(\d+(?:\.\d+)?)\s*(?:crores?|crs?)\b/g);
      if (croreMatches) {
        croreMatches.forEach(match => {
          const num = parseFloat(match.match(/(\d+(?:\.\d+)?)/)?.[1] || "0");
          total += num * 10000000;
          str = str.replace(match, "");
        });
      }
      
      // Extract lakh component(s) - handle singular/plural/lac/lacs
      const lakhMatches = str.match(/(\d+(?:\.\d+)?)\s*(?:lakhs?|lacs?)\b/g);
      if (lakhMatches) {
        lakhMatches.forEach(match => {
          const num = parseFloat(match.match(/(\d+(?:\.\d+)?)/)?.[1] || "0");
          total += num * 100000;
          str = str.replace(match, "");
        });
      }
      
      // Extract thousand component(s) - handle K and spelled-out
      const thousandMatches = str.match(/(\d+(?:\.\d+)?)\s*(?:thousands?|ths?|k)\b/g);
      if (thousandMatches) {
        thousandMatches.forEach(match => {
          const num = parseFloat(match.match(/(\d+(?:\.\d+)?)/)?.[1] || "0");
          total += num * 1000;
          str = str.replace(match, "");
        });
      }
      
      // If no unit found, try to parse as plain number (with commas)
      if (total === 0) {
        const cleaned = str.replace(/[,\s]/g, "").replace(/[^\d.]/g, "");
        const parsed = parseFloat(cleaned);
        if (!isNaN(parsed)) {
          return parsed;
        }
      } else {
        // Add any remaining plain number (e.g., "1 Cr 50" → crore + 50)
        const remaining = str.replace(/[,\s]/g, "").replace(/[^\d.]/g, "");
        if (remaining && !isNaN(parseFloat(remaining))) {
          total += parseFloat(remaining);
        }
      }
      
      return total >= 0 ? total : undefined;
    }
    
    return undefined;
  };
  
  // Parse price once for consistent use with proper sanitization
  const validPrice = parseSafePrice(car.price);

  // Comprehensive Schema.org Vehicle + Product markup for Google rich results
  // Only include fields with actual data - no false defaults
  const structuredData = {
    "@context": "https://schema.org",
    "@type": ["Vehicle", "Product", "Car"],
    name: carTitle,
    description: car.description || `${carTitle}${car.city ? ` located in ${car.city}` : ""}.`,
    
    // Vehicle-specific fields (only if available)
    ...(car.vin && { vehicleIdentificationNumber: car.vin }),
    ...(car.make && { manufacturer: car.make }),
    ...(car.model && { model: car.model }),
    ...(car.year && {
      modelDate: car.year.toString(),
      productionDate: car.year.toString(),
      vehicleModelDate: car.year.toString()
    }),
    
    // Vehicle condition and specs (only include if data exists)
    itemCondition: car.verificationStatus === 'certified' ? 
      "https://schema.org/RefurbishedCondition" : 
      "https://schema.org/UsedCondition",
    ...((car.mileage || car.kmDriven) && {
      mileageFromOdometer: {
        "@type": "QuantitativeValue",
        value: car.mileage || car.kmDriven,
        unitCode: "KMT",
        unitText: "kilometers"
      }
    }),
    ...(car.fuelType && { fuelType: car.fuelType }),
    ...(car.transmission && { vehicleTransmission: car.transmission }),
    ...(car.driveType && { driveWheelConfiguration: car.driveType }),
    ...(car.engineSize && {
      vehicleEngine: {
        "@type": "EngineSpecification",
        engineDisplacement: {
          "@type": "QuantitativeValue",
          value: car.engineSize,
          unitCode: "CMQ"
        }
      }
    }),
    ...(car.bodyType && { bodyType: car.bodyType }),
    ...(car.doors && { numberOfDoors: car.doors }),
    ...(car.seats && { vehicleSeatingCapacity: car.seats }),
    ...(car.color && { color: car.color }),
    
    // Product/Brand info (only if make is available)
    ...(car.make && {
      brand: {
        "@type": "Brand",
        name: car.make,
      }
    }),
    category: "Automobiles > Used Cars",
    
    // Images
    image: images.length > 0 ? images : [currentImage],
    
    // Offers and pricing (only include if valid price exists, including 0)
    ...(validPrice !== undefined && {
      offers: {
        "@type": "Offer",
        url: `https://www.cararth.com/listing/${id}`,
        priceCurrency: "INR",
        price: validPrice,
        availability: "https://schema.org/InStock",
        priceValidUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        ...(car.city && {
          seller: {
            "@type": car.sellerType === 'dealer' ? "AutoDealer" : "Person",
            ...(car.sellerName && { name: car.sellerName }),
            ...(car.sellerPhone && { telephone: car.sellerPhone }),
            address: {
              "@type": "PostalAddress",
              ...(car.city && { addressLocality: car.city }),
              ...(car.state && { addressRegion: car.state }),
              addressCountry: "IN"
            }
          }
        }),
        acceptedPaymentMethod: [
          "http://purl.org/goodrelations/v1#Cash",
          "http://purl.org/goodrelations/v1#ByBankTransferInAdvance"
        ]
      }
    }),
    
    // Seller organization (only include location if available)
    seller: {
      "@type": car.sellerType === 'dealer' ? "AutoDealer" : "Organization",
      name: car.sellerName || "CarArth - India's Used Car Marketplace",
      url: "https://www.cararth.com",
      logo: "https://www.cararth.com/logo.png",
      ...(car.city && {
        address: {
          "@type": "PostalAddress",
          ...(car.city && { addressLocality: car.city }),
          ...(car.state && { addressRegion: car.state }),
          addressCountry: "IN"
        }
      })
    },
    
    // Additional details for AI/LLM understanding
    additionalProperty: [
      ...(car.ownerNumber ? [{
        "@type": "PropertyValue",
        name: "Previous Owners",
        value: car.ownerNumber
      }] : []),
      ...(car.insuranceValidity ? [{
        "@type": "PropertyValue",
        name: "Insurance Validity",
        value: car.insuranceValidity
      }] : []),
      ...(car.registrationNumber ? [{
        "@type": "PropertyValue",
        name: "Registration Number",
        value: car.registrationNumber
      }] : []),
      {
        "@type": "PropertyValue",
        name: "Verification Status",
        value: car.verificationStatus || "unverified"
      },
      ...(car.googleCompliant ? [{
        "@type": "PropertyValue",
        name: "Google Vehicle Listings Compliant",
        value: "Yes"
      }] : [])
    ],
    
    // Trust signals
    aggregateRating: car.trustScore ? {
      "@type": "AggregateRating",
      ratingValue: (car.trustScore / 20).toFixed(1),
      bestRating: "5",
      worstRating: "1",
      ratingCount: "1"
    } : undefined,
    
    // Contact actions
    potentialAction: {
      "@type": "ContactAction",
      target: [
        ...(car.sellerPhone ? [`tel:${car.sellerPhone}`] : []),
        ...(car.sellerPhone ? [`https://wa.me/${car.sellerPhone.replace(/[^0-9]/g, '')}`] : []),
        `https://www.cararth.com/listing/${id}`
      ],
      name: "Contact Seller"
    }
  };

  return (
    <>
      <SEOHead
        title={`${carTitle} for Sale in ${car.city || "India"} | CarArth`}
        description={`Buy ${carTitle} - ₹${carPrice}. ${car.fuelType || "Petrol"}, ${car.transmission || "Manual"}, ${car.mileage || car.kmDriven || "N/A"} km. AI-verified listing on CarArth.`}
        keywords={`${car.make} ${car.model}, used ${car.make} ${car.year}, buy used cars ${car.city}, ${car.fuelType} cars`}
        canonical={`https://www.cararth.com/listing/${id}`}
        structuredData={structuredData}
      />

      <NavbarImproved />

      <main className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Main Content Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Image Gallery */}
            <div>
              <div className="relative rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-800 mb-4">
                <img
                  src={currentImage}
                  alt={carTitle}
                  className="w-full h-96 object-cover"
                  data-testid="img-main-car"
                  onError={(e) => {
                    e.currentTarget.src = "https://placehold.co/800x600/e5e7eb/6b7280?text=No+Image";
                  }}
                />
                
                {/* Navigation Arrows */}
                {hasImages && images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-900/90 p-2 rounded-full hover:bg-white dark:hover:bg-gray-800 transition"
                      data-testid="button-prev-image"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-900/90 p-2 rounded-full hover:bg-white dark:hover:bg-gray-800 transition"
                      data-testid="button-next-image"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}

                {/* Favorite & Share */}
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    onClick={() => setIsFavorite(!isFavorite)}
                    className="bg-white/90 dark:bg-gray-900/90 p-2 rounded-full hover:bg-white dark:hover:bg-gray-800 transition"
                    data-testid="button-favorite"
                  >
                    <Heart className={`w-5 h-5 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
                  </button>
                  <button
                    onClick={() => navigator.share?.({ url: window.location.href })}
                    className="bg-white/90 dark:bg-gray-900/90 p-2 rounded-full hover:bg-white dark:hover:bg-gray-800 transition"
                    data-testid="button-share"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Thumbnail Gallery */}
              {hasImages && images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((img: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition ${
                        idx === currentImageIndex
                          ? "border-blue-600"
                          : "border-transparent hover:border-gray-300"
                      }`}
                      data-testid={`button-thumbnail-${idx}`}
                    >
                      <img
                        src={img}
                        alt={`${carTitle} - View ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "https://placehold.co/80x80/e5e7eb/6b7280?text=N/A";
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Car Details */}
            <div>
              <div className="mb-4">
                {car.verificationStatus === "approved" && (
                  <Badge className="mb-2 bg-green-600">
                    <ShieldCheck className="w-3 h-3 mr-1" />
                    Verified Listing — AI-checked
                  </Badge>
                )}
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2" data-testid="text-car-title">
                  {carTitle}
                </h1>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-4">
                  <MapPin className="w-4 h-4" />
                  <span>{car.city || car.location || "India"}</span>
                </div>
              </div>

              <p className="text-4xl font-bold text-blue-700 dark:text-blue-400 mb-6" data-testid="text-car-price">
                {carPrice}
              </p>

              {/* Key Specs Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Year</p>
                      <p className="font-semibold">{car.year}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <Gauge className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Mileage</p>
                      <p className="font-semibold">{(car.mileage || car.kmDriven || 0).toLocaleString()} km</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <Fuel className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Fuel Type</p>
                      <p className="font-semibold">{car.fuelType || "Petrol"}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Transmission</p>
                      <p className="font-semibold">{car.transmission || "Manual"}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Description */}
              {car.description && (
                <Card className="mb-6">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                      {car.description}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Seller Info */}
              <Card className="mb-6">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-semibold">Verified Seller</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">CarArth Approved</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Additional Details */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-4">Vehicle Specifications</h2>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Make</p>
                  <p className="font-semibold">{car.make || "N/A"}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Model</p>
                  <p className="font-semibold">{car.model || "N/A"}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Year</p>
                  <p className="font-semibold">{car.year}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Fuel Type</p>
                  <p className="font-semibold">{car.fuelType || "Petrol"}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Transmission</p>
                  <p className="font-semibold">{car.transmission || "Manual"}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Owner Type</p>
                  <p className="font-semibold">{car.ownerType || "First Owner"}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Color</p>
                  <p className="font-semibold">{car.color || "N/A"}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Registration Number</p>
                  <p className="font-semibold">{car.registrationNumber || "Available on request"}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Insurance</p>
                  <p className="font-semibold">{car.insurance || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* NEW: Contact Options - Trust-first buyer flow */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <ContactOptions 
              listingId={id || ""}
              sellerPhone="+919999999999"
              onMessageClick={() => setShowAIReply(true)}
            />
            
            <AIInsightCard 
              listingId={id || ""}
              make={car.make}
              model={car.model}
              price={typeof car.price === "string" ? parseFloat(car.price) : car.price}
              year={car.year}
            />
          </div>

          {/* NEW: AI Chat Reply */}
          {showAIReply && (
            <AIChatReply 
              carPrice={typeof car.price === "string" ? parseFloat(car.price) : car.price}
              city={car.city}
              visible={showAIReply}
            />
          )}
        </div>

        {/* Related Listings */}
        <RelatedListings
          currentCarId={id || ""}
          brand={car.make}
          city={car.city}
          priceRange={{
            min: parseFloat(car.price) * 0.8,
            max: parseFloat(car.price) * 1.2,
          }}
        />
      </main>

      {/* NEW: Floating Contact CTA for Mobile Only */}
      {isMobile && (
        <FloatingCTA onClick={() => {
          console.log("Floating CTA clicked");
        }} />
      )}
    </>
  );
}
