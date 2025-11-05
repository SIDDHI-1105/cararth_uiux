import { db } from '../../../db.js';
import { 
  aetherCompetitorSnapshots, 
  aetherBenchmarkScores, 
  aetherBenchRecommendations 
} from '../../../../shared/schema.js';
import { desc, eq } from 'drizzle-orm';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RULES_PATH = path.join(__dirname, '../../../../data/aether/bench_rules.json');
const WEIGHTS_PATH = path.join(__dirname, '../../../../data/aether/audit_weights.json');

function loadRules() {
  try {
    const data = fs.readFileSync(RULES_PATH, 'utf-8');
    const rules = JSON.parse(data);
    console.info(`[AETHER_BENCH] Loaded ${rules.length} benchmark rules`);
    return rules;
  } catch (error) {
    console.error(`[AETHER_BENCH] Failed to load rules: ${error.message}`);
    return [];
  }
}

function loadLearningWeights() {
  try {
    if (fs.existsSync(WEIGHTS_PATH)) {
      const data = fs.readFileSync(WEIGHTS_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.warn(`[AETHER_BENCH] Failed to load weights: ${error.message}`);
  }
  
  return {
    'schema_coverage': 0.85,
    'lcp_p75': 0.90,
    'cls_p75': 0.88,
    'ai_mention_rate': 0.92,
    'avg_city_page_wordcount': 0.70
  };
}

function evaluateCondition(kpis, condition) {
  const { kpi, op, value } = condition;
  const actual = kpis[kpi];
  
  if (actual === undefined || actual === null) {
    return false;
  }
  
  switch (op) {
    case '<': return actual < value;
    case '>': return actual > value;
    case '<=': return actual <= value;
    case '>=': return actual >= value;
    case '==': return actual === value;
    default: return false;
  }
}

function computeExpectedUplift(rule, weights, cararthKpis, leaderKpis) {
  let uplift = rule.expected_uplift_default;
  
  const evidenceKeys = rule.evidence_keys || [];
  let weightedGap = 0;
  let totalWeight = 0;
  
  evidenceKeys.forEach(key => {
    const weight = weights[key] || 0.5;
    const cararthValue = cararthKpis[key] || 0;
    const leaderValue = leaderKpis[key] || 0;
    
    const gap = Math.abs(leaderValue - cararthValue);
    weightedGap += gap * weight;
    totalWeight += weight;
  });
  
  if (totalWeight > 0) {
    const gapFactor = weightedGap / totalWeight;
    uplift = rule.expected_uplift_default * (1 + gapFactor);
  }
  
  const severityMultiplier = {
    'critical': 1.5,
    'high': 1.3,
    'medium': 1.0,
    'low': 0.7
  };
  
  uplift *= (severityMultiplier[rule.severity] || 1.0);
  
  return Math.min(0.999, parseFloat(uplift.toFixed(3)));
}

function computeConfidence(rule, cararthKpis) {
  const evidenceKeys = rule.evidence_keys || [];
  let evidenceCount = 0;
  
  evidenceKeys.forEach(key => {
    if (cararthKpis[key] !== undefined && cararthKpis[key] !== null) {
      evidenceCount++;
    }
  });
  
  const dataQuality = evidenceKeys.length > 0 
    ? evidenceCount / evidenceKeys.length 
    : 0.5;
  
  const severityConfidence = {
    'critical': 0.9,
    'high': 0.85,
    'medium': 0.75,
    'low': 0.65
  };
  
  const baseConfidence = severityConfidence[rule.severity] || 0.75;
  const confidence = baseConfidence * dataQuality;
  
  return parseFloat(confidence.toFixed(3));
}

export async function generateRecommendations() {
  try {
    console.info(`[AETHER_BENCH] Generating recommendations...`);
    
    const cararthSnapshots = await db.query.aetherCompetitorSnapshots.findMany({
      where: (snapshots, { eq }) => eq(snapshots.domain, 'cararth.com'),
      orderBy: (snapshots, { desc }) => [desc(snapshots.date)],
      limit: 1
    });
    
    if (cararthSnapshots.length === 0) {
      console.warn(`[AETHER_BENCH] No Cararth snapshot found, using defaults`);
      cararthSnapshots.push({
        domain: 'cararth.com',
        kpis: {
          schema_coverage: 0.95,
          vehicle_schema_coverage: 0.92,
          lcp_p75: 950,
          cls_p75: 0.08,
          inp_p75: 120,
          ai_mention_rate: 0.18,
          avg_city_page_wordcount: 1450,
          topic_count: 22,
          sop_internal_link_depth: 52
        }
      });
    }
    
    const cararthKpis = cararthSnapshots[0].kpis;
    
    const competitorSnapshots = await db.query.aetherCompetitorSnapshots.findMany({
      orderBy: (snapshots, { desc }) => [desc(snapshots.date)]
    });
    
    const leaderKpis = {};
    Object.keys(cararthKpis).forEach(key => {
      const competitorValues = competitorSnapshots
        .map(s => s.kpis[key])
        .filter(v => v !== undefined && v !== null);
      
      if (competitorValues.length > 0) {
        leaderKpis[key] = Math.max(...competitorValues);
      } else {
        leaderKpis[key] = cararthKpis[key];
      }
    });
    
    const rules = loadRules();
    const weights = loadLearningWeights();
    
    const triggeredRules = rules.filter(rule => 
      evaluateCondition(cararthKpis, rule.condition)
    );
    
    console.info(`[AETHER_BENCH] ${triggeredRules.length} rules triggered out of ${rules.length}`);
    
    const recommendations = triggeredRules.map(rule => {
      const expectedUplift = computeExpectedUplift(rule, weights, cararthKpis, leaderKpis);
      const confidence = computeConfidence(rule, cararthKpis);
      
      const evidence = {};
      rule.evidence_keys?.forEach(key => {
        evidence[key] = {
          cararth: cararthKpis[key],
          leader: leaderKpis[key],
          gap: Math.abs((cararthKpis[key] || 0) - (leaderKpis[key] || 0))
        };
      });
      
      return {
        date: new Date(),
        pillar: rule.pillar,
        severity: rule.severity,
        title: rule.title,
        do: rule.do,
        dont: rule.dont,
        evidence,
        expectedUplift: expectedUplift.toString(),
        effort: rule.effort,
        confidence: confidence.toString(),
        status: 'pending'
      };
    });
    
    recommendations.sort((a, b) => {
      const upliftDiff = parseFloat(b.expectedUplift) - parseFloat(a.expectedUplift);
      if (Math.abs(upliftDiff) > 0.01) return upliftDiff;
      
      const confidenceDiff = parseFloat(b.confidence) - parseFloat(a.confidence);
      return confidenceDiff;
    });
    
    const top10 = recommendations.slice(0, 10);
    
    for (const rec of top10) {
      await db.insert(aetherBenchRecommendations).values(rec);
    }
    
    console.info(`[AETHER_BENCH] ✓ Generated and saved ${top10.length} top recommendations`);
    
    top10.forEach((rec, idx) => {
      console.info(`[AETHER_BENCH] #${idx + 1}: ${rec.title} (uplift: ${(parseFloat(rec.expectedUplift) * 100).toFixed(1)}%)`);
    });
    
    return top10;
  } catch (error) {
    console.error(`[AETHER_BENCH] Failed to generate recommendations:`, error);
    throw error;
  }
}

export async function getTopRecommendations(limit = 10, pillar = null, status = 'pending') {
  try {
    let query = db.query.aetherBenchRecommendations.findMany({
      orderBy: (recs, { desc }) => [desc(recs.expectedUplift), desc(recs.confidence)],
      limit
    });
    
    const allRecs = await db.query.aetherBenchRecommendations.findMany({
      orderBy: (recs, { desc }) => [desc(recs.date), desc(recs.expectedUplift)]
    });
    
    let filtered = allRecs;
    
    if (pillar) {
      filtered = filtered.filter(r => r.pillar === pillar);
    }
    
    if (status) {
      filtered = filtered.filter(r => r.status === status);
    }
    
    return filtered.slice(0, limit);
  } catch (error) {
    console.error(`[AETHER_BENCH] Failed to get recommendations:`, error);
    throw error;
  }
}
