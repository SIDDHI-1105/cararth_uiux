import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SWEEPS_FILE = path.join(__dirname, '../../../../data/aether/sweeps.json');

/**
 * GEO Correlation Checker
 * Correlate SEO issues with AI mention rates from sweeps.json
 */
export class GeoCorrelationChecker {
  constructor() {
    this.timeout = 25000;
  }

  /**
   * Run GEO correlation checks
   */
  async check(url, correlationId) {
    const startTime = Date.now();
    
    try {
      // Load sweeps data
      const sweeps = this.loadSweeps();
      
      if (!sweeps || sweeps.length === 0) {
        console.warn('[GeoCorrelationChecker] No sweeps data found, using mock');
        return this.getMockResult(url, correlationId);
      }

      const analysis = this.analyzeSweeps(sweeps);
      const issues = this.generateIssues(analysis);
      const categoryScore = this.calculateScore(analysis);
      
      return {
        category: 'GEO Visibility',
        issues,
        categoryScore,
        analysis,
        duration: Date.now() - startTime,
        correlationId
      };
    } catch (error) {
      console.error('[GeoCorrelationChecker] Error:', error);
      return this.getMockResult(url, correlationId);
    }
  }

  /**
   * Load sweeps data
   */
  loadSweeps() {
    try {
      if (!fs.existsSync(SWEEPS_FILE)) {
        return null;
      }

      const data = fs.readFileSync(SWEEPS_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('[GeoCorrelationChecker] Failed to load sweeps:', error);
      return null;
    }
  }

  /**
   * Analyze sweeps data
   */
  analyzeSweeps(sweeps) {
    const totalSweeps = sweeps.length;
    const mentionedSweeps = sweeps.filter(s => s.cararthMentioned === true).length;
    const mentionRate = totalSweeps > 0 ? (mentionedSweeps / totalSweeps) * 100 : 0;

    // Count competitor mentions
    const competitorCounts = {};
    for (const sweep of sweeps) {
      if (sweep.competitorsMentioned && Array.isArray(sweep.competitorsMentioned)) {
        for (const competitor of sweep.competitorsMentioned) {
          competitorCounts[competitor] = (competitorCounts[competitor] || 0) + 1;
        }
      }
    }

    // Sort competitors by mention count
    const topCompetitors = Object.entries(competitorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        mentions: count,
        rate: (count / totalSweeps) * 100
      }));

    // Analyze by category
    const categoryBreakdown = {};
    for (const sweep of sweeps) {
      const cat = sweep.promptCategory || 'uncategorized';
      if (!categoryBreakdown[cat]) {
        categoryBreakdown[cat] = { total: 0, mentioned: 0 };
      }
      categoryBreakdown[cat].total++;
      if (sweep.cararthMentioned) {
        categoryBreakdown[cat].mentioned++;
      }
    }

