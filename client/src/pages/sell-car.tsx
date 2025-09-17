import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Car, Upload, FileText, MapPin, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertSellerListingSchema } from "@shared/schema";
import { z } from "zod";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from '@uppy/core';
import Layout from "@/components/layout";

const sellCarSchema = insertSellerListingSchema.omit({ features: true });

const BRANDS = [
  "Maruti Suzuki", "Hyundai", "Tata", "Mahindra", "Honda", "Toyota",
  "Ford", "Volkswagen", "Skoda", "Renault", "Nissan", "Chevrolet"
];

const INDIAN_CITIES = [
  "Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad", "Pune", 
  "Ahmedabad", "Kolkata", "Surat", "Jaipur", "Lucknow", "Kanpur",
  "Noida", "Gurgaon", "Faridabad", "Ghaziabad", "Agra", "Meerut",
  "Vadodara", "Rajkot", "Nashik", "Aurangabad", "Solapur", "Dhanbad",
  "Amritsar", "Allahabad", "Ranchi", "Jodhpur", "Coimbatore", "Madurai",
  "Kochi", "Visakhapatnam", "Bhopal", "Indore", "Nagpur", "Thane",
  "Vasai-Virar", "Kalyan-Dombivli", "Howrah", "South Dumdum", "Firozabad"
];

type LocationState = {
  status: 'idle' | 'detecting' | 'success' | 'error';
  city: string | null;
  error: string | null;
};

