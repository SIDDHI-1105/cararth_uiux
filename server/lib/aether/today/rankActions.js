import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../../../db.js';
import { aetherActions, aetherWatchlist } from '../../../../shared/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { getMetricsAggregator } from './data-sources/metricsAggregator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Evaluate rule condition against page metrics
 * Supports both simple JavaScript expressions and KPI-based conditions
 */
function evaluateCondition(condition, metrics) {
  try {
    // New format: KPI-based condition { kpi, op, value }
    if (typeof condition === 'object' && condition.kpi) {
      const kpiValue = metrics[condition.kpi];
      if (kpiValue === undefined || kpiValue === null) return false;
      
      switch (condition.op) {
        case '>': return kpiValue > condition.value;
        case '>=': return kpiValue >= condition.value;
        case '<': return kpiValue < condition.value;
        case '<=': return kpiValue <= condition.value;
        case '==': return kpiValue == condition.value;
        case '===': return kpiValue === condition.value;
        case '!=': return kpiValue != condition.value;
        case '!==': return kpiValue !== condition.value;
        default:
          console.warn('[RankActions] Unknown operator:', condition.op);
          return false;
      }
    }
    
    // Old format: Simple JavaScript expression string
    if (typeof condition === 'string') {
      const context = { ...metrics };
      const func = new Function(...Object.keys(context), `return ${condition}`);
      return func(...Object.values(context));
    }
    
    console.warn('[RankActions] Invalid condition format:', condition);
    return false;
  } catch (err) {
    console.warn('[RankActions] Failed to evaluate condition:', condition, err.message);
    return false;
  }
}

/**
 * Calculate gap score for a rule
 * Larger gap = higher priority
 */
function calculateGap(rule, metrics) {
  // Get expected uplift (support both old and new format)
  const uplift = rule.expected_uplift_default ?? rule.expected_uplift ?? 0.05;
  
  // Severity multiplier (new format)
  let severityMultiplier = 1.0;
  if (rule.severity === 'critical') severityMultiplier = 1.5;
  else if (rule.severity === 'high') severityMultiplier = 1.3;
  else if (rule.severity === 'medium') severityMultiplier = 1.1;
  else if (rule.severity === 'low') severityMultiplier = 0.9;
  
  // Pillar-based boost
  let pillarBoost = 1.0;
  if (rule.id.includes('schema') || rule.pillar === 'Schema') pillarBoost = 1.2;
  if (rule.id.includes('geo') || rule.pillar === 'GEO') pillarBoost = 1.5;
  if (rule.id.includes('perf') || rule.pillar === 'Performance') pillarBoost = 1.1;
  
  return uplift * severityMultiplier * pillarBoost;
}

/**
 * Get learning weight for a pillar
 * Uses AETHER learning weights if available
 */
function getLearningWeight(pillar) {
  try {
    const weightsPath = path.join(__dirname, '../../../../data/aether/audit_weights.json');
    if (!fs.existsSync(weightsPath)) return 1.0;
    
    const weights = JSON.parse(fs.readFileSync(weightsPath, 'utf8'));
    
    // Map all pillars to learning weight categories
    const mapping = {
      // Core pillars (from audit_weights.json)
      'Schema': weights.schema || 0.2,
      'Content': weights.content || 0.25,
      'Performance': weights.performance || 0.2,
      'Internal Linking': weights.content || 0.25,
      
      // New pillars from enhanced ruleset
      'Indexability': weights.technical || weights.schema || 0.22,
      'GEO': weights.content || 0.28, // Higher weight for AI mentions
      'Commerce': weights.schema || 0.2,
      'Analytics': 0.18,
      'Trust (E-E-A-T)': weights.content || 0.24,
      'Accessibility': 0.15,
      'Sharing': 0.16
    };
    
    return mapping[pillar] || 1.0;
  } catch (err) {
    console.warn('[RankActions] Failed to load learning weights:', err.message);
    return 1.0;
  }
}

