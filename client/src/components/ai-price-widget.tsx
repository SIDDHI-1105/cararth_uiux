import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, Brain, Zap, TrendingUp, TrendingDown, Minus, 
  Calculator, ArrowRight, Sparkles, MessageCircle 
} from "lucide-react";
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
  powered_by?: string; // "xAI Grok" or "Perplexity AI"
}

interface AIPriceWidgetProps {
  onPriceEstimate?: (price: number) => void;
  className?: string;
}

export default function AIPriceWidget({ onPriceEstimate, className = "" }: AIPriceWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: 2020,
    city: 'Hyderabad'
  });

  const simulatePriceMutation = useMutation({
    mutationFn: async (data: { brand: string; model: string; year: string; city: string }): Promise<PriceSimulationResult> => {
      const response = await apiRequest('POST', '/api/price-simulator', data);
      return await response.json();
    },
    onSuccess: (result) => {
      if (onPriceEstimate) {
        onPriceEstimate(result.estimatedPrice);
      }
    },
    onError: () => {
      // Error handling - will show error state in UI
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.brand || !formData.model || !formData.year) {
      return;
    }
    // Ensure year is string for API (as per server schema)
    const apiData = {
      ...formData,
      year: String(formData.year)
    };
    simulatePriceMutation.mutate(apiData);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getTrendIcon = (trend: 'rising' | 'falling' | 'stable') => {
    switch (trend) {
      case 'rising': return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'falling': return <TrendingDown className="h-3 w-3 text-red-500" />;
      default: return <Minus className="h-3 w-3 text-yellow-500" />;
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Humanoid AI Assistant Avatar */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div className="w-1 h-4 bg-blue-200 mx-auto mt-1 rounded-full"></div>
        </div>

        {/* Speech Bubble */}
        <div className="flex-1 relative">
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 shadow-md">
            {/* Speech bubble tail */}
            <div className="absolute left-0 top-4 w-0 h-0 border-r-8 border-r-blue-200 border-t-4 border-t-transparent border-b-4 border-b-transparent -ml-2"></div>
            
            <CardContent className="p-4">
              {!isExpanded ? (
                /* Initial AI Greeting */
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-600" />
                    <span className="font-medium text-sm">AI Price Assistant</span>
                    <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Smart
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    👋 Hi! I'm your AI pricing assistant powered by <strong>xAI Grok</strong>. I can help you get the best market price for your car using real-time data from SIAM, Telangana RTA, Spinny, CarDekho & OLX.
                  </p>
                  <Button 
                    onClick={() => setIsExpanded(true)}
                    size="sm" 
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    data-testid="button-get-price-estimate"
                  >
                    <Calculator className="w-4 h-4 mr-2" />
                    Get AI Price Estimate
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              ) : simulatePriceMutation.error ? (
                /* Error State */
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-red-600" />
                    <span className="font-medium text-sm text-red-700">Oops! Something went wrong</span>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3">
                    <p className="text-xs text-red-600">
                      I couldn't get the price estimate right now. Please try again or check your car details.
                    </p>
                  </div>
                  <Button 
                    onClick={() => simulatePriceMutation.reset()}
                    size="sm" 
                    variant="outline"
                    className="w-full h-8"
                    data-testid="button-try-again"
                  >
                    <span className="text-xs">Try Again</span>
                  </Button>
                </div>
              ) : !simulatePriceMutation.data ? (
                /* Price Estimation Form */
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageCircle className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-sm">Tell me about your car</span>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <Select 
                        value={formData.brand} 
                        onValueChange={(value) => setFormData({...formData, brand: value})}
                      >
                        <SelectTrigger className="h-8 text-xs" data-testid="widget-brand">
                          <SelectValue placeholder="Brand" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Maruti Suzuki">Maruti</SelectItem>
                          <SelectItem value="Hyundai">Hyundai</SelectItem>
                          <SelectItem value="Tata">Tata</SelectItem>
                          <SelectItem value="Mahindra">Mahindra</SelectItem>
                          <SelectItem value="Honda">Honda</SelectItem>
                          <SelectItem value="Toyota">Toyota</SelectItem>
                        </SelectContent>
                      </Select>

                      <Input
                        placeholder="Model"
                        value={formData.model}
                        onChange={(e) => setFormData({...formData, model: e.target.value})}
                        className="h-8 text-xs"
                        data-testid="widget-model"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Year"
                        type="number"
                        value={formData.year}
                        onChange={(e) => setFormData({...formData, year: parseInt(e.target.value) || 2020})}
                        className="h-8 text-xs"
                        data-testid="widget-year"
                      />
                      
                      <Select 
                        value={formData.city} 
                        onValueChange={(value) => setFormData({...formData, city: value})}
                      >
                        <SelectTrigger className="h-8 text-xs" data-testid="widget-city">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Hyderabad">🚀 Hyderabad</SelectItem>
                          <SelectItem value="Delhi">Delhi NCR</SelectItem>
                          <SelectItem value="Mumbai">Mumbai</SelectItem>
                          <SelectItem value="Bangalore">Bangalore</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        type="submit" 
                        size="sm" 
                        disabled={simulatePriceMutation.isPending || !formData.brand || !formData.model || !formData.year}
                        className="flex-1 h-8 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                        data-testid="button-get-estimate"
                      >
                        {simulatePriceMutation.isPending ? (
                          <>
                            <Zap className="w-3 h-3 mr-1 animate-pulse" />
                            <span className="text-xs">Analyzing...</span>
                          </>
                        ) : (
                          <>
                            <Brain className="w-3 h-3 mr-1" />
                            <span className="text-xs">Get Price</span>
                          </>
                        )}
                      </Button>
                      
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => setIsExpanded(false)}
                        className="h-8 px-3"
                      >
                        <span className="text-xs">×</span>
                      </Button>
                    </div>
                  </form>
                </div>
              ) : (
                /* AI Results Display */
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-sm">AI Analysis Complete!</span>
                    <Badge variant="outline" className="text-xs bg-green-100 text-green-700">
                      {Math.round(simulatePriceMutation.data.confidence * 100)}% confident
                    </Badge>
                    {simulatePriceMutation.data.powered_by && (
                      <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700">
                        {simulatePriceMutation.data.powered_by}
                      </Badge>
                    )}
                  </div>

                  {/* Price Result */}
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <div className="text-center space-y-2">
                      <div className="text-lg font-bold text-green-700">
                        {formatPrice(simulatePriceMutation.data.estimatedPrice)}
                      </div>
                      <div className="text-xs text-gray-600">
                        Range: {formatPrice(simulatePriceMutation.data.priceRange.min)} - {formatPrice(simulatePriceMutation.data.priceRange.max)}
                      </div>
                      <div className="flex items-center justify-center gap-1 text-xs">
                        {getTrendIcon(simulatePriceMutation.data.marketAnalysis.trend)}
                        <span className="capitalize">{simulatePriceMutation.data.marketAnalysis.trend} market</span>
                      </div>
                    </div>
                  </div>

                  {/* AI Insights */}
                  {simulatePriceMutation.data.aiInsights.length > 0 && (
                    <div className="bg-blue-50 rounded-lg p-3 space-y-1">
                      <div className="text-xs font-medium text-blue-700 mb-1">💡 AI Insights:</div>
                      {simulatePriceMutation.data.aiInsights.slice(0, 2).map((insight, index) => (
                        <div key={index} className="text-xs text-blue-600 leading-relaxed">
                          • {insight}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Data Sources */}
                  {simulatePriceMutation.data.sources && simulatePriceMutation.data.sources.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="text-xs text-gray-500 flex items-center gap-1 flex-wrap">
                        <span>📊 Data from:</span>
                        {simulatePriceMutation.data.sources.slice(0, 3).map((source, index) => (
                          <span key={index} className="text-gray-600 font-medium">
                            {source}{index < Math.min(2, simulatePriceMutation.data.sources.length - 1) ? ',' : ''}
                          </span>
                        ))}
                        {simulatePriceMutation.data.sources.length > 3 && (
                          <span className="text-gray-500">+{simulatePriceMutation.data.sources.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      onClick={() => {
                        setIsExpanded(false);
                        simulatePriceMutation.reset();
                      }}
                      size="sm" 
                      variant="outline"
                      className="flex-1 h-8"
                    >
                      <span className="text-xs">Try Another Car</span>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}