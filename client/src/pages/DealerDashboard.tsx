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
import { Car, Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download, BarChart3, TrendingUp, MapPin, Target } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function DealerDashboard() {
  const { toast } = useToast();
  const [selectedOem, setSelectedOem] = useState(localStorage.getItem("selectedOem") || "");
  const [selectedDealer, setSelectedDealer] = useState(localStorage.getItem("selectedDealer") || "");
  const [dealerId, setDealerId] = useState(localStorage.getItem("dealerId") || "");
  const [apiKey, setApiKey] = useState(""); // No longer needed for public dashboard
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
  const [bulkImages, setBulkImages] = useState<File[]>([]);
  const [bulkDocuments, setBulkDocuments] = useState<File[]>([]);
  const [validationResult, setValidationResult] = useState<any>(null);

  // Performance Analytics state
  const [selectedMonth, setSelectedMonth] = useState("October 2025");
  const [performanceOem, setPerformanceOem] = useState(() => {
    // Initialize based on stored OEM selection
    const storedOem = localStorage.getItem("selectedOem");
    return storedOem === "Others" ? "Others" : storedOem || "Hyundai";
  });

  // Fetch dealers grouped by OEM (public endpoint)
  const { data: dealersData } = useQuery({
    queryKey: ['/api/dealer/by-oem'],
    enabled: !isAuthenticated,
  });

  // Get dealers for selected OEM with hierarchical structure
  const dealersResponse = dealersData as any;
  const oemData = selectedOem && dealersResponse?.success && dealersResponse?.data?.[selectedOem] ? dealersResponse.data[selectedOem] : null;
  const dealerGroups = oemData?.groups || {};
  
  // Flatten dealers for selection while preserving group info
  const availableDealers = Object.entries(dealerGroups).flatMap(([group, dealers]: [string, any]) => 
    dealers.map((d: any) => ({ ...d, dealerGroup: group }))
  );

  // Fetch performance data (public endpoint)
  const { data: performanceData, isLoading: performanceLoading } = useQuery({
    queryKey: ['/api/dealer', dealerId, 'performance', selectedMonth, performanceOem],
    queryFn: async () => {
      const response = await fetch(`/api/dealer/${dealerId}/performance?month=${encodeURIComponent(selectedMonth)}&oem=${encodeURIComponent(performanceOem)}`);
      if (!response.ok) throw new Error('Failed to fetch performance data');
      return response.json();
    },
    enabled: isAuthenticated && !!dealerId
  });

  // Check if dealer is from "Others" category
  const isOthersDealer = selectedOem === "Others";

  // Login mutation - now uses OEM + Dealer selection
  const loginMutation = useMutation({
    mutationFn: async () => {
      // Find selected dealer info
      const dealer = availableDealers.find((d: any) => d.id === selectedDealer);
      if (!dealer) throw new Error("Please select a dealer");
      
      // Store selections
      localStorage.setItem("selectedOem", selectedOem);
      localStorage.setItem("selectedDealer", selectedDealer);
      localStorage.setItem("dealerId", selectedDealer);
      setDealerId(selectedDealer);
      // Set performanceOem based on dealer type
      if (selectedOem === "Others") {
        setPerformanceOem("Others"); // Use "Others" for non-OEM dealers
      } else {
        setPerformanceOem(selectedOem); // Use actual OEM for OEM dealers
      }
      return { success: true, dealer };
    },
    onSuccess: (data) => {
      setIsAuthenticated(true);
      toast({
        title: "Dashboard loaded",
        description: `Viewing ${data.dealer.dealerName} performance`,
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
      
      // Add all images
      bulkImages.forEach((img) => {
        formData.append("images", img);
      });
      
      // Add all documents (RC and Insurance PDFs)
      bulkDocuments.forEach((doc) => {
        formData.append("documents", doc);
      });

      const response = await fetch(`/api/dealer/${dealerId}/upload/bulk`, {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
        },
        body: formData,
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || "Validation failed");
      }

      return result;
    },
    onSuccess: (data) => {
      setValidationResult(data);
      if (data.success) {
        toast({
          title: "✅ Files Validated",
          description: data.message,
        });
        setCsvFile(null);
        setBulkImages([]);
        setBulkDocuments([]);
      } else {
        toast({
          title: "❌ Validation Errors",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
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

  // Login screen - Public OEM → Dealer selection
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Car className="h-6 w-6" />
              Telangana Dealer Performance Dashboard
            </CardTitle>
            <CardDescription>
              Select your OEM brand and dealership to view performance analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); loginMutation.mutate(); }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="oem">OEM Brand</Label>
                <Select value={selectedOem} onValueChange={(value) => { setSelectedOem(value); setSelectedDealer(""); }}>
                  <SelectTrigger data-testid="select-oem-login">
                    <SelectValue placeholder="Select OEM brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {dealersResponse?.oems?.map((oem: string) => (
                      <SelectItem key={oem} value={oem}>{oem}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedOem && (
                <div className="space-y-2">
                  <Label htmlFor="dealer">Dealership</Label>
                  <Select value={selectedDealer} onValueChange={setSelectedDealer}>
                    <SelectTrigger data-testid="select-dealer-login">
                      <SelectValue placeholder="Select your dealership" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(dealerGroups).map(([group, dealers]: [string, any]) => (
                        <div key={group}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                            {group}
                          </div>
                          {dealers.map((dealer: any) => (
                            <SelectItem key={dealer.id} value={dealer.id} className="pl-6">
                              {dealer.dealerName} - {dealer.city}
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <Button
                type="submit"
                data-testid="button-login"
                className="w-full"
                disabled={loginMutation.isPending || !selectedOem || !selectedDealer}
              >
                {loginMutation.isPending ? "Loading..." : "View Dashboard"}
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
              localStorage.removeItem("selectedOem");
              localStorage.removeItem("selectedDealer");
              setIsAuthenticated(false);
              setDealerId("");
              setSelectedOem("");
              setSelectedDealer("");
            }}
            data-testid="button-logout"
          >
            Change Dealer
          </Button>
        </div>

        <Tabs defaultValue="performance" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="performance" data-testid="tab-performance">
              <BarChart3 className="h-4 w-4 mr-2" />
              Performance Analytics
            </TabsTrigger>
            <TabsTrigger value="quick-add" data-testid="tab-quick-add">
              <Upload className="h-4 w-4 mr-2" />
              Quick Add
            </TabsTrigger>
            <TabsTrigger value="bulk-upload" data-testid="tab-bulk-upload">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Bulk Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="performance">
            <div className="space-y-6">
              {/* Filters */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Performance Filters
                  </CardTitle>
                  <CardDescription>
                    {isOthersDealer 
                      ? "Select month to view your performance metrics"
                      : "Select month and OEM to view performance metrics"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isOthersDealer ? (
                    // For "Others" dealers - only show month selector
                    <div className="space-y-2">
                      <Label>Month</Label>
                      <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger data-testid="select-month">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="May 2025">May 2025</SelectItem>
                          <SelectItem value="June 2025">June 2025</SelectItem>
                          <SelectItem value="July 2025">July 2025</SelectItem>
                          <SelectItem value="August 2025">August 2025</SelectItem>
                          <SelectItem value="September 2025">September 2025</SelectItem>
                          <SelectItem value="October 2025">October 2025</SelectItem>
                          <SelectItem value="November 2025">November 2025</SelectItem>
                          <SelectItem value="December 2025">December 2025</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    // For OEM dealers - show both month and OEM selectors
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Month</Label>
                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                          <SelectTrigger data-testid="select-month">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="May 2025">May 2025</SelectItem>
                            <SelectItem value="June 2025">June 2025</SelectItem>
                            <SelectItem value="July 2025">July 2025</SelectItem>
                            <SelectItem value="August 2025">August 2025</SelectItem>
                            <SelectItem value="September 2025">September 2025</SelectItem>
                            <SelectItem value="October 2025">October 2025</SelectItem>
                            <SelectItem value="November 2025">November 2025</SelectItem>
                            <SelectItem value="December 2025">December 2025</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>OEM</Label>
                        <Select value={performanceOem} onValueChange={setPerformanceOem}>
                          <SelectTrigger data-testid="select-oem">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Hyundai">Hyundai</SelectItem>
                            <SelectItem value="Maruti Suzuki">Maruti Suzuki</SelectItem>
                            <SelectItem value="Tata Motors">Tata Motors</SelectItem>
                            <SelectItem value="Mahindra">Mahindra</SelectItem>
                            <SelectItem value="Kia">Kia</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {performanceLoading ? (
                <div className="text-center py-8">Loading performance data...</div>
              ) : performanceData?.success ? (
                <>
                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>MTD Sales</CardDescription>
                        <CardTitle className="text-3xl" data-testid="kpi-mtd-sales">
                          {performanceData.data.kpiMetrics.mtdSales}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground">Units sold this month</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>Target Achievement</CardDescription>
                        <CardTitle className="text-3xl" data-testid="kpi-target">
                          {performanceData.data.kpiMetrics.targetAchievement}%
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground">Of monthly target</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>ROI vs National</CardDescription>
                        <CardTitle className="text-3xl" data-testid="kpi-roi">
                          +{performanceData.data.kpiMetrics.roiVsNational}%
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground">Above national average</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>Regional Rank</CardDescription>
                        <CardTitle className="text-3xl" data-testid="kpi-rank">
                          #{performanceData.data.kpiMetrics.regionalRank}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground">In Telangana</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Sales Trend Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Sales Trend & ML Forecast
                      </CardTitle>
                      <CardDescription>Historical sales and AI-powered forecasts</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={performanceData.data.timeSeriesData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="sales" stroke="#8884d8" strokeWidth={2} name="Actual Sales" />
                          <Line type="monotone" dataKey="forecast" stroke="#82ca9d" strokeWidth={2} strokeDasharray="5 5" name="Forecast" />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* VAHAN Comparison & Telangana Districts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* VAHAN Comparison */}
                    <Card>
                      <CardHeader>
                        <CardTitle>VAHAN ROI Benchmark</CardTitle>
                        <CardDescription>National & state performance comparison</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={[
                            { name: 'You', value: performanceData.data.benchmarkComparison.dealerSales },
                            { name: 'State Avg', value: performanceData.data.benchmarkComparison.stateAverage },
                            { name: 'National Avg', value: performanceData.data.benchmarkComparison.nationalAverage }
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#8884d8" />
                          </BarChart>
                        </ResponsiveContainer>
                        <div className="mt-4 text-sm">
                          <p className="font-medium">Percentile Rank: {performanceData.data.benchmarkComparison.percentileRank}th</p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Telangana Districts */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MapPin className="h-5 w-5" />
                          Telangana District Performance
                        </CardTitle>
                        <CardDescription>Regional sales distribution</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={performanceData.data.telanganaDistricts}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="registrations" fill="#82ca9d" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>

                  {/* ML Forecast Breakdown */}
                  <Card>
                    <CardHeader>
                      <CardTitle>ML Forecast Breakdown</CardTitle>
                      <CardDescription>AI-powered forecast components for {selectedMonth}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {performanceData.data.mlForecast.components.map((component: any, idx: number) => (
                          <div key={idx} className={`p-4 rounded-lg ${idx === 0 ? 'bg-blue-50 dark:bg-blue-900/20' : idx === 1 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-purple-50 dark:bg-purple-900/20'}`}>
                            <p className="text-sm text-muted-foreground">{component.name}</p>
                            <p className="text-2xl font-bold" data-testid={`forecast-component-${idx}`}>
                              {idx === 0 ? component.value : `+${component.value}`}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No performance data available
                </div>
              )}
            </div>
          </TabsContent>

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
                <CardTitle className="text-2xl">📦 Upload Multiple Cars at Once</CardTitle>
                <CardDescription className="text-base">
                  Save time by adding your entire inventory in one go - complete with photos and documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Step 1: Download Template */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-6 rounded-xl border-2 border-blue-200 dark:border-blue-800 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                        1
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                          <Download className="h-5 w-5" />
                          Download the Template File
                        </h3>
                        <p className="text-blue-800 dark:text-blue-200 mb-3">
                          This is a simple Excel-like file where you'll enter your car details
                        </p>
                        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg mb-3">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            What information you'll need to fill in:
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <div>• Chassis Number (VIN)</div>
                            <div>• Car Brand (e.g., Maruti, Hyundai)</div>
                            <div>• Model Name</div>
                            <div>• Year of Manufacture</div>
                            <div>• Selling Price</div>
                            <div>• Kilometers Driven</div>
                            <div>• Fuel Type (Petrol/Diesel)</div>
                            <div>• Gearbox Type (Manual/Automatic)</div>
                            <div>• Number of Previous Owners</div>
                            <div>• City Location</div>
                          </div>
                        </div>
                        <Button
                          variant="default"
                          size="lg"
                          data-testid="button-download-template"
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => {
                            const link = document.createElement("a");
                            link.href = "/bulk-upload-template.csv";
                            link.download = "cararth_bulk_upload.csv";
                            link.click();
                          }}
                        >
                          <Download className="mr-2 h-5 w-5" />
                          Download Template
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Photo Naming Guide */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 p-6 rounded-xl border-2 border-green-200 dark:border-green-800 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                        2
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-green-900 dark:text-green-100 mb-2">
                          📸 How to Name Your Photos & Documents
                        </h3>
                        <p className="text-green-800 dark:text-green-200 mb-4">
                          Name each file using the car's chassis number (VIN) so we know which photos belong to which car
                        </p>
                        
                        <div className="space-y-4">
                          {/* Photos Example */}
                          <div className="bg-white dark:bg-gray-900 p-4 rounded-lg">
                            <p className="font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                              <span className="text-lg">📷</span>
                              Car Photos (minimum 3 required)
                            </p>
                            <div className="bg-green-50 dark:bg-green-950/50 p-3 rounded border border-green-200 dark:border-green-800">
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                <strong>Example:</strong> If your car's VIN is "MA3ERLF1S00A12345", name photos as:
                              </p>
                              <div className="space-y-1 text-sm font-mono bg-white dark:bg-gray-900 p-2 rounded">
                                <div className="text-green-700 dark:text-green-400">✓ MA3ERLF1S00A12345_1.jpg</div>
                                <div className="text-green-700 dark:text-green-400">✓ MA3ERLF1S00A12345_2.jpg</div>
                                <div className="text-green-700 dark:text-green-400">✓ MA3ERLF1S00A12345_3.jpg</div>
                              </div>
                            </div>
                          </div>

                          {/* RC Example */}
                          <div className="bg-white dark:bg-gray-900 p-4 rounded-lg">
                            <p className="font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                              <span className="text-lg">📄</span>
                              Registration Certificate (RC)
                            </p>
                            <div className="bg-green-50 dark:bg-green-950/50 p-3 rounded border border-green-200 dark:border-green-800">
                              <p className="text-sm font-mono bg-white dark:bg-gray-900 p-2 rounded text-green-700 dark:text-green-400">
                                MA3ERLF1S00A12345_RC.pdf
                              </p>
                              <p className="text-xs text-gray-500 mt-2">
                                (or _registration.pdf also works)
                              </p>
                            </div>
                          </div>

                          {/* Insurance Example */}
                          <div className="bg-white dark:bg-gray-900 p-4 rounded-lg">
                            <p className="font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                              <span className="text-lg">🛡️</span>
                              Insurance Policy
                            </p>
                            <div className="bg-green-50 dark:bg-green-950/50 p-3 rounded border border-green-200 dark:border-green-800">
                              <p className="text-sm font-mono bg-white dark:bg-gray-900 p-2 rounded text-green-700 dark:text-green-400">
                                MA3ERLF1S00A12345_insurance.pdf
                              </p>
                              <p className="text-xs text-gray-500 mt-2">
                                (or _policy.pdf also works)
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                          <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            <strong>💡 Pro Tip:</strong> Keep all files in one folder on your computer before uploading - makes it easier to select them all at once!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Upload Files */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 p-6 rounded-xl border-2 border-purple-200 dark:border-purple-800 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                        3
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100 mb-2">
                          ⬆️ Upload Your Files
                        </h3>
                        <p className="text-purple-800 dark:text-purple-200 mb-4">
                          Now select all the files you've prepared and upload them together
                        </p>

                        <form onSubmit={handleBulkUpload} className="space-y-5">
                          {/* CSV Upload */}
                          <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-600 transition-colors">
                            <Label htmlFor="csvFile" className="text-base font-semibold flex items-center gap-2 mb-2">
                              <span className="text-2xl">📊</span>
                              Your Completed Template File
                            </Label>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                              Upload the CSV file you filled with your car details
                            </p>
                            <Input
                              id="csvFile"
                              data-testid="input-csv-file"
                              type="file"
                              accept=".csv"
                              className="cursor-pointer"
                              onChange={(e) => {
                                setCsvFile(e.target.files?.[0] || null);
                                setValidationResult(null);
                              }}
                              required
                            />
                            {csvFile && (
                              <div className="mt-3 p-2 bg-green-50 dark:bg-green-950/30 rounded flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                <span className="text-sm text-green-700 dark:text-green-300 font-medium">
                                  {csvFile.name}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Images Upload */}
                          <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-600 transition-colors">
                            <Label htmlFor="bulkImages" className="text-base font-semibold flex items-center gap-2 mb-2">
                              <span className="text-2xl">📷</span>
                              Car Photos
                            </Label>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                              Select all your car images at once (they should be named as shown above)
                            </p>
                            <Input
                              id="bulkImages"
                              data-testid="input-bulk-images"
                              type="file"
                              accept="image/*"
                              multiple
                              className="cursor-pointer"
                              onChange={(e) => setBulkImages(Array.from(e.target.files || []))}
                            />
                            {bulkImages.length > 0 && (
                              <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950/30 rounded">
                                <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                                  📸 {bulkImages.length} photo{bulkImages.length !== 1 ? 's' : ''} selected
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Documents Upload */}
                          <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-600 transition-colors">
                            <Label htmlFor="bulkDocuments" className="text-base font-semibold flex items-center gap-2 mb-2">
                              <span className="text-2xl">📄</span>
                              Registration & Insurance Papers
                            </Label>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                              Upload all RC and insurance documents (PDF format)
                            </p>
                            <Input
                              id="bulkDocuments"
                              data-testid="input-bulk-documents"
                              type="file"
                              accept=".pdf"
                              multiple
                              className="cursor-pointer"
                              onChange={(e) => setBulkDocuments(Array.from(e.target.files || []))}
                            />
                            {bulkDocuments.length > 0 && (
                              <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-950/30 rounded">
                                <span className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                                  📎 {bulkDocuments.length} document{bulkDocuments.length !== 1 ? 's' : ''} selected
                                </span>
                              </div>
                            )}
                          </div>

                          <Button
                            type="submit"
                            data-testid="button-bulk-upload-submit"
                            size="lg"
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-6 text-lg"
                            disabled={bulkUploadMutation.isPending}
                          >
                            {bulkUploadMutation.isPending ? (
                              <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                Checking your files...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="mr-2 h-6 w-6" />
                                Check & Upload All Cars
                              </>
                            )}
                          </Button>
                        </form>
                      </div>
                    </div>
                  </div>

                  {validationResult && (
                    <div className="space-y-3">
                      <div className={`p-4 rounded-lg ${validationResult.success ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                        <div className="flex items-start gap-2">
                          {validationResult.success ? (
                            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className={`font-medium ${validationResult.success ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'}`}>
                              {validationResult.message}
                            </p>
                            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                              <div className={validationResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                                <p>Total: {validationResult.summary.total} vehicles</p>
                                <p>Validated: {validationResult.summary.validated}</p>
                                <p>Errors: {validationResult.summary.errors}</p>
                                <p>Warnings: {validationResult.summary.warnings || 0}</p>
                              </div>
                              {validationResult.summary.filesUploaded && (
                                <div className={validationResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                                  <p>Images: {validationResult.summary.filesUploaded.images}</p>
                                  <p>RC Docs: {validationResult.summary.filesUploaded.rc}</p>
                                  <p>Insurance: {validationResult.summary.filesUploaded.insurance}</p>
                                </div>
                              )}
                            </div>
                            {validationResult.errors && validationResult.errors.length > 0 && (
                              <div className="mt-3 space-y-1">
                                <p className="text-sm font-medium text-red-800 dark:text-red-200">❌ Errors:</p>
                                {validationResult.errors.map((err: any, idx: number) => (
                                  <p key={idx} className="text-sm text-red-700 dark:text-red-300">
                                    Row {err.row} {err.vin && `(${err.vin})`}: {err.error}
                                  </p>
                                ))}
                              </div>
                            )}
                            {validationResult.warnings && validationResult.warnings.length > 0 && (
                              <div className="mt-3 space-y-1">
                                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">⚠️ Warnings:</p>
                                {validationResult.warnings.map((warn: any, idx: number) => (
                                  <p key={idx} className="text-sm text-amber-700 dark:text-amber-300">
                                    Row {warn.row} ({warn.vin}): {warn.warning}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
