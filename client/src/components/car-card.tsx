import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Heart, Calendar, Gauge, Fuel, Settings, MapPin, Star, Share2 } from "lucide-react";
import { type CarListing } from "@shared/schema";
import SocialShare from "@/components/social-share";
import { FALLBACK_CAR_IMAGE_URL } from '@/lib/constants';

interface CarCardProps {
  car: CarListing;
  onFavoriteToggle?: (carId: string) => void;
  isFavorite?: boolean;
}

export default function CarCard({ car, onFavoriteToggle, isFavorite = false }: CarCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  // Helper function to get image source with proxy for external URLs
  const getImageSrc = (images: string[] | null | undefined): string => {
    if (!images || !Array.isArray(images) || images.length === 0) {
      return FALLBACK_CAR_IMAGE_URL;
    }
    
    const imageUrl = images[0];
    
    // Check if it's an external CarDekho or other trusted domain image
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
        // Use proxy to bypass CORS for external images
        return `/api/proxy/image?url=${encodeURIComponent(imageUrl)}`;
      }
    } catch (error) {
      // Invalid URL, use fallback
      return FALLBACK_CAR_IMAGE_URL;
    }
    
    // For local images or other domains, use as-is
    return imageUrl;
  };
  
  useEffect(() => {
    // Track recently viewed cars
    const viewedCars = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    const updatedViewed = [car.id, ...viewedCars.filter((id: string) => id !== car.id)].slice(0, 6);
    localStorage.setItem('recentlyViewed', JSON.stringify(updatedViewed));
  }, [car.id]);
  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price);
    if (numPrice >= 1) {
      return `₹${numPrice.toFixed(2)} Lakh`;
    } else {
      return `₹${(numPrice * 100).toFixed(0)} Thousand`;
    }
  };

  const formatMileage = (mileage: number | null) => {
    if (!mileage) return 'N/A';
    if (mileage >= 1000) {
      return `${(mileage / 1000).toFixed(0)}k km`;
    }
    return `${mileage.toLocaleString()} km`;
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
          src={getImageSrc(car.images as string[])} 
          alt={car.title} 
          className={`w-full h-48 object-cover transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          data-testid={`img-car-${car.id}`}
          onLoad={() => {
            console.log(`✅ Image loaded successfully for ${car.title}:`, getImageSrc(car.images as string[]));
            setImageLoaded(true);
          }}
          onError={(e) => {
            console.error(`❌ Image failed to load for ${car.title}:`, getImageSrc(car.images as string[]));
            console.error('Error details:', e);
            e.currentTarget.src = FALLBACK_CAR_IMAGE_URL;
            setImageLoaded(true);
          }}
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
          {formatPrice(car.price)}*
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
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground flex items-center">
            <MapPin className="w-4 h-4 mr-1" />
            <span data-testid={`text-location-${car.id}`}>{car.city}, {car.state}</span>
          </span>
          <div className="flex gap-2">
            <SocialShare 
              url={`/car/${car.id}`}
              title={car.title}
              description={`${car.year} ${car.title} - ${formatPrice(car.price)} | ${car.city}, ${car.state}`}
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
