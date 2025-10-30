import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { SEOHead } from "@/components/seo-head";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Upload, Car, FileCheck, Send } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const BRANDS = ["Maruti Suzuki", "Hyundai", "Tata", "Mahindra", "Honda", "Toyota", "Ford", "Renault", "Nissan", "Volkswagen"];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 30 }, (_, i) => CURRENT_YEAR - i);

const sellFormSchema = z.object({
  brand: z.string().min(1, "Please select a brand"),
  model: z.string().min(2, "Please enter the car model"),
  year: z.coerce.number().int().min(1990, "Year must be 1990 or later").max(CURRENT_YEAR, `Year cannot be after ${CURRENT_YEAR}`),
  price: z.coerce.number().positive("Price must be greater than 0").min(10000, "Price must be at least ₹10,000"),
  mileage: z.coerce.number().positive("Mileage must be positive").optional().or(z.literal("")),
  image: z.any().optional(),
});

type SellFormValues = z.infer<typeof sellFormSchema>;

const STEPS = [
  { id: 1, name: "Details", icon: Car, description: "Car information" },
  { id: 2, name: "Verification", icon: FileCheck, description: "AI verification" },
  { id: 3, name: "Publish", icon: Send, description: "Go live" }
];

export default function SellPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<SellFormValues>({
    resolver: zodResolver(sellFormSchema),
    defaultValues: {
      brand: "",
      model: "",
      year: undefined,
      price: undefined,
      mileage: undefined,
    }
  });

  const submitMutation = useMutation({
    mutationFn: async (data: SellFormValues) => {
      return apiRequest('POST', '/api/cars', {
        brand: data.brand,
        model: data.model,
        year: data.year,
        price: data.price,
        mileage: data.mileage || undefined,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Your car listing has been submitted for verification.",
      });
      setCurrentStep(3);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit listing. Please try again.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: SellFormValues) => {
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
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
      "url": "https://cararth.com"
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <SEOHead
        title="Sell Your Car - CarArth | AI-Verified Listings"
        description="Sell your used car on CarArth. Free AI-verified listings, reach buyers across India, no paid promotions. List once, reach everywhere."
        keywords="sell car online, sell used car India, car listing, free car listing, AI verified car sale"
        canonical="https://cararth.com/sell"
        structuredData={structuredData}
      />
      
      <Navbar />
      
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            List your car here. Reach everywhere!
          </h1>
          <p className="text-lg text-muted-foreground">
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
                  <h3 className="text-2xl font-bold mb-2">Success!</h3>
                  <p className="text-muted-foreground">
                    Your car listing is now live and verified by AI. Buyers will start seeing it shortly.
                  </p>
                </div>
                <div className="space-y-3">
                  <Badge variant="outline" className="text-sm">
                    ✅ AI-Verified Listing
                  </Badge>
                  <Badge variant="outline" className="text-sm">
                    🚀 Multi-Platform Distribution
                  </Badge>
                  <Badge variant="outline" className="text-sm">
                    🔒 Secure & Trusted
                  </Badge>
                </div>
                <Button className="mt-6" onClick={() => window.location.href = '/'} data-testid="button-view-listings">
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

                      <FormField
                        control={form.control}
                        name="mileage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Kilometers Driven (Optional)</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="50000" {...field} data-testid="input-mileage" />
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
                          <FileCheck className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
                          <h3 className="text-xl font-semibold mb-2">Verifying Your Listing</h3>
                          <p className="text-muted-foreground">
                            Our AI is checking your listing details for accuracy and compliance.
                          </p>
                        </div>
                        
                        <div className="space-y-3 text-left max-w-md mx-auto">
                          <div className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                            <div>
                              <p className="font-medium">Price Validation</p>
                              <p className="text-sm text-muted-foreground">Ensuring fair market pricing</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                            <div>
                              <p className="font-medium">Details Verification</p>
                              <p className="text-sm text-muted-foreground">Validating car information</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                            <div>
                              <p className="font-medium">Compliance Check</p>
                              <p className="text-sm text-muted-foreground">Meeting platform standards</p>
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
                        disabled={submitMutation.isPending}
                        data-testid="button-next"
                      >
                        {currentStep === 1 && "Continue to Verification"}
                        {currentStep === 2 && (submitMutation.isPending ? "Publishing..." : "Publish Listing")}
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
      
      <Footer />
    </div>
  );
}
