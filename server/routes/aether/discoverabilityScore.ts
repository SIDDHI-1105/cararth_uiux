import { Router } from "express";
import { isAuthenticated, isAdmin } from "../../replitAuth";
import { db } from "../../db";
import { aetherBingPerformance, geoSweeps } from "../../../shared/schema";
import { desc, and, gte, sql } from "drizzle-orm";

const router = Router();

interface DiscoverabilityScore {
  overallScore: number;
  breakdown: {
    googleSeo: {
      score: number;
      impressions: number;
      clicks: number;
      ctr: number;
      avgPosition: number;
    };
    bingSeo: {
      score: number;
      impressions: number;
      clicks: number;
      ctr: number;
    };
    geoAi: {
      score: number;
      mentionRate: number;
      totalSweeps: number;
      mentionedSweeps: number;
    };
  };
  trends: {
    googleChange: number;
    bingChange: number;
    geoChange: number;
  };
  timestamp: Date;
}

async function calculateDiscoverabilityScore(userId: string): Promise<DiscoverabilityScore> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const [bingRecent, bingPrevious, geoStats] = await Promise.all([
    db.select()
      .from(aetherBingPerformance)
      .where(and(
        sql`${aetherBingPerformance.userId} = ${userId}`,
        gte(aetherBingPerformance.date, thirtyDaysAgo)
      ))
      .orderBy(desc(aetherBingPerformance.date))
      .limit(30),
    
    db.select()
      .from(aetherBingPerformance)
      .where(and(
        sql`${aetherBingPerformance.userId} = ${userId}`,
        gte(aetherBingPerformance.date, sixtyDaysAgo),
        sql`${aetherBingPerformance.date} < ${thirtyDaysAgo}`
      ))
      .limit(30),
    
    db.select({
      totalSweeps: sql<number>`COUNT(*)`,
      mentionedSweeps: sql<number>`SUM(CASE WHEN ${geoSweeps.cararthMentioned} = true THEN 1 ELSE 0 END)`,
    })
      .from(geoSweeps)
      .where(gte(geoSweeps.createdAt, thirtyDaysAgo))
  ]);

  const gscRecent: any[] = [];
  const gscPrevious: any[] = [];

  const gscTotalImpressions = gscRecent.reduce((sum, r) => sum + (r.impressions || 0), 0);
  const gscTotalClicks = gscRecent.reduce((sum, r) => sum + (r.clicks || 0), 0);
  const gscAvgPosition = gscRecent.length > 0
    ? gscRecent.reduce((sum, r) => sum + (r.avgPosition || 0), 0) / gscRecent.length
    : 0;
  const gscCtr = gscTotalImpressions > 0 ? (gscTotalClicks / gscTotalImpressions) * 100 : 0;

  const gscPrevImpressions = gscPrevious.reduce((sum, r) => sum + (r.impressions || 0), 0);
  
  const bingTotalImpressions = bingRecent.reduce((sum, r) => sum + (r.impressions || 0), 0);
  const bingTotalClicks = bingRecent.reduce((sum, r) => sum + (r.clicks || 0), 0);
  const bingCtr = bingTotalImpressions > 0 ? (bingTotalClicks / bingTotalImpressions) * 100 : 0;

  const bingPrevImpressions = bingPrevious.reduce((sum, r) => sum + (r.impressions || 0), 0);

  const totalSweeps = geoStats[0]?.totalSweeps || 0;
  const mentionedSweeps = geoStats[0]?.mentionedSweeps || 0;
  const mentionRate = totalSweeps > 0 ? (mentionedSweeps / totalSweeps) * 100 : 0;

  const googleScore = Math.min(100, Math.round(
    (gscCtr * 20) +
    (Math.min(gscAvgPosition, 10) <= 5 ? 30 : 15) +
    (gscTotalImpressions > 1000 ? 50 : (gscTotalImpressions / 1000) * 50)
  ));

  const bingScore = Math.min(100, Math.round(
    (bingCtr * 20) +
    (bingTotalImpressions > 500 ? 50 : (bingTotalImpressions / 500) * 50) +
    30
  ));

  const geoScore = Math.min(100, Math.round(mentionRate * 5));

  const googleChange = gscPrevImpressions > 0
    ? ((gscTotalImpressions - gscPrevImpressions) / gscPrevImpressions) * 100
    : 0;
  
  const bingChange = bingPrevImpressions > 0
    ? ((bingTotalImpressions - bingPrevImpressions) / bingPrevImpressions) * 100
    : 0;

  const geoChange = 0;

  const overallScore = Math.round((googleScore * 0.5) + (bingScore * 0.25) + (geoScore * 0.25));

  return {
    overallScore,
    breakdown: {
      googleSeo: {
        score: googleScore,
        impressions: gscTotalImpressions,
        clicks: gscTotalClicks,
        ctr: Math.round(gscCtr * 100) / 100,
        avgPosition: Math.round(gscAvgPosition * 10) / 10,
      },
      bingSeo: {
        score: bingScore,
        impressions: bingTotalImpressions,
        clicks: bingTotalClicks,
        ctr: Math.round(bingCtr * 100) / 100,
      },
      geoAi: {
        score: geoScore,
        mentionRate: Math.round(mentionRate * 100) / 100,
        totalSweeps,
        mentionedSweeps,
      },
    },
    trends: {
      googleChange: Math.round(googleChange * 100) / 100,
      bingChange: Math.round(bingChange * 100) / 100,
      geoChange: Math.round(geoChange * 100) / 100,
    },
    timestamp: new Date(),
  };
}

router.get("/score", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const targetUserId = req.query.userId as string;
    const userId = targetUserId && req.user?.isAdmin ? targetUserId : req.user?.id?.toString();
    
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const score = await calculateDiscoverabilityScore(userId);
    res.json(score);
  } catch (error) {
    console.error("[Discoverability Score] Error:", error);
    res.status(500).json({ error: "Failed to calculate discoverability score" });
  }
});

export default router;
