// FILE: client/src/pages/sell-rto.tsx – Enhanced Sell Page with RTO Lookup (Spinny-inspired)

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Search, CheckCircle2, Upload, Loader2, Car, Calendar, Gauge, Fuel, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";

const rtoLookupSchema = z.object({
  registrationNumber: z.string()
    .min(8, "Registration number must be at least 8 characters")
    .max(12, "Registration number cannot exceed 12 characters")
    .regex(/^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$/, "Invalid registration number format (e.g., TS09EA1234)")
});

const sellFormSchema = z.object({
  registrationNumber: z.string().min(8),
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(2, "Model is required"),
  year: z.coerce.number().int().min(1990).max(new Date().getFullYear()),
  price: z.coerce.number().positive().min(10000),
  mileage: z.coerce.number().nonnegative(),
  fuelType: z.string().min(1),
  transmission: z.string().min(1),
  city: z.string().min(1),
  owners: z.coerce.number().int().min(1).max(10).default(1),
  description: z.string().optional(),
  sellerName: z.string().min(2, "Name is required"),
  sellerPhone: z.string().regex(/^[6-9]\d{9}$/, "Invalid phone number"),
  sellerEmail: z.string().email("Invalid email").optional(),
});

type RTOLookupFormValues = z.infer<typeof rtoLookupSchema>;
type SellFormValues = z.infer<typeof sellFormSchema>;

interface RTOData {
  registrationNumber: string;
  brand: string;
  model: string;
  year: number;
  fuelType: string;
  transmission: string;
  city: string;
  ownerSerial: number;
  registrationDate: string;
  chassisNumber?: string;
  engineNumber?: string;
}

