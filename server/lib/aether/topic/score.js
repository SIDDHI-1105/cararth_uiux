import { db } from '../../../db.js';
import { aetherTopicScores } from '../../../../shared/schema.js';
import { getWeights } from '../aetherLearn.js';

/**
 * Topic Scoring Service
 * Calculates SEO score, GEO score, competition, difficulty, and final win score
 */

const DEFAULT_CITY = process.env.AETHER_CITY_DEFAULT || 'Hyderabad';

/**
 * Normalize a value to 0-1 scale
 * @param {number} value - Raw value
 * @param {number} min - Minimum expected value
 * @param {number} max - Maximum expected value
 * @returns {number} Normalized value between 0 and 1
 */
function normalize(value, min, max) {
  if (max === min) return 0.5;
  const normalized = (value - min) / (max - min);
  return Math.max(0, Math.min(1, normalized));
}

/**
 * Calculate SEO score from SERP sources
 * Factors: SERP positions, estimated traffic, schema richness, content depth
 * @param {Array} sources - Topic sources from database
 * @returns {Object} SEO score and breakdown
 */
function calculateSEOScore(sources) {
  if (sources.length === 0) {
    return {
      score: 0,
      breakdown: {
        avgPosition: 0,
        avgTraffic: 0,
        schemaRichness: 0,
        contentDepth: 0
      }
    };
  }
  
  // Average SERP position (lower is better, so invert)
  const avgPosition = sources.reduce((sum, s) => sum + (s.serpPosition || 10), 0) / sources.length;
  const positionScore = normalize(20 - avgPosition, 0, 20); // Invert: position 1 = highest score
  
  // Average estimated traffic
  const avgTraffic = sources.reduce((sum, s) => sum + (s.estTraffic || 0), 0) / sources.length;
  const trafficScore = normalize(avgTraffic, 0, 5000); // 0-5000 monthly traffic range
  
  // Schema richness (percentage of sources with schema.org markup)
  const sourcesWithSchema = sources.filter(s => {
    try {
      const entities = typeof s.entities === 'string' ? JSON.parse(s.entities) : s.entities;
      return entities && Object.keys(entities).length > 0;
    } catch {
      return false;
    }
  }).length;
  const schemaRichness = sourcesWithSchema / sources.length;
  
  // Content depth (average word count)
  const avgWordCount = sources.reduce((sum, s) => sum + (s.wordcount || 0), 0) / sources.length;
  const contentDepth = normalize(avgWordCount, 500, 3000); // 500-3000 words range
  
  // Weighted SEO score
  const seoScore = (
    positionScore * 0.3 +
    trafficScore * 0.3 +
    schemaRichness * 0.2 +
    contentDepth * 0.2
  );
  
  return {
    score: seoScore,
    breakdown: {
      avgPosition,
      avgTraffic,
      schemaRichness,
      contentDepth,
      positionScore,
      trafficScore
    }
  };
}

/**
 * Calculate GEO score from AI visibility data
 * @param {Object} aiVisibility - AI visibility analysis results
 * @returns {Object} GEO score and breakdown
 */
function calculateGEOScore(aiVisibility) {
  if (!aiVisibility || aiVisibility.mock) {
    return {
      score: 0.5, // Default to neutral for mock data
      breakdown: {
        mentionRate: 0,
        firstMentionShare: 0,
        raw: aiVisibility?.geo_score_raw || 0
      }
    };
  }
  
  // Already calculated in aiVisibility module
  const geoScore = aiVisibility.geo_score_raw || 0;
  
  return {
    score: geoScore,
    breakdown: {
      mentionRate: aiVisibility.mentions_by_domain?.[0]?.mentionRate || 0,
      firstMentionShare: Object.values(aiVisibility.first_mention_share || {})[0] || 0,
      raw: geoScore
    }
  };
}

/**
 * Calculate competition score from top 5 SERP results
 * Factors: domain authority (backlinks), content depth
 * @param {Array} sources - Topic sources from database
 * @returns {Object} Competition score and breakdown
 */
function calculateCompetition(sources) {
  if (sources.length === 0) {
    return {
      score: 0.5, // Default to medium competition
      breakdown: {
        avgBacklinks: 0,
        avgWordCount: 0,
        top5Domains: []
      }
    };
  }
  
  // Focus on top 5 SERP results
  const top5 = sources
    .sort((a, b) => (a.serpPosition || 10) - (b.serpPosition || 10))
    .slice(0, 5);
  
  // Average backlinks (proxy for domain authority)
  const avgBacklinks = top5.reduce((sum, s) => sum + (s.backlinks || 0), 0) / top5.length;
  const backlinkScore = normalize(avgBacklinks, 1000, 50000); // 1k-50k backlinks range
  
  // Average word count (proxy for content depth)
  const avgWordCount = top5.reduce((sum, s) => sum + (s.wordcount || 0), 0) / top5.length;
  const wordCountScore = normalize(avgWordCount, 500, 3000);
  
  // Weighted competition score (higher = more competitive)
  const competitionScore = (backlinkScore * 0.7) + (wordCountScore * 0.3);
  
  return {
    score: competitionScore,
    breakdown: {
      avgBacklinks,
      avgWordCount,
      backlinkScore,
      wordCountScore,
      top5Domains: top5.map(s => s.domain)
    }
  };
}

