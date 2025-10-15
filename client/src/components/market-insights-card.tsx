import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  ChevronDown, 
  ChevronUp,
  Loader2,
  BarChart3,
  Fuel,
  Gauge,
  MapPin
} from "lucide-react";
import { type Car } from "@shared/schema";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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

interface MarketInsightsCardProps {
  car: Car;
}

export default function MarketInsightsCard({ car }: MarketInsightsCardProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [hasGenerated, setHasGenerated] = useState(false);
  const lastCarId = useRef<string | null>(null);

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
    onSuccess: () => {
      setHasGenerated(true);
    }
  });

  useEffect(() => {
    if (car && lastCarId.current !== car.id && !insightMutation.isPending) {
      lastCarId.current = car.id;
      setHasGenerated(false);
      const carPrice = typeof car.price === 'string' ? parseFloat(car.price) : car.price;
      
      insightMutation.mutate({
        query: `${car.brand} ${car.model} ${car.year} in ${car.city}`,
        carDetails: {
          model: `${car.brand} ${car.model}`,
          variant: undefined,
          year: car.year,
          color: undefined,
          transmission: car.transmission,
          fuel: car.fuelType,
          mileage: car.mileage,
          price: carPrice,
          location: car.city
        }
      });
    }
  }, [car, insightMutation.isPending]);

  const handleGenerateInsights = () => {
    if (!isOpen) {
      setIsOpen(true);
    }

    if (!hasGenerated) {
      const carPrice = typeof car.price === 'string' ? parseFloat(car.price) : car.price;
      
      insightMutation.mutate({
        query: `${car.brand} ${car.model} ${car.year} in ${car.city}`,
        carDetails: {
          model: `${car.brand} ${car.model}`,
          variant: undefined,
          year: car.year,
          color: undefined,
          transmission: car.transmission,
          fuel: car.fuelType,
          mileage: car.mileage,
          price: carPrice,
          location: car.city
        }
      });
    }
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
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-6">
      <Card className="border-purple-200 dark:border-purple-800">
        <CardHeader className="pb-3">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer group">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                AI Market Insights
                <Badge variant="outline" className="text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                  Powered by AI
                </Badge>
              </CardTitle>
              {isOpen ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition" />
              )}
            </div>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {!hasGenerated && !insightMutation.isPending && (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Get AI-powered market analysis for this car
                </p>
                <Button 
                  onClick={handleGenerateInsights}
                  size="sm"
                  className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                  data-testid="button-generate-insights"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Analyze Market
                </Button>
              </div>
            )}

            {insightMutation.isPending && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Analyzing market trends...
                </span>
              </div>
            )}

            {insightMutation.data?.insight && (
              <div className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-2" data-testid="text-insight">
                      {insightMutation.data.insight.insight}
                    </p>
                  </div>
                  <Badge 
                    className={`${getDealBadgeColor(insightMutation.data.insight.dealQuality.badge)} text-white text-xs ml-2 animate-in fade-in-50 slide-in-from-right-5`}
                    data-testid="badge-deal"
                  >
                    {insightMutation.data.insight.dealQuality.badge === 'Excellent Deal' && '🎯 '}
                    {insightMutation.data.insight.dealQuality.badge === 'Good Deal' && '✨ '}
                    {insightMutation.data.insight.dealQuality.badge === 'Fair Price' && '👍 '}
                    {insightMutation.data.insight.dealQuality.badge}
                  </Badge>
                </div>

                {insightMutation.data.insight.priceComparison && (
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="grid grid-cols-3 gap-3 text-center mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Your Price</p>
                        <p className="text-lg font-bold text-purple-600 dark:text-purple-400" data-testid="text-your-price">
                          {insightMutation.data.insight.priceComparison.yourPrice}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Market Avg</p>
                        <p className="text-lg font-bold" data-testid="text-market-avg">
                          {insightMutation.data.insight.priceComparison.marketAverage}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Difference</p>
                        <p className="text-lg font-bold flex items-center justify-center gap-1" data-testid="text-diff">
                          {insightMutation.data.insight.priceComparison.percentageDiff.startsWith('+') ? (
                            <TrendingUp className="h-4 w-4 text-red-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-green-500" />
                          )}
                          <span className={insightMutation.data.insight.priceComparison.percentageDiff.startsWith('+') ? 'text-red-500' : 'text-green-500'}>
                            {insightMutation.data.insight.priceComparison.percentageDiff}
                          </span>
                        </p>
                      </div>
                    </div>
                    
                    {/* Visual Price Comparison Bar */}
                    <div className="space-y-1 mb-3">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Below Market</span>
                        <span>Above Market</span>
                      </div>
                      <div className="relative h-2 bg-gradient-to-r from-green-200 via-yellow-200 to-red-200 dark:from-green-900 dark:via-yellow-900 dark:to-red-900 rounded-full">
                        <div 
                          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-purple-600 dark:bg-purple-400 rounded-full border-2 border-white dark:border-gray-900 shadow-lg"
                          style={{ left: `${Math.min(Math.max((parseFloat(insightMutation.data.insight.priceComparison.percentageDiff) + 50), 0), 100)}%` }}
                        />
                      </div>
                    </div>
                    
                    <p className="text-xs text-center font-medium text-purple-700 dark:text-purple-300">
                      {insightMutation.data.insight.dealQuality.reason}
                    </p>
                  </div>
                )}

                {/* Market Trends Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Model & Location Insights */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      <BarChart3 className="h-3 w-3" />
                      Market Trends
                    </p>
                    <div className="space-y-1.5">
                      <div className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                        <TrendingUp className="h-3 w-3 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-blue-800 dark:text-blue-300">{insightMutation.data.insight.granularBreakdown.modelTrend}</span>
                      </div>
                      <div className="flex items-start gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-md">
                        <MapPin className="h-3 w-3 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-green-800 dark:text-green-300">{insightMutation.data.insight.granularBreakdown.locationInsight}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Fuel & Transmission Preferences */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      <Fuel className="h-3 w-3" />
                      Buyer Preferences
                    </p>
                    <div className="space-y-1.5">
                      <div className="flex items-start gap-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-md">
                        <Fuel className="h-3 w-3 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-orange-800 dark:text-orange-300">{insightMutation.data.insight.granularBreakdown.fuelTypeTrend}</span>
                      </div>
                      <div className="flex items-start gap-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-md">
                        <Gauge className="h-3 w-3 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-purple-800 dark:text-purple-300">{insightMutation.data.insight.granularBreakdown.transmissionTrend}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Data Sourced From:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {insightMutation.data.insight.sources.slice(0, 4).map((source, index) => (
                      <div
                        key={index}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/30 text-xs text-purple-700 dark:text-purple-300"
                        data-testid={`badge-source-${index}`}
                      >
                        {source.name.includes('SIAM') && '📊 '}
                        {source.name.includes('VAHAN') && '🚗 '}
                        {source.name.includes('CarDekho') && '🔍 '}
                        {source.name.includes('Spinny') && '✓ '}
                        {source.name.includes('OLX') && '📱 '}
                        {source.name.includes('Telangana') && '🏛️ '}
                        {source.name.split(' ')[0]}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {insightMutation.isError && (
              <div className="text-center py-4">
                <p className="text-sm text-destructive mb-3">
                  Unable to load insights at the moment
                </p>
                <Button 
                  onClick={handleGenerateInsights}
                  size="sm"
                  variant="outline"
                >
                  Try Again
                </Button>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
