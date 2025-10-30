import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, MapPin, Fuel, Gauge, Calendar } from "lucide-react";

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
          text: "🧠 CarArthX Ethical AI",
          className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
        };
      case "exclusive_dealer":
        return {
          text: "🤝 CarArthX Exclusive Dealer",
          className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
        };
      case "user_direct":
      default:
        return {
          text: "👤 CarArthX User",
          className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
        };
    }
  };

  const sourceBadge = getSourceBadge();

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 border border-gray-200 dark:border-gray-800" data-testid={`card-listing-${id}`}>
      <Link href={`/listing/${id}`} className="block">
        <div className="relative">
          <img
            src={image}
            alt={title}
            className="w-full h-48 object-cover"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = "https://placehold.co/400x300/e5e7eb/6b7280?text=No+Image";
            }}
          />
          {/* Source Badge */}
          <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-bold ${sourceBadge.className}`} data-testid="badge-source">
            {sourceBadge.text}
          </div>
          {/* Top Right Badges */}
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            {googleCompliant && (
              <div className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1" data-testid="badge-google-ready">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google Ready
              </div>
            )}
            {isVerified && (
              <div className="bg-green-600 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Verified
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-1" data-testid="text-listing-title">
            {title}
          </h3>
          
          <div className="flex items-center justify-between mb-3">
            <p className="text-blue-700 dark:text-blue-400 font-bold text-xl" data-testid="text-listing-price">
              {formatPrice(price)}
            </p>
            {listingScore && listingScore >= 80 && (
              <div className="flex items-center gap-1 text-sm">
                <span className="text-yellow-500">⭐</span>
                <span className="font-semibold text-gray-700 dark:text-gray-300">{Math.round(listingScore)}</span>
              </div>
            )}
          </div>
          
          {priceFairnessLabel && (
            <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-2">
              {priceFairnessLabel}
            </p>
          )}
          
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{year}</span>
            </div>
            <div className="flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5" />
              <span>{formatMileage(mileage)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Fuel className="w-3.5 h-3.5" />
              <span>{fuelType}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs">⚙️</span>
              <span>{transmission}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-3">
            <MapPin className="w-3.5 h-3.5" />
            <span>{city}</span>
          </div>
          
          <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-800">
            <Badge variant={sellerType === "verified" ? "default" : "secondary"} className="text-xs">
              {sellerType === "verified" && "✅ "}{sellerType === "dealer" ? "Dealer" : sellerType === "verified" ? "Verified Seller" : "Private Owner"}
            </Badge>
            <span className="text-blue-700 dark:text-blue-400 font-medium hover:underline text-sm" data-testid="link-view-details">
              View Details →
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
