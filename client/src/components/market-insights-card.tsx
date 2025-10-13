import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  ChevronDown, 
  ChevronUp,
  Loader2,
  ExternalLink 
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
  const [isOpen, setIsOpen] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

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
          variant: undefined, // Not available in schema
          year: car.year,
          color: undefined, // Not available in schema
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
                <Badge variant="outline" className="ml-2 text-xs">
                  Powered by Grok
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
                    className={`${getDealBadgeColor(insightMutation.data.insight.dealQuality.badge)} text-white text-xs ml-2`}
                    data-testid="badge-deal"
                  >
                    {insightMutation.data.insight.dealQuality.badge}
                  </Badge>
                </div>

                {insightMutation.data.insight.priceComparison && (
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground">Your Price</p>
                        <p className="text-sm font-semibold" data-testid="text-your-price">
                          {insightMutation.data.insight.priceComparison.yourPrice}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Market Avg</p>
                        <p className="text-sm font-semibold" data-testid="text-market-avg">
                          {insightMutation.data.insight.priceComparison.marketAverage}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Difference</p>
                        <p className="text-sm font-semibold flex items-center justify-center gap-1" data-testid="text-diff">
                          {insightMutation.data.insight.priceComparison.percentageDiff.startsWith('+') ? (
                            <TrendingUp className="h-3 w-3 text-red-500" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-green-500" />
                          )}
                          {insightMutation.data.insight.priceComparison.percentageDiff}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      {insightMutation.data.insight.dealQuality.reason}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Quick Insights:</p>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div className="flex items-start gap-2">
                      <TrendingUp className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{insightMutation.data.insight.granularBreakdown.modelTrend}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <TrendingUp className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{insightMutation.data.insight.granularBreakdown.locationInsight}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-2">Data Sources:</p>
                  <div className="flex flex-wrap gap-1">
                    {insightMutation.data.insight.sources.slice(0, 4).map((source, index) => (
                      <a
                        key={index}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                        data-testid={`link-source-${index}`}
                      >
                        {source.name.split(' ')[0]}
                        <ExternalLink className="h-2 w-2" />
                      </a>
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
