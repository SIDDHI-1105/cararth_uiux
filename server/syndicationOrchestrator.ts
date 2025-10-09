import type { IStorage } from './storage';
import type { SellerListing, InsertSyndicationExecutionLog, InsertExternalApiAuditLog } from '../shared/schema';

/**
 * Platform-specific listing format
 */
interface PlatformListing {
  platform: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  contactInfo: {
    name?: string;
    phone?: string;
    email?: string;
  };
  vehicleDetails: {
    make: string;
    model: string;
    year: number;
    mileage: number;
    fuelType?: string;
    transmission?: string;
    bodyType?: string;
    color?: string;
  };
  location: {
    city: string;
    area?: string;
  };
}

/**
 * Syndication result for a single platform
 */
interface SyndicationResult {
  platform: string;
  success: boolean;
  platformListingId?: string;
  platformUrl?: string;
  error?: string;
  cost?: number;
  retryCount?: number;
}

/**
 * SyndicationOrchestrator - Distributes seller listings across multiple platforms
 * 
 * Workflow:
 * 1. Converts CarArth listing to platform-specific formats
 * 2. Posts to OLX (via Partner API), Quikr (via API), Facebook (via Graph API)
 * 3. Handles retries and error logging
 * 4. Saves execution logs to database
 */
export class SyndicationOrchestrator {
  private storage: IStorage;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 2000;

  // API credentials from environment
  private readonly OLX_CLIENT_ID = process.env.OLX_CLIENT_ID;
  private readonly OLX_CLIENT_SECRET = process.env.OLX_CLIENT_SECRET;
  private readonly QUIKR_APP_ID = process.env.QUIKR_APP_ID;
  private readonly QUIKR_TOKEN_ID = process.env.QUIKR_TOKEN_ID;
  private readonly QUIKR_SIGNATURE = process.env.QUIKR_SIGNATURE;
  private readonly FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;
  private readonly FACEBOOK_CATALOG_ID = process.env.FACEBOOK_CATALOG_ID;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  /**
   * Syndicate a seller listing to all consented platforms
   */
  async syndicateListing(
    listing: SellerListing,
    consentedPlatforms: string[]
  ): Promise<SyndicationResult[]> {
    const results: SyndicationResult[] = [];

    console.log(`🚀 Starting syndication for listing ${listing.id} to platforms: ${consentedPlatforms.join(', ')}`);

    // Check deduplication results first
    const deduplicationResults = await this.storage.getDeduplicationResults(listing.id);
    
    for (const platform of consentedPlatforms) {
      // Skip platform if duplicate detected
      const platformDedup = deduplicationResults.find(d => d.platform === platform);
      if (platformDedup?.skipSyndication) {
        console.log(`⏭️ Skipping ${platform}: ${platformDedup.skipReason}`);
        results.push({
          platform,
          success: false,
          error: `Skipped: ${platformDedup.skipReason}`
        });
        continue;
      }

      // Syndicate to platform with retry logic
      const result = await this.syndicateToplatform(listing, platform);
      results.push(result);

      // Save execution log
      await this.saveExecutionLog(listing, result);
    }

    console.log(`✅ Syndication complete for listing ${listing.id}`);
    return results;
  }

  /**
   * Syndicate to a single platform with retry logic
   */
  private async syndicateToplatform(
    listing: SellerListing,
    platform: string,
    attempt: number = 1
  ): Promise<SyndicationResult> {
    try {
      console.log(`📤 Syndicating to ${platform} (attempt ${attempt}/${this.MAX_RETRIES})`);

      let result: SyndicationResult;
      switch (platform.toLowerCase()) {
        case 'olx':
          result = await this.postToOLX(listing, attempt);
          break;
        case 'quikr':
          result = await this.postToQuikr(listing, attempt);
          break;
        case 'facebook':
          result = await this.postToFacebook(listing, attempt);
          break;
        default:
          throw new Error(`Unknown platform: ${platform}`);
      }
      
      return result;
    } catch (error) {
      console.error(`❌ Failed to syndicate to ${platform}:`, error);

      // Retry logic
      if (attempt < this.MAX_RETRIES) {
        console.log(`🔄 Retrying ${platform} in ${this.RETRY_DELAY_MS}ms...`);
        await this.delay(this.RETRY_DELAY_MS);
        return this.syndicateToplatform(listing, platform, attempt + 1);
      }

      return {
        platform,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        retryCount: attempt
      };
    }
  }

