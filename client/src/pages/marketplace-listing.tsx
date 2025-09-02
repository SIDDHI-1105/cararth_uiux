import { useState } from 'react';
import { useParams, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, Calendar, Gauge, Fuel, Settings, MapPin, 
  Phone, User, Shield, Star, Heart, Share2, Eye,
  CheckCircle, AlertCircle, Car, Wrench, Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import Navbar from '@/components/navbar';
import ContactSellerModal from '@/components/contact-seller-modal';

export default function MarketplaceListing() {
  const { id } = useParams<{ id: string }>();
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  // Fetch marketplace listing details
  const { data: listing, isLoading } = useQuery({
    queryKey: ['/api/marketplace/listing', id],
    queryFn: async () => {
      const response = await fetch(`/api/marketplace/listing/${id}`);
      if (!response.ok) throw new Error('Failed to fetch listing');
      return response.json();
    },
    enabled: !!id
  });

  const formatPrice = (price: number) => {
    if (price >= 100000) {
      return `₹${(price / 100000).toFixed(1)} Lakh`;
    }
    return `₹${price.toLocaleString()}`;
  };

  const formatMileage = (mileage: number) => {
    return `${mileage.toLocaleString()} km`;
  };

  const getVerificationIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'certified':
        return <Shield className="w-5 h-5 text-blue-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'excellent':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'good':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'fair':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading || !listing) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-6xl mx-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/2"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="h-96 bg-muted rounded-lg"></div>
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
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-12 bg-muted rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const images = listing.images || [
    "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800",
    "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800",
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800",
    "https://images.unsplash.com/photo-1494976688230-f527b8a4bdca?w=800"
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-6xl mx-auto p-6">
        {/* Back Button */}
        <Link href="/">
          <Button variant="ghost" className="mb-6" data-testid="button-back">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Search
          </Button>
        </Link>

        {/* Header with Title and Actions */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" data-testid="listing-title">
              {listing.title}
            </h1>
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="outline" className="bg-accent/10">
                {listing.source}
              </Badge>
              <Badge className={getConditionColor(listing.condition)}>
                {listing.condition}
              </Badge>
              {getVerificationIcon(listing.verificationStatus)}
              <span className="text-sm text-muted-foreground capitalize">
                {listing.verificationStatus}
              </span>
            </div>
            <div className="flex items-center text-muted-foreground">
              <MapPin className="w-4 h-4 mr-1" />
              <span>{listing.location}</span>
              <span className="mx-2">•</span>
              <Eye className="w-4 h-4 mr-1" />
              <span>{Math.floor(Math.random() * 500) + 100} views</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFavorite(!isFavorite)}
              data-testid="button-favorite"
            >
              <Heart className={`w-4 h-4 mr-1 ${isFavorite ? 'fill-current text-red-500' : ''}`} />
              Save
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-1" />
              Share
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-lg">
              <img
                src={images[selectedImageIndex]}
                alt={listing.title}
                className="w-full h-96 object-cover"
                data-testid="main-image"
              />
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`relative overflow-hidden rounded border-2 transition-all ${
                    selectedImageIndex === index 
                      ? 'border-accent shadow-md' 
                      : 'border-border hover:border-accent/50'
                  }`}
                  data-testid={`thumbnail-${index}`}
                >
                  <img
                    src={image}
                    alt={`${listing.title} ${index + 1}`}
                    className="w-full h-20 object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Car Details and Contact */}
          <div className="space-y-6">
            {/* Price */}
            <Card>
              <CardContent className="p-6">
                <div className="text-4xl font-bold text-accent mb-2" data-testid="listing-price">
                  {formatPrice(listing.price)}
                </div>
                <div className="text-muted-foreground mb-4">
                  Listed by {listing.sellerType} • {new Date(listing.listingDate).toLocaleDateString()}
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    size="lg" 
                    className="flex-1"
                    onClick={() => setContactModalOpen(true)}
                    data-testid="button-contact-seller"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Contact Seller
                  </Button>
                  <Button variant="outline" size="lg">
                    <Car className="w-4 h-4 mr-2" />
                    Test Drive
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Key Specifications */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Key Specifications</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">Year</span>
                    </div>
                    <span className="font-medium">{listing.year}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
                    <div className="flex items-center">
                      <Gauge className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">Mileage</span>
                    </div>
                    <span className="font-medium">{formatMileage(listing.mileage)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
                    <div className="flex items-center">
                      <Fuel className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">Fuel</span>
                    </div>
                    <span className="font-medium">{listing.fuelType}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
                    <div className="flex items-center">
                      <Settings className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">Transmission</span>
                    </div>
                    <span className="font-medium">{listing.transmission}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seller Information */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Seller Information</h3>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <div className="font-medium capitalize">{listing.sellerType}</div>
                    <div className="text-sm text-muted-foreground">
                      {listing.source} Verified Seller
                    </div>
                  </div>
                  <div className="ml-auto">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="ml-1 text-sm font-medium">4.{Math.floor(Math.random() * 9) + 1}</span>
                      <span className="text-xs text-muted-foreground ml-1">
                        ({Math.floor(Math.random() * 50) + 10} reviews)
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground mb-4">
                  "Reliable dealer with verified vehicles and transparent pricing. 
                  All our cars undergo thorough inspection and come with documentation."
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setContactModalOpen(true)}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call Now
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Detailed Information Tabs */}
        <div className="mt-8">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="inspection">Inspection</TabsTrigger>
              <TabsTrigger value="finance">Finance</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Vehicle Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Brand</span>
                        <span className="font-medium">{listing.brand}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Model</span>
                        <span className="font-medium">{listing.model}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Year</span>
                        <span className="font-medium">{listing.year}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Kilometers</span>
                        <span className="font-medium">{formatMileage(listing.mileage)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Fuel Type</span>
                        <span className="font-medium">{listing.fuelType}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Transmission</span>
                        <span className="font-medium">{listing.transmission}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Condition</span>
                        <span className="font-medium">{listing.condition}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Owners</span>
                        <span className="font-medium">{Math.floor(Math.random() * 2) + 1} Previous</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Registration</span>
                        <span className="font-medium">MH-{Math.floor(Math.random() * 99) + 1}-AB-{Math.floor(Math.random() * 9999) + 1000}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Insurance</span>
                        <span className="font-medium text-green-600">Valid until 2025</span>
                      </div>
                    </div>
                  </div>
                  
                  <Separator className="my-6" />
                  
                  <div>
                    <h4 className="font-medium mb-3">Description</h4>
                    <p className="text-muted-foreground leading-relaxed">
                      {listing.description || `This ${listing.brand} ${listing.model} is in excellent condition with regular maintenance records. 
                      Well-maintained vehicle with all documents clear. Single owner, non-accidental car with comprehensive insurance. 
                      Ready for immediate transfer with all paperwork completed.`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="features" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Features & Accessories</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {(listing.features || [
                      'Air Conditioning', 'Power Steering', 'Power Windows', 'Central Locking',
                      'ABS', 'Airbags', 'Music System', 'Bluetooth Connectivity',
                      'Alloy Wheels', 'Fog Lights', 'Rear Parking Sensors', 'Electric Mirrors'
                    ]).map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="inspection" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Inspection Report</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-medium">Engine & Performance</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Excellent</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-medium">Exterior & Body</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Good</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                        <span className="font-medium">Interior & Electronics</span>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">Very Good</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-medium">Tires & Wheels</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Good</Badge>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-accent/5 border border-accent/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-5 h-5 text-accent" />
                      <span className="font-medium">Verification Status</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      This vehicle has been inspected and verified by {listing.source} experts. 
                      All documents and vehicle history have been thoroughly checked.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="finance" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Finance Options</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 border border-border rounded-lg">
                      <h4 className="font-medium mb-3">Loan Calculator</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Vehicle Price</span>
                          <span className="font-medium">{formatPrice(listing.price)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Down Payment (20%)</span>
                          <span className="font-medium">{formatPrice(listing.price * 0.2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Loan Amount</span>
                          <span className="font-medium">{formatPrice(listing.price * 0.8)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-accent">
                          <span className="font-medium">EMI (5 years)</span>
                          <span className="font-bold">₹{Math.floor((listing.price * 0.8) / 60 / 1000)}K/mo</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 border border-border rounded-lg">
                      <h4 className="font-medium mb-3">Insurance</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Comprehensive Cover</span>
                          <span className="font-medium">₹{Math.floor(listing.price * 0.03 / 1000)}K/year</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Third Party</span>
                          <span className="font-medium">₹8K/year</span>
                        </div>
                        <Separator />
                        <Button variant="outline" size="sm" className="w-full">
                          Get Insurance Quote
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <Button className="w-full" size="lg">
                      <Database className="w-4 h-4 mr-2" />
                      Apply for Loan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Contact Modal */}
      <ContactSellerModal
        open={contactModalOpen}
        onOpenChange={setContactModalOpen}
        listing={listing}
      />
    </div>
  );
}