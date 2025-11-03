import crypto from 'crypto';
import axios from 'axios';

/**
 * Indexability Checker
 * Validates robots.txt, sitemap.xml, canonical URLs, noindex detection
 */
export class IndexabilityChecker {
  constructor() {
    this.timeout = 25000;
  }

  /**
   * Run indexability checks
   */
  async check(url, correlationId) {
    const startTime = Date.now();
    const issues = [];
    
    try {
      // Check robots.txt
      const robotsIssues = await this.checkRobotsTxt(url);
      issues.push(...robotsIssues);

      // Check sitemap.xml
      const sitemapIssues = await this.checkSitemap(url);
      issues.push(...sitemapIssues);

      // Check for canonical URLs
      const canonicalIssues = await this.checkCanonical(url);
      issues.push(...canonicalIssues);

      // Check for noindex tags
      const noindexIssues = await this.checkNoindex(url);
      issues.push(...noindexIssues);

      const categoryScore = this.calculateScore(issues);
      
      return {
        category: 'Indexability',
        issues,
        categoryScore,
        duration: Date.now() - startTime,
        correlationId
      };
    } catch (error) {
      console.error('[IndexabilityChecker] Error:', error);
      return this.getMockResult(url, correlationId);
    }
  }

  /**
   * Check robots.txt
   */
  async checkRobotsTxt(url) {
    const issues = [];
    const baseUrl = new URL(url).origin;
    
    try {
      const response = await axios.get(`${baseUrl}/robots.txt`, {
        timeout: 5000,
        validateStatus: () => true
      });

      if (response.status === 404) {
        issues.push({
          id: 'robots_missing',
          page: '/robots.txt',
          severity: 'medium',
          description: 'robots.txt file is missing',
          impact_score: 0.45,
          suggested_fix: 'Create a robots.txt file to guide search engine crawlers'
        });
      } else if (response.status === 200) {
        const content = response.data.toLowerCase();
        
        // Check if too restrictive
        if (content.includes('disallow: /')) {
          issues.push({
            id: 'robots_disallow_all',
            page: '/robots.txt',
            severity: 'critical',
            description: 'robots.txt blocks all pages from indexing',
            impact_score: 0.95,
            suggested_fix: 'Remove "Disallow: /" to allow search engine indexing'
          });
        }

        // Check for sitemap reference
        if (!content.includes('sitemap:')) {
          issues.push({
            id: 'robots_no_sitemap',
            page: '/robots.txt',
            severity: 'low',
            description: 'robots.txt does not reference sitemap',
            impact_score: 0.20,
            suggested_fix: 'Add Sitemap: directive pointing to sitemap.xml'
          });
        }
      }
    } catch (error) {
      console.error('[IndexabilityChecker] robots.txt check failed:', error.message);
    }

    return issues;
  }

  /**
   * Check sitemap.xml
   */
  async checkSitemap(url) {
    const issues = [];
    const baseUrl = new URL(url).origin;
    
    try {
      const response = await axios.get(`${baseUrl}/sitemap.xml`, {
        timeout: 5000,
        validateStatus: () => true
      });

      if (response.status === 404) {
        issues.push({
          id: 'sitemap_missing',
          page: '/sitemap.xml',
          severity: 'high',
          description: 'sitemap.xml file is missing',
          impact_score: 0.70,
          suggested_fix: 'Create an XML sitemap to help search engines discover pages'
        });
      } else if (response.status === 200) {
        const content = response.data;
        
        // Basic validation
        if (!content.includes('<urlset') && !content.includes('<sitemapindex')) {
          issues.push({
            id: 'sitemap_invalid',
            page: '/sitemap.xml',
            severity: 'high',
            description: 'sitemap.xml has invalid XML structure',
            impact_score: 0.65,
            suggested_fix: 'Fix sitemap.xml to include valid <urlset> or <sitemapindex> tags'
          });
        }
      }
    } catch (error) {
      console.error('[IndexabilityChecker] sitemap.xml check failed:', error.message);
    }

    return issues;
  }

  /**
   * Check canonical URLs
   */
  async checkCanonical(url) {
    const issues = [];
    
    try {
      const response = await axios.get(url, {
        timeout: 5000,
        validateStatus: () => true
      });

      if (response.status === 200) {
        const html = response.data.toLowerCase();
        
        // Check for canonical tag
        const hasCanonical = html.includes('rel="canonical"') || html.includes("rel='canonical'");
        
        if (!hasCanonical) {
          issues.push({
            id: 'canonical_missing',
            page: new URL(url).pathname,
            severity: 'medium',
            description: 'Missing canonical URL tag',
            impact_score: 0.50,
            suggested_fix: 'Add <link rel="canonical" href="..."> to specify preferred URL'
          });
        }
      }
    } catch (error) {
      console.error('[IndexabilityChecker] canonical check failed:', error.message);
    }

    return issues;
  }

  /**
   * Check for noindex tags
   */
  async checkNoindex(url) {
    const issues = [];
    
    try {
      const response = await axios.get(url, {
        timeout: 5000,
        validateStatus: () => true
      });

      if (response.status === 200) {
        const html = response.data.toLowerCase();
        
        // Check for noindex meta tag
        if (html.includes('noindex')) {
          issues.push({
            id: 'noindex_found',
            page: new URL(url).pathname,
            severity: 'critical',
            description: 'Page has noindex directive preventing search engine indexing',
            impact_score: 0.90,
            suggested_fix: 'Remove noindex meta tag to allow indexing'
          });
        }
      }
    } catch (error) {
      console.error('[IndexabilityChecker] noindex check failed:', error.message);
    }

    return issues;
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
    
    // Deterministic issues based on hash
    if (hashValue % 3 === 0) {
      issues.push({
        id: 'robots_no_sitemap',
        page: '/robots.txt',
        severity: 'low',
        description: 'robots.txt does not reference sitemap',
        impact_score: 0.20,
        suggested_fix: 'Add Sitemap: directive pointing to sitemap.xml'
      });
    }

    if (hashValue % 5 === 0) {
      issues.push({
        id: 'canonical_missing',
        page: new URL(url).pathname,
        severity: 'medium',
        description: 'Missing canonical URL tag on some pages',
        impact_score: 0.50,
        suggested_fix: 'Add <link rel="canonical" href="..."> to specify preferred URL'
      });
    }

    const categoryScore = this.calculateScore(issues);

    return {
      category: 'Indexability',
      issues,
      categoryScore,
      mock: true,
      correlationId
    };
  }
}

export const indexabilityChecker = new IndexabilityChecker();
