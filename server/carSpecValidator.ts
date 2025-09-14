/**
 * Car Specification Validator
 * Filters out impossible car combinations like "Alto in Diesel"
 */

interface CarSpecification {
  brand: string;
  model: string;
  allowedFuelTypes: string[];
  allowedTransmissions: string[];
  yearRange: { min: number; max: number };
  maxMileageByYear?: { [year: number]: number };
}

interface ValidationResult {
  isValid: boolean;
  issues: string[];
  confidence: 'high' | 'medium' | 'low';
}

class CarSpecValidator {
  private specDatabase: CarSpecification[] = [
    // Maruti Suzuki
    {
      brand: 'Maruti',
      model: 'Alto',
      allowedFuelTypes: ['Petrol', 'CNG'],
      allowedTransmissions: ['Manual'],
      yearRange: { min: 2000, max: new Date().getFullYear() }
    },
    {
      brand: 'Maruti',
      model: 'Swift',
      allowedFuelTypes: ['Petrol', 'Diesel', 'CNG'],
      allowedTransmissions: ['Manual', 'Automatic'],
      yearRange: { min: 2005, max: new Date().getFullYear() }
    },
    {
      brand: 'Maruti',
      model: 'Dzire',
      allowedFuelTypes: ['Petrol', 'Diesel', 'CNG'],
      allowedTransmissions: ['Manual', 'Automatic'],
      yearRange: { min: 2008, max: new Date().getFullYear() }
    },
    {
      brand: 'Maruti',
      model: 'Baleno',
      allowedFuelTypes: ['Petrol', 'CNG'],
      allowedTransmissions: ['Manual', 'Automatic'],
      yearRange: { min: 2015, max: new Date().getFullYear() }
    },
    {
      brand: 'Maruti',
      model: 'Vitara Brezza',
      allowedFuelTypes: ['Petrol', 'Diesel', 'CNG'],
      allowedTransmissions: ['Manual', 'Automatic'],
      yearRange: { min: 2016, max: new Date().getFullYear() }
    },
    // Hyundai
    {
      brand: 'Hyundai',
      model: 'i20',
      allowedFuelTypes: ['Petrol', 'Diesel', 'CNG'],
      allowedTransmissions: ['Manual', 'Automatic'],
      yearRange: { min: 2008, max: new Date().getFullYear() }
    },
    {
      brand: 'Hyundai',
      model: 'i10',
      allowedFuelTypes: ['Petrol', 'CNG'],
      allowedTransmissions: ['Manual', 'Automatic'],
      yearRange: { min: 2007, max: new Date().getFullYear() }
    },
    {
      brand: 'Hyundai',
      model: 'Creta',
      allowedFuelTypes: ['Petrol', 'Diesel'],
      allowedTransmissions: ['Manual', 'Automatic'],
      yearRange: { min: 2015, max: new Date().getFullYear() }
    },
    {
      brand: 'Hyundai',
      model: 'Verna',
      allowedFuelTypes: ['Petrol', 'Diesel'],
      allowedTransmissions: ['Manual', 'Automatic'],
      yearRange: { min: 2006, max: new Date().getFullYear() }
    },
    // Tata
    {
      brand: 'Tata',
      model: 'Nexon',
      allowedFuelTypes: ['Petrol', 'Diesel', 'Electric'],
      allowedTransmissions: ['Manual', 'Automatic'],
      yearRange: { min: 2017, max: new Date().getFullYear() }
    },
    {
      brand: 'Tata',
      model: 'Tiago',
      allowedFuelTypes: ['Petrol', 'CNG'],
      allowedTransmissions: ['Manual', 'Automatic'],
      yearRange: { min: 2016, max: new Date().getFullYear() }
    },
    {
      brand: 'Tata',
      model: 'Altroz',
      allowedFuelTypes: ['Petrol', 'Diesel'],
      allowedTransmissions: ['Manual'],
      yearRange: { min: 2020, max: new Date().getFullYear() }
    },
    // Honda
    {
      brand: 'Honda',
      model: 'City',
      allowedFuelTypes: ['Petrol', 'Diesel'],
      allowedTransmissions: ['Manual', 'Automatic'],
      yearRange: { min: 1998, max: new Date().getFullYear() }
    },
    {
      brand: 'Honda',
      model: 'Amaze',
      allowedFuelTypes: ['Petrol', 'Diesel'],
      allowedTransmissions: ['Manual', 'Automatic'],
      yearRange: { min: 2013, max: new Date().getFullYear() }
    },
    {
      brand: 'Honda',
      model: 'Jazz',
      allowedFuelTypes: ['Petrol', 'Diesel'],
      allowedTransmissions: ['Manual', 'Automatic'],
      yearRange: { min: 2009, max: new Date().getFullYear() }
    },
    // Kia
    {
      brand: 'Kia',
      model: 'Seltos',
      allowedFuelTypes: ['Petrol', 'Diesel'],
      allowedTransmissions: ['Manual', 'Automatic'],
      yearRange: { min: 2019, max: new Date().getFullYear() }
    },
    {
      brand: 'Kia',
      model: 'Sonet',
      allowedFuelTypes: ['Petrol', 'Diesel'],
      allowedTransmissions: ['Manual', 'Automatic'],
      yearRange: { min: 2020, max: new Date().getFullYear() }
    }
  ];

