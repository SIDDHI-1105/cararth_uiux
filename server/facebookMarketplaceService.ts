import axios from 'axios';
import type { SellerListing } from '@shared/schema';

export interface FacebookMarketplaceConfig {
  accessToken: string;
  appId: string;
  appSecret: string;
  pageId?: string; // Optional: For posting to a specific Facebook page
}

export interface MarketplaceListingData {
  name: string;
  description: string;
  price: string; // Facebook expects price as string with currency
  currency: string;
  category: string;
  condition: 'new' | 'used' | 'refurbished';
  availability: 'in stock' | 'out of stock';
  brand?: string;
  year?: number;
  mileage?: string;
  fuel_type?: string;
  transmission?: string;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  images: string[];
}

export class FacebookMarketplaceService {
  private config: FacebookMarketplaceConfig;
  private baseUrl = 'https://graph.facebook.com/v18.0';

  constructor(config: FacebookMarketplaceConfig) {
    this.config = config;
  }

  /**
   * Convert Cararth car listing to Facebook Marketplace format
   */
  private formatCarListing(listing: SellerListing): MarketplaceListingData {
    const priceInRupees = parseFloat(listing.price) * 100000; // Convert lakhs to rupees
    
    return {
      name: `${listing.year} ${listing.brand} ${listing.model}`,
      description: this.generateMarketplaceDescription(listing),
      price: priceInRupees.toString(),
      currency: 'INR',
      category: 'VEHICLES', // Facebook's vehicle category
      condition: 'used',
      availability: 'in stock',
      brand: listing.brand,
      year: listing.year,
      mileage: listing.mileage ? `${listing.mileage} km` : undefined,
      fuel_type: listing.fuelType || undefined,
      transmission: listing.transmission || undefined,
      location: listing.city ? {
        latitude: 0, // Would need geocoding service for real coordinates
        longitude: 0,
        address: `${listing.city}, India`
      } : undefined,
      images: this.extractImageUrls(listing)
    };
  }

  /**
   * Generate compelling description for Facebook Marketplace
   */
  private generateMarketplaceDescription(listing: SellerListing): string {
    const parts = [
      `${listing.year} ${listing.brand} ${listing.model} available for sale`,
      listing.mileage ? `${listing.mileage.toLocaleString()} km driven` : null,
      listing.fuelType ? `${listing.fuelType} engine` : null,
      listing.transmission ? `${listing.transmission} transmission` : null,
      listing.owners ? `${listing.owners === 1 ? 'Single owner' : `${listing.owners} owners`}` : null,
      listing.city ? `Located in ${listing.city}` : null,
      '',
      'Listed via Cararth - India\'s trusted used car platform',
      '✅ Authentic verification process',
      '📋 All documents verified',
      '📞 Direct seller contact'
    ].filter(Boolean);

    return parts.join('\n');
  }

  /**
   * Extract and validate image URLs for Facebook posting
   */
  private extractImageUrls(listing: SellerListing): string[] {
    const images: string[] = [];
    
    if (listing.frontPhoto) images.push(listing.frontPhoto);
    if (listing.rearPhoto) images.push(listing.rearPhoto);
    if (listing.leftSidePhoto) images.push(listing.leftSidePhoto);
    if (listing.rightSidePhoto) images.push(listing.rightSidePhoto);
    if (listing.interiorPhoto) images.push(listing.interiorPhoto);

    // Filter out invalid URLs and return up to 10 images (Facebook limit)
    return images
      .filter(url => url && url.startsWith('http'))
      .slice(0, 10);
  }

