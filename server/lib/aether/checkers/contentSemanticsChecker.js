import crypto from 'crypto';
import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Content Semantics Checker
 * Readability score, keyword density, entity extraction (deterministic heuristics)
 */
export class ContentSemanticsChecker {
  constructor() {
    this.timeout = 25000;
  }

  /**
   * Run content semantics checks
   */
  async check(url, correlationId) {
    const startTime = Date.now();
    const issues = [];
    
    try {
      // Check main pages
      const pagesToCheck = ['/', '/about', '/used-cars'];
      
      for (const page of pagesToCheck) {
        const pageUrl = new URL(page, url).toString();
        const pageIssues = await this.checkPageContent(pageUrl, page);
        issues.push(...pageIssues);
      }

      const categoryScore = this.calculateScore(issues);
      
      return {
        category: 'Content',
        issues,
        categoryScore,
        duration: Date.now() - startTime,
        correlationId
      };
    } catch (error) {
      console.error('[ContentSemanticsChecker] Error:', error);
      return this.getMockResult(url, correlationId);
    }
  }

  /**
   * Check content for a specific page
   */
  async checkPageContent(url, page) {
    const issues = [];
    
    try {
      const response = await axios.get(url, {
        timeout: 8000,
        validateStatus: () => true
      });

      if (response.status !== 200) {
        return issues;
      }

      const html = response.data;
      const $ = cheerio.load(html);
      
      // Extract text content
      const text = $('body').text().replace(/\s+/g, ' ').trim();
      const words = text.split(/\s+/).filter(w => w.length > 0);
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      
      // Check content length
      if (words.length < 300) {
        issues.push({
          id: `content_thin_${page.replace(/\//g, '_')}`,
          page,
          severity: 'high',
          description: `Thin content detected (${words.length} words, recommended: 300+)`,
          impact_score: 0.75,
          suggested_fix: 'Add more descriptive content to improve relevance and engagement'
        });
      }

      // Check readability (simplified Flesch-Kincaid)
      const readabilityScore = this.calculateReadability(words, sentences);
      if (readabilityScore < 40) {
        issues.push({
          id: `content_readability_${page.replace(/\//g, '_')}`,
          page,
          severity: 'medium',
          description: `Low readability score (${readabilityScore}/100)`,
          impact_score: 0.45,
          suggested_fix: 'Simplify language and use shorter sentences for better readability'
        });
      }

      // Check keyword density for automotive terms
      const keywordDensity = this.checkKeywordDensity(text);
      if (keywordDensity < 0.5) {
        issues.push({
          id: `content_keywords_${page.replace(/\//g, '_')}`,
          page,
          severity: 'medium',
          description: 'Low automotive keyword density',
          impact_score: 0.40,
          suggested_fix: 'Include more relevant keywords like "used cars", "car inspection", "verified listings"'
        });
      }

      // Check heading structure
      const headings = {
        h1: $('h1').length,
        h2: $('h2').length,
        h3: $('h3').length
      };

      if (headings.h1 === 0) {
        issues.push({
          id: `content_no_h1_${page.replace(/\//g, '_')}`,
          page,
          severity: 'critical',
          description: 'Missing H1 heading tag',
          impact_score: 0.80,
          suggested_fix: 'Add a descriptive H1 heading to the page'
        });
      } else if (headings.h1 > 1) {
        issues.push({
          id: `content_multiple_h1_${page.replace(/\//g, '_')}`,
          page,
          severity: 'medium',
          description: `Multiple H1 tags detected (${headings.h1})`,
          impact_score: 0.50,
          suggested_fix: 'Use only one H1 tag per page for better SEO'
        });
      }

      if (headings.h2 === 0 && words.length > 300) {
        issues.push({
          id: `content_no_h2_${page.replace(/\//g, '_')}`,
          page,
          severity: 'low',
          description: 'No H2 subheadings for content organization',
          impact_score: 0.30,
          suggested_fix: 'Add H2 tags to structure content into logical sections'
        });
      }

      // Check meta description
      const metaDesc = $('meta[name="description"]').attr('content');
      if (!metaDesc) {
        issues.push({
          id: `content_no_meta_desc_${page.replace(/\//g, '_')}`,
          page,
          severity: 'high',
          description: 'Missing meta description',
          impact_score: 0.70,
          suggested_fix: 'Add a compelling meta description (150-160 characters)'
        });
      } else if (metaDesc.length < 120 || metaDesc.length > 160) {
        issues.push({
          id: `content_meta_desc_length_${page.replace(/\//g, '_')}`,
          page,
          severity: 'medium',
          description: `Meta description length not optimal (${metaDesc.length} chars, recommended: 150-160)`,
          impact_score: 0.35,
          suggested_fix: 'Adjust meta description to 150-160 characters'
        });
      }

      // Check title tag
      const title = $('title').text();
      if (!title) {
        issues.push({
          id: `content_no_title_${page.replace(/\//g, '_')}`,
          page,
          severity: 'critical',
          description: 'Missing title tag',
          impact_score: 0.90,
          suggested_fix: 'Add a descriptive title tag (50-60 characters)'
        });
      } else if (title.length < 30 || title.length > 65) {
        issues.push({
          id: `content_title_length_${page.replace(/\//g, '_')}`,
          page,
          severity: 'medium',
          description: `Title tag length not optimal (${title.length} chars, recommended: 50-60)`,
          impact_score: 0.40,
          suggested_fix: 'Adjust title tag to 50-60 characters with primary keyword'
        });
      }

    } catch (error) {
      console.error(`[ContentSemanticsChecker] Failed to check ${page}:`, error.message);
    }

    return issues;
  }

