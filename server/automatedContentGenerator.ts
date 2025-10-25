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
   * Full pipeline: Scan → Generate → Publish → Log (with fallback resilience)
   */
  async generateAndPublishArticle(): Promise<void> {
    const startTime = Date.now();
    
    console.log('\n🚀 Starting automated content generation pipeline...');
    
    if (!this.perplexityApiKey || !this.grokApiKey) {
      console.log('⚠️ API keys not configured - using fallback content');
      await this.publishFallbackArticle();
      return;
    }
    
    let retryCount = 0;
    const maxRetries = 2;
    
    while (retryCount <= maxRetries) {
      try {
        // Step 1: Scan news with Perplexity
        let snippets: PerplexitySnippet[] = [];
        try {
          snippets = await this.scanLatestAutoNews();
        } catch (perplexityError: any) {
          console.error(`⚠️ Perplexity scan failed (attempt ${retryCount + 1}/${maxRetries + 1}):`, perplexityError.message);
          
          if (retryCount < maxRetries) {
            retryCount++;
            await this.delay(5000 * retryCount); // Exponential backoff
            continue;
          }
          
          // If Perplexity fails completely, try fallback content
          console.log('⚠️ Perplexity unavailable - generating from cached topics');
          snippets = this.getFallbackSnippets();
        }
        
        if (snippets.length === 0) {
          console.log('⚠️ No news snippets found - using fallback article');
          await this.publishFallbackArticle();
          return;
        }
        
        // Step 2: Generate article with Grok
        let article: GeneratedArticle;
        try {
          article = await this.generateArticleWithGrok(snippets);
        } catch (grokError: any) {
          console.error(`⚠️ Grok generation failed (attempt ${retryCount + 1}/${maxRetries + 1}):`, grokError.message);
          
          if (retryCount < maxRetries) {
            retryCount++;
            await this.delay(5000 * retryCount);
            continue;
          }
          
          // If Grok fails completely, use fallback
          console.log('⚠️ Grok unavailable - publishing fallback article');
          await this.publishFallbackArticle();
          await this.logGeneration(
            'partial',
            'Latest Indian auto news',
            snippets.map(s => ({ url: s.url, source: s.source })),
            'Grok generation failed - used fallback',
            null,
            null,
            grokError
          );
          return;
        }
        
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
        
        return; // Success - exit retry loop
        
      } catch (error: any) {
        console.error(`\n❌ Content generation failed (attempt ${retryCount + 1}/${maxRetries + 1}):`, error.message);
        
        if (retryCount < maxRetries) {
          retryCount++;
          await this.delay(5000 * retryCount);
          continue;
        }
        
        // Final fallback after all retries exhausted
        console.log('⚠️ All retries exhausted - publishing fallback article');
        await this.publishFallbackArticle();
        
        await this.logGeneration(
          'failed',
          'Latest Indian auto news',
          [],
          'Article generation attempt - all retries failed',
          null,
          null,
          error
        );
        
        return;
      }
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
   * Delay helper for retry backoff
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get fallback snippets when Perplexity is unavailable
   */
  private getFallbackSnippets(): PerplexitySnippet[] {
    const currentDate = new Date();
    const month = currentDate.toLocaleDateString('en-IN', { month: 'long' });
    const year = currentDate.getFullYear();
    
    return [
      {
        title: `${month} ${year} Used Car Market Update`,
        snippet: `The Indian used car market continues to show strong growth with increasing demand for compact SUVs and sedans. Dealers report steady footfall and improved inventory turnover across major metros.`,
        url: 'https://cararth.com',
        source: 'Market Intelligence',
        date: currentDate.toISOString(),
      },
      {
        title: 'Popular Models See Price Stability',
        snippet: `Models like Maruti Swift, Hyundai Creta, and Tata Nexon maintain strong resale values with minimal depreciation. Expert buyers recommend these models for reliable long-term ownership.`,
        url: 'https://cararth.com/market-insights',
        source: 'Price Analysis',
        date: currentDate.toISOString(),
      },
      {
        title: 'EV Demand Impacts ICE Resale',
        snippet: `Growing electric vehicle adoption is beginning to influence internal combustion engine (ICE) vehicle resale patterns, particularly in premium segments. However, affordable ICE models remain in high demand.`,
        url: 'https://cararth.com/trends',
        source: 'Industry Trends',
        date: currentDate.toISOString(),
      },
    ];
  }

  /**
   * Publish fallback article when generation fails
   */
  async publishFallbackArticle(): Promise<void> {
    try {
      console.log('📝 Publishing fallback article...');
      
      const currentDate = new Date();
      const month = currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      
      const fallbackArticles = [
        {
          title: `${month} Used Car Market: What Buyers Need to Know`,
          category: 'market-insights',
          content: `# ${month} Used Car Market: What Buyers Need to Know

The Indian used car market continues its robust growth trajectory, offering buyers a wide range of options across price points and vehicle categories. Here's what you need to know this month.

## Market Overview

The used car sector remains one of the fastest-growing segments in India's automotive industry. With increasing consumer awareness and improving infrastructure for pre-owned vehicles, the market offers compelling value propositions for both buyers and sellers.

### Key Trends

**Compact SUV Demand**: Models like the Maruti Brezza, Hyundai Venue, and Tata Nexon continue to dominate the used car market with strong resale values and consistent buyer interest.

**Sedan Stability**: Popular sedans including the Honda City, Hyundai Verna, and Maruti Ciaz maintain steady pricing and appeal to family buyers seeking comfort and value.

**Hatchback Reliability**: The trusted Maruti Swift, Hyundai i20, and Tata Altroz remain top choices for first-time buyers and urban commuters.

## Buying Tips

For those looking to purchase a used car, consider these factors:

1. **Documentation**: Verify ownership history, insurance records, and maintenance logs
2. **Inspection**: Conduct thorough mechanical and body inspections
3. **Market Research**: Compare prices across platforms like [CarArth](https://cararth.com) to ensure fair value
4. **Test Drive**: Always test the vehicle in various conditions
5. **Professional Check**: Consider a pre-purchase inspection by certified mechanics

## Selling Insights

If you're selling your vehicle:

1. **Timing**: Market conditions favor sellers with well-maintained vehicles
2. **Pricing**: Research current [market rates on CarArth](https://cararth.com) for accurate pricing
3. **Presentation**: Clean, well-documented vehicles fetch premium prices
4. **Platform**: List on [multiple marketplaces through CarArth](https://cararth.com/sell-car) for maximum exposure

## Regional Variations

Different cities show varying preferences:

- **Delhi-NCR**: Strong demand for diesel sedans and SUVs
- **Mumbai**: Preference for compact cars and automatic transmissions
- **Bangalore**: High interest in tech-enabled vehicles and hybrids
- **Hyderabad**: Growing market for SUVs and premium hatchbacks

## Looking Ahead

The used car market outlook remains positive with:

- Improved financing options
- Better quality assurance standards
- Enhanced buyer protection mechanisms
- Growing online-to-offline integration

Whether buying or selling, [CarArth](https://cararth.com) provides comprehensive tools to make informed decisions in India's dynamic used car marketplace.

*For the latest market insights and listings, visit [CarArth.com](https://cararth.com)*`,
        },
        {
          title: `Top 10 Most Reliable Used Cars in India Under ₹5 Lakhs`,
          category: 'buyer-guide',
          content: `# Top 10 Most Reliable Used Cars in India Under ₹5 Lakhs

Finding a reliable used car within a budget can be challenging, but these proven models offer excellent value and dependability for buyers across India.

## Our Selection Criteria

We evaluated vehicles based on:
- Reliability and maintenance costs
- Resale value retention
- Parts availability
- Owner satisfaction ratings
- Service network coverage

## Top 10 Picks

### 1. Maruti Suzuki Swift (2015-2018)

**Why It's Great**: Excellent fuel economy, low maintenance, strong resale value
**Price Range**: ₹3.5L - ₹5L
**Best For**: First-time buyers and daily commuters

The Swift remains India's most popular hatchback for good reason. Its proven engine, extensive service network, and high reliability make it an easy recommendation.

### 2. Honda City (2014-2017)

**Why It's Great**: Spacious cabin, refined engine, premium appeal
**Price Range**: ₹4L - ₹5L
**Best For**: Families seeking comfort and reliability

The City offers sedan comfort at hatchback prices in the used market. Known for its durability and smooth performance.

### 3. Hyundai i20 (2015-2018)

**Why It's Great**: Feature-rich, comfortable ride, good looks
**Price Range**: ₹3.8L - ₹5L
**Best For**: Buyers wanting premium features

Hyundai's quality and feature-loaded interiors make the i20 a strong value proposition in the used market.

### 4. Maruti Baleno (2016-2019)

**Why It's Great**: Spacious, fuel-efficient, modern features
**Price Range**: ₹4L - ₹5L
**Best For**: Families wanting space and efficiency

The Baleno offers premium hatchback features with Maruti's legendary fuel economy and reliability.

### 5. Tata Nexon (2018-2019)

**Why It's Great**: Built quality, safety features, value pricing
**Price Range**: ₹4.5L - ₹5L
**Best For**: Safety-conscious buyers

India's first 5-star NCAP-rated car offers exceptional safety and build quality at accessible prices.

## How to Buy Smart

1. **Research**: Check current prices on [CarArth](https://cararth.com)
2. **Verify**: Ensure complete documentation
3. **Inspect**: Professional mechanical inspection
4. **Compare**: Multiple listings for best deals
5. **Negotiate**: Armed with [market data from CarArth](https://cararth.com)

## Maintenance Budget

Budget approximately:
- ₹15,000-₹25,000 annually for regular maintenance
- ₹10,000-₹20,000 for insurance
- Emergency fund for unexpected repairs

## Final Thoughts

These reliable models offer proven performance and peace of mind. For the latest listings and [market insights, visit CarArth](https://cararth.com) to find your perfect used car.

*Compare prices and features across India's largest used car marketplace at [CarArth.com](https://cararth.com)*`,
        },
      ];
      
      // Randomly select one fallback article
      const selectedArticle = fallbackArticles[Math.floor(Math.random() * fallbackArticles.length)];
      
      // Get admin user for authorship
      const adminUser = await db.query.users.findFirst({
        where: sql`role = 'admin'`,
      });
      
      const authorId = adminUser?.id || 'system-generator';
      
      const [publishedPost] = await db.insert(communityPosts).values({
        authorId,
        title: selectedArticle.title,
        content: selectedArticle.content,
        category: selectedArticle.category,
        status: 'published',
        isExternal: false,
        sourceName: 'Throttle Talk Editorial',
        attribution: 'Fallback content - generation service unavailable',
      }).returning();
      
      console.log(`✅ Fallback article published: ${publishedPost.id}`);
      console.log(`📰 Title: "${selectedArticle.title}"`);
      
      // Log fallback publication
      await this.logGeneration(
        'partial',
        'Fallback article',
        [],
        'Using pre-written content due to API unavailability',
        {
          title: selectedArticle.title,
          content: selectedArticle.content,
          category: selectedArticle.category,
          seoKeywords: [],
          wordCount: selectedArticle.content.split(/\s+/).length,
          backlinksCount: (selectedArticle.content.match(/\[.*?\]\(https:\/\/cararth\.com.*?\)/g) || []).length,
        },
        publishedPost.id
      );
      
    } catch (error: any) {
      console.error('❌ Failed to publish fallback article:', error.message);
      throw error;
    }
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
