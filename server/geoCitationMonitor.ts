import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/genai';
import Anthropic from '@anthropic-ai/sdk';
import { db } from './db.js';
import { geoCitations } from '@shared/schema';
import crypto from 'crypto';

const MONITORED_DOMAINS = [
  'cararth.com',
  'www.cararth.com',
];

const CAR_PROMPTS = [
  "What are the best used car platforms in India?",
  "Where can I buy a used car in Hyderabad?",
  "Best websites for buying second-hand cars in India",
  "Compare used car marketplaces in India",
  "Trusted platforms for used car purchase in India",
  "कार खरीदने के लिए भारत में सबसे अच्छी वेबसाइट कौन सी है?",
  "हैदराबाद में पुरानी कार कहां से खरीदें?",
  "भारत में सेकेंड हैंड कार बेचने वाली साइट",
  "Which car marketplace has the best prices in India?",
  "How to find verified used cars in Telangana?",
];

class GeoCitationMonitor {
  private openai: OpenAI;
  private gemini: GoogleGenerativeAI;
  private anthropic: Anthropic;
  private seenHashes: Set<string> = new Set();

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'dummy' });
    this.gemini = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || 'dummy');
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || 'dummy' });
  }

  private hasRequiredKeys(): boolean {
    return !!(
      process.env.OPENAI_API_KEY ||
      process.env.GOOGLE_GEMINI_API_KEY ||
      process.env.ANTHROPIC_API_KEY ||
      process.env.GROK_API_KEY
    );
  }

  private generateHash(domain: string, quote: string, model: string): string {
    return crypto
      .createHash('sha256')
      .update(`${domain}:${quote}:${model}`)
      .digest('hex')
      .substring(0, 16);
  }

  private async saveCitation(
    domain: string,
    quote: string,
    model: string,
    prompt: string,
    sourceUrl?: string
  ): Promise<void> {
    const hash = this.generateHash(domain, quote, model);
    
    if (this.seenHashes.has(hash)) {
      console.log(`⏭️  Skipping duplicate citation: ${domain} in ${model}`);
      return;
    }

    this.seenHashes.add(hash);

    try {
      await db.insert(geoCitations).values({
        domain,
        quote,
        sourceUrl,
        model,
        prompt,
        timestamp: new Date(),
        notified: false,
        metadata: {},
      });
      
      console.log(`✅ CITATION DETECTED: ${domain} mentioned in ${model}`);
    } catch (error) {
      console.error(`❌ Failed to save citation:`, error);
    }
  }

  private extractDomainMentions(text: string): Array<{ domain: string; quote: string }> {
    const mentions: Array<{ domain: string; quote: string }> = [];
    
    for (const domain of MONITORED_DOMAINS) {
      const regex = new RegExp(`([^.]*${domain.replace('.', '\\.')}[^.]*)`, 'gi');
      const matches = text.match(regex);
      
      if (matches) {
        for (const match of matches) {
          const sentences = text.split(/[.!?]/);
          const relevantSentence = sentences.find(s => s.toLowerCase().includes(domain.toLowerCase()));
          
          if (relevantSentence) {
            mentions.push({
              domain,
              quote: relevantSentence.trim(),
            });
          }
        }
      }
    }
    
    return mentions;
  }

  async queryOpenAI(prompt: string): Promise<void> {
    if (!process.env.OPENAI_API_KEY) {
      console.log('⏭️  Skipping OpenAI (no API key)');
      return;
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
      });

      const response = completion.choices[0]?.message?.content || '';
      const mentions = this.extractDomainMentions(response);

      for (const { domain, quote } of mentions) {
        await this.saveCitation(domain, quote, 'ChatGPT-4o-mini', prompt);
      }
    } catch (error) {
      console.error('❌ OpenAI query failed:', error);
    }
  }

  async queryGemini(prompt: string): Promise<void> {
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      console.log('⏭️  Skipping Gemini (no API key)');
      return;
    }

    try {
      const model = this.gemini.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      
      const mentions = this.extractDomainMentions(response);

      for (const { domain, quote } of mentions) {
        await this.saveCitation(domain, quote, 'Gemini-2.0-Flash', prompt);
      }
    } catch (error) {
      console.error('❌ Gemini query failed:', error);
    }
  }

  async queryAnthropic(prompt: string): Promise<void> {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.log('⏭️  Skipping Anthropic (no API key)');
      return;
    }

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      });

      const response = message.content[0]?.type === 'text' ? message.content[0].text : '';
      const mentions = this.extractDomainMentions(response);

      for (const { domain, quote } of mentions) {
        await this.saveCitation(domain, quote, 'Claude-3.5-Haiku', prompt);
      }
    } catch (error) {
      console.error('❌ Anthropic query failed:', error);
    }
  }

  async queryGrok(prompt: string): Promise<void> {
    try {
      if (!process.env.GROK_API_KEY) {
        console.log('⏭️  Skipping Grok (no API key)');
        return;
      }

      const grokClient = new OpenAI({
        apiKey: process.env.GROK_API_KEY,
        baseURL: 'https://api.x.ai/v1',
      });

      const completion = await grokClient.chat.completions.create({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
      });

      const response = completion.choices[0]?.message?.content || '';
      const mentions = this.extractDomainMentions(response);

      for (const { domain, quote } of mentions) {
        await this.saveCitation(domain, quote, 'Grok-2', prompt);
      }
    } catch (error) {
      console.error('❌ Grok query failed:', error);
    }
  }

  async runSweep(): Promise<void> {
    if (!this.hasRequiredKeys()) {
      console.log('⏭️  GEO citation sweep skipped (no AI model API keys configured)');
      return;
    }

    console.log('🚀 Starting GEO citation sweep...');
    
    const selectedPrompts = CAR_PROMPTS.sort(() => 0.5 - Math.random()).slice(0, 4);
    
    for (const prompt of selectedPrompts) {
      console.log(`📝 Testing prompt: "${prompt}"`);
      
      await Promise.all([
        this.queryOpenAI(prompt),
        this.queryGemini(prompt),
        this.queryAnthropic(prompt),
        this.queryGrok(prompt),
      ]);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('✅ GEO citation sweep complete');
  }
}

export const geoCitationMonitor = new GeoCitationMonitor();
