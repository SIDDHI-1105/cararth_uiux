/**
 * Automated Content Generation Pipeline
 * Uses Perplexity for news scanning + xAI Grok for article compilation
 * Generates 2-3 SEO-optimized articles per day for Throttle Talk
 */

import * as schedule from 'node-schedule';
import { db } from './db';
import { communityPosts, contentGenerationLogs } from '../shared/schema';
import { sql } from 'drizzle-orm';

interface PerplexitySnippet {
  title: string;
  snippet: string;
  url: string;
  date?: string;
  source: string;
}

interface GeneratedArticle {
  title: string;
  content: string;
  category: string;
  seoKeywords: string[];
  wordCount: number;
  backlinksCount: number;
}

export class AutomatedContentGenerator {
  private readonly perplexityApiKey: string;
  private readonly grokApiKey: string;
  private readonly perplexityUrl = 'https://api.perplexity.ai/chat/completions';
  private readonly grokUrl = 'https://api.x.ai/v1/chat/completions';
  private scheduledJob: schedule.Job | null = null;

  constructor() {
    this.perplexityApiKey = process.env.PERPLEXITY_API_KEY || '';
    this.grokApiKey = process.env.GROK_API_KEY || '';
    
    if (!this.perplexityApiKey) {
      console.warn('⚠️ PERPLEXITY_API_KEY not set - automated content generation disabled');
    }
    if (!this.grokApiKey) {
      console.warn('⚠️ GROK_API_KEY not set - automated content generation disabled');
    }
  }

