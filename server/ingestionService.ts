import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import type {
  InsertCanonicalListing,
  CanonicalListing,
  ListingSource,
  InsertIngestionLog,
  InsertLlmReport,
} from '@shared/schema';
import {
  canonicalListings,
  llmReports,
  ingestionLogs,
} from '@shared/schema';
import { LLMComplianceService } from './llmComplianceService';
import { FirecrawlMcpService } from './firecrawlMcpService';
import { Crawl4AIService } from './crawl4aiService';
import type { DatabaseStorage } from './dbStorage';

export interface IngestionResult {
  success: boolean;
  listingId?: string;
  fingerprint?: string;
  isDuplicate: boolean;
  complianceResults?: any[];
  errors?: string[];
}

export interface FieldMapping {
  [sourceField: string]: string;
}

export class IngestionService {
  private llmCompliance: LLMComplianceService;
  private firecrawl: FirecrawlMcpService;
  private crawl4ai: Crawl4AIService;

  constructor() {
    this.llmCompliance = new LLMComplianceService();
    this.firecrawl = new FirecrawlMcpService({
      apiKey: process.env.FIRECRAWL_API_KEY || '',
    });
    this.crawl4ai = new Crawl4AIService();
  }

  generateFingerprint(listing: {
    vin?: string;
    make: string;
    model: string;
    year: number;
    registrationNumber?: string;
    sourceListingId: string;
  }): string {
    if (listing.vin) {
      return `VIN:${listing.vin}`;
    }

    if (listing.registrationNumber) {
      return `REG:${listing.registrationNumber}`;
    }

    const data = `${listing.make}|${listing.model}|${listing.year}|${listing.sourceListingId}`;
    const hash = crypto.createHash('sha256').update(data).digest('hex');
    return `HASH:${hash}`;
  }

  async checkDuplicate(
    fingerprint: string,
    db: DatabaseStorage['db']
  ): Promise<CanonicalListing | null> {
    try {
      const existing = await db
        .select()
        .from(canonicalListings)
        .where(eq(canonicalListings.fingerprint, fingerprint))
        .limit(1);

      return existing.length > 0 ? existing[0] : null;
    } catch (error) {
      console.error('Duplicate check error:', error);
      return null;
    }
  }

  async normalizeWithMapping(
    rawData: any,
    fieldMapping: FieldMapping | null
  ): Promise<Partial<InsertCanonicalListing>> {
    if (!fieldMapping) {
      return this.autoNormalize(rawData);
    }

    const normalized: any = {};

    for (const [sourceField, canonicalField] of Object.entries(fieldMapping)) {
      if (rawData[sourceField] !== undefined) {
        normalized[canonicalField] = rawData[sourceField];
      }
    }

    return normalized;
  }

  private autoNormalize(rawData: any): Partial<InsertCanonicalListing> {
    const normalized: Partial<InsertCanonicalListing> = {};

    const titleFields = ['title', 'name', 'heading', 'listingTitle'];
    const makeFields = ['make', 'brand', 'manufacturer'];
    const modelFields = ['model', 'modelName'];
    const priceFields = ['price', 'priceAmount', 'cost', 'askingPrice'];
    const cityFields = ['city', 'location', 'cityName'];

    for (const field of titleFields) {
      if (rawData[field]) {
        normalized.title = String(rawData[field]);
        break;
      }
    }

    for (const field of makeFields) {
      if (rawData[field]) {
        normalized.make = String(rawData[field]);
        break;
      }
    }

    for (const field of modelFields) {
      if (rawData[field]) {
        normalized.model = String(rawData[field]);
        break;
      }
    }

    for (const field of priceFields) {
      if (rawData[field]) {
        const price = parseFloat(String(rawData[field]).replace(/[^0-9.]/g, ''));
        if (!isNaN(price)) {
          normalized.priceAmount = String(price);
        }
        break;
      }
    }

    for (const field of cityFields) {
      if (rawData[field]) {
        normalized.city = String(rawData[field]);
        break;
      }
    }

    if (rawData.year) normalized.year = parseInt(String(rawData.year));
    if (rawData.kms || rawData.mileage || rawData.kilometers)
      normalized.kms = parseInt(
        String(rawData.kms || rawData.mileage || rawData.kilometers)
      );
    if (rawData.fuel || rawData.fuelType)
      normalized.fuel = String(rawData.fuel || rawData.fuelType);
    if (rawData.transmission)
      normalized.transmission = String(rawData.transmission);
    if (rawData.images) normalized.images = Array.isArray(rawData.images) ? rawData.images : [rawData.images];
    if (rawData.description) normalized.description = String(rawData.description);
    if (rawData.ownerCount || rawData.owners)
      normalized.ownerCount = parseInt(
        String(rawData.ownerCount || rawData.owners)
      );

    return normalized;
  }

