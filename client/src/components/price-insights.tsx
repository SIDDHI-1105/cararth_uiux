import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, RefreshCw, BarChart3 } from "lucide-react";
import { type Car } from "@shared/schema";

interface PriceInsight {
  averagePrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  marketTrend: 'rising' | 'falling' | 'stable';
  recommendation: string;
  sources: string[];
  lastUpdated: string;
}

interface PriceInsightsProps {
  car: Car;
}

export default function PriceInsights({ car }: PriceInsightsProps) {
  const [showInsights, setShowInsights] = useState(false);

  const { data: insights, isLoading, refetch } = useQuery<PriceInsight>({
    queryKey: ["/api/cars", car.id, "price-insights"],
    enabled: showInsights,
    staleTime: 5 * 60 * 1000, // 5 minutes
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

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'rising':
        return 'bg-green-100 text-green-800';
      case 'falling':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getCurrentPriceComparison = () => {
    if (!insights) return null;
    
    const currentPrice = parseFloat(car.price);
    const avgPrice = insights.averagePrice;
    
    if (avgPrice === 0) return null;
    
    const difference = ((currentPrice - avgPrice) / avgPrice) * 100;
    
    if (difference < -10) {
      return { type: 'below', text: `${Math.abs(difference).toFixed(1)}% below market`, color: 'text-green-600' };
    } else if (difference > 10) {
      return { type: 'above', text: `${difference.toFixed(1)}% above market`, color: 'text-red-600' };
    } else {
      return { type: 'fair', text: 'Fair market price', color: 'text-blue-600' };
    }
  };

  if (!showInsights) {
    return (
      <Card className="mt-4">
        <CardContent className="pt-6">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Market Price Analysis</h3>
            <p className="text-muted-foreground mb-4">
              Get real-time pricing insights from across the internet to understand market value
            </p>
            <Button 
              onClick={() => setShowInsights(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="button-get-insights"
            >
              Get Price Insights
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Market Price Insights
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            data-testid="button-refresh-insights"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-16 bg-muted rounded"></div>
                <div className="h-16 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        ) : insights ? (
          <div className="space-y-4">
            {/* Current Price Comparison */}
            <div className="bg-muted rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Your Price</span>
                <span className="text-2xl font-bold">{formatPrice(parseFloat(car.price))}</span>
              </div>
              {getCurrentPriceComparison() && (
                <div className={`text-sm font-medium ${getCurrentPriceComparison()!.color}`}>
                  {getCurrentPriceComparison()!.text}
                </div>
              )}
            </div>

            {/* Market Statistics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card border rounded-lg p-4">
                <div className="text-sm text-muted-foreground">Market Average</div>
                <div className="text-xl font-bold" data-testid="text-average-price">
                  {insights.averagePrice > 0 ? formatPrice(insights.averagePrice) : 'N/A'}
                </div>
              </div>
              
              <div className="bg-card border rounded-lg p-4">
                <div className="text-sm text-muted-foreground">Price Range</div>
                <div className="text-sm font-bold" data-testid="text-price-range">
                  {insights.priceRange.min > 0 ? 
                    `${formatPrice(insights.priceRange.min)} - ${formatPrice(insights.priceRange.max)}` : 
                    'N/A'
                  }
                </div>
              </div>
            </div>

            {/* Market Trend */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Market Trend</span>
              <Badge className={getTrendColor(insights.marketTrend)} data-testid="badge-market-trend">
                {getTrendIcon(insights.marketTrend)}
                <span className="ml-1 capitalize">{insights.marketTrend}</span>
              </Badge>
            </div>

            {/* Recommendation */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Market Recommendation</h4>
              <p className="text-sm text-blue-800" data-testid="text-recommendation">
                {insights.recommendation}
              </p>
            </div>

            {/* Data Sources */}
            <div className="text-xs text-muted-foreground">
              <div className="mb-1">Data sources: {insights.sources.join(', ')}</div>
              <div>Last updated: {new Date(insights.lastUpdated).toLocaleString()}</div>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <p>Unable to fetch market insights at this time.</p>
            <Button 
              variant="outline" 
              onClick={() => refetch()} 
              className="mt-2"
              data-testid="button-retry-insights"
            >
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}