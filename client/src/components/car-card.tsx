import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Heart, Calendar, Gauge, Fuel, Settings, MapPin } from "lucide-react";
import { type Car } from "@shared/schema";

interface CarCardProps {
  car: Car;
  onFavoriteToggle?: (carId: string) => void;
  isFavorite?: boolean;
}

export default function CarCard({ car, onFavoriteToggle, isFavorite = false }: CarCardProps) {
  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price);
    if (numPrice >= 1) {
      return `₹${numPrice.toFixed(2)} Lakh`;
    } else {
      return `₹${(numPrice * 100).toFixed(0)} Thousand`;
    }
  };

  const formatMileage = (mileage: number) => {
    if (mileage >= 1000) {
      return `${(mileage / 1000).toFixed(0)}k km`;
    }
    return `${mileage.toLocaleString()} km`;
  };

  return (
    <div className="car-card steel-gradient rounded-lg overflow-hidden border-2 border-steel-primary/30" data-testid={`card-car-${car.id}`}>
      <img 
        src={(car.images && car.images[0]) || "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300"} 
        alt={car.title} 
        className="w-full h-48 object-cover"
        data-testid={`img-car-${car.id}`}
      />
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
          {formatPrice(car.price)}
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
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground flex items-center">
            <MapPin className="w-4 h-4 mr-1" />
            <span data-testid={`text-location-${car.id}`}>{car.city}, {car.state}</span>
          </span>
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
  );
}
