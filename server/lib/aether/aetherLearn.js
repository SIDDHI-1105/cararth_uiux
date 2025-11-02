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
