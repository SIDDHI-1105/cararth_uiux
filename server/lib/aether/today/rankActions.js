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
 */
function evaluateCondition(condition, metrics) {
  try {
    // Create a safe evaluation context
    const context = { ...metrics };
    // Simple condition evaluation for MVP
    const func = new Function(...Object.keys(context), `return ${condition}`);
    return func(...Object.values(context));
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
  // Simple gap scoring based on expected uplift
  if (rule.id.includes('schema')) return rule.expected_uplift * 1.2;
  if (rule.id.includes('geo') || rule.id.includes('ai')) return rule.expected_uplift * 1.5;
  if (rule.id.includes('content')) return rule.expected_uplift * 1.1;
  return rule.expected_uplift;
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
    
    // Map pillars to learning weight categories
    const mapping = {
      'Schema': weights.schema || 0.2,
      'Content': weights.content || 0.25,
      'Performance': weights.performance || 0.2,
      'Internal Linking': weights.content || 0.25
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
          
          candidateActions.push({
            page: watchlistPage.page,
            city,
            pillar: rule.pillar,
            title: rule.title,
            do: rule.do,
            dont: rule.dont,
            suggestedFix: `Apply this fix to ${watchlistPage.page}`,
            expectedUplift: rule.expected_uplift * learningWeight,
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
