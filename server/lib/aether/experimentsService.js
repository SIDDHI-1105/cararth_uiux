import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { aetherLearn } from './aetherLearn.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXPERIMENTS_FILE = path.join(__dirname, '../../../data/aether/experiments.json');

/**
 * Experiments system for A/B testing content briefs and prompts
 */
class ExperimentsService {
  constructor() {
    this.ensureDataDirectory();
  }

  ensureDataDirectory() {
    const dir = path.dirname(EXPERIMENTS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Create and run a new experiment
   */
  async createExperiment(params) {
    const {
      briefId = null,
      promptId = null,
      page,
      kpis = { geo_delta: 0, organic_pct: 0 },
      durationDays = 0,
      metadata = {}
    } = params;

    const experimentId = crypto.randomUUID();
    const experiment = {
      id: experimentId,
      briefId,
      promptId,
      page,
      kpis,
      durationDays,
      metadata,
      status: durationDays === 0 ? 'completed' : 'running',
      createdAt: new Date().toISOString(),
      startAt: new Date().toISOString(),
      completedAt: null,
      baseline: this.generateBaseline(),
      result: null
    };

    // If duration is 0, run evaluation immediately (fast-forward)
    if (durationDays === 0) {
      experiment.result = await this.evaluateExperiment(experiment);
      experiment.completedAt = new Date().toISOString();
      
      // Update learning weights
      if (experiment.result.performanceScore !== null) {
        await this.updateWeightsFromResult(experiment);
      }
    }

    // Save experiment
    this.saveExperiment(experiment);

    console.log(`[Experiments] Created experiment ${experimentId} (status: ${experiment.status})`);
    
    return experiment;
  }

  /**
   * Generate baseline metrics (mock or from GA4)
   */
  generateBaseline() {
    // In production, this would query GA4 or other analytics
    // For now, generate reasonable mock baseline
    return {
      geoMentionRate: 0.0,
      organicTraffic: 100,
      bounceRate: 65.5,
      avgSessionDuration: 125,
      source: 'mock'
    };
  }

  /**
   * Evaluate experiment and calculate performance score
   */
  async evaluateExperiment(experiment) {
    // In production, this would:
    // 1. Query GA4 for actual metrics
    // 2. Compare against baseline
    // 3. Calculate statistical significance
    
    // For fast-forward (duration=0), simulate result
    const { kpis, baseline } = experiment;
    
    // Calculate actual improvements
    const geoImprovement = kpis.geo_delta; // -100 to +100
    const organicImprovement = kpis.organic_pct; // 0 to 100
    
    // Calculate performance score (0-1 range)
    const performanceScore = aetherLearn.calculatePerformanceScore(kpis);
    
    // Determine if successful
    const successful = performanceScore >= 0.6; // 60% threshold
    
    return {
      performanceScore,
      successful,
      metrics: {
        geoMentionRate: baseline.geoMentionRate + (geoImprovement / 100),
        organicTraffic: Math.round(baseline.organicTraffic * (1 + organicImprovement / 100)),
        improvement: {
          geo: geoImprovement,
          organic: organicImprovement
        }
      },
      evaluation: {
        threshold: 0.6,
        passed: successful,
        notes: successful 
          ? 'Experiment exceeded performance threshold'
          : 'Experiment did not meet performance threshold'
      },
      evaluatedAt: new Date().toISOString()
    };
  }

  /**
   * Update learning weights based on experiment result
   */
  async updateWeightsFromResult(experiment) {
    const { promptId, metadata, result } = experiment;
    
    if (!result || result.performanceScore === null) {
      return false;
    }

    const updateData = {
      promptId: promptId || metadata.promptId,
      category: metadata.category,
      performanceScore: result.performanceScore
    };

    aetherLearn.updateWeights(updateData);
    
    console.log(`[Experiments] Updated weights from experiment ${experiment.id}: score=${result.performanceScore.toFixed(3)}`);
    
    return true;
  }

  /**
   * Save experiment to file
   */
  saveExperiment(experiment) {
    try {
      let experiments = this.loadExperiments();
      experiments.push(experiment);
      
      // Keep last 500 experiments
      if (experiments.length > 500) {
        experiments = experiments.slice(-500);
      }
      
      fs.writeFileSync(EXPERIMENTS_FILE, JSON.stringify(experiments, null, 2));
      return true;
    } catch (error) {
      console.error('[Experiments] Failed to save:', error);
      return false;
    }
  }

  /**
   * Load all experiments
   */
  loadExperiments() {
    try {
      if (!fs.existsSync(EXPERIMENTS_FILE)) {
        return [];
      }
      
      const data = fs.readFileSync(EXPERIMENTS_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('[Experiments] Failed to load:', error);
      return [];
    }
  }

  /**
   * Get experiment by ID
   */
  getExperiment(id) {
    const experiments = this.loadExperiments();
    return experiments.find(e => e.id === id) || null;
  }

  /**
   * Get experiments with filtering
   */
  getExperiments(filters = {}) {
    let experiments = this.loadExperiments();
    
    // Filter by status
    if (filters.status) {
      experiments = experiments.filter(e => e.status === filters.status);
    }
    
    // Filter by page
    if (filters.page) {
      experiments = experiments.filter(e => e.page === filters.page);
    }
    
    // Limit results
    const limit = filters.limit || 100;
    const offset = filters.offset || 0;
    
    const total = experiments.length;
    const results = experiments
      .slice()
      .reverse() // Most recent first
      .slice(offset, offset + limit);
    
    return {
      experiments: results,
      total,
      limit,
      offset
    };
  }

  /**
   * Get experiment statistics
   */
  getStats() {
    const experiments = this.loadExperiments();
    const completed = experiments.filter(e => e.status === 'completed');
    const successful = completed.filter(e => e.result?.successful);
    
    let totalScore = 0;
    let scoreCount = 0;
    
    for (const exp of completed) {
      if (exp.result?.performanceScore !== null && exp.result?.performanceScore !== undefined) {
        totalScore += exp.result.performanceScore;
        scoreCount++;
      }
    }
    
    return {
      total: experiments.length,
      running: experiments.filter(e => e.status === 'running').length,
      completed: completed.length,
      successful: successful.length,
      successRate: completed.length > 0 
        ? ((successful.length / completed.length) * 100).toFixed(1) + '%'
        : '0%',
      avgPerformanceScore: scoreCount > 0
        ? (totalScore / scoreCount).toFixed(3)
        : 0,
      lastExperimentAt: experiments.length > 0
        ? experiments[experiments.length - 1].createdAt
        : null
    };
  }

  /**
   * Update experiment status (for long-running experiments)
   */
  async updateExperimentStatus(id, newStatus) {
    const experiments = this.loadExperiments();
    const experiment = experiments.find(e => e.id === id);
    
    if (!experiment) {
      return null;
    }
    
    experiment.status = newStatus;
    
    if (newStatus === 'completed') {
      experiment.result = await this.evaluateExperiment(experiment);
      experiment.completedAt = new Date().toISOString();
      
      if (experiment.result.performanceScore !== null) {
        await this.updateWeightsFromResult(experiment);
      }
    }
    
    fs.writeFileSync(EXPERIMENTS_FILE, JSON.stringify(experiments, null, 2));
    
    return experiment;
  }
}

// Export singleton instance
export const experimentsService = new ExperimentsService();
