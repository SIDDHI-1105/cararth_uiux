import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Car, Upload, CheckCircle, IndianRupee, FileText, Camera, Shield, Zap,
  Eye, TrendingUp, Globe, AlertTriangle, Info, Star
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertSellerListingSchema } from "@shared/schema";
import { z } from "zod";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from '@uppy/core';
import Layout from "@/components/layout";

const sellCarSchema = insertSellerListingSchema.extend({
  features: z.array(z.string()).optional(),
});

const availableFeatures = [
  "Power Steering", "Air Conditioning", "Central Locking", "ABS with EBD",
  "Dual Airbags", "Touchscreen Infotainment", "Reverse Camera", "Automatic Climate Control",
  "Sunroof", "Leather Seats", "Alloy Wheels", "Fog Lights", "Bluetooth Connectivity",
  "USB Charging", "Keyless Entry", "Push Button Start"
];

const INDIAN_CITIES = [
  "Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad", "Pune", 
  "Ahmedabad", "Kolkata", "Surat", "Jaipur", "Lucknow", "Kanpur"
];

const STATES = [
  "Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "Telangana",
  "Gujarat", "West Bengal", "Rajasthan", "Uttar Pradesh", "Madhya Pradesh"
];

const BRANDS = [
  "Maruti Suzuki", "Hyundai", "Tata", "Mahindra", "Honda", "Toyota",
  "Ford", "Volkswagen", "Skoda", "Renault", "Nissan", "Chevrolet"
];

