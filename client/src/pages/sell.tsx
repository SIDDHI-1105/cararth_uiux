import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { SEOHead } from "@/components/seo-head";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Upload, Car, FileCheck, Send, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const BRANDS = ["Maruti Suzuki", "Hyundai", "Tata", "Mahindra", "Honda", "Toyota", "Ford", "Renault", "Nissan", "Volkswagen"];
const FUEL_TYPES = ["Petrol", "Diesel", "CNG", "Electric", "Hybrid"];
const TRANSMISSIONS = ["Manual", "Automatic", "CVT"];
const CITIES = ["Hyderabad", "Delhi", "Mumbai", "Bangalore", "Pune", "Chennai", "Kolkata", "Ahmedabad", "Jaipur", "Lucknow"];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 30 }, (_, i) => CURRENT_YEAR - i);

const sellFormSchema = z.object({
  brand: z.string().min(1, "Please select a brand"),
  model: z.string().min(2, "Please enter the car model"),
  year: z.coerce.number().int().min(1990, "Year must be 1990 or later").max(CURRENT_YEAR, `Year cannot be after ${CURRENT_YEAR}`),
  price: z.coerce.number().positive("Price must be greater than 0").min(10000, "Price must be at least ₹10,000"),
  mileage: z.coerce.number().positive("Mileage must be positive").min(0, "Mileage cannot be negative"),
  fuelType: z.string().min(1, "Please select a fuel type"),
  transmission: z.string().min(1, "Please select transmission type"),
  city: z.string().min(1, "Please select a city"),
  owners: z.coerce.number().int().min(1, "Number of owners must be at least 1").max(10, "Number of owners cannot exceed 10").optional().default(1),
  description: z.string().optional(),
  image: z.any().optional(),
});

type SellFormValues = z.infer<typeof sellFormSchema>;

const STEPS = [
  { id: 1, name: "Details", icon: Car, description: "Car information" },
  { id: 2, name: "Verification", icon: FileCheck, description: "AI verification" },
  { id: 3, name: "Publish", icon: Send, description: "Go live" }
];

// Price ranges by year (rough estimates for Indian market)
const getPriceRange = (year: number) => {
  const age = CURRENT_YEAR - year;

  if (age <= 2) return { min: 300000, max: 25000000 }; // 3L to 2.5Cr
  if (age <= 5) return { min: 150000, max: 15000000 }; // 1.5L to 1.5Cr
  if (age <= 10) return { min: 50000, max: 8000000 }; // 50k to 80L
  return { min: 20000, max: 5000000 }; // 20k to 50L for older cars
};

// Verification result type
type VerificationResult = {
  status: "ok" | "error" | "verifying";
  checks: {
    price: { passed: boolean; message: string };
    details: { passed: boolean; message: string };
    compliance: { passed: boolean; message: string };
  };
  overallMessage?: string;
};

// Verification function
const verifyListing = (data: SellFormValues): Promise<VerificationResult> => {
  return new Promise((resolve) => {
    // Simulate async verification (500ms delay)
    setTimeout(() => {
      const priceRange = getPriceRange(data.year);
      const checks = {
        price: {
          passed: data.price >= priceRange.min && data.price <= priceRange.max,
          message: data.price < priceRange.min
            ? `Price seems too low for a ${data.year} model. Expected minimum: ₹${(priceRange.min / 100000).toFixed(1)}L`
            : data.price > priceRange.max
            ? `Price seems unrealistically high for a ${data.year} model. Expected maximum: ₹${(priceRange.max / 100000).toFixed(1)}L`
            : `Price is within market range for ${data.year} models`
        },
        details: {
          passed: data.brand && data.model && data.year && data.fuelType && data.transmission && data.city,
          message: data.brand && data.model && data.year && data.fuelType && data.transmission && data.city
            ? "All required fields are present and valid"
            : "Missing required fields"
        },
        compliance: {
          passed: data.mileage >= 0 && data.mileage <= 500000 && (data.owners || 1) <= 10,
          message: data.mileage > 500000
            ? "Mileage exceeds 5 lakh km - please verify"
            : (data.owners || 1) > 10
            ? "Number of owners exceeds reasonable limit"
            : "Listing meets platform standards"
        }
      };

      const allPassed = checks.price.passed && checks.details.passed && checks.compliance.passed;

      resolve({
        status: allPassed ? "ok" : "error",
        checks,
        overallMessage: allPassed
          ? "All verification checks passed! You can now publish your listing."
          : "Some checks failed. Please review and correct the issues before publishing."
      });
    }, 500);
  });
};

