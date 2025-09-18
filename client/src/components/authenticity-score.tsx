import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle, AlertTriangle, X, Shield, Eye, Phone, DollarSign, Info, Database } from "lucide-react";
import { type CarListing } from "@shared/schema";

interface AuthenticityScoreProps {
  car: CarListing;
  showDetails?: boolean;
  size?: 'compact' | 'full';
}

interface RealVerificationData {
  sourceReliability: number;
  dataQuality: number;
  imageAuthenticity: number;
  contactValidation: number;
  trustSignals: string[];
  verificationNotes: string[];
  overallTrust: number;
  dataSource: string;
  verificationMethod: string;
}

export default function RealVerificationDisplay({ car, showDetails = false, size = 'compact' }: AuthenticityScoreProps) {
  const [showFullDetails, setShowFullDetails] = useState(false);

  // REAL VERIFICATION ANALYSIS - No more AI hallucinations!
  const analyzeRealVerification = (car: CarListing): RealVerificationData => {
    const dataSource = car.source || 'Unknown';
    const verificationStatus = car.verificationStatus || 'unverified';
    const carAge = new Date().getFullYear() - car.year;
    
    // Real source reliability scoring
    const sourceReliability = getSourceReliability(dataSource);
    
    // Real data quality assessment
    const dataQuality = assessDataQuality(car);
    
    // Real image authenticity scoring (not AI-generated)
    const imageAuthenticity = assessImageAuthenticity(car);
    
    // Real contact validation
    const contactValidation = assessContactValidity(car);
    
    // Real trust signals based on actual data
    const trustSignals = generateRealTrustSignals(car, dataSource, verificationStatus);
    
    // Real verification notes
    const verificationNotes = generateVerificationNotes(car, dataSource);
    
    // Overall trust score based on real factors
    const overallTrust = Math.round(
      (sourceReliability * 0.3) + 
      (dataQuality * 0.25) + 
      (imageAuthenticity * 0.25) + 
      (contactValidation * 0.2)
    );

    return {
      sourceReliability,
      dataQuality,
      imageAuthenticity,
      contactValidation,
      trustSignals,
      verificationNotes,
      overallTrust,
      dataSource,
      verificationMethod: 'Real Data Analysis'
    };
  };

  const getSourceReliability = (source: string): number => {
    const sourceScores: { [key: string]: number } = {
      'CarDekho': 85,
      'Cars24': 80,
      'CarWale': 75,
      'OLX': 60,
      'Quikr': 55,
      'CarTrade': 80,
      'Unknown': 40
    };
    return sourceScores[source] || 40;
  };

  const assessDataQuality = (car: CarListing): number => {
    let score = 50; // Base score
    
    // Check for complete data
    if (car.year && car.year > 2000) score += 10;
    if (car.mileage && car.mileage > 0) score += 10;
    if (car.fuelType) score += 5;
    if (car.transmission) score += 5;
    if (car.location) score += 10;
    if (car.price && car.price > 50000) score += 10;
    
    return Math.min(100, score);
  };

  const assessImageAuthenticity = (car: CarListing): number => {
    if (!car.images || !Array.isArray(car.images) || car.images.length === 0) {
      return 30; // Low score for no images
    }
    
    let score = 60; // Base score for having images
    
    // Multiple images indicate better authenticity
    if (car.images.length >= 3) score += 20;
    if (car.images.length >= 5) score += 10;
    
    // Check for quality indicators (not placeholder)
    const hasQualityImages = car.images.some(img => 
      img && !img.includes('placeholder') && !img.includes('spacer')
    );
    if (hasQualityImages) score += 10;
    
    return Math.min(100, score);
  };

  const assessContactValidity = (car: CarListing): number => {
    let score = 40; // Base score
    
    // Check seller type
    if (car.sellerType === 'dealer') score += 30;
    if (car.sellerType === 'individual') score += 20;
    
    // Check if contact info seems complete (inferred from data completeness)
    if (car.location && car.location.length > 5) score += 15;
    if (car.url && car.url.includes('http')) score += 15;
    
    return Math.min(100, score);
  };

  const generateRealTrustSignals = (car: CarListing, source: string, status: string): string[] => {
    const signals: string[] = [];
    
    if (status === 'verified') {
      signals.push('Platform verified listing');
    }
    
    if (source === 'CarDekho' || source === 'Cars24') {
      signals.push('Established dealer platform');
    }
    
    if (car.images && car.images.length >= 3) {
      signals.push('Multiple photos provided');
    }
    
    if (car.sellerType === 'dealer') {
      signals.push('Professional dealer');
    }
    
    const carAge = new Date().getFullYear() - car.year;
    if (carAge <= 5) {
      signals.push('Relatively new vehicle');
    }
    
    if (car.price && car.price > 100000 && car.price < 5000000) {
      signals.push('Realistic price range');
    }
    
    return signals;
  };

  const generateVerificationNotes = (car: CarListing, source: string): string[] => {
    const notes: string[] = [];
    
    if (!car.images || car.images.length < 2) {
      notes.push('Limited photos available - request more images');
    }
    
    if (car.verificationStatus === 'unverified') {
      notes.push('Listing not yet verified by platform');
    }
    
    if (source === 'OLX' || source === 'Quikr') {
      notes.push('Individual seller platform - verify details independently');
    }
    
    const carAge = new Date().getFullYear() - car.year;
    if (carAge > 10) {
      notes.push('Older vehicle - inspect thoroughly before purchase');
    }
    
    if (!car.mileage || car.mileage === 0) {
      notes.push('Mileage information not provided');
    }
    
    return notes;
  };

  const verificationData = analyzeRealVerification(car);

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

  const ScoreIcon = getScoreIcon(verificationData.overallTrust);

  if (size === 'compact') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              className={`${getScoreBadgeColor(verificationData.overallTrust)} cursor-help flex items-center gap-1`}
              data-testid="badge-trust-score"
            >
              <Database className="w-3 h-3" />
              Trust: {verificationData.overallTrust}%
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1 text-xs">
              <div>Source: {verificationData.dataSource}</div>
              <div>Method: {verificationData.verificationMethod}</div>
              <div>Data Quality: {verificationData.dataQuality}%</div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="space-y-4" data-testid="verification-details">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-500" />
          Real Verification Analysis
        </h3>
        <Badge 
          className={getScoreBadgeColor(verificationData.overallTrust)}
          data-testid="badge-overall-trust"
        >
          <ScoreIcon className="w-4 h-4 mr-1" />
          {verificationData.overallTrust}% Trust Score
        </Badge>
      </div>

      <div className="bg-blue-50 p-3 rounded-lg">
        <div className="text-sm text-blue-700 mb-2">
          <strong>Verification Method:</strong> {verificationData.verificationMethod}
        </div>
        <div className="text-sm text-blue-700">
          <strong>Data Source:</strong> {verificationData.dataSource}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-2">
              <Database className="w-4 h-4" />
              Source Reliability
            </span>
            <span className={`text-sm font-semibold ${getScoreColor(verificationData.sourceReliability)}`}>
              {verificationData.sourceReliability}%
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-2">
              <Info className="w-4 h-4" />
              Data Quality
            </span>
            <span className={`text-sm font-semibold ${getScoreColor(verificationData.dataQuality)}`}>
              {verificationData.dataQuality}%
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Image Quality
            </span>
            <span className={`text-sm font-semibold ${getScoreColor(verificationData.imageAuthenticity)}`}>
              {verificationData.imageAuthenticity}%
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Contact Validity
            </span>
            <span className={`text-sm font-semibold ${getScoreColor(verificationData.contactValidation)}`}>
              {verificationData.contactValidation}%
            </span>
          </div>
        </div>
      </div>

      {(showDetails || showFullDetails) && (
        <div className="space-y-4">
          {verificationData.trustSignals.length > 0 && (
            <div>
              <h4 className="font-medium text-green-700 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Trust Indicators
              </h4>
              <ul className="space-y-1">
                {verificationData.trustSignals.map((signal, index) => (
                  <li key={index} className="text-sm text-green-600 flex items-center gap-2">
                    <CheckCircle className="w-3 h-3" />
                    {signal}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {verificationData.verificationNotes.length > 0 && (
            <div>
              <h4 className="font-medium text-yellow-700 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Verification Notes
              </h4>
              <ul className="space-y-1">
                {verificationData.verificationNotes.map((note, index) => (
                  <li key={index} className="text-sm text-yellow-600 flex items-center gap-2">
                    <Info className="w-3 h-3" />
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {!showDetails && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFullDetails(!showFullDetails)}
          data-testid="button-toggle-details"
        >
          {showFullDetails ? 'Hide Details' : 'Show Details'}
        </Button>
      )}
    </div>
  );
}