import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle, AlertTriangle, X, Shield, Eye, Phone, DollarSign, Info, Loader2 } from "lucide-react";
import { type CarListing } from "@shared/schema";

interface AuthenticityScoreProps {
  car: CarListing;
  showDetails?: boolean;
  size?: 'compact' | 'full';
}

interface AuthenticityScore {
  id: string;
  listing_id: string;
  overall_authenticity: number;
  price_authenticity: number;
  image_authenticity: number;
  contact_validity: number;
  fraud_indicators: string[];
  trust_signals: string[];
  confidence_score: number;
  model_version: string;
  analysis_timestamp: string;
  model_latency_ms: number;
}

interface AuthenticityResponse {
  authenticity_score: AuthenticityScore;
  analysis_timestamp: string;
}

export default function AuthenticityScoreDisplay({ car, showDetails = false, size = 'compact' }: AuthenticityScoreProps) {
  const [showFullDetails, setShowFullDetails] = useState(false);

  const { data: authenticityData, isLoading, error } = useQuery<AuthenticityResponse>({
    queryKey: ['/api/ai/score-authenticity', car.id],
    queryFn: async () => {
      const response = await fetch('/api/ai/score-authenticity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ listing: car }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch authenticity score');
      }
      
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBadgeColor = (score: number): string => {
    if (score >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return CheckCircle;
    if (score >= 60) return AlertTriangle;
    return X;
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Analyzing authenticity...</span>
      </div>
    );
  }

  if (error || !authenticityData) {
    return null; // Gracefully hide on error
  }

  const score = authenticityData?.authenticity_score;
  
  if (!score) {
    return null;
  }
  const ScoreIcon = getScoreIcon(score.overall_authenticity);

  if (size === 'compact') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className={`flex items-center gap-1 ${getScoreBadgeColor(score.overall_authenticity)}`}
              data-testid={`authenticity-score-${car.id}`}
            >
              <ScoreIcon className="h-3 w-3" />
              <span>{Math.round(score.overall_authenticity)}% Authentic</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="space-y-2">
              <div className="font-medium">Authenticity Breakdown</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>Price: {Math.round(score.price_authenticity)}%</div>
                <div>Images: {Math.round(score.image_authenticity)}%</div>
                <div>Contact: {Math.round(score.contact_validity)}%</div>
                <div>Confidence: {Math.round(score.confidence_score * 100)}%</div>
              </div>
              {score.fraud_indicators.length > 0 && (
                <div className="text-red-600 dark:text-red-400 text-xs">
                  ⚠️ Fraud indicators detected
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="space-y-4" data-testid={`authenticity-full-${car.id}`}>
      {/* Overall Score Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <span className="font-medium">Authenticity Score</span>
        </div>
        <Badge 
          variant="outline" 
          className={`${getScoreBadgeColor(score.overall_authenticity)}`}
        >
          <ScoreIcon className="h-4 w-4 mr-1" />
          {Math.round(score.overall_authenticity)}%
        </Badge>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
          <DollarSign className="h-4 w-4 text-green-600" />
          <div>
            <div className="text-xs text-muted-foreground">Price</div>
            <div className={`font-medium ${getScoreColor(score.price_authenticity)}`}>
              {Math.round(score.price_authenticity)}%
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
          <Eye className="h-4 w-4 text-blue-600" />
          <div>
            <div className="text-xs text-muted-foreground">Images</div>
            <div className={`font-medium ${getScoreColor(score.image_authenticity)}`}>
              {Math.round(score.image_authenticity)}%
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
          <Phone className="h-4 w-4 text-purple-600" />
          <div>
            <div className="text-xs text-muted-foreground">Contact</div>
            <div className={`font-medium ${getScoreColor(score.contact_validity)}`}>
              {Math.round(score.contact_validity)}%
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
          <Info className="h-4 w-4 text-orange-600" />
          <div>
            <div className="text-xs text-muted-foreground">Confidence</div>
            <div className={`font-medium ${getScoreColor(score.confidence_score * 100)}`}>
              {Math.round(score.confidence_score * 100)}%
            </div>
          </div>
        </div>
      </div>

      {/* Trust Signals */}
      {score.trust_signals.length > 0 && (
        <div>
          <div className="text-sm font-medium mb-2 text-green-700 dark:text-green-300">
            ✅ Trust Signals
          </div>
          <div className="flex flex-wrap gap-1">
            {score.trust_signals.map((signal: string, index: number) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300"
              >
                {signal.replace(/_/g, ' ')}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Fraud Indicators */}
      {score.fraud_indicators.length > 0 && (
        <div>
          <div className="text-sm font-medium mb-2 text-red-700 dark:text-red-300">
            ⚠️ Fraud Indicators
          </div>
          <div className="flex flex-wrap gap-1">
            {score.fraud_indicators.map((indicator: string, index: number) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="text-xs bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300"
              >
                {indicator.replace(/_/g, ' ')}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Analysis Info */}
      <div className="text-xs text-muted-foreground border-t pt-2">
        <div>Analysis completed in {score.model_latency_ms}ms</div>
        <div>Powered by Cararth AI ({score.model_version.split(':')[0]})</div>
      </div>
    </div>
  );
}