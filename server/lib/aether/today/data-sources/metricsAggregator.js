import { getGSCService } from './googleSearchConsole.js';
import { getGA4Service } from './googleAnalytics.js';
import { db } from '../../../../db.js';
import { seoAudits, geoSweeps } from '../../../../../shared/schema.js';
import { eq, desc } from 'drizzle-orm';

/**
 * Metrics Aggregator
 * Combines data from multiple sources into unified page metrics
 * Sources: GSC + GA4 + AETHER SEO Audits + GEO Sweeps
 */
export class MetricsAggregator {
  constructor() {
    this.gscService = getGSCService();
    this.ga4Service = getGA4Service();
  }

  /**
   * Get comprehensive metrics for a list of pages
   * @param {string[]} pageUrls - Array of page URLs to analyze
   * @param {string} city - City context for filtering
   */
  async getPageMetrics(pageUrls, city = 'Hyderabad') {
    console.log(`[MetricsAggregator] Fetching metrics for ${pageUrls.length} pages`);

    // Fetch data from all sources in parallel
    const [gscData, ga4Data, auditData, geoData] = await Promise.all([
      this.gscService.fetchUrlMetrics(pageUrls),
      this.ga4Service.fetchUrlMetrics(pageUrls),
      this.fetchAuditMetrics(pageUrls),
      this.fetchGeoMetrics(city),
    ]);

    // Combine all data sources
    const metrics = {};
    for (const url of pageUrls) {
      metrics[url] = this.combineMetrics(url, {
        gsc: gscData[url] || {},
        ga4: ga4Data[url] || {},
        audit: auditData[url] || {},
        geo: geoData,
      });
    }

    console.log(`[MetricsAggregator] ✓ Compiled metrics for ${Object.keys(metrics).length} pages`);
    return metrics;
  }

  /**
   * Fetch latest SEO audit data for pages
   */
  async fetchAuditMetrics(pageUrls) {
    try {
      const metrics = {};

      for (const url of pageUrls) {
        // Get most recent audit for this URL
        const audits = await db
          .select()
          .from(seoAudits)
          .where(eq(seoAudits.targetUrl, url))
          .orderBy(desc(seoAudits.createdAt))
          .limit(1);

        if (audits.length > 0) {
          const audit = audits[0];
          metrics[url] = {
            overall_score: audit.overallScore || 0,
            // Parse audit results to extract specific checks
            faq_schema_present: this.hasSchemaType(audit.auditResults, 'FAQPage'),
            vehicle_schema_present: this.hasSchemaType(audit.auditResults, 'Vehicle'),
            canonical_present: this.hasCheck(audit.auditResults, 'canonical', true),
            meta_description_length: this.getMetaDescriptionLength(audit.auditResults),
            h1_has_city: this.checkH1HasCity(audit.auditResults, 'Hyderabad'),
            images_with_alt: this.getImageAltRatio(audit.auditResults),
            word_count: this.getWordCount(audit.auditResults),
            internal_link_count: this.getInternalLinkCount(audit.auditResults),
          };
        } else {
          // No audit data available
          metrics[url] = this.getDefaultAuditMetrics();
        }
      }

      return metrics;
    } catch (err) {
      console.error('[MetricsAggregator] Failed to fetch audit metrics:', err.message);
      return {};
    }
  }

  /**
   * Fetch GEO sweep metrics (AI mention rates)
   */
  async fetchGeoMetrics(city) {
    try {
      // Get most recent sweep
      const sweeps = await db
        .select()
        .from(geoSweeps)
        .orderBy(desc(geoSweeps.createdAt))
        .limit(1);

      if (sweeps.length > 0) {
        const sweep = sweeps[0];
        return {
          ai_mention_rate: sweep.cararthMentioned ? 1 : 0,
          competitor_count: this.countCompetitors(sweep.responseText),
        };
      }

      return { ai_mention_rate: 0, competitor_count: 0 };
    } catch (err) {
      console.error('[MetricsAggregator] Failed to fetch GEO metrics:', err.message);
      return { ai_mention_rate: 0, competitor_count: 0 };
    }
  }

