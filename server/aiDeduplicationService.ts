import { OpenAI } from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';
import { GoogleGenAI } from '@google/genai';
import FirecrawlApp from '@mendable/firecrawl-js';
import type { IStorage } from './storage.js';
import type { InsertDeduplicationResult } from '../shared/schema.js';

interface ListingData {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  kms: number;
  city: string;
  images?: string[];
  description?: string;
}

interface DeduplicationMatch {
  platform: string;
  matchUrl: string;
  confidence: number;
  isDuplicate: boolean;
  analysis: string;
  matchedFields: string[];
}

interface MultiLLMDeduplicationResult {
  geminiResult: DeduplicationMatch | null;
  claudeResult: DeduplicationMatch | null;
  openaiResult: DeduplicationMatch | null;
  consensusConfidence: number;
  isDuplicate: boolean;
  analysis: string;
}

/**
 * AI-Powered Deduplication Service
 * Uses Firecrawl + Multi-LLM (Gemini, Claude, OpenAI) to detect duplicate listings across platforms
 * Confidence threshold: ≥85% for marking as duplicate
 */
export class AIDeduplicationService {
  private openai: OpenAI;
  private anthropic: Anthropic;
  private gemini: GoogleGenAI;
  private firecrawl: FirecrawlApp;
  private storage: IStorage;
  
  // Confidence threshold for duplicate detection
  private readonly DUPLICATE_THRESHOLD = 0.85;
  
  // Platform search URLs
  private readonly PLATFORM_URLS = {
    olx: 'https://www.olx.in/cars_c84',
    quikr: 'https://www.quikr.com/cars',
    facebook: 'https://www.facebook.com/marketplace/category/vehicles'
  };