  /**
   * Validate a car listing against known specifications
   */
  validateListing(listing: {
    brand?: string;
    model?: string;
    fuelType?: string;
    transmission?: string;
    year?: number;
    price?: number;
    mileage?: number;
  }): ValidationResult {
    const issues: string[] = [];
    let confidence: 'high' | 'medium' | 'low' = 'high';

    // Normalize inputs
    const brand = this.normalizeString(listing.brand);
    const model = this.normalizeString(listing.model);
    const fuelType = this.normalizeString(listing.fuelType);
    const transmission = this.normalizeString(listing.transmission);
    const year = listing.year;
    const price = listing.price;
    const mileage = listing.mileage;

    // Find specification for this car
    const spec = this.findSpecification(brand, model);
    
    if (!spec) {
      // Unknown car model - allow but reduce confidence
      confidence = 'low';
      return { isValid: true, issues: [`Unknown model: ${brand} ${model}`], confidence };
    }

    // Validate fuel type
    if (fuelType && !spec.allowedFuelTypes.some(allowed => 
      this.normalizeString(allowed) === fuelType)) {
      issues.push(`${brand} ${model} never came with ${listing.fuelType} fuel`);
    }

    // Validate transmission
    if (transmission && !spec.allowedTransmissions.some(allowed => 
      this.normalizeString(allowed) === transmission)) {
      issues.push(`${brand} ${model} never came with ${listing.transmission} transmission`);
    }

    // Validate year range
    if (year && (year < spec.yearRange.min || year > spec.yearRange.max)) {
      issues.push(`${brand} ${model} was not available in ${year}`);
    }

    // Basic sanity checks
    if (year && year > new Date().getFullYear()) {
      issues.push(`Future year: ${year}`);
    }

    if (price && price < 10000) {
      issues.push(`Suspiciously low price: ₹${price}`);
    }

    if (price && price > 50000000) {
      issues.push(`Suspiciously high price: ₹${price}`);
    }

    if (mileage && mileage > 500000) {
      issues.push(`Suspiciously high mileage: ${mileage} km`);
    }

    // Mileage vs year sanity check
    if (year && mileage && year > 2020 && mileage > 100000) {
      issues.push(`High mileage for recent car: ${mileage} km for ${year}`);
    }

    return {
      isValid: issues.length === 0,
      issues,
      confidence: issues.length > 0 ? 'low' : confidence
    };
  }

  /**
   * Calculate quality score based on validation and source
   */
  calculateQualityScore(listing: any, source: string): number {
    const validation = this.validateListing(listing);
    
    // Base source weights
    const sourceWeights: { [key: string]: number } = {
      'CarDekho': 100,
      'CarWale': 90,
      'Spinny': 85,
      'Cars24': 65,
      'OLX': 50,
      'Facebook Marketplace': 30,
      'Unknown': 20
    };

    let score = sourceWeights[source] || 20;

    // Apply validation penalties
    if (!validation.isValid) {
      score -= validation.issues.length * 20; // Heavy penalty for invalid specs
    }

    if (validation.confidence === 'low') {
      score -= 15;
    } else if (validation.confidence === 'medium') {
      score -= 5;
    }

    // Image authenticity bonus
    if (listing.images && listing.images.length > 0) {
      const hasAuthenticImage = listing.images.some((img: string) => 
        img.includes('gaadi.com') || 
        img.includes('cardekho.com') || 
        img.includes('carwale.com') ||
        img.includes('spinny.com')
      );
      
      if (hasAuthenticImage) {
        score += 20;
      } else if (listing.images.some((img: string) => img.includes('generated_images'))) {
        score -= 30; // Heavy penalty for placeholder images
      }
    }

    // Completeness bonus
    const fields = ['title', 'price', 'year', 'mileage', 'fuelType', 'transmission'];
    const completeness = fields.filter(field => listing[field]).length / fields.length;
    score += completeness * 10;

    // Recency bonus
    if (listing.listingDate) {
      const daysSincePosted = (Date.now() - new Date(listing.listingDate).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSincePosted < 7) score += 10;
      else if (daysSincePosted < 30) score += 5;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Check if listing has authentic images
   */
  hasAuthenticImages(listing: any): boolean {
    if (!listing.images || listing.images.length === 0) return false;
    
    const authenticDomains = [
      'gaadi.com',
      'cardekho.com', 
      'carwale.com',
      'spinny.com',
      'cars24.com'
    ];

    return listing.images.some((img: string) => 
      authenticDomains.some(domain => img.includes(domain))
    );
  }

  private normalizeString(str?: string): string {
    if (!str) return '';
    return str.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  }

  private findSpecification(brand: string, model: string): CarSpecification | null {
    return this.specDatabase.find(spec => 
      this.normalizeString(spec.brand) === brand && 
      this.normalizeString(spec.model) === model
    ) || null;
  }

  /**
   * Get all issues for a batch of listings
   */
  validateBatch(listings: any[]): { valid: any[]; invalid: any[]; issues: { [id: string]: string[] } } {
    const valid: any[] = [];
    const invalid: any[] = [];
    const issues: { [id: string]: string[] } = {};

    for (const listing of listings) {
      const validation = this.validateListing(listing);
      
      if (validation.isValid) {
        valid.push(listing);
      } else {
        invalid.push(listing);
        issues[listing.id || listing.title] = validation.issues;
      }
    }

    return { valid, invalid, issues };
  }
}

export default new CarSpecValidator();