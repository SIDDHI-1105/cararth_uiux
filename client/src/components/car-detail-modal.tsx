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
  ChevronRight,
  CheckCircle,
  ThumbsUp,
  ThumbsDown,
  Star,
  TrendingUp,
  Info
} from "lucide-react";
import SocialShare from "@/components/social-share";
import { FALLBACK_CAR_IMAGE_URL } from '@/lib/constants';

interface CarDetailModalProps {
  car: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function CarDetailModal({ car, isOpen, onClose }: CarDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  if (!car) return null;

  // REAL MARKET ANALYSIS - No more AI hallucinations!
  const getRealMarketInsights = (car: any) => {
    // Use real data based on actual car properties
    const carAge = new Date().getFullYear() - car.year;
    const mileagePerYear = car.mileage / Math.max(1, carAge);
    
    // Real verification status based on actual data sources
    const verificationStatus = car.verificationStatus || 'unverified';
    const dataSource = car.source || 'Unknown';
    
    // Real insights based on actual car condition
    const insights = {
      verificationLevel: verificationStatus === 'verified' ? 'high' : 
                        dataSource === 'CarDekho' ? 'medium' : 'basic',
      dataQuality: car.images && car.images.length > 0 ? 'good' : 'limited',
      marketPosition: car.price < 500000 ? 'entry-level' : 
                     car.price < 1500000 ? 'mid-range' : 'premium',
      
      // Real observations based on data
      observations: [] as string[],
      considerations: [] as string[]
    };

    // Real observations based on actual data
    if (mileagePerYear < 12000) {
      insights.observations.push('Low annual mileage indicates careful usage');
    }
    if (carAge <= 3) {
      insights.observations.push('Relatively new model with modern features');
    }
    if (car.images && car.images.length >= 3) {
      insights.observations.push('Multiple photos provided for transparency');
    }
    if (dataSource === 'CarDekho') {
      insights.observations.push('Listed on established dealer platform');
    }

    // Real considerations based on actual data
    if (mileagePerYear > 20000) {
      insights.considerations.push('Higher than average annual usage');
    }
    if (carAge > 8) {
      insights.considerations.push('Older vehicle may require more maintenance');
    }
    if (!car.images || car.images.length < 2) {
      insights.considerations.push('Limited photos available - request more details');
    }
    if (verificationStatus === 'unverified') {
      insights.considerations.push('Verification status pending - verify before purchase');
    }

    return insights;
  };

  const marketInsights = getRealMarketInsights(car);

  const images = Array.isArray(car.images) && car.images.length > 0 ? car.images : [FALLBACK_CAR_IMAGE_URL];

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
              <SocialShare 
                url={`/car/${car.id}`}
                title={car.title}
                description={`${car.year} ${car.title} - ${formatPrice(car.price)} | ${car.location}`}
                imageUrl={images[0]}
              />
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
                className="w-full h-80 object-cover rounded-lg"
                onError={(e) => {
                  e.currentTarget.src = FALLBACK_CAR_IMAGE_URL;
                }}
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
                </>
              )}
            </div>
            
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.slice(0, 4).map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${car.title} ${index + 1}`}
                    className={`w-full h-20 object-cover rounded cursor-pointer border-2 ${
                      index === currentImageIndex ? 'border-blue-500' : 'border-gray-200'
                    }`}
                    onClick={() => setCurrentImageIndex(index)}
                    onError={(e) => {
                      e.currentTarget.src = FALLBACK_CAR_IMAGE_URL;
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Car Details */}
          <div className="space-y-6">
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">
                {formatPrice(car.price)}
              </div>
              <div className="flex items-center gap-2 mb-4">
                {getVerificationIcon(car.verificationStatus)}
                <Badge variant={car.verificationStatus === 'verified' ? 'default' : 'secondary'}>
                  {car.verificationStatus === 'verified' ? 'Verified Listing' : 'Unverified'}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>{car.year}</span>
              </div>
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-gray-500" />
                <span>{formatMileage(car.mileage)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Fuel className="w-4 h-4 text-gray-500" />
                <span>{car.fuelType}</span>
              </div>
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-gray-500" />
                <span>{car.transmission}</span>
              </div>
              <div className="flex items-center gap-2 col-span-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span>{car.location}</span>
              </div>
            </div>

            <Separator />

            {/* REAL MARKET ANALYSIS */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-500" />
                Real Market Analysis
              </h3>
              
              <div className="space-y-4">
                {/* Data Quality Indicator */}
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-800">Data Quality: {marketInsights.dataQuality}</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Analysis based on real listing data from {car.source}
                  </p>
                </div>

                {/* Positive Observations */}
                {marketInsights.observations.length > 0 && (
                  <div>
                    <h4 className="font-medium text-green-700 mb-2 flex items-center gap-2">
                      <ThumbsUp className="w-4 h-4" />
                      Positive Indicators
                    </h4>
                    <ul className="space-y-1">
                      {marketInsights.observations.map((observation, index) => (
                        <li key={index} className="text-sm text-green-600 flex items-center gap-2">
                          <CheckCircle className="w-3 h-3" />
                          {observation}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Considerations */}
                {marketInsights.considerations.length > 0 && (
                  <div>
                    <h4 className="font-medium text-yellow-700 mb-2 flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      Considerations
                    </h4>
                    <ul className="space-y-1">
                      {marketInsights.considerations.map((consideration, index) => (
                        <li key={index} className="text-sm text-yellow-600 flex items-center gap-2">
                          <Info className="w-3 h-3" />
                          {consideration}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Market Position */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-gray-600" />
                    <span className="font-medium">Market Position</span>
                  </div>
                  <p className="text-sm text-gray-600 capitalize">
                    {marketInsights.marketPosition} segment vehicle
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Seller</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span>{car.sellerType === 'dealer' ? 'Dealer' : 'Individual'}</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1">
                    <Phone className="w-4 h-4 mr-2" />
                    Call Seller
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Mail className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                </div>
                {car.url && (
                  <Button variant="outline" size="sm" className="w-full">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View on {car.source}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}