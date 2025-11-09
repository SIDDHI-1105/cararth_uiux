import { Router } from "express";
import { db } from "../../db";
import { gscAnalytics } from "../../../shared/schema";
import { createGscClient } from "../../lib/aether/gscClient";
import { desc, gte, and } from "drizzle-orm";
import { isAuthenticated, isAdmin } from "../../replitAuth";

const router = Router();

router.get("/status", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const gscClient = createGscClient();
    
    const latestAnalytics = await db.select()
      .from(gscAnalytics)
      .orderBy(desc(gscAnalytics.date))
      .limit(1);

    const indexingStatus = await gscClient.getIndexingStatus();

    res.json({
      configured: !gscClient.isMockMode(),
      siteUrl: gscClient.getSiteUrl(),
      lastUpdate: latestAnalytics[0]?.date || null,
      indexingStatus,
      mockMode: gscClient.isMockMode(),
    });
  } catch (error) {
    console.error('[GSC Data] Status check failed:', error);
    res.status(500).json({ 
      error: 'Failed to fetch GSC status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get("/analytics", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const gscClient = createGscClient();

    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const liveData = await gscClient.getSearchAnalytics({
      startDate,
      endDate,
      dimensions: ['date'],
    });

    const cachedData = await db.select()
      .from(gscAnalytics)
      .where(
        and(
          gte(gscAnalytics.date, startDate)
        )
      )
      .orderBy(gscAnalytics.date);

    const dataToUse = liveData.length > 0 ? liveData : cachedData;

    res.json({ 
      data: dataToUse,
      mock: gscClient.isMockMode(),
      source: liveData.length > 0 ? 'live' : 'cached'
    });
  } catch (error) {
    console.error('[GSC Data] Analytics fetch failed:', error);
    res.status(500).json({ 
      error: 'Failed to fetch analytics data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get("/top-pages", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const gscClient = createGscClient();

    const topPages = await gscClient.getTopPages(limit);

    res.json({ 
      data: topPages,
      mock: gscClient.isMockMode()
    });
  } catch (error) {
    console.error('[GSC Data] Top pages fetch failed:', error);
    res.status(500).json({ 
      error: 'Failed to fetch top pages',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get("/top-queries", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const gscClient = createGscClient();

    const topQueries = await gscClient.getTopQueries(limit);

    res.json({ 
      data: topQueries,
      mock: gscClient.isMockMode()
    });
  } catch (error) {
    console.error('[GSC Data] Top queries fetch failed:', error);
    res.status(500).json({ 
      error: 'Failed to fetch top queries',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get("/indexing", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const gscClient = createGscClient();
    const indexingStatus = await gscClient.getIndexingStatus();

    res.json({ 
      data: indexingStatus,
      mock: gscClient.isMockMode()
    });
  } catch (error) {
    console.error('[GSC Data] Indexing status fetch failed:', error);
    res.status(500).json({ 
      error: 'Failed to fetch indexing status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post("/sync", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const gscClient = createGscClient();
    
    const days = parseInt(req.body.days as string) || 7;
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const analytics = await gscClient.getSearchAnalytics({
      startDate,
      endDate,
      dimensions: ['date'],
    });

    let inserted = 0;
    for (const data of analytics) {
      await db.insert(gscAnalytics)
        .values({
          date: data.date,
          clicks: data.clicks,
          impressions: data.impressions,
          ctr: data.ctr.toString(),
          position: data.position.toString(),
        })
        .onConflictDoNothing();
      inserted++;
    }

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      records: inserted,
      dateRange: { startDate, endDate },
    });
  } catch (error) {
    console.error('[GSC Data] Manual sync failed:', error);
    res.status(500).json({ 
      error: 'Failed to trigger sync',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
