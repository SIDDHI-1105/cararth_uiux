/**
 * Google Vehicle Listings Feed Generator
 * 
 * Generates XML/RSS feed for Google Merchant Center in Google's Vehicle Listings format
 * 
 * Based on Google's Vehicle Ads specification:
 * https://support.google.com/google-ads/answer/6053288
 */

import { storage } from './storage';
import { GoogleVehicleComplianceValidator } from './googleVehicleCompliance';

interface VehicleListing {
  id: string;
  vin?: string;
  year: number;
  make: string;
  model: string;
  price: number;
  mileage?: number;
  fuelType?: string;
  transmission?: string;
  title: string;
  description?: string;
  images?: string[];
  city?: string;
  state?: string;
  url: string;
  condition?: string;
  googleComplianceScore?: number;
  listingSource?: string;
  sellerType?: string;
}

export class GoogleVehicleFeedGenerator {
  private baseUrl: string;

  constructor() {
    // Use Replit domain or custom domain if configured
    const replitDomain = process.env.REPL_SLUG && process.env.REPL_OWNER
      ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
      : 'https://www.cararth.com';
    
    this.baseUrl = process.env.SITE_URL || replitDomain;
  }

  /**
   * Generate complete Google Vehicle Listings feed in XML format
   */
  async generateFeed(): Promise<string> {
    console.log('📋 Generating Google Vehicle Listings feed...');
    
    // Fetch all dealer listings that are Google-compliant
    const compliantListings = await this.getCompliantListings();
    
    console.log(`✅ Found ${compliantListings.length} Google-compliant listings for feed`);

    // Generate RSS 2.0 feed with Google Vehicle extensions
    const feedXml = this.generateRSSFeed(compliantListings);
    
    return feedXml;
  }

  /**
   * Fetch only Google-compliant dealer listings from database
   */
  private async getCompliantListings(): Promise<VehicleListing[]> {
    try {
      // Fetch all listings (no filter to get everything)
      const allListings = await storage.getCars();

      // Filter to only include dealer listings with perfect Google compliance
      const compliantListings = allListings.filter((listing: any) => {
        // Must be from exclusive dealer source
        const isDealerListing = listing.listingSource === 'exclusive_dealer';
        
        // Must have Google compliance score of 100 (fully compliant)
        const isCompliant = listing.googleComplianceScore >= 100;
        
        // Must have required fields for Google feed
        const hasRequiredFields = listing.vin && 
                                 listing.mileage && 
                                 listing.price &&
                                 listing.images && 
                                 listing.images.length > 0;
        
        return isDealerListing && isCompliant && hasRequiredFields;
      });

      return compliantListings.map((listing: any) => ({
        id: listing.id,
        vin: listing.vin,
        year: listing.year,
        make: listing.brand || listing.make,
        model: listing.model,
        price: parseFloat(listing.price),
        mileage: listing.mileage,
        fuelType: listing.fuelType,
        transmission: listing.transmission,
        title: listing.title || `${listing.year} ${listing.brand || listing.make} ${listing.model}`,
        description: listing.description,
        images: listing.images,
        city: listing.city,
        state: listing.state,
        url: `${this.baseUrl}/listing/${listing.id}`,
        condition: listing.condition || 'used',
        googleComplianceScore: listing.googleComplianceScore,
        listingSource: listing.listingSource,
        sellerType: listing.sellerType,
      }));
    } catch (error) {
      console.error('❌ Error fetching compliant listings:', error);
      return [];
    }
  }

  /**
   * Generate RSS 2.0 feed with Google Vehicle Listings extensions
   */
  private generateRSSFeed(listings: VehicleListing[]): string {
    const now = new Date().toUTCString();
    
    // Escape XML special characters
    const escapeXml = (str: string | undefined): string => {
      if (!str) return '';
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };

    // Format price in INR
    const formatPrice = (price: number): string => {
      return `${price.toFixed(2)} INR`;
    };

    // Generate vehicle items
    const vehicleItems = listings.map(listing => {
      const imageUrls = listing.images?.slice(0, 10) || []; // Google allows up to 10 images
      
      // CRITICAL: Only ONE <g:image_link> for primary image, rest use <g:additional_image_link>
      const primaryImage = imageUrls.length > 0 
        ? `      <g:image_link>${escapeXml(imageUrls[0])}</g:image_link>` 
        : '';
      
      const additionalImages = imageUrls.slice(1).map(url => 
        `      <g:additional_image_link>${escapeXml(url)}</g:additional_image_link>`
      ).join('\n');

      return `    <item>
      <g:id>${escapeXml(listing.id)}</g:id>
      <g:title>${escapeXml(listing.title)}</g:title>
      <g:description>${escapeXml(listing.description || listing.title)}</g:description>
      <g:link>${escapeXml(listing.url)}</g:link>
${primaryImage}
${additionalImages}
      <g:condition>used</g:condition>
      <g:availability>in stock</g:availability>
      <g:price>${formatPrice(listing.price)}</g:price>
      <g:brand>${escapeXml(listing.make)}</g:brand>
      <g:vehicle_year>${listing.year}</g:vehicle_year>
      <g:vehicle_make>${escapeXml(listing.make)}</g:vehicle_make>
      <g:vehicle_model>${escapeXml(listing.model)}</g:vehicle_model>
      <g:vin>${escapeXml(listing.vin || '')}</g:vin>
      <g:vehicle_mileage unit="km">${listing.mileage || 0}</g:vehicle_mileage>
      <g:vehicle_fuel_type>${escapeXml(listing.fuelType || 'petrol')}</g:vehicle_fuel_type>
      <g:vehicle_transmission>${escapeXml(listing.transmission || 'manual')}</g:vehicle_transmission>
      <g:address>
        <g:country>IN</g:country>
        <g:region>${escapeXml(listing.state || 'Telangana')}</g:region>
        <g:locality>${escapeXml(listing.city || 'Hyderabad')}</g:locality>
        <g:postal_code>${escapeXml((listing as any).postalCode || '500001')}</g:postal_code>
      </g:address>
    </item>`;
    }).join('\n');

    // Complete RSS feed
    const feedXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:g="http://base.google.com/ns/1.0"
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>CarArth - Google Vehicle Listings Feed</title>
    <link>${this.baseUrl}</link>
    <description>India's comprehensive used car marketplace - Google-compliant dealer inventory</description>
    <language>en-IN</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${this.baseUrl}/api/google-vehicle-feed.xml" rel="self" type="application/rss+xml" />
${vehicleItems}
  </channel>
</rss>`;

    return feedXml;
  }

  /**
   * Generate statistics about the feed
   */
  async getFeedStats(): Promise<{
    totalListings: number;
    compliantListings: number;
    complianceRate: number;
    lastGenerated: Date;
  }> {
    const allListings = await storage.getCars();

    const allDealerListings = allListings.filter((listing: any) => 
      listing.listingSource === 'exclusive_dealer'
    );

    const compliantListings = allDealerListings.filter((listing: any) => 
      listing.googleComplianceScore >= 100 &&
      listing.vin &&
      listing.mileage
    );

    return {
      totalListings: allDealerListings.length,
      compliantListings: compliantListings.length,
      complianceRate: allDealerListings.length > 0 
        ? (compliantListings.length / allDealerListings.length) * 100 
        : 0,
      lastGenerated: new Date(),
    };
  }
}

// Export singleton instance
export const googleVehicleFeed = new GoogleVehicleFeedGenerator();
