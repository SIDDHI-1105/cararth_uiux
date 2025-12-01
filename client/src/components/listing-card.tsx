// FILE: client/src/components/listing-card.tsx – Luxury Glassmorphic redesign applied

import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, MapPin, Fuel, Gauge, Calendar } from "lucide-react";
import { TrustScoreCard } from "@/components/TrustScoreCard";

interface TrustScoreBreakdown {
  price: number;
  recency: number;
  demand: number;
  completeness: number;
  imageQuality: number;
  sellerTrust: number;
  googleCompliance?: number;
}

interface ListingCardProps {
  id: string;
  image: string;
  title: string;
  price: number;
  year: number;
  mileage?: number;
  fuelType: string;
  transmission: string;
  city: string;
  sellerType?: "verified" | "dealer" | "private";
  isVerified?: boolean;
  listingSource?: "ethical_ai" | "exclusive_dealer" | "user_direct";
  listingScore?: number;
  googleCompliant?: boolean;
  priceFairnessLabel?: string;
  trustScore?: number;
  trustScoreLabel?: 'Excellent' | 'Good' | 'Fair' | 'Needs Review';
  trustScoreColor?: 'green' | 'blue' | 'yellow' | 'orange';
  trustScoreBreakdown?: TrustScoreBreakdown;
}