/**
 * Rank actions for a city
 */
export async function rankActionsForCity(city = 'Hyderabad') {
  console.log(`[RankActions] Generating Top 5 actions for ${city}`);
  
  try {
    // Load rules
    const rulesPath = path.join(__dirname, '../../../../data/aether/action_rules.json');
    const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
    
    // Get watchlist pages for city
    const watchlistPages = await db
      .select()
      .from(aetherWatchlist)
      .where(and(
        eq(aetherWatchlist.city, city),
        eq(aetherWatchlist.isActive, true)
      ));
    
    console.log(`[RankActions] Found ${watchlistPages.length} watchlist pages`);
    
    // Fetch real metrics for all watchlist pages
    const aggregator = getMetricsAggregator();
    const pageUrls = watchlistPages.map(wp => wp.page);
    const allMetrics = await aggregator.getPageMetrics(pageUrls, city);
    
    // Evaluate rules for each page
    const candidateActions = [];
    
    for (const watchlistPage of watchlistPages) {
      const metrics = allMetrics[watchlistPage.page];
      
      for (const rule of rules) {
        // Check if condition matches
        if (evaluateCondition(rule.condition, metrics)) {
          const gap = calculateGap(rule, metrics);
          const learningWeight = getLearningWeight(rule.pillar);
          const cityBias = rule.city_bias || 1.0;
          
          // Score formula: gap × learning_weight × city_bias
          const score = gap * learningWeight * cityBias;
          
          // Effort penalty (lower effort = higher priority)
          const effortMultiplier = rule.effort === 'low' ? 1.2 : rule.effort === 'high' ? 0.8 : 1.0;
          const finalScore = score * effortMultiplier;
          
          // Support both old and new rule formats
          const uplift = rule.expected_uplift_default ?? rule.expected_uplift ?? 0.05;
          const title = rule.title || rule.suggested_fix?.substring(0, 80) || rule.do?.substring(0, 80);
          const suggestedFix = rule.suggested_fix || `Apply this fix to ${watchlistPage.page}`;
          
          candidateActions.push({
            page: watchlistPage.page,
            city,
            pillar: rule.pillar,
            title,
            do: rule.do,
            dont: rule.dont,
            suggestedFix,
            expectedUplift: uplift * learningWeight,
            effort: rule.effort,
            confidence: learningWeight,
                evidence: {
                  rule_id: rule.id,
                  metrics: metrics,
                  gap_score: gap,
                  learning_weight: learningWeight,
                  city_bias: cityBias
                },
                score: finalScore
              });
            }
          }
        }
    
    // Sort by score and take Top 5
    candidateActions.sort((a, b) => b.score - a.score);
    const top5 = candidateActions.slice(0, 5);
    
    // Save to database
    const today = new Date();
    const savedActions = [];
    
    for (let i = 0; i < top5.length; i++) {
      const action = top5[i];
      const [saved] = await db.insert(aetherActions).values({
        date: today,
        priority: i + 1,
        page: action.page,
        city: action.city,
        pillar: action.pillar,
        title: action.title,
        do: action.do,
        dont: action.dont,
        suggestedFix: action.suggestedFix,
        expectedUplift: action.expectedUplift.toFixed(2),
        effort: action.effort,
        confidence: action.confidence.toFixed(2),
        evidence: action.evidence,
        status: 'open'
      }).returning();
      
      savedActions.push(saved);
    }
    
    console.log(`[RankActions] ✓ Generated and saved ${savedActions.length} actions`);
    return savedActions;
    
  } catch (err) {
    console.error('[RankActions] Error:', err);
    throw err;
  }
}

/**
 * Get latest actions for a city
 */
export async function getLatestActions(city = 'Hyderabad', limit = 5) {
  const actions = await db
    .select()
    .from(aetherActions)
    .where(eq(aetherActions.city, city))
    .orderBy(desc(aetherActions.date), aetherActions.priority)
    .limit(limit);
  
  return actions;
}
