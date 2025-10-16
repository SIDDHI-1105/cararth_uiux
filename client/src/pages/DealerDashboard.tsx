import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Car, Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function DealerDashboard() {
  const { toast } = useToast();
  const [dealerId, setDealerId] = useState(localStorage.getItem("dealerId") || "");
  const [apiKey, setApiKey] = useState(localStorage.getItem("dealerApiKey") || "");
  const [isAuthenticated, setIsAuthenticated] = useState(!!dealerId && !!apiKey);

  // Quick Add form state
  const [quickAddData, setQuickAddData] = useState({
    vin: "",
    make: "",
    model: "",
    year: "",
    mileage: "",
    price: "",
    fuelType: "Petrol",
    transmission: "Manual",
    color: "",
    city: "",
    state: "",
    description: "",
  });

  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [imageZip, setImageZip] = useState<File | null>(null);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async () => {
      // Store credentials
      localStorage.setItem("dealerId", dealerId);
      localStorage.setItem("dealerApiKey", apiKey);
      return { success: true };
    },
    onSuccess: () => {
      setIsAuthenticated(true);
      toast({
        title: "Logged in successfully",
        description: "Welcome to your dealer dashboard",
      });
    },
  });

  // Quick Add mutation
  const quickAddMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch(`/api/dealer/${dealerId}/upload`, {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
        },
        body: data,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Vehicle uploaded successfully",
        description: `Upload ID: ${data.uploadId}`,
      });
      // Reset form
      setQuickAddData({
        vin: "",
        make: "",
        model: "",
        year: "",
        mileage: "",
        price: "",
        fuelType: "Petrol",
        transmission: "Manual",
        color: "",
        city: "",
        state: "",
        description: "",
      });
      setSelectedImages([]);
      queryClient.invalidateQueries({ queryKey: ["/api/dealer", dealerId, "vehicles"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Bulk upload mutation
  const bulkUploadMutation = useMutation({
    mutationFn: async () => {
      if (!csvFile) throw new Error("CSV file required");

      const formData = new FormData();
      formData.append("csvFile", csvFile);
      if (imageZip) {
        formData.append("imageZip", imageZip);
      }

      const response = await fetch(`/api/dealer/${dealerId}/upload/bulk`, {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Bulk upload failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Bulk upload successful",
        description: `Batch ID: ${data.batchId}. ${data.summary.successCount} vehicles uploaded.`,
      });
      setCsvFile(null);
      setImageZip(null);
      queryClient.invalidateQueries({ queryKey: ["/api/dealer", dealerId, "vehicles"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Bulk upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    Object.entries(quickAddData).forEach(([key, value]) => {
      formData.append(key, value);
    });

    selectedImages.forEach((image) => {
      formData.append("images", image);
    });

    quickAddMutation.mutate(formData);
  };

  const handleBulkUpload = (e: React.FormEvent) => {
    e.preventDefault();
    bulkUploadMutation.mutate();
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Car className="h-6 w-6" />
              Cararth Dealer Portal
            </CardTitle>
            <CardDescription>
              Login with your dealer credentials to manage inventory
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); loginMutation.mutate(); }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dealerId">Dealer ID</Label>
                <Input
                  id="dealerId"
                  data-testid="input-dealer-id"
                  placeholder="dealer-123"
                  value={dealerId}
                  onChange={(e) => setDealerId(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  data-testid="input-api-key"
                  type="password"
                  placeholder="Enter your API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                data-testid="button-login"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Logging in..." : "Login"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dealer Dashboard</h1>
          <Button
            variant="outline"
            onClick={() => {
              localStorage.removeItem("dealerId");
              localStorage.removeItem("dealerApiKey");
              setIsAuthenticated(false);
            }}
            data-testid="button-logout"
          >
            Logout
          </Button>
        </div>

        <Tabs defaultValue="quick-add" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="quick-add" data-testid="tab-quick-add">
              <Upload className="h-4 w-4 mr-2" />
              Quick Add
            </TabsTrigger>
            <TabsTrigger value="bulk-upload" data-testid="tab-bulk-upload">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Bulk Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quick-add">
            <Card>
              <CardHeader>
                <CardTitle>Quick Add Vehicle</CardTitle>
                <CardDescription>
                  Add a single vehicle with images. All fields are required.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleQuickAddSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vin">VIN (17 characters)</Label>
                      <Input
                        id="vin"
                        data-testid="input-vin"
                        value={quickAddData.vin}
                        onChange={(e) => setQuickAddData({ ...quickAddData, vin: e.target.value })}
                        placeholder="1HGBH41JXMN109186"
                        required
                        maxLength={17}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="make">Make</Label>
                      <Input
                        id="make"
                        data-testid="input-make"
                        value={quickAddData.make}
                        onChange={(e) => setQuickAddData({ ...quickAddData, make: e.target.value })}
                        placeholder="Honda"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="model">Model</Label>
                      <Input
                        id="model"
                        data-testid="input-model"
                        value={quickAddData.model}
                        onChange={(e) => setQuickAddData({ ...quickAddData, model: e.target.value })}
                        placeholder="Accord"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="year">Year</Label>
                      <Input
                        id="year"
                        data-testid="input-year"
                        type="number"
                        value={quickAddData.year}
                        onChange={(e) => setQuickAddData({ ...quickAddData, year: e.target.value })}
                        placeholder="2021"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mileage">Mileage (km)</Label>
                      <Input
                        id="mileage"
                        data-testid="input-mileage"
                        type="number"
                        value={quickAddData.mileage}
                        onChange={(e) => setQuickAddData({ ...quickAddData, mileage: e.target.value })}
                        placeholder="25000"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Price (₹)</Label>
                      <Input
                        id="price"
                        data-testid="input-price"
                        type="number"
                        value={quickAddData.price}
                        onChange={(e) => setQuickAddData({ ...quickAddData, price: e.target.value })}
                        placeholder="1500000"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fuelType">Fuel Type</Label>
                      <Select
                        value={quickAddData.fuelType}
                        onValueChange={(value) => setQuickAddData({ ...quickAddData, fuelType: value })}
                      >
                        <SelectTrigger data-testid="select-fuel-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Petrol">Petrol</SelectItem>
                          <SelectItem value="Diesel">Diesel</SelectItem>
                          <SelectItem value="Electric">Electric</SelectItem>
                          <SelectItem value="CNG">CNG</SelectItem>
                          <SelectItem value="Hybrid">Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="transmission">Transmission</Label>
                      <Select
                        value={quickAddData.transmission}
                        onValueChange={(value) => setQuickAddData({ ...quickAddData, transmission: value })}
                      >
                        <SelectTrigger data-testid="select-transmission">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Manual">Manual</SelectItem>
                          <SelectItem value="Automatic">Automatic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="color">Color</Label>
                      <Input
                        id="color"
                        data-testid="input-color"
                        value={quickAddData.color}
                        onChange={(e) => setQuickAddData({ ...quickAddData, color: e.target.value })}
                        placeholder="Silver"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        data-testid="input-city"
                        value={quickAddData.city}
                        onChange={(e) => setQuickAddData({ ...quickAddData, city: e.target.value })}
                        placeholder="Hyderabad"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        data-testid="input-state"
                        value={quickAddData.state}
                        onChange={(e) => setQuickAddData({ ...quickAddData, state: e.target.value })}
                        placeholder="Telangana"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      data-testid="input-description"
                      value={quickAddData.description}
                      onChange={(e) => setQuickAddData({ ...quickAddData, description: e.target.value })}
                      placeholder="Well-maintained vehicle with full service history..."
                      rows={3}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="images">Vehicle Images (Min 3 required)</Label>
                    <Input
                      id="images"
                      data-testid="input-images"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => setSelectedImages(Array.from(e.target.files || []))}
                      required
                    />
                    {selectedImages.length > 0 && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedImages.length} image(s) selected
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    data-testid="button-quick-add-submit"
                    className="w-full"
                    disabled={quickAddMutation.isPending}
                  >
                    {quickAddMutation.isPending ? "Uploading..." : "Upload Vehicle"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bulk-upload">
            <Card>
              <CardHeader>
                <CardTitle>Bulk CSV Upload</CardTitle>
                <CardDescription>
                  Upload multiple vehicles at once using our CSV template
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Download className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <div className="flex-1">
                      <p className="font-medium text-blue-900 dark:text-blue-100">
                        Download CSV Template
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Use this template to format your vehicle data
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      data-testid="button-download-template"
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href = "/dealer_upload_template.csv";
                        link.download = "cararth_dealer_template.csv";
                        link.click();
                      }}
                    >
                      Download
                    </Button>
                  </div>

                  <form onSubmit={handleBulkUpload} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="csvFile">CSV File</Label>
                      <Input
                        id="csvFile"
                        data-testid="input-csv-file"
                        type="file"
                        accept=".csv"
                        onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="imageZip">Images ZIP (Optional)</Label>
                      <Input
                        id="imageZip"
                        data-testid="input-image-zip"
                        type="file"
                        accept=".zip"
                        onChange={(e) => setImageZip(e.target.files?.[0] || null)}
                      />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Upload a ZIP file containing vehicle images. Name images to match VIN.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      data-testid="button-bulk-upload-submit"
                      className="w-full"
                      disabled={bulkUploadMutation.isPending}
                    >
                      {bulkUploadMutation.isPending ? "Uploading..." : "Upload CSV"}
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
