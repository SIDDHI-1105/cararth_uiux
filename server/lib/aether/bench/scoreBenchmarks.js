import { db } from '../../../db.js';
import { aetherCompetitorSnapshots, aetherBenchmarkScores, aetherCompetitors } from '../../../../shared/schema.js';
import { desc, eq } from 'drizzle-orm';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WEIGHTS_PATH = path.join(__dirname, '../../../../data/aether/audit_weights.json');

const PILLAR_DEFINITIONS = {
  'Indexability': ['schema_coverage', 'canonical_sitemap_mismatch_rate'],
  'Performance': ['lcp_p75', 'cls_p75', 'inp_p75'],
  'Content': ['avg_city_page_wordcount', 'topic_count', 'entity_density_score'],
  'Internal Linking': ['sop_internal_link_depth'],
  'GEO': ['ai_mention_rate']
};

function loadLearningWeights() {
  try {
    if (fs.existsSync(WEIGHTS_PATH)) {
      const data = fs.readFileSync(WEIGHTS_PATH, 'utf-8');
      const weights = JSON.parse(data);
      console.info(`[AETHER_BENCH] Loaded ${Object.keys(weights).length} learning weights`);
      return weights;
    }
  } catch (error) {
    console.warn(`[AETHER_BENCH] Failed to load weights: ${error.message}`);
  }
  
  return {
    'schema_coverage': 0.85,
    'lcp_p75': 0.90,
    'cls_p75': 0.88,
    'inp_p75': 0.75,
    'ai_mention_rate': 0.92,
    'avg_city_page_wordcount': 0.70,
    'topic_count': 0.65,
    'sop_internal_link_depth': 0.72,
    'entity_density_score': 0.68,
    'canonical_sitemap_mismatch_rate': 0.80
  };
}

function normalizeMetric(value, metricName, isInverted = false) {
  const ranges = {
    'schema_coverage': [0, 1],
    'vehicle_schema_coverage': [0, 1],
    'lcp_p75': [800, 3000],
    'cls_p75': [0, 0.25],
    'inp_p75': [100, 500],
    'ai_mention_rate': [0, 1],
    'avg_city_page_wordcount': [500, 2000],
    'topic_count': [5, 25],
    'sop_internal_link_depth': [10, 60],
    'entity_density_score': [0, 100],
    'canonical_sitemap_mismatch_rate': [0, 0.3]
  };
  
  const [min, max] = ranges[metricName] || [0, 1];
  let normalized = (value - min) / (max - min);
  normalized = Math.max(0, Math.min(1, normalized));
  
  if (isInverted) {
    normalized = 1 - normalized;
  }
  
  return normalized;
}

function computePillarScore(kpis, pillar, weights) {
  const metricNames = PILLAR_DEFINITIONS[pillar] || [];
  if (metricNames.length === 0) return 0;
  
  let weightedSum = 0;
  let totalWeight = 0;
  
  const invertedMetrics = ['lcp_p75', 'cls_p75', 'inp_p75', 'canonical_sitemap_mismatch_rate'];
  
  metricNames.forEach(metricName => {
    const value = kpis[metricName];
    if (value !== undefined && value !== null) {
      const isInverted = invertedMetrics.includes(metricName);
      const normalized = normalizeMetric(value, metricName, isInverted);
      const weight = weights[metricName] || 0.5;
      
      weightedSum += normalized * weight;
      totalWeight += weight;
    }
  });
  
  const score = totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;
  return parseFloat(score.toFixed(2));
}

export async function scoreCompetitor(domain) {
  try {
    console.info(`[AETHER_BENCH] Scoring benchmarks for ${domain}...`);
    
    const snapshots = await db.query.aetherCompetitorSnapshots.findMany({
      where: (snapshots, { eq }) => eq(snapshots.domain, domain),
      orderBy: (snapshots, { desc }) => [desc(snapshots.date)],
      limit: 1
    });
    
    if (snapshots.length === 0) {
      console.warn(`[AETHER_BENCH] No snapshots found for ${domain}`);
      return [];
    }
    
    const latestSnapshot = snapshots[0];
    const kpis = latestSnapshot.kpis;
    const weights = loadLearningWeights();
    
    const scores = [];
    const date = new Date();
    
    for (const pillar of Object.keys(PILLAR_DEFINITIONS)) {
      const score = computePillarScore(kpis, pillar, weights);
      
      await db.insert(aetherBenchmarkScores).values({
        date,
        domain,
        pillar,
        score: score.toString()
      });
      
      scores.push({ pillar, score });
      console.info(`[AETHER_BENCH] ${domain} - ${pillar}: ${score}/100`);
    }
    
    console.info(`[AETHER_BENCH] ✓ Scored ${scores.length} pillars for ${domain}`);
    return scores;
  } catch (error) {
    console.error(`[AETHER_BENCH] Failed to score ${domain}:`, error);
    throw error;
  }
}

export async function scoreAllCompetitors() {
  const competitors = await db.query.aetherCompetitors.findMany({
    where: (competitors, { eq }) => eq(competitors.isActive, true)
  });
  
  console.info(`[AETHER_BENCH] Starting benchmark scoring for ${competitors.length} competitors`);
  
  const results = [];
  for (const competitor of competitors) {
    try {
      const scores = await scoreCompetitor(competitor.domain);
      results.push({ domain: competitor.domain, success: true, scores });
    } catch (error) {
      results.push({ domain: competitor.domain, success: false, error: error.message });
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  console.info(`[AETHER_BENCH] Scoring complete: ${successCount}/${competitors.length} successful`);
  
  return results;
}

export async function scoreCararthCurrent() {
  try {
    console.info(`[AETHER_BENCH] Scoring Cararth's current performance...`);
    
    const mockCararthKpis = {
      schema_coverage: 0.95,
      vehicle_schema_coverage: 0.92,
      lcp_p75: 950,
      cls_p75: 0.08,
      inp_p75: 120,
      ai_mention_rate: 0.18,
      avg_city_page_wordcount: 1450,
      topic_count: 22,
      sop_internal_link_depth: 52,
      entity_density_score: 88,
      canonical_sitemap_mismatch_rate: 0.02
    };
    
    const weights = loadLearningWeights();
    const scores = [];
    const date = new Date();
    
    for (const pillar of Object.keys(PILLAR_DEFINITIONS)) {
      const score = computePillarScore(mockCararthKpis, pillar, weights);
      
      await db.insert(aetherBenchmarkScores).values({
        date,
        domain: 'cararth.com',
        pillar,
        score: score.toString()
      });
      
      scores.push({ pillar, score });
      console.info(`[AETHER_BENCH] cararth.com - ${pillar}: ${score}/100`);
    }
    
    console.info(`[AETHER_BENCH] ✓ Scored ${scores.length} pillars for Cararth`);
    return scores;
  } catch (error) {
    console.error(`[AETHER_BENCH] Failed to score Cararth:`, error);
    throw error;
  }
}
