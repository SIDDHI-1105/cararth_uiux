import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { SEOHead } from "@/components/seo-head";
import { 
  Car, FileText, Camera, Eye, Globe, TrendingUp, 
  CheckCircle2, Upload, MapPin, Package, AlertCircle, CheckCircle, Loader2,
  BarChart3, TrendingDown, Activity
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from '@uppy/core';
import Layout from "@/components/layout";
import AIPriceWidget from "@/components/ai-price-widget";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";

// Simplified schema with only essential fields
const simplifiedSellCarSchema = z.object({
  // Essential car details only
  brand: z.string().min(2, 'Brand is required'),
  model: z.string().min(1, 'Model is required'), 
  year: z.number().min(1990, 'Year must be 1990 or later'),
  price: z.number().min(0.5, 'Price must be at least ₹0.5 lakhs (₹50,000)'),
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
  
  // DPDP Act 2023 Compliance: Mandatory consent for cross-platform syndication
  syndicationConsent: z.boolean().refine(val => val === true, {
    message: 'You must accept the syndication terms to publish your listing'
  }),
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
  const [marketInsights, setMarketInsights] = useState<any>(null);

  // SEO structured data
  const structuredData = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Sell Your Car on CarArth",
    "description": "List your car once and syndicate across multiple platforms including OLX, Cars24, CarDekho, and Facebook Marketplace. Maximum visibility, authentic verification.",
    "provider": {
      "@type": "Organization",
      "name": "CarArth",
      "url": "https://cararth.com"
    },
    "areaServed": {
      "@type": "Country",
      "name": "India"
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "INR"
    }
  }), []);

  const form = useForm<z.infer<typeof simplifiedSellCarSchema>>({
    resolver: zodResolver(simplifiedSellCarSchema),
    defaultValues: {
      brand: "",
      model: "",
      year: 2020,
      price: 0,
      city: "",
      actualPhone: "",
      actualEmail: "",
      syndicationConsent: false,
    },
  });

  // Fetch market insights mutation
  const fetchInsightsMutation = useMutation({
    mutationFn: async ({ brand, model, city }: { brand: string; model: string; city?: string }) => {
      const response = await apiRequest("GET", `/api/telangana-insights/${brand}/${model}${city ? `?city=${city}` : ''}`);
      return response.json();
    },
    onSuccess: (data) => {
      setMarketInsights(data);
      toast({
        title: "✅ Market Insights Loaded!",
        description: `Found ${data.totalRegistrations.toLocaleString()} registrations in Telangana`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "No Data Available",
        description: error.message === "No market insights available for this vehicle" 
          ? "Market insights available for Telangana vehicles only. Other states coming soon!"
          : "Unable to fetch market insights at this time.",
        variant: "destructive",
      });
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
    // Convert price from lakhs to rupees for API
    const apiData = {
      ...data,
      price: data.price * 100000 // Convert lakhs to rupees
    };
    createListingMutation.mutate(apiData);
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
      <SEOHead 
        title="Sell Your Car Online | Post Once, Reach Everywhere | CarArth"
        description="Sell your car on CarArth and reach buyers across OLX, Cars24, CarDekho, and Facebook Marketplace. One upload, multiple platforms, maximum visibility. AI-powered pricing, authentic verification."
        keywords="sell car online India, car selling platform, list car for sale, OLX car posting, Cars24 dealer, CarDekho listing, sell used car, car syndication India"
        ogType="website"
        structuredData={structuredData}
        canonical="https://www.cararth.com/sell-your-car"
      />
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

        <Tabs defaultValue="single" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="single" className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              Single Car
            </TabsTrigger>
            <TabsTrigger value="bulk" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Bulk Upload / Dealer Partners
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single">
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

                </div>

                {/* AI Price Assistant Widget */}
                <div className="mt-6 pt-6 border-t border-border">
                  <AIPriceWidget 
                    onPriceEstimate={(estimatedPrice) => {
                      // Convert from rupees to lakhs for the form
                      const priceInLakhs = estimatedPrice / 100000;
                      form.setValue('price', priceInLakhs);
                    }}
                    className="mb-4"
                  />
                </div>

                {/* Telangana Market Intelligence */}
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-purple-600" />
                      <h3 className="font-semibold">Market Intelligence</h3>
                      <Badge variant="outline" className="text-xs">Telangana</Badge>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const brand = form.getValues('brand');
                        const model = form.getValues('model');
                        const city = form.getValues('city');
                        
                        if (!brand || !model) {
                          toast({
                            title: "Missing Information",
                            description: "Please select brand and model first",
                            variant: "destructive",
                          });
                          return;
                        }
                        
                        fetchInsightsMutation.mutate({ brand, model, city });
                      }}
                      disabled={fetchInsightsMutation.isPending}
                    >
                      {fetchInsightsMutation.isPending ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading...</>
                      ) : (
                        <><Activity className="h-4 w-4 mr-2" /> Get Insights</>
                      )}
                    </Button>
                  </div>

                  {marketInsights ? (
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 p-4 rounded-lg space-y-3">
                      {/* Demand Score */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Demand Score:</span>
                        <Badge 
                          variant={marketInsights.demandScore === 'HIGH' ? 'default' : marketInsights.demandScore === 'MEDIUM' ? 'secondary' : 'outline'}
                          className={marketInsights.demandScore === 'HIGH' ? 'bg-green-600' : ''}
                        >
                          {marketInsights.demandScore === 'HIGH' && '🔥 '}
                          {marketInsights.demandScore === 'MEDIUM' && '⚡ '}
                          {marketInsights.demandScore === 'LOW' && '💤 '}
                          {marketInsights.demandScore}
                        </Badge>
                      </div>

                      {/* Key Insights */}
                      <div className="space-y-2">
                        {marketInsights.insights.map((insight: string, index: number) => (
                          <div key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-purple-600" />
                            <span>{insight}</span>
                          </div>
                        ))}
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/50">
                        <div>
                          <p className="text-xs text-muted-foreground">Total Registrations</p>
                          <p className="font-semibold">{marketInsights.totalRegistrations.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Last Month</p>
                          <p className="font-semibold flex items-center gap-1">
                            {marketInsights.lastMonthRegistrations}
                            {marketInsights.demandTrend === 'UP' && <TrendingUp className="h-4 w-4 text-green-600" />}
                            {marketInsights.demandTrend === 'DOWN' && <TrendingDown className="h-4 w-4 text-red-600" />}
                          </p>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground pt-2 border-t border-border/50">
                        📊 {marketInsights.dataSource}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Get real-time market demand insights for Telangana vehicles powered by official RTA data
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              {/* DPDP Act 2023 Compliance: Mandatory Syndication Consent */}
              <FormField
                control={form.control}
                name="syndicationConsent"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-muted/50">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-syndication-consent"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-medium leading-relaxed">
                        I authorize CarArth to syndicate my listing to partner platforms including OLX, Quikr, and Facebook Marketplace (and other verified automotive marketplaces), and consent to data processing as described in the{" "}
                        <a 
                          href="/terms" 
                          target="_blank" 
                          className="text-primary underline hover:text-primary/80"
                          data-testid="link-terms"
                        >
                          Syndication Terms & Authorization
                        </a>
                        {" "}(DPDP Act 2023 compliant)
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

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
          </TabsContent>

          <TabsContent value="bulk">
            <BulkUploadSection />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

// Type for bulk upload job status
interface BulkUploadJobStatus {
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'partial';
  totalRows: number;
  processedRows: number;
  successfulListings: number;
  failedListings: number;
  errorMessage?: string;
}

// Bulk Upload Section Component
function BulkUploadSection() {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [jobId, setJobId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Poll for job status
  const { data: jobStatus } = useQuery<BulkUploadJobStatus>({
    queryKey: ['/api/seller/bulk-upload', jobId],
    enabled: !!jobId,
    refetchInterval: (data) => {
      const status = data.state.data?.status;
      if (status === 'completed' || status === 'failed' || status === 'partial') {
        return false;
      }
      return 2000;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ csv, media }: { csv: File; media: File[] }) => {
      const formData = new FormData();
      formData.append('csv', csv);
      media.forEach((file) => {
        formData.append('media', file);
      });

      const response = await fetch('/api/seller/bulk-upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setJobId(data.jobId);
      toast({
        title: "Upload Started!",
        description: `Processing ${data.totalListings} listings...`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsUploading(false);
    },
  });

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to upload listings",
        variant: "destructive",
      });
      return;
    }

    if (!csvFile) {
      toast({
        title: "CSV Required",
        description: "Please select a CSV file",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    uploadMutation.mutate({ csv: csvFile, media: mediaFiles });
  };

  const downloadTemplate = () => {
    const headers = [
      'title', 'brand', 'model', 'year', 'price', 'mileage',
      'fuelType', 'transmission', 'owners', 'city', 'location',
      'description', 'images'
    ];
    const exampleRow = [
      '2019 Honda City VX',
      'Honda',
      'City',
      '2019',
      '750000',
      '35000',
      'Petrol',
      'Automatic',
      '1',
      'Hyderabad',
      'Gachibowli, Hyderabad',
      'Well maintained Honda City with full service history',
      'https://example.com/image1.jpg,https://example.com/image2.jpg'
    ];

    const csvContent = [headers.join(','), exampleRow.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cararth-bulk-upload-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Dealer Partner Info Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <div className="bg-blue-600 text-white p-2 rounded-lg">
            <Package className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Dealer Partners - Professional Inventory Management
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
              Are you a dealer (OEM or Others) with multiple vehicles? Register once and get access to our professional inventory upload system with Google Vehicle Listing feed compliance, API integration, and VIN validation.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/dealer/dashboard'}
              className="bg-white dark:bg-gray-800"
              data-testid="button-dealer-access"
            >
              <Car className="h-4 w-4 mr-2" />
              Access Dealer Portal
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Individual Bulk Upload - Add Multiple Cars
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Upload a CSV file with your car listings. You can also attach images/videos.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Download Template */}
          <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                  First time using bulk upload?
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Download our template to see the required format
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadTemplate}
                className="shrink-0"
                data-testid="button-download-template"
              >
                <FileText className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>
          </div>

          {/* CSV Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">CSV File *</label>
            <Input
              type="file"
              accept=".csv"
              onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
              disabled={isUploading || !!jobId}
              data-testid="input-csv-file"
            />
            {csvFile && (
              <p className="text-sm text-muted-foreground mt-1">
                Selected: {csvFile.name} ({(csvFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          {/* Media Files Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Images/Videos (Optional)
            </label>
            <Input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={(e) => setMediaFiles(Array.from(e.target.files || []))}
              disabled={isUploading || !!jobId}
              data-testid="input-media-files"
            />
            {mediaFiles.length > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {mediaFiles.length} file(s) selected
              </p>
            )}
          </div>

          {/* Upload Button */}
          {!jobId && (
            <Button
              onClick={handleSubmit}
              disabled={!csvFile || isUploading}
              className="w-full"
              size="lg"
              data-testid="button-start-upload"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Start Upload
                </>
              )}
            </Button>
          )}

          {/* Job Status */}
          {jobId && jobStatus && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Upload Progress</h4>
                <span className="text-sm text-muted-foreground">
                  Job ID: {jobId.slice(0, 8)}...
                </span>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                {jobStatus.status === 'completed' && (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
                {jobStatus.status === 'processing' && (
                  <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                )}
                {jobStatus.status === 'failed' && (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                <span className="font-medium capitalize">{jobStatus.status}</span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>
                    {jobStatus.processedRows || 0} / {jobStatus.totalRows || 0} rows processed
                  </span>
                  <span>
                    {jobStatus.successfulListings || 0} successful
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${((jobStatus.processedRows || 0) / (jobStatus.totalRows || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Success/Error Messages */}
              {jobStatus.status === 'completed' && (
                <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-green-700 dark:text-green-300 font-medium">
                    ✅ Upload Complete! {jobStatus.successfulListings} listings added to your inventory.
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    Your cars are now visible on CarArth!
                  </p>
                </div>
              )}

              {jobStatus.status === 'failed' && (
                <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-red-700 dark:text-red-300 font-medium">
                    ❌ Upload Failed
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    {jobStatus.errorMessage || 'An error occurred during processing'}
                  </p>
                </div>
              )}

              {/* Reset Button */}
              {(jobStatus.status === 'completed' || jobStatus.status === 'failed') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setJobId(null);
                    setCsvFile(null);
                    setMediaFiles([]);
                    setIsUploading(false);
                  }}
                  className="w-full"
                  data-testid="button-upload-another"
                >
                  Upload Another Batch
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}