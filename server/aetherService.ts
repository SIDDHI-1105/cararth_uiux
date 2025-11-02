import OpenAI from "openai";
import type { InsertGeoSweep, GeoSweep, InsertSeoAudit } from "@shared/schema";
import { logError, ErrorCategory, createAppError } from "./errorHandling.js";
import axios from "axios";
import * as cheerio from "cheerio";

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

  /**
   * Run comprehensive SEO audit
   */
  async runSeoAudit(params: {
    targetUrl: string;
    auditType?: string;
  }): Promise<Omit<InsertSeoAudit, 'id' | 'createdAt'>> {
    const startTime = Date.now();
    const baseUrl = params.targetUrl.replace(/\/$/, '');

    console.log(`🔍 Starting SEO audit for: ${baseUrl}`);

    try {
      const issues: any[] = [];
      let seoScore = 100;
      const recommendations: string[] = [];

      // 1. Check sitemap.xml and get sample URLs
      const sitemapResult = await this.checkSitemap(baseUrl);
      if (!sitemapResult.accessible) {
        issues.push({
          severity: 'high',
          category: 'sitemap',
          description: 'Sitemap.xml not accessible',
          page: '/sitemap.xml',
        });
        seoScore -= 15;
        recommendations.push('Create or fix sitemap.xml for better crawlability');
      } else {
        console.log(`   ✓ Sitemap found with ${sitemapResult.urlCount} URLs`);
        if (sitemapResult.urlCount === 0) {
          recommendations.push('Sitemap appears empty or is a sitemap index - verify content');
        }
      }

      // 2. Check robots.txt
      const robotsResult = await this.checkRobotsTxt(baseUrl);
      if (!robotsResult.accessible) {
        issues.push({
          severity: 'medium',
          category: 'robots',
          description: 'robots.txt not found',
          page: '/robots.txt',
        });
        seoScore -= 5;
      }

      // 3. Sample page audits - use sitemap URLs or fallback to homepage
      let pagesToCheck = sitemapResult.sampleUrls || [];
      if (pagesToCheck.length === 0) {
        // Fallback to just checking the homepage if no sitemap URLs available
        pagesToCheck = [baseUrl];
      }

      // Limit to 5 pages to avoid timeout
      const pagesChecked = Math.min(pagesToCheck.length, 5);
      
      for (let i = 0; i < pagesChecked; i++) {
        const pageUrl = pagesToCheck[i];
        const pageAudit = await this.auditPage(pageUrl);
        
        if (pageAudit.issues.length > 0) {
          issues.push(...pageAudit.issues.map(issue => ({
            ...issue,
            page: pageUrl.replace(baseUrl, ''), // Make path relative
          })));
          
          // Weight scoring by severity
          for (const issue of pageAudit.issues) {
            if (issue.severity === 'high') seoScore -= 10;
            else if (issue.severity === 'medium') seoScore -= 5;
            else if (issue.severity === 'low') seoScore -= 2;
          }
        }

        if (pageAudit.recommendations.length > 0) {
          recommendations.push(...pageAudit.recommendations.map(r => `${pageUrl.replace(baseUrl, '')}: ${r}`));
        }
      }

      const duration = Date.now() - startTime;

      console.log(`   ✓ SEO audit completed in ${duration}ms`);
      console.log(`   SEO Score: ${Math.max(0, seoScore)}/100`);
      console.log(`   Issues found: ${issues.length}`);

      return {
        targetUrl: baseUrl,
        auditType: params.auditType || 'full',
        seoScore: Math.max(0, seoScore),
        issuesFound: issues,
        recommendations,
        pagesChecked: pagesToCheck.length,
        criticalIssues: issues.filter(i => i.severity === 'high').length,
        warnings: issues.filter(i => i.severity === 'medium').length,
        suggestions: issues.filter(i => i.severity === 'low').length,
      };
    } catch (error: any) {
      console.error(`   ✗ SEO audit failed:`, error.message);
      throw createAppError(
        'SEO audit failed',
        500,
        ErrorCategory.EXTERNAL_API,
        { targetUrl: baseUrl, error: error.message }
      );
    }
  }

  /**
   * Check sitemap.xml accessibility and extract sample URLs
   */
  private async checkSitemap(baseUrl: string): Promise<{ 
    accessible: boolean; 
    urlCount: number;
    sampleUrls?: string[];
  }> {
    try {
      const response = await axios.get(`${baseUrl}/sitemap.xml`, { timeout: 10000 });
      const $ = cheerio.load(response.data, { xmlMode: true });
      
      // Check if this is a sitemap index (contains <sitemap> tags)
      const sitemapEntries = $('sitemap');
      if (sitemapEntries.length > 0) {
        // This is a sitemap index, try to fetch the first sitemap
        const firstSitemapLoc = $('sitemap loc').first().text();
        if (firstSitemapLoc) {
          try {
            const subResponse = await axios.get(firstSitemapLoc, { timeout: 10000 });
            const $sub = cheerio.load(subResponse.data, { xmlMode: true });
            const subUrls = $sub('url loc');
            const sampleUrls: string[] = [];
            subUrls.slice(0, 5).each((_, el) => {
              const url = $sub(el).text();
              if (url) sampleUrls.push(url);
            });
            return { 
              accessible: true, 
              urlCount: subUrls.length,
              sampleUrls: sampleUrls.length > 0 ? sampleUrls : undefined
            };
          } catch (e) {
            // Failed to fetch sub-sitemap, return index info
            return { accessible: true, urlCount: 0 };
          }
        }
        return { accessible: true, urlCount: 0 };
      }
      
      // Regular sitemap with <url> entries
      const urlEntries = $('url loc');
      const sampleUrls: string[] = [];
      urlEntries.slice(0, 5).each((_, el) => {
        const url = $(el).text();
        if (url) sampleUrls.push(url);
      });
      
      return { 
        accessible: true, 
        urlCount: urlEntries.length,
        sampleUrls: sampleUrls.length > 0 ? sampleUrls : undefined
      };
    } catch (error) {
      return { accessible: false, urlCount: 0 };
    }
  }

  /**
   * Check robots.txt
   */
  private async checkRobotsTxt(baseUrl: string): Promise<{ accessible: boolean }> {
    try {
      await axios.get(`${baseUrl}/robots.txt`, { timeout: 5000 });
      return { accessible: true };
    } catch (error) {
      return { accessible: false };
    }
  }

  /**
   * Audit a single page
   */
  private async auditPage(url: string): Promise<{
    issues: Array<{ severity: string; category: string; description: string }>;
    recommendations: string[];
  }> {
    const issues: Array<{ severity: string; category: string; description: string }> = [];
    const recommendations: string[] = [];

    try {
      const response = await axios.get(url, { timeout: 10000 });
      const $ = cheerio.load(response.data);

      // Check title tag
      const title = $('title').text();
      if (!title) {
        issues.push({
          severity: 'high',
          category: 'meta',
          description: 'Missing title tag',
        });
      } else if (title.length < 30) {
        issues.push({
          severity: 'medium',
          category: 'meta',
          description: 'Title tag too short (< 30 chars)',
        });
        recommendations.push('Expand title to 50-60 characters for better SEO');
      } else if (title.length > 60) {
        issues.push({
          severity: 'low',
          category: 'meta',
          description: 'Title tag too long (> 60 chars)',
        });
      }

      // Check meta description
      const description = $('meta[name="description"]').attr('content');
      if (!description) {
        issues.push({
          severity: 'high',
          category: 'meta',
          description: 'Missing meta description',
        });
      } else if (description.length < 120) {
        issues.push({
          severity: 'medium',
          category: 'meta',
          description: 'Meta description too short (< 120 chars)',
        });
      }

      // Check canonical URL
      const canonical = $('link[rel="canonical"]').attr('href');
      if (!canonical) {
        issues.push({
          severity: 'medium',
          category: 'canonical',
          description: 'Missing canonical URL',
        });
        recommendations.push('Add canonical tag to prevent duplicate content issues');
      }

      // Check Schema.org markup
      const schemaScripts = $('script[type="application/ld+json"]');
      if (schemaScripts.length === 0) {
        issues.push({
          severity: 'medium',
          category: 'schema',
          description: 'No Schema.org markup found',
        });
        recommendations.push('Add structured data (JSON-LD) for rich snippets');
      } else {
        // Validate JSON-LD
        let validSchemas = 0;
        schemaScripts.each((_, el) => {
          try {
            JSON.parse($(el).html() || '');
            validSchemas++;
          } catch (e) {
            issues.push({
              severity: 'high',
              category: 'schema',
              description: 'Invalid JSON-LD markup',
            });
          }
        });
      }

      // Check Open Graph tags
      const ogTitle = $('meta[property="og:title"]').attr('content');
      const ogDescription = $('meta[property="og:description"]').attr('content');
      if (!ogTitle || !ogDescription) {
        issues.push({
          severity: 'low',
          category: 'social',
          description: 'Missing Open Graph tags',
        });
        recommendations.push('Add Open Graph tags for better social media sharing');
      }

      // Check headings structure
      const h1Count = $('h1').length;
      if (h1Count === 0) {
        issues.push({
          severity: 'high',
          category: 'content',
          description: 'No H1 heading found',
        });
      } else if (h1Count > 1) {
        issues.push({
          severity: 'medium',
          category: 'content',
          description: 'Multiple H1 headings (should be one per page)',
        });
      }

    } catch (error: any) {
      console.log(`   ⚠️ Could not audit ${url}: ${error.message}`);
      issues.push({
        severity: 'high',
        category: 'accessibility',
        description: 'Page could not be accessed',
      });
    }

    return { issues, recommendations };
  }

  /**
   * Generate content brief using AI
   */
  async generateContentBrief(params: {
    topic: string;
    targetKeywords?: string[];
    contentType?: string;
  }): Promise<{
    title: string;
    metaDescription: string;
    outline: string[];
    keywords: string[];
    wordCount: number;
    aiResponse: string;
  }> {
    console.log(`📝 Generating content brief for: ${params.topic}`);

    const prompt = `Create a comprehensive SEO content brief for a blog post about: "${params.topic}"

Target keywords: ${params.targetKeywords?.join(', ') || 'auto-generate based on topic'}
Content type: ${params.contentType || 'blog post'}

Provide:
1. SEO-optimized title (50-60 characters)
2. Meta description (150-160 characters)
3. Content outline (H2 and H3 headings)
4. Primary and secondary keywords
5. Recommended word count
6. Key points to cover

Format as JSON with keys: title, metaDescription, outline (array), keywords (array), wordCount (number), keyPoints (array)`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1500,
      });

      const aiResponse = completion.choices[0]?.message?.content || "";
      
      // Try to parse JSON response
      try {
        const parsed = JSON.parse(aiResponse);
        return {
          title: parsed.title || params.topic,
          metaDescription: parsed.metaDescription || "",
          outline: parsed.outline || [],
          keywords: parsed.keywords || [],
          wordCount: parsed.wordCount || 1500,
          aiResponse,
        };
      } catch (e) {
        // Fallback if not valid JSON
        return {
          title: params.topic,
          metaDescription: "",
          outline: [],
          keywords: params.targetKeywords || [],
          wordCount: 1500,
          aiResponse,
        };
      }
    } catch (error: any) {
      console.error(`   ✗ Content brief generation failed:`, error.message);
      throw error;
    }
  }
}

// Export singleton instance
export const aetherService = new AetherService();
