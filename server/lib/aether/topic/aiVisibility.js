import { OpenAI } from 'openai';

/**
 * AI Visibility Service
 * Runs GEO sweeps to determine if AI models mention domains for given topics
 */

const AETHER_DAILY_TOKEN_CAP = parseInt(process.env.AETHER_DAILY_TOKEN_CAP || '100000', 10);
const TOKEN_WARNING_THRESHOLD = 0.8; // Warn at 80% of daily cap

// In-memory token usage tracker (would use Redis in production)
let dailyTokenUsage = 0;
let lastResetDate = new Date().toDateString();

// Simple in-memory cache for GEO sweeps (would use Redis in production)
const geoCache = new Map();
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

/**
 * Reset daily token counter if it's a new day
 */
function resetDailyTokensIfNeeded() {
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    console.log(`[AIVisibility] Resetting daily token usage (was: ${dailyTokenUsage})`);
    dailyTokenUsage = 0;
    lastResetDate = today;
  }
}

/**
 * Check if we're within daily token cap
 * @returns {boolean} True if we can make more API calls
 */
function canMakeAPICall() {
  resetDailyTokensIfNeeded();
  return dailyTokenUsage < AETHER_DAILY_TOKEN_CAP;
}

/**
 * Record token usage
 * @param {number} tokens - Number of tokens used
 */
function recordTokenUsage(tokens) {
  dailyTokenUsage += tokens;
  
  if (dailyTokenUsage >= AETHER_DAILY_TOKEN_CAP * TOKEN_WARNING_THRESHOLD) {
    console.warn(`[AIVisibility] WARNING: Token usage at ${Math.round((dailyTokenUsage / AETHER_DAILY_TOKEN_CAP) * 100)}% of daily cap`);
  }
}

/**
 * Get current token usage stats
 * @returns {Object} Token usage statistics
 */
export function getTokenUsageStats() {
  resetDailyTokensIfNeeded();
  return {
    used: dailyTokenUsage,
    limit: AETHER_DAILY_TOKEN_CAP,
    percentage: Math.round((dailyTokenUsage / AETHER_DAILY_TOKEN_CAP) * 100),
    remaining: AETHER_DAILY_TOKEN_CAP - dailyTokenUsage
  };
}

/**
 * Generate cache key for GEO sweep
 * @param {string} provider - AI provider (openai, claude, etc.)
 * @param {string} model - Model name
 * @param {string} query - Search query
 * @returns {string} Cache key
 */
function getCacheKey(provider, model, query) {
  return `${provider}|${model}|${query}`;
}

/**
 * Get cached GEO result
 * @param {string} provider - AI provider
 * @param {string} model - Model name
 * @param {string} query - Search query
 * @returns {Object|null} Cached result or null
 */
function getCachedResult(provider, model, query) {
  const key = getCacheKey(provider, model, query);
  const cached = geoCache.get(key);
  
  if (!cached) return null;
  
  // Check if cache is still valid
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    geoCache.delete(key);
    return null;
  }
  
  console.log(`[AIVisibility] Cache hit for ${key}`);
  return cached.data;
}

/**
 * Set cache for GEO result
 * @param {string} provider - AI provider
 * @param {string} model - Model name
 * @param {string} query - Search query
 * @param {Object} data - Result data to cache
 */
function setCachedResult(provider, model, query, data) {
  const key = getCacheKey(provider, model, query);
  geoCache.set(key, {
    data,
    timestamp: Date.now()
  });
  console.log(`[AIVisibility] Cached result for ${key}`);
}

/**
 * Run GEO sweep using OpenAI
 * @param {string} query - Search query
 * @param {string} city - Target city
 * @returns {Promise<Object>} GEO sweep results
 */
async function runOpenAISweep(query, city) {
  const model = 'gpt-4o-mini'; // Cost-effective model
  const cached = getCachedResult('openai', model, `${query} ${city}`);
  
  if (cached) {
    return { ...cached, cached: true };
  }
  
  if (!canMakeAPICall()) {
    console.warn(`[AIVisibility] Daily token cap reached, using cached data only`);
    return null;
  }
  
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  try {
    const prompt = `You are helping with SEO research for the Indian used car market.

Query: "${query} in ${city}"

Task: List the top 5 most relevant and authoritative websites where someone should look for this information. Include the domain name and a brief reason why.

Format your response as a JSON array:
[
  {"domain": "example.com", "reason": "Brief explanation"},
  ...
]

Focus on Indian websites that actually provide this information.`;

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: 'You are an SEO research assistant specializing in the Indian automotive market.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });
    
    const response = completion.choices[0].message.content;
    const tokens = completion.usage.total_tokens;
    
    recordTokenUsage(tokens);
    
    // Parse response
    const parsedResponse = JSON.parse(response);
    const mentions = Array.isArray(parsedResponse) ? parsedResponse : parsedResponse.websites || [];
    
    const result = {
      provider: 'openai',
      model,
      mentions: mentions.map(m => ({
        domain: m.domain,
        reason: m.reason,
        position: mentions.indexOf(m) + 1
      })),
      tokensUsed: tokens,
      cached: false
    };
    
    setCachedResult('openai', model, `${query} ${city}`, result);
    
    return result;
  } catch (error) {
    console.error(`[AIVisibility] OpenAI sweep failed:`, error.message);
    return null;
  }
}