    return {
      totalSweeps,
      mentionedSweeps,
      mentionRate: mentionRate.toFixed(2),
      topCompetitors,
      categoryBreakdown,
      averageCompetitorRate: topCompetitors.length > 0 
        ? (topCompetitors.reduce((sum, c) => sum + c.rate, 0) / topCompetitors.length).toFixed(2)
        : 0
    };
  }

  /**
   * Generate issues based on analysis
   */
  generateIssues(analysis) {
    const issues = [];

    // Low overall mention rate
    if (parseFloat(analysis.mentionRate) < 5) {
      issues.push({
        id: 'geo_low_mention_rate',
        page: 'Overall visibility',
        severity: 'critical',
        description: `Very low AI mention rate (${analysis.mentionRate}%, target: >20%)`,
        impact_score: 0.90,
        suggested_fix: 'Improve structured data, content authority, and backlink profile to increase AI visibility'
      });
    } else if (parseFloat(analysis.mentionRate) < 15) {
      issues.push({
        id: 'geo_moderate_mention_rate',
        page: 'Overall visibility',
        severity: 'high',
        description: `Moderate AI mention rate (${analysis.mentionRate}%, target: >20%)`,
        impact_score: 0.65,
        suggested_fix: 'Enhance content quality and structured data to improve AI recommendation rate'
      });
    }

    // Competitor gap analysis
    if (analysis.topCompetitors.length > 0) {
      const topCompetitorRate = analysis.topCompetitors[0].rate;
      const gap = topCompetitorRate - parseFloat(analysis.mentionRate);
      
      if (gap > 50) {
        issues.push({
          id: 'geo_large_competitor_gap',
          page: 'Competitive position',
          severity: 'critical',
          description: `Large visibility gap with ${analysis.topCompetitors[0].name} (${gap.toFixed(1)}% difference)`,
          impact_score: 0.85,
          suggested_fix: 'Analyze competitor SEO strategy and implement similar structured data patterns'
        });
      } else if (gap > 20) {
        issues.push({
          id: 'geo_moderate_competitor_gap',
          page: 'Competitive position',
          severity: 'high',
          description: `Notable visibility gap with top competitors (~${gap.toFixed(1)}% difference)`,
          impact_score: 0.60,
          suggested_fix: 'Improve content relevance and authority signals'
        });
      }
    }

    // Category-specific issues
    for (const [category, stats] of Object.entries(analysis.categoryBreakdown)) {
      const categoryRate = stats.total > 0 ? (stats.mentioned / stats.total) * 100 : 0;
      
      if (categoryRate === 0 && stats.total > 2) {
        issues.push({
          id: `geo_category_zero_${category}`,
          page: `Category: ${category}`,
          severity: 'high',
          description: `Zero AI mentions in "${category}" category (${stats.total} queries)`,
          impact_score: 0.70,
          suggested_fix: `Create targeted content for ${category} queries with strong E-A-T signals`
        });
      }
    }

    return issues;
  }

  /**
   * Calculate category score
   */
  calculateScore(analysis) {
    const mentionRate = parseFloat(analysis.mentionRate);
    
    // Base score on mention rate (0-100 scale)
    let score = mentionRate * 5; // 20% = 100 score
    
    // Penalty for competitor gap
    if (analysis.topCompetitors.length > 0) {
      const topRate = analysis.topCompetitors[0].rate;
      const gap = topRate - mentionRate;
      
      if (gap > 0) {
        const gapPenalty = Math.min(30, gap * 0.5);
        score -= gapPenalty;
      }
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Generate deterministic mock result
   */
  getMockResult(url, correlationId) {
    const hash = crypto.createHash('sha256').update(url).digest('hex');
    const hashValue = parseInt(hash.substring(0, 8), 16);
    
    const mentionRate = 5 + (hashValue % 15); // 5-20%
    
    const issues = [];
    
    if (mentionRate < 10) {
      issues.push({
        id: 'geo_low_mention_rate',
        page: 'Overall visibility',
        severity: 'critical',
        description: `Very low AI mention rate (${mentionRate}%, target: >20%)`,
        impact_score: 0.90,
        suggested_fix: 'Improve structured data, content authority, and backlink profile'
      });
    }

    if (hashValue % 2 === 0) {
      issues.push({
        id: 'geo_large_competitor_gap',
        page: 'Competitive position',
        severity: 'critical',
        description: 'Large visibility gap with CarDekho (68% difference)',
        impact_score: 0.85,
        suggested_fix: 'Analyze competitor SEO strategy and implement similar patterns'
      });
    }

    const categoryScore = mentionRate * 5;

    return {
      category: 'GEO Visibility',
      issues,
      categoryScore: Math.round(categoryScore),
      analysis: {
        totalSweeps: 50,
        mentionedSweeps: Math.round(50 * mentionRate / 100),
        mentionRate: mentionRate.toFixed(2),
        topCompetitors: [
          { name: 'CarDekho', mentions: 35, rate: 70 },
          { name: 'Cars24', mentions: 28, rate: 56 },
          { name: 'OLX', mentions: 25, rate: 50 }
        ]
      },
      mock: true,
      correlationId
    };
  }
}

export const geoCorrelationChecker = new GeoCorrelationChecker();