  /**
   * Post listing to OLX via Partner API
   */
  private async postToOLX(listing: SellerListing, retryCount: number): Promise<SyndicationResult> {
    if (!this.OLX_CLIENT_ID || !this.OLX_CLIENT_SECRET) {
      throw new Error('OLX API credentials not configured');
    }

    const platformListing = this.convertToOLXFormat(listing);
    let access_token: string;

    // Step 1: Get OAuth access token
    let tokenResponse;
    try {
      tokenResponse = await fetch('https://www.olx.in/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          grant_type: 'client_credentials',
          client_id: this.OLX_CLIENT_ID,
          client_secret: this.OLX_CLIENT_SECRET
        })
      });

      // Clone response for logging before consuming body
      const responseClone = tokenResponse.clone();
      
      // Parse response (may throw)
      let tokenData;
      let parseError;
      try {
        tokenData = tokenResponse.ok ? await tokenResponse.json() : await tokenResponse.text();
      } catch (err) {
        parseError = err;
        tokenData = { parseError: err instanceof Error ? err.message : 'Parse error' };
      }

      // Log OAuth attempt - happens regardless of parse success
      await this.logApiCall('OLX', 'POST /oauth/token', responseClone.status, tokenData, !responseClone.ok || !!parseError);

      if (parseError) {
        throw parseError;
      }

      if (!responseClone.ok) {
        throw new Error(`OLX OAuth failed (${responseClone.status}): ${typeof tokenData === 'string' ? tokenData : JSON.stringify(tokenData)}`);
      }

      access_token = tokenData.access_token;
    } catch (error) {
      // Only log if fetch itself failed (no response), not if response parsing failed
      if (!tokenResponse) {
        await this.logApiCall('OLX', 'POST /oauth/token', 0, { error: error instanceof Error ? error.message : 'Unknown error' }, true);
      }
      throw error;
    }

    // Step 2: Create listing
    let response;
    try {
      response = await fetch('https://api.olx.in/v1/adverts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(platformListing)
      });

      // Parse response (may throw)
      let data;
      let parseError;
      try {
        data = response.ok ? await response.json() : await response.text();
      } catch (err) {
        parseError = err;
        data = { parseError: err instanceof Error ? err.message : 'Parse error' };
      }

      // Log listing attempt - happens regardless of parse success
      await this.logApiCall('OLX', 'POST /v1/adverts', response.status, data, !response.ok || !!parseError);

      if (parseError) {
        throw parseError;
      }

      if (!response.ok) {
        throw new Error(`OLX listing failed (${response.status}): ${typeof data === 'string' ? data : JSON.stringify(data)}`);
      }

      return {
        platform: 'OLX',
        success: true,
        platformListingId: data.id || data.advert_id,
        platformUrl: data.url || `https://www.olx.in/item/${data.id}`,
        retryCount
      };
    } catch (error) {
      // Only log if fetch itself failed (no response), not if response parsing failed
      if (!response) {
        await this.logApiCall('OLX', 'POST /v1/adverts', 0, { error: error instanceof Error ? error.message : 'Unknown error' }, true);
      }
      throw error;
    }
  }

  /**
   * Post listing to Quikr via API
   */
  private async postToQuikr(listing: SellerListing, retryCount: number): Promise<SyndicationResult> {
    if (!this.QUIKR_APP_ID || !this.QUIKR_TOKEN_ID) {
      throw new Error('Quikr API credentials not configured');
    }

    const platformListing = this.convertToQuikrFormat(listing);
    let response;

    try {
      response = await fetch('https://api.quikr.com/public/postAds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Quikr-App-Id': this.QUIKR_APP_ID,
          'X-Quikr-Token-Id': this.QUIKR_TOKEN_ID,
          'X-Quikr-Signature': this.QUIKR_SIGNATURE || ''
        },
        body: JSON.stringify(platformListing)
      });

      // Parse response (may throw)
      let data;
      let parseError;
      try {
        data = response.ok ? await response.json() : await response.text();
      } catch (err) {
        parseError = err;
        data = { parseError: err instanceof Error ? err.message : 'Parse error' };
      }

      // Log API call - happens regardless of parse success
      await this.logApiCall('Quikr', 'POST /public/postAds', response.status, data, !response.ok || !!parseError);

      if (parseError) {
        throw parseError;
      }

      if (!response.ok) {
        throw new Error(`Quikr listing failed (${response.status}): ${typeof data === 'string' ? data : JSON.stringify(data)}`);
      }

      return {
        platform: 'Quikr',
        success: true,
        platformListingId: data.PostAdResponse?.data?.adId,
        platformUrl: `https://www.quikr.com/cars/${data.PostAdResponse?.data?.adId}`,
        retryCount
      };
    } catch (error) {
      // Only log if fetch itself failed (no response), not if response parsing failed
      if (!response) {
        await this.logApiCall('Quikr', 'POST /public/postAds', 0, { error: error instanceof Error ? error.message : 'Unknown error' }, true);
      }
      throw error;
    }
  }

  /**
   * Post listing to Facebook Marketplace via Graph API
   */
  private async postToFacebook(listing: SellerListing, retryCount: number): Promise<SyndicationResult> {
    if (!this.FACEBOOK_ACCESS_TOKEN || !this.FACEBOOK_CATALOG_ID) {
      throw new Error('Facebook API credentials not configured');
    }

    const platformListing = this.convertToFacebookFormat(listing);
    let response;

    try {
      response = await fetch(
        `https://graph.facebook.com/v23.0/${this.FACEBOOK_CATALOG_ID}/vehicles?access_token=${this.FACEBOOK_ACCESS_TOKEN}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(platformListing)
        }
      );

      // Parse response (may throw)
      let data;
      let parseError;
      try {
        data = response.ok ? await response.json() : await response.text();
      } catch (err) {
        parseError = err;
        data = { parseError: err instanceof Error ? err.message : 'Parse error' };
      }

      // Log API call - happens regardless of parse success
      await this.logApiCall('Facebook', 'POST /vehicles', response.status, data, !response.ok || !!parseError);

      if (parseError) {
        throw parseError;
      }

      if (!response.ok) {
        throw new Error(`Facebook listing failed (${response.status}): ${typeof data === 'string' ? data : JSON.stringify(data)}`);
      }

      return {
        platform: 'Facebook',
        success: true,
        platformListingId: data.id,
        platformUrl: `https://www.facebook.com/marketplace/item/${data.id}`,
        retryCount
      };
    } catch (error) {
      // Only log if fetch itself failed (no response), not if response parsing failed
      if (!response) {
        await this.logApiCall('Facebook', 'POST /vehicles', 0, { error: error instanceof Error ? error.message : 'Unknown error' }, true);
      }
      throw error;
    }
  }

  /**
   * Convert CarArth listing to OLX format
   */
  private convertToOLXFormat(listing: SellerListing): any {
    // Collect all images
    const images = [
      listing.frontPhoto,
      listing.rearPhoto,
      listing.leftSidePhoto,
      listing.rightSidePhoto,
      listing.interiorPhoto,
      listing.engineBayPhoto,
      ...(listing.additionalPhotos || [])
    ].filter(Boolean);

    return {
      title: `${listing.year} ${listing.brand} ${listing.model}`,
      description: `${listing.description || ''}\n\n🚗 Powered by CarArth.com - India's Trusted Car Marketplace`,
      category: 'cars',
      price: listing.price,
      currency: 'INR',
      location: listing.city,
      images: images,
      attributes: {
        year: listing.year,
        make: listing.brand,
        model: listing.model,
        mileage: listing.mileage,
        fuel_type: listing.fuelType,
        transmission: listing.transmission
      },
      contact: {
        phone: listing.actualPhone
      }
    };
  }

  /**
   * Convert CarArth listing to Quikr format
   */
  private convertToQuikrFormat(listing: SellerListing): any {
    return {
      email: listing.actualEmail,
      remoteAddr: '0.0.0.0', // Server IP
      subCategory: 'cars',
      cityName: listing.city,
      title: `${listing.year} ${listing.brand} ${listing.model}`,
      description: `${listing.description || ''}\n\n🚗 Powered by CarArth.com - India's Trusted Car Marketplace`,
      locations: listing.city,
      userMobile: listing.actualPhone,
      attributes: {
        Ad_Type: 'offer',
        You_are: 'Individual',
        Kms_Driven: listing.mileage.toString(),
        Condition: 'Used',
        Year: listing.year.toString(),
        Brand_name: listing.brand,
        Model: listing.model
      }
    };
  }

  /**
   * Convert CarArth listing to Facebook format
   */
  private convertToFacebookFormat(listing: SellerListing): any {
    // Collect all images
    const images = [
      listing.frontPhoto,
      listing.rearPhoto,
      listing.leftSidePhoto,
      listing.rightSidePhoto,
      listing.interiorPhoto,
      listing.engineBayPhoto,
      ...(listing.additionalPhotos || [])
    ].filter(Boolean);

    return {
      retailer_id: `CARARTH_${listing.id}`,
      title: `${listing.year} ${listing.brand} ${listing.model}`,
      description: `${listing.description || ''}\n\n🚗 Powered by CarArth.com - India's Trusted Car Marketplace`,
      price: listing.price,
      currency: 'INR',
      year: listing.year,
      make: listing.brand,
      model: listing.model,
      mileage: {
        value: listing.mileage,
        unit: 'KM'
      },
      condition: 'used',
      transmission: listing.transmission?.toLowerCase(),
      fuel_type: listing.fuelType?.toLowerCase(),
      images: images,
      url: `https://cararth.com/listings/${listing.id}`,
      availability: 'in stock'
    };
  }

  /**
   * Save syndication execution log
   */
  private async saveExecutionLog(
    listing: SellerListing,
    result: SyndicationResult
  ): Promise<void> {
    try {
      const logData: InsertSyndicationExecutionLog = {
        listingId: listing.id,
        sellerId: listing.sellerId,
        platform: result.platform,
        status: result.success ? 'success' : 'failed',
        platformListingId: result.platformListingId || null,
        platformUrl: result.platformUrl || null,
        poweredByAttribution: true,
        errorMessage: result.error || null,
        retryCount: result.retryCount || 1
      };

      await this.storage.createSyndicationLog(logData);
      console.log(`📝 Saved execution log for ${result.platform}`);
    } catch (error) {
      console.error('Failed to save execution log:', error);
    }
  }

  /**
   * Log external API call for audit trail
   */
  private async logApiCall(
    provider: string,
    endpoint: string,
    statusCode: number,
    responseData: any,
    isError: boolean = false
  ): Promise<void> {
    try {
      const auditLog: InsertExternalApiAuditLog = {
        apiProvider: provider,
        apiEndpoint: endpoint,
        httpMethod: 'POST',
        operationType: 'syndication',
        responseStatus: statusCode,
        responseBody: responseData,
        isError,
        errorMessage: isError ? (typeof responseData === 'string' ? responseData : responseData?.error) : null,
        estimatedCost: null
      };

      await this.storage.logExternalApiCall(auditLog);
    } catch (error) {
      console.error('Failed to save API audit log:', error);
    }
  }

  /**
   * Utility: Delay for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
