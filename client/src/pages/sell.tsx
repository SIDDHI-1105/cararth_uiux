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
import { Search, CheckCircle2, Upload, Loader2, Car } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";
import { ObjectUploader } from "@/components/ObjectUploader";

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
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);

  const rtoForm = useForm<RTOLookupFormValues>({
    resolver: zodResolver(rtoLookupSchema),
    defaultValues: { registrationNumber: "" }
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

  // --- RTO lookup handler (calls your backend proxy) ---
  const handleRTOLookup = async (data: RTOLookupFormValues) => {
    setIsLookingUp(true);
    try {
      const response = await fetch(`/api/v1/vahan/vehicle?regno=${encodeURIComponent(data.registrationNumber)}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || result.error || 'Failed to fetch vehicle details');
      }

      const vahanData = result.data;

      const mapped: RTOData = {
        registrationNumber: data.registrationNumber.toUpperCase(),
        brand: vahanData.make || "Unknown",
        model: vahanData.model || "Unknown",
        year: vahanData.registrationYear || new Date().getFullYear(),
        fuelType: vahanData.fuelType || "Petrol",
        transmission: vahanData.transmission || "Manual",
        city: vahanData.registeredCity || vahanData.registeredState || "",
        ownerSerial: vahanData.ownerSerial || 1,
        registrationDate: vahanData.registrationDate || "",
        chassisNumber: vahanData.chassisNumber,
        engineNumber: vahanData.engineNumber
      };

      setRtoData(mapped);

      // Autofill sell form
      sellForm.setValue("registrationNumber", mapped.registrationNumber);
      sellForm.setValue("brand", mapped.brand);
      sellForm.setValue("model", mapped.model);
      sellForm.setValue("year", mapped.year);
      sellForm.setValue("fuelType", mapped.fuelType);
      sellForm.setValue("transmission", mapped.transmission);
      sellForm.setValue("city", mapped.city);
      sellForm.setValue("owners", mapped.ownerSerial);

      setStep("details");
      toast({ title: "Vehicle details fetched!", description: "Auto-filled from RTO — please verify." });
    } catch (error) {
      console.error('VAHAN lookup error:', error);
      toast({
        title: "Lookup failed",
        description: error instanceof Error ? error.message : "Unable to fetch vehicle details. You can enter details manually.",
        variant: "destructive"
      });
    } finally {
      setIsLookingUp(false);
    }
  };

  // --- Upload helpers (unchanged) ---
  const handleGetUploadParameters = async () => {
    const response = await fetch('/api/v1/uploads/seller/presigned-url?category=vehicle-images');
    const data = await response.json();
    if (!data.success) throw new Error('Failed to get upload URL');
    return { method: 'PUT' as const, url: data.url };
  };

  const handleUploadComplete = (result: any) => {
    const urls = result.successful?.map((f: any) => f.uploadURL) || [];
    setUploadedImageUrls(prev => [...prev, ...urls]);
    toast({ title: "Images uploaded!", description: `${urls.length} image(s) uploaded successfully.` });
  };

  // --- Submit listing (placeholder) ---
  const handleSellSubmit = async (data: SellFormValues) => {
    toast({ title: "Listing created!", description: "Your car listing has been submitted for review." });
    console.log("Listing data:", data);
    setStep("preview");
  };

  // --- Small helper: render left label + value for preview ---
  const PreviewRow = ({ label, value }: { label: string; value?: string | number | null }) => (
    <div className="flex items-start justify-between gap-4 py-2 border-b last:border-b-0">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-sm font-medium text-right">{value ?? "-"}</div>
    </div>
  );

  return (
    <Layout containerSize="lg">
      <div className="py-12">
        {/* Header */}
        <div className="max-w-4xl mx-auto text-center mb-10 px-4">
          <h1 className={`text-4xl md:text-5xl font-extrabold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            💰 Sell Your Car
          </h1>
          <p className={`mt-3 text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Get the best price for your car — quick RTO lookup, autofill, and polished publishing flow.
          </p>
        </div>

        {/* Progress / tabs (centered) */}
        <div className="flex justify-center mb-10 px-4">
          <div className="inline-flex items-center space-x-4 bg-transparent rounded-full p-1">
            {[
              { id: "rto", label: "RTO Lookup", icon: Search },
              { id: "details", label: "Details", icon: Car },
              { id: "preview", label: "Preview", icon: CheckCircle2 }
            ].map((s, idx) => (
              <div key={s.id} className="flex items-center">
                <div
                  className={`flex items-center gap-3 px-5 py-2 rounded-full transition-shadow duration-200
                    ${step === s.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-50 dark:bg-white/5 text-gray-700'}
                  `}
                >
                  <s.icon className="w-4 h-4" />
                  <span className="text-sm font-semibold">{s.label}</span>
                </div>
                {idx < 2 && <div className="w-6 h-0.5 mx-3 bg-gray-200 dark:bg-white/10" />}
              </div>
            ))}
          </div>
        </div>

        <div className="px-4">
          {/* CENTERED RTO LOOKUP CARD */}
          {step === "rto" && (
            <div className="max-w-3xl mx-auto">
              <Card className={`rounded-2xl overflow-hidden shadow-xl ${isDark ? 'bg-white/5 border-white/6' : 'bg-white'}`}>
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="flex-shrink-0">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white ${isDark ? 'bg-blue-500' : 'bg-blue-600'}`}>
                        <Search className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="flex-1">
                      <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Enter Your Vehicle Registration Number
                      </h2>
                      <p className={`mt-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        We will fetch vehicle details from the RTO database (VAHAN). Example: <span className="font-mono">TS09EA1234</span>
                      </p>

                      <div className="mt-6">
                        <Form {...rtoForm}>
                          <form onSubmit={rtoForm.handleSubmit(handleRTOLookup)} className="grid grid-cols-1 gap-4">
                            <FormField
                              control={rtoForm.control}
                              name="registrationNumber"
                              render={({ field, fieldState }) => (
                                <FormItem>
                                  <FormLabel className="sr-only">Registration Number</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      aria-label="Vehicle registration number"
                                      placeholder="TS09EA1234"
                                      className="text-lg font-semibold tracking-widest uppercase py-3"
                                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                      autoFocus
                                    />
                                  </FormControl>
                                  <FormMessage />
                                  {/* inline error */}
                                  {fieldState.error && (
                                    <div role="alert" aria-live="polite" className="mt-2 text-sm text-red-600">
                                      {fieldState.error.message}
                                    </div>
                                  )}
                                </FormItem>
                              )}
                            />

                            <div className="flex items-center gap-3">
                              <Button
                                type="submit"
                                className="flex-1 h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700"
                                disabled={isLookingUp}
                              >
                                {isLookingUp ? (
                                  <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Looking up…
                                  </>
                                ) : (
                                  <>
                                    <Search className="w-4 h-4 mr-2" />
                                    Fetch Vehicle Details
                                  </>
                                )}
                              </Button>

                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setStep("details")}
                                className="h-12"
                              >
                                Enter manually
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* DETAILS STEP */}
          {step === "details" && (
            <div className="max-w-5xl mx-auto">
              <Card className={`rounded-2xl shadow-lg ${isDark ? 'bg-white/5 border-white/6' : 'bg-white'}`}>
                <CardHeader className="px-8 py-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className={`${isDark ? 'text-white' : 'text-gray-900'}`}>Vehicle & Seller Details</CardTitle>
                      <CardDescription>
                        {rtoData ? (
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              Auto-filled from RTO
                            </Badge>
                            <span className="text-sm text-muted-foreground">You can edit any field</span>
                          </div>
                        ) : (
                          "Provide the vehicle information to create your listing"
                        )}
                      </CardDescription>
                    </div>
                    <div className="hidden md:block">
                      {/* small quick preview */}
                      <div className="text-sm text-right">
                        <div className="font-medium">{rtoData?.brand ?? '-' } {rtoData?.model ?? ''}</div>
                        <div className="text-muted-foreground">{rtoData?.registrationNumber ?? ''}</div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="px-8 py-6">
                  <Form {...sellForm}>
                    <form onSubmit={sellForm.handleSubmit(handleSellSubmit)} className="space-y-6">

                      {/* Vehicle grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={sellForm.control} name="brand" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Brand</FormLabel>
                            <FormControl><Input {...field} placeholder="Maruti Suzuki" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />

                        <FormField control={sellForm.control} name="model" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Model</FormLabel>
                            <FormControl><Input {...field} placeholder="Swift VDi" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />

                        <FormField control={sellForm.control} name="year" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Year</FormLabel>
                            <FormControl><Input {...field} type="number" placeholder="2018" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />

                        <FormField control={sellForm.control} name="mileage" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mileage (km)</FormLabel>
                            <FormControl><Input {...field} type="number" placeholder="45000" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />

                        <FormField control={sellForm.control} name="fuelType" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fuel Type</FormLabel>
                            <FormControl><Input {...field} placeholder="Petrol" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />

                        <FormField control={sellForm.control} name="transmission" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Transmission</FormLabel>
                            <FormControl><Input {...field} placeholder="Manual" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={sellForm.control} name="city" render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl><Input {...field} placeholder="Hyderabad" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />

                        <FormField control={sellForm.control} name="owners" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Number of Owners</FormLabel>
                            <FormControl><Input {...field} type="number" min={1} max={10} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>

                      <FormField control={sellForm.control} name="price" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Asking Price (₹)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" placeholder="500000" className="text-2xl font-extrabold" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={sellForm.control} name="description" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (optional)</FormLabel>
                          <FormControl><Textarea {...field} placeholder="Describe your car (service history, mods, etc.)" rows={4} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      {/* Seller info */}
                      <div className="pt-4 border-t">
                        <h3 className="text-lg font-semibold mb-3">Your Contact Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField control={sellForm.control} name="sellerName" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl><Input {...field} placeholder="Your name" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />

                          <FormField control={sellForm.control} name="sellerPhone" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone</FormLabel>
                              <FormControl><Input {...field} placeholder="9876543210" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />

                          <FormField control={sellForm.control} name="sellerEmail" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email (optional)</FormLabel>
                              <FormControl><Input {...field} type="email" placeholder="you@example.com" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                      </div>

                      {/* Upload */}
                      <div className="pt-4 border-t">
                        <h3 className="text-lg font-semibold mb-3">Upload Photos</h3>
                        <div className={`rounded-xl border-2 border-dashed p-6 text-center ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                          <Upload className={`mx-auto mb-3 w-10 h-10 ${isDark ? 'text-gray-300' : 'text-gray-500'}`} />
                          <p className="mb-3 text-sm text-muted-foreground">Upload up to 12 photos (max 12MB each)</p>
                          <ObjectUploader
                            maxNumberOfFiles={12}
                            maxFileSize={12 * 1024 * 1024}
                            allowedFileTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp']}
                            onGetUploadParameters={handleGetUploadParameters}
                            onComplete={handleUploadComplete}
                            buttonClassName="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                            note="Original images are uploaded without watermarks"
                          >
                            <Upload className="w-4 h-4 mr-2 inline" />
                            Choose Images
                          </ObjectUploader>

                          {uploadedImageUrls.length > 0 && (
                            <div className="mt-4 text-sm text-green-700">
                              {uploadedImageUrls.length} image(s) uploaded
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 justify-between pt-4">
                        <Button variant="outline" onClick={() => setStep("rto")}>← Back</Button>
                        <div className="flex gap-3">
                          <Button variant="ghost" onClick={() => { setStep("preview"); }}>
                            Preview
                          </Button>
                          <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                            Submit Listing →
                          </Button>
                        </div>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* PREVIEW STEP */}
          {step === "preview" && (
            <div className="max-w-3xl mx-auto">
              <Card className={`rounded-2xl shadow-lg ${isDark ? 'bg-white/5' : 'bg-white'}`}>
                <CardHeader>
                  <CardTitle>Preview Listing</CardTitle>
                  <CardDescription>Review details before publishing</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="rounded-lg border p-4 bg-gray-50 dark:bg-white/3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-lg font-bold">{sellForm.getValues("brand")} {sellForm.getValues("model")}</div>
                          <div className="text-sm text-muted-foreground">{sellForm.getValues("registrationNumber")}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold">₹{sellForm.getValues("price")}</div>
                          <div className="text-sm text-muted-foreground">{sellForm.getValues("city")}</div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-2">
                        <PreviewRow label="Year" value={sellForm.getValues("year")} />
                        <PreviewRow label="Mileage (km)" value={sellForm.getValues("mileage")} />
                        <PreviewRow label="Fuel" value={sellForm.getValues("fuelType")} />
                        <PreviewRow label="Transmission" value={sellForm.getValues("transmission")} />
                        <PreviewRow label="Owners" value={sellForm.getValues("owners")} />
                        <PreviewRow label="Seller" value={sellForm.getValues("sellerName")} />
                        <PreviewRow label="Phone" value={sellForm.getValues("sellerPhone")} />
                        <PreviewRow label="Description" value={sellForm.getValues("description")} />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setStep("details")}>Edit</Button>
                      <Button onClick={() => { /* publish logic or API call here */ toast({ title: "Published!", description: "Your listing has been submitted." }); setStep("rto"); }} className="bg-blue-600 hover:bg-blue-700 text-white">
                        Publish Listing
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
