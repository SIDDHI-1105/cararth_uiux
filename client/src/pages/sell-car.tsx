import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Car, FileText, Camera, Eye, Globe, TrendingUp, 
  CheckCircle2, Upload, MapPin 
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from '@uppy/core';
import Layout from "@/components/layout";

// Simplified schema with only essential fields
const simplifiedSellCarSchema = z.object({
  sellerId: z.string(),
  // Essential car details only
  brand: z.string().min(2, 'Brand is required'),
  model: z.string().min(1, 'Model is required'), 
  year: z.number().min(1990, 'Year must be 1990 or later'),
  price: z.number().min(10000, 'Price must be at least ₹10,000'),
  city: z.string().min(2, 'City is required'),
  
  // Contact information
  actualPhone: z.string().regex(/^[6-9]\d{9}$/, 'Please provide a valid 10-digit mobile number'),
  actualEmail: z.string().email('Please provide a valid email address'),
  
  // Required documents and photos (simplified)
  rcBookDocument: z.string().url('RC book document is required').optional(),
  insuranceDocument: z.string().url('Insurance document is required').optional(),
  frontPhoto: z.string().url('Front photo is required').optional(),
  rearPhoto: z.string().url('Rear photo is required').optional(),
  leftSidePhoto: z.string().url('Left side photo is required').optional(),
  rightSidePhoto: z.string().url('Right side photo is required').optional(),
  interiorPhoto: z.string().url('Interior photo is required').optional(),
});

const BRANDS = [
  "Maruti Suzuki", "Hyundai", "Tata", "Mahindra", "Honda", "Toyota",
  "Ford", "Volkswagen", "Skoda", "Renault", "Nissan", "Chevrolet"
];

const MAJOR_CITIES = [
  "Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad", "Pune", 
  "Ahmedabad", "Kolkata", "Surat", "Jaipur", "Lucknow", "Kanpur",
  "Noida", "Gurgaon", "Indore", "Bhopal", "Nagpur", "Coimbatore"
];

