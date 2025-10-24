import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { Heart, MapPin, Fuel, Settings, Calendar, Gauge, Star, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { type CarListing } from "@shared/schema";
import { formatIndianCurrency, calculateLoanDetails } from "@/lib/loan";
import { FALLBACK_CAR_IMAGE_URL } from '@/lib/constants';
import { useHapticFeedback, HapticButton } from "@/components/haptic-feedback";
import { getCarSource, getSourceBadgeColor } from "@/lib/car-utils";
import { cn } from "@/lib/utils";
import { ListingSourceBadge } from "@/components/ui/listing-source-badge";

interface MinimalCarCardProps {
  car: CarListing;
  onFavoriteToggle?: (carId: string) => void;
  isFavorite?: boolean;
  onContactSeller?: (carId: string) => void;
}

// Now using centralized helper from car-utils

export default function MinimalCarCard({ 
  car, 
  onFavoriteToggle, 
  isFavorite = false,
  onContactSeller 
}: MinimalCarCardProps) {
  const { feedback } = useHapticFeedback();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageAttempt, setImageAttempt] = useState(0);
  const [currentImageSrc, setCurrentImageSrc] = useState<string>('');

  // Simplified image handling with intelligent fallbacks
  const getImageSrc = (images: string[] | null | undefined, fallbackIndex: number = 0): string => {
    if (fallbackIndex >= 5) return FALLBACK_CAR_IMAGE_URL;
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      return FALLBACK_CAR_IMAGE_URL;
    }
    
    const imageUrl = images[0];
    
    // Check for placeholder patterns
    const placeholderPatterns = ['spacer3x2.png', 'CD-Shimmer.svg', 'placeholder.png'];
    const isPlaceholder = placeholderPatterns.some(pattern => 
      imageUrl.toLowerCase().includes(pattern.toLowerCase())
    );
    
    // PERMANENT FIX: No more misleading fallbacks! Show transparent "No Photo" instead.
    if (isPlaceholder) {
      return FALLBACK_CAR_IMAGE_URL; // Clear "No Image Available" message
    }
    
    // Use proxy for external images
    const trustedDomains = ['images10.gaadi.com', 'stimg.cardekho.com'];
    try {
      const url = new URL(imageUrl);
      if (trustedDomains.includes(url.hostname)) {
        return `/api/proxy/image?url=${encodeURIComponent(imageUrl)}`;
      }
    } catch {
      return FALLBACK_CAR_IMAGE_URL;
    }
    
    return imageUrl;
  };

  // REMOVED: getWorkingImageForBrand - NO MORE MISLEADING FALLBACKS
  // This function showed unrelated car images and completely undermined authenticity!
  // Now we show transparent "No verified photo" states instead of misleading images.

  const handleImageError = () => {
    if (imageAttempt < 4) {
      const nextAttempt = imageAttempt + 1;
      setImageAttempt(nextAttempt);
      setCurrentImageSrc(getImageSrc(car.images as string[], nextAttempt));
    } else {
      setCurrentImageSrc(FALLBACK_CAR_IMAGE_URL);
      setImageLoaded(true);
    }
  };

  useEffect(() => {
    const initialSrc = getImageSrc(car.images as string[], 0);
    setCurrentImageSrc(initialSrc);
    setImageLoaded(false);
    setImageAttempt(0);
  }, [car.id, car.images]);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    feedback.selection();
    onFavoriteToggle?.(car.id);
  };

  const handleContactClick = (e: React.MouseEvent) => {
    e.preventDefault();
    feedback.button();
    onContactSeller?.(car.id);
  };

  const formatMileage = (mileage: number | null) => {
    if (!mileage) return 'N/A';
    return mileage >= 1000 ? `${(mileage / 1000).toFixed(0)}k km` : `${mileage} km`;
  };

  // Now using centralized getSourceBadgeColor from car-utils

  return (
    <div className="group bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden h-full">
      {/* Image Container with Fixed Aspect Ratio */}
      <div className="relative">
        <AspectRatio ratio={4/3}>
          <img
            src={currentImageSrc}
            alt={car.title}
            className={cn(
              "w-full h-full object-cover transition-opacity duration-300",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setImageLoaded(true)}
            onError={handleImageError}
            data-testid={`img-car-${car.id}`}
          />
          
          {/* Loading State */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
              <div className="text-muted-foreground text-sm">Loading...</div>
            </div>
          )}

          {/* Source Badge with Haptic Feedback */}
          <div className="absolute top-2 left-2 flex gap-2">
            {getCarSource(car) && (
              <HapticButton
                onClick={() => {
                  // Different haptic patterns for different source types
                  const sourceLower = (getCarSource(car) || '').toLowerCase();
                  if (sourceLower.includes('maruti') || sourceLower.includes('true value')) {
                    feedback.success(); // Premium feel for OEM sources
                  } else if (sourceLower.includes('bank') || sourceLower.includes('auction')) {
                    feedback.notification(); // Official feel for institutional sources
                  } else {
                    feedback.selection(); // Standard feel for marketplace sources
                  }
                }}
                hapticType="selection"
                className="bg-transparent border-none p-0 hover:bg-transparent"
                aria-label={`Data source: ${getCarSource(car)} - tap for more info`}
              >
                <Badge 
                  className={cn(
                    "text-sm cursor-pointer hover:scale-105 transition-transform duration-200 shadow-sm font-medium",
                    getSourceBadgeColor(getCarSource(car))
                  )}
                  data-testid={`badge-source-${car.id}`}
                  title={`Sourced from: ${getCarSource(car)}`}
                >
                  {getCarSource(car)}
                </Badge>
              </HapticButton>
            )}
            
            {/* Telangana Market Intelligence Badge */}
            {car.state?.toLowerCase() === 'telangana' && (
              <Badge 
                className="bg-purple-600 text-white text-xs shadow-sm"
                data-testid={`badge-telangana-insights-${car.id}`}
                title="Market insights available for this vehicle"
              >
                📊 Insights
              </Badge>
            )}
          </div>

          {/* Favorite Button */}
          <button
            onClick={handleFavoriteClick}
            className="absolute top-2 right-2 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:bg-background transition-colors flex items-center justify-center touch-manipulation"
            data-testid={`button-favorite-${car.id}`}
          >
            <Heart 
              className={cn(
                "w-5 h-5 transition-colors",
                isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"
              )} 
            />
          </button>

          {/* Photo Verification Badge - PERMANENT FIX */}
          {currentImageSrc !== FALLBACK_CAR_IMAGE_URL ? (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs font-medium">
              <Star className="w-3 h-3 fill-current" />
              <span>Photos Verified</span>
            </div>
          ) : (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-md text-xs font-medium">
              <span>No Verified Photos</span>
            </div>
          )}
        </AspectRatio>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5">
        {/* Price - Primary Focus - Mobile Optimized */}
        <div className="mb-3">
          <div className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground whitespace-nowrap overflow-hidden text-ellipsis" data-testid={`text-price-${car.id}`}>
            {formatIndianCurrency(parseFloat(car.price))}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground mt-1 whitespace-nowrap overflow-hidden text-ellipsis">
            {(() => {
              const { monthlyEMI } = calculateLoanDetails(parseFloat(car.price), 9, 7);
              return `EMI from ${formatIndianCurrency(Number(monthlyEMI))}/mo`;
            })()}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-sm sm:text-base md:text-lg font-semibold text-foreground mb-2 line-clamp-2 leading-snug" data-testid={`text-title-${car.id}`}>
          {car.title}
        </h3>
        
        {/* Listing Source Badge */}
        <div className="mb-2 sm:mb-3">
          <ListingSourceBadge source={car.listingSource as any} size="sm" />
        </div>

        {/* Meta Information - Responsive Grid */}
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:flex-wrap text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="truncate">{car.year}</span>
          </div>
          <div className="flex items-center gap-1">
            <Gauge className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="truncate">{formatMileage(car.mileage)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Fuel className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="truncate">{car.fuelType}</span>
          </div>
          <div className="flex items-center gap-1">
            <Settings className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="truncate">{car.transmission}</span>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 min-w-0">
          <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
          <span className="truncate flex-1 min-w-0">{car.city}</span>
          {car.owners && (
            <>
              <span className="mx-1 sm:mx-2 flex-shrink-0">•</span>
              <span className="whitespace-nowrap flex-shrink-0">{car.owners === 1 ? '1st Owner' : `${car.owners} Owners`}</span>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 sm:gap-3">
          <Link 
            href={`/car/${car.id}`} 
            className="flex-1"
            onClick={() => feedback.navigation()}
          >
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-sm sm:text-base min-h-[44px] font-medium"
              data-testid={`button-view-details-${car.id}`}
            >
              View Details
            </Button>
          </Link>
          
          <HapticButton
            onClick={handleContactClick}
            variant="primary"
            size="sm"
            className="flex-1 text-sm sm:text-base min-h-[44px] font-medium"
            hapticType="button"
            data-testid={`button-contact-${car.id}`}
          >
            <Phone className="w-4 h-4 mr-1" />
            Contact
          </HapticButton>
        </div>
      </div>
    </div>
  );
}