  /**
   * Post car listing to Facebook Marketplace using Graph API
   */
  async postToMarketplace(listing: SellerListing): Promise<{
    success: boolean;
    listingId?: string;
    error?: string;
  }> {
    try {
      const marketplaceData = this.formatCarListing(listing);
      
      // First, upload images to Facebook
      const imageIds = await this.uploadImages(marketplaceData.images);
      
      // Create the marketplace listing
      const endpoint = this.config.pageId 
        ? `/${this.config.pageId}/marketplace_listings`
        : '/me/marketplace_listings';

      const response = await axios.post(`${this.baseUrl}${endpoint}`, {
        ...marketplaceData,
        attached_media: imageIds.map(id => ({ media_fbid: id })),
        access_token: this.config.accessToken
      });

      console.log('✅ Facebook Marketplace posting successful:', {
        listingId: listing.id,
        facebookId: response.data.id
      });

      return {
        success: true,
        listingId: response.data.id
      };

    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      
      console.error('❌ Facebook Marketplace posting failed:', {
        listingId: listing.id,
        error: errorMessage,
        status: error.response?.status
      });

      return {
        success: false,
        error: `Facebook posting failed: ${errorMessage}`
      };
    }
  }

  /**
   * Upload images to Facebook and return media IDs
   */
  private async uploadImages(imageUrls: string[]): Promise<string[]> {
    const uploadPromises = imageUrls.map(async (url) => {
      try {
        // Download image first
        const imageResponse = await axios.get(url, { responseType: 'stream' });
        
        // Upload to Facebook
        const uploadResponse = await axios.post(
          `${this.baseUrl}/${this.config.pageId || 'me'}/photos`,
          {
            url: url, // Facebook can directly use image URLs
            published: false, // Don't publish as post, just get media ID
            access_token: this.config.accessToken
          }
        );

        return uploadResponse.data.id;
      } catch (error) {
        console.error('❌ Image upload to Facebook failed:', { url, error });
        return null;
      }
    });

    const results = await Promise.all(uploadPromises);
    return results.filter((id): id is string => id !== null);
  }

  /**
   * Update existing Facebook Marketplace listing
   */
  async updateMarketplaceListing(facebookListingId: string, listing: SellerListing): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const marketplaceData = this.formatCarListing(listing);
      
      await axios.post(`${this.baseUrl}/${facebookListingId}`, {
        ...marketplaceData,
        access_token: this.config.accessToken
      });

      console.log('✅ Facebook Marketplace listing updated:', {
        facebookListingId,
        listingId: listing.id
      });

      return { success: true };

    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      
      console.error('❌ Facebook Marketplace update failed:', {
        facebookListingId,
        listingId: listing.id,
        error: errorMessage
      });

      return {
        success: false,
        error: `Facebook update failed: ${errorMessage}`
      };
    }
  }

  /**
   * Mark Facebook Marketplace listing as sold
   */
  async markAsSold(facebookListingId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      await axios.post(`${this.baseUrl}/${facebookListingId}`, {
        availability: 'out of stock',
        access_token: this.config.accessToken
      });

      console.log('✅ Facebook Marketplace listing marked as sold:', {
        facebookListingId
      });

      return { success: true };

    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      
      console.error('❌ Facebook Marketplace mark-as-sold failed:', {
        facebookListingId,
        error: errorMessage
      });

      return {
        success: false,
        error: `Failed to mark as sold: ${errorMessage}`
      };
    }
  }

  /**
   * Validate Facebook API credentials
   */
  async validateCredentials(): Promise<{
    valid: boolean;
    error?: string;
    permissions?: string[];
  }> {
    try {
      const response = await axios.get(`${this.baseUrl}/me`, {
        params: {
          fields: 'id,name',
          access_token: this.config.accessToken
        }
      });

      // Check permissions
      const permissionsResponse = await axios.get(`${this.baseUrl}/me/permissions`, {
        params: {
          access_token: this.config.accessToken
        }
      });

      const permissions = permissionsResponse.data.data
        .filter((perm: any) => perm.status === 'granted')
        .map((perm: any) => perm.permission);

      console.log('✅ Facebook API credentials validated:', {
        userId: response.data.id,
        userName: response.data.name,
        permissions
      });

      return {
        valid: true,
        permissions
      };

    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      
      console.error('❌ Facebook API credential validation failed:', {
        error: errorMessage
      });

      return {
        valid: false,
        error: errorMessage
      };
    }
  }
}