export function ListingCard({
  id,
  image,
  title,
  price,
  year,
  mileage,
  fuelType,
  transmission,
  city,
  sellerType = "private",
  isVerified = false,
  listingSource = "user_direct",
  listingScore,
  googleCompliant,
  priceFairnessLabel,
  trustScore,
  trustScoreLabel,
  trustScoreColor,
  trustScoreBreakdown,
}: ListingCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatMileage = (km?: number) => {
    if (!km) return "N/A";
    return `${km.toLocaleString("en-IN")} km`;
  };

  const getSourceBadge = () => {
    switch (listingSource) {
      case "ethical_ai":
        return {
          text: "🧠 Ethical AI",
          className: "bg-green-500/90 text-white dark:bg-green-600/90",
        };
      case "exclusive_dealer":
        return {
          text: "🤝 Dealer",
          className: "bg-blue-500/90 text-white dark:bg-blue-600/90",
        };
      case "user_direct":
      default:
        return {
          text: "👤 User",
          className: "bg-orange-500/90 text-white dark:bg-orange-600/90",
        };
    }
  };

  const sourceBadge = getSourceBadge();

  return (
    <div
      className="glass-card-premium group overflow-hidden transition-all duration-500 hover:scale-[1.03] animate-slide-in-up"
      data-testid={`card-listing-${id}`}
      style={{
        animationDelay: `${Math.random() * 0.2}s`
      }}
    >
      <Link href={`/listing/${id}`} className="block">
        {/* Image Container with Overlay Gradient */}
        <div className="relative overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-56 object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = "https://placehold.co/400x300/e5e7eb/6b7280?text=No+Image";
            }}
          />

          {/* Gradient Overlay on Hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Source Badge - Floating with Backdrop Blur */}
          <div
            className={`absolute top-3 left-3 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-[20px] shadow-xl transition-all duration-500 group-hover:scale-110 ${sourceBadge.className}`}
            data-testid="badge-source"
          >
            {sourceBadge.text}
          </div>

          {/* Top Right Badges - Floating Glass Pills */}
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            {googleCompliant && (
              <div
                className="bg-blue-600/95 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 backdrop-blur-[20px] shadow-xl transition-all duration-500 group-hover:scale-110"
                data-testid="badge-google-ready"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google Ready
              </div>
            )}
            {isVerified && (
              <div className="bg-green-600/95 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 backdrop-blur-[20px] shadow-xl transition-all duration-500 group-hover:scale-110">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified
              </div>
            )}
          </div>
        </div>

        {/* Card Content - Premium Spacing */}
        <div className="p-6 space-y-4">
          {/* Title with Hover Effect */}
          <h3
            className="font-bold text-gray-900 dark:text-gray-100 text-lg line-clamp-1 group-hover:text-[#0071E3] transition-colors duration-300"
            data-testid="text-listing-title"
          >
            {title}
          </h3>

          {/* Price and Score Row */}
          <div className="flex items-center justify-between">
            <p
              className="text-blue-700 dark:text-blue-400 font-black text-2xl"
              data-testid="text-listing-price"
              style={{
                textShadow: '0 0 20px rgba(0, 113, 227, 0.2)'
              }}
            >
              {formatPrice(price)}
            </p>
            {listingScore && listingScore >= 80 && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 backdrop-blur-sm border border-yellow-500/20">
                <span className="text-yellow-500 text-lg">⭐</span>
                <span className="font-black text-gray-700 dark:text-gray-300">{Math.round(listingScore)}</span>
              </div>
            )}
          </div>

          {/* Price Fairness Label */}
          {priceFairnessLabel && (
            <p className="text-sm text-green-600 dark:text-green-400 font-bold">
              {priceFairnessLabel}
            </p>
          )}

          {/* Specs Grid - Premium Glass Tiles */}
          <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-400">
            <div
              className="flex items-center gap-2 p-3 rounded-2xl backdrop-blur-md border transition-all duration-300 hover:scale-105 hover:shadow-lg group/spec"
              style={{
                backgroundColor: 'rgba(0, 113, 227, 0.05)',
                borderColor: 'rgba(0, 113, 227, 0.1)'
              }}
            >
              <Calendar className="w-4 h-4 text-blue-500 group-hover/spec:scale-110 transition-transform duration-300" />
              <span className="font-semibold">{year}</span>
            </div>
            <div
              className="flex items-center gap-2 p-3 rounded-2xl backdrop-blur-md border transition-all duration-300 hover:scale-105 hover:shadow-lg group/spec"
              style={{
                backgroundColor: 'rgba(0, 245, 160, 0.05)',
                borderColor: 'rgba(0, 245, 160, 0.1)'
              }}
            >
              <Gauge className="w-4 h-4 text-green-500 group-hover/spec:scale-110 transition-transform duration-300" />
              <span className="font-semibold">{formatMileage(mileage)}</span>
            </div>
            <div
              className="flex items-center gap-2 p-3 rounded-2xl backdrop-blur-md border transition-all duration-300 hover:scale-105 hover:shadow-lg group/spec"
              style={{
                backgroundColor: 'rgba(255, 107, 53, 0.05)',
                borderColor: 'rgba(255, 107, 53, 0.1)'
              }}
            >
              <Fuel className="w-4 h-4 text-orange-500 group-hover/spec:scale-110 transition-transform duration-300" />
              <span className="font-semibold">{fuelType}</span>
            </div>
            <div
              className="flex items-center gap-2 p-3 rounded-2xl backdrop-blur-md border transition-all duration-300 hover:scale-105 hover:shadow-lg group/spec"
              style={{
                backgroundColor: 'rgba(147, 51, 234, 0.05)',
                borderColor: 'rgba(147, 51, 234, 0.1)'
              }}
            >
              <span className="text-sm text-purple-500 group-hover/spec:scale-110 transition-transform duration-300">⚙️</span>
              <span className="font-semibold">{transmission}</span>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
            <MapPin className="w-4 h-4" />
            <span>{city}</span>
          </div>

          {/* Trust Score Card */}
          {trustScore && trustScoreLabel && trustScoreColor && trustScoreBreakdown && (
            <div>
              <TrustScoreCard
                overall={trustScore}
                label={trustScoreLabel}
                color={trustScoreColor}
                breakdown={trustScoreBreakdown}
              />
            </div>
          )}

          {/* Footer - Seller Badge and CTA */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-800">
            <Badge
              variant={sellerType === "verified" ? "default" : "secondary"}
              className="text-xs font-bold px-3 py-1"
            >
              {sellerType === "verified" && "✅ "}
              {sellerType === "dealer" ? "Dealer" : sellerType === "verified" ? "Verified Seller" : "Private Owner"}
            </Badge>
            <span
              className="text-blue-700 dark:text-blue-400 font-bold hover:underline text-sm transition-all duration-300 group-hover:translate-x-2"
              data-testid="link-view-details"
            >
              View Details →
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
