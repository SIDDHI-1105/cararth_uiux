import OpenAI from 'openai';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TOKEN_USAGE_LOG = path.join(__dirname, '../../../data/aether/token_usage.log');
const MAX_RETRIES = 3;
const BASE_DELAY = 1000; // 1 second

class OpenAIClient {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.client = this.apiKey ? new OpenAI({ apiKey: this.apiKey }) : null;
    this.maxTokensPerPrompt = parseInt(process.env.AETHER_MAX_TOKENS_PER_PROMPT || '1200');
    
    // Ensure log directory exists
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    const logDir = path.dirname(TOKEN_USAGE_LOG);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  /**
   * Log token usage to file with timestamp
   */
  logTokenUsage(operation, tokens, cost, correlationId) {
    const timestamp = new Date().toISOString();
    const logEntry = JSON.stringify({
      timestamp,
      correlationId,
      operation,
      tokens,
      cost,
      model: 'gpt-4o-mini'
    }) + '\n';

    try {
      fs.appendFileSync(TOKEN_USAGE_LOG, logEntry);
    } catch (error) {
      console.error('Failed to log token usage:', error);
    }
  }

  /**
   * Generate deterministic mock response based on prompt hash
   */
  generateMockResponse(promptHash, operation = 'chat') {
    // Use hash to generate deterministic random values
    const hashBuffer = Buffer.from(promptHash, 'hex');
    const seed = hashBuffer.readUInt32BE(0);
    
    if (operation === 'chat') {
      // Deterministic cited boolean: true if last byte mod 5 < 2
      const cited = (hashBuffer[hashBuffer.length - 1] % 5) < 2;
      
      // Select competitor deterministically
      const competitors = ['CarDekho', 'Cars24', 'Spinny', 'OLX Autos', 'CarTrade'];
      const competitorIndex = hashBuffer[0] % competitors.length;
      const competitor = competitors[competitorIndex];
      
      // Generate response snippet
      const mockSnippets = [
        `For used cars in India, I'd recommend checking platforms like ${competitor} and other aggregators...`,
        `You can find reliable used car listings on ${competitor}, which offers verified sellers...`,
        `Popular options include ${competitor} and similar marketplaces that specialize in pre-owned vehicles...`,
        `${competitor} is a trusted platform for buying used cars with detailed listings and pricing...`,
        `I suggest exploring ${competitor} and comparing prices across multiple dealers...`
      ];
      
      const snippetIndex = hashBuffer[1] % mockSnippets.length;
      let snippet = mockSnippets[snippetIndex];
      
      // 20% chance to mention CarArth if cited is true
      if (cited && (hashBuffer[2] % 10) < 2) {
        snippet += ' CarArth is also worth checking for aggregated listings across India.';
      }
      
      return {
        content: snippet,
        cited,
        competitor,
        tokens: 150 + (seed % 100), // Deterministic token count
        finish_reason: 'stop'
      };
    } else if (operation === 'embeddings') {
      // Generate deterministic embedding vector (1536 dimensions for text-embedding-ada-002)
      const embedding = [];
      for (let i = 0; i < 1536; i++) {
        // Use hash as seed for deterministic pseudo-random values
        const value = Math.sin(seed + i) * 2 - 1; // Value between -1 and 1
        embedding.push(value);
      }
      
      // Normalize vector
      const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
      const normalized = embedding.map(val => val / magnitude);
      
      return {
        embedding: normalized,
        tokens: 8 + Math.floor(promptHash.length / 10)
      };
    }
    
    throw new Error(`Unknown operation: ${operation}`);
  }

  /**
   * Exponential backoff retry wrapper
   */
  async retryWithBackoff(fn, retries = MAX_RETRIES, delay = BASE_DELAY) {
    try {
      return await fn();
    } catch (error) {
      // Don't retry on authentication or rate limit errors
      if (error.status === 401 || error.status === 403) {
        throw error;
      }
      
      if (retries === 0) {
        throw error;
      }
      
      // Exponential backoff for transient errors
      if (error.status >= 500 || error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
        console.log(`Retry attempt remaining: ${retries}, waiting ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retryWithBackoff(fn, retries - 1, delay * 2);
      }
      
      throw error;
    }
  }

  /**
   * Chat completion with retry and token cap
   */
  async chatCompletion(prompt, options = {}) {
    const correlationId = options.correlationId || crypto.randomUUID();
    const promptHash = crypto.createHash('sha256').update(prompt).digest('hex');
    
    // If no API key, use deterministic mock
    if (!this.client) {
      console.log(`[AETHER OpenAI Mock] No API key, using deterministic mock for prompt hash: ${promptHash.substring(0, 8)}`);
      const mock = this.generateMockResponse(promptHash, 'chat');
      
      this.logTokenUsage('chat_mock', mock.tokens, 0, correlationId);
      
      return {
        content: mock.content,
        tokens: mock.tokens,
        model: 'mock-gpt-4o-mini',
        finish_reason: mock.finish_reason,
        mock: true,
        cited: mock.cited,
        competitor: mock.competitor
      };
    }

    // Real OpenAI call with retry
    const result = await this.retryWithBackoff(async () => {
      const completion = await this.client.chat.completions.create({
        model: options.model || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: Math.min(options.maxTokens || this.maxTokensPerPrompt, this.maxTokensPerPrompt),
        temperature: options.temperature ?? 0.7
      });

      return completion;
    });

    const content = result.choices[0]?.message?.content || '';
    const tokens = result.usage?.total_tokens || 0;
    const inputTokens = result.usage?.prompt_tokens || 0;
    const outputTokens = result.usage?.completion_tokens || 0;
    
    // Calculate cost (gpt-4o-mini pricing)
    const cost = (inputTokens * 0.15 / 1_000_000) + (outputTokens * 0.60 / 1_000_000);
    
    this.logTokenUsage('chat_completion', tokens, cost, correlationId);

    return {
      content,
      tokens,
      model: result.model,
      finish_reason: result.choices[0]?.finish_reason,
      cost,
      mock: false
    };
  }

  /**
   * Generate embeddings with retry
   */
  async embeddings(text, options = {}) {
    const correlationId = options.correlationId || crypto.randomUUID();
    const textHash = crypto.createHash('sha256').update(text).digest('hex');
    
    // If no API key, use deterministic mock
    if (!this.client) {
      console.log(`[AETHER OpenAI Mock] No API key, using deterministic mock embeddings for hash: ${textHash.substring(0, 8)}`);
      const mock = this.generateMockResponse(textHash, 'embeddings');
      
      this.logTokenUsage('embeddings_mock', mock.tokens, 0, correlationId);
      
      return {
        embedding: mock.embedding,
        tokens: mock.tokens,
        model: 'mock-text-embedding-ada-002',
        mock: true
      };
    }

    // Real OpenAI embeddings call with retry
    const result = await this.retryWithBackoff(async () => {
      const response = await this.client.embeddings.create({
        model: options.model || 'text-embedding-ada-002',
        input: text
      });

      return response;
    });

    const embedding = result.data[0]?.embedding || [];
    const tokens = result.usage?.total_tokens || 0;
    
    // Calculate cost (text-embedding-ada-002 pricing: $0.10 per 1M tokens)
    const cost = tokens * 0.10 / 1_000_000;
    
    this.logTokenUsage('embeddings', tokens, cost, correlationId);

    return {
      embedding,
      tokens,
      model: result.model,
      cost,
      mock: false
    };
  }

  /**
   * Check if client is using mock mode
   */
  isMockMode() {
    return !this.client;
  }
}

// Export singleton instance
export const openaiClient = new OpenAIClient();