export default function SellPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();

  const form = useForm<SellFormValues>({
    resolver: zodResolver(sellFormSchema),
    defaultValues: {
      brand: "",
      model: "",
      year: undefined,
      price: undefined,
      mileage: undefined,
      fuelType: "",
      transmission: "",
      city: "",
      owners: 1,
      description: "",
    }
  });

  const submitMutation = useMutation({
    mutationFn: async (data: SellFormValues) => {
      console.log("🚀 Submitting listing with data:", {
        ...data,
        price: `₹${data.price}`,
        mileage: `${data.mileage} km`
      });

      // Create full payload with all required fields
      const payload = {
        sellerId: "anonymous", // For now, using anonymous seller
        title: `${data.brand} ${data.model} ${data.year}`,
        brand: data.brand,
        model: data.model,
        year: data.year,
        price: data.price,
        mileage: data.mileage,
        fuelType: data.fuelType,
        transmission: data.transmission,
        owners: data.owners || 1,
        location: data.city, // Using city as location
        city: data.city,
        state: "Telangana", // Default for now, should be mapped from city
        description: data.description || `${data.brand} ${data.model} ${data.year} for sale in ${data.city}`,
        features: [],
        images: [],
        source: null,
        listingSource: "user_direct"
      };

      console.log("📤 Sending payload to POST /api/cars:", payload);

      try {
        const response = await apiRequest('POST', '/api/cars', payload);

        console.log("✅ Success! Response status:", response.status);

        if (response.ok) {
          const responseData = await response.json();
          console.log("📥 Response data:", responseData);
          return responseData;
        } else {
          const errorText = await response.text();
          console.error("❌ Error response:", {
            status: response.status,
            statusText: response.statusText,
            body: errorText
          });
          throw new Error(errorText || `Server error: ${response.status}`);
        }
      } catch (error: any) {
        console.error("❌ Request failed:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("🎉 Listing created successfully:", data);
      toast({
        title: "Success!",
        description: "Your car listing has been published successfully.",
      });
      setCurrentStep(3);
    },
    onError: (error: any) => {
      console.error("💥 Submission error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit listing. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Run verification when entering step 2
  useEffect(() => {
    if (currentStep === 2) {
      const runVerification = async () => {
        setIsVerifying(true);
        setVerificationResult({
          status: "verifying",
          checks: {
            price: { passed: false, message: "Checking..." },
            details: { passed: false, message: "Checking..." },
            compliance: { passed: false, message: "Checking..." }
          }
        });

        const formData = form.getValues();
        console.log("🔍 Running verification on data:", formData);

        const result = await verifyListing(formData);
        console.log("✅ Verification result:", result);

        setVerificationResult(result);
        setIsVerifying(false);

        if (result.status === "error") {
          toast({
            title: "Verification Failed",
            description: result.overallMessage,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Verification Passed",
            description: result.overallMessage,
          });
        }
      };

      runVerification();
    }
  }, [currentStep, form, toast]);

  const onSubmit = (data: SellFormValues) => {
    console.log("📝 Form submitted with data:", data);

    if (currentStep === 1) {
      console.log("➡️ Moving to verification step");
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (verificationResult?.status !== "ok") {
        toast({
          title: "Cannot publish",
          description: "Please fix verification errors before publishing.",
          variant: "destructive"
        });
        return;
      }
      console.log("🚀 Publishing listing...");
      submitMutation.mutate(data);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": "Used Car Listing Service",
    "name": "Sell Your Car on CarArth",
    "description": "List your used car for sale on CarArth with AI verification and multi-platform distribution. Reach buyers across India with one listing.",
    "provider": {
      "@type": "Organization",
      "name": "CarArth",
      "url": "https://www.cararth.com"
    },
    "areaServed": {
      "@type": "Country",
      "name": "India"
    },
    "offers": {
      "@type": "Offer",
      "priceCurrency": "INR",
      "price": "0",
      "description": "Free car listing service with AI verification"
    }
  };

  const canPublish = verificationResult?.status === "ok" && !isVerifying;

  return (
    <Layout>
      <SEOHead
        title="Sell Your Car - CarArth | AI-Verified Listings"
        description="Sell your used car on CarArth. Free AI-verified listings, reach buyers across India, no paid promotions. List once, reach everywhere."
        keywords="sell car online, sell used car India, car listing, free car listing, AI verified car sale"
        canonical="https://www.cararth.com/sell"
        structuredData={structuredData}
      />

      <main className="container mx-auto px-4 py-16 md:py-24 max-w-4xl mt-2">
        {/* Header */}
        <div className="text-center mb-16 md:mb-20">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6" style={{ color: 'var(--foreground)' }}>
            List your car here. Reach everywhere!
          </h1>
          <p className="text-lg md:text-xl" style={{ color: 'var(--secondary-text)' }}>
            AI verifies every listing — no paid promotions.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex justify-between items-center relative">
            <div className="absolute top-5 left-0 right-0 h-1 bg-muted -z-10">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
              />
            </div>

            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep >= step.id;
              const isCurrent = currentStep === step.id;

              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                    ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                    ${isCurrent ? 'ring-4 ring-primary/20 scale-110' : ''}
                  `}>
                    {isActive && currentStep > step.id ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <p className={`font-semibold text-sm ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {step.name}
                    </p>
                    <p className="text-xs text-muted-foreground hidden sm:block">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>
              {currentStep === 1 && "Tell us about your car"}
              {currentStep === 2 && "AI Verification"}
              {currentStep === 3 && "Listing Published!"}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && "Provide basic details to get started"}
              {currentStep === 2 && "Our AI will verify your listing details"}
              {currentStep === 3 && "Your car is now live on CarArth"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {currentStep === 3 ? (
              <div className="text-center py-8">
                <div className="mb-6">
                  <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">🎉 Your car listed as CarArthX User!</h3>
                  <p className="text-muted-foreground">
                    Your listing is now live on CarArth with the 👤 CarArthX User badge. Buyers can find it in the search results!
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-4 py-2 rounded-full font-semibold text-sm">
                    👤 CarArthX User
                  </div>
                  <div className="flex flex-wrap justify-center gap-3 mt-4">
                    <Badge variant="outline" className="text-sm">
                      ✅ AI-Verified
                    </Badge>
                    <Badge variant="outline" className="text-sm">
                      🚀 Equal Visibility
                    </Badge>
                    <Badge variant="outline" className="text-sm">
                      🔒 Secure & Trusted
                    </Badge>
                  </div>
                </div>
                <Button className="mt-6" onClick={() => window.location.href = '/results'} data-testid="button-view-listings">
                  View All Listings
                </Button>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {currentStep === 1 && (
                    <>
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
                              <Input placeholder="e.g., Swift, Creta, Nexon" {...field} data-testid="input-model" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="year"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Year</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value?.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger data-testid="select-year">
                                    <SelectValue placeholder="Select year" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {YEARS.map((year) => (
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
                                <Input type="number" placeholder="500000" {...field} data-testid="input-price" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="fuelType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Fuel Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-fuel-type">
                                    <SelectValue placeholder="Select fuel type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {FUEL_TYPES.map((fuel) => (
                                    <SelectItem key={fuel} value={fuel}>
                                      {fuel}
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
                          name="transmission"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Transmission</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-transmission">
                                    <SelectValue placeholder="Select transmission" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {TRANSMISSIONS.map((trans) => (
                                    <SelectItem key={trans} value={trans}>
                                      {trans}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="mileage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Kilometers Driven</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="50000" {...field} data-testid="input-mileage" />
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
                              <FormLabel>City</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-city">
                                    <SelectValue placeholder="Select city" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {CITIES.map((city) => (
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
                      </div>

                      <FormField
                        control={form.control}
                        name="owners"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Number of Owners</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="1" {...field} data-testid="input-owners" min="1" max="10" />
                            </FormControl>
                            <FormDescription>How many owners has the car had?</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Additional details about your car" {...field} data-testid="input-description" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="image"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Car Image (Optional)</FormLabel>
                            <FormControl>
                              <div className="space-y-4">
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    field.onChange(e.target.files);
                                    handleImageChange(e);
                                  }}
                                  data-testid="input-image"
                                />
                                {imagePreview && (
                                  <div className="border rounded-lg overflow-hidden max-w-md">
                                    <img src={imagePreview} alt="Preview" className="w-full h-auto" />
                                  </div>
                                )}
                              </div>
                            </FormControl>
                            <FormDescription>
                              Upload a clear photo of your car for better visibility
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  {currentStep === 2 && (
                    <div className="space-y-6 py-8">
                      <div className="text-center">
                        <div className="mb-6">
                          {isVerifying ? (
                            <Loader2 className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
                          ) : verificationResult?.status === "ok" ? (
                            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
                          ) : (
                            <FileCheck className="w-16 h-16 text-primary mx-auto mb-4" />
                          )}
                          <h3 className="text-xl font-semibold mb-2">
                            {isVerifying ? "Verifying Your Listing" : verificationResult?.status === "ok" ? "Verification Complete" : "Verification Issues Found"}
                          </h3>
                          <p className="text-muted-foreground">
                            {verificationResult?.overallMessage || "Our AI is checking your listing details for accuracy and compliance."}
                          </p>
                        </div>

                        <div className="space-y-3 text-left max-w-md mx-auto">
                          {/* Price Validation */}
                          <div className={`flex items-start gap-3 p-3 rounded-lg ${
                            verificationResult?.checks.price.passed
                              ? 'bg-green-50 dark:bg-green-950/20'
                              : verificationResult?.status === "error"
                              ? 'bg-red-50 dark:bg-red-950/20'
                              : ''
                          }`}>
                            {isVerifying || !verificationResult ? (
                              <Loader2 className="w-5 h-5 text-muted-foreground mt-0.5 animate-spin" />
                            ) : verificationResult.checks.price.passed ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <p className="font-medium">Price Validation</p>
                              <p className="text-sm text-muted-foreground">
                                {verificationResult?.checks.price.message || "Ensuring fair market pricing"}
                              </p>
                            </div>
                          </div>

                          {/* Details Verification */}
                          <div className={`flex items-start gap-3 p-3 rounded-lg ${
                            verificationResult?.checks.details.passed
                              ? 'bg-green-50 dark:bg-green-950/20'
                              : verificationResult?.status === "error"
                              ? 'bg-red-50 dark:bg-red-950/20'
                              : ''
                          }`}>
                            {isVerifying || !verificationResult ? (
                              <Loader2 className="w-5 h-5 text-muted-foreground mt-0.5 animate-spin" />
                            ) : verificationResult.checks.details.passed ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <p className="font-medium">Details Verification</p>
                              <p className="text-sm text-muted-foreground">
                                {verificationResult?.checks.details.message || "Validating car information"}
                              </p>
                            </div>
                          </div>

                          {/* Compliance Check */}
                          <div className={`flex items-start gap-3 p-3 rounded-lg ${
                            verificationResult?.checks.compliance.passed
                              ? 'bg-green-50 dark:bg-green-950/20'
                              : verificationResult?.status === "error"
                              ? 'bg-red-50 dark:bg-red-950/20'
                              : ''
                          }`}>
                            {isVerifying || !verificationResult ? (
                              <Loader2 className="w-5 h-5 text-muted-foreground mt-0.5 animate-spin" />
                            ) : verificationResult.checks.compliance.passed ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <p className="font-medium">Compliance Check</p>
                              <p className="text-sm text-muted-foreground">
                                {verificationResult?.checks.compliance.message || "Meeting platform standards"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-sm">
                        <p className="text-center">
                          <strong>AI verifies every listing — no paid promotions.</strong>
                          <br />
                          All listings get equal visibility based on relevance, not payment.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4 pt-4">
                    {currentStep > 1 && currentStep < 3 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCurrentStep(currentStep - 1)}
                        data-testid="button-back"
                      >
                        Back
                      </Button>
                    )}
                    {currentStep < 3 && (
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={currentStep === 2 && (!canPublish || submitMutation.isPending)}
                        data-testid="button-next"
                      >
                        {currentStep === 1 && "Continue to Verification"}
                        {currentStep === 2 && (submitMutation.isPending ? "Publishing..." : canPublish ? "Publish Listing" : "Verification Required")}
                      </Button>
                    )}
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        {/* Benefits Section */}
        {currentStep === 1 && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6 text-center">
                <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">AI-Verified</h3>
                <p className="text-sm text-muted-foreground">
                  Every listing verified by advanced AI for accuracy
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Send className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Wide Reach</h3>
                <p className="text-sm text-muted-foreground">
                  Your listing reaches buyers across multiple platforms
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Upload className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">List Once</h3>
                <p className="text-sm text-muted-foreground">
                  Upload once, distribute everywhere automatically
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </Layout>
  );
}
