import { db } from "./db";
import { sellerListings, sellerInquiries, platformPostingLogs, type InsertSellerListing, type SellerListing } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { ObjectStorageService } from "./objectStorage";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export class SellerService {
  private objectStorage: ObjectStorageService;

  constructor() {
    this.objectStorage = new ObjectStorageService();
  }

  // Create a new seller listing
  async createListing(sellerId: string, listingData: Omit<InsertSellerListing, 'sellerId'>): Promise<SellerListing> {
    const [listing] = await db
      .insert(sellerListings)
      .values({
        ...listingData,
        sellerId,
      })
      .returning();
    
    return listing;
  }

  // Get upload URLs for different document/photo types
  async getUploadURL(category: string): Promise<{ uploadURL: string }> {
    // Validate category
    const validCategories = [
      'documents', 'photos/front', 'photos/rear', 'photos/left-side', 
      'photos/right-side', 'photos/interior', 'photos/engine-bay', 'photos/additional'
    ];
    
    if (!validCategories.includes(category)) {
      throw new Error(`Invalid upload category: ${category}`);
    }

    const uploadURL = await this.objectStorage.getSellerUploadURL(category);
    return { uploadURL };
  }

  // Update listing with uploaded file paths
  async updateListingFiles(listingId: string, updates: Partial<{
    rcBookDocument: string;
    insuranceDocument: string;
    frontPhoto: string;
    rearPhoto: string;
    leftSidePhoto: string;
    rightSidePhoto: string;
    interiorPhoto: string;
    engineBayPhoto: string;
    additionalPhotos: string[];
  }>): Promise<SellerListing> {
    const [listing] = await db
      .update(sellerListings)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(sellerListings.id, listingId))
      .returning();
    
    return listing;
  }

  // Generate AI-powered listing content
  async generateListingContent(listingId: string): Promise<{ title: string; description: string; marketValue: number }> {
    const [listing] = await db
      .select()
      .from(sellerListings)
      .where(eq(sellerListings.id, listingId));

    if (!listing) {
      throw new Error('Listing not found');
    }

    const prompt = `Create a compelling car listing based on the following details:
Brand: ${listing.brand}
Model: ${listing.model}
Year: ${listing.year}
Price: ₹${listing.price}
Mileage: ${listing.mileage} km
Fuel Type: ${listing.fuelType}
Transmission: ${listing.transmission}
Owners: ${listing.owners}
Location: ${listing.location}, ${listing.state}
Features: ${listing.features?.join(', ') || 'Standard features'}

Generate:
1. An attractive title (max 80 characters)
2. A detailed description highlighting key selling points
3. Market value estimate based on current trends

Response format:
{
  "title": "...",
  "description": "...",
  "marketValue": number
}`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              marketValue: { type: "number" }
            },
            required: ["title", "description", "marketValue"]
          }
        },
        contents: prompt,
      });

      const result = JSON.parse(response.text || '{}');
      
      // Update the listing with AI-generated content
      await db
        .update(sellerListings)
        .set({
          aiGeneratedTitle: result.title,
          aiGeneratedDescription: result.description,
          marketValueEstimate: result.marketValue.toString(),
          updatedAt: new Date(),
        })
        .where(eq(sellerListings.id, listingId));

      return result;
    } catch (error) {
      console.error('Error generating listing content:', error);
      // Fallback content
      return {
        title: `${listing.year} ${listing.brand} ${listing.model} - Well Maintained`,
        description: `Selling my ${listing.year} ${listing.brand} ${listing.model} in excellent condition. ${listing.mileage}km driven with ${listing.fuelType} engine and ${listing.transmission} transmission. Located in ${listing.location}, ${listing.state}. Serious buyers only.`,
        marketValue: Number(listing.price) * 0.9 // 10% below asking price as market estimate
      };
    }
  }

  // Post listing to multiple platforms
  async postToMultiplePlatforms(listingId: string): Promise<{
    cars24: { success: boolean; listingId?: string; error?: string };
    cardekho: { success: boolean; listingId?: string; error?: string };
    facebook: { success: boolean; listingId?: string; error?: string };
  }> {
    const [listing] = await db
      .select()
      .from(sellerListings)
      .where(eq(sellerListings.id, listingId));

    if (!listing) {
      throw new Error('Listing not found');
    }

    const results = {
      cars24: { success: false as boolean, listingId: undefined as string | undefined, error: undefined as string | undefined },
      cardekho: { success: false as boolean, listingId: undefined as string | undefined, error: undefined as string | undefined },
      facebook: { success: false as boolean, listingId: undefined as string | undefined, error: undefined as string | undefined },
    };

    // Post to Cars24 (simulated)
    try {
      const cars24Result = await this.postToCars24(listing);
      results.cars24 = cars24Result;
      
      await db.insert(platformPostingLogs).values({
        listingId,
        platform: 'cars24',
        postingStatus: cars24Result.success ? 'success' : 'failed',
        platformListingId: cars24Result.listingId,
        errorMessage: cars24Result.error,
        postedAt: new Date(),
      });
    } catch (error) {
      results.cars24.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Post to CarDekho (simulated)
    try {
      const cardekhoResult = await this.postToCarDekho(listing);
      results.cardekho = cardekhoResult;
      
      await db.insert(platformPostingLogs).values({
        listingId,
        platform: 'cardekho',
        postingStatus: cardekhoResult.success ? 'success' : 'failed',
        platformListingId: cardekhoResult.listingId,
        errorMessage: cardekhoResult.error,
        postedAt: new Date(),
      });
    } catch (error) {
      results.cardekho.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Post to Facebook Marketplace (simulated)
    try {
      const facebookResult = await this.postToFacebookMarketplace(listing);
      results.facebook = facebookResult;
      
      await db.insert(platformPostingLogs).values({
        listingId,
        platform: 'facebook_marketplace',
        postingStatus: facebookResult.success ? 'success' : 'failed',
        platformListingId: facebookResult.listingId,
        errorMessage: facebookResult.error,
        postedAt: new Date(),
      });
    } catch (error) {
      results.facebook.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Update listing status
    await db
      .update(sellerListings)
      .set({
        postedToCars24: results.cars24.success,
        cars24ListingId: results.cars24.listingId,
        postedToCarDekho: results.cardekho.success,
        carDekhoListingId: results.cardekho.listingId,
        postedToFacebookMarketplace: results.facebook.success,
        facebookMarketplaceListingId: results.facebook.listingId,
        listingStatus: 'active',
        updatedAt: new Date(),
      })
      .where(eq(sellerListings.id, listingId));

    return results;
  }

  // Simulate posting to Cars24 - DEVELOPMENT MODE
  private async postToCars24(listing: SellerListing): Promise<{ success: boolean; listingId?: string; error?: string }> {
    // SIMULATION: Real API integration pending partnership agreements
    // This creates a placeholder entry for development/testing purposes
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: false,
          error: 'Multi-platform syndication coming soon - partnerships in development'
        });
      }, 1000);
    });
  }

  // Simulate posting to CarDekho - DEVELOPMENT MODE  
  private async postToCarDekho(listing: SellerListing): Promise<{ success: boolean; listingId?: string; error?: string }> {
    // SIMULATION: Real API integration pending partnership agreements
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: false,
          error: 'Multi-platform syndication coming soon - partnerships in development'
        });
      }, 1000);
    });
  }

  // Simulate posting to Facebook Marketplace - DEVELOPMENT MODE
  private async postToFacebookMarketplace(listing: SellerListing): Promise<{ success: boolean; listingId?: string; error?: string }> {
    // SIMULATION: Real API integration pending partnership agreements
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: false,
          error: 'Multi-platform syndication coming soon - partnerships in development'
        });
      }, 1000);
    });
  }

  // Get seller listings
  async getSellerListings(sellerId: string): Promise<SellerListing[]> {
    return await db
      .select()
      .from(sellerListings)
      .where(eq(sellerListings.sellerId, sellerId))
      .orderBy(desc(sellerListings.createdAt));
  }

  // Handle masked contact inquiry routing
  async routeInquiry(maskedContactId: string, inquiryData: {
    buyerName: string;
    buyerPhone: string;
    buyerEmail: string;
    message?: string;
    source: string;
  }): Promise<{ success: boolean; message: string }> {
    // Find the listing by masked contact ID
    const [listing] = await db
      .select()
      .from(sellerListings)
      .where(eq(sellerListings.maskedContactId, maskedContactId));

    if (!listing) {
      return { success: false, message: 'Listing not found' };
    }

    // Create inquiry record
    await db.insert(sellerInquiries).values({
      listingId: listing.id,
      maskedContactId,
      buyerName: inquiryData.buyerName,
      buyerPhone: inquiryData.buyerPhone,
      buyerEmail: inquiryData.buyerEmail,
      message: inquiryData.message,
      source: inquiryData.source,
    });

    // Update inquiry count
    await db
      .update(sellerListings)
      .set({
        inquiryCount: (listing.inquiryCount || 0) + 1,
        updatedAt: new Date(),
      })
      .where(eq(sellerListings.id, listing.id));

    // In a real implementation, you would:
    // 1. Send SMS/email to seller with buyer details
    // 2. Send confirmation to buyer
    // 3. Log the routing activity

    return { success: true, message: 'Inquiry forwarded to seller successfully' };
  }
}