  constructor(storage: IStorage) {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    this.gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
    this.firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY || '' });
    this.storage = storage;
  }

  /**
   * Main deduplication check: Scrape platforms and analyze with multi-LLM
   */
  async checkForDuplicates(listing: ListingData): Promise<DeduplicationMatch[]> {
    const results: DeduplicationMatch[] = [];
    
    console.log(`🔍 Starting deduplication check for listing: ${listing.id}`);
    
    // Check each platform
    for (const [platform, baseUrl] of Object.entries(this.PLATFORM_URLS)) {
      try {
        const platformResult = await this.checkPlatform(listing, platform, baseUrl);
        if (platformResult) {
          results.push(platformResult);
          
          // Save to database
          await this.saveDeduplicationResult(listing.id, platformResult);
        }
      } catch (error) {
        console.error(`Deduplication check failed for ${platform}:`, error);
      }
    }
    
    return results;
  }

  /**
   * Check a single platform for duplicates using Firecrawl + Multi-LLM
   */
  private async checkPlatform(
    listing: ListingData,
    platform: string,
    baseUrl: string
  ): Promise<DeduplicationMatch | null> {
    // Step 1: Scrape platform for similar listings using Firecrawl
    const scrapedListings = await this.scrapePlatform(listing, platform, baseUrl);
    
    if (!scrapedListings || scrapedListings.length === 0) {
      console.log(`No potential matches found on ${platform}`);
      return null;
    }
    
    // Step 2: Analyze with multi-LLM for best match
    const multiLLMResult = await this.analyzeWithMultiLLM(listing, scrapedListings, platform);
    
    if (multiLLMResult.consensusConfidence >= this.DUPLICATE_THRESHOLD) {
      return {
        platform,
        matchUrl: multiLLMResult.geminiResult?.matchUrl || multiLLMResult.claudeResult?.matchUrl || multiLLMResult.openaiResult?.matchUrl || '',
        confidence: multiLLMResult.consensusConfidence,
        isDuplicate: true,
        analysis: multiLLMResult.analysis,
        matchedFields: multiLLMResult.geminiResult?.matchedFields || []
      };
    }
    
    return null;
  }

  /**
   * Scrape platform using Firecrawl to find potential matches
   */
  private async scrapePlatform(
    listing: ListingData,
    platform: string,
    baseUrl: string
  ): Promise<any[]> {
    try {
      console.log(`🌐 Scraping ${platform} for potential duplicates...`);
      
      // Build search query
      const searchQuery = `${listing.make} ${listing.model} ${listing.year} ${listing.city}`.toLowerCase();
      const searchUrl = `${baseUrl}?q=${encodeURIComponent(searchQuery)}`;
      
      // Use Firecrawl to scrape search results
      const scrapeResult = await this.firecrawl.scrapeUrl(searchUrl, {
        formats: ['extract'],
        extract: {
          schema: {
            type: 'object',
            properties: {
              listings: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    price: { type: 'number' },
                    year: { type: 'number' },
                    kms: { type: 'number' },
                    url: { type: 'string' },
                    city: { type: 'string' },
                    images: { type: 'array', items: { type: 'string' } }
                  }
                }
              }
            }
          } as any
        },
        timeout: 10000
      });
      
      const extractedData = (scrapeResult as any)?.data?.extract ?? (scrapeResult as any)?.extract ?? (scrapeResult as any)?.data;
      const listings = extractedData?.listings || [];
      console.log(`Found ${listings.length} potential matches on ${platform}`);
      
      return listings.slice(0, 5); // Limit to top 5 for cost efficiency
    } catch (error) {
      console.error(`Firecrawl scraping failed for ${platform}:`, error);
      return [];
    }
  }

  /**
   * Analyze with multi-LLM: Gemini, Claude, OpenAI
   * Returns consensus confidence score
   */
  private async analyzeWithMultiLLM(
    listing: ListingData,
    potentialMatches: any[],
    platform: string
  ): Promise<MultiLLMDeduplicationResult> {
    console.log(`🤖 Analyzing ${potentialMatches.length} matches with multi-LLM...`);
    
    // Run all LLM analyses in parallel
    const [geminiResult, claudeResult, openaiResult] = await Promise.all([
      this.analyzeWithGemini(listing, potentialMatches, platform),
      this.analyzeWithClaude(listing, potentialMatches, platform),
      this.analyzeWithOpenAI(listing, potentialMatches, platform)
    ]);
    
    // Calculate consensus confidence (average of all LLMs)
    const confidences = [
      geminiResult?.confidence || 0,
      claudeResult?.confidence || 0,
      openaiResult?.confidence || 0
    ];
    const consensusConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    
    const isDuplicate = consensusConfidence >= this.DUPLICATE_THRESHOLD;
    
    return {
      geminiResult,
      claudeResult,
      openaiResult,
      consensusConfidence,
      isDuplicate,
      analysis: `Multi-LLM Analysis:\n- Gemini: ${geminiResult?.confidence?.toFixed(2) ?? 'N/A'}\n- Claude: ${claudeResult?.confidence?.toFixed(2) ?? 'N/A'}\n- OpenAI: ${openaiResult?.confidence?.toFixed(2) ?? 'N/A'}\n- Consensus: ${consensusConfidence.toFixed(2)}\n${isDuplicate ? '⚠️ DUPLICATE DETECTED' : '✅ No duplicate'}`
    };
  }

  /**
   * Gemini analysis for duplicate detection
   */
  private async analyzeWithGemini(
    listing: ListingData,
    potentialMatches: any[],
    platform: string
  ): Promise<DeduplicationMatch | null> {
    try {
      const prompt = `Analyze if this car listing is a duplicate of any listings below.

SOURCE LISTING:
- Make/Model: ${listing.make} ${listing.model}
- Year: ${listing.year}
- Price: ₹${listing.price}
- KMs: ${listing.kms}
- City: ${listing.city}
- Title: ${listing.title}

POTENTIAL MATCHES ON ${platform.toUpperCase()}:
${potentialMatches.map((m, i) => `
[Match ${i + 1}]
- Title: ${m.title}
- Price: ₹${m.price}
- Year: ${m.year}
- KMs: ${m.kms}
- City: ${m.city}
- URL: ${m.url}
`).join('\n')}

Analyze:
1. Which match (if any) is most likely the same car?
2. What fields match exactly?
3. What is your confidence (0.0-1.0)?

Return JSON only:
{
  "matchIndex": number or null,
  "matchUrl": "url of best match",
  "confidence": number (0.0-1.0),
  "matchedFields": ["field1", "field2"],
  "reasoning": "brief explanation"
}`;

      const result = await this.gemini.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt
      });
      
      const response = JSON.parse(result.text || '{}');
      
      if (response.matchIndex !== null && response.confidence > 0) {
        return {
          platform,
          matchUrl: response.matchUrl || '',
          confidence: response.confidence,
          isDuplicate: response.confidence >= this.DUPLICATE_THRESHOLD,
          analysis: response.reasoning || '',
          matchedFields: response.matchedFields || []
        };
      }
      
      return null;
    } catch (error) {
      console.error('Gemini deduplication analysis failed:', error);
      return null;
    }
  }

  /**
   * Claude analysis for duplicate detection
   */
  private async analyzeWithClaude(
    listing: ListingData,
    potentialMatches: any[],
    platform: string
  ): Promise<DeduplicationMatch | null> {
    try {
      const prompt = `You are a car listing duplicate detector. Analyze if the source listing matches any potential duplicates.

SOURCE LISTING:
Make: ${listing.make}
Model: ${listing.model}
Year: ${listing.year}
Price: ₹${listing.price}
Kilometers: ${listing.kms}
City: ${listing.city}
Title: ${listing.title}

POTENTIAL DUPLICATES FROM ${platform.toUpperCase()}:
${potentialMatches.map((m, i) => `
Match ${i + 1}:
Title: ${m.title}
Price: ₹${m.price}
Year: ${m.year}
KMs: ${m.kms}
City: ${m.city}
URL: ${m.url}
`).join('\n')}

Identify the best match (if any) and provide:
1. Match index (0-based) or null
2. Match URL
3. Confidence score (0.0-1.0)
4. Matched fields array
5. Brief reasoning

Return JSON:
{
  "matchIndex": number or null,
  "matchUrl": string,
  "confidence": number,
  "matchedFields": string[],
  "reasoning": string
}`;

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
      });
      
      const content = response.content[0];
      const result = JSON.parse(content.type === 'text' ? content.text : '{}');
      
      if (result.matchIndex !== null && result.confidence > 0) {
        return {
          platform,
          matchUrl: result.matchUrl || '',
          confidence: result.confidence,
          isDuplicate: result.confidence >= this.DUPLICATE_THRESHOLD,
          analysis: result.reasoning || '',
          matchedFields: result.matchedFields || []
        };
      }
      
      return null;
    } catch (error) {
      console.error('Claude deduplication analysis failed:', error);
      return null;
    }
  }

  /**
   * OpenAI analysis for duplicate detection
   */
  private async analyzeWithOpenAI(
    listing: ListingData,
    potentialMatches: any[],
    platform: string
  ): Promise<DeduplicationMatch | null> {
    try {
      const prompt = `Analyze if this car listing is a duplicate of any platform listings.

SOURCE LISTING:
- ${listing.make} ${listing.model} (${listing.year})
- Price: ₹${listing.price}
- Kilometers: ${listing.kms}
- City: ${listing.city}
- Title: ${listing.title}

PLATFORM LISTINGS (${platform.toUpperCase()}):
${potentialMatches.map((m, i) => `
${i + 1}. ${m.title}
   Price: ₹${m.price} | Year: ${m.year} | KMs: ${m.kms} | City: ${m.city}
   URL: ${m.url}
`).join('\n')}

Determine:
1. Best matching listing index (or null)
2. Confidence score (0.0-1.0)
3. Which fields match
4. Your reasoning

Return JSON:
{
  "matchIndex": number or null,
  "matchUrl": string,
  "confidence": number,
  "matchedFields": ["field1", "field2"],
  "reasoning": string
}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert at detecting duplicate car listings across platforms.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1
      });
      
      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      if (result.matchIndex !== null && result.confidence > 0) {
        return {
          platform,
          matchUrl: result.matchUrl || '',
          confidence: result.confidence,
          isDuplicate: result.confidence >= this.DUPLICATE_THRESHOLD,
          analysis: result.reasoning || '',
          matchedFields: result.matchedFields || []
        };
      }
      
      return null;
    } catch (error) {
      console.error('OpenAI deduplication analysis failed:', error);
      return null;
    }
  }

  /**
   * Save deduplication result to database
   */
  private async saveDeduplicationResult(
    listingId: string,
    match: DeduplicationMatch
  ): Promise<void> {
    try {
      const deduplicationData: InsertDeduplicationResult = {
        listingId,
        platform: match.platform,
        confidenceScore: match.confidence.toFixed(2), // Convert number to decimal string
        isDuplicate: match.isDuplicate,
        potentialDuplicates: [{
          matchUrl: match.matchUrl,
          confidence: match.confidence,
          matchedFields: match.matchedFields,
          analysis: match.analysis
        }],
        skipSyndication: match.isDuplicate, // Skip syndication if duplicate found
        skipReason: match.isDuplicate ? `Duplicate detected with ${(match.confidence * 100).toFixed(0)}% confidence` : null
      };
      
      await this.storage.createDeduplicationResult(deduplicationData);
      console.log(`✅ Saved deduplication result for listing ${listingId} on ${match.platform}`);
    } catch (error) {
      console.error('Failed to save deduplication result:', error);
      throw error;
    }
  }

  /**
   * Get deduplication results for a listing from database
   */
  async getDeduplicationResults(listingId: string) {
    return await this.storage.getDeduplicationResults(listingId);
  }

  /**
   * Get deduplication result for a specific platform
   */
  async getDeduplicationResultByPlatform(listingId: string, platform: string) {
    return await this.storage.getDeduplicationResultByPlatform(listingId, platform);
  }
}
