import axios from 'axios';
import type { SellerListing } from '@shared/schema';

export interface FacebookMarketplaceConfig {
  accessToken: string; // Page Access Token (required for marketplace posting)
  appId: string;
  appSecret: string;
  pageId?: string; // Facebook Business Page ID for marketplace posting
  businessId?: string; // Optional: Facebook Business Manager ID
  enabled?: boolean; // Feature flag for marketplace posting
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
  private requiredPermissions = ['marketplace_management', 'pages_manage_posts'];

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
   * Auto-setup Facebook integration with current token
   */
  async autoSetup(): Promise<{
    success: boolean;
    tokenType?: string;
    pages?: Array<{ id: string; name: string }>;
    permissions?: string[];
    error?: string;
  }> {
    try {
      console.log('🔧 Auto-setting up Facebook integration...');
      
      // Test current token and get info
      const tokenInfo = await this.validateCredentials();
      if (!tokenInfo.valid) {
        return { success: false, error: tokenInfo.error };
      }

      // Try to get pages if it's a user token
      let pages: Array<{ id: string; name: string }> = [];
      try {
        const pagesResponse = await axios.get(`${this.baseUrl}/me/accounts?fields=id,name,access_token`, {
          headers: { Authorization: `Bearer ${this.config.accessToken}` }
        });
        
        if (pagesResponse.data.data && pagesResponse.data.data.length > 0) {
          pages = pagesResponse.data.data.map((page: any) => ({
            id: page.id,
            name: page.name
          }));
          
          // Auto-set the first page as default
          if (pages.length > 0 && !this.config.pageId) {
            this.config.pageId = pages[0].id;
            console.log(`📄 Auto-selected page: ${pages[0].name} (${pages[0].id})`);
          }
        }
      } catch (pageError) {
        console.log('📝 Could not fetch pages (might be app token)');
      }

      return {
        success: true,
        tokenType: tokenInfo.tokenType,
        pages,
        permissions: tokenInfo.scopes || []
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
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
      
      // Check if marketplace posting is enabled
      if (this.config.enabled === false) {
        console.log('📋 Facebook Marketplace posting is disabled (dry run mode)');
        return {
          success: true,
          listingId: `dry_run_${listing.id}`,
        };
      }

      // Validate page ID for marketplace posting
      if (!this.config.pageId) {
        throw new Error('Page ID is required for Facebook Marketplace posting. Please set FACEBOOK_PAGE_ID environment variable.');
      }
      
      // First upload photos unpublished, then create a feed post with attached media
      const photoIds = await this.uploadPhotosUnpublished(marketplaceData.images);
      
      // Create feed post with marketplace-style description and attached photos
      const endpoint = `/${this.config.pageId}/feed`;

      // Create feed post with proper Facebook format
      const postData = {
        message: `${marketplaceData.name}\n\n${marketplaceData.description}\n\nPrice: ₹${parseInt(marketplaceData.price).toLocaleString()}\n\nContact via Cararth for verified details.`,
        attached_media: photoIds.map(id => ({ media_fbid: id })),
        access_token: this.config.accessToken
      };

      const response = await axios.post(`${this.baseUrl}${endpoint}`, postData);

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
   * Upload photos unpublished for use in feed posts
   */
  private async uploadPhotosUnpublished(imageUrls: string[]): Promise<string[]> {
    if (!this.config.pageId) {
      console.warn('⚠️ No page ID configured for photo upload');
      return [];
    }

    const uploadPromises = imageUrls.map(async (url) => {
      try {
        // Upload photo unpublished to the page
        const uploadResponse = await axios.post(`${this.baseUrl}/${this.config.pageId}/photos`, {
          url: url,
          published: false, // Key: upload unpublished for later use in feed
          access_token: this.config.accessToken
        });

        console.log(`✅ Photo uploaded unpublished: ${url}`);
        return uploadResponse.data.id;
      } catch (error: any) {
        console.error('❌ Photo upload to Facebook failed:', { url, error: error.response?.data || error.message });
        return null;
      }
    });

    const results = await Promise.all(uploadPromises);
    return results.filter((id): id is string => id !== null);
  }

  /**
   * Upload images to Facebook and return media IDs (legacy method)
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
   * Validate Facebook Access Token using debug_token endpoint
   */
  async validateCredentials(): Promise<{
    valid: boolean;
    error?: string;
    tokenType?: string;
    scopes?: string[];
    pageInfo?: any;
    hasMarketplaceAccess?: boolean;
  }> {
    try {
      // Use debug_token endpoint to validate token properly
      const debugTokenResponse = await axios.get(`${this.baseUrl}/debug_token`, {
        params: {
          input_token: this.config.accessToken,
          access_token: `${this.config.appId}|${this.config.appSecret}`
        }
      });

      const tokenData = debugTokenResponse.data.data;
      
      // Check if token is valid and not expired
      if (!tokenData.is_valid) {
        return {
          valid: false,
          error: 'Access token is invalid or expired'
        };
      }

      // Check token type (should be PAGE for marketplace posting)
      const tokenType = tokenData.type;
      const scopes = tokenData.scopes || [];
      
      console.log('🔍 Facebook token analysis:', {
        type: tokenType,
        scopes: scopes,
        appId: tokenData.app_id,
        userId: tokenData.user_id,
        expiresAt: tokenData.expires_at
      });

      // Enforce PAGE token requirement for marketplace posting
      if (tokenType !== 'PAGE') {
        return {
          valid: false,
          error: `Invalid token type: ${tokenType}. PAGE token required for marketplace posting.`,
          tokenType,
          hasMarketplaceAccess: false
        };
      }

      // Verify required permissions
      const hasMarketplacePermission = scopes.includes('marketplace_management') || scopes.includes('pages_manage_posts');
      
      if (!hasMarketplacePermission) {
        return {
          valid: false,
          error: 'Missing required permissions: marketplace_management or pages_manage_posts',
          tokenType,
          scopes,
          hasMarketplaceAccess: false
        };
      }

      let pageInfo = null;
      if (this.config.pageId) {
        try {
          // Verify page access with PAGE token
          const pageResponse = await axios.get(`${this.baseUrl}/${this.config.pageId}`, {
            params: {
              fields: 'id,name,category,is_verified',
              access_token: this.config.accessToken
            }
          });
          pageInfo = pageResponse.data;
        } catch (pageError: any) {
          return {
            valid: false,
            error: `Cannot access page ${this.config.pageId}: ${pageError.response?.data?.error?.message}`,
            tokenType,
            hasMarketplaceAccess: false
          };
        }
      }

      console.log('✅ Facebook credentials validated:', {
        tokenType,
        hasMarketplacePermission,
        pageInfo: pageInfo?.name || 'No page configured'
      });

      return {
        valid: true,
        tokenType,
        scopes,
        pageInfo,
        hasMarketplaceAccess: hasMarketplacePermission
      };

    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      const errorCode = error.response?.data?.error?.code;
      
      console.error('❌ Facebook Business Page validation failed:', {
        error: errorMessage,
        code: errorCode,
        pageId: this.config.pageId
      });

      return {
        valid: false,
        error: `Facebook validation failed: ${errorMessage}`,
        hasMarketplaceAccess: false
      };
    }
  }

  /**
   * Get detailed setup instructions for Facebook Marketplace integration
   */
  getSetupInstructions(): {
    requirements: string[];
    steps: string[];
    troubleshooting: string[];
  } {
    return {
      requirements: [
        'Facebook Business Manager account',
        'Verified Facebook Business Page',
        'Page Access Token with marketplace_management permission',
        'Business verification completed (required for Marketplace API)'
      ],
      steps: [
        '1. Create Facebook Business Manager account at business.facebook.com',
        '2. Create or claim a Facebook Business Page',
        '3. Go to developers.facebook.com and add Marketplace API product to your app',
        '4. Request marketplace_management and pages_manage_posts permissions',
        '5. Submit for business verification with required documents',
        '6. Generate Page Access Token (not User Access Token)',
        '7. Add FACEBOOK_PAGE_ID environment variable with your Business Page ID'
      ],
      troubleshooting: [
        'Error 2500: Use Page Access Token instead of User Access Token',
        'Error 100: Missing marketplace_management permission',
        'Error 190: Token expired or invalid - generate new Page Access Token',
        'Error 200: Business not verified - complete Facebook Business verification'
      ]
    };
  }
}