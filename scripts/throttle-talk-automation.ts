#!/usr/bin/env tsx
/**
 * Throttle Talk Automated Content Generator
 * 
 * Runs twice daily (9 AM/9 PM IST) to generate automotive news articles
 * Primary: Perplexity API → Fallback: xAI Grok
 * Features: Deduplication, source validation, exponential backoff, dry-run mode
 */

import { writeFileSync, appendFileSync, existsSync } from 'fs';
import { join } from 'path';

// Configuration from environment variables
const CONFIG = {
  PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY || '',
  XAI_API_KEY: process.env.XAI_API_KEY || process.env.GROK_API_KEY || '',
  CMS_ENDPOINT: process.env.CMS_ENDPOINT || 'https://www.cararth.com',
  CMS_API_KEY: process.env.CMS_API_KEY || '',
  ALERT_WEBHOOK: process.env.ALERT_WEBHOOK || '',
  NEWS_LOOKBACK_DAYS: parseInt(process.env.NEWS_LOOKBACK_DAYS || '14', 10),
  MAX_RETRIES: 5,
  INITIAL_BACKOFF_MS: 2000,
  RATE_LIMIT_MS: 1000, // 1 request per second
};

const LOG_FILE = join(process.cwd(), 'scripts', 'throttletalk.log');
const DRY_RUN = process.argv.includes('--dry-run');

// Logging utility
function log(level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS', message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  
  console.log(logMessage);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
  
  // Write to log file
  const fileLog = data 
    ? `${logMessage}\n${JSON.stringify(data, null, 2)}\n`
    : `${logMessage}\n`;
  
  try {
    appendFileSync(LOG_FILE, fileLog);
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
}

// Exponential backoff retry utility
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  context: string
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
    try {
      log('INFO', `${context} - Attempt ${attempt}/${CONFIG.MAX_RETRIES}`);
      return await fn();
    } catch (error: any) {
      lastError = error;
      log('WARN', `${context} - Attempt ${attempt} failed: ${error.message}`);
      
      if (attempt < CONFIG.MAX_RETRIES) {
        const backoffMs = CONFIG.INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
        log('INFO', `Backing off for ${backoffMs}ms before retry`);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }
  }
  
  throw lastError || new Error(`${context} failed after ${CONFIG.MAX_RETRIES} attempts`);
}

// String similarity calculation (Levenshtein-based)
function calculateSimilarity(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const maxLen = Math.max(len1, len2);
  return maxLen === 0 ? 100 : ((maxLen - matrix[len1][len2]) / maxLen) * 100;
}

// Fetch recent posts for deduplication
async function fetchRecentPosts(): Promise<Array<{ title: string; content: string; createdAt: Date }>> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - CONFIG.NEWS_LOOKBACK_DAYS);
  const fromDate = cutoffDate.toISOString().split('T')[0];
  
  const url = `${CONFIG.CMS_ENDPOINT}/api/news?from=${fromDate}&limit=100`;
  
  log('INFO', `Fetching recent posts from ${url}`);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch recent posts: ${response.status} ${response.statusText}`);
  }
  
  const posts = await response.json();
  log('SUCCESS', `Fetched ${posts.length} recent posts for deduplication`);
  
  return posts;
}

// Check if article is duplicate (title + first 80 chars combined)
function isDuplicate(
  title: string,
  content: string,
  recentPosts: Array<{ title: string; content: string }>
): boolean {
  const titleNormalized = title.toLowerCase().trim();
  const contentPreview = content.substring(0, 80).toLowerCase().trim();
  const combinedNew = `${titleNormalized} ${contentPreview}`;
  
  for (const post of recentPosts) {
    const postTitleNormalized = post.title.toLowerCase().trim();
    const postContentPreview = post.content.substring(0, 80).toLowerCase().trim();
    const combinedExisting = `${postTitleNormalized} ${postContentPreview}`;
    
    const combinedSimilarity = calculateSimilarity(combinedNew, combinedExisting);
    
    if (combinedSimilarity >= 85) {
      log('WARN', 'Duplicate detected', {
        newTitle: title,
        existingTitle: post.title,
        combinedSimilarity: `${combinedSimilarity.toFixed(2)}%`
      });
      return true;
    }
  }
  
  return false;
}

// Call Perplexity API
async function callPerplexityAPI(): Promise<string> {
  log('INFO', 'Calling Perplexity API for news generation');
  
  await new Promise(resolve => setTimeout(resolve, CONFIG.RATE_LIMIT_MS));
  
  const prompt = `You are Throttle Talk — CarArth.com's automotive intelligence engine. Using verified Indian sources (SIAM, VAHAN, Telangana RTA, Business Standard, Autocar India, CarDekho, Cars24, Spinny, Reddit r/CarsIndia, and LinkedIn public posts), generate a 280–400 word Throttle Talk article in Markdown that follows this exact format:

