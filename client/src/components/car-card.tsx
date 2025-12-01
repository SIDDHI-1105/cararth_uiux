import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Calendar, Gauge, Fuel, Settings, MapPin, User, Shield, Award, Phone } from "lucide-react";
import { type CarListing } from "@shared/schema";
import SocialShare from "@/components/social-share";
import { FALLBACK_CAR_IMAGE_URL } from '@/lib/constants';
import { formatIndianCurrency } from "@/lib/loan";
import { useHapticFeedback, HapticButton } from "@/components/haptic-feedback";
import { getCarSource, getSourceBadgeColor } from "@/lib/car-utils";
import { cn } from "@/lib/utils";

interface CarCardProps {
  car: CarListing;
  onFavoriteToggle?: (carId: string) => void;
  isFavorite?: boolean;
  showAuthenticityScore?: boolean;
}

// Now using centralized helper from car-utils

export default function CarCard({ car, onFavoriteToggle, isFavorite = false }: CarCardProps) {
  const { feedback } = useHapticFeedback();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageAttempt, setImageAttempt] = useState(0);
  const [currentImageSrc, setCurrentImageSrc] = useState<string>('');

  // Now using centralized getSourceBadgeColor from car-utils

  // Check if URL is a known placeholder/spacer image
  const isPlaceholderUrl = (url: string): boolean => {
    const placeholderPatterns = [
      'spacer3x2.png',
      'CD-Shimmer.svg',
      'placeholder.png',
      'no-image.png',
      'default-car.png',
      'loading.gif',
      'shimmer.svg',
      '1x1.png',
      'transparent.png'
    ];

    return placeholderPatterns.some(pattern =>
      url.toLowerCase().includes(pattern.toLowerCase())
    );
  };

  // Simplified image handling with intelligent fallbacks - AUTHENTICITY FIRST
  const getImageSrc = (images: string[] | null | undefined, fallbackIndex: number = 0): string => {
    // Final fallback after all attempts
    if (fallbackIndex >= 5) {
      return FALLBACK_CAR_IMAGE_URL;
    }

    if (!images || !Array.isArray(images) || images.length === 0) {
      return FALLBACK_CAR_IMAGE_URL;
    }

    const imageUrl = images[0];

    // Skip known placeholder URLs - PERMANENT FIX: No more misleading fallbacks!
    if (isPlaceholderUrl(imageUrl)) {
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

  // REMOVED: getWorkingCarImageForCar - NO MORE MISLEADING FALLBACKS
  // This function showed unrelated car images and completely undermined authenticity!
  // Now we show transparent "No verified photo" states instead of misleading images.

  // Enhanced image load handler with dimension verification
  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    const { naturalWidth, naturalHeight } = img;

    // Check if image is too small (likely a placeholder/spacer)
    if (naturalWidth <= 50 || naturalHeight <= 50) {
      console.log(`🚫 Detected small placeholder image for ${car.title}: ${naturalWidth}x${naturalHeight}`);
      handleImageError();
      return;
    }

    // Check if image has suspicious aspect ratio (likely a spacer)
    const aspectRatio = naturalWidth / naturalHeight;
    if (aspectRatio > 10 || aspectRatio < 0.1) {
      console.log(`🚫 Detected suspicious aspect ratio for ${car.title}: ${aspectRatio}`);
      handleImageError();
      return;
    }

    console.log(`✅ Valid image loaded for ${car.title}: ${naturalWidth}x${naturalHeight} (${currentImageSrc})`);
    setImageLoaded(true);
  };

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

  // Initialize image source
  useEffect(() => {
    const initialSrc = getImageSrc(car.images as string[], 0);
    setCurrentImageSrc(initialSrc);
    setImageLoaded(false);
    setImageAttempt(0);
  }, [car.id, car.images]);

  useEffect(() => {
    // Track recently viewed cars
    const viewedCars = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    const updatedViewed = [car.id, ...viewedCars.filter((id: string) => id !== car.id)].slice(0, 6);
    localStorage.setItem('recentlyViewed', JSON.stringify(updatedViewed));
  }, [car.id]);

  const formatMileage = (mileage: number | null) => {
    if (!mileage) return 'N/A';
    if (mileage >= 1000) {
      return `${(mileage / 1000).toFixed(0)}k km`;
    }
    return `${mileage.toLocaleString()} km`;
  };

  // Helper function to get seller type styling and icon - CarDekho inspired
  const getSellerInfo = (sellerType: string | null | undefined) => {
    switch (sellerType?.toLowerCase()) {
      case 'individual':
        return {
          label: 'Individual',
          icon: User,
          className: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
          trusted: true
        };
      case 'dealer':
        return {
          label: 'Dealer',
          icon: Shield,
          className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
          trusted: true
        };
      case 'oem':
        return {
          label: 'OEM Partner',
          icon: Award,
          className: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
          trusted: true
        };
      default:
        return {
          label: 'Dealer',
          icon: Shield,
          className: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800',
          trusted: false
        };
    }
  };

  // Get verification badge info
  const getVerificationBadge = (status: string | null | undefined) => {
    switch (status?.toLowerCase()) {
      case 'verified':
        return {
          label: 'Verified',
          className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
          icon: Shield
        };
      case 'certified':
        return {
          label: 'Certified',
          className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
          icon: Award
        };
      default:
        return null;
    }
  };

  return (
    <div
      className="car-card backdrop-blur-[12px] rounded-3xl border overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-glow"
      style={{
        backgroundColor: 'var(--glass-bg)',
        borderColor: 'var(--glass-border)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}
      data-testid={`card-car-${car.id}`}
    >
      {/* Portal listings don't have featured status */}
      <div className="relative overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center backdrop-blur-sm">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        )}
        <img
          src={currentImageSrc}
          alt={car.title}
          className={`w-full h-48 object-cover transition-all duration-500 ${
            imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
          data-testid={`img-car-${car.id}`}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />

        {/* Source Badge with Haptic Feedback - Glassmorphic */}
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
            className="absolute top-3 left-3 bg-transparent border-none p-0 hover:bg-transparent"
            aria-label={`Data source: ${getCarSource(car)} - tap for more info`}
          >
            <Badge
              className={cn(
                "text-sm cursor-pointer hover:scale-105 transition-all duration-200 font-medium backdrop-blur-md shadow-lg",
                getSourceBadgeColor(getCarSource(car))
              )}
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                borderColor: 'rgba(255, 255, 255, 0.2)'
              }}
              data-testid={`badge-source-${car.id}`}
              title={`Sourced from: ${getCarSource(car)}`}
            >
              {getCarSource(car)}
            </Badge>
          </HapticButton>
        )}

        {/* Favorite Button - Glassmorphic */}
        <button
          onClick={() => onFavoriteToggle?.(car.id)}
          className="absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all duration-300 hover:scale-110"
          style={{
            backgroundColor: isFavorite ? 'rgba(239, 68, 68, 0.15)' : 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
          data-testid={`button-favorite-${car.id}`}
        >
          <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`} />
        </button>
      </div>

      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold text-foreground" data-testid={`text-title-${car.id}`}>
            {car.title}
          </h3>
        </div>

        <p className="text-2xl font-bold text-accent mb-4" data-testid={`text-price-${car.id}`}>
          {formatIndianCurrency(parseFloat(car.price))}*
        </p>

        {/* Car specs grid - Glassmorphic */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div
            className="flex items-center gap-2 p-2 rounded-xl backdrop-blur-sm border transition-all duration-300 hover:scale-105"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderColor: 'rgba(255, 255, 255, 0.1)'
            }}
          >
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-foreground" data-testid={`text-year-${car.id}`}>{car.year}</span>
          </div>
          <div
            className="flex items-center gap-2 p-2 rounded-xl backdrop-blur-sm border transition-all duration-300 hover:scale-105"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderColor: 'rgba(255, 255, 255, 0.1)'
            }}
          >
            <Gauge className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-foreground" data-testid={`text-mileage-${car.id}`}>{formatMileage(car.mileage)}</span>
          </div>
          <div
            className="flex items-center gap-2 p-2 rounded-xl backdrop-blur-sm border transition-all duration-300 hover:scale-105"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderColor: 'rgba(255, 255, 255, 0.1)'
            }}
          >
            <Fuel className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-foreground" data-testid={`text-fuel-${car.id}`}>{car.fuelType}</span>
          </div>
          <div
            className="flex items-center gap-2 p-2 rounded-xl backdrop-blur-sm border transition-all duration-300 hover:scale-105"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderColor: 'rgba(255, 255, 255, 0.1)'
            }}
          >
            <Settings className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-foreground" data-testid={`text-transmission-${car.id}`}>{car.transmission}</span>
          </div>
        </div>

        {/* Source badge moved to image overlay for consistency */}

        {/* Seller Information - Glassmorphic */}
        <div className="mb-4 space-y-2">
          {(() => {
            const sellerInfo = getSellerInfo(car.sellerType);
            const verificationBadge = getVerificationBadge(car.verificationStatus);
            const SellerIcon = sellerInfo.icon;

            return (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Seller Type Badge - Glassmorphic */}
                  <span
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border backdrop-blur-sm ${sellerInfo.className}`}
                    data-testid={`badge-seller-type-${car.id}`}
                  >
                    <SellerIcon className="w-3 h-3 mr-1" />
                    {sellerInfo.label}
                    {sellerInfo.trusted && <Shield className="w-3 h-3 ml-1 text-green-600" />}
                  </span>

                  {/* Verification Badge - Glassmorphic */}
                  {verificationBadge && (
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${verificationBadge.className}`}
                      data-testid={`badge-verification-${car.id}`}
                    >
                      <verificationBadge.icon className="w-3 h-3 mr-1" />
                      {verificationBadge.label}
                    </span>
                  )}
                </div>

                {/* Contact Seller Button - Glassmorphic */}
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs px-3 py-1.5 h-8 backdrop-blur-sm bg-green-50/50 hover:bg-green-100/70 text-green-700 border-green-200 dark:bg-green-950/50 dark:hover:bg-green-900/70 dark:text-green-300 dark:border-green-800 transition-all duration-300"
                  data-testid={`button-contact-seller-${car.id}`}
                >
                  <Phone className="w-3 h-3 mr-1" />
                  Contact
                </Button>
              </div>
            );
          })()}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground flex items-center">
            <MapPin className="w-4 h-4 mr-1" />
            <span data-testid={`text-location-${car.id}`}>{car.city}, {car.state}</span>
          </span>
          <div className="flex gap-2">
            <SocialShare
              url={`/car/${car.id}`}
              title={car.title}
              description={`${car.year} ${car.title} - ${formatIndianCurrency(parseFloat(car.price))} | ${car.city}, ${car.state}`}
            />
            <Link href={`/car/${car.id}`}>
              <Button
                size="sm"
                className="btn-primary px-4 py-2 text-sm font-semibold shadow-lg hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300"
                data-testid={`button-view-details-${car.id}`}
              >
                View Details
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