/**
 * Calculate AI visibility metrics from sweep results
 * @param {Array} sweepResults - Results from multiple AI sweeps
 * @param {Array} serpDomains - Domains from SERP results
 * @returns {Object} Visibility metrics
 */
function calculateVisibilityMetrics(sweepResults, serpDomains) {
  const allMentions = [];
  const domainMentionCount = {};
  const domainFirstMentions = {};
  
  // Aggregate all mentions across sweeps
  for (const sweep of sweepResults) {
    if (!sweep) continue;
    
    sweep.mentions.forEach(mention => {
      allMentions.push(mention);
      
      const domain = mention.domain.replace('www.', '');
      domainMentionCount[domain] = (domainMentionCount[domain] || 0) + 1;
      
      // Track first-mention position
      if (!domainFirstMentions[domain] || mention.position < domainFirstMentions[domain]) {
        domainFirstMentions[domain] = mention.position;
      }
    });
  }
  
  // Calculate mention rate (how often domain appears across sweeps)
  const totalSweeps = sweepResults.filter(s => s).length;
  const mentionsByDomain = Object.entries(domainMentionCount).map(([domain, count]) => ({
    domain,
    mentionRate: count / totalSweeps,
    firstMentionPos: domainFirstMentions[domain],
    mentions: count
  }));
  
  // Calculate first-mention share (how often domain is mentioned first)
  const firstMentionShare = {};
  sweepResults.forEach(sweep => {
    if (!sweep || sweep.mentions.length === 0) return;
    const firstDomain = sweep.mentions[0].domain.replace('www.', '');
    firstMentionShare[firstDomain] = (firstMentionShare[firstDomain] || 0) + 1;
  });
  
  // Normalize first-mention share
  Object.keys(firstMentionShare).forEach(domain => {
    firstMentionShare[domain] = firstMentionShare[domain] / totalSweeps;
  });
  
  // Calculate overall GEO score (0-1 scale)
  const avgMentionRate = mentionsByDomain.length > 0
    ? mentionsByDomain.reduce((sum, m) => sum + m.mentionRate, 0) / mentionsByDomain.length
    : 0;
  
  const avgFirstMentionShare = Object.values(firstMentionShare).length > 0
    ? Object.values(firstMentionShare).reduce((sum, s) => sum + s, 0) / Object.values(firstMentionShare).length
    : 0;
  
  // Weighted score: 60% mention rate, 40% first-mention share
  const geoScore = (avgMentionRate * 0.6) + (avgFirstMentionShare * 0.4);
  
  return {
    geo_score_raw: geoScore,
    mentions_by_domain: mentionsByDomain,
    first_mention_share: firstMentionShare,
    total_sweeps: totalSweeps,
    cache_hit_rate: sweepResults.filter(s => s?.cached).length / totalSweeps
  };
}

/**
 * Run AI visibility analysis for a topic
 * @param {string} query - Search query
 * @param {string} city - Target city
 * @param {Array} serpDomains - Domains from SERP results
 * @returns {Promise<Object>} AI visibility metrics
 */
export async function analyzeAIVisibility(query, city, serpDomains = []) {
  console.log(`[AIVisibility] Running GEO analysis for: ${query} (${city})`);
  
  const sweepResults = [];
  
  // Run OpenAI sweep
  if (process.env.OPENAI_API_KEY) {
    const openaiResult = await runOpenAISweep(query, city);
    sweepResults.push(openaiResult);
  } else {
    console.log(`[AIVisibility] OpenAI key not configured, skipping OpenAI sweep`);
  }
  
  // Future: Add Claude, Gemini, Perplexity sweeps here
  
  // If no sweeps ran, use mock data
  if (sweepResults.filter(s => s).length === 0) {
    console.log(`[AIVisibility] No API keys configured, using mock data`);
    
    const mockMentions = serpDomains.slice(0, 5).map((domain, index) => ({
      domain,
      reason: 'Mock data - API key needed for real analysis',
      position: index + 1
    }));
    
    sweepResults.push({
      provider: 'mock',
      model: 'mock',
      mentions: mockMentions,
      tokensUsed: 0,
      cached: false
    });
  }
  
  // Calculate metrics
  const metrics = calculateVisibilityMetrics(sweepResults, serpDomains);
  
  return {
    ...metrics,
    sweeps: sweepResults.filter(s => s),
    token_usage: getTokenUsageStats(),
    mock: !process.env.OPENAI_API_KEY
  };
}