  /**
   * Step 1: Scan for latest Indian auto news using Perplexity
   */
  async scanLatestAutoNews(): Promise<PerplexitySnippet[]> {
    const startTime = Date.now();
    
    try {
      console.log('🔍 Scanning latest Indian auto news with Perplexity...');
      
      const response = await fetch(this.perplexityUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.perplexityApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sonar-pro', // Real-time web search model
          messages: [
            {
              role: 'system',
              content: 'You are a news aggregator for the Indian automotive market. Provide concise, factual snippets with sources.'
            },
            {
              role: 'user',
              content: `Search for the latest articles and news snippets (last 7 days) about:
              
              - Indian used car market trends (EV subsidies, resale values, pricing)
              - Monsoon/seasonal car maintenance tips for popular brands (Maruti, Tata, Hyundai)
              - Market insights from SIAM reports, VAHAN data, government announcements
              - Regional trends in Delhi, Mumbai, Bangalore, Hyderabad markets
              - Team-BHP forum discussions, Autocar India, ZigWheels reports
              
              Return top 8-10 most relevant snippets with:
              - Title
              - Brief summary (2-3 sentences)
              - Source URL
              - Publication date (if available)
              - Source name
              
              Focus on practical, actionable information for buyers and sellers.`
            }
          ],
          temperature: 0.3,
          max_tokens: 2000,
          stream: false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Perplexity API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';
      const citations = data.citations || [];
      
      // Parse the response into structured snippets
      const snippets = this.parsePerplexityResponse(content, citations);
      
      const duration = Date.now() - startTime;
      console.log(`✅ Perplexity scan complete: ${snippets.length} snippets in ${duration}ms`);
      
      return snippets;
      
    } catch (error: any) {
      console.error('❌ Perplexity scan failed:', error.message);
      throw error;
    }
  }

  /**
   * Step 2: Generate article using xAI Grok from Perplexity snippets
   */
  async generateArticleWithGrok(snippets: PerplexitySnippet[]): Promise<GeneratedArticle> {
    const startTime = Date.now();
    
    try {
      console.log('🤖 Generating article with xAI Grok...');
      
      const snippetsText = snippets.map((s, i) => 
        `${i + 1}. ${s.title}\n   ${s.snippet}\n   Source: ${s.source} (${s.url})\n   Date: ${s.date || 'Recent'}`
      ).join('\n\n');
      
      const currentDate = new Date().toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      const response = await fetch(this.grokUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.grokApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'grok-2-latest',
          messages: [
            {
              role: 'system',
              content: `You are an ARAI-certified automotive expert writing for Throttle Talk, India's premier used car news platform. 
              
              Your articles are:
              - Engaging, informative, and keyword-rich for SEO
              - 1200-1800 words with proper structure
              - Include 4-6 natural backlinks to CarArth.com with diverse anchor text
              - Written in a conversational yet professional tone
              - Packed with actionable insights for Indian car buyers/sellers`
            },
            {
              role: 'user',
              content: `Based on these latest news snippets, write a comprehensive article for Throttle Talk:

${snippetsText}

Requirements:
1. **Title**: Catchy, keyword-rich (e.g., "2025 Diwali Used SUV Deals Under ₹10L: Mumbai Edition")
2. **Structure**:
   - H1: Engaging introduction (150-200 words)
   - H2 Sections: "Market Trends", "Buyer Tips", "Regional Insights", "Expert Analysis"
   - H3 Subheads within sections
   - Conclusion with call-to-action
3. **Content**:
   - Word count: 1200-1800 words
   - Include data points, statistics, price ranges in INR
   - Practical tips for buyers and sellers
   - Regional context (Delhi, Mumbai, Bangalore, Hyderabad)
4. **Backlinks** (4-6 total):
   - 60% branded anchors: "CarArth", "CarArth marketplace", "SIAM data on CarArth"
   - 40% keyword anchors: "used cars in Mumbai", "compare car prices", "Delhi used car market"
   - Natural placement in sentences
   - Link format: [anchor text](https://cararth.com)
5. **SEO**:
   - Meta description (150-160 chars)
   - 5-7 relevant keywords
   - Category tag (e.g., market-insights, buyer-guide, maintenance)

Output format:
---
TITLE: [Your catchy title]
CATEGORY: [Category]
KEYWORDS: keyword1, keyword2, keyword3, keyword4, keyword5
META_DESCRIPTION: [150-160 char description]
PUBLISH_DATE: ${currentDate}
---

[Article content in Markdown format with H1, H2, H3 headers, backlinks, and structured sections]

Write the article now.`
            }
          ],
          temperature: 0.7,
          max_tokens: 3000,
          stream: false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Grok API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const generatedContent = data.choices[0]?.message?.content || '';
      
      // Parse the generated article
      const article = this.parseGrokArticle(generatedContent);
      
      const duration = Date.now() - startTime;
      console.log(`✅ Grok article generated: "${article.title}" (${article.wordCount} words) in ${duration}ms`);
      
      return article;
      
    } catch (error: any) {
      console.error('❌ Grok generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Step 3: Publish article to database
   */
  async publishArticle(article: GeneratedArticle): Promise<string> {
    try {
      console.log('📝 Publishing article to database...');
      
      // Get admin user ID (or use system user)
      const adminUser = await db.query.users.findFirst({
        where: sql`role = 'admin'`,
      });
      
      const authorId = adminUser?.id || 'system-generator';
      
      const [publishedPost] = await db.insert(communityPosts).values({
        authorId,
        title: article.title,
        content: article.content,
        category: article.category,
        status: 'published',
        isExternal: false,
        sourceName: 'Throttle Talk Auto-Generator',
        attribution: 'Generated using Perplexity + xAI Grok',
      }).returning();
      
      console.log(`✅ Article published: ${publishedPost.id}`);
      return publishedPost.id;
      
    } catch (error: any) {
      console.error('❌ Publishing failed:', error.message);
      throw error;
    }
  }

  /**
   * Step 4: Log generation metrics
   */
  async logGeneration(
    status: 'success' | 'failed' | 'partial',
    perplexityQuery: string,
    perplexityCitations: any[],
    grokPrompt: string,
    article: GeneratedArticle | null,
    articleId: string | null,
    error?: Error
  ): Promise<void> {
    try {
      await db.insert(contentGenerationLogs).values({
        trigger: 'cron',
        status,
        perplexityQuery,
        perplexityCitations,
        grokPrompt: grokPrompt.substring(0, 1000), // Truncate long prompts
        articleId,
        articleTitle: article?.title,
        wordCount: article?.wordCount,
        backlinksCount: article?.backlinksCount,
        generationTimeMs: 0, // Will be calculated in full pipeline
        perplexityTokens: 0,
        grokTokens: 0,
        errorMessage: error?.message,
        errorDetails: error ? { stack: error.stack, name: error.name } : null,
      });
      
      console.log('📊 Generation metrics logged');
      
    } catch (logError: any) {
      console.error('⚠️ Failed to log metrics:', logError.message);
    }
  }

  /**
   * Full pipeline: Scan → Generate → Publish → Log
   */
  async generateAndPublishArticle(): Promise<void> {
    const startTime = Date.now();
    
    console.log('\n🚀 Starting automated content generation pipeline...');
    
    if (!this.perplexityApiKey || !this.grokApiKey) {
      console.log('⚠️ API keys not configured - skipping generation');
      return;
    }
    
    try {
      // Step 1: Scan news with Perplexity
      const snippets = await this.scanLatestAutoNews();
      
      if (snippets.length === 0) {
        console.log('⚠️ No news snippets found - skipping generation');
        return;
      }
      
      // Step 2: Generate article with Grok
      const article = await this.generateArticleWithGrok(snippets);
      
      // Step 3: Publish to database
      const articleId = await this.publishArticle(article);
      
      // Step 4: Log success
      await this.logGeneration(
        'success',
        'Latest Indian auto news (last 7 days)',
        snippets.map(s => ({ url: s.url, source: s.source })),
        `Generate article from ${snippets.length} snippets`,
        article,
        articleId
      );
      
      const totalTime = Date.now() - startTime;
      console.log(`\n✅ Content generation complete in ${totalTime}ms`);
      console.log(`📰 Published: "${article.title}"`);
      console.log(`📊 ${article.wordCount} words, ${article.backlinksCount} backlinks\n`);
      
    } catch (error: any) {
      console.error('\n❌ Content generation failed:', error.message);
      
      await this.logGeneration(
        'failed',
        'Latest Indian auto news',
        [],
        'Article generation attempt',
        null,
        null,
        error
      );
    }
  }

  /**
   * Schedule automated generation (every 12 hours at 9 AM and 9 PM IST)
   */
  startScheduler(): void {
    if (this.scheduledJob) {
      console.log('⏰ Content generation scheduler already running');
      return;
    }
    
    // Guard: Skip scheduling if API keys are missing
    if (!this.perplexityApiKey || !this.grokApiKey) {
      console.warn('⚠️ Skipping content generation scheduler - API keys not configured');
      console.warn('   Set PERPLEXITY_API_KEY and GROK_API_KEY to enable automated article generation');
      return;
    }
    
    // Run at 9 AM and 9 PM IST (3:30 AM and 3:30 PM UTC)
    this.scheduledJob = schedule.scheduleJob('30 3,15 * * *', async () => {
      console.log('⏰ Scheduled content generation triggered');
      await this.generateAndPublishArticle();
    });
    
    console.log('⏰ Automated content generation scheduled (9 AM & 9 PM IST)');
    console.log('   Next run: 2-3 articles per day');
  }

  /**
   * Stop the scheduler
   */
  stopScheduler(): void {
    if (this.scheduledJob) {
      this.scheduledJob.cancel();
      this.scheduledJob = null;
      console.log('⏰ Content generation scheduler stopped');
    }
  }

  /**
   * Parse Perplexity response into structured snippets
   */
  private parsePerplexityResponse(content: string, citations: any[]): PerplexitySnippet[] {
    const snippets: PerplexitySnippet[] = [];
    
    // Simple parsing - in production, use more robust parsing
    const lines = content.split('\n');
    let currentSnippet: Partial<PerplexitySnippet> = {};
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      // Detect title lines (usually numbered or bold)
      if (/^\d+\.|^-|\*\*/.test(trimmed)) {
        if (currentSnippet.title) {
          snippets.push(currentSnippet as PerplexitySnippet);
          currentSnippet = {};
        }
        currentSnippet.title = trimmed.replace(/^\d+\.|\*\*/g, '').trim();
      } else {
        if (!currentSnippet.snippet) {
          currentSnippet.snippet = trimmed;
        } else {
          currentSnippet.snippet += ' ' + trimmed;
        }
      }
    }
    
    // Add last snippet
    if (currentSnippet.title) {
      snippets.push(currentSnippet as PerplexitySnippet);
    }
    
    // Attach citations
    citations.forEach((citation, i) => {
      if (snippets[i]) {
        snippets[i].url = citation.url || citation;
        snippets[i].source = citation.source || 'Unknown';
      }
    });
    
    return snippets.filter(s => s.title && s.snippet);
  }

  /**
   * Parse Grok-generated article
   */
  private parseGrokArticle(content: string): GeneratedArticle {
    // Extract metadata
    const metaMatch = content.match(/---\n([\s\S]*?)\n---/);
    let title = 'Untitled Article';
    let category = 'market-insights';
    let keywords: string[] = [];
    
    if (metaMatch) {
      const metadata = metaMatch[1];
      const titleMatch = metadata.match(/TITLE:\s*(.+)/);
      const categoryMatch = metadata.match(/CATEGORY:\s*(.+)/);
      const keywordsMatch = metadata.match(/KEYWORDS:\s*(.+)/);
      
      if (titleMatch) title = titleMatch[1].trim();
      if (categoryMatch) category = categoryMatch[1].trim();
      if (keywordsMatch) keywords = keywordsMatch[1].split(',').map(k => k.trim());
    }
    
    // Extract content (everything after metadata)
    const contentMatch = content.match(/---\n[\s\S]*?\n---\n([\s\S]*)/);
    const articleContent = contentMatch ? contentMatch[1].trim() : content;
    
    // Count words
    const wordCount = articleContent.split(/\s+/).length;
    
    // Count backlinks
    const backlinksCount = (articleContent.match(/\[.*?\]\(https:\/\/cararth\.com.*?\)/g) || []).length;
    
    return {
      title,
      content: articleContent,
      category,
      seoKeywords: keywords,
      wordCount,
      backlinksCount,
    };
  }
}

// Export singleton instance
export const automatedContentGenerator = new AutomatedContentGenerator();
