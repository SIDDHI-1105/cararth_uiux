import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, RefreshCw, BarChart3 } from "lucide-react";
import { type Car } from "@shared/schema";
import { IndicativeLoanDisclaimer } from "@/components/ui/indicative-loan-disclaimer";

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
  marketIntelligence?: {
    siamData?: {
      monthlyUnits: number;
      growthYoY: number;
      marketShare: number;
      lastUpdated: string;
    };
    trendsData?: {
      searchVolume: number;
      trendDirection: string;
      changePercent: number;
      lastUpdated: string;
    };
  };
}

interface PriceInsightsProps {
  car: Car;
}

export default function PriceInsights({ car }: PriceInsightsProps) {
  const [showInsights, setShowInsights] = useState(true); // AUTO-LOAD AI INTELLIGENCE!

  const { data: insights, isLoading, refetch } = useQuery<PriceInsight>({
    queryKey: ["/api/cars", car.id, "price-insights"],
    enabled: showInsights,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
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

            {/* Real Market Intelligence - SIAM & Google Trends */}
            {insights.marketIntelligence && (insights.marketIntelligence.siamData || insights.marketIntelligence.trendsData) ? (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Real Market Intelligence
                </h4>
                
                {insights.marketIntelligence.siamData ? (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white rounded p-2">
                      <div className="text-xs text-muted-foreground">Monthly Sales</div>
                      <div className="text-lg font-bold text-blue-900" data-testid="text-siam-units">
                        {insights.marketIntelligence.siamData.monthlyUnits.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-white rounded p-2">
                      <div className="text-xs text-muted-foreground">YoY Growth</div>
                      <div className="text-lg font-bold text-green-600" data-testid="text-siam-growth">
                        +{insights.marketIntelligence.siamData.growthYoY}%
                      </div>
                    </div>
                    <div className="bg-white rounded p-2">
                      <div className="text-xs text-muted-foreground">Market Share</div>
                      <div className="text-lg font-bold text-purple-600" data-testid="text-siam-share">
                        {insights.marketIntelligence.siamData.marketShare}%
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-blue-700 bg-blue-100 rounded p-2">
                    ℹ️ SIAM sales data not available for this model yet
                  </div>
                )}
                
                {insights.marketIntelligence.trendsData ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded p-2">
                      <div className="text-xs text-muted-foreground">Search Interest</div>
                      <div className="text-lg font-bold text-indigo-900" data-testid="text-trends-volume">
                        {insights.marketIntelligence.trendsData.searchVolume}/100
                      </div>
                    </div>
                    <div className="bg-white rounded p-2">
                      <div className="text-xs text-muted-foreground">Trend</div>
                      <div className="text-lg font-bold capitalize text-green-600" data-testid="text-trends-direction">
                        {insights.marketIntelligence.trendsData.trendDirection} ({insights.marketIntelligence.trendsData.changePercent > 0 ? '+' : ''}{insights.marketIntelligence.trendsData.changePercent}%)
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-blue-700 bg-blue-100 rounded p-2">
                    ℹ️ Google Trends data not available for this model yet
                  </div>
                )}
                
                <div className="text-xs text-blue-700">
                  ✓ Data from SIAM (Society of Indian Automobile Manufacturers) & Google Trends
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-muted-foreground">
                  💡 Real market intelligence data (SIAM sales & Google Trends) will appear here when available for this car model
                </div>
              </div>
            )}

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
            
            {/* Universal Disclaimer - Price insights may influence financing decisions */}
            <div className="mt-4">
              <IndicativeLoanDisclaimer compact />
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