  /**
   * Combine all metrics into unified format for ranking engine
   */
  combineMetrics(url, sources) {
    const { gsc, ga4, audit, geo } = sources;

    return {
      // SEO Audit metrics - Use ?? to preserve false/0 values
      faq_schema_present: audit.faq_schema_present ?? false,
      vehicle_schema_complete: audit.vehicle_schema_present ?? false,
      canonical_present: audit.canonical_present ?? true,
      meta_description_length: audit.meta_description_length ?? 0,
      h1_has_city: audit.h1_has_city ?? false,
      images_with_alt: audit.images_with_alt ?? 0.5,
      word_count: audit.word_count ?? 0,
      internal_link_count: audit.internal_link_count ?? 0,

      // Google Search Console metrics
      clicks: gsc.clicks ?? 0,
      impressions: gsc.impressions ?? 0,
      ctr: gsc.ctr ?? 0,
      position: gsc.position ?? 100,

      // Google Analytics 4 metrics
      pageviews: ga4.pageviews ?? 0,
      avg_session_duration: ga4.avg_session_duration ?? 0,
      bounce_rate: ga4.bounce_rate ?? 0.5,
      engagement_rate: ga4.engagement_rate ?? 0.5,
      lcp_p75: ga4.lcp_p75 ?? 2.5,

      // GEO metrics
      ai_mention_rate: geo.ai_mention_rate ?? 0,
      competitor_count: geo.competitor_count ?? 0,
    };
  }

  // Helper methods to parse audit results
  hasSchemaType(auditResults, schemaType) {
    try {
      const results = typeof auditResults === 'string' ? JSON.parse(auditResults) : auditResults;
      return results?.schema?.types?.includes(schemaType) || false;
    } catch {
      return false;
    }
  }

  hasCheck(auditResults, checkName, expectedValue) {
    try {
      const results = typeof auditResults === 'string' ? JSON.parse(auditResults) : auditResults;
      return results?.[checkName] === expectedValue;
    } catch {
      return false;
    }
  }

  getMetaDescriptionLength(auditResults) {
    try {
      const results = typeof auditResults === 'string' ? JSON.parse(auditResults) : auditResults;
      return results?.metaDescription?.length || 0;
    } catch {
      return 0;
    }
  }

  checkH1HasCity(auditResults, city) {
    try {
      const results = typeof auditResults === 'string' ? JSON.parse(auditResults) : auditResults;
      const h1 = results?.h1 || '';
      return h1.toLowerCase().includes(city.toLowerCase());
    } catch {
      return false;
    }
  }

  getImageAltRatio(auditResults) {
    try {
      const results = typeof auditResults === 'string' ? JSON.parse(auditResults) : auditResults;
      const total = results?.images?.total || 0;
      const withAlt = results?.images?.withAlt || 0;
      return total > 0 ? withAlt / total : 0.5;
    } catch {
      return 0.5;
    }
  }

  getWordCount(auditResults) {
    try {
      const results = typeof auditResults === 'string' ? JSON.parse(auditResults) : auditResults;
      return results?.wordCount || 0;
    } catch {
      return 0;
    }
  }

  getInternalLinkCount(auditResults) {
    try {
      const results = typeof auditResults === 'string' ? JSON.parse(auditResults) : auditResults;
      return results?.internalLinks?.length || 0;
    } catch {
      return 0;
    }
  }

  countCompetitors(responseText) {
    if (!responseText) return 0;
    const competitors = ['CarDekho', 'Cars24', 'Spinny', 'OLX'];
    return competitors.filter(c => responseText.includes(c)).length;
  }

  getDefaultAuditMetrics() {
    return {
      overall_score: 50,
      faq_schema_present: false,
      vehicle_schema_present: false,
      canonical_present: true,
      meta_description_length: 120,
      h1_has_city: false,
      images_with_alt: 0.5,
      word_count: 500,
      internal_link_count: 3,
    };
  }
}

// Singleton instance
let instance = null;
export function getMetricsAggregator() {
  if (!instance) {
    instance = new MetricsAggregator();
  }
  return instance;
}