export default function SellCar() {
  const { toast } = useToast();
  const [uploadProgress, setUploadProgress] = useState({
    registration: false,
    insurance: false,
  });
  const [locationState, setLocationState] = useState<LocationState>({
    status: 'idle',
    city: null,
    error: null
  });

  const form = useForm<z.infer<typeof sellCarSchema>>({
    resolver: zodResolver(sellCarSchema),
    defaultValues: {
      sellerId: "temp-seller",
      actualPhone: "",
      actualEmail: "",
      city: "",
    },
  });

  const createListingMutation = useMutation({
    mutationFn: async (data: z.infer<typeof sellCarSchema>) => {
      const response = await apiRequest("POST", "/api/seller/listings", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Your car listing has been created successfully.",
      });
      form.reset();
      setUploadProgress({ registration: false, insurance: false });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create listing. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleUploadComplete = (category: string, result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful[0]) {
      setUploadProgress(prev => ({ ...prev, [category]: true }));
      toast({
        title: "Document Uploaded!",
        description: `${category} document uploaded successfully.`,
      });
    }
  };

  const getUploadParameters = (category: string) => async () => {
    const response = await apiRequest("GET", `/api/seller/upload-url?category=${category}`);
    const data = await response.json();
    return {
      method: 'PUT' as const,
      url: data.uploadURL,
    };
  };

  const detectCurrentLocation = async () => {
    setLocationState({ status: 'detecting', city: null, error: null });
    
    if (!navigator.geolocation) {
      setLocationState({ 
        status: 'error', 
        city: null, 
        error: 'Geolocation is not supported by this browser.' 
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Use reverse geocoding to get city name
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          
          if (!response.ok) {
            throw new Error('Failed to get location details');
          }
          
          const data = await response.json();
          const detectedCity = data.city || data.locality || data.principalSubdivision;
          
          if (detectedCity) {
            // Try to match with Indian cities list or use detected city
            const matchedCity = INDIAN_CITIES.find(city => 
              city.toLowerCase().includes(detectedCity.toLowerCase()) ||
              detectedCity.toLowerCase().includes(city.toLowerCase())
            ) || detectedCity;
            
            setLocationState({ 
              status: 'success', 
              city: matchedCity, 
              error: null 
            });
            
            // Update form field
            form.setValue('city', matchedCity);
            
            toast({
              title: "Location Detected!",
              description: `Your current location: ${matchedCity}`,
            });
          } else {
            throw new Error('Could not determine city from location');
          }
        } catch (error) {
          setLocationState({ 
            status: 'error', 
            city: null, 
            error: 'Failed to get city name from location' 
          });
        }
      },
      (error) => {
        let errorMessage = 'Failed to detect location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please allow location access and try again.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        
        setLocationState({ 
          status: 'error', 
          city: null, 
          error: errorMessage 
        });
        
        toast({
          title: "Location Detection Failed",
          description: errorMessage,
          variant: "destructive"
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  // Auto-detect location on component mount
  useEffect(() => {
    detectCurrentLocation();
  }, []);

  const onSubmit = async (data: z.infer<typeof sellCarSchema>) => {
    createListingMutation.mutate(data);
  };

  return (
    <Layout containerSize="lg">
      <div className="container mx-auto px-4 py-8">
        <Card className="mx-auto max-w-4xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
              <Car className="h-6 w-6" />
              Sell Your Car
            </CardTitle>
            <p className="text-muted-foreground">List your car with authentic documentation</p>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Vehicle Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Vehicle Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    <FormField
                      control={form.control}
                      name="brand"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Brand</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-brand">
                                <SelectValue placeholder="Select brand" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {BRANDS.map((brand) => (
                                <SelectItem key={brand} value={brand}>
                                  {brand}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="model"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Model</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Swift VXI" {...field} data-testid="input-model" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Year</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger data-testid="select-year">
                                <SelectValue placeholder="Year" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Array.from({ length: 25 }, (_, i) => 2024 - i).map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price (₹)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="6.25" {...field} data-testid="input-price" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fuelType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fuel Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-fuel-type">
                                <SelectValue placeholder="Select fuel" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Petrol">Petrol</SelectItem>
                              <SelectItem value="Diesel">Diesel</SelectItem>
                              <SelectItem value="CNG">CNG</SelectItem>
                              <SelectItem value="Electric">Electric</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="transmission"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Transmission</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-transmission">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Manual">Manual</SelectItem>
                              <SelectItem value="Automatic">Automatic</SelectItem>
                              <SelectItem value="CVT">CVT</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="mileage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mileage (km)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="50000" {...field} data-testid="input-mileage" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="owners"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Previous Owners</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger data-testid="select-owners">
                                <SelectValue placeholder="Owners" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1">1st Owner</SelectItem>
                              <SelectItem value="2">2nd Owner</SelectItem>
                              <SelectItem value="3">3rd Owner</SelectItem>
                              <SelectItem value="4">4+ Owners</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            City
                            {locationState.status === 'detecting' && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Detecting...
                              </div>
                            )}
                            {locationState.status === 'success' && locationState.city && (
                              <div className="flex items-center gap-1 text-xs text-green-600">
                                <MapPin className="h-3 w-3" />
                                Auto-detected
                              </div>
                            )}
                          </FormLabel>
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <Select onValueChange={field.onChange} value={field.value || ''}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-city">
                                    <SelectValue placeholder={locationState.status === 'detecting' ? 'Detecting location...' : 'Select city'} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {/* Show detected city first if available */}
                                  {locationState.city && !INDIAN_CITIES.includes(locationState.city) && (
                                    <SelectItem value={locationState.city}>
                                      📍 {locationState.city} (Detected)
                                    </SelectItem>
                                  )}
                                  {INDIAN_CITIES.map((city) => (
                                    <SelectItem key={city} value={city}>
                                      {city}
                                      {locationState.city === city && ' (Detected)'}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={detectCurrentLocation}
                              disabled={locationState.status === 'detecting'}
                              data-testid="button-detect-location"
                            >
                              {locationState.status === 'detecting' ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MapPin className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          {locationState.status === 'error' && locationState.error && (
                            <p className="text-xs text-red-500 mt-1">{locationState.error}</p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Description</h3>
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your car's condition, maintenance history... Share details with #cararth.com community"
                            className="min-h-[100px]"
                            {...field}
                            value={field.value || ''}
                            data-testid="textarea-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="actualPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="+91 XXXXX XXXXX" {...field} data-testid="input-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="actualEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="your.email@example.com" {...field} data-testid="input-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Document Upload */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Required Documents</h3>
                  <p className="text-sm text-muted-foreground">Upload Registration and Insurance documents for AI-powered feature detection</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Registration Certificate</span>
                        {uploadProgress.registration && <span className="text-xs text-green-600">✓ Uploaded</span>}
                      </div>
                      <ObjectUploader
                        onGetUploadParameters={getUploadParameters('registration')}
                        onComplete={(result) => handleUploadComplete('registration', result)}
                        maxFileSize={5242880} // 5MB
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Upload RC
                      </ObjectUploader>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Insurance Policy</span>
                        {uploadProgress.insurance && <span className="text-xs text-green-600">✓ Uploaded</span>}
                      </div>
                      <ObjectUploader
                        onGetUploadParameters={getUploadParameters('insurance')}
                        onComplete={(result) => handleUploadComplete('insurance', result)}
                        maxFileSize={5242880} // 5MB
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Upload Insurance
                      </ObjectUploader>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={createListingMutation.isPending}
                  data-testid="button-submit"
                >
                  {createListingMutation.isPending ? "Creating Listing..." : "List My Car"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}