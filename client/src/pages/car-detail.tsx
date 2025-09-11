import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/layout";
import ContactModal from "@/components/contact-modal";
import { CarConversation } from "@/components/car-conversation";
import PriceInsights from "@/components/price-insights";
import LoanWidget from "@/components/loan-widget";
import { Phone, Calendar, MapPin, User, Star, Check, ArrowLeft, MessageCircle } from "lucide-react";
import { Link } from "wouter";
import { type Car, type User as UserType } from "@shared/schema";
import logoImage from "@assets/Gemini_Generated_Image_pkpwj9pkpwj9pkpw_1757603212664.png";

export default function CarDetail() {
  const { id } = useParams<{ id: string }>();
  const [contactModalOpen, setContactModalOpen] = useState(false);

  const { data: car, isLoading: carLoading } = useQuery<Car>({
    queryKey: ["/api/cars", id],
    enabled: !!id,
  });

  const { data: seller, isLoading: sellerLoading } = useQuery<UserType>({
    queryKey: ["/api/cars", id, "seller"],
    enabled: !!id,
  });

  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price);
    if (numPrice >= 1) {
      return `₹${numPrice.toFixed(2)} Lakh`;
    } else {
      return `₹${(numPrice * 100).toFixed(0)} Thousand`;
    }
  };

  const formatMileage = (mileage: number) => {
    return `${mileage.toLocaleString()} km`;
  };

  if (carLoading || !car) {
    return (
      <Layout containerSize="lg">
        <div className="max-w-4xl mx-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/2"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="h-80 bg-muted rounded-lg mb-4"></div>
                <div className="grid grid-cols-4 gap-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-20 bg-muted rounded"></div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-8 bg-muted rounded w-3/4"></div>
                <div className="h-6 bg-muted rounded w-1/2"></div>
                <div className="grid grid-cols-2 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-12 bg-muted rounded"></div>
                  ))}
                </div>
                <div className="space-y-3">
                  <div className="h-12 bg-muted rounded"></div>
                  <div className="h-12 bg-muted rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout containerSize="lg">
      <div className="max-w-4xl mx-auto p-6">
        <Link href="/">
          <Button variant="ghost" className="mb-4" data-testid="button-back">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Search
          </Button>
        </Link>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold" data-testid="text-car-title">{car.title}</h1>
          {car.isVerified && (
            <Badge className="bg-green-100 text-green-800" data-testid="badge-verified">
              <Check className="w-4 h-4 mr-1" />
              Verified
            </Badge>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <img 
              src={(car.images && car.images[0]) || "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"} 
              alt={car.title} 
              className="w-full h-80 object-cover rounded-lg mb-4"
              data-testid="img-car-main"
            />
            <div className="grid grid-cols-4 gap-2">
              {[
                "https://images.unsplash.com/photo-1503376780353-7e6692767b70?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=100",
                "https://images.unsplash.com/photo-1555215695-3004980ad54e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=100",
                "https://images.unsplash.com/photo-1486326658981-ed68abe5868e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=100",
                "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=100",
              ].map((src, index) => (
                <img 
                  key={index}
                  src={src} 
                  alt={`${car.title} view ${index + 1}`} 
                  className="w-full h-20 object-cover rounded border-2 hover:border-primary cursor-pointer"
                  data-testid={`img-car-gallery-${index}`}
                />
              ))}
            </div>
          </div>
          
          <div>
            <div className="bg-muted rounded-lg p-6 mb-4">
              <div className="text-3xl font-bold text-accent mb-2" data-testid="text-car-price">
                {formatPrice(car.price)}
              </div>
              <div className="text-muted-foreground mb-4">EMI starts at ₹{Math.round(parseFloat(car.price) * 2000)}/month</div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <div className="text-sm text-muted-foreground">Year</div>
                  <div className="font-semibold" data-testid="text-car-year">{car.year}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">KM Driven</div>
                  <div className="font-semibold" data-testid="text-car-mileage">{formatMileage(car.mileage)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Fuel Type</div>
                  <div className="font-semibold" data-testid="text-car-fuel">{car.fuelType}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Transmission</div>
                  <div className="font-semibold" data-testid="text-car-transmission">{car.transmission}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Owners</div>
                  <div className="font-semibold" data-testid="text-car-owners">{car.owners === 1 ? "1st Owner" : `${car.owners} Owners`}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Location</div>
                  <div className="font-semibold" data-testid="text-car-location">{car.city}, {car.state}</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full"
                  data-testid="button-schedule-test"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Test Drive
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Description</h3>
            <p className="text-muted-foreground mb-6" data-testid="text-car-description">
              {car.description}
            </p>

            <h3 className="text-lg font-semibold mb-4">Key Features</h3>
            <div className="space-y-2">
              {(car.features || []).map((feature, index) => (
                <div key={index} className="flex items-center text-sm" data-testid={`text-feature-${index}`}>
                  <Check className="text-green-500 mr-2 h-4 w-4" />
                  {feature}
                </div>
              ))}
            </div>

            {/* Price Insights Component */}
            <PriceInsights car={car} />
          </div>
          
          <div className="space-y-6">
            {/* Messaging & Contact */}
            <CarConversation
              carId={car.id}
              carTitle={car.title}
              sellerId={car.sellerId}
              sellerName={seller?.name || 'Car Owner'}
              price={formatPrice(car.price)}
            />
            
            {/* Loan Widget */}
            <LoanWidget 
              carPrice={parseFloat(car.price) * 100000} 
              carTitle={car.title}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Seller Information</h3>
            <div className="bg-muted rounded-lg p-4">
              {sellerLoading ? (
                <div className="animate-pulse">
                  <div className="flex items-center mb-2">
                    <div className="w-10 h-10 bg-primary/20 rounded-full mr-3"></div>
                    <div>
                      <div className="h-4 bg-primary/20 rounded w-24 mb-1"></div>
                      <div className="h-3 bg-primary/20 rounded w-20"></div>
                    </div>
                  </div>
                </div>
              ) : seller ? (
                <div className="flex items-center mb-2">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mr-3">
                    <User className="text-primary-foreground h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold" data-testid="text-seller-name">{seller.name}</div>
                    <div className="text-sm text-muted-foreground">Individual Seller</div>
                  </div>
                </div>
              ) : (
                <div>Seller information not available</div>
              )}
              
              <div className="text-sm text-muted-foreground mb-3">
                <Star className="text-yellow-400 mr-1 inline h-4 w-4" />
                4.8 rating • 23 reviews
              </div>
              <div className="text-sm text-muted-foreground">
                <MapPin className="mr-1 inline h-4 w-4" />
                {car.location}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ContactModal
        open={contactModalOpen}
        onOpenChange={setContactModalOpen}
        carId={car.id}
        carTitle={car.title}
      />
    </Layout>
  );
}
