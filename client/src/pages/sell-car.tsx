import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Car, Upload, FileText } from "lucide-react";
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
  "Ahmedabad", "Kolkata", "Surat", "Jaipur", "Lucknow", "Kanpur"
];

export default function SellCar() {
  const { toast } = useToast();
  const [uploadProgress, setUploadProgress] = useState({
    registration: false,
    insurance: false,
  });

  const form = useForm<z.infer<typeof sellCarSchema>>({
    resolver: zodResolver(sellCarSchema),
    defaultValues: {
      sellerId: "temp-seller",
      actualPhone: "",
      actualEmail: "",
    },
  });

  const createListingMutation = useMutation({
    mutationFn: async (data: z.infer<typeof sellCarSchema>) => {
      return apiRequest("/api/seller/listings", {
        method: "POST",
        body: JSON.stringify(data),
      });
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
    const response = await apiRequest(`/api/seller/upload-url?category=${category}`);
    return {
      method: 'PUT' as const,
      url: response.uploadURL,
    };
  };

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
                          <FormLabel>Price (₹ Lakhs)</FormLabel>
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
                            placeholder="Describe your car's condition, maintenance history... Share details with #themobilityhub.in community"
                            className="min-h-[100px]"
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