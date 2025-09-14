import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, TrendingUp, TrendingDown, Minus, Car, MapPin, Fuel, Settings } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface PriceSimulationResult {
  estimatedPrice: number;
  priceRange: { min: number; max: number };
  confidence: number;
  aiInsights: string[];
  marketAnalysis: {
    trend: 'rising' | 'falling' | 'stable';
    recommendation: string;
  };
  sources: string[];
  timestamp: string;
}

export default function PriceSimulator() {
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: '',
    city: '',
    mileage: '',
    fuelType: '',
    transmission: '',
    condition: ''
  });

  const simulatePriceMutation = useMutation({
    mutationFn: async (data: typeof formData): Promise<PriceSimulationResult> => {
      const response = await apiRequest('POST', '/api/price-simulator', data);
      return await response.json();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.brand || !formData.model || !formData.year || !formData.city) {
      alert('Please fill in all required fields (Brand, Model, Year, City)');
      return;
    }
    simulatePriceMutation.mutate(formData);
  };

  const formatPrice = (price: number) => {
    if (price >= 100000) {
      return `₹${(price / 100000).toFixed(1)} Lakh`;
    }
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const getTrendIcon = (trend: 'rising' | 'falling' | 'stable') => {
    switch (trend) {
      case 'rising': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'falling': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Calculator className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">AI Price Simulator</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Get intelligent price predictions powered by Perplexity + Gemini AI
        </p>
        <div className="flex items-center justify-center gap-4 text-sm">
          <Badge variant="outline">📸 CarArth x Claude AI</Badge>
          <Badge variant="outline">🧠 CarArth x GPT-5</Badge>
        </div>
      </div>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Car Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Brand *</label>
                <Select value={formData.brand} onValueChange={(value) => setFormData({...formData, brand: value})}>
                  <SelectTrigger data-testid="simulator-brand">
                    <SelectValue placeholder="Select Brand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Maruti Suzuki">Maruti Suzuki</SelectItem>
                    <SelectItem value="Hyundai">Hyundai</SelectItem>
                    <SelectItem value="Tata">Tata</SelectItem>
                    <SelectItem value="Mahindra">Mahindra</SelectItem>
                    <SelectItem value="Honda">Honda</SelectItem>
                    <SelectItem value="Toyota">Toyota</SelectItem>
                    <SelectItem value="Ford">Ford</SelectItem>
                    <SelectItem value="Renault">Renault</SelectItem>
                    <SelectItem value="Nissan">Nissan</SelectItem>
                    <SelectItem value="Volkswagen">Volkswagen</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Model *</label>
                <Input
                  placeholder="e.g., Swift, i20, Nexon"
                  value={formData.model}
                  onChange={(e) => setFormData({...formData, model: e.target.value})}
                  data-testid="simulator-model"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Year *</label>
                <Select value={formData.year} onValueChange={(value) => setFormData({...formData, year: value})}>
                  <SelectTrigger data-testid="simulator-year">
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - i).map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  City *
                </label>
                <Select value={formData.city} onValueChange={(value) => setFormData({...formData, city: value})}>
                  <SelectTrigger data-testid="simulator-city">
                    <SelectValue placeholder="Select City" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hyderabad">Hyderabad</SelectItem>
                    <SelectItem value="Delhi">Delhi</SelectItem>
                    <SelectItem value="Mumbai">Mumbai</SelectItem>
                    <SelectItem value="Bangalore">Bangalore</SelectItem>
                    <SelectItem value="Chennai">Chennai</SelectItem>
                    <SelectItem value="Pune">Pune</SelectItem>
                    <SelectItem value="Kolkata">Kolkata</SelectItem>
                    <SelectItem value="Ahmedabad">Ahmedabad</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Mileage (km)</label>
                <Input
                  placeholder="e.g., 45000"
                  type="number"
                  value={formData.mileage}
                  onChange={(e) => setFormData({...formData, mileage: e.target.value})}
                  data-testid="simulator-mileage"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-1">
                  <Fuel className="h-4 w-4" />
                  Fuel Type
                </label>
                <Select value={formData.fuelType} onValueChange={(value) => setFormData({...formData, fuelType: value})}>
                  <SelectTrigger data-testid="simulator-fuel-type">
                    <SelectValue placeholder="Select Fuel" />
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

              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-1">
                  <Settings className="h-4 w-4" />
                  Transmission
                </label>
                <Select value={formData.transmission} onValueChange={(value) => setFormData({...formData, transmission: value})}>
                  <SelectTrigger data-testid="simulator-transmission">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Manual">Manual</SelectItem>
                    <SelectItem value="Automatic">Automatic</SelectItem>
                    <SelectItem value="AMT">AMT</SelectItem>
                    <SelectItem value="CVT">CVT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={simulatePriceMutation.isPending}
              data-testid="simulate-price-button"
            >
              {simulatePriceMutation.isPending ? 'Calculating Price...' : 'Simulate Price'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {simulatePriceMutation.data && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>AI Price Prediction</span>
              <div className="flex items-center gap-2">
                {getTrendIcon(simulatePriceMutation.data.marketAnalysis.trend)}
                <span className="text-sm text-muted-foreground capitalize">
                  {simulatePriceMutation.data.marketAnalysis.trend}
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Price Display */}
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold text-primary" data-testid="predicted-price">
                {formatPrice(simulatePriceMutation.data.estimatedPrice)}
              </div>
              <div className="text-muted-foreground">
                Range: {formatPrice(simulatePriceMutation.data.priceRange.min)} - {formatPrice(simulatePriceMutation.data.priceRange.max)}
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className={`h-2 w-20 rounded-full ${getConfidenceColor(simulatePriceMutation.data.confidence)}`} />
                <span className="text-sm text-muted-foreground">
                  {(simulatePriceMutation.data.confidence * 100).toFixed(0)}% Confidence
                </span>
              </div>
            </div>

            {/* AI Insights */}
            {simulatePriceMutation.data.aiInsights.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  AI Insights
                  <div className="flex gap-1">
                    {simulatePriceMutation.data.sources.map((source, idx) => (
                      <span key={idx} className="text-xs">{source}</span>
                    ))}
                  </div>
                </h3>
                <div className="space-y-2">
                  {simulatePriceMutation.data.aiInsights.map((insight, idx) => (
                    <div key={idx} className="text-sm bg-muted/50 p-3 rounded-md">
                      {insight}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Market Recommendation */}
            <div className="bg-primary/5 p-4 rounded-md">
              <h3 className="font-semibold mb-2 text-primary">Market Recommendation</h3>
              <p className="text-sm text-muted-foreground">
                {simulatePriceMutation.data.marketAnalysis.recommendation}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {simulatePriceMutation.error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
          <CardContent className="pt-6">
            <p className="text-red-700 dark:text-red-400">
              Failed to simulate price. Please try again or check your input data.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}