/**
 * Google Vehicle Listings Compliance Validator
 * 
 * Ensures all dealer listings meet Google's strict requirements for appearing
 * in Google Search and Google Maps as Vehicle Listings.
 * 
 * Based on: The Mobility Hub (cararth.com) Google Listings Checklist
 */

interface VehicleListingData {
  // Vehicle Info
  vehicleType?: string; // car, suv, truck, etc.
  make: string;
  model: string;
  year: number;
  vin?: string; // Vehicle Identification Number (required for Google)
  
  // Condition
  titleStatus?: 'clean' | 'salvage' | 'flood' | 'accident' | 'rebuilt';
  mileage?: number; // Odometer reading (required for Google)
  
  // Pricing
  price: number;
  
  // Images
  images?: Array<{
    url: string;
    width?: number;
    height?: number;
  }>;
  
  // Verification
  rtoVerified?: boolean; // Verified against VAHAN/RTO database
  fuelType?: string;
  transmission?: string;
  
  // Availability
  availabilityStatus?: 'available' | 'sold' | 'pending' | 'coming_soon';
}

interface ComplianceResult {
  isCompliant: boolean;
  score: number; // 0-100, how well it meets Google standards
  issues: string[];
  warnings: string[];
  recommendations: string[];
  
  // Detailed breakdown
  vehicleTypeCompliant: boolean;
  titleCompliant: boolean;
  dataCompliant: boolean;
  imageCompliant: boolean;
  availabilityCompliant: boolean;
}

export class GoogleVehicleComplianceValidator {
  
  /**
   * MAIN VALIDATOR - Checks all Google Vehicle Listing requirements
   */
  static validate(listing: VehicleListingData): ComplianceResult {
    const issues: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];
    
    // 1. VEHICLE TYPE COMPLIANCE
    const vehicleTypeCheck = this.validateVehicleType(listing);
    if (!vehicleTypeCheck.valid) {
      issues.push(...vehicleTypeCheck.issues);
    }
    warnings.push(...vehicleTypeCheck.warnings);
    
    // 2. TITLE STATUS COMPLIANCE  
    const titleCheck = this.validateTitleStatus(listing);
    if (!titleCheck.valid) {
      issues.push(...titleCheck.issues);
    }
    
    // 3. DATA VERIFICATION COMPLIANCE
    const dataCheck = this.validateDataRequirements(listing);
    if (!dataCheck.valid) {
      issues.push(...dataCheck.issues);
    }
    warnings.push(...dataCheck.warnings);
    recommendations.push(...dataCheck.recommendations);
    
    // 4. IMAGE COMPLIANCE
    const imageCheck = this.validateImages(listing);
    if (!imageCheck.valid) {
      issues.push(...imageCheck.issues);
    }
    warnings.push(...imageCheck.warnings);
    recommendations.push(...imageCheck.recommendations);
    
    // 5. AVAILABILITY COMPLIANCE
    const availabilityCheck = this.validateAvailability(listing);
    if (!availabilityCheck.valid) {
      issues.push(...availabilityCheck.issues);
    }
    
    // Calculate compliance score (0-100)
    const score = this.calculateComplianceScore({
      vehicleType: vehicleTypeCheck.valid,
      title: titleCheck.valid,
      data: dataCheck.valid,
      image: imageCheck.valid,
      availability: availabilityCheck.valid,
    });
    
    const isCompliant = issues.length === 0;
    