  async ingestFromWebhook(
    sourceId: string,
    rawData: any,
    source: ListingSource,
    db: DatabaseStorage['db']
  ): Promise<IngestionResult> {
    try {
      let normalized = await this.normalizeWithMapping(
        rawData,
        source.fieldMapping as FieldMapping | null
      );

      if (!normalized.make || !normalized.model || !normalized.year) {
        const llmNormalization = await this.llmCompliance.normalizeListing(
          rawData,
          source.sourceType || 'unknown',
          'gemini'
        );
        normalized = {
          ...normalized,
          ...llmNormalization.reportJson.normalizedData,
        };
      }

      if (!normalized.title || !normalized.make || !normalized.model) {
        return {
          success: false,
          isDuplicate: false,
          errors: ['Missing required fields: title, make, or model'],
        };
      }

      // HYDERABAD-ONLY FILTER: Reject listings from other cities
      const city = normalized.city?.trim().toLowerCase() || '';
      const allowedCities = ['hyderabad', 'secunderabad'];
      const isHyderabadListing = allowedCities.some(c => city.includes(c));
      
      if (!isHyderabadListing) {
        return {
          success: false,
          isDuplicate: false,
          errors: [`Listing rejected: Not from Hyderabad (city: ${normalized.city || 'unknown'})`],
        };
      }

      // Normalize city name and set state
      normalized.city = city.includes('secunderabad') ? 'Secunderabad' : 'Hyderabad';
      normalized.registrationState = 'Telangana';

      const fingerprint = this.generateFingerprint({
        vin: normalized.vin || undefined,
        make: normalized.make,
        model: normalized.model,
        year: normalized.year || 0,
        registrationNumber: rawData.registrationNumber,
        sourceListingId: rawData.id || rawData.listingId || crypto.randomUUID(),
      });

      const existingListing = await this.checkDuplicate(fingerprint, db);
      if (existingListing) {
        return {
          success: true,
          listingId: existingListing.id,
          fingerprint,
          isDuplicate: true,
        };
      }

      const canonicalListing: InsertCanonicalListing = {
        sourceId,
        sourceListingId: rawData.id || rawData.listingId || crypto.randomUUID(),
        sourceUrl: rawData.url || rawData.sourceUrl || undefined,
        fingerprint,
        vin: normalized.vin,
        title: normalized.title,
        make: normalized.make,
        model: normalized.model,
        variant: normalized.variant,
        year: normalized.year || new Date().getFullYear(),
        priceAmount: normalized.priceAmount || '0',
        priceCurrency: normalized.priceCurrency || 'INR',
        kms: normalized.kms,
        fuel: normalized.fuel,
        transmission: normalized.transmission,
        ownerCount: normalized.ownerCount,
        registrationState: normalized.registrationState,
        city: normalized.city || 'Unknown',
        pincode: normalized.pincode,
        images: normalized.images || [],
        description: normalized.description,
        sellerType: normalized.sellerType,
        verifiedDocs: normalized.verifiedDocs || { rc: false, insurance: false },
        postedAt: normalized.postedAt,
        ingestedAt: new Date(),
        lastSeenAt: new Date(),
        status: 'pending',
        meta: rawData,
      };

      const complianceResults = await this.llmCompliance.runFullCompliance(
        canonicalListing,
        canonicalListing.sourceUrl || '',
        rawData.htmlContent
      );

      const highRisk = complianceResults.some(
        (r) => r.riskLevel === 'critical' || r.riskLevel === 'high'
      );

      canonicalListing.status = highRisk ? 'flagged' : 'pending';
      canonicalListing.listingRiskScore = String(
        complianceResults.reduce((sum, r) => {
          const scores = { low: 0.1, medium: 0.4, high: 0.7, critical: 1.0 };
          return sum + (scores[r.riskLevel] || 0);
        }, 0) / (complianceResults.length || 1)
      );

      const [insertedListing] = await db
        .insert(canonicalListings)
        .values(canonicalListing)
        .returning();

      for (const complianceResult of complianceResults) {
        await db.insert(llmReports).values({
          listingId: insertedListing.id,
          provider: complianceResult.provider,
          reportType: complianceResult.reportType,
          reportJson: complianceResult.reportJson,
          riskLevel: complianceResult.riskLevel,
          flagged: complianceResult.flagged,
          processingTimeMs: complianceResult.processingTimeMs,
          tokenUsage: complianceResult.tokenUsage,
          estimatedCost: complianceResult.estimatedCost?.toString(),
        });
      }

      return {
        success: true,
        listingId: insertedListing.id,
        fingerprint,
        isDuplicate: false,
        complianceResults,
      };
    } catch (error) {
      console.error('Ingestion error:', error);
      return {
        success: false,
        isDuplicate: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  async ingestFromFirecrawl(
    sourceId: string,
    url: string,
    source: ListingSource,
    db: DatabaseStorage['db']
  ): Promise<IngestionResult> {
    try {
      const scrapeResult = await this.firecrawl.scrapeUrl(url, {
        formats: ['markdown', 'html'],
        onlyMainContent: true,
      });

      if (!scrapeResult.success) {
        return {
          success: false,
          isDuplicate: false,
          errors: [scrapeResult.error || 'Firecrawl scraping failed'],
        };
      }

      const extractResult = await this.firecrawl.extractWithLLM(
        url,
        `Extract automotive listing data: make, model, year, price, kms, fuel, transmission, city, images, description`,
        {
          make: 'string',
          model: 'string',
          year: 'number',
          price: 'number',
          kms: 'number',
          fuel: 'string',
          transmission: 'string',
          city: 'string',
          images: 'array',
          description: 'string',
        }
      );

      if (!extractResult.success || !extractResult.data) {
        return {
          success: false,
          isDuplicate: false,
          errors: ['Failed to extract structured data from listing'],
        };
      }

      return await this.ingestFromWebhook(
        sourceId,
        {
          ...extractResult.data,
          url,
          htmlContent: scrapeResult.data,
        },
        source,
        db
      );
    } catch (error) {
      console.error('Firecrawl ingestion error:', error);
      return {
        success: false,
        isDuplicate: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  async ingestFromCrawl4AI(
    sourceId: string,
    url: string,
    source: ListingSource,
    db: DatabaseStorage['db'],
    options: { llmProvider?: 'openai' | 'gemini' | 'anthropic'; llmModel?: string } = {}
  ): Promise<IngestionResult> {
    try {
      console.log(`🤖 Crawl4AI ingesting from: ${url}`);
      
      const scrapeResult = await this.crawl4ai.scrapeUrl(url, {
        llmProvider: options.llmProvider || 'openai',
        llmModel: options.llmModel || 'gpt-4o-mini',
      });

      if (!scrapeResult.success) {
        return {
          success: false,
          isDuplicate: false,
          errors: [scrapeResult.error || 'Crawl4AI scraping failed'],
        };
      }

      if (!scrapeResult.data) {
        return {
          success: false,
          isDuplicate: false,
          errors: ['No structured data extracted from listing'],
        };
      }

      // Map Crawl4AI extracted data to webhook format
      // Use URL as stable sourceListingId for proper deduplication
      const webhookData = {
        id: url, // Stable identifier for deduplication
        title: scrapeResult.data?.title || 'Unknown',
        make: scrapeResult.data?.make || 'Unknown',
        model: scrapeResult.data?.model || 'Unknown',
        variant: scrapeResult.data?.variant,
        year: scrapeResult.data?.year || 0,
        price: scrapeResult.data?.price_amount || 0,
        kms: scrapeResult.data?.kms,
        fuel: scrapeResult.data?.fuel,
        transmission: scrapeResult.data?.transmission,
        ownerCount: scrapeResult.data?.owner_count,
        city: scrapeResult.data?.city || 'Unknown',
        registrationState: scrapeResult.data?.registration_state,
        pincode: scrapeResult.data?.pincode,
        description: scrapeResult.data?.description,
        images: scrapeResult.data?.images || [],
        sellerName: scrapeResult.data?.seller_name,
        sellerPhone: scrapeResult.data?.seller_phone,
        url,
        htmlContent: scrapeResult.markdown, // Pass markdown for compliance context
        metadata: scrapeResult.metadata,
      };

      console.log(`✅ Crawl4AI extracted data for ${webhookData.make} ${webhookData.model}`);

      return await this.ingestFromWebhook(
        sourceId,
        webhookData,
        source,
        db
      );
    } catch (error) {
      console.error('Crawl4AI ingestion error:', error);
      return {
        success: false,
        isDuplicate: false,
        errors: [error instanceof Error ? error.message : 'Unknown Crawl4AI error'],
      };
    }
  }

  async ingestBatch(
    sourceId: string,
    listings: any[],
    source: ListingSource,
    db: DatabaseStorage['db']
  ): Promise<{
    totalProcessed: number;
    newListings: number;
    updatedListings: number;
    rejectedListings: number;
    errors: string[];
  }> {
    const results = {
      totalProcessed: 0,
      newListings: 0,
      updatedListings: 0,
      rejectedListings: 0,
      errors: [] as string[],
    };

    for (const rawListing of listings) {
      results.totalProcessed++;

      const ingestionResult = await this.ingestFromWebhook(
        sourceId,
        rawListing,
        source,
        db
      );

      if (ingestionResult.success) {
        if (ingestionResult.isDuplicate) {
          results.updatedListings++;
        } else {
          results.newListings++;
        }
      } else {
        results.rejectedListings++;
        if (ingestionResult.errors) {
          results.errors.push(...ingestionResult.errors);
        }
      }
    }

    return results;
  }
}
