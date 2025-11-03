import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WEIGHTS_FILE = path.join(__dirname, '../../../data/aether/weights.json');

/**
 * Learning weights system using exponential smoothing
 */
class AetherLearn {
  constructor() {
    this.weights = null;
    this.load();
  }

  /**
   * Load weights from file
   */
  load() {
    try {
      if (!fs.existsSync(WEIGHTS_FILE)) {
        console.log('[AetherLearn] No weights file found, using defaults');
        this.weights = this.getDefaultWeights();
        this.persist();
        return;
      }

      const data = fs.readFileSync(WEIGHTS_FILE, 'utf8');
      this.weights = JSON.parse(data);
      console.log('[AetherLearn] Loaded weights from file');
    } catch (error) {
      console.error('[AetherLearn] Failed to load weights:', error);
      this.weights = this.getDefaultWeights();
    }
  }

  /**
   * Get default weights structure
   */
  getDefaultWeights() {
    return {
      promptWeights: {},
      categoryWeights: {
        general_search: 1.0,
        location_specific: 1.0,
        trust_safety: 1.2,
        price_comparison: 1.0,
        brand_specific: 0.9,
        features: 0.95,
        competitor_comparison: 1.3,
        selling: 0.9,
        type_specific: 0.85
      },
      learningRate: 0.1,
      lastUpdated: null
    };
  }

