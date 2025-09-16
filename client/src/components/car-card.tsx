import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Heart, Calendar, Gauge, Fuel, Settings, MapPin, Star, Share2, User, Shield, Award, Phone, CheckCircle, AlertTriangle, X } from "lucide-react";
import { type CarListing } from "@shared/schema";
import SocialShare from "@/components/social-share";
import AuthenticityScoreDisplay from "@/components/authenticity-score";
import { FALLBACK_CAR_IMAGE_URL } from '@/lib/constants';
import { formatIndianCurrency } from "@/lib/loan";

interface CarCardProps {
  car: CarListing;
  onFavoriteToggle?: (carId: string) => void;
  isFavorite?: boolean;
  showAuthenticityScore?: boolean;
}

export default function CarCard({ car, onFavoriteToggle, isFavorite = false }: CarCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageAttempt, setImageAttempt] = useState(0);
  const [currentImageSrc, setCurrentImageSrc] = useState<string>('');

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

  // Enhanced helper function to get image source with intelligent fallbacks
  const getImageSrc = (images: string[] | null | undefined, fallbackIndex: number = 0): string => {
    // Final fallback after all attempts
    if (fallbackIndex >= 8) {
      console.log(`🚫 All attempts exhausted for ${car.title}, using FALLBACK_CAR_IMAGE_URL`);
      return FALLBACK_CAR_IMAGE_URL;
    }

    // If we've exhausted proxy attempts, use working car images
    if (fallbackIndex >= 3) {
      return getWorkingCarImageForCar(car, fallbackIndex - 3);
    }

    if (!images || !Array.isArray(images) || images.length === 0) {
      return getWorkingCarImageForCar(car, 0);
    }
    
    const imageUrl = images[0];
    
    // Skip known placeholder URLs
    if (isPlaceholderUrl(imageUrl)) {
      console.log(`🚫 Detected placeholder URL for ${car.title}: ${imageUrl}`);
      return getWorkingCarImageForCar(car, fallbackIndex);
    }
    
    // Check if it's an external trusted domain image
    const trustedDomains = [
      'images10.gaadi.com',
      'stimg.cardekho.com', 
      'stimg2.gaadi.com',
      'images.cars24.com',
      'img.cartrade.com',
      'cdn.droom.in'
    ];
    
    try {
      const url = new URL(imageUrl);
      if (trustedDomains.includes(url.hostname)) {
        // Use enhanced proxy with fallback parameter
        const params = new URLSearchParams({
          url: imageUrl,
          ...(fallbackIndex > 0 && { fallback: fallbackIndex.toString() })
        });
        return `/api/proxy/image?${params.toString()}`;
      }
    } catch (error) {
      console.log(`❌ Invalid URL for ${car.title}: ${imageUrl}`);
      return getWorkingCarImageForCar(car, fallbackIndex);
    }
    
    // For local images or other domains, use as-is
    return imageUrl;
  };

  // Get working car image based on car brand/model
  const getWorkingCarImageForCar = (car: CarListing, index: number = 0): string => {
    // Extract brand and model from car title
    const titleParts = car.title.toLowerCase().split(' ');
    const brand = titleParts[1] || 'maruti'; // Assume format like "2018 Maruti Swift"
    const model = titleParts[2] || 'alto';

    // Use enhanced proxy for working images too (to handle CORS)
    const workingImages = getWorkingImageUrls(brand, model);
    const selectedImage = workingImages[index % workingImages.length];
    
    return `/api/proxy/image?url=${encodeURIComponent(selectedImage)}`;
  };

  // Get working image URLs for specific brand/model combinations
  const getWorkingImageUrls = (brand: string, model: string): string[] => {
    const brandModel = `${brand.replace(/\s+/g, '_')}_${model.split(' ')[0]}`;
    
    const workingImages: { [key: string]: string[] } = {
      'maruti_alto': [
        'https://images10.gaadi.com/usedcar_image/4677649/original/processed_39653f1b-0b47-4cbe-8ba6-71f96c250b21.jpg?imwidth=400',
        'https://images10.gaadi.com/usedcar_image/4720431/original/processed_9b1a5bbdb32c131976dccd7b88ac65fe.jpg?imwidth=400'
      ],
      'maruti_swift': [
        'https://images10.gaadi.com/usedcar_image/4754653/original/013d8f9327e082b9ba10c09150677442.jpg?imwidth=400'
      ],
      'maruti_dzire': [
        'https://images10.gaadi.com/usedcar_image/4783272/original/processed_ba2465534ac359ec641f5afef68e531e.jpg?imwidth=400'
      ],
      'hyundai_i20': [
        'https://images10.gaadi.com/usedcar_image/4720431/original/processed_9b1a5bbdb32c131976dccd7b88ac65fe.jpg?imwidth=400'
      ],
      'honda_amaze': [
        'https://images10.gaadi.com/usedcar_image/4783272/original/processed_ba2465534ac359ec641f5afef68e531e.jpg?imwidth=400'
      ],
      'renault_kwid': [
        'https://images10.gaadi.com/usedcar_image/4601327/original/f158917d-5e4b-40b3-8cc1-ba55f1745135.png?imwidth=400'
      ]
    };

    return workingImages[brandModel] || workingImages['maruti_alto'];
  };

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

  // Handle image load failure with intelligent retry
  const handleImageError = () => {
    console.log(`❌ Image failed to load for ${car.title}, attempt ${imageAttempt + 1}`);
    
    if (imageAttempt < 8) { // Try up to 8 different images including final fallback
      const nextAttempt = imageAttempt + 1;
      setImageAttempt(nextAttempt);
      const nextImageSrc = getImageSrc(car.images as string[], nextAttempt);
      console.log(`🔄 Trying fallback image ${nextAttempt}: ${nextImageSrc}`);
      setCurrentImageSrc(nextImageSrc);
    } else {
      console.log(`❌ All image attempts failed for ${car.title}, using FALLBACK_CAR_IMAGE_URL`);
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
    <div className="car-card steel-gradient rounded-lg overflow-hidden border-2 border-steel-primary/30" data-testid={`card-car-${car.id}`}>
      {/* Portal listings don't have featured status */}
      <div className="relative overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        )}
        <img 
          src={currentImageSrc} 
          alt={car.title} 
          className={`w-full h-48 object-cover transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          data-testid={`img-car-${car.id}`}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold" data-testid={`text-title-${car.id}`}>
            {car.title}
          </h3>
          <button 
            onClick={() => onFavoriteToggle?.(car.id)}
            className={`${isFavorite ? 'text-accent' : 'text-muted-foreground hover:text-accent'} transition-colors`}
            data-testid={`button-favorite-${car.id}`}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>
        
        <p className="text-2xl font-bold text-accent mb-2" data-testid={`text-price-${car.id}`}>
          {formatIndianCurrency(parseFloat(car.price))}*
        </p>
        
        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            <span data-testid={`text-year-${car.id}`}>{car.year}</span>
          </div>
          <div className="flex items-center">
            <Gauge className="w-4 h-4 mr-1" />
            <span data-testid={`text-mileage-${car.id}`}>{formatMileage(car.mileage)}</span>
          </div>
          <div className="flex items-center">
            <Fuel className="w-4 h-4 mr-1" />
            <span data-testid={`text-fuel-${car.id}`}>{car.fuelType}</span>
          </div>
          <div className="flex items-center">
            <Settings className="w-4 h-4 mr-1" />
            <span data-testid={`text-transmission-${car.id}`}>{car.transmission}</span>
          </div>
        </div>
        
        {/* Portal Source Badge - Shows data source */}
        {car.portal && (
          <div className="mb-3">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/30" data-testid={`badge-source-${car.id}`}>
              {car.portal}
            </span>
          </div>
        )}

        {/* Seller Information - CarDekho inspired prominent display */}
        <div className="mb-4 space-y-2">
          {(() => {
            const sellerInfo = getSellerInfo(car.sellerType);
            const verificationBadge = getVerificationBadge(car.verificationStatus);
            const SellerIcon = sellerInfo.icon;
            
            return (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Seller Type Badge */}
                  <span 
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${sellerInfo.className}`}
                    data-testid={`badge-seller-type-${car.id}`}
                  >
                    <SellerIcon className="w-3 h-3 mr-1" />
                    {sellerInfo.label}
                    {sellerInfo.trusted && <Shield className="w-3 h-3 ml-1 text-green-600" />}
                  </span>

                  {/* Verification Badge */}
                  {verificationBadge && (
                    <span 
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${verificationBadge.className}`}
                      data-testid={`badge-verification-${car.id}`}
                    >
                      <verificationBadge.icon className="w-3 h-3 mr-1" />
                      {verificationBadge.label}
                    </span>
                  )}
                </div>

                {/* Contact Seller Button - CarDekho style */}
                <Button 
                  size="sm" 
                  variant="outline"
                  className="text-xs px-3 py-1 h-7 bg-green-50 hover:bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:hover:bg-green-900 dark:text-green-300 dark:border-green-800"
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
                className="btn-metallic px-4 py-2 text-sm font-semibold"
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
