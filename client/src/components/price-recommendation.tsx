import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingUp, TrendingDown, Minus, Target } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface PriceRecommendationProps {
  carData: {
    brand: string;
    model: string;
    year: number;
    city: string;
    mileage: number;
    fuelType: string;
    transmission: string;
  };
  onPriceRecommend: (price: number) => void;
}

interface ComparisonResult {
  insights: {
    averagePrice: number;
    priceRange: { min: number; max: number };
    marketTrend: 'rising' | 'falling' | 'stable';
    recommendation: string;
  };
  comparison: 'below' | 'fair' | 'above';
  suggestion: string;
}

export default function PriceRecommendation({ carData, onPriceRecommend }: PriceRecommendationProps) {
  const [testPrice, setTestPrice] = useState("");
  const [showRecommendation, setShowRecommendation] = useState(false);

  const priceComparison = useMutation({
    mutationFn: async (price: number) => {
      const response = await apiRequest("POST", "/api/cars/compare-price", {
        ...carData,
        userPrice: price * 100000 // Convert lakhs to rupees
      });
      return response as ComparisonResult;
    },
    onSuccess: (data) => {
      setShowRecommendation(true);
    },
  });

  const formatPrice = (price: number) => {
    const lakhs = price / 100000;
    return `₹${lakhs.toFixed(2)} Lakh`;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'falling':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getComparisonColor = (comparison: string) => {
    switch (comparison) {
      case 'below':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'above':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const handleGetRecommendation = () => {
    const price = parseFloat(testPrice);
    if (price > 0) {
      priceComparison.mutate(price);
    }
  };

  const handleUseSuggestedPrice = () => {
    if (priceComparison.data?.insights.averagePrice) {
      const suggestedPrice = priceComparison.data.insights.averagePrice / 100000;
      onPriceRecommend(suggestedPrice);
      setTestPrice(suggestedPrice.toFixed(2));
    }
  };

  // Check if we have enough data to provide recommendations
  const canProvideRecommendation = carData.brand && carData.model && carData.year && carData.city;

  if (!canProvideRecommendation) {
    return (
      <Card className="mt-4">
        <CardContent className="pt-6">
          <div className="flex items-center text-muted-foreground">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span className="text-sm">Fill in car details to get price recommendations</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Smart Pricing Assistant
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Get market-based pricing recommendations for your {carData.year} {carData.brand} {carData.model}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              type="number"
              step="0.01"
              placeholder="Enter your asking price (in lakhs)"
              value={testPrice}
              onChange={(e) => setTestPrice(e.target.value)}
              data-testid="input-test-price"
            />
          </div>
          <Button 
            onClick={handleGetRecommendation}
            disabled={!testPrice || priceComparison.isPending}
            data-testid="button-get-recommendation"
          >
            {priceComparison.isPending ? "Analyzing..." : "Analyze Price"}
          </Button>
        </div>

        {priceComparison.data && showRecommendation && (
          <div className="space-y-4">
            {/* Price Comparison Result */}
            <div className={`border rounded-lg p-4 ${getComparisonColor(priceComparison.data.comparison)}`}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Your Price Analysis</span>
                <Badge variant="outline" className="border-current">
                  {priceComparison.data.comparison === 'below' ? 'Below Market' : 
                   priceComparison.data.comparison === 'above' ? 'Above Market' : 'Fair Price'}
                </Badge>
              </div>
              <p className="text-sm" data-testid="text-price-suggestion">
                {priceComparison.data.suggestion}
              </p>
            </div>

            {/* Market Insights */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted rounded-lg p-3">
                <div className="text-sm text-muted-foreground">Market Average</div>
                <div className="font-bold" data-testid="text-market-average">
                  {priceComparison.data.insights.averagePrice > 0 ? 
                    formatPrice(priceComparison.data.insights.averagePrice) : 'N/A'}
                </div>
              </div>
              
              <div className="bg-muted rounded-lg p-3">
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  Market Trend
                  {getTrendIcon(priceComparison.data.insights.marketTrend)}
                </div>
                <div className="font-bold capitalize" data-testid="text-market-trend">
                  {priceComparison.data.insights.marketTrend}
                </div>
              </div>
            </div>

            {/* Price Range */}
            {priceComparison.data.insights.priceRange.min > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm font-medium text-blue-900 mb-2">Market Price Range</div>
                <div className="text-blue-800" data-testid="text-market-range">
                  {formatPrice(priceComparison.data.insights.priceRange.min)} - {formatPrice(priceComparison.data.insights.priceRange.max)}
                </div>
              </div>
            )}

            {/* Recommendation */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-sm font-medium text-green-900 mb-2">Recommendation</div>
              <p className="text-sm text-green-800 mb-3" data-testid="text-market-recommendation">
                {priceComparison.data.insights.recommendation}
              </p>
              
              {priceComparison.data.insights.averagePrice > 0 && (
                <Button 
                  size="sm" 
                  onClick={handleUseSuggestedPrice}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  data-testid="button-use-suggested-price"
                >
                  Use Market Price (₹{(priceComparison.data.insights.averagePrice / 100000).toFixed(2)} Lakh)
                </Button>
              )}
            </div>
          </div>
        )}

        {priceComparison.isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-800 text-sm">
              Unable to fetch market data right now. Please try again later.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}