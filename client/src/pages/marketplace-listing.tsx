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
import NavbarImproved from '@/components/navbar-improved';
import ContactModal from '@/components/contact-modal';
import LoanWidget from '@/components/loan-widget';

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
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
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
        <NavbarImproved />
        <div className="max-w-6xl mx-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/2"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="h-80 bg-muted rounded-lg"></div>
              </div>
              <div className="space-y-4">
                <div className="h-32 bg-muted rounded"></div>
                <div className="h-48 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const mockImages = [
    `https://images.unsplash.com/photo-1549924231-f129b911e442?w=800&h=600&fit=crop`,
    `https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop`,
    `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop`,
    `https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=800&h=600&fit=crop`
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-6xl mx-auto p-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1 inline" />
            Back to Listings
          </Link>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">
                    {listing.year} {listing.brand} {listing.model}
                  </h1>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {listing.year}
                    </span>
                    <span className="flex items-center gap-1">
                      <Gauge className="w-4 h-4" />
                      {formatMileage(listing.mileage)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Fuel className="w-4 h-4" />
                      {listing.fuel}
                    </span>
                    <span className="flex items-center gap-1">
                      <Settings className="w-4 h-4" />
                      {listing.transmission}
                    </span>
                  </div>
                </div>
                <Badge className={getConditionColor(listing.condition)}>
                  {listing.condition}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                {listing.location}
                <span className="mx-2">•</span>
                <span>Listed on {listing.source}</span>
              </div>
            </div>

            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                <img 
                  src={mockImages[selectedImageIndex]} 
                  alt={`${listing.brand} ${listing.model}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {mockImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-video bg-muted rounded overflow-hidden border-2 ${
                      selectedImageIndex === index ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <img 
                      src={image} 
                      alt={`View ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="inspection">Inspection</TabsTrigger>
                <TabsTrigger value="finance">Finance</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <Calendar className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                        <div className="font-semibold">{listing.year}</div>
                        <div className="text-sm text-muted-foreground">Year</div>
                      </div>
                      
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <Gauge className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                        <div className="font-semibold">{formatMileage(listing.mileage)}</div>
                        <div className="text-sm text-muted-foreground">Mileage</div>
                      </div>
                      
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <Fuel className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                        <div className="font-semibold">{listing.fuel}</div>
                        <div className="text-sm text-muted-foreground">Fuel Type</div>
                      </div>
                      
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <Settings className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                        <div className="font-semibold">{listing.transmission}</div>
                        <div className="text-sm text-muted-foreground">Transmission</div>
                      </div>
                    </div>
                    
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
                      ]).map((feature: string, index: number) => (
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <LoanWidget 
                      carPrice={listing.price} 
                      carTitle={`${listing.brand} ${listing.model}`}
                    />
                  </div>
                  <div className="space-y-4">
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Why Finance with Us?</h3>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                            <div>
                              <h4 className="font-medium">Instant Approval</h4>
                              <p className="text-sm text-muted-foreground">Get loan approval within 24 hours from our partner banks</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                            <div>
                              <h4 className="font-medium">Best Rates</h4>
                              <p className="text-sm text-muted-foreground">Starting from 7.05% with our banking partners</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                            <div>
                              <h4 className="font-medium">Flexible Tenure</h4>
                              <p className="text-sm text-muted-foreground">Choose loan tenure from 3 to 7 years</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                            <div>
                              <h4 className="font-medium">Doorstep Service</h4>
                              <p className="text-sm text-muted-foreground">Complete documentation at your location</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Our Banking Partners</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                            <div className="text-lg">🏛️</div>
                            <span>State Bank of India</span>
                          </div>
                          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                            <div className="text-lg">🏢</div>
                            <span>HDFC Bank</span>
                          </div>
                          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                            <div className="text-lg">🚗</div>
                            <span>Kuwy Fintech</span>
                          </div>
                          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                            <div className="text-lg">🏦</div>
                            <span>25+ Bank Network</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Contact and Actions */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-green-600">{formatPrice(listing.price)}</div>
                    {listing.originalPrice && listing.originalPrice > listing.price && (
                      <div className="text-sm text-muted-foreground">
                        <span className="line-through">₹{listing.originalPrice.toLocaleString()}</span>
                        <span className="ml-2 text-green-600 font-medium">
                          Save ₹{(listing.originalPrice - listing.price).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <Button 
                      onClick={() => setContactModalOpen(true)}
                      className="w-full"
                      size="lg"
                      data-testid="button-contact-seller"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Contact Seller
                    </Button>
                    
                    <Button variant="outline" className="w-full" size="lg">
                      <Eye className="w-4 h-4 mr-2" />
                      Schedule Inspection
                    </Button>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setIsFavorite(!isFavorite)}
                      >
                        <Heart className={`w-4 h-4 mr-1 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                        Save
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Share2 className="w-4 h-4 mr-1" />
                        Share
                      </Button>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Posted on {listing.source}</span>
                      <Badge variant="outline">{listing.status}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Listed {Math.floor(Math.random() * 7) + 1} days ago
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Trust & Safety */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-3">Trust & Safety</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      {getVerificationIcon(listing.verification)}
                      <div>
                        <div className="text-sm font-medium">
                          {listing.verification === 'verified' ? 'Verified Listing' : 
                           listing.verification === 'certified' ? 'Certified by Expert' : 'Standard Listing'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Checked by {listing.source} team
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-blue-500" />
                      <div>
                        <div className="text-sm font-medium">Secure Transaction</div>
                        <div className="text-xs text-muted-foreground">Protected buyer experience</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      <ContactModal
        open={contactModalOpen}
        onOpenChange={setContactModalOpen}
        carId={listing.id}
        carTitle={listing.title}
      />
    </div>
  );
}