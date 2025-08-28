import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/navbar";
import PriceRecommendation from "@/components/price-recommendation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type InsertCar } from "@shared/schema";
import { useLocation } from "wouter";

const INDIAN_CITIES = [
  "Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad", "Pune", 
  "Ahmedabad", "Kolkata", "Surat", "Jaipur", "Lucknow", "Kanpur",
  "Nagpur", "Indore", "Thane", "Bhopal", "Visakhapatnam", "Pimpri-Chinchwad",
  "Patna", "Vadodara", "Ghaziabad", "Ludhiana", "Agra", "Nashik"
];

const STATES = [
  "Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "Telangana",
  "Gujarat", "West Bengal", "Rajasthan", "Uttar Pradesh", "Madhya Pradesh",
  "Andhra Pradesh", "Haryana", "Punjab", "Bihar", "Odisha"
];

const BRANDS = [
  "Maruti Suzuki", "Hyundai", "Tata", "Mahindra", "Honda", "Toyota",
  "Ford", "Volkswagen", "Skoda", "Renault", "Nissan", "Chevrolet",
  "Kia", "MG Motor", "Jeep", "BMW", "Mercedes-Benz", "Audi"
];

export default function SellCar() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<Partial<InsertCar>>({
    sellerId: "seller-1", // In a real app, this would come from user session
    title: "",
    brand: "",
    model: "",
    year: 2020,
    price: "",
    mileage: 0,
    fuelType: "",
    transmission: "",
    owners: 1,
    location: "",
    city: "",
    state: "",
    description: "",
    features: [],
    images: [],
  });

  const sellCarMutation = useMutation({
    mutationFn: async (data: InsertCar) => {
      return apiRequest("POST", "/api/cars", data);
    },
    onSuccess: () => {
      toast({
        title: "Car Listed Successfully!",
        description: "Your car listing has been created and is pending verification.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cars"] });
      setLocation("/");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create car listing. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: keyof InsertCar, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFeatureChange = (feature: string, checked: boolean) => {
    const currentFeatures = formData.features || [];
    if (checked) {
      handleInputChange("features", [...currentFeatures, feature]);
    } else {
      handleInputChange("features", currentFeatures.filter(f => f !== feature));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate title if not provided
    const title = formData.title || `${formData.year} ${formData.brand} ${formData.model}`;
    
    // Basic validation
    if (!formData.brand || !formData.model || !formData.price || !formData.city) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    sellCarMutation.mutate({
      ...formData,
      title,
      year: Number(formData.year),
      mileage: Number(formData.mileage),
      owners: Number(formData.owners),
      features: formData.features || [],
      images: formData.images || [],
    } as InsertCar);
  };

  const commonFeatures = [
    "Power Steering", "Air Conditioning", "Central Locking", "ABS with EBD",
    "Dual Airbags", "Touchscreen Infotainment", "Reverse Camera", "Automatic Climate Control",
    "Sunroof", "Leather Seats", "Alloy Wheels", "Fog Lights", "Bluetooth Connectivity",
    "USB Charging", "Keyless Entry", "Push Button Start"
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold" data-testid="text-page-title">
              Sell Your Car
            </CardTitle>
            <p className="text-muted-foreground">
              Fill in the details below to list your car for sale
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="brand">Brand *</Label>
                    <Select value={formData.brand} onValueChange={(value) => handleInputChange("brand", value)}>
                      <SelectTrigger data-testid="select-brand">
                        <SelectValue placeholder="Select Brand" />
                      </SelectTrigger>
                      <SelectContent>
                        {BRANDS.map(brand => (
                          <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="model">Model *</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) => handleInputChange("model", e.target.value)}
                      placeholder="e.g., Swift VXI"
                      required
                      data-testid="input-model"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="year">Year *</Label>
                    <Select value={formData.year?.toString()} onValueChange={(value) => handleInputChange("year", parseInt(value))}>
                      <SelectTrigger data-testid="select-year">
                        <SelectValue placeholder="Select Year" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 25 }, (_, i) => 2024 - i).map(year => (
                          <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="price">Price (in Lakhs) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => handleInputChange("price", e.target.value)}
                      placeholder="e.g., 6.25"
                      required
                      data-testid="input-price"
                    />
                  </div>
                </div>

                {/* Smart Price Recommendation */}
                {formData.brand && formData.model && formData.year && formData.city && (
                  <PriceRecommendation
                    carData={{
                      brand: formData.brand,
                      model: formData.model,
                      year: formData.year,
                      city: formData.city,
                      mileage: formData.mileage || 0,
                      fuelType: formData.fuelType || "Petrol",
                      transmission: formData.transmission || "Manual"
                    }}
                    onPriceRecommend={(price) => handleInputChange("price", price.toString())}
                  />
                )}
              </div>

              {/* Vehicle Details */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Vehicle Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="mileage">Mileage (in KM)</Label>
                    <Input
                      id="mileage"
                      type="number"
                      value={formData.mileage}
                      onChange={(e) => handleInputChange("mileage", parseInt(e.target.value))}
                      placeholder="e.g., 35000"
                      data-testid="input-mileage"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="owners">Number of Owners</Label>
                    <Select value={formData.owners?.toString()} onValueChange={(value) => handleInputChange("owners", parseInt(value))}>
                      <SelectTrigger data-testid="select-owners">
                        <SelectValue placeholder="Select Owners" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1st Owner</SelectItem>
                        <SelectItem value="2">2nd Owner</SelectItem>
                        <SelectItem value="3">3rd Owner</SelectItem>
                        <SelectItem value="4">4+ Owners</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="fuelType">Fuel Type</Label>
                    <Select value={formData.fuelType} onValueChange={(value) => handleInputChange("fuelType", value)}>
                      <SelectTrigger data-testid="select-fuel-type">
                        <SelectValue placeholder="Select Fuel Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Petrol">Petrol</SelectItem>
                        <SelectItem value="Diesel">Diesel</SelectItem>
                        <SelectItem value="CNG">CNG</SelectItem>
                        <SelectItem value="Electric">Electric</SelectItem>
                        <SelectItem value="Hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="transmission">Transmission</Label>
                    <Select value={formData.transmission} onValueChange={(value) => handleInputChange("transmission", value)}>
                      <SelectTrigger data-testid="select-transmission">
                        <SelectValue placeholder="Select Transmission" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Manual">Manual</SelectItem>
                        <SelectItem value="Automatic">Automatic</SelectItem>
                        <SelectItem value="CVT">CVT</SelectItem>
                        <SelectItem value="AMT">AMT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Location</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Select value={formData.city} onValueChange={(value) => handleInputChange("city", value)}>
                      <SelectTrigger data-testid="select-city">
                        <SelectValue placeholder="Select City" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDIAN_CITIES.map(city => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Select value={formData.state} onValueChange={(value) => handleInputChange("state", value)}>
                      <SelectTrigger data-testid="select-state">
                        <SelectValue placeholder="Select State" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATES.map(state => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label htmlFor="location">Specific Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange("location", e.target.value)}
                      placeholder="e.g., Andheri West, Near Metro Station"
                      data-testid="input-location"
                    />
                  </div>
                </div>
              </div>

              {/* Features */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Features</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {commonFeatures.map(feature => (
                    <label key={feature} className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={formData.features?.includes(feature) || false}
                        onChange={(e) => handleFeatureChange(feature, e.target.checked)}
                        className="rounded border-border"
                        data-testid={`checkbox-feature-${feature.toLowerCase().replace(/\s+/g, '-')}`}
                      />
                      <span>{feature}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Describe your car's condition, maintenance history, and any additional details..."
                  className="h-24"
                  data-testid="textarea-description"
                />
              </div>

              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setLocation("/")}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={sellCarMutation.isPending}
                  data-testid="button-submit"
                >
                  {sellCarMutation.isPending ? "Creating Listing..." : "List Your Car"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