export default function SellCar() {
  const { toast } = useToast();
  const [uploadProgress, setUploadProgress] = useState({
    rcBook: false,
    insurance: false,
    frontPhoto: false,
    rearPhoto: false,
    leftSidePhoto: false,
    rightSidePhoto: false,
    interiorPhoto: false,
  });

  const form = useForm<z.infer<typeof simplifiedSellCarSchema>>({
    resolver: zodResolver(simplifiedSellCarSchema),
    defaultValues: {
      sellerId: "temp-seller",
      brand: "",
      model: "",
      year: 2020,
      price: 0,
      city: "",
      actualPhone: "",
      actualEmail: "",
    },
  });

  const createListingMutation = useMutation({
    mutationFn: async (data: z.infer<typeof simplifiedSellCarSchema>) => {
      const response = await apiRequest("POST", "/api/seller/listings", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "🎉 Your Car is Now Live!",
        description: "Your listing is being syndicated across multiple platforms for maximum visibility.",
      });
      form.reset();
      setUploadProgress({
        rcBook: false,
        insurance: false,
        frontPhoto: false,
        rearPhoto: false,
        leftSidePhoto: false,
        rightSidePhoto: false,
        interiorPhoto: false,
      });
    },
    onError: () => {
      toast({
        title: "Upload Failed",
        description: "Please check all required documents and photos are uploaded.",
        variant: "destructive",
      });
    },
  });

  const handleUploadComplete = (category: string, result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful[0]) {
      setUploadProgress(prev => ({ ...prev, [category]: true }));
      const fileUrl = result.successful[0].uploadURL;
      
      // Update form field with the uploaded file URL
      if (category === 'rcBook') {
        form.setValue('rcBookDocument', fileUrl);
      } else if (category === 'insurance') {
        form.setValue('insuranceDocument', fileUrl);
      } else if (category === 'frontPhoto') {
        form.setValue('frontPhoto', fileUrl);
      } else if (category === 'rearPhoto') {
        form.setValue('rearPhoto', fileUrl);
      } else if (category === 'leftSidePhoto') {
        form.setValue('leftSidePhoto', fileUrl);
      } else if (category === 'rightSidePhoto') {
        form.setValue('rightSidePhoto', fileUrl);
      } else if (category === 'interiorPhoto') {
        form.setValue('interiorPhoto', fileUrl);
      }
      
      toast({
        title: "✅ Upload Complete!",
        description: category === 'rcBook' || category === 'insurance' 
          ? `${category === 'rcBook' ? 'RC Book' : 'Insurance'} document verified and ready for syndication.`
          : `${category} photo uploaded! One step closer to maximum visibility.`,
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

  const onSubmit = async (data: z.infer<typeof simplifiedSellCarSchema>) => {
    createListingMutation.mutate(data);
  };

  const uploadProgress_allDone = 
    uploadProgress.rcBook && 
    uploadProgress.insurance &&
    uploadProgress.frontPhoto && 
    uploadProgress.rearPhoto &&
    uploadProgress.leftSidePhoto && 
    uploadProgress.rightSidePhoto &&
    uploadProgress.interiorPhoto;

  return (
    <Layout containerSize="lg">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        
        {/* Hero Section with Cross-Platform Messaging */}
        <div className="text-center mb-8 space-y-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Car className="h-8 w-8 text-green-600" />
            <h1 className="text-3xl font-bold">Sell Your Car Faster</h1>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 p-6 rounded-xl space-y-3">
            <div className="flex items-center justify-center gap-4 text-sm font-medium">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-600" />
                <span>One Post</span>
              </div>
              <div className="text-gray-400">→</div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-green-600" />
                <span>Internal Network</span>
              </div>
              <div className="text-gray-400">→</div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-orange-600" />
                <span>Growing Reach</span>
              </div>
            </div>
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              List your car on Cararth's platform with authentic verification
            </p>
            <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 p-3 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                🚀 <strong>Coming Soon:</strong> Multi-platform syndication to CarDekho, OLX, Cars24 and other major platforms. Currently building partnerships for maximum distribution.
              </p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Essential Car Details - Simplified */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Details</CardTitle>
                <p className="text-sm text-muted-foreground">Just the essentials to get started</p>
              </CardHeader>
              <CardContent className="space-y-4">
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
                        <FormLabel>Expected Price (₹ Lakhs)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.25" 
                            placeholder="e.g., 6.25" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            data-testid="input-price" 
                          />
                        </FormControl>
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
                          <MapPin className="h-4 w-4" />
                          City
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-city">
                              <SelectValue placeholder="Select your city" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {MAJOR_CITIES.map((city) => (
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
                    name="actualPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Number</FormLabel>
                        <FormControl>
                          <Input placeholder="10-digit mobile number" {...field} data-testid="input-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                </div>
              </CardContent>
            </Card>

            {/* Documents Section - Emphasized */}
            <Card className="border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-600" />
                  Required Documents
                  <span className="text-sm bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded-full ml-2">
                    Builds Trust
                  </span>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Upload your RC Book and Insurance to build buyer confidence and get 3x more inquiries
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium flex items-center gap-2">
                        RC Book
                        {uploadProgress.rcBook && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      </span>
                      {!uploadProgress.rcBook && (
                        <span className="text-xs text-orange-600 bg-orange-50 dark:bg-orange-950 px-2 py-1 rounded">Required</span>
                      )}
                    </div>
                    <ObjectUploader
                      onGetUploadParameters={getUploadParameters('rcBook')}
                      onComplete={(result) => handleUploadComplete('rcBook', result)}
                      maxFileSize={5242880}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadProgress.rcBook ? "✓ RC Uploaded" : "Upload RC Book"}
                    </ObjectUploader>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium flex items-center gap-2">
                        Insurance
                        {uploadProgress.insurance && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      </span>
                      {!uploadProgress.insurance && (
                        <span className="text-xs text-orange-600 bg-orange-50 dark:bg-orange-950 px-2 py-1 rounded">Required</span>
                      )}
                    </div>
                    <ObjectUploader
                      onGetUploadParameters={getUploadParameters('insurance')}
                      onComplete={(result) => handleUploadComplete('insurance', result)}
                      maxFileSize={5242880}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadProgress.insurance ? "✓ Insurance Uploaded" : "Upload Insurance"}
                    </ObjectUploader>
                  </div>

                </div>
              </CardContent>
            </Card>

            {/* Photos Section - Emphasized */}
            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Camera className="h-5 w-5 text-blue-600" />
                  Car Photos
                  <span className="text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full ml-2">
                    5 Required
                  </span>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  High-quality photos get 5x more views and sell 2x faster across all platforms
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Front Photo */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Front View</span>
                      {uploadProgress.frontPhoto && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                    </div>
                    <ObjectUploader
                      onGetUploadParameters={getUploadParameters('frontPhoto')}
                      onComplete={(result) => handleUploadComplete('frontPhoto', result)}
                      maxFileSize={5242880}
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      {uploadProgress.frontPhoto ? "✓ Front" : "Front"}
                    </ObjectUploader>
                  </div>

                  {/* Rear Photo */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Rear View</span>
                      {uploadProgress.rearPhoto && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                    </div>
                    <ObjectUploader
                      onGetUploadParameters={getUploadParameters('rearPhoto')}
                      onComplete={(result) => handleUploadComplete('rearPhoto', result)}
                      maxFileSize={5242880}
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      {uploadProgress.rearPhoto ? "✓ Rear" : "Rear"}
                    </ObjectUploader>
                  </div>

                  {/* Left Side Photo */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Left Side</span>
                      {uploadProgress.leftSidePhoto && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                    </div>
                    <ObjectUploader
                      onGetUploadParameters={getUploadParameters('leftSidePhoto')}
                      onComplete={(result) => handleUploadComplete('leftSidePhoto', result)}
                      maxFileSize={5242880}
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      {uploadProgress.leftSidePhoto ? "✓ Left" : "Left"}
                    </ObjectUploader>
                  </div>

                  {/* Right Side Photo */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Right Side</span>
                      {uploadProgress.rightSidePhoto && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                    </div>
                    <ObjectUploader
                      onGetUploadParameters={getUploadParameters('rightSidePhoto')}
                      onComplete={(result) => handleUploadComplete('rightSidePhoto', result)}
                      maxFileSize={5242880}
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      {uploadProgress.rightSidePhoto ? "✓ Right" : "Right"}
                    </ObjectUploader>
                  </div>

                  {/* Interior Photo */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Interior</span>
                      {uploadProgress.interiorPhoto && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                    </div>
                    <ObjectUploader
                      onGetUploadParameters={getUploadParameters('interiorPhoto')}
                      onComplete={(result) => handleUploadComplete('interiorPhoto', result)}
                      maxFileSize={5242880}
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      {uploadProgress.interiorPhoto ? "✓ Interior" : "Interior"}
                    </ObjectUploader>
                    <p className="text-xs text-gray-500">Show odometer clearly</p>
                  </div>

                </div>
              </CardContent>
            </Card>

            {/* Submit Section */}
            <div className="space-y-4">
              {uploadProgress_allDone && (
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-300 font-medium">
                    <CheckCircle2 className="h-5 w-5" />
                    Ready to Launch!
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    All documents and photos uploaded. Your listing will appear on multiple platforms within minutes.
                  </p>
                </div>
              )}

              <Button 
                type="submit" 
                size="lg" 
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                disabled={createListingMutation.isPending || !uploadProgress_allDone}
                data-testid="button-submit"
              >
                {createListingMutation.isPending ? (
                  "Publishing Across Platforms..."
                ) : uploadProgress_allDone ? (
                  "🚀 Publish Across All Platforms"
                ) : (
                  "Upload Documents & Photos First"
                )}
              </Button>
              
              {!uploadProgress_allDone && (
                <p className="text-center text-sm text-muted-foreground">
                  Complete all uploads to maximize your car's visibility across India's top car platforms
                </p>
              )}
            </div>

          </form>
        </Form>
      </div>
    </Layout>
  );
}