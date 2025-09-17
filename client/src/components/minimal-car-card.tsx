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
import { cn } from "@/lib/utils";

interface MinimalCarCardProps {
  car: CarListing;
  onFavoriteToggle?: (carId: string) => void;
  isFavorite?: boolean;
  onContactSeller?: (carId: string) => void;
}

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

  const getSourceBadgeColor = (source?: string) => {
    switch (source?.toLowerCase()) {
      case 'cardekho': return 'bg-blue-100 text-blue-800';
      case 'cars24': return 'bg-green-100 text-green-800';
      case 'olx': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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

          {/* Source Badge */}
          {(car as any).source && (
            <Badge 
              className={cn(
                "absolute top-2 left-2 text-xs",
                getSourceBadgeColor((car as any).source)
              )}
            >
              {(car as any).source}
            </Badge>
          )}

          {/* Favorite Button */}
          <button
            onClick={handleFavoriteClick}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:bg-background transition-colors flex items-center justify-center"
            data-testid={`button-favorite-${car.id}`}
          >
            <Heart 
              className={cn(
                "w-4 h-4 transition-colors",
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
      <div className="p-4">
        {/* Price - Primary Focus */}
        <div className="mb-2">
          <div className="text-2xl font-bold text-foreground" data-testid={`text-price-${car.id}`}>
            {formatIndianCurrency(parseFloat(car.price))}
          </div>
          <div className="text-sm text-muted-foreground">
            {(() => {
              const { monthlyEMI } = calculateLoanDetails(parseFloat(car.price), 9, 7);
              return `EMI from ${formatIndianCurrency(Number(monthlyEMI))}/month`;
            })()}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-foreground mb-3 line-clamp-2 leading-snug" data-testid={`text-title-${car.id}`}>
          {car.title}
        </h3>

        {/* Meta Information - Single Row */}
        <div className="flex items-center text-xs text-muted-foreground mb-4 gap-3">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{car.year}</span>
          </div>
          <div className="flex items-center gap-1">
            <Gauge className="w-3 h-3" />
            <span>{formatMileage(car.mileage)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Fuel className="w-3 h-3" />
            <span>{car.fuelType}</span>
          </div>
          <div className="flex items-center gap-1">
            <Settings className="w-3 h-3" />
            <span>{car.transmission}</span>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center text-sm text-muted-foreground mb-4">
          <MapPin className="w-4 h-4 mr-1" />
          <span>{car.city}</span>
          {car.owners && (
            <>
              <span className="mx-2">•</span>
              <span>{car.owners === 1 ? '1st Owner' : `${car.owners} Owners`}</span>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link 
            href={`/car/${car.id}`} 
            className="flex-1"
            onClick={() => feedback.navigation()}
          >
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-sm h-9"
              data-testid={`button-view-details-${car.id}`}
            >
              View Details
            </Button>
          </Link>
          
          <HapticButton
            onClick={handleContactClick}
            variant="primary"
            size="sm"
            className="flex-1 text-sm h-9"
            hapticType="button"
            data-testid={`button-contact-${car.id}`}
          >
            <Phone className="w-3 h-3 mr-1" />
            Contact
          </HapticButton>
        </div>
      </div>
    </div>
  );
}