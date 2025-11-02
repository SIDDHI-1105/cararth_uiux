import OpenAI from "openai";
import type { InsertGeoSweep, GeoSweep } from "@shared/schema";
import { logError, ErrorCategory, createAppError } from "./errorHandling.js";

export class AetherService {
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is required for AETHER");
    }
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Run a GEO sweep - query AI with a prompt and detect CarArth mentions
   */
  async runGeoSweep(params: {
    promptText: string;
    promptCategory?: string;
    model?: string;
  }): Promise<Omit<InsertGeoSweep, 'sweepType'>> {
    const startTime = Date.now();
    const model = params.model || "gpt-4o-mini";

    try {
      console.log(`🔍 Running GEO sweep with prompt: "${params.promptText.substring(0, 100)}..."`);

      // Query OpenAI
      const completion = await this.openai.chat.completions.create({
        model,
        messages: [
          {
            role: "user",
            content: params.promptText,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const aiResponse = completion.choices[0]?.message?.content || "";
      const tokensUsed = completion.usage?.total_tokens || 0;

      // Detect CarArth mentions
      const cararthMentioned = this.detectCararthMention(aiResponse);
      const mentionData = cararthMentioned ? this.extractMentionContext(aiResponse) : {};
      const competitors = this.detectCompetitors(aiResponse);

      // Calculate cost (rough estimate: $0.15 per 1M input tokens, $0.60 per 1M output tokens for gpt-4o-mini)
      const inputTokens = completion.usage?.prompt_tokens || 0;
      const outputTokens = completion.usage?.completion_tokens || 0;
      const cost = (inputTokens * 0.15 / 1_000_000) + (outputTokens * 0.60 / 1_000_000);

      const duration = Date.now() - startTime;

      console.log(`   ✓ GEO sweep completed in ${duration}ms`);
      console.log(`   CarArth mentioned: ${cararthMentioned ? '✅ YES' : '❌ NO'}`);
      if (competitors.length > 0) {
        console.log(`   Competitors mentioned: ${competitors.join(', ')}`);
      }

      return {
        promptText: params.promptText,
        promptCategory: params.promptCategory || null,
        aiProvider: "openai",
        aiModel: model,
        aiResponse,
        cararthMentioned,
        mentionContext: mentionData.context || null,
        mentionPosition: mentionData.position || null,
        competitorsMentioned: competitors,
        responseQuality: null,
        relevanceScore: null,
        sweepDuration: duration,
        tokensUsed,
        cost: cost.toString(),
      };
    } catch (error) {
      logError(error as Error, ErrorCategory.EXTERNAL_API, "GEO sweep failed");
      throw createAppError("Failed to run GEO sweep", 500, ErrorCategory.EXTERNAL_API);
    }
  }

  /**
   * Run multiple GEO sweeps in batch
   */
  async runBatchSweeps(prompts: Array<{ text: string; category?: string }>): Promise<Array<Omit<InsertGeoSweep, 'sweepType'>>> {
    console.log(`🔄 Running batch GEO sweep with ${prompts.length} prompts...`);
    
    const results = [];
    for (const prompt of prompts) {
      const result = await this.runGeoSweep({
        promptText: prompt.text,
        promptCategory: prompt.category,
      });
      results.push(result);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`   ✓ Batch sweep completed: ${results.filter(r => r.cararthMentioned).length}/${results.length} mentioned CarArth`);
    
    return results;
  }

  /**
   * Detect if CarArth is mentioned in the response
   */
  private detectCararthMention(text: string): boolean {
    const patterns = [
      /cararth/i,
      /car[\s\-_]*arth/i,
      /cara[\s\-_]*rth/i,
    ];
    return patterns.some(pattern => pattern.test(text));
  }

  /**
   * Extract context around CarArth mention
   */
  private extractMentionContext(text: string): { context?: string; position?: number } {
    // Case-insensitive match with flexible whitespace/punctuation
    const match = text.match(/(.{0,100}car[\s\-_]*arth.{0,100})/i);
    if (!match) return {};

    // Count platforms mentioned before this one to determine position
    const beforeText = text.substring(0, match.index || 0);
    // Look for common list patterns (numbered, bulleted, or paragraph separators)
    const platformMatches = beforeText.match(/(?:^|\n)\s*(?:\d+[\.\)]\s*|\-\s*|\*\s*)?[A-Z][a-z]+/g);
    const position = (platformMatches?.length || 0) + 1;

    return {
      context: match[0].trim(),
      position: position <= 10 ? position : null, // Only report if reasonable position
    };
  }

  /**
   * Detect competitor mentions (with common aliases)
   */
  private detectCompetitors(text: string): string[] {
    const competitorPatterns = [
      { name: "CarDekho", aliases: ["cardekho", "car dekho"] },
      { name: "Cars24", aliases: ["cars24", "cars 24", "car24"] },
      { name: "Spinny", aliases: ["spinny", "spinny autos"] },
      { name: "OLX", aliases: ["olx", "olx india", "olx.in"] },
      { name: "CarWale", aliases: ["carwale", "car wale"] },
      { name: "CarTrade", aliases: ["cartrade", "car trade"] },
      { name: "Droom", aliases: ["droom"] },
      { name: "CarGurus", aliases: ["cargurus", "car gurus"] },
      { name: "TrueCar", aliases: ["truecar", "true car"] },
      { name: "Autotrader", aliases: ["autotrader", "auto trader"] },
    ];

    const found = new Set<string>();
    const lowerText = text.toLowerCase();

    for (const competitor of competitorPatterns) {
      if (competitor.aliases.some(alias => lowerText.includes(alias))) {
        found.add(competitor.name);
      }
    }

    return Array.from(found);
  }
}

// Export singleton instance
export const aetherService = new AetherService();
