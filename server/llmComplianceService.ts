import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI } from '@google/genai';
import type { 
  InsertLlmReport, 
  CanonicalListing 
} from '@shared/schema';

export interface ComplianceCheckResult {
  provider: 'openai' | 'gemini' | 'anthropic' | 'perplexity';
  reportType: 'tos_extraction' | 'pii_detection' | 'copyright_check' | 'normalization';
  reportJson: any;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  flagged: boolean;
  processingTimeMs: number;
  tokenUsage?: any;
  estimatedCost?: number;
}

export interface ToSExtractionResult {
  hasToS: boolean;
  tosUrl?: string;
  tosSnapshot?: string;
  allowsAggregation: boolean;
  requiresAttribution: boolean;
  commercialUseAllowed: boolean;
  restrictions: string[];
  confidence: number;
}

export interface PIIDetectionResult {
  hasPII: boolean;
  detectedFields: string[];
  phoneNumbers: string[];
  emailAddresses: string[];
  names: string[];
  addresses: string[];
  riskScore: number;
}

export interface CopyrightCheckResult {
  hasCopyrightIssues: boolean;
  stockPhotos: string[];
  watermarkedImages: string[];
  brandLogos: string[];
  thirdPartyContent: string[];
  riskScore: number;
}

export interface NormalizationResult {
  normalizedData: Partial<CanonicalListing>;
  confidence: number;
  missingFields: string[];
  inferredFields: { field: string; value: any; confidence: number }[];
}

