import { Router } from "express";
import { db } from "../../db";
import { 
  aetherBingSites, 
  aetherBingPerformance, 
  aetherBingCrawlIssues,
  aetherBingSitemaps,
  aetherBingBacklinks 
} from "../../../shared/schema";
import { runBingSyncNow } from "../../lib/aether/bingScheduler";
import { eq, and, desc, gte } from "drizzle-orm";
import { isAuthenticated, isAdmin } from "../../replitAuth";

const router = Router();

const getUserId = (req: any): string => {
  const targetUserId = req.query.userId || req.body.userId;
  
  if (targetUserId) {
    if (!req.user?.isAdmin) {
      throw new Error('Only admins can access other users\' data');
    }
    return targetUserId as string;
  }
  
  if (!req.user || !req.user.id) {
    throw new Error('User not authenticated');
  }
  return req.user.id.toString();
};

router.get("/status", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const userId = getUserId(req);
    
    const sites = await db.select()
      .from(aetherBingSites)
      .where(eq(aetherBingSites.userId, userId));

    const latestPerformance = await db.select()
      .from(aetherBingPerformance)
      .where(eq(aetherBingPerformance.userId, userId))
      .orderBy(desc(aetherBingPerformance.date))
      .limit(1);

    const crawlIssuesCount = await db.select()
      .from(aetherBingCrawlIssues)
      .where(eq(aetherBingCrawlIssues.userId, userId));

    const sitemaps = await db.select()
      .from(aetherBingSitemaps)
      .where(eq(aetherBingSitemaps.userId, userId));

    const backlinksCount = await db.select()
      .from(aetherBingBacklinks)
      .where(eq(aetherBingBacklinks.userId, userId));

    res.json({
      connected: sites.length > 0,
      sites: sites.length,
      lastPerformanceUpdate: latestPerformance[0]?.date || null,
      crawlIssues: crawlIssuesCount.length,
      sitemaps: sitemaps.length,
      backlinks: backlinksCount.length,
      mockMode: !process.env.BING_CLIENT_ID || !process.env.BING_CLIENT_SECRET,
    });
  } catch (error) {
    console.error('[Bing Data] Status check failed:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Bing status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get("/performance", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const userId = getUserId(req);
    const days = parseInt(req.query.days as string) || 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const performance = await db.select()
      .from(aetherBingPerformance)
      .where(
        and(
          eq(aetherBingPerformance.userId, userId),
          gte(aetherBingPerformance.date, startDate)
        )
      )
      .orderBy(aetherBingPerformance.date);

    res.json({ data: performance });
  } catch (error) {
    console.error('[Bing Data] Performance fetch failed:', error);
    res.status(500).json({ 
      error: 'Failed to fetch performance data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get("/crawl-issues", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const userId = getUserId(req);

    const issues = await db.select()
      .from(aetherBingCrawlIssues)
      .where(eq(aetherBingCrawlIssues.userId, userId))
      .orderBy(desc(aetherBingCrawlIssues.detectedAt));

    res.json({ data: issues });
  } catch (error) {
    console.error('[Bing Data] Crawl issues fetch failed:', error);
    res.status(500).json({ 
      error: 'Failed to fetch crawl issues',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get("/sitemaps", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const userId = getUserId(req);

    const sitemaps = await db.select()
      .from(aetherBingSitemaps)
      .where(eq(aetherBingSitemaps.userId, userId))
      .orderBy(desc(aetherBingSitemaps.lastSynced));

    res.json({ data: sitemaps });
  } catch (error) {
    console.error('[Bing Data] Sitemaps fetch failed:', error);
    res.status(500).json({ 
      error: 'Failed to fetch sitemaps',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get("/backlinks", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const userId = getUserId(req);

    const backlinks = await db.select()
      .from(aetherBingBacklinks)
      .where(eq(aetherBingBacklinks.userId, userId))
      .orderBy(desc(aetherBingBacklinks.lastSynced));

    res.json({ 
      data: backlinks,
      total: backlinks.length 
    });
  } catch (error) {
    console.error('[Bing Data] Backlinks fetch failed:', error);
    res.status(500).json({ 
      error: 'Failed to fetch backlinks',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post("/sync", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const userId = getUserId(req);
    const requesterId = req.user?.id?.toString();
    console.log(`[Bing Data] Manual sync triggered by admin ${requesterId} for user ${userId}`);

    const result = await runBingSyncNow(userId);

    res.json({
      success: result.success,
      timestamp: result.timestamp,
      results: result.results,
    });
  } catch (error) {
    console.error('[Bing Data] Manual sync failed:', error);
    res.status(500).json({ 
      error: 'Failed to trigger sync',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