---
Title line (H1): e.g. \`India Used Car Market Grows 15.5% YoY\`  
by [Source Name or "Perplexity AI"] | Category: Market Insights | Date: ${new Date().toLocaleDateString('en-GB')}

### 📈 Summary:
3–5 sentences summarizing the top developments (used-car market, OEM performance, policy/EV trends).

### 🔍 Data Highlights:
- 📊 Market Size: ₹XXB (source)
- 🚗 Used/New Ratio: X.Xx (source)
- ⚡ EV Listings: +X% YoY (source)
- 🏢 Top OEM: [OEM Name] (source)

### 💡 AI Insight:
3–4 sentences synthesizing implications for dealers/buyers.

### ✅ Actionable Recommendations:
- 🎯 Dealer: short recommendation
- 🔋 Seller: short recommendation
- 🏎️ Buyer: short recommendation

### 📚 Sources:
- Source 1 — full URL
- Source 2 — full URL
- Source 3 — full URL

Closing line:
"All data reflects the most recent updates available from verified sources. Throttle Talk will continue to refine insights as new data becomes available."

Word count: 280–400 words. Use neutral, humble, analyst tone — not promotional. Cite sources inline in the Data Highlights and list full URLs in Sources. If a numeric value cannot be verified, write: "No current official data available for this metric." Deliver only the Markdown output—no explanatory text.`;

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CONFIG.PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar-pro',
      messages: [
        {
          role: 'system',
          content: 'You are a professional automotive market analyst for the Indian market. Generate well-researched, factual content with proper citations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500,
      stream: false
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Perplexity API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || '';
  
  if (!content) {
    throw new Error('Empty response from Perplexity API');
  }
  
  log('SUCCESS', `Perplexity API response received (${content.length} chars)`);
  return content;
}

// Call xAI Grok API (fallback)
async function callGrokAPI(): Promise<string> {
  log('INFO', 'Calling xAI Grok API as fallback');
  
  await new Promise(resolve => setTimeout(resolve, CONFIG.RATE_LIMIT_MS));
  
  const prompt = `You are Throttle Talk — CarArth.com's automotive intelligence engine. Using verified Indian sources (SIAM, VAHAN, Telangana RTA, Business Standard, Autocar India, CarDekho, Cars24, Spinny, Reddit r/CarsIndia, and LinkedIn public posts), generate a 280–400 word Throttle Talk article in Markdown that follows this exact format:

---
Title line (H1): e.g. \`India Used Car Market Grows 15.5% YoY\`  
by [Source Name or "xAI Grok"] | Category: Market Insights | Date: ${new Date().toLocaleDateString('en-GB')}

### 📈 Summary:
3–5 sentences summarizing the top developments (used-car market, OEM performance, policy/EV trends).

### 🔍 Data Highlights:
- 📊 Market Size: ₹XXB (source)
- 🚗 Used/New Ratio: X.Xx (source)
- ⚡ EV Listings: +X% YoY (source)
- 🏢 Top OEM: [OEM Name] (source)

### 💡 AI Insight:
3–4 sentences synthesizing implications for dealers/buyers.

### ✅ Actionable Recommendations:
- 🎯 Dealer: short recommendation
- 🔋 Seller: short recommendation
- 🏎️ Buyer: short recommendation

### 📚 Sources:
- Source 1 — full URL
- Source 2 — full URL
- Source 3 — full URL

Closing line:
"All data reflects the most recent updates available from verified sources. Throttle Talk will continue to refine insights as new data becomes available."

Word count: 280–400 words. Use neutral, humble, analyst tone — not promotional. Cite sources inline in the Data Highlights and list full URLs in Sources. If a numeric value cannot be verified, write: "No current official data available for this metric." Deliver only the Markdown output—no explanatory text.`;

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CONFIG.XAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'grok-beta',
      messages: [
        {
          role: 'system',
          content: 'You are a professional automotive market analyst for the Indian market. Generate well-researched, factual content with proper citations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500,
      stream: false
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`xAI Grok API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || '';
  
  if (!content) {
    throw new Error('Empty response from xAI Grok API');
  }
  
  log('SUCCESS', `xAI Grok API response received (${content.length} chars)`);
  return content;
}

// Generate article with fallback
async function generateArticle(): Promise<string> {
  try {
    return await retryWithBackoff(callPerplexityAPI, 'Perplexity API call');
  } catch (perplexityError: any) {
    log('ERROR', 'Perplexity API failed, falling back to xAI Grok', { error: perplexityError.message });
    
    try {
      return await retryWithBackoff(callGrokAPI, 'xAI Grok API call');
    } catch (grokError: any) {
      log('ERROR', 'Both Perplexity and xAI Grok failed', {
        perplexityError: perplexityError.message,
        grokError: grokError.message
      });
      
      // Send alert if webhook is configured
      if (CONFIG.ALERT_WEBHOOK) {
        await sendAlert({
          error: 'Content generation failed',
          perplexityError: perplexityError.message,
          grokError: grokError.message,
          timestamp: new Date().toISOString()
        });
      }
      
      throw new Error('All content generation APIs failed');
    }
  }
}

// Send error alert
async function sendAlert(payload: any): Promise<void> {
  if (!CONFIG.ALERT_WEBHOOK) return;
  
  try {
    await fetch(CONFIG.ALERT_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    log('SUCCESS', 'Alert sent to webhook');
  } catch (error) {
    log('ERROR', 'Failed to send alert', { error });
  }
}

// Validate and enforce source citations for numeric claims
function validateAndEnforceSourceCitations(markdown: string): string {
  const lines = markdown.split('\n');
  const validatedLines: string[] = [];
  let inDataHighlights = false;
  let citationIssues = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Track if we're in the Data Highlights section
    if (line.includes('### 🔍 Data Highlights:')) {
      inDataHighlights = true;
      validatedLines.push(line);
      continue;
    }
    
    // Exit Data Highlights section
    if (inDataHighlights && line.startsWith('###')) {
      inDataHighlights = false;
    }
    
    // Validate lines in Data Highlights section
    if (inDataHighlights && line.trim().startsWith('-')) {
      // Check if line contains numeric data (numbers, percentages, currency symbols)
      const hasNumericData = /\d+|₹|%|\+|-\d/.test(line);
      
      if (hasNumericData) {
        // Check if line has a source citation in parentheses
        const hasCitation = /\([^)]+\)/.test(line);
        
        if (!hasCitation) {
          // Replace uncited metric with standard message
          citationIssues++;
          const metricName = line.match(/- [📊🚗⚡🏢]\s*([^:]+):/)?.[1] || 'Metric';
          validatedLines.push(`- ${line.match(/- ([📊🚗⚡🏢])/)?.[1] || '📊'} ${metricName}: No current official data available for this metric`);
          log('WARN', `Uncited numeric claim replaced: "${line.trim()}"`);
          continue;
        }
      }
    }
    
    validatedLines.push(line);
  }
  
  if (citationIssues > 0) {
    log('WARN', `Source validation: ${citationIssues} uncited numeric claims replaced with "No current official data available"`);
  } else {
    log('SUCCESS', 'Source validation passed: All numeric claims properly cited');
  }
  
  return validatedLines.join('\n');
}

// Parse markdown to extract metadata
function parseMarkdown(markdown: string): {
  title: string;
  byline: string;
  category: string;
  date: string;
  content: string;
  sources: string[];
} {
  const lines = markdown.split('\n');
  const title = lines[0].replace(/^#\s*/, '').trim();
  
  const bylineMatch = markdown.match(/by (.+?) \|/);
  const byline = bylineMatch ? bylineMatch[1] : 'Throttle Talk AI';
  
  const categoryMatch = markdown.match(/Category: (.+?) \|/);
  const category = categoryMatch ? categoryMatch[1] : 'Market Insights';
  
  const dateMatch = markdown.match(/Date: (.+)/);
  const date = dateMatch ? dateMatch[1].trim() : new Date().toLocaleDateString('en-GB');
  
  // Extract sources
  const sourcesSection = markdown.match(/### 📚 Sources:\s*([\s\S]+?)(?:\n\n|$)/);
  const sources: string[] = [];
  if (sourcesSection) {
    const sourceLines = sourcesSection[1].split('\n').filter(line => line.trim().startsWith('-'));
    sourceLines.forEach(line => {
      const urlMatch = line.match(/https?:\/\/[^\s)]+/);
      if (urlMatch) {
        sources.push(urlMatch[0]);
      }
    });
  }
  
  return {
    title,
    byline,
    category,
    date,
    content: markdown,
    sources
  };
}

// Publish article to CMS
async function publishArticle(markdown: string): Promise<void> {
  const parsed = parseMarkdown(markdown);
  
  const payload = {
    title: parsed.title,
    byline: parsed.byline,
    category: parsed.category,
    date: parsed.date,
    markdown: parsed.content,
    sources: parsed.sources,
    tags: ['Market Data', 'Used Cars', 'Throttle Talk']
  };
  
  if (DRY_RUN) {
    log('INFO', '🧪 DRY RUN MODE - Article would be published with payload:');
    console.log(JSON.stringify(payload, null, 2));
    return;
  }
  
  log('INFO', `Publishing article to ${CONFIG.CMS_ENDPOINT}/api/news`);
  
  const response = await fetch(`${CONFIG.CMS_ENDPOINT}/api/news`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CONFIG.CMS_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to publish article: ${response.status} ${errorText}`);
  }
  
  log('SUCCESS', 'Article published successfully', { title: parsed.title });
}

// Main execution
async function main() {
  log('INFO', '🚀 Throttle Talk automation started');
  log('INFO', `Mode: ${DRY_RUN ? '🧪 DRY RUN' : '📡 LIVE'}`);
  
  try {
    // Step 1: Fetch recent posts for deduplication
    const recentPosts = await retryWithBackoff(fetchRecentPosts, 'Fetch recent posts');
    
    // Step 2: Generate article
    const rawMarkdown = await generateArticle();
    
    // Step 3: Validate and enforce source citations
    const markdown = validateAndEnforceSourceCitations(rawMarkdown);
    
    // Step 4: Parse and validate
    const parsed = parseMarkdown(markdown);
    log('INFO', 'Article generated', {
      title: parsed.title,
      wordCount: markdown.split(/\s+/).length,
      sourcesCount: parsed.sources.length
    });
    
    // Step 5: Check for duplicates
    if (isDuplicate(parsed.title, parsed.content, recentPosts)) {
      log('WARN', '⚠️  Duplicate content detected - skipping publication');
      return;
    }
    
    // Step 6: Publish
    await publishArticle(markdown);
    
    log('SUCCESS', '✅ Throttle Talk automation completed successfully');
    
  } catch (error: any) {
    log('ERROR', '❌ Throttle Talk automation failed', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

// Execute
main();