  /**
   * Persist weights to file
   */
  persist() {
    try {
      const dir = path.dirname(WEIGHTS_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      this.weights.lastUpdated = new Date().toISOString();
      fs.writeFileSync(WEIGHTS_FILE, JSON.stringify(this.weights, null, 2));
      console.log('[AetherLearn] Persisted weights to file');
      return true;
    } catch (error) {
      console.error('[AetherLearn] Failed to persist weights:', error);
      return false;
    }
  }

  /**
   * Get weight for a specific prompt
   */
  getPromptWeight(promptId) {
    return this.weights.promptWeights[promptId] || 1.0;
  }

  /**
   * Get weight for a category
   */
  getCategoryWeight(category) {
    return this.weights.categoryWeights[category] || 1.0;
  }

  /**
   * Update weights based on experiment results using exponential smoothing
   * Formula: new_weight = (1 - α) * old_weight + α * performance_score
   * where α is the learning rate
   */
  updateWeights(experimentResult) {
    try {
      const { promptId, category, performanceScore } = experimentResult;
      const alpha = this.weights.learningRate;

      // Update prompt weight if prompt ID provided
      if (promptId) {
        const oldWeight = this.getPromptWeight(promptId);
        const newWeight = (1 - alpha) * oldWeight + alpha * performanceScore;
        this.weights.promptWeights[promptId] = newWeight;
        
        console.log(`[AetherLearn] Updated prompt "${promptId}": ${oldWeight.toFixed(3)} → ${newWeight.toFixed(3)}`);
      }

      // Update category weight if category provided
      if (category) {
        const oldWeight = this.getCategoryWeight(category);
        const newWeight = (1 - alpha) * oldWeight + alpha * performanceScore;
        this.weights.categoryWeights[category] = newWeight;
        
        console.log(`[AetherLearn] Updated category "${category}": ${oldWeight.toFixed(3)} → ${newWeight.toFixed(3)}`);
      }

      this.persist();
      return true;
    } catch (error) {
      console.error('[AetherLearn] Failed to update weights:', error);
      return false;
    }
  }

  /**
   * Calculate performance score from experiment KPIs
   */
  calculatePerformanceScore(kpis) {
    // Normalize KPIs to 0-1 range and combine
    // Higher geo_delta and organic_pct are better
    const geoScore = Math.max(0, Math.min(1, (kpis.geo_delta + 100) / 200)); // -100 to +100 → 0 to 1
    const organicScore = Math.max(0, Math.min(1, kpis.organic_pct / 100)); // 0 to 100 → 0 to 1
    
    // Weighted average (you can adjust weights)
    const score = (geoScore * 0.6) + (organicScore * 0.4);
    
    return score;
  }

  /**
   * Get top performing prompts
   */
  getTopPrompts(limit = 10) {
    const prompts = Object.entries(this.weights.promptWeights)
      .map(([id, weight]) => ({ promptId: id, weight }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, limit);
    
    return prompts;
  }

  /**
   * Get bottom performing prompts
   */
  getBottomPrompts(limit = 10) {
    const prompts = Object.entries(this.weights.promptWeights)
      .map(([id, weight]) => ({ promptId: id, weight }))
      .sort((a, b) => a.weight - b.weight)
      .slice(0, limit);
    
    return prompts;
  }

  /**
   * Get learning statistics
   */
  getStats() {
    const promptWeightValues = Object.values(this.weights.promptWeights);
    const categoryWeightValues = Object.values(this.weights.categoryWeights);

    return {
      totalPrompts: promptWeightValues.length,
      totalCategories: categoryWeightValues.length,
      avgPromptWeight: promptWeightValues.length > 0
        ? (promptWeightValues.reduce((a, b) => a + b, 0) / promptWeightValues.length).toFixed(3)
        : 0,
      avgCategoryWeight: categoryWeightValues.length > 0
        ? (categoryWeightValues.reduce((a, b) => a + b, 0) / categoryWeightValues.length).toFixed(3)
        : 0,
      learningRate: this.weights.learningRate,
      lastUpdated: this.weights.lastUpdated,
      topPrompts: this.getTopPrompts(5),
      bottomPrompts: this.getBottomPrompts(5)
    };
  }

  /**
   * Set learning rate
   */
  setLearningRate(rate) {
    if (rate > 0 && rate <= 1) {
      this.weights.learningRate = rate;
      this.persist();
      return true;
    }
    return false;
  }

  /**
   * Reset all weights to defaults
   */
  reset() {
    this.weights = this.getDefaultWeights();
    this.persist();
    console.log('[AetherLearn] Reset all weights to defaults');
    return true;
  }
}

// Export singleton instance
export const aetherLearn = new AetherLearn();

// ============================================================================
// SEO AUDIT MODULE WEIGHT LEARNING
// ============================================================================

const AUDIT_WEIGHTS_FILE = path.join(__dirname, '../../../data/aether/audit_weights.json');
const LEARNING_LOG_FILE = path.join(__dirname, '../../../data/aether/agent.log');

/**
 * Initialize default SEO audit module weights if they don't exist
 */
export function initWeights() {
  if (!fs.existsSync(AUDIT_WEIGHTS_FILE)) {
    const dir = path.dirname(AUDIT_WEIGHTS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const defaults = {
      indexability: 0.2,
      schema: 0.2,
      content: 0.25,
      performance: 0.2,
      geoCorrelation: 0.15,
      lastUpdated: new Date().toISOString(),
      version: "1.0.0"
    };
    
    fs.writeFileSync(AUDIT_WEIGHTS_FILE, JSON.stringify(defaults, null, 2));
    console.log('[AETHER_LEARN] Initialized default audit weights at', AUDIT_WEIGHTS_FILE);
  }
}

/**
 * Get current SEO audit module weights
 */
export function getWeights() {
  if (!fs.existsSync(AUDIT_WEIGHTS_FILE)) {
    initWeights();
  }
  return JSON.parse(fs.readFileSync(AUDIT_WEIGHTS_FILE, "utf8"));
}

/**
 * Update weights based on observed impact
 * @param {Object} observedImpact - Object with impact values for each dimension
 * @returns {Object} Updated weights
 */
export function updateWeights(observedImpact) {
  const current = getWeights();
  const alpha = 0.2; // smoothing factor for exponential moving average
  
  // Update weights using exponential moving average
  for (const key of Object.keys(current)) {
    if (key === 'lastUpdated' || key === 'version') continue;
    
    if (observedImpact[key] !== undefined) {
      current[key] = current[key] * (1 - alpha) + observedImpact[key] * alpha;
    }
  }
  
  // Normalize weights to sum to 1.0
  const total = current.indexability + current.schema + current.content + 
                current.performance + current.geoCorrelation;
  
  if (total > 0) {
    current.indexability /= total;
    current.schema /= total;
    current.content /= total;
    current.performance /= total;
    current.geoCorrelation /= total;
  }
  
  current.lastUpdated = new Date().toISOString();
  
  fs.writeFileSync(AUDIT_WEIGHTS_FILE, JSON.stringify(current, null, 2));
  logLearningEvent(observedImpact, current);
  
  return current;
}

/**
 * Log learning events to agent.log
 */
export function logLearningEvent(observed, updated) {
  const dir = path.dirname(LEARNING_LOG_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  const ts = new Date().toISOString();
  const line = `[AETHER_LEARN ${ts}] Observed ${JSON.stringify(observed)} → Updated ${JSON.stringify({
    indexability: updated.indexability.toFixed(3),
    schema: updated.schema.toFixed(3),
    content: updated.content.toFixed(3),
    performance: updated.performance.toFixed(3),
    geoCorrelation: updated.geoCorrelation.toFixed(3)
  })}\n`;
  
  fs.appendFileSync(LEARNING_LOG_FILE, line);
  console.log(line.trim());
}

/**
 * Learn from historical audits and sweeps
 * This is a simplified version - real implementation would analyze audit results,
 * GEO sweep correlations, and actual traffic/ranking impacts
 */
export function learnFromAudits() {
  const auditsPath = path.join(__dirname, '../../../data/aether/audits.json');
  const sweepsPath = path.join(__dirname, '../../../data/aether/sweeps.json');
  
  // Graceful fallback if no data exists yet
  if (!fs.existsSync(auditsPath) && !fs.existsSync(sweepsPath)) {
    console.log('[AETHER_LEARN] No audit/sweep data available yet - skipping learning cycle');
    return;
  }
  
  try {
    // In a real implementation, this would:
    // 1. Analyze which audit modules found the most impactful issues
    // 2. Correlate SEO fixes with GEO mention improvements
    // 3. Weight modules that historically predicted visibility changes
    // 4. Use statistical analysis to identify signal vs noise
    
    // For now, we'll use a proxy based on recent audit patterns
    const observedImpact = calculateObservedImpact(auditsPath, sweepsPath);
    
    if (observedImpact) {
      updateWeights(observedImpact);
      console.log('[AETHER_LEARN] Successfully updated weights from historical data');
    }
  } catch (error) {
    console.error('[AETHER_LEARN] Error during learning cycle:', error.message);
  }
}

/**
 * Calculate observed impact from audit and sweep data
 * This is a placeholder for more sophisticated correlation analysis
 */
function calculateObservedImpact(auditsPath, sweepsPath) {
  // Simplified version: small adjustments around current weights
  // Real implementation would analyze actual correlations between:
  // - Issue severity × resolution impact
  // - Module findings × GEO mention improvements
  // - Historical pattern analysis
  const base = getWeights();
  
  return {
    indexability: Math.max(0.1, Math.min(0.3, base.indexability + (Math.random() - 0.5) * 0.05)),
    schema: Math.max(0.15, Math.min(0.35, base.schema + (Math.random() - 0.5) * 0.05)),
    content: Math.max(0.15, Math.min(0.35, base.content + (Math.random() - 0.5) * 0.05)),
    performance: Math.max(0.1, Math.min(0.3, base.performance + (Math.random() - 0.5) * 0.05)),
    geoCorrelation: Math.max(0.05, Math.min(0.25, base.geoCorrelation + (Math.random() - 0.5) * 0.05))
  };
}

/**
 * Reset audit weights to defaults (for testing/admin purposes)
 */
export function resetAuditWeights() {
  if (fs.existsSync(AUDIT_WEIGHTS_FILE)) {
    fs.unlinkSync(AUDIT_WEIGHTS_FILE);
  }
  initWeights();
  console.log('[AETHER_LEARN] Audit weights reset to defaults');
  return getWeights();
}