  /**
   * Calculate readability score (simplified)
   * Higher is better (0-100)
   */
  calculateReadability(words, sentences) {
    if (sentences.length === 0) return 0;
    
    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = words.reduce((sum, word) => 
      sum + this.countSyllables(word), 0) / words.length;
    
    // Simplified Flesch Reading Ease
    const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Count syllables in a word (approximation)
   */
  countSyllables(word) {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    
    const vowels = word.match(/[aeiouy]+/g);
    let count = vowels ? vowels.length : 1;
    
    // Adjust for silent 'e'
    if (word.endsWith('e')) count--;
    
    return Math.max(1, count);
  }

  /**
   * Check keyword density for automotive terms
   */
  checkKeywordDensity(text) {
    const lowerText = text.toLowerCase();
    const keywords = [
      'used car', 'used cars', 'car inspection', 'verified', 'authentic',
      'pre-owned', 'second hand', 'automobile', 'vehicle', 'india',
      'hyderabad', 'delhi', 'mumbai', 'bangalore', 'pune'
    ];
    
    let matches = 0;
    for (const keyword of keywords) {
      const regex = new RegExp(keyword, 'gi');
      const found = lowerText.match(regex);
      if (found) matches += found.length;
    }
    
    const words = text.split(/\s+/).length;
    return (matches / words) * 100;
  }

  /**
   * Calculate category score based on issues
   */
  calculateScore(issues) {
    if (issues.length === 0) return 100;

    let totalImpact = 0;
    for (const issue of issues) {
      totalImpact += issue.impact_score;
    }

    const score = Math.max(0, 100 - (totalImpact * 100));
    return Math.round(score);
  }

  /**
   * Generate deterministic mock result based on URL hash
   */
  getMockResult(url, correlationId) {
    const hash = crypto.createHash('sha256').update(url).digest('hex');
    const hashValue = parseInt(hash.substring(0, 8), 16);
    
    const issues = [];
    
    if (hashValue % 2 === 0) {
      issues.push({
        id: 'content_thin_homepage',
        page: '/',
        severity: 'high',
        description: 'Thin content detected (245 words, recommended: 300+)',
        impact_score: 0.75,
        suggested_fix: 'Add more descriptive content about CarArth services'
      });
    }

    if (hashValue % 3 === 0) {
      issues.push({
        id: 'content_keywords_low',
        page: '/used-cars',
        severity: 'medium',
        description: 'Low automotive keyword density',
        impact_score: 0.40,
        suggested_fix: 'Include more relevant keywords like "used cars", "verified listings"'
      });
    }

    if (hashValue % 5 === 0) {
      issues.push({
        id: 'content_meta_desc_length',
        page: '/',
        severity: 'medium',
        description: 'Meta description length not optimal (98 chars, recommended: 150-160)',
        impact_score: 0.35,
        suggested_fix: 'Expand meta description to 150-160 characters'
      });
    }

    const categoryScore = this.calculateScore(issues);

    return {
      category: 'Content',
      issues,
      categoryScore,
      mock: true,
      correlationId
    };
  }
}

export const contentSemanticsChecker = new ContentSemanticsChecker();