    return {
      isCompliant,
      score,
      issues,
      warnings,
      recommendations,
      vehicleTypeCompliant: vehicleTypeCheck.valid,
      titleCompliant: titleCheck.valid,
      dataCompliant: dataCheck.valid,
      imageCompliant: imageCheck.valid,
      availabilityCompliant: availabilityCheck.valid,
    };
  }
  
  /**
   * RULE 1: Vehicle Type Validation
   * ✅ MUST be non-commercial, 4-wheeled passenger vehicle
   * ❌ NO commercial vehicles, two-wheelers, boats, planes
   */
  private static validateVehicleType(listing: VehicleListingData): {
    valid: boolean;
    issues: string[];
    warnings: string[];
  } {
    const issues: string[] = [];
    const warnings: string[] = [];
    
    // CRITICAL: Vehicle type is REQUIRED, no defaults allowed
    if (!listing.vehicleType || listing.vehicleType.trim() === '') {
      issues.push(`❌ GOOGLE REJECT: Vehicle type is REQUIRED. You must explicitly declare the type (car, suv, sedan, hatchback, pickup, van, etc.).`);
      return { valid: false, issues, warnings };
    }
    
    const vehicleType = listing.vehicleType.toLowerCase();
    
    // Blocked types (Google will reject)
    const blockedTypes = [
      'motorcycle', 'bike', 'scooter', 'two-wheeler',
      'bus', 'truck', 'commercial', 'fleet',
      'boat', 'plane', 'aircraft', 'tractor', 'farm'
    ];
    
    for (const blocked of blockedTypes) {
      if (vehicleType.includes(blocked) || listing.make.toLowerCase().includes(blocked)) {
        issues.push(`❌ GOOGLE REJECT: Vehicle type "${vehicleType}" is not allowed. Only non-commercial 4-wheeled passenger vehicles (cars, SUVs, pickups) are accepted.`);
        return { valid: false, issues, warnings };
      }
    }
    
    // Allowed types
    const allowedTypes = ['car', 'suv', 'sedan', 'hatchback', 'pickup', 'van', 'minivan', 'coupe', 'wagon'];
    const hasAllowedType = allowedTypes.some(type => vehicleType.includes(type));
    
    if (!hasAllowedType) {
      warnings.push(`⚠️ Vehicle type "${vehicleType}" is not explicitly recognized. Verify it's a passenger vehicle.`);
    }
    
    return { valid: true, issues, warnings };
  }
  
  /**
   * RULE 2: Title Status Validation
   * ✅ MUST have clean title
   * ❌ NO salvage, flood, or accident title defects
   */
  private static validateTitleStatus(listing: VehicleListingData): {
    valid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    
    // CRITICAL: Title status is REQUIRED, no defaults allowed
    if (!listing.titleStatus) {
      issues.push(`❌ GOOGLE REJECT: Title status is REQUIRED. You must explicitly declare the title status (clean, salvage, flood, accident, rebuilt).`);
      return { valid: false, issues };
    }
    
    const titleStatus = listing.titleStatus;
    
    if (titleStatus !== 'clean') {
      issues.push(`❌ GOOGLE REJECT: Title status is "${titleStatus}". Only vehicles with clean titles are accepted. No salvage, flood, or accident titles.`);
      return { valid: false, issues };
    }
    
    return { valid: true, issues };
  }
  
  /**
   * RULE 3: Data Requirements Validation
   * ✅ VIN (Vehicle Identification Number) REQUIRED
   * ✅ Odometer Reading (Mileage) REQUIRED  
   * ✅ RTO/VAHAN Verification REQUIRED
   * ✅ Price must be exact and match website
   */
  private static validateDataRequirements(listing: VehicleListingData): {
    valid: boolean;
    issues: string[];
    warnings: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];
    
    // VIN is REQUIRED for Google
    if (!listing.vin || listing.vin.trim() === '') {
      issues.push(`❌ GOOGLE REJECT: VIN (Vehicle Identification Number) is REQUIRED for all used cars.`);
    } else if (listing.vin.length < 17) {
      warnings.push(`⚠️ VIN "${listing.vin}" appears incomplete. Standard VINs are 17 characters.`);
    }
    
    // Odometer Reading is REQUIRED
    if (!listing.mileage || listing.mileage === 0) {
      issues.push(`❌ GOOGLE REJECT: Odometer Reading (Mileage) is REQUIRED for all used cars.`);
    }
    
    // RTO/VAHAN Verification STRONGLY RECOMMENDED
    if (!listing.rtoVerified) {
      warnings.push(`⚠️ RTO/VAHAN verification missing. Google recommends verifying Make, Model, Year, and Fuel Type against government database.`);
      recommendations.push(`📋 Use VAHAN API to verify all vehicle details before submission.`);
    }
    
    // Price validation
    if (!listing.price || listing.price <= 0) {
      issues.push(`❌ GOOGLE REJECT: Valid price is REQUIRED.`);
    }
    
    // Fuel Type & Transmission recommended
    if (!listing.fuelType) {
      warnings.push(`⚠️ Fuel Type missing. Recommended for better matching.`);
    }
    if (!listing.transmission) {
      warnings.push(`⚠️ Transmission type missing. Recommended for better matching.`);
    }
    
    const valid = issues.length === 0;
    return { valid, issues, warnings, recommendations };
  }
  
  /**
   * RULE 4: Image Requirements Validation
   * ✅ High quality (min 800x600 pixels)
   * ✅ Clear front-side angle (45°)
   * ✅ Entire car visible (75-90% of frame)
   * ❌ NO watermarks, logos, or text overlays
   * ❌ NO placeholder images
   * ❌ NO blurry, dark, or truncated photos
   */
  private static validateImages(listing: VehicleListingData): {
    valid: boolean;
    issues: string[];
    warnings: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];
    
    const images = listing.images || [];
    
    // At least 1 image REQUIRED
    if (images.length === 0) {
      issues.push(`❌ GOOGLE REJECT: At least one high-quality image is REQUIRED.`);
      return { valid: false, issues, warnings, recommendations };
    }
    
    // Check primary image quality
    const primaryImage = images[0];
    
    // Minimum resolution check
    if (primaryImage.width && primaryImage.height) {
      if (primaryImage.width < 800 || primaryImage.height < 600) {
        issues.push(`❌ GOOGLE REJECT: Main image resolution (${primaryImage.width}x${primaryImage.height}) is below minimum (800x600).`);
      }
    } else {
      warnings.push(`⚠️ Image resolution unknown. Google requires minimum 800x600 pixels.`);
      recommendations.push(`📋 Verify all images are at least 800x600 pixels before upload.`);
    }
    
    // Check for common rejection patterns in URL
    const url = primaryImage.url.toLowerCase();
    
    // Watermark detection (basic)
    if (url.includes('watermark') || url.includes('logo')) {
      issues.push(`❌ GOOGLE REJECT: Image URL suggests watermark/logo present. NO watermarks or logos allowed.`);
    }
    
    // Placeholder detection
    if (url.includes('placeholder') || url.includes('no-image') || url.includes('default')) {
      issues.push(`❌ GOOGLE REJECT: Placeholder images are not allowed. Use actual vehicle photos.`);
    }
    
    // Stock photo detection
    if (url.includes('stock') || url.includes('generic')) {
      warnings.push(`⚠️ Image URL suggests stock/generic photo. Google requires actual vehicle photos.`);
    }
    
    // Image quality recommendations
    recommendations.push(`📸 Use clear, well-lit photos with neutral background (white/grey).`);
    recommendations.push(`📸 Main image should show front-side angle (45°) with entire car visible.`);
    recommendations.push(`📸 Car should fill 75-90% of frame.`);
    recommendations.push(`📸 NO watermarks, text overlays, or promotional graphics.`);
    
    const valid = issues.length === 0;
    return { valid, issues, warnings, recommendations };
  }
  
  /**
   * RULE 5: Availability Validation
   * ✅ Must be immediately available for sale
   * ❌ NO "Coming Soon" or future listings
   * ❌ NO auction-only or subscription-only
   */
  private static validateAvailability(listing: VehicleListingData): {
    valid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    
    // CRITICAL: Availability status is REQUIRED, no defaults allowed
    if (!listing.availabilityStatus) {
      issues.push(`❌ GOOGLE REJECT: Availability status is REQUIRED. You must explicitly declare if the vehicle is available, sold, pending, or coming_soon.`);
      return { valid: false, issues };
    }
    
    const status = listing.availabilityStatus;
    
    if (status === 'coming_soon') {
      issues.push(`❌ GOOGLE REJECT: "Coming Soon" listings are not allowed. Vehicle must be immediately available.`);
    }
    
    if (status === 'sold') {
      issues.push(`❌ GOOGLE REJECT: Sold vehicles must be removed from feed within 6 hours.`);
    }
    
    const valid = status === 'available' || status === 'pending';
    return { valid, issues };
  }
  
  /**
   * Calculate overall compliance score (0-100)
   */
  private static calculateComplianceScore(checks: {
    vehicleType: boolean;
    title: boolean;
    data: boolean;
    image: boolean;
    availability: boolean;
  }): number {
    const weights = {
      vehicleType: 20,  // Critical
      title: 20,        // Critical
      data: 25,         // Most important (VIN, mileage, verification)
      image: 25,        // Most common rejection reason
      availability: 10, // Important but simple
    };
    
    let score = 0;
    if (checks.vehicleType) score += weights.vehicleType;
    if (checks.title) score += weights.title;
    if (checks.data) score += weights.data;
    if (checks.image) score += weights.image;
    if (checks.availability) score += weights.availability;
    
    return score;
  }
  
  /**
   * Get human-readable compliance status
   */
  static getComplianceLabel(score: number): string {
    if (score === 100) return '✅ Google Ready';
    if (score >= 80) return '⚠️ Minor Issues';
    if (score >= 60) return '🔶 Needs Attention';
    return '❌ Not Google Compliant';
  }
  
  /**
   * Get color for UI display
   */
  static getComplianceColor(score: number): 'green' | 'yellow' | 'orange' | 'red' {
    if (score === 100) return 'green';
    if (score >= 80) return 'yellow';
    if (score >= 60) return 'orange';
    return 'red';
  }
}
