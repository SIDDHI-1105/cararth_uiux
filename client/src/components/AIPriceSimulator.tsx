import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Bot, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Brain,
  Eye,
  Target,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CarDetails {
  brand: string;
  model: string;
  year: number;
  city: string;
}

interface PriceAnalysis {
  recommendedPrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  marketInsights: string[];
  confidence: number;
  competitiveAnalysis: string;
  sellStrategy: string;
}

interface AIPriceSimulatorProps {
  carDetails: CarDetails;
  onPriceSelected: (price: number) => void;
}

export function AIPriceSimulator({ carDetails, onPriceSelected }: AIPriceSimulatorProps) {
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<PriceAnalysis | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  const priceAnalysisMutation = useMutation({
    mutationFn: async (data: CarDetails) => {
      const response = await apiRequest("POST", "/api/ai/price-analysis", {
        brand: data.brand,
        model: data.model,
        year: data.year,
        city: data.city,
        context: "seller_pricing_assistant"
      });
      return response.json();
    },
    onSuccess: (data) => {
      setAnalysis(data.analysis);
      toast({
        title: "🤖 AI Analysis Complete!",
        description: "Smart pricing recommendations ready based on market data.",
      });
    },
    onError: () => {
      toast({
        title: "AI Analysis Failed",
        description: "Unable to analyze pricing right now. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGetPriceAnalysis = () => {
    if (!carDetails.brand || !carDetails.model || !carDetails.year) {
      toast({
        title: "Missing Car Details",
        description: "Please fill in brand, model, and year first.",
        variant: "destructive",
      });
      return;
    }
    priceAnalysisMutation.mutate(carDetails);
  };

  const handleUsePriceRecommendation = () => {
    if (analysis?.recommendedPrice) {
      onPriceSelected(analysis.recommendedPrice);
      toast({
        title: "Price Applied!",
        description: `Set price to ₹${analysis.recommendedPrice.toLocaleString()} lakhs based on AI analysis.`,
      });
    }
  };

  if (!isVisible) return null;

  return (
    <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 relative overflow-hidden">
      
      {/* Robot Character Header */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <Bot className="h-7 w-7 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <span>CaraBot AI</span>
                <Badge variant="secondary" className="text-xs">
                  <Brain className="h-3 w-3 mr-1" />
                  Smart Pricing
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Your intelligent pricing assistant
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsVisible(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            ×
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        
        {/* Analysis State */}
        {!analysis && !priceAnalysisMutation.isPending && (
          <div className="space-y-4">
            <div className="bg-white/50 dark:bg-gray-900/50 p-4 rounded-lg border border-purple-100 dark:border-purple-900">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                <span className="font-medium text-sm">AI Market Analysis</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                I'll analyze your car's market value using real-time data from multiple platforms and provide intelligent pricing recommendations.
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                <Eye className="h-3 w-3" />
                <span>Market trends across CarDekho, OLX, Cars24</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Target className="h-3 w-3" />
                <span>Location-based pricing for {carDetails.city || 'your city'}</span>
              </div>
            </div>
            
            <Button 
              onClick={handleGetPriceAnalysis}
              disabled={priceAnalysisMutation.isPending}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              data-testid="button-ai-price-analysis"
            >
              <Brain className="h-4 w-4 mr-2" />
              Get AI Price Analysis
            </Button>
          </div>
        )}

        {/* Loading State */}
        {priceAnalysisMutation.isPending && (
          <div className="space-y-4">
            <div className="bg-white/50 dark:bg-gray-900/50 p-4 rounded-lg border border-purple-100 dark:border-purple-900">
              <div className="flex items-center gap-2 mb-3">
                <Loader2 className="h-4 w-4 text-purple-600 animate-spin" />
                <span className="font-medium text-sm">Analyzing Market Data...</span>
              </div>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>Scanning {carDetails.brand} {carDetails.model} {carDetails.year} listings</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Comparing prices in {carDetails.city}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <span>Calculating optimal pricing strategy</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results State */}
        {analysis && (
          <div className="space-y-4">
            
            {/* Price Recommendation */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-sm">Recommended Price</span>
                </div>
                <Badge variant="outline" className="text-green-700 border-green-300">
                  {analysis.confidence}% confidence
                </Badge>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-green-700 dark:text-green-400">
                  ₹{analysis.recommendedPrice.toLocaleString()}
                </span>
                <span className="text-sm text-muted-foreground">lakhs</span>
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                Range: ₹{analysis.priceRange.min.toLocaleString()} - ₹{analysis.priceRange.max.toLocaleString()} lakhs
              </p>
            </div>

            {/* Market Insights */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-sm">Market Insights</span>
              </div>
              <div className="space-y-1">
                {analysis.marketInsights.slice(0, 3).map((insight, index) => (
                  <div key={index} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5"></div>
                    <span>{insight}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sell Strategy */}
            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-sm">Smart Selling Strategy</span>
              </div>
              <p className="text-xs text-muted-foreground">{analysis.sellStrategy}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                onClick={handleUsePriceRecommendation}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                data-testid="button-use-ai-price"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Use This Price
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setAnalysis(null)}
                className="flex-1"
              >
                New Analysis
              </Button>
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}