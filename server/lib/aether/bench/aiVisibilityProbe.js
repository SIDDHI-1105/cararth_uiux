import { db } from '../../../db.js';
import { geoSweeps, aetherCompetitorSnapshots } from '../../../../shared/schema.js';
import { desc, eq, and, gte } from 'drizzle-orm';


const LOOKBACK_DAYS = 30;
const MOCK_MODE = !process.env.OPENAI_API_KEY;

async function getRecentSweeps(days = LOOKBACK_DAYS) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const sweeps = await db.query.geoSweeps.findMany({
    where: (geoSweeps, { gte }) => gte(geoSweeps.createdAt, cutoffDate),
    orderBy: (geoSweeps, { desc }) => [desc(geoSweeps.createdAt)],
    limit: 100
  });
  
  return sweeps;
}

function analyzeCompetitorMentions(sweeps, domain) {
  let totalSweeps = sweeps.length;
  let mentionCount = 0;
  
  sweeps.forEach(sweep => {
    const response = (sweep.response || '').toLowerCase();
    
    const domainClean = domain.replace('.com', '').replace('.in', '');
    
    const patterns = [
      domainClean,
      domain,
      domainClean.replace(/[0-9]/g, ''),
    ];
    
    const mentioned = patterns.some(pattern => 
      response.includes(pattern.toLowerCase())
    );
    
    if (mentioned) {
      mentionCount++;
    }
  });
  
  return {
    ai_mention_rate: totalSweeps > 0 ? mentionCount / totalSweeps : 0,
    sweeps_analyzed: totalSweeps,
    mention_count: mentionCount
  };
}

function generateMockAIMentionRate(domain) {
  const baseMentionRates = {
    'cardekho.com': 0.42,
    'cars24.com': 0.35,
    'spinny.com': 0.28,
    'olx.in': 0.25,
    'carwale.com': 0.30,
    'cartrade.com': 0.22
  };
  
  const base = baseMentionRates[domain] || 0.25;
  const variance = (Math.random() - 0.5) * 0.05;
  
  return Math.max(0, Math.min(1, base + variance));
}

export async function probeAIVisibility(domain) {
  try {
    console.info(`[AETHER_BENCH] Probing AI visibility for ${domain}...`);
    
    let aiMentionRate;
    let sweepsAnalyzed = 0;
    let mentionCount = 0;
    
    if (MOCK_MODE) {
      console.info(`[AETHER_BENCH] Mock mode: generating synthetic AI mention rate for ${domain}`);
      aiMentionRate = generateMockAIMentionRate(domain);
      sweepsAnalyzed = 50;
      mentionCount = Math.round(aiMentionRate * sweepsAnalyzed);
    } else {
      const recentSweeps = await getRecentSweeps();
      console.info(`[AETHER_BENCH] Analyzing ${recentSweeps.length} recent GEO sweeps for ${domain}`);
      
      const analysis = analyzeCompetitorMentions(recentSweeps, domain);
      aiMentionRate = analysis.ai_mention_rate;
      sweepsAnalyzed = analysis.sweeps_analyzed;
      mentionCount = analysis.mention_count;
    }
    
    console.info(`[AETHER_BENCH] ${domain} AI mention rate: ${(aiMentionRate * 100).toFixed(1)}% (${mentionCount}/${sweepsAnalyzed})`);
    
    const existingSnapshots = await db.query.aetherCompetitorSnapshots.findMany({
      where: (snapshots, { eq }) => eq(snapshots.domain, domain),
      orderBy: (snapshots, { desc }) => [desc(snapshots.date)],
      limit: 1
    });
    
    if (existingSnapshots.length > 0) {
      const latestSnapshot = existingSnapshots[0];
      const updatedKpis = {
        ...latestSnapshot.kpis,
        ai_mention_rate: aiMentionRate
      };
      
      await db.insert(aetherCompetitorSnapshots).values({
        domain,
        date: new Date(),
        kpis: updatedKpis
      });
    } else {
      await db.insert(aetherCompetitorSnapshots).values({
        domain,
        date: new Date(),
        kpis: { ai_mention_rate: aiMentionRate }
      });
    }
    
    console.info(`[AETHER_BENCH] ✓ AI visibility updated for ${domain}`);
    return { ai_mention_rate: aiMentionRate, sweeps_analyzed: sweepsAnalyzed, mention_count: mentionCount };
  } catch (error) {
    console.error(`[AETHER_BENCH] Failed to probe AI visibility for ${domain}:`, error);
    throw error;
  }
}

export async function probeAllCompetitors() {
  const competitors = await db.query.aetherCompetitors.findMany({
    where: (competitors, { eq }) => eq(competitors.isActive, true)
  });
  
  console.info(`[AETHER_BENCH] Starting AI visibility probe for ${competitors.length} competitors`);
  
  const results = [];
  for (const competitor of competitors) {
    try {
      const analysis = await probeAIVisibility(competitor.domain);
      results.push({ domain: competitor.domain, success: true, ...analysis });
    } catch (error) {
      results.push({ domain: competitor.domain, success: false, error: error.message });
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  console.info(`[AETHER_BENCH] AI visibility probe complete: ${successCount}/${competitors.length} successful`);
  
  return results;
}
