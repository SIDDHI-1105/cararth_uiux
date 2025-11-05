import express from 'express';
import { db } from '../../../db.js';
import { 
  aetherCompetitors, 
  aetherCompetitorSnapshots, 
  aetherBenchmarkScores, 
  aetherBenchRecommendations 
} from '../../../../shared/schema.js';
import { desc, eq, and, gte } from 'drizzle-orm';

import { crawlAllCompetitors, crawlCompetitorSnapshot } from './crawlSnapshot.js';
import { probeAllCompetitors, probeAIVisibility } from './aiVisibilityProbe.js';
import { scoreAllCompetitors, scoreCararthCurrent, scoreCompetitor } from './scoreBenchmarks.js';
import { generateRecommendations, getTopRecommendations } from './recommendations.js';

const router = express.Router();

router.get('/bench/overview', async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    
    const pillars = ['Indexability', 'Performance', 'Content', 'Internal Linking', 'GEO'];
    
    const cararthScores = await db.query.aetherBenchmarkScores.findMany({
      where: (scores, { eq }) => eq(scores.domain, 'cararth.com'),
      orderBy: (scores, { desc }) => [desc(scores.date)],
      limit: 5
    });
    
    const competitorScores = await db.query.aetherBenchmarkScores.findMany({
      orderBy: (scores, { desc }) => [desc(scores.date)],
      limit: 100
    });
    
    const overview = pillars.map(pillar => {
      const cararthScore = cararthScores.find(s => s.pillar === pillar);
      const cararthValue = cararthScore ? parseFloat(cararthScore.score) : 0;
      
      const competitorPillarScores = competitorScores
        .filter(s => s.pillar === pillar && s.domain !== 'cararth.com')
        .map(s => parseFloat(s.score));
      
      const leaderScore = competitorPillarScores.length > 0 
        ? Math.max(...competitorPillarScores) 
        : cararthValue;
      
      const diff = cararthValue - leaderScore;
      
      let status;
      if (diff >= 5) status = 'win';
      else if (diff <= -5) status = 'lose';
      else status = 'parity';
      
      return {
        pillar,
        cararth: cararthValue.toFixed(2),
        leader: leaderScore.toFixed(2),
        diff: diff.toFixed(2),
        status
      };
    });
    
    res.json({ overview, date: targetDate.toISOString() });
  } catch (error) {
    console.error('[AETHER_BENCH] Error getting overview:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/bench/competitors', async (req, res) => {
  try {
    const competitors = await db.query.aetherCompetitors.findMany({
      where: (competitors, { eq }) => eq(competitors.isActive, true)
    });
    
    const results = [];
    
    for (const competitor of competitors) {
      const latestSnapshot = await db.query.aetherCompetitorSnapshots.findMany({
        where: (snapshots, { eq }) => eq(snapshots.domain, competitor.domain),
        orderBy: (snapshots, { desc }) => [desc(snapshots.date)],
        limit: 1
      });
      
      const latestScores = await db.query.aetherBenchmarkScores.findMany({
        where: (scores, { eq }) => eq(scores.domain, competitor.domain),
        orderBy: (scores, { desc }) => [desc(scores.date)],
        limit: 5
      });
      
      const avgScore = latestScores.length > 0
        ? latestScores.reduce((sum, s) => sum + parseFloat(s.score), 0) / latestScores.length
        : 0;
      
      const aiMentionRate = latestSnapshot[0]?.kpis?.ai_mention_rate || 0;
      
      results.push({
        domain: competitor.domain,
        label: competitor.label,
        avgScore: avgScore.toFixed(2),
        aiMentionRate: (aiMentionRate * 100).toFixed(1),
        lastUpdated: latestSnapshot[0]?.date || null,
        pillars: latestScores.map(s => ({
          pillar: s.pillar,
          score: parseFloat(s.score).toFixed(2)
        }))
      });
    }
    
    results.sort((a, b) => parseFloat(b.avgScore) - parseFloat(a.avgScore));
    
    res.json({ competitors: results });
  } catch (error) {
    console.error('[AETHER_BENCH] Error getting competitors:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/bench/recommendations', async (req, res) => {
  try {
    const { pillar, status, limit = 10 } = req.query;
    
    const recommendations = await getTopRecommendations(
      parseInt(limit), 
      pillar || null, 
      status || 'pending'
    );
    
    res.json({ 
      recommendations,
      count: recommendations.length 
    });
  } catch (error) {
    console.error('[AETHER_BENCH] Error getting recommendations:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/bench/run', async (req, res) => {
  try {
    const { domains } = req.body;
    
    console.info('[AETHER_BENCH] Starting manual benchmark run...');
    
    let results = {
      crawl: [],
      probe: [],
      score: [],
      recommendations: []
    };
    
    if (domains && domains.length > 0) {
      for (const domain of domains) {
        try {
          const crawlResult = await crawlCompetitorSnapshot(domain);
          results.crawl.push({ domain, success: true, kpis: crawlResult });
          
          const probeResult = await probeAIVisibility(domain);
          results.probe.push({ domain, success: true, ...probeResult });
          
          const scoreResult = await scoreCompetitor(domain);
          results.score.push({ domain, success: true, scores: scoreResult });
        } catch (error) {
          console.error(`[AETHER_BENCH] Error processing ${domain}:`, error);
          results.crawl.push({ domain, success: false, error: error.message });
        }
      }
    } else {
      results.crawl = await crawlAllCompetitors();
      results.probe = await probeAllCompetitors();
      results.score = await scoreAllCompetitors();
      
      await scoreCararthCurrent();
    }
    
    results.recommendations = await generateRecommendations();
    
    const successCrawl = results.crawl.filter(r => r.success).length;
    const successProbe = results.probe.filter(r => r.success).length;
    const successScore = results.score.filter(r => r.success).length;
    
    console.info(`[AETHER_BENCH] Benchmark run complete: ${successCrawl} crawled, ${successProbe} probed, ${successScore} scored, ${results.recommendations.length} recommendations`);
    
    res.json({
      success: true,
      summary: {
        crawled: successCrawl,
        probed: successProbe,
        scored: successScore,
        recommendations: results.recommendations.length
      },
      results
    });
  } catch (error) {
    console.error('[AETHER_BENCH] Error running benchmark:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/bench/gaps', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const cararthSnapshots = await db.query.aetherCompetitorSnapshots.findMany({
      where: (snapshots, { eq }) => eq(snapshots.domain, 'cararth.com'),
      orderBy: (snapshots, { desc }) => [desc(snapshots.date)],
      limit: 1
    });
    
    const competitorSnapshots = await db.query.aetherCompetitorSnapshots.findMany({
      orderBy: (snapshots, { desc }) => [desc(snapshots.date)],
      limit: 50
    });
    
    const cararthKpis = cararthSnapshots[0]?.kpis || {};
    
    const gaps = [];
    const kpiKeys = Object.keys(cararthKpis);
    
    kpiKeys.forEach(key => {
      const cararthValue = cararthKpis[key] || 0;
      
      const competitorValues = competitorSnapshots
        .map(s => s.kpis[key])
        .filter(v => v !== undefined && v !== null);
      
      if (competitorValues.length > 0) {
        const leaderValue = Math.max(...competitorValues);
        const gap = Math.abs(leaderValue - cararthValue);
        
        if (gap > 0) {
          gaps.push({
            kpi: key,
            cararth: cararthValue,
            leader: leaderValue,
            gap,
            gapPercent: ((gap / Math.max(cararthValue, leaderValue)) * 100).toFixed(1)
          });
        }
      }
    });
    
    gaps.sort((a, b) => b.gap - a.gap);
    
    res.json({ 
      gaps: gaps.slice(0, parseInt(limit)),
      total: gaps.length 
    });
  } catch (error) {
    console.error('[AETHER_BENCH] Error getting gaps:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
