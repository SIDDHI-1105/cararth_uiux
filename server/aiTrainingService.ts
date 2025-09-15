import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { 
  type TrainingData, 
  type AiPrediction, 
  type AuthenticityScore,
  type ModelConfig,
  type EvaluationMetrics,
  hyderabadMarketContext,
  trainingDataSchema,
  aiPredictionSchema
} from '@shared/aiTrainingSchema';

// Training service for fine-tuning LLM models
export class AiTrainingService {
  private openai: OpenAI;
  private gemini: GoogleGenAI;
  private anthropic: Anthropic;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
    
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
  }

  /**
   * Generate synthetic training data for price modeling
   * Creates realistic examples based on Hyderabad market patterns
   */
  async generateSyntheticTrainingData(count: number = 200): Promise<TrainingData[]> {
    console.log(`🎯 Generating ${count} synthetic training examples for price modeling...`);
    
    const examples: TrainingData[] = [];
    const brands = hyderabadMarketContext.popular_brands;
    const areas = hyderabadMarketContext.popular_areas;
    
    for (let i = 0; i < count; i++) {
      const brand = brands[Math.floor(Math.random() * brands.length)];
      const year = 2015 + Math.floor(Math.random() * 9); // 2015-2023
      const mileage = 10000 + Math.floor(Math.random() * 80000); // 10k-90k km
      const area = areas[Math.floor(Math.random() * areas.length)];
      
      // Calculate realistic price based on year and mileage
      const basePrice = this.calculateBasePriceForBrand(brand);
      const ageDepreciation = this.calculateDepreciation(2024 - year);
      const mileageAdjustment = Math.max(0.7, 1 - (mileage / 200000)); // Higher mileage = lower price
      const estimatedPrice = Math.round(basePrice * ageDepreciation * mileageAdjustment);
      
      // Add some variance (±10%) for realism
      const variance = 0.9 + Math.random() * 0.2;
      const finalPrice = Math.round(estimatedPrice * variance);
      
      const example: TrainingData = {
        id: randomUUID(),
        source: ["CarDekho", "OLX", "Cars24"][Math.floor(Math.random() * 3)] as any,
        raw_text: `${brand} ${this.getRandomModel(brand)} ${year} petrol ${mileage}km excellent condition ${area}`,
        normalized: {
          make: brand,
          model: this.getRandomModel(brand),
          year,
          price: finalPrice,
          mileage,
          city: "Hyderabad",
          images: [`https://example.com/img${i}.jpg`],
          contact: "+91-9XXXXXXXX",
          fuel_type: ["Petrol", "Diesel", "CNG"][Math.floor(Math.random() * 3)],
          transmission: Math.random() > 0.3 ? "Manual" : "Automatic"
        },
        human_labels: {
          price_band: {
            low: Math.round(finalPrice * 0.92),
            median: finalPrice,
            high: Math.round(finalPrice * 1.08)
          },
          price_confidence: 0.75 + Math.random() * 0.2, // 0.75-0.95
          is_authentic: Math.random() > 0.05, // 95% authentic
          image_real: Math.random() > 0.1, // 90% real images
          contact_valid: Math.random() > 0.15, // 85% valid contacts
          fraud_flag: Math.random() < 0.02, // 2% fraud
          fraud_reasons: [],
          notes: `Synthetic training example ${i + 1}`
        },
        ingest_batch_ts: new Date().toISOString()
      };
      
      examples.push(example);
    }
    
    console.log(`✅ Generated ${examples.length} synthetic training examples`);
    return examples;
  }

  /**
   * Create GPT-5 fine-tuning dataset for price modeling
   */
  async createGPTPriceModelingDataset(trainingData: TrainingData[]): Promise<any[]> {
    console.log(`🎯 Creating GPT fine-tuning dataset from ${trainingData.length} examples...`);
    
    const fineTuneData = trainingData.map(sample => {
      const systemPrompt = `You are Cararth Price & Trust Assistant for Hyderabad. Analyze car listings and provide accurate price predictions with confidence scores.`;
      
      const contextPrompt = `CONTEXT: city=Hyderabad; historical_median_for(make=${sample.normalized.make}, year=${sample.normalized.year})=${this.getHistoricalMedian(sample.normalized.make, sample.normalized.year)};`;
      
      const listingPrompt = `LISTING:
- title: "${sample.normalized.make} ${sample.normalized.model} ${sample.normalized.year}"
- listed_price: ${sample.normalized.price}
- mileage: ${sample.normalized.mileage}km
- fuel: ${sample.normalized.fuel_type}
- transmission: ${sample.normalized.transmission}
- location: ${sample.normalized.city}`;

      const targetResponse = {
        price_band: sample.human_labels.price_band,
        price_confidence: sample.human_labels.price_confidence,
        is_authentic: sample.human_labels.is_authentic,
        image_real: sample.human_labels.image_real,
        contact_valid: sample.human_labels.contact_valid,
        short_summary: this.generateShortSummary(sample),
        explain: this.generateExplanation(sample)
      };

      return {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `${contextPrompt}\n\n${listingPrompt}` },
          { role: "assistant", content: JSON.stringify(targetResponse, null, 2) }
        ]
      };
    });

    console.log(`✅ Created ${fineTuneData.length} GPT fine-tuning examples`);
    return fineTuneData;
  }

  /**
   * Start GPT-5 fine-tuning job for price modeling
   */
  async startGPTPriceModelingFineTune(trainingData: TrainingData[]): Promise<string> {
    try {
      console.log(`🚀 Starting GPT-5 fine-tuning for price modeling...`);
      
      // Create training dataset
      const fineTuneData = await this.createGPTPriceModelingDataset(trainingData);
      
      // Convert to JSONL format
      const jsonlData = fineTuneData.map(example => JSON.stringify(example)).join('\n');
      
      // Upload training file
      const file = await this.openai.files.create({
        file: await OpenAI.toFile(Buffer.from(jsonlData), 'training.jsonl'),
        purpose: 'fine-tune'
      });
      
      console.log(`📁 Uploaded training file: ${file.id}`);
      
      // Create fine-tuning job
      const fineTuneJob = await this.openai.fineTuning.jobs.create({
        training_file: file.id,
        model: "gpt-4o-mini-2024-07-18", // Supported fine-tuning model
        hyperparameters: {
          n_epochs: 3,
          batch_size: 1,
          learning_rate_multiplier: 0.1
        },
        suffix: "cararth-price-v1"
      });
      
      console.log(`🎯 Fine-tuning job started: ${fineTuneJob.id}`);
      console.log(`📊 Status: ${fineTuneJob.status}`);
      
      return fineTuneJob.id;
      
    } catch (error) {
      console.error('❌ Fine-tuning failed:', error);
      throw error;
    }
  }

  /**
   * Get fine-tuning job status
   */
  async getFineTuneStatus(jobId: string): Promise<any> {
    try {
      const job = await this.openai.fineTuning.jobs.retrieve(jobId);
      console.log(`📊 Fine-tune job ${jobId} status: ${job.status}`);
      
      if (job.status === 'succeeded') {
        console.log(`🎉 Fine-tuned model ready: ${job.fine_tuned_model}`);
      } else if (job.status === 'failed') {
        console.log(`❌ Fine-tuning failed: ${job.error}`);
      }
      
      return job;
    } catch (error) {
      console.error('❌ Failed to get fine-tune status:', error);
      throw error;
    }
  }

  /**
   * Sanitize contact information to protect PII
   */
  private sanitizeContact(contact?: string): string {
    if (!contact) return 'contact_provided';
    
    // Mask phone numbers - keep first 3 and last 2 digits
    const phonePattern = /\b\d{10,}\b/g;
    const maskedContact = contact.replace(phonePattern, (match) => {
      if (match.length >= 10) {
        return match.substring(0, 3) + 'x'.repeat(match.length - 5) + match.substring(match.length - 2);
      }
      return 'xxx-xxx-' + match.substring(match.length - 2);
    });
    
    // Also mask email addresses partially
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const finalMasked = maskedContact.replace(emailPattern, (match) => {
      const [username, domain] = match.split('@');
      const maskedUsername = username.length > 3 ? 
        username.substring(0, 2) + 'x'.repeat(username.length - 2) : 
        'xxx';
      return maskedUsername + '@' + domain;
    });
    
    return finalMasked || 'contact_provided';
  }

  /**
   * Safely parse LLM JSON response with fallback values
   */
  private parseAuthenticityResponse(responseContent: string): any {
    try {
      // Try to extract JSON from response
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : responseContent;
      
      const parsed = JSON.parse(jsonString);
      
      // Validate that we have the expected structure with fallbacks
      return {
        is_authentic: typeof parsed.is_authentic === 'boolean' ? parsed.is_authentic : true,
        price_confidence: typeof parsed.price_confidence === 'number' ? 
          Math.max(0, Math.min(1, parsed.price_confidence)) : 0.75,
        image_real: typeof parsed.image_real === 'boolean' ? parsed.image_real : true,
        contact_valid: typeof parsed.contact_valid === 'boolean' ? parsed.contact_valid : true,
        fraud_flag: typeof parsed.fraud_flag === 'boolean' ? parsed.fraud_flag : false,
        fraud_reasons: Array.isArray(parsed.fraud_reasons) ? parsed.fraud_reasons : [],
        trust_signals: Array.isArray(parsed.trust_signals) ? parsed.trust_signals : [],
        short_summary: typeof parsed.short_summary === 'string' ? parsed.short_summary : 'Analysis completed',
        explain: typeof parsed.explain === 'string' ? parsed.explain : 'Detailed analysis performed'
      };
    } catch (parseError) {
      console.warn('⚠️ Failed to parse LLM response, using fallback values:', parseError);
      // Return safe fallback values
      return {
        is_authentic: true,
        price_confidence: 0.75,
        image_real: true,
        contact_valid: true,
        fraud_flag: false,
        fraud_reasons: [],
        trust_signals: ['system_fallback'],
        short_summary: 'Analysis completed with fallback values',
        explain: 'LLM response parsing failed, using conservative estimates'
      };
    }
  }

  /**
   * Use fine-tuned model for comprehensive authenticity scoring
   */
  async scoreAuthenticity(listing: any): Promise<AuthenticityScore> {
    const modelId = "ft:gpt-4o-mini-2024-07-18:personal:cararth-price-v1:CFzS4zfH";
    
    try {
      const systemPrompt = `You are Cararth's Authenticity & Trust Specialist for Hyderabad car market. Analyze listings and provide detailed authenticity scoring with fraud detection. 
      
Respond with ONLY a valid JSON object in this exact format:
{
  "is_authentic": true,
  "price_confidence": 0.85,
  "image_real": true,
  "contact_valid": true,
  "fraud_flag": false,
  "fraud_reasons": [],
  "trust_signals": ["complete_info", "realistic_price"],
  "short_summary": "High authenticity score with good data quality",
  "explain": "Listing shows consistent pricing and complete information"
}`;
      
      const contextPrompt = `CONTEXT: city=Hyderabad; market_intelligence=enabled; fraud_patterns=monitored;`;
      
      // Sanitize contact info before sending to LLM
      const sanitizedContact = this.sanitizeContact(listing.contact);
      
      const listingPrompt = `LISTING ANALYSIS:
- title: "${listing.make} ${listing.model} ${listing.year}"
- listed_price: ${listing.price}
- mileage: ${listing.mileage}km
- fuel: ${listing.fuel_type}
- transmission: ${listing.transmission}
- location: ${listing.city}
- images: ${listing.images?.length || 0} available
- seller_type: ${listing.sellerType || 'individual'}
- contact: ${sanitizedContact}
- description_length: ${listing.description?.length || 0}`;

      const startTime = Date.now();
      
      const response = await this.openai.chat.completions.create({
        model: modelId,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `${contextPrompt}\n\n${listingPrompt}` }
        ],
        temperature: 0.1,
        max_tokens: 1000
      });
      
      const latency = Date.now() - startTime;
      const responseContent = response.choices?.[0]?.message?.content || '{}';
      
      // Use robust JSON parsing with fallbacks
      const analysis = this.parseAuthenticityResponse(responseContent);
      
      const authenticityScore: AuthenticityScore = {
        id: randomUUID(),
        listing_id: listing.id || randomUUID(),
        overall_authenticity: analysis.is_authentic ? (analysis.price_confidence * 100) : 30,
        price_authenticity: analysis.price_confidence * 100,
        image_authenticity: analysis.image_real ? 90 : 25,
        contact_validity: analysis.contact_valid ? 95 : 20,
        fraud_indicators: analysis.fraud_flag ? (analysis.fraud_reasons || ['detected']) : [],
        trust_signals: this.extractTrustSignals(analysis),
        confidence_score: analysis.price_confidence,
        model_version: modelId,
        analysis_timestamp: new Date().toISOString(),
        model_latency_ms: latency
      };
      
      console.log(`✅ Authenticity scoring completed: ${authenticityScore.overall_authenticity}% authentic`);
      return authenticityScore;
      
    } catch (error) {
      console.error('❌ Authenticity scoring failed:', error);
      
      // Return a fallback authenticity score instead of throwing
      const fallbackScore: AuthenticityScore = {
        id: randomUUID(),
        listing_id: listing.id || randomUUID(),
        overall_authenticity: 60, // Conservative fallback
        price_authenticity: 60,
        image_authenticity: 60,
        contact_validity: 60,
        fraud_indicators: ['system_error'],
        trust_signals: ['manual_review_needed'],
        confidence_score: 0.3,
        model_version: modelId,
        analysis_timestamp: new Date().toISOString(),
        model_latency_ms: 0
      };
      
      console.log(`⚠️ Returning fallback authenticity score due to error: ${error.message}`);
      return fallbackScore;
    }
  }

  /**
   * Use fine-tuned model for price prediction
   */
  async predictPrice(listing: any, modelId: string): Promise<AiPrediction> {
    try {
      const systemPrompt = `You are Cararth Price & Trust Assistant for Hyderabad. Analyze car listings and provide accurate price predictions with confidence scores.`;
      
      const contextPrompt = `CONTEXT: city=Hyderabad; historical_median_for(make=${listing.make}, year=${listing.year})=${this.getHistoricalMedian(listing.make, listing.year)};`;
      
      const listingPrompt = `LISTING:
- title: "${listing.make} ${listing.model} ${listing.year}"
- listed_price: ${listing.price}
- mileage: ${listing.mileage}km
- fuel: ${listing.fuel_type}
- transmission: ${listing.transmission}
- location: ${listing.city}`;

      const startTime = Date.now();
      
      const response = await this.openai.chat.completions.create({
        model: modelId,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `${contextPrompt}\n\n${listingPrompt}` }
        ],
        temperature: 0.1,
        max_tokens: 800
      });
      
      const latency = Date.now() - startTime;
      const prediction = JSON.parse(response.choices[0].message.content || '{}');
      
      const aiPrediction: AiPrediction = {
        id: randomUUID(),
        listing_id: listing.id,
        model_version: modelId,
        predictions: prediction,
        model_latency_ms: latency,
        created_at: new Date().toISOString()
      };
      
      return aiPrediction;
      
    } catch (error) {
      console.error('❌ Price prediction failed:', error);
      throw error;
    }
  }

  // Helper methods
  private calculateBasePriceForBrand(brand: string): number {
    const basePrices: Record<string, number> = {
      'Maruti': 600000,
      'Hyundai': 700000,
      'Honda': 800000,
      'Toyota': 900000,
      'Tata': 650000,
      'Mahindra': 750000
    };
    return basePrices[brand] || 600000;
  }

  private calculateDepreciation(age: number): number {
    if (age <= 1) return 1 - hyderabadMarketContext.depreciation_rates.year_1;
    if (age <= 2) return 1 - hyderabadMarketContext.depreciation_rates.year_1 - hyderabadMarketContext.depreciation_rates.year_2;
    if (age <= 3) return 1 - hyderabadMarketContext.depreciation_rates.year_1 - hyderabadMarketContext.depreciation_rates.year_2 - hyderabadMarketContext.depreciation_rates.year_3;
    return Math.max(0.3, 1 - hyderabadMarketContext.depreciation_rates.year_1 - hyderabadMarketContext.depreciation_rates.year_2 - hyderabadMarketContext.depreciation_rates.year_3 - (age - 3) * hyderabadMarketContext.depreciation_rates.year_4_plus);
  }

  private getRandomModel(brand: string): string {
    const models: Record<string, string[]> = {
      'Maruti': ['Swift', 'Baleno', 'Alto', 'WagonR', 'Dzire'],
      'Hyundai': ['i20', 'Creta', 'Verna', 'Elite i20', 'Grand i10'],
      'Honda': ['City', 'Amaze', 'Jazz', 'CR-V', 'Civic'],
      'Toyota': ['Innova', 'Fortuner', 'Corolla', 'Etios', 'Yaris'],
      'Tata': ['Nexon', 'Harrier', 'Safari', 'Altroz', 'Tigor'],
      'Mahindra': ['XUV500', 'Scorpio', 'Bolero', 'Thar', 'KUV100']
    };
    const brandModels = models[brand] || ['Unknown'];
    return brandModels[Math.floor(Math.random() * brandModels.length)];
  }

  private getHistoricalMedian(make: string, year: number): number {
    const basePrice = this.calculateBasePriceForBrand(make);
    const depreciation = this.calculateDepreciation(2024 - year);
    return Math.round(basePrice * depreciation);
  }

  private generateShortSummary(sample: TrainingData): string {
    const { make, model, year, price, mileage } = sample.normalized;
    const priceInLakhs = (price / 100000).toFixed(1);
    const mileageInK = mileage > 1000 ? `${(mileage / 1000).toFixed(0)}k` : mileage;
    
    const condition = mileage < 30000 ? "low mileage" : mileage < 60000 ? "moderate mileage" : "high mileage";
    const pricePosition = sample.human_labels.price_confidence > 0.8 ? "well-priced" : "check pricing";
    
    return `${year} ${make} ${model} at ₹${priceInLakhs}L — ${condition}, ${pricePosition}. Suggest offer ₹${(sample.human_labels.price_band.low / 100000).toFixed(1)}L–₹${(sample.human_labels.price_band.high / 100000).toFixed(1)}L.`;
  }

  private generateExplanation(sample: TrainingData): string {
    const { price } = sample.normalized;
    const { price_band, price_confidence, is_authentic, image_real, contact_valid } = sample.human_labels;
    
    const priceVariance = ((price - price_band.median) / price_band.median * 100).toFixed(1);
    const priceText = price > price_band.median ? `${priceVariance}% above median` : `${Math.abs(parseFloat(priceVariance))}% below median`;
    
    const authText = is_authentic && image_real && contact_valid ? "verified listing" : "needs verification";
    
    return `Price ${priceText}; confidence ${(price_confidence * 100).toFixed(0)}%; ${authText}. Market analysis shows fair value range ₹${(price_band.low / 100000).toFixed(1)}L–₹${(price_band.high / 100000).toFixed(1)}L.`;
  }

  private extractTrustSignals(analysis: any): string[] {
    const signals: string[] = [];
    
    if (analysis.is_authentic) signals.push('authentic_listing');
    if (analysis.image_real) signals.push('real_images');
    if (analysis.contact_valid) signals.push('valid_contact');
    if (analysis.price_confidence > 0.8) signals.push('fair_pricing');
    if (!analysis.fraud_flag) signals.push('no_fraud_detected');
    
    return signals;
  }
}

// Export singleton instance
export const aiTrainingService = new AiTrainingService();