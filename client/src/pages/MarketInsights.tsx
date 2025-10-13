import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, TrendingUp, TrendingDown, Sparkles, ExternalLink, BarChart3, Info } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MarketInsightResponse {
  success: boolean;
  insight: {
    insight: string;
    granularBreakdown: {
      modelTrend: string;
      variantAnalysis: string;
      colorPreference: string;
      transmissionTrend: string;
      fuelTypeTrend: string;
      locationInsight: string;
    };
    dealQuality: {
      score: number;
      badge: string;
      reason: string;
    };
    marketTrends: string[];
    priceComparison: {
      marketAverage: string;
      yourPrice: string;
      difference: string;
      percentageDiff: string;
    } | null;
    sources: Array<{
      name: string;
      url: string;
      credibility: string;
    }>;
    timestamp: string;
    powered_by: string;
  };
}

export default function MarketInsights() {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [carDetails, setCarDetails] = useState({
    model: "",
    variant: "",
    year: undefined as number | undefined,
    color: "",
    transmission: "",
    fuel: "",
    mileage: undefined as number | undefined,
    price: undefined as number | undefined,
    location: "Hyderabad"
  });

  const insightMutation = useMutation<MarketInsightResponse, Error, any>({
    mutationFn: async (data) => {
      const response = await fetch('/api/market-insights/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to generate insights' }));
        throw new Error(error.error || 'Failed to generate insights');
      }
      
      return await response.json();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate insights",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      toast({
        title: "Query Required",
        description: "Please enter a search query",
        variant: "destructive"
      });
      return;
    }

    const cleanedDetails = Object.fromEntries(
      Object.entries(carDetails).filter(([_, v]) => v !== "" && v !== undefined)
    );

    insightMutation.mutate({
      query: query.trim(),
      carDetails: Object.keys(cleanedDetails).length > 0 ? cleanedDetails : undefined
    });
  };

  const handleSample = () => {
    setQuery("Hyundai Verna 2020 under 5 lakhs in Hyderabad");
    setCarDetails({
      model: "Hyundai Verna",
      variant: "Fluidic",
      year: 2020,
      color: "White",
      transmission: "Manual",
      fuel: "Petrol",
      mileage: 40000,
      price: 480000,
      location: "Hyderabad"
    });
  };

  const getDealBadgeColor = (badge: string) => {
    switch (badge) {
      case 'Excellent Deal':
        return 'bg-green-500 hover:bg-green-600';
      case 'Good Deal':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'Fair Price':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'Above Market':
        return 'bg-orange-500 hover:bg-orange-600';
      case 'Premium':
        return 'bg-red-500 hover:bg-red-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-2">
            <BarChart3 className="h-10 w-10 text-primary" />
            Market Insights
          </h1>
          <p className="text-muted-foreground">
            AI-powered granular analysis for Hyderabad used car market
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Search Market Intelligence</CardTitle>
            <CardDescription>
              Get detailed insights by model, variant, color, transmission, fuel type, and location
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="query">Search Query</Label>
                <Input
                  id="query"
                  data-testid="input-query"
                  placeholder="E.g., Hyundai Verna 2020 under 5 lakhs in Hyderabad"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    data-testid="input-model"
                    placeholder="E.g., Hyundai Verna"
                    value={carDetails.model}
                    onChange={(e) => setCarDetails({ ...carDetails, model: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="variant">Variant</Label>
                  <Input
                    id="variant"
                    data-testid="input-variant"
                    placeholder="E.g., Fluidic, ZXI"
                    value={carDetails.variant}
                    onChange={(e) => setCarDetails({ ...carDetails, variant: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    data-testid="input-year"
                    type="number"
                    placeholder="E.g., 2020"
                    value={carDetails.year || ""}
                    onChange={(e) => setCarDetails({ ...carDetails, year: e.target.value ? parseInt(e.target.value) : undefined })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Select 
                    value={carDetails.color} 
                    onValueChange={(value) => setCarDetails({ ...carDetails, color: value })}
                  >
                    <SelectTrigger data-testid="select-color">
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="White">White</SelectItem>
                      <SelectItem value="Silver">Silver</SelectItem>
                      <SelectItem value="Black">Black</SelectItem>
                      <SelectItem value="Red">Red</SelectItem>
                      <SelectItem value="Blue">Blue</SelectItem>
                      <SelectItem value="Grey">Grey</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transmission">Transmission</Label>
                  <Select 
                    value={carDetails.transmission} 
                    onValueChange={(value) => setCarDetails({ ...carDetails, transmission: value })}
                  >
                    <SelectTrigger data-testid="select-transmission">
                      <SelectValue placeholder="Select transmission" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Manual">Manual</SelectItem>
                      <SelectItem value="Automatic">Automatic</SelectItem>
                      <SelectItem value="AMT">AMT</SelectItem>
                      <SelectItem value="DCT">DCT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fuel">Fuel Type</Label>
                  <Select 
                    value={carDetails.fuel} 
                    onValueChange={(value) => setCarDetails({ ...carDetails, fuel: value })}
                  >
                    <SelectTrigger data-testid="select-fuel">
                      <SelectValue placeholder="Select fuel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Petrol">Petrol</SelectItem>
                      <SelectItem value="Diesel">Diesel</SelectItem>
                      <SelectItem value="CNG">CNG</SelectItem>
                      <SelectItem value="Electric">Electric</SelectItem>
                      <SelectItem value="Hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mileage">Mileage (km)</Label>
                  <Input
                    id="mileage"
                    data-testid="input-mileage"
                    type="number"
                    placeholder="E.g., 40000"
                    value={carDetails.mileage || ""}
                    onChange={(e) => setCarDetails({ ...carDetails, mileage: e.target.value ? parseInt(e.target.value) : undefined })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹)</Label>
                  <Input
                    id="price"
                    data-testid="input-price"
                    type="number"
                    placeholder="E.g., 480000"
                    value={carDetails.price || ""}
                    onChange={(e) => setCarDetails({ ...carDetails, price: e.target.value ? parseInt(e.target.value) : undefined })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    data-testid="input-location"
                    placeholder="Hyderabad"
                    value={carDetails.location}
                    onChange={(e) => setCarDetails({ ...carDetails, location: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  type="submit" 
                  data-testid="button-generate" 
                  disabled={insightMutation.isPending}
                  className="flex-1"
                >
                  {insightMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing Market...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Insights
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleSample}
                  data-testid="button-sample"
                >
                  Try Sample
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {insightMutation.data?.insight && (
          <Card className="animate-in fade-in-50 slide-in-from-bottom-5">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl mb-2">AI Market Analysis</CardTitle>
                  <CardDescription>
                    Powered by {insightMutation.data.insight.powered_by}
                  </CardDescription>
                </div>
                <Badge 
                  className={`${getDealBadgeColor(insightMutation.data.insight.dealQuality.badge)} text-white text-sm px-3 py-1`}
                  data-testid="badge-deal"
                >
                  {insightMutation.data.insight.dealQuality.badge}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  Key Insight
                </h3>
                <p className="text-muted-foreground" data-testid="text-insight">
                  {insightMutation.data.insight.insight}
                </p>
              </div>

              {insightMutation.data.insight.priceComparison && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3">Price Comparison</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Your Price</p>
                      <p className="text-lg font-semibold" data-testid="text-your-price">
                        {insightMutation.data.insight.priceComparison.yourPrice}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Market Average</p>
                      <p className="text-lg font-semibold" data-testid="text-market-avg">
                        {insightMutation.data.insight.priceComparison.marketAverage}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Difference</p>
                      <p className="text-lg font-semibold flex items-center gap-1" data-testid="text-diff">
                        {insightMutation.data.insight.priceComparison.percentageDiff.startsWith('+') ? (
                          <TrendingUp className="h-4 w-4 text-red-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-green-500" />
                        )}
                        {insightMutation.data.insight.priceComparison.percentageDiff}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Deal Score</p>
                      <p className="text-lg font-semibold" data-testid="text-score">
                        {insightMutation.data.insight.dealQuality.score}/100
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3">
                    {insightMutation.data.insight.dealQuality.reason}
                  </p>
                </div>
              )}

              <div>
                <h3 className="font-semibold text-lg mb-3">Granular Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Model Trend</p>
                      <p className="text-sm" data-testid="text-model-trend">
                        {insightMutation.data.insight.granularBreakdown.modelTrend}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Variant Analysis</p>
                      <p className="text-sm" data-testid="text-variant">
                        {insightMutation.data.insight.granularBreakdown.variantAnalysis}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Color Preference</p>
                      <p className="text-sm" data-testid="text-color">
                        {insightMutation.data.insight.granularBreakdown.colorPreference}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Transmission Trend</p>
                      <p className="text-sm" data-testid="text-transmission">
                        {insightMutation.data.insight.granularBreakdown.transmissionTrend}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Fuel Type Trend</p>
                      <p className="text-sm" data-testid="text-fuel">
                        {insightMutation.data.insight.granularBreakdown.fuelTypeTrend}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Location Insight</p>
                      <p className="text-sm" data-testid="text-location">
                        {insightMutation.data.insight.granularBreakdown.locationInsight}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">Market Trends</h3>
                <ul className="space-y-2">
                  {insightMutation.data.insight.marketTrends.map((trend, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <TrendingUp className="h-4 w-4 text-primary mt-0.5" />
                      <span className="text-sm" data-testid={`text-trend-${index}`}>{trend}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold text-lg mb-3">Data Sources</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {insightMutation.data.insight.sources.map((source, index) => (
                    <a
                      key={index}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      data-testid={`link-source-${index}`}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{source.name}</p>
                        <p className="text-xs text-muted-foreground">{source.credibility}</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Analysis generated at {new Date(insightMutation.data.insight.timestamp).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
