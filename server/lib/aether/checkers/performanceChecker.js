import crypto from 'crypto';

/**
 * Performance Checker
 * Mock Lighthouse scores (FCP, LCP, CLS, TBT) - deterministic based on URL hash
 */
export class PerformanceChecker {
  constructor() {
    this.timeout = 25000;
  }

  /**
   * Run performance checks (deterministic mock)
   */
  async check(url, correlationId) {
    const startTime = Date.now();
    
    // Generate deterministic scores based on URL hash
    const hash = crypto.createHash('sha256').update(url).digest('hex');
    const hashBuffer = Buffer.from(hash, 'hex');
    
    // Extract deterministic values from hash
    const fcp = 1000 + (hashBuffer[0] % 2000); // 1000-3000ms
    const lcp = 1500 + (hashBuffer[1] % 3500); // 1500-5000ms
    const cls = (hashBuffer[2] % 30) / 100; // 0.00-0.30
    const tbt = 100 + (hashBuffer[3] % 500); // 100-600ms
    const si = 2000 + (hashBuffer[4] % 4000); // 2000-6000ms
    const tti = 3000 + (hashBuffer[5] % 5000); // 3000-8000ms
    
    const metrics = {
      fcp: { value: fcp, unit: 'ms', name: 'First Contentful Paint' },
      lcp: { value: lcp, unit: 'ms', name: 'Largest Contentful Paint' },
      cls: { value: cls, unit: '', name: 'Cumulative Layout Shift' },
      tbt: { value: tbt, unit: 'ms', name: 'Total Blocking Time' },
      si: { value: si, unit: 'ms', name: 'Speed Index' },
      tti: { value: tti, unit: 'ms', name: 'Time to Interactive' }
    };
    
    const issues = this.analyzeMetrics(metrics);
    const categoryScore = this.calculateScore(metrics);
    
    return {
      category: 'Performance',
      issues,
      categoryScore,
      metrics,
      duration: Date.now() - startTime,
      correlationId,
      mock: true
    };
  }

  /**
   * Analyze metrics and generate issues
   */
  analyzeMetrics(metrics) {
    const issues = [];
    
    // FCP (First Contentful Paint)
    if (metrics.fcp.value > 2500) {
      issues.push({
        id: 'performance_slow_fcp',
        page: '/',
        severity: 'high',
        description: `Slow First Contentful Paint (${metrics.fcp.value}ms, target: <1800ms)`,
        impact_score: 0.70,
        suggested_fix: 'Optimize server response time, reduce render-blocking resources'
      });
    } else if (metrics.fcp.value > 1800) {
      issues.push({
        id: 'performance_moderate_fcp',
        page: '/',
        severity: 'medium',
        description: `Moderate First Contentful Paint (${metrics.fcp.value}ms, target: <1800ms)`,
        impact_score: 0.40,
        suggested_fix: 'Consider optimizing critical rendering path'
      });
    }

    // LCP (Largest Contentful Paint)
    if (metrics.lcp.value > 4000) {
      issues.push({
        id: 'performance_slow_lcp',
        page: '/',
        severity: 'critical',
        description: `Slow Largest Contentful Paint (${metrics.lcp.value}ms, target: <2500ms)`,
        impact_score: 0.85,
        suggested_fix: 'Optimize images, reduce server response time, preload critical resources'
      });
    } else if (metrics.lcp.value > 2500) {
      issues.push({
        id: 'performance_moderate_lcp',
        page: '/',
        severity: 'high',
        description: `Moderate Largest Contentful Paint (${metrics.lcp.value}ms, target: <2500ms)`,
        impact_score: 0.60,
        suggested_fix: 'Optimize hero images and defer non-critical resources'
      });
    }

    // CLS (Cumulative Layout Shift)
    if (metrics.cls.value > 0.25) {
      issues.push({
        id: 'performance_high_cls',
        page: '/',
        severity: 'critical',
        description: `High Cumulative Layout Shift (${metrics.cls.value.toFixed(3)}, target: <0.1)`,
        impact_score: 0.80,
        suggested_fix: 'Add size attributes to images, avoid inserting content above existing content'
      });
    } else if (metrics.cls.value > 0.1) {
      issues.push({
        id: 'performance_moderate_cls',
        page: '/',
        severity: 'medium',
        description: `Moderate Cumulative Layout Shift (${metrics.cls.value.toFixed(3)}, target: <0.1)`,
        impact_score: 0.45,
        suggested_fix: 'Reserve space for dynamic content and ads'
      });
    }

    // TBT (Total Blocking Time)
    if (metrics.tbt.value > 600) {
      issues.push({
        id: 'performance_high_tbt',
        page: '/',
        severity: 'high',
        description: `High Total Blocking Time (${metrics.tbt.value}ms, target: <200ms)`,
        impact_score: 0.65,
        suggested_fix: 'Reduce JavaScript execution time, code splitting, defer non-critical JS'
      });
    } else if (metrics.tbt.value > 300) {
      issues.push({
        id: 'performance_moderate_tbt',
        page: '/',
        severity: 'medium',
        description: `Moderate Total Blocking Time (${metrics.tbt.value}ms, target: <200ms)`,
        impact_score: 0.35,
        suggested_fix: 'Optimize JavaScript bundles'
      });
    }

    // Speed Index
    if (metrics.si.value > 5800) {
      issues.push({
        id: 'performance_slow_si',
        page: '/',
        severity: 'high',
        description: `Slow Speed Index (${metrics.si.value}ms, target: <3400ms)`,
        impact_score: 0.60,
        suggested_fix: 'Optimize above-the-fold content delivery'
      });
    }

    // Time to Interactive
    if (metrics.tti.value > 7200) {
      issues.push({
        id: 'performance_slow_tti',
        page: '/',
        severity: 'high',
        description: `Slow Time to Interactive (${metrics.tti.value}ms, target: <3800ms)`,
        impact_score: 0.55,
        suggested_fix: 'Reduce main thread work and minimize third-party scripts'
      });
    }

    return issues;
  }

  /**
   * Calculate category score based on metrics
   */
  calculateScore(metrics) {
    // Weight each metric
    const weights = {
      fcp: 0.10,
      lcp: 0.25,
      cls: 0.25,
      tbt: 0.20,
      si: 0.10,
      tti: 0.10
    };

    // Score thresholds (good, moderate, poor)
    const thresholds = {
      fcp: { good: 1800, poor: 3000 },
      lcp: { good: 2500, poor: 4000 },
      cls: { good: 0.1, poor: 0.25 },
      tbt: { good: 200, poor: 600 },
      si: { good: 3400, poor: 5800 },
      tti: { good: 3800, poor: 7200 }
    };

    let totalScore = 0;

    for (const [metric, weight] of Object.entries(weights)) {
      const value = metrics[metric].value;
      const threshold = thresholds[metric];
      
      let metricScore;
      if (value <= threshold.good) {
        metricScore = 100;
      } else if (value >= threshold.poor) {
        metricScore = 0;
      } else {
        // Linear interpolation between good and poor
        metricScore = 100 - ((value - threshold.good) / (threshold.poor - threshold.good)) * 100;
      }
      
      totalScore += metricScore * weight;
    }

    return Math.round(totalScore);
  }
}

export const performanceChecker = new PerformanceChecker();