export default function SellCar() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [listingId, setListingId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState({
    rcBook: false,
    insurance: false,
    frontPhoto: false,
    rearPhoto: false,
    leftSidePhoto: false,
    rightSidePhoto: false,
    interiorPhoto: false,
    engineBayPhoto: false,
  });
  const [aiGeneratedContent, setAiGeneratedContent] = useState<{
    title?: string;
    description?: string;
    marketValue?: number;
  }>({});
  const [platformResults, setPlatformResults] = useState<{
    cars24?: { success: boolean; listingId?: string };
    cardekho?: { success: boolean; listingId?: string };
    facebook?: { success: boolean; listingId?: string };
  }>({});

  const form = useForm<z.infer<typeof sellCarSchema>>({
    resolver: zodResolver(sellCarSchema),
    defaultValues: {
      sellerId: "temp-seller", // This would come from auth
      actualPhone: "",
      actualEmail: "",
    },
  });

  const toggleFeature = (feature: string) => {
    setSelectedFeatures(prev => 
      prev.includes(feature) 
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  };

  // Step 1: Create basic listing
  const createListingMutation = useMutation({
    mutationFn: async (data: z.infer<typeof sellCarSchema>) => {
      const listingData = {
        ...data,
        features: selectedFeatures,
      };
      return apiRequest("/api/seller/listings", {
        method: "POST",
        body: JSON.stringify(listingData),
      });
    },
    onSuccess: (response) => {
      setListingId(response.id);
      setCurrentStep(2);
      toast({
        title: "Step 1 Complete!",
        description: "Basic listing created. Now upload your documents.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create listing. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Step 2: Generate AI content
  const generateContentMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/seller/listings/${listingId}/generate-content`, {
        method: "POST",
      });
    },
    onSuccess: (response) => {
      setAiGeneratedContent(response);
      toast({
        title: "AI Content Generated!",
        description: "Your listing has been optimized with AI-powered content.",
      });
    },
  });

  // Step 3: Post to multiple platforms
  const postToPlatformsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/seller/listings/${listingId}/post-platforms`, {
        method: "POST",
      });
    },
    onSuccess: (response) => {
      setPlatformResults(response);
      setCurrentStep(4);
      toast({
        title: "Success!",
        description: "Your car has been posted across multiple platforms!",
      });
    },
  });

  // Handle upload completion for different file types
  const handleUploadComplete = (category: string, result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful[0]) {
      const uploadUrl = result.successful[0].uploadURL;
      if (uploadUrl && listingId) {
        // Update listing with file path
        apiRequest(`/api/seller/listings/${listingId}/files`, {
          method: "PATCH",
          body: JSON.stringify({
            [category]: uploadUrl,
          }),
        }).then(() => {
          setUploadProgress(prev => ({ ...prev, [category]: true }));
          toast({
            title: "Upload Complete!",
            description: `${category} uploaded successfully.`,
          });
        });
      }
    }
  };

  const onSubmit = async (data: z.infer<typeof sellCarSchema>) => {
    createListingMutation.mutate(data);
  };

  // Get upload URL for specific category
  const getUploadParameters = (category: string) => async () => {
    const response = await apiRequest(`/api/seller/upload-url?category=${category}`);
    return {
      method: 'PUT' as const,
      url: response.uploadURL,
    };
  };

  const canProceedToStep3 = () => {
    return uploadProgress.rcBook && 
           uploadProgress.insurance &&
           uploadProgress.frontPhoto &&
           uploadProgress.rearPhoto &&
           uploadProgress.leftSidePhoto &&
           uploadProgress.rightSidePhoto &&
           uploadProgress.interiorPhoto &&
           uploadProgress.engineBayPhoto;
  };

  return (
    <Layout containerSize="xl">
      <div className="container mx-auto px-4 py-8">
        <Card className="mx-auto max-w-6xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Car className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold">Premium Seller Dashboard</CardTitle>
            <p className="text-muted-foreground">Complete vehicle documentation • AI-powered listings • Multi-platform posting</p>
            
            {/* Progress Steps */}
            <div className="mt-8 flex justify-center space-x-4">
              {[
                { step: 1, title: "Basic Info", icon: FileText },
                { step: 2, title: "Documents & Photos", icon: Camera },
                { step: 3, title: "AI Optimization", icon: Zap },
                { step: 4, title: "Multi-Platform", icon: Globe },
              ].map(({ step, title, icon: Icon }) => (
                <div key={step} className={`flex flex-col items-center space-y-2 ${currentStep >= step ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                    currentStep >= step ? 'border-primary bg-primary text-white' : 'border-muted-foreground'
                  }`}>
                    {currentStep > step ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className="text-sm font-medium">{title}</span>
                </div>
              ))}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Basic Information */}
                    <div className="space-y-6">
                      <div className="flex items-center space-x-2">
                        <Car className="h-5 w-5 text-primary" />
                        <h3 className="text-xl font-semibold">Vehicle Information</h3>
                      </div>

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

                      <div className="grid grid-cols-2 gap-4">
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
                              <FormLabel>Price (₹ Lakhs)</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" placeholder="6.25" {...field} data-testid="input-price" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
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
                      </div>

                      <div className="grid grid-cols-2 gap-4">
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
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-city">
                                    <SelectValue placeholder="Select city" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {INDIAN_CITIES.map((city) => (
                                    <SelectItem key={city} value={city}>
                                      {city}
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
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-state">
                                    <SelectValue placeholder="Select state" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {STATES.map((state) => (
                                    <SelectItem key={state} value={state}>
                                      {state}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Specific Location</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Andheri West, Near Metro" {...field} data-testid="input-location" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe your car's condition, maintenance history..." 
                                className="resize-none"
                                {...field} 
                                data-testid="textarea-description"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-6">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-5 w-5 text-primary" />
                        <h3 className="text-xl font-semibold">Contact Details</h3>
                        <Badge variant="outline">Protected</Badge>
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="actualPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="Your phone number" {...field} data-testid="input-phone" />
                            </FormControl>
                            <FormMessage />
                            <p className="text-xs text-muted-foreground">Buyers will contact through our platform for your privacy</p>
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
                              <Input type="email" placeholder="Your email address" {...field} data-testid="input-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Features */}
                      <div className="space-y-4">
                        <Label>Vehicle Features</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {availableFeatures.map((feature) => (
                            <div
                              key={feature}
                              className={`cursor-pointer rounded-lg border p-3 text-center text-sm transition-colors ${
                                selectedFeatures.includes(feature)
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-muted-foreground/20 hover:border-primary/50"
                              }`}
                              onClick={() => toggleFeature(feature)}
                              data-testid={`feature-${feature}`}
                            >
                              {feature}
                            </div>
                          ))}
                        </div>
                        {selectedFeatures.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {selectedFeatures.map((feature) => (
                              <Badge key={feature} variant="secondary" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="col-span-full">
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={createListingMutation.isPending}
                      data-testid="button-submit"
                    >
                      {createListingMutation.isPending ? "Creating Listing..." : "Continue to Document Upload"}
                    </Button>
                  </div>
                </form>
              </Form>
            )}

            {/* Step 2: Document & Photo Upload */}
            {currentStep === 2 && listingId && (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-2xl font-bold">Upload Documents & Photos</h2>
                  <p className="text-muted-foreground mt-2">High-quality documentation increases buyer trust by 85%</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Documents Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <FileText className="h-5 w-5" />
                        <span>Legal Documents</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span>RC Book Copy</span>
                          {uploadProgress.rcBook ? <CheckCircle className="h-5 w-5 text-green-500" /> : <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                        </div>
                        <ObjectUploader
                          onGetUploadParameters={getUploadParameters('documents')}
                          onComplete={(result) => handleUploadComplete('rcBookDocument', result)}
                          allowedFileTypes={['image/*', 'application/pdf']}
                          note="Clear photo or PDF scan of RC book"
                          buttonClassName="w-full"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Upload RC Book
                        </ObjectUploader>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span>Insurance Papers</span>
                          {uploadProgress.insurance ? <CheckCircle className="h-5 w-5 text-green-500" /> : <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                        </div>
                        <ObjectUploader
                          onGetUploadParameters={getUploadParameters('documents')}
                          onComplete={(result) => handleUploadComplete('insuranceDocument', result)}
                          allowedFileTypes={['image/*', 'application/pdf']}
                          note="Valid insurance certificate"
                          buttonClassName="w-full"
                        >
                          <Shield className="w-4 h-4 mr-2" />
                          Upload Insurance
                        </ObjectUploader>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Photos Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Camera className="h-5 w-5" />
                        <span>Vehicle Photos</span>
                        <Badge variant="outline">Required Format</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[
                        { key: 'frontPhoto', label: 'Front View', category: 'photos/front' },
                        { key: 'rearPhoto', label: 'Rear View', category: 'photos/rear' },
                        { key: 'leftSidePhoto', label: 'Left Side', category: 'photos/left-side' },
                        { key: 'rightSidePhoto', label: 'Right Side', category: 'photos/right-side' },
                        { key: 'interiorPhoto', label: 'Interior + Odometer', category: 'photos/interior' },
                        { key: 'engineBayPhoto', label: 'Engine Bay', category: 'photos/engine-bay' },
                      ].map(({ key, label, category }) => (
                        <div key={key} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {uploadProgress[key as keyof typeof uploadProgress] ? 
                              <CheckCircle className="h-5 w-5 text-green-500" /> : 
                              <Camera className="h-5 w-5 text-muted-foreground" />
                            }
                            <span className="font-medium">{label}</span>
                          </div>
                          <ObjectUploader
                            onGetUploadParameters={getUploadParameters(category)}
                            onComplete={(result) => handleUploadComplete(key, result)}
                            allowedFileTypes={['image/*']}
                            maxFileSize={5242880} // 5MB
                            buttonClassName="text-sm"
                          >
                            <Upload className="w-4 h-4 mr-1" />
                            Upload
                          </ObjectUploader>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                <div className="text-center">
                  <Button 
                    onClick={() => setCurrentStep(3)}
                    disabled={!canProceedToStep3()}
                    className="min-w-48"
                    data-testid="button-next-step"
                  >
                    {canProceedToStep3() ? "Generate AI Content" : "Complete All Uploads First"}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: AI Content Generation */}
            {currentStep === 3 && (
              <div className="space-y-8">
                <div className="text-center">
                  <Zap className="mx-auto h-16 w-16 text-yellow-500 mb-4" />
                  <h2 className="text-2xl font-bold">AI Content Optimization</h2>
                  <p className="text-muted-foreground mt-2">Generate compelling listing content that sells faster</p>
                </div>

                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-6">
                      <Button 
                        onClick={() => generateContentMutation.mutate()}
                        disabled={generateContentMutation.isPending}
                        className="w-full"
                        data-testid="button-generate-content"
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        {generateContentMutation.isPending ? "Generating..." : "Generate AI-Powered Content"}
                      </Button>

                      {aiGeneratedContent.title && (
                        <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                          <div>
                            <Label className="text-sm font-semibold">AI-Generated Title</Label>
                            <p className="text-lg font-medium mt-1">{aiGeneratedContent.title}</p>
                          </div>
                          
                          <div>
                            <Label className="text-sm font-semibold">AI-Generated Description</Label>
                            <p className="mt-1 text-sm leading-relaxed">{aiGeneratedContent.description}</p>
                          </div>
                          
                          <div className="flex items-center justify-between pt-2 border-t">
                            <div>
                              <Label className="text-sm font-semibold">Market Value Estimate</Label>
                              <div className="flex items-center space-x-1 text-lg font-bold text-green-600">
                                <IndianRupee className="w-4 h-4" />
                                <span>{aiGeneratedContent.marketValue?.toLocaleString()}</span>
                              </div>
                            </div>
                            <Button 
                              onClick={() => setCurrentStep(4)}
                              className="min-w-32"
                              data-testid="button-proceed-posting"
                            >
                              Post to Platforms
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step 4: Multi-Platform Posting */}
            {currentStep === 4 && (
              <div className="space-y-8">
                <div className="text-center">
                  <Globe className="mx-auto h-16 w-16 text-blue-500 mb-4" />
                  <h2 className="text-2xl font-bold">Multi-Platform Distribution</h2>
                  <p className="text-muted-foreground mt-2">Reach maximum buyers across all major platforms</p>
                </div>

                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-6">
                      <Button 
                        onClick={() => postToPlatformsMutation.mutate()}
                        disabled={postToPlatformsMutation.isPending}
                        className="w-full h-12 text-lg"
                        data-testid="button-post-platforms"
                      >
                        <Globe className="w-5 h-5 mr-2" />
                        {postToPlatformsMutation.isPending ? "Posting to Platforms..." : "Post to All Platforms"}
                      </Button>

                      {Object.keys(platformResults).length > 0 && (
                        <div className="space-y-3">
                          <h3 className="font-semibold">Platform Results:</h3>
                          
                          {[
                            { key: 'cars24', name: 'Cars24', icon: Car },
                            { key: 'cardekho', name: 'CarDekho', icon: TrendingUp },
                            { key: 'facebook', name: 'Facebook Marketplace', icon: Globe },
                          ].map(({ key, name, icon: Icon }) => {
                            const result = platformResults[key as keyof typeof platformResults];
                            return (
                              <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <Icon className="h-5 w-5" />
                                  <span className="font-medium">{name}</span>
                                </div>
                                {result ? (
                                  <div className="flex items-center space-x-2">
                                    {result.success ? (
                                      <>
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                        <span className="text-sm text-green-600">Posted Successfully</span>
                                      </>
                                    ) : (
                                      <>
                                        <AlertTriangle className="h-5 w-5 text-red-500" />
                                        <span className="text-sm text-red-600">Failed to Post</span>
                                      </>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-sm text-muted-foreground">Pending...</span>
                                )}
                              </div>
                            );
                          })}
                          
                          {Object.values(platformResults).some(r => r?.success) && (
                            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                <span className="font-semibold text-green-800">Listing Active!</span>
                              </div>
                              <p className="text-sm text-green-700 mt-1">
                                Your car is now live across multiple platforms. Buyer inquiries will be routed through your masked contact.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Benefits Section - Only show on step 1 */}
        {currentStep === 1 && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="text-center card-professional">
              <CardContent className="pt-6">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold">Protected Identity</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Masked contact system routes all inquiries through our platform
                </p>
              </CardContent>
            </Card>

            <Card className="text-center card-professional">
              <CardContent className="pt-6">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <Globe className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold">Multi-Platform Reach</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Auto-post to Cars24, CarDekho, Facebook Marketplace simultaneously
                </p>
              </CardContent>
            </Card>

            <Card className="text-center card-professional">
              <CardContent className="pt-6">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                  <Zap className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold">AI-Powered Content</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Compelling descriptions and market value estimates using AI
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}