/**
 * Calculate difficulty score
 * Based on competition and variability in SERP results
 * @param {number} competition - Competition score
 * @param {Array} sources - Topic sources
 * @returns {Object} Difficulty score and breakdown
 */
function calculateDifficulty(competition, sources) {
  // Calculate position variability (less variation = established rankings = harder)
  let positionVariance = 0;
  if (sources.length > 1) {
    const positions = sources.map(s => s.serpPosition || 10);
    const avgPosition = positions.reduce((sum, p) => sum + p, 0) / positions.length;
    positionVariance = positions.reduce((sum, p) => sum + Math.pow(p - avgPosition, 2), 0) / positions.length;
  }
  
  const variabilityScore = normalize(positionVariance, 0, 50); // Higher variance = easier to rank
  
  // Difficulty combines competition with inverse of variability
  // High competition + low variability = very hard
  const difficultyScore = (competition * 0.7) + ((1 - variabilityScore) * 0.3);
  
  return {
    score: difficultyScore,
    breakdown: {
      competition,
      positionVariance,
      variabilityScore
    }
  };
}

/**
 * Calculate final win score
 * Combines SEO gap, GEO gap, difficulty, and city bias
 * @param {Object} scores - Individual score components
 * @param {string} city - Target city
 * @returns {number} Final win score (0-1)
 */
function calculateWinScore(scores, city) {
  // Get adaptive weights from AETHER Learning
  const weights = getWeights();
  const seoWeight = weights.indexability || 0.6; // Default to 60% SEO
  const geoWeight = 1 - seoWeight; // Remaining for GEO
  
  // Calculate gaps (opportunity = 1 - current score)
  const seoGap = 1 - scores.seo.score; // Higher gap = more opportunity
  const geoGap = 1 - scores.geo.score;
  
  // Base win score
  let winScore = (seoWeight * seoGap + geoWeight * geoGap) / (1 + scores.difficulty.score);
  
  // City bias: +15% for default city (Hyderabad)
  if (city.toLowerCase() === DEFAULT_CITY.toLowerCase()) {
    winScore = winScore * 1.15;
  }
  
  // Normalize to 0-1
  return Math.min(1, Math.max(0, winScore));
}

/**
 * Score a topic with all metrics
 * @param {string} topicId - Topic ID
 * @param {Array} sources - Topic sources
 * @param {Object} aiVisibility - AI visibility analysis
 * @param {string} city - Target city
 * @returns {Promise<Object>} Complete scoring results
 */
export async function scoreTopic(topicId, sources, aiVisibility, city) {
  console.log(`[TopicScore] Scoring topic ${topicId}`);
  
  // Calculate individual scores
  const seoScore = calculateSEOScore(sources);
  const geoScore = calculateGEOScore(aiVisibility);
  const competition = calculateCompetition(sources);
  const difficulty = calculateDifficulty(competition.score, sources);
  
  // Calculate final win score
  const scores = {
    seo: seoScore,
    geo: geoScore,
    competition,
    difficulty
  };
  
  const winScore = calculateWinScore(scores, city);
  
  // Prepare details for storage
  const details = {
    seo: seoScore.breakdown,
    geo: geoScore.breakdown,
    competition: competition.breakdown,
    difficulty: difficulty.breakdown,
    weights: getWeights(),
    cityBias: city.toLowerCase() === DEFAULT_CITY.toLowerCase() ? 1.15 : 1.0
  };
  
  // Store in database
  await db.insert(aetherTopicScores)
    .values({
      topicId,
      seoScore: seoScore.score,
      geoScore: geoScore.score,
      competition: competition.score,
      difficulty: difficulty.score,
      winScore,
      details
    })
    .onConflictDoUpdate({
      target: aetherTopicScores.topicId,
      set: {
        seoScore: seoScore.score,
        geoScore: geoScore.score,
        competition: competition.score,
        difficulty: difficulty.score,
        winScore,
        details,
        updatedAt: new Date()
      }
    });
  
  console.log(`[TopicScore] Scored topic ${topicId}: Win Score = ${(winScore * 100).toFixed(1)}%`);
  
  return {
    topicId,
    seoScore: seoScore.score,
    geoScore: geoScore.score,
    competition: competition.score,
    difficulty: difficulty.score,
    winScore,
    details
  };
}
