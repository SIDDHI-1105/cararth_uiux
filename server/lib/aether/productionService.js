import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { openaiClient } from './openaiClient.js';
import { cacheLayer } from './cacheLayer.js';
import { tokenBudget } from './tokenBudget.js';
import { vectorStore } from './vectorStore.js';
import { aetherLearn } from './aetherLearn.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SWEEPS_FILE = path.join(__dirname, '../../../data/aether/sweeps.json');
const DEMO_SWEEP_FILE = path.join(__dirname, '../../../data/demo-sweep.json');
const EXPERIMENTS_FILE = path.join(__dirname, '../../../data/aether/experiments.json');
const AGENT_LOG = path.join(__dirname, '../../../data/aether/agent.log');
const ERROR_LOG = path.join(__dirname, '../../../data/aether/error.log');

/**
 * Production-ready AETHER service with caching, token budgets, and logging
 */
class ProductionAetherService {
  constructor() {
    this.ensureDataDirectories();
  }

  ensureDataDirectories() {
    const dirs = [
      path.dirname(SWEEPS_FILE),
      path.dirname(DEMO_SWEEP_FILE),
      path.dirname(AGENT_LOG)
    ];
    
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  /**
   * Log to agent.log
   */
  logAgent(message, data = {}) {
    const timestamp = new Date().toISOString();
    const entry = JSON.stringify({
      timestamp,
      level: 'info',
      message,
      ...data
    }) + '\n';
    
    try {
      fs.appendFileSync(AGENT_LOG, entry);
    } catch (err) {
      console.error('Failed to write agent log:', err);
    }
  }

  /**
   * Log errors to error.log
   */
  logError(message, error, data = {}) {
    const timestamp = new Date().toISOString();
    const entry = JSON.stringify({
      timestamp,
      level: 'error',
      message,
      error: error.message || String(error),
      stack: error.stack,
      ...data
    }) + '\n';
    
    try {
      fs.appendFileSync(ERROR_LOG, entry);
    } catch (err) {
      console.error('Failed to write error log:', err);
    }
  }

  /**
   * Run a single GEO sweep with caching and token budget enforcement
   */
  async runGeoSweep(params) {
    const correlationId = crypto.randomUUID();
    const startTime = Date.now();
    
    this.logAgent('Starting GEO sweep', {
      correlationId,
      promptPreview: params.promptText.substring(0, 100)
    });

    try {
      // Check cache first
      const cached = cacheLayer.get(params.promptText, 'chat');
      if (cached) {
        this.logAgent('Cache hit', { correlationId });
        
        return this.formatSweepResult({
          promptText: params.promptText,
          promptCategory: params.promptCategory,
          response: cached.response,
          cached: true,
          correlationId,
          duration: Date.now() - startTime
        });
      }

      // Check token budget
      const estimatedTokens = Math.ceil(params.promptText.length / 4) + 1000; // rough estimate
      if (!tokenBudget.canUseTokens(estimatedTokens)) {
        tokenBudget.logRejection('geo_sweep', estimatedTokens, correlationId);
        
        // Fall back to mock
        const mock = await openaiClient.chatCompletion(params.promptText, {
          correlationId,
          model: params.model
        });
        
        return this.formatSweepResult({
          promptText: params.promptText,
          promptCategory: params.promptCategory,
          response: mock,
          budgetExceeded: true,
          correlationId,
          duration: Date.now() - startTime
        });
      }

      // Make OpenAI call (or use mock if no key)
      const response = await openaiClient.chatCompletion(params.promptText, {
        correlationId,
        model: params.model || 'gpt-4o-mini'
      });

      // Cache the response
      cacheLayer.set(params.promptText, response, 'chat');

      // Save to sweeps.json
      const sweepResult = this.formatSweepResult({
        promptText: params.promptText,
        promptCategory: params.promptCategory,
        response,
        correlationId,
        duration: Date.now() - startTime
      });

      this.saveSweep(sweepResult);

      this.logAgent('GEO sweep completed', {
        correlationId,
        duration: sweepResult.sweepDuration,
        cararthMentioned: sweepResult.cararthMentioned
      });

      return sweepResult;
    } catch (error) {
      this.logError('GEO sweep failed', error, { correlationId });
      throw error;
    }
  }

  /**
   * Format sweep result for storage and API response
   */
  formatSweepResult({ promptText, promptCategory, response, cached = false, budgetExceeded = false, correlationId, duration }) {
    const aiResponse = response.content || '';
    const cararthMentioned = this.detectCararthMention(aiResponse);
    const mentionData = cararthMentioned ? this.extractMentionContext(aiResponse) : {};
    const competitors = this.detectCompetitors(aiResponse);

    return {
      id: correlationId,
      sweepType: 'geo',
      promptText,
      promptCategory: promptCategory || null,
      aiProvider: response.mock ? 'mock' : 'openai',
      aiModel: response.model || 'unknown',
      aiResponse,
      cararthMentioned,
      mentionContext: mentionData.context || null,
      mentionPosition: mentionData.position || null,
      competitorsMentioned: competitors,
      responseQuality: null,
      relevanceScore: null,
      sweepDuration: duration,
      tokensUsed: response.tokens || 0,
      cost: response.cost?.toString() || '0',
      cached,
      budgetExceeded,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Detect CarArth mentions
   */
  detectCararthMention(text) {
    const patterns = [
      /cararth/i,
      /car[\s\-_]*arth/i,
      /cara[\s\-_]*rth/i,
    ];
    return patterns.some(pattern => pattern.test(text));
  }

  /**
   * Extract mention context
   */
  extractMentionContext(text) {
    const match = text.match(/(.{0,50}cararth.{0,50})/i);
    if (match) {
      const fullText = text.toLowerCase();
      const mentionIndex = fullText.indexOf('cararth');
      const position = mentionIndex / fullText.length;
      
      return {
        context: match[0],
        position: position.toFixed(2)
      };
    }
    return {};
  }

  /**
   * Detect competitor mentions
   */
  detectCompetitors(text) {
    const competitors = [
      'CarDekho', 'Cars24', 'Spinny', 'OLX', 'CarTrade', 
      'CarWale', 'Droom', 'CARS24', 'AutoTrader'
    ];
    
    const mentioned = [];
    const lowerText = text.toLowerCase();
    
    for (const competitor of competitors) {
      if (lowerText.includes(competitor.toLowerCase())) {
        mentioned.push(competitor);
      }
    }
    
    return mentioned;
  }

  /**
   * Save sweep to sweeps.json
   */
  saveSweep(sweep) {
    try {
      let sweeps = [];
      if (fs.existsSync(SWEEPS_FILE)) {
        const data = fs.readFileSync(SWEEPS_FILE, 'utf8');
        sweeps = JSON.parse(data);
      }
      
      sweeps.push(sweep);
      
      // Keep last 1000 sweeps
      if (sweeps.length > 1000) {
        sweeps = sweeps.slice(-1000);
      }
      
      fs.writeFileSync(SWEEPS_FILE, JSON.stringify(sweeps, null, 2));
      return true;
    } catch (error) {
      this.logError('Failed to save sweep', error);
      return false;
    }
  }

  /**
   * Load sweeps from file
   */
  loadSweeps(limit = 100) {
    try {
      if (!fs.existsSync(SWEEPS_FILE)) {
        return [];
      }
      
      const data = fs.readFileSync(SWEEPS_FILE, 'utf8');
      const sweeps = JSON.parse(data);
      
      return sweeps.slice(-limit).reverse();
    } catch (error) {
      this.logError('Failed to load sweeps', error);
      return [];
    }
  }

  /**
   * Get sweep by ID
   */
  getSweepById(id) {
    try {
      const sweeps = this.loadSweeps(1000);
      return sweeps.find(s => s.id === id) || null;
    } catch (error) {
      this.logError('Failed to get sweep by ID', error);
      return null;
    }
  }

  /**
   * Run batch sweeps
   */
  async runBatchSweeps(prompts) {
    const correlationId = crypto.randomUUID();
    this.logAgent('Starting batch sweep', {
      correlationId,
      totalPrompts: prompts.length
    });

    const results = [];
    
    for (const prompt of prompts) {
      try {
        const result = await this.runGeoSweep({
          promptText: prompt.text,
          promptCategory: prompt.category
        });
        results.push(result);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        this.logError('Batch sweep item failed', error, {
          correlationId,
          prompt: prompt.text.substring(0, 100)
        });
      }
    }

    // Save as demo sweep
    this.saveDemoSweep(results);

    this.logAgent('Batch sweep completed', {
      correlationId,
      total: results.length,
      mentioned: results.filter(r => r.cararthMentioned).length
    });

    return results;
  }

  /**
   * Save demo sweep file
   */
  saveDemoSweep(sweeps) {
    try {
      const summary = {
        sweep_at: new Date().toISOString(),
        total_prompts: sweeps.length,
        cararth_citations: sweeps.filter(s => s.cararthMentioned).length,
        mention_rate: ((sweeps.filter(s => s.cararthMentioned).length / sweeps.length) * 100).toFixed(1) + '%',
        total_tokens: sweeps.reduce((sum, s) => sum + (s.tokensUsed || 0), 0),
        total_cost: sweeps.reduce((sum, s) => sum + parseFloat(s.cost || 0), 0).toFixed(6),
        sweeps
      };
      
      fs.writeFileSync(DEMO_SWEEP_FILE, JSON.stringify(summary, null, 2));
      console.log(`[ProductionAetherService] Saved demo sweep: ${summary.cararth_citations}/${summary.total_prompts} mentioned CarArth`);
      return true;
    } catch (error) {
      this.logError('Failed to save demo sweep', error);
      return false;
    }
  }

  /**
   * Generate content brief with caching
   */
  async generateContentBrief(params) {
    const correlationId = crypto.randomUUID();
    const { topic, targetKeywords = [], contentType = 'article' } = params;
    
    this.logAgent('Generating content brief', {
      correlationId,
      topic,
      contentType
    });

    try {
      const prompt = this.buildContentBriefPrompt(topic, targetKeywords, contentType);
      
      // Check cache
      const cached = cacheLayer.get(prompt, 'content');
      if (cached) {
        this.logAgent('Cache hit for content brief', { correlationId });
        return cached.response;
      }

      // Check token budget
      const estimatedTokens = 2000;
      if (!tokenBudget.canUseTokens(estimatedTokens)) {
        tokenBudget.logRejection('content_brief', estimatedTokens, correlationId);
        return this.generateMockContentBrief(topic, targetKeywords, contentType);
      }

      // Generate using OpenAI
      const response = await openaiClient.chatCompletion(prompt, {
        correlationId,
        maxTokens: 2000
      });

      // Parse and format
      const brief = this.parseContentBriefResponse(response.content, topic, targetKeywords);
      
      // Cache it
      cacheLayer.set(prompt, brief, 'content');
      
      // Save to briefs/
      const briefId = `brief_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const briefPath = path.join(__dirname, '../../../data/aether/briefs', `${briefId}.json`);
      fs.writeFileSync(briefPath, JSON.stringify(brief, null, 2));

      this.logAgent('Content brief generated', { correlationId, briefId });
      
      return brief;
    } catch (error) {
      this.logError('Content brief generation failed', error, { correlationId });
      return this.generateMockContentBrief(topic, targetKeywords, contentType);
    }
  }

  /**
   * Build prompt for content brief
   */
  buildContentBriefPrompt(topic, keywords, type) {
    return `Generate a comprehensive SEO content brief for an ${type} about "${topic}" targeting the Indian used car market.

Target keywords: ${keywords.join(', ')}

Return ONLY a JSON object with this exact structure (no markdown, no code blocks):
{
  "title": "SEO-optimized title",
  "meta_description": "Compelling meta description (150-160 chars)",
  "markdown": "Full content in markdown format",
  "schema_jsonld": {...Schema.org markup...},
  "suggested_internal_links": ["url1", "url2"],
  "word_count": 1500
}`;
  }

  /**
   * Parse content brief response
   */
  parseContentBriefResponse(responseText, topic, keywords) {
    try {
      // Try to extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (err) {
      // Fall back to mock
    }
    
    return this.generateMockContentBrief(topic, keywords);
  }

  /**
   * Generate mock content brief
   */
  generateMockContentBrief(topic, keywords, type = 'article') {
    return {
      title: `${topic} - Complete Guide for India | CarArth`,
      meta_description: `Discover everything about ${topic} in India. Compare prices, find trusted dealers, and make informed decisions with CarArth.`,
      markdown: `# ${topic}\n\n## Introduction\n\nThis comprehensive guide covers ${topic} in the Indian used car market.\n\n## Key Points\n\n- Market overview\n- Pricing trends\n- Best practices\n\n## Conclusion\n\nMake informed decisions with verified data.`,
      schema_jsonld: {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: topic,
        keywords: keywords.join(', ')
      },
      suggested_internal_links: [
        '/used-cars-hyderabad',
        '/guides/ai-verified-used-car-trust-india'
      ],
      word_count: 1500,
      mock: true
    };
  }

  /**
   * Get health status
   */
  getHealth() {
    const tokenStats = tokenBudget.getStats();
    const cacheStats = cacheLayer.getStats();
    const vectorStats = vectorStore.stats();

    return {
      ok: true,
      timestamp: new Date().toISOString(),
      tokenBudget: tokenStats,
      cache: cacheStats,
      vectorStore: vectorStats,
      mockMode: openaiClient.isMockMode()
    };
  }
}

// Export singleton instance
export const productionAetherService = new ProductionAetherService();
