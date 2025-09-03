import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  Gauge, 
  Fuel, 
  Settings, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  Award,
  Shield,
  ExternalLink,
  Heart,
  Share,
  Camera,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface CarDetailModalProps {
  car: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function CarDetailModal({ car, isOpen, onClose }: CarDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  if (!car) return null;

  const images = car.images || [car.images?.[0] || '/attached_assets/generated_images/Chrome_sedan_car_silhouette_834bc875.png'];

  const formatPrice = (price: number) => {
    return `₹${(price / 100000).toFixed(1)}L`;
  };

  const formatMileage = (mileage: number) => {
    return `${(mileage / 1000).toFixed(0)}k km`;
  };

  const getVerificationIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <Shield className="w-4 h-4 text-green-600" />;
      case 'certified':
        return <Award className="w-4 h-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{car.title}</span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFavorite(!isFavorite)}
                className={isFavorite ? "text-red-500" : ""}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
              </Button>
              <Button variant="ghost" size="sm">
                <Share className="w-4 h-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative">
              <img
                src={images[currentImageIndex]}
                alt={car.title}
                className="w-full h-64 object-cover rounded-lg"
              />
              {images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                    onClick={nextImage}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((image: string, index: number) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${car.title} - ${index + 1}`}
                    className={`w-16 h-12 object-cover rounded cursor-pointer border-2 ${
                      index === currentImageIndex ? 'border-primary' : 'border-gray-200'
                    }`}
                    onClick={() => setCurrentImageIndex(index)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Car Details */}
          <div className="space-y-6">
            {/* Price and Source */}
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-accent">
                {formatPrice(car.price)}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{car.source}</Badge>
                {getVerificationIcon(car.verificationStatus)}
                <Badge className={
                  car.condition === 'Excellent' ? 'bg-green-100 text-green-800' :
                  car.condition === 'Good' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }>
                  {car.condition}
                </Badge>
              </div>
            </div>

            {/* Key Specifications */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Year</div>
                  <div className="font-medium">{car.year}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Gauge className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Mileage</div>
                  <div className="font-medium">{formatMileage(car.mileage)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Fuel className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Fuel Type</div>
                  <div className="font-medium">{car.fuelType}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Transmission</div>
                  <div className="font-medium">{car.transmission}</div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Location and Seller */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <span>{car.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-muted-foreground" />
                <span className="capitalize">{car.sellerType}</span>
              </div>
            </div>

            <Separator />

            {/* Features */}
            {car.features && car.features.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Features</h4>
                <div className="flex flex-wrap gap-2">
                  {car.features.map((feature: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Description */}
            {car.description && (
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {car.description}
                </p>
              </div>
            )}

            <Separator />

            {/* Contact Actions */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button className="flex-1" size="lg">
                  <Phone className="w-4 h-4 mr-2" />
                  Call Seller
                </Button>
                <Button variant="outline" className="flex-1" size="lg">
                  <Mail className="w-4 h-4 mr-2" />
                  Message
                </Button>
              </div>
              
              {car.url && (
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => window.open(car.url, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on {car.source}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}