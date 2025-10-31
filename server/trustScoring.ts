/**
 * Trust Scoring Service for CarArth
 * 
 * Calculates holistic trust scores for car listings based on 6 key factors:
 * 1. Price Fairness - How competitive is the price vs market average
 * 2. Recency - How recently was the listing posted
 * 3. Demand - Market demand for this vehicle model
 * 4. Completeness - How complete is the listing information
 * 5. Image Quality - Quality and authenticity of listing images
 * 6. Seller Trust - Trustworthiness based on listing source type
 * 
 * Plus bonus scoring for Google Vehicle Listings compliance (dealer listings only)
 */

import type { CachedPortalListing } from '@shared/schema.js';

export interface TrustScoreBreakdown {
  price: number;           // 0-100
  recency: number;         // 0-100
  demand: number;          // 0-100
  completeness: number;    // 0-100
  imageQuality: number;    // 0-100
  sellerTrust: number;     // 0-100
  googleCompliance?: number; // 0-100 (dealer listings only)
}

export interface TrustScore {
  overall: number;  // 0-100
  breakdown: TrustScoreBreakdown;
  label: 'Excellent' | 'Good' | 'Fair' | 'Needs Review';
  color: 'green' | 'blue' | 'yellow' | 'orange';
}

/**
 * Calculate overall trust score from individual components
 */
export function calculateTrustScore(listing: CachedPortalListing): TrustScore {
  const breakdown: TrustScoreBreakdown = {
    price: calculatePriceScore(listing),
    recency: calculateRecencyScore(listing),
    demand: calculateDemandScore(listing),
    completeness: calculateCompletenessScore(listing),
    imageQuality: calculateImageQualityScore(listing),
    sellerTrust: calculateSellerTrustScore(listing),
  };

  // Add Google compliance bonus for dealer listings
  if (listing.listingSource === 'exclusive_dealer' && listing.googleComplianceScore) {
    breakdown.googleCompliance = Number(listing.googleComplianceScore) || 0;
  }

  // Calculate weighted average (all factors equal weight)
  const scores = [
    breakdown.price,
    breakdown.recency,
    breakdown.demand,
    breakdown.completeness,
    breakdown.imageQuality,
    breakdown.sellerTrust,
  ];

  // Add small bonus for Google compliance (up to 5 points)
  const complianceBonus = breakdown.googleCompliance 
    ? (breakdown.googleCompliance / 100) * 5 
    : 0;

  const overall = Math.min(100, 
    scores.reduce((sum, score) => sum + score, 0) / scores.length + complianceBonus
  );

  // Determine label and color based on overall score
  let label: TrustScore['label'];
  let color: TrustScore['color'];

  if (overall >= 90) {
    label = 'Excellent';
    color = 'green';
  } else if (overall >= 75) {
    label = 'Good';
    color = 'blue';
  } else if (overall >= 60) {
    label = 'Fair';
    color = 'yellow';
  } else {
    label = 'Needs Review';
    color = 'orange';
  }

  return {
    overall: Math.round(overall * 10) / 10, // Round to 1 decimal
    breakdown,
    label,
    color,
  };
}

/**
 * 1. Price Fairness Score (0-100)
 * Based on how the price compares to market average
 */
function calculatePriceScore(listing: CachedPortalListing): number {
  // If we have a price fairness label, parse it
  if (listing.priceFairnessLabel) {
    const label = listing.priceFairnessLabel.toLowerCase();
    
    // Extract percentage if present
    const percentMatch = label.match(/(\d+)%\s*(below|above)/);
    if (percentMatch) {
      const percent = parseInt(percentMatch[1]);
      const direction = percentMatch[2];
      
      if (direction === 'below') {
        // Below market is good: 1-10% below = 95-100 score
        return Math.min(100, 95 + (percent * 0.5));
      } else {
        // Above market is bad: 1-10% above = 85-95 score
        return Math.max(50, 95 - (percent * 1.5));
      }
    }
    
    // Handle "at market price" or similar
    if (label.includes('at market') || label.includes('fair price')) {
      return 95;
    }
    
    // Handle "great deal" type labels
    if (label.includes('great') || label.includes('excellent')) {
      return 100;
    }
  }
  
  // If we have avg selling price, calculate percentage difference
  if (listing.avgSellingPrice && Number(listing.avgSellingPrice) > 0) {
    const currentPrice = Number(listing.price);
    const avgPrice = Number(listing.avgSellingPrice);
    const percentDiff = ((avgPrice - currentPrice) / avgPrice) * 100;
    
    if (percentDiff >= 5) {
      return 100; // 5%+ below average = excellent
    } else if (percentDiff >= 2) {
      return 98;  // 2-5% below average = very good
    } else if (percentDiff >= -2) {
      return 95;  // ±2% of average = at market
    } else if (percentDiff >= -5) {
      return 85;  // 2-5% above average = acceptable
    } else {
      return Math.max(50, 85 - Math.abs(percentDiff)); // More than 5% above
    }
  }
  
  // Default: assume fair price if no data
  return 75;
}

/**
 * 2. Recency Score (0-100)
 * Newer listings score higher
 */
function calculateRecencyScore(listing: CachedPortalListing): number {
  const listingDateValue = listing.listingDate || listing.createdAt;
  
  // Defensive fallback for missing/invalid dates
  if (!listingDateValue) {
    return 50; // Default middle score if no date available
  }
  
  const listingDate = new Date(listingDateValue);
  
  // Check for invalid date
  if (isNaN(listingDate.getTime())) {
    return 50; // Default middle score if date is invalid
  }
  
  const now = new Date();
  const ageInDays = (now.getTime() - listingDate.getTime()) / (1000 * 60 * 60 * 24);
  
  if (ageInDays <= 1) return 100;      // Today
  if (ageInDays <= 3) return 95;       // 1-3 days
  if (ageInDays <= 7) return 90;       // 1 week
  if (ageInDays <= 14) return 85;      // 2 weeks
  if (ageInDays <= 30) return 75;      // 1 month
  if (ageInDays <= 60) return 60;      // 2 months
  if (ageInDays <= 90) return 45;      // 3 months
  
  return Math.max(20, 45 - (ageInDays - 90) / 10); // Older listings
}

/**
 * 3. Demand Score (0-100)
 * Based on market demand for this vehicle model
 */
function calculateDemandScore(listing: CachedPortalListing): number {
  const demandIndex = Number(listing.demandIndex) || 0.5;
  
  // Convert 0-1 scale to 0-100
  return Math.round(demandIndex * 100);
}

/**
 * 4. Completeness Score (0-100)
 * How complete is the listing information
 */
function calculateCompletenessScore(listing: CachedPortalListing): number {
  // If we have pre-calculated completeness, use it
  if (listing.completeness && Number(listing.completeness) > 0) {
    return Math.round(Number(listing.completeness) * 100);
  }
  
  // Otherwise, calculate based on available fields
  let score = 0;
  let maxPoints = 0;
  
  // Essential fields (10 points each)
  const essentialFields = [
    listing.title,
    listing.brand,
    listing.model,
    listing.year,
    listing.price,
    listing.city,
  ];
  maxPoints += 60;
  score += essentialFields.filter(Boolean).length * 10;
  
  // Important fields (5 points each)
  const importantFields = [
    listing.mileage,
    listing.fuelType,
    listing.transmission,
    listing.owners,
  ];
  maxPoints += 20;
  score += importantFields.filter(Boolean).length * 5;
  
  // Nice to have (2 points each)
  const images = Array.isArray(listing.images) ? listing.images : [];
  score += Math.min(10, images.length * 2);
  maxPoints += 10;
  
  if (listing.description && listing.description.length > 50) {
    score += 5;
  }
  maxPoints += 5;
  
  const features = Array.isArray(listing.features) ? listing.features : [];
  score += Math.min(5, features.length);
  maxPoints += 5;
  
  return Math.round((score / maxPoints) * 100);
}

/**
 * 5. Image Quality Score (0-100)
 * Quality and authenticity of listing images
 */
function calculateImageQualityScore(listing: CachedPortalListing): number {
  // If we have pre-calculated image quality, use it
  if (listing.imageQualityAvg && Number(listing.imageQualityAvg) > 0) {
    return Math.round(Number(listing.imageQualityAvg) * 100);
  }
  
  // Otherwise, calculate based on available data
  let score = 50; // Base score
  
  // Check if has images
  const images = Array.isArray(listing.images) ? listing.images : [];
  if (images.length === 0) {
    return 20; // Very low score for no images
  }
  
  // More images = better (up to 6 images)
  score += Math.min(20, images.length * 3);
  
  // Bonus for real images flag
  if (listing.hasRealImage) {
    score += 15;
  }
  
  // Bonus for high image authenticity
  if (listing.imageAuthenticity && Number(listing.imageAuthenticity) > 70) {
    score += 15;
  }
  
  return Math.min(100, score);
}

/**
 * 6. Seller Trust Score (0-100)
 * Trustworthiness based on listing source type
 */
function calculateSellerTrustScore(listing: CachedPortalListing): number {
  const source = listing.listingSource || 'ethical_ai';
  
  // Base scores by source type
  let baseScore = 70; // Default for ethical_ai
  
  if (source === 'exclusive_dealer') {
    baseScore = 95; // Verified dealer partners get highest base trust
  } else if (source === 'user_direct') {
    baseScore = 85; // Individual sellers (if verified)
  }
  
  // Bonus for verification status
  if (listing.verificationStatus === 'verified') {
    baseScore += 5;
  }
  
  // Bonus for partner verification
  if (listing.partnerVerificationStatus === 'verified') {
    baseScore += 5;
  }
  
  // Penalty for rejected verification
  if (listing.partnerVerificationStatus === 'rejected') {
    baseScore -= 20;
  }
  
  return Math.min(100, Math.max(0, baseScore));
}

/**
 * Get trust score label as a user-friendly string
 */
export function getTrustScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent Deal';
  if (score >= 75) return 'Good Value';
  if (score >= 60) return 'Fair Listing';
  return 'Review Carefully';
}

/**
 * Get trust score color for UI
 */
export function getTrustScoreColor(score: number): string {
  if (score >= 90) return 'text-green-600 dark:text-green-400';
  if (score >= 75) return 'text-blue-600 dark:text-blue-400';
  if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-orange-600 dark:text-orange-400';
}