export class LLMComplianceService {
  private openai: OpenAI;
  private anthropic: Anthropic;
  private gemini: GoogleGenAI;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    this.gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
  }

  async extractToS(
    sourceUrl: string,
    htmlContent: string,
    provider: 'openai' | 'gemini' | 'anthropic' = 'openai'
  ): Promise<ComplianceCheckResult> {
    const startTime = Date.now();

    const prompt = `Analyze this automotive listing website's Terms of Service for data aggregation compliance:

URL: ${sourceUrl}
Content: ${htmlContent.slice(0, 10000)}

Extract:
1. Does this site have Terms of Service? (true/false)
2. ToS URL if found
3. Does ToS allow data aggregation/scraping? (true/false)
4. Does ToS require attribution? (true/false) 
5. Does ToS allow commercial use? (true/false)
6. Any specific restrictions on data use
7. Confidence score (0-1)

Return JSON only:
{
  "hasToS": boolean,
  "tosUrl": string or null,
  "allowsAggregation": boolean,
  "requiresAttribution": boolean,
  "commercialUseAllowed": boolean,
  "restrictions": string[],
  "confidence": number
}`;

    let reportJson: ToSExtractionResult;
    let tokenUsage: any = null;
    let estimatedCost = 0;

    try {
      if (provider === 'openai') {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a legal compliance expert analyzing Terms of Service.' },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
        });

        reportJson = JSON.parse(response.choices[0].message.content || '{}');
        tokenUsage = response.usage;
        estimatedCost = ((response.usage?.prompt_tokens || 0) * 0.00015 + (response.usage?.completion_tokens || 0) * 0.0006) / 1000;
      } else if (provider === 'gemini') {
        const result = await this.gemini.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: prompt,
        });
        reportJson = JSON.parse(result.text || '{}');
        estimatedCost = 0.00001;
      } else {
        const response = await this.anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        });

        const content = response.content[0];
        reportJson = JSON.parse(content.type === 'text' ? content.text : '{}');
        tokenUsage = response.usage;
        estimatedCost = ((response.usage?.input_tokens || 0) * 0.003 + (response.usage?.output_tokens || 0) * 0.015) / 1000;
      }

      const riskLevel = !reportJson.allowsAggregation ? 'critical' :
        reportJson.requiresAttribution ? 'medium' : 'low';

      return {
        provider,
        reportType: 'tos_extraction',
        reportJson,
        riskLevel,
        flagged: !reportJson.allowsAggregation,
        processingTimeMs: Date.now() - startTime,
        tokenUsage,
        estimatedCost,
      };
    } catch (error) {
      console.error(`ToS extraction failed with ${provider}:`, error);
      throw error;
    }
  }

  async detectPII(
    listing: Partial<CanonicalListing>,
    provider: 'openai' | 'gemini' | 'anthropic' = 'gemini'
  ): Promise<ComplianceCheckResult> {
    const startTime = Date.now();

    const prompt = `Detect Personally Identifiable Information (PII) in this automotive listing:

Title: ${listing.title}
Description: ${listing.description}
Metadata: ${JSON.stringify(listing.meta)}

Find:
1. Phone numbers (Indian format: +91, 10-digit)
2. Email addresses
3. Personal names (exclude brand/model names)
4. Physical addresses
5. Risk score (0-100)

Return JSON only:
{
  "hasPII": boolean,
  "detectedFields": string[],
  "phoneNumbers": string[],
  "emailAddresses": string[],
  "names": string[],
  "addresses": string[],
  "riskScore": number
}`;

    let reportJson: PIIDetectionResult;
    let estimatedCost = 0;

    try {
      if (provider === 'gemini') {
        const result = await this.gemini.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: prompt,
        });
        reportJson = JSON.parse(result.text || '{}');
        estimatedCost = 0.00001;
      } else if (provider === 'openai') {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a data privacy expert detecting PII.' },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0,
        });
        reportJson = JSON.parse(response.choices[0].message.content || '{}');
        estimatedCost = ((response.usage?.prompt_tokens || 0) * 0.00015 + (response.usage?.completion_tokens || 0) * 0.0006) / 1000;
      } else {
        const response = await this.anthropic.messages.create({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        });
        const content = response.content[0];
        reportJson = JSON.parse(content.type === 'text' ? content.text : '{}');
        estimatedCost = ((response.usage?.input_tokens || 0) * 0.001 + (response.usage?.output_tokens || 0) * 0.005) / 1000;
      }

      const riskLevel = reportJson.riskScore > 70 ? 'critical' :
        reportJson.riskScore > 40 ? 'high' :
        reportJson.riskScore > 20 ? 'medium' : 'low';

      return {
        provider,
        reportType: 'pii_detection',
        reportJson,
        riskLevel,
        flagged: reportJson.hasPII && reportJson.riskScore > 40,
        processingTimeMs: Date.now() - startTime,
        estimatedCost,
      };
    } catch (error) {
      console.error(`PII detection failed with ${provider}:`, error);
      throw error;
    }
  }

  async checkCopyright(
    listing: Partial<CanonicalListing>,
    provider: 'anthropic' | 'openai' = 'anthropic'
  ): Promise<ComplianceCheckResult> {
    const startTime = Date.now();

    const prompt = `Analyze copyright risks in these automotive listing images:

Image URLs: ${JSON.stringify(listing.images)}
Title: ${listing.title}
Description: ${listing.description}

Detect:
1. Stock photo watermarks (Getty, Shutterstock, etc.)
2. Brand logos (not car manufacturer logos)
3. Third-party copyrighted content
4. Risk score (0-100)

Return JSON only:
{
  "hasCopyrightIssues": boolean,
  "stockPhotos": string[],
  "watermarkedImages": string[],
  "brandLogos": string[],
  "thirdPartyContent": string[],
  "riskScore": number
}`;

    let reportJson: CopyrightCheckResult;
    let estimatedCost = 0;

    try {
      if (provider === 'anthropic') {
        const response = await this.anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        });
        const content = response.content[0];
        reportJson = JSON.parse(content.type === 'text' ? content.text : '{}');
        estimatedCost = ((response.usage?.input_tokens || 0) * 0.003 + (response.usage?.output_tokens || 0) * 0.015) / 1000;
      } else {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: 'You are a copyright compliance expert.' },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' },
        });
        reportJson = JSON.parse(response.choices[0].message.content || '{}');
        estimatedCost = ((response.usage?.prompt_tokens || 0) * 0.0025 + (response.usage?.completion_tokens || 0) * 0.01) / 1000;
      }

      const riskLevel = reportJson.riskScore > 60 ? 'high' :
        reportJson.riskScore > 30 ? 'medium' : 'low';

      return {
        provider,
        reportType: 'copyright_check',
        reportJson,
        riskLevel,
        flagged: reportJson.hasCopyrightIssues && reportJson.riskScore > 50,
        processingTimeMs: Date.now() - startTime,
        estimatedCost,
      };
    } catch (error) {
      console.error(`Copyright check failed with ${provider}:`, error);
      throw error;
    }
  }

  async normalizeListing(
    rawData: any,
    sourceType: string,
    provider: 'openai' | 'gemini' = 'openai'
  ): Promise<ComplianceCheckResult> {
    const startTime = Date.now();

    const prompt = `Normalize this automotive listing data to canonical format:

Source Type: ${sourceType}
Raw Data: ${JSON.stringify(rawData)}

Map to canonical schema:
{
  "title": string,
  "make": string,
  "model": string,
  "variant": string,
  "year": number,
  "priceAmount": number,
  "priceCurrency": "INR",
  "kms": number,
  "fuel": string,
  "transmission": string,
  "ownerCount": number,
  "city": string,
  "pincode": string,
  "images": string[],
  "description": string,
  "confidence": number (0-1),
  "missingFields": string[],
  "inferredFields": [{ "field": string, "value": any, "confidence": number }]
}`;

    let reportJson: NormalizationResult;
    let estimatedCost = 0;

    try {
      if (provider === 'openai') {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a data normalization expert for automotive listings.' },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' },
        });
        reportJson = JSON.parse(response.choices[0].message.content || '{}');
        estimatedCost = ((response.usage?.prompt_tokens || 0) * 0.00015 + (response.usage?.completion_tokens || 0) * 0.0006) / 1000;
      } else {
        const result = await this.gemini.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: prompt,
        });
        reportJson = JSON.parse(result.text || '{}');
        estimatedCost = 0.00001;
      }

      const riskLevel = reportJson.confidence < 0.5 ? 'high' :
        reportJson.confidence < 0.8 ? 'medium' : 'low';

      return {
        provider,
        reportType: 'normalization',
        reportJson,
        riskLevel,
        flagged: reportJson.confidence < 0.6,
        processingTimeMs: Date.now() - startTime,
        estimatedCost,
      };
    } catch (error) {
      console.error(`Normalization failed with ${provider}:`, error);
      throw error;
    }
  }

  async runFullCompliance(
    listing: Partial<CanonicalListing>,
    sourceUrl: string,
    htmlContent?: string
  ): Promise<ComplianceCheckResult[]> {
    const results: ComplianceCheckResult[] = [];

    try {
      if (htmlContent) {
        results.push(await this.extractToS(sourceUrl, htmlContent, 'openai'));
      }

      results.push(await this.detectPII(listing, 'gemini'));

      if (listing.images && listing.images.length > 0) {
        results.push(await this.checkCopyright(listing, 'anthropic'));
      }

      return results;
    } catch (error) {
      console.error('Full compliance check failed:', error);
      return results;
    }
  }
}