export default function SellWithRTO() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { toast } = useToast();
  const [step, setStep] = useState<"rto" | "details" | "preview">("rto");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [rtoData, setRtoData] = useState<RTOData | null>(null);
  const [imagePreview, setImagePreview] = useState<string[]>([]);

  const rtoForm = useForm<RTOLookupFormValues>({
    resolver: zodResolver(rtoLookupSchema),
    defaultValues: {
      registrationNumber: ""
    }
  });

  const sellForm = useForm<SellFormValues>({
    resolver: zodResolver(sellFormSchema),
    defaultValues: {
      registrationNumber: "",
      brand: "",
      model: "",
      year: new Date().getFullYear(),
      price: 0,
      mileage: 0,
      fuelType: "",
      transmission: "",
      city: "",
      owners: 1,
      description: "",
      sellerName: "",
      sellerPhone: "",
      sellerEmail: ""
    }
  });

  const handleRTOLookup = async (data: RTOLookupFormValues) => {
    setIsLookingUp(true);

    try {
      // TODO: Call backend API /api/rto-lookup?reg=XXXX
      // For now, using mock data
      await new Promise(resolve => setTimeout(resolve, 1500));

      const mockRTOData: RTOData = {
        registrationNumber: data.registrationNumber.toUpperCase(),
        brand: "Maruti Suzuki",
        model: "Swift VDi",
        year: 2018,
        fuelType: "Diesel",
        transmission: "Manual",
        city: "Hyderabad",
        ownerSerial: 1,
        registrationDate: "2018-03-15",
        chassisNumber: "MA3***********234",
        engineNumber: "D13A***5678"
      };

      setRtoData(mockRTOData);

      // Auto-fill the sell form
      sellForm.setValue("registrationNumber", mockRTOData.registrationNumber);
      sellForm.setValue("brand", mockRTOData.brand);
      sellForm.setValue("model", mockRTOData.model);
      sellForm.setValue("year", mockRTOData.year);
      sellForm.setValue("fuelType", mockRTOData.fuelType);
      sellForm.setValue("transmission", mockRTOData.transmission);
      sellForm.setValue("city", mockRTOData.city);
      sellForm.setValue("owners", mockRTOData.ownerSerial);

      setStep("details");

      toast({
        title: "Vehicle details fetched!",
        description: "Please verify and add additional information.",
      });
    } catch (error) {
      toast({
        title: "Lookup failed",
        description: "Unable to fetch vehicle details. Please enter manually.",
        variant: "destructive"
      });
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleSellSubmit = async (data: SellFormValues) => {
    // TODO: Call backend API POST /api/listings
    toast({
      title: "Listing created!",
      description: "Your car listing has been submitted for review.",
    });
    console.log("Listing data:", data);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const previews = Array.from(files).map(file => URL.createObjectURL(file));
      setImagePreview(prev => [...prev, ...previews]);
    }
  };

  return (
    <Layout containerSize="lg">
      <div className="py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className={`text-5xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
            💰 Sell Your Car
          </h1>
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Get the best price for your car with our AI-powered verification
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4">
          {[
            { id: "rto", label: "RTO Lookup", icon: Search },
            { id: "details", label: "Details", icon: Car },
            { id: "preview", label: "Preview", icon: CheckCircle2 }
          ].map((s, idx) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all ${
                step === s.id
                  ? isDark
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-500 text-white'
                  : isDark
                  ? 'bg-white/5 text-gray-400'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                <s.icon className="w-5 h-5" />
                <span className="font-bold">{s.label}</span>
              </div>
              {idx < 2 && (
                <div className={`w-12 h-1 rounded ${
                  step !== "rto" && (idx === 0 || step === "preview")
                    ? isDark ? 'bg-blue-600' : 'bg-blue-500'
                    : isDark ? 'bg-white/10' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* RTO Lookup Step */}
        {step === "rto" && (
          <Card className={`max-w-2xl mx-auto ${
            isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
          }`}>
            <CardHeader>
              <CardTitle className={isDark ? 'text-white' : 'text-gray-900'}>
                Enter Your Vehicle Registration Number
              </CardTitle>
              <CardDescription>
                We'll fetch your vehicle details automatically from RTO database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...rtoForm}>
                <form onSubmit={rtoForm.handleSubmit(handleRTOLookup)} className="space-y-6">
                  <FormField
                    control={rtoForm.control}
                    name="registrationNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Registration Number</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="TS09EA1234"
                            className="text-lg font-bold uppercase"
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg font-bold"
                    disabled={isLookingUp}
                  >
                    {isLookingUp ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Looking up...
                      </>
                    ) : (
                      <>
                        <Search className="w-5 h-5 mr-2" />
                        Fetch Vehicle Details
                      </>
                    )}
                  </Button>

                  <div className="text-center">
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => setStep("details")}
                      className={isDark ? 'text-gray-400' : 'text-gray-600'}
                    >
                      Or enter details manually →
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Details Step */}
        {step === "details" && (
          <Card className={`max-w-4xl mx-auto ${
            isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
          }`}>
            <CardHeader>
              <CardTitle className={isDark ? 'text-white' : 'text-gray-900'}>
                Vehicle & Seller Details
              </CardTitle>
              <CardDescription>
                {rtoData ? "Details auto-filled from RTO. You can edit if needed." : "Fill in your vehicle details"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...sellForm}>
                <form onSubmit={sellForm.handleSubmit(handleSellSubmit)} className="space-y-6">
                  {/* Vehicle Details Section */}
                  <div className="space-y-4">
                    <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Vehicle Information
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={sellForm.control}
                        name="brand"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Brand</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Maruti Suzuki" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={sellForm.control}
                        name="model"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Model</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Swift VDi" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={sellForm.control}
                        name="year"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Year</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" placeholder="2018" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={sellForm.control}
                        name="mileage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mileage (km)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" placeholder="45000" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={sellForm.control}
                        name="fuelType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fuel Type</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Diesel" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={sellForm.control}
                        name="transmission"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Transmission</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Manual" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={sellForm.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Hyderabad" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={sellForm.control}
                        name="owners"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Number of Owners</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" placeholder="1" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={sellForm.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Asking Price (₹)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" placeholder="500000" className="text-2xl font-bold" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={sellForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Tell buyers about your car..." rows={4} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Seller Details Section */}
                  <div className="space-y-4 pt-6 border-t">
                    <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Your Contact Information
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={sellForm.control}
                        name="sellerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Your Name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={sellForm.control}
                        name="sellerPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="9876543210" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={sellForm.control}
                        name="sellerEmail"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>Email (Optional)</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" placeholder="your.email@example.com" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Image Upload Section */}
                  <div className="space-y-4 pt-6 border-t">
                    <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Upload Photos
                    </h3>
                    <div className={`border-2 border-dashed rounded-2xl p-8 text-center ${
                      isDark ? 'border-white/20' : 'border-gray-300'
                    }`}>
                      <Upload className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                      <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Upload up to 10 photos of your car
                      </p>
                      <Input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="max-w-xs mx-auto"
                      />
                    </div>
                    {imagePreview.length > 0 && (
                      <div className="grid grid-cols-4 gap-4">
                        {imagePreview.map((preview, idx) => (
                          <img key={idx} src={preview} alt={`Preview ${idx + 1}`} className="w-full h-32 object-cover rounded-lg" />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep("rto")}
                      className="flex-1"
                    >
                      ← Back
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg font-bold"
                    >
                      Submit Listing →
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
