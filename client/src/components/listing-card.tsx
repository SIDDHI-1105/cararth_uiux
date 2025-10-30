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

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 border border-gray-200 dark:border-gray-800" data-testid={`card-listing-${id}`}>
      <Link href={`/listing/${id}`}>
        <a className="block">
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
            {isVerified && (
              <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Verified
              </div>
            )}
          </div>
          
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-1" data-testid="text-listing-title">
              {title}
            </h3>
            
            <p className="text-blue-700 dark:text-blue-400 font-bold text-xl mb-3" data-testid="text-listing-price">
              {formatPrice(price)}
            </p>
            
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
        </a>
      </Link>
    </div>
  );
}
