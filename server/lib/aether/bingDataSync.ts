import { db } from "../../db";
import { 
  aetherBingSites, 
  aetherBingPerformance, 
  aetherBingCrawlIssues,
  aetherBingSitemaps,
  aetherBingBacklinks 
} from "../../../shared/schema";
import { createBingClient } from "./bingWebmasterClient";
import { eq, and, desc } from "drizzle-orm";

export class BingDataSync {
  private userId: string;
  
  constructor(userId: string) {
    this.userId = userId;
  }

  private async getUserSiteUrls(): Promise<string[]> {
    const sites = await db.select()
      .from(aetherBingSites)
      .where(and(
        eq(aetherBingSites.userId, this.userId),
        eq(aetherBingSites.verified, true)
      ));
    
    return sites.map(site => site.siteUrl);
  }

  async syncSites() {
    console.log('[Bing Sync] Starting sites sync...');
    
    try {
      const client = await createBingClient(this.userId);
      const sites = await client.getSites();
      
      for (const site of sites) {
        await db.insert(aetherBingSites)
          .values({
            userId: this.userId,
            siteUrl: site.Url,
            verified: site.Verified,
            ownerType: site.OwnerType,
            lastSynced: new Date(),
          })
          .onConflictDoUpdate({
            target: [aetherBingSites.userId, aetherBingSites.siteUrl],
            set: {
              verified: site.Verified,
              ownerType: site.OwnerType,
              lastSynced: new Date(),
            },
          });
      }

      console.log(`[Bing Sync] ✓ Synced ${sites.length} sites`);
      return { success: true, count: sites.length };
    } catch (error) {
      console.error('[Bing Sync] Sites sync failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async syncPerformance(days = 30) {
    console.log(`[Bing Sync] Starting performance sync (${days} days)...`);
    
    try {
      const client = await createBingClient(this.userId);
      const siteUrls = await this.getUserSiteUrls();
      
      if (siteUrls.length === 0) {
        console.log('[Bing Sync] No verified sites found for user');
        return { success: true, count: 0, message: 'No verified sites' };
      }

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      let totalInserted = 0;
      
      for (const siteUrl of siteUrls) {
        const traffic = await client.getTraffic(
          siteUrl,
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        );

        for (const data of traffic) {
          await db.insert(aetherBingPerformance)
            .values({
              userId: this.userId,
              siteUrl,
              date: new Date(data.Date),
              clicks: data.Clicks,
              impressions: data.Impressions,
              ctr: data.Ctr,
              avgPosition: data.AvgPosition,
              query: data.Query || null,
              page: data.Page || null,
              country: data.Country || null,
              device: data.Device || null,
            })
            .onConflictDoUpdate({
              target: [
                aetherBingPerformance.userId,
                aetherBingPerformance.siteUrl,
                aetherBingPerformance.date,
              ],
              set: {
                clicks: data.Clicks,
                impressions: data.Impressions,
                ctr: data.Ctr,
                avgPosition: data.AvgPosition,
              },
            });
          totalInserted++;
        }
      }

      console.log(`[Bing Sync] ✓ Synced ${totalInserted} performance records for ${siteUrls.length} sites`);
      return { success: true, count: totalInserted };
    } catch (error) {
      console.error('[Bing Sync] Performance sync failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async syncCrawlIssues() {
    console.log('[Bing Sync] Starting crawl issues sync...');
    
    try {
      const client = await createBingClient(this.userId);
      const siteUrls = await this.getUserSiteUrls();
      
      if (siteUrls.length === 0) {
        return { success: true, count: 0, message: 'No verified sites' };
      }

      let totalInserted = 0;
      
      for (const siteUrl of siteUrls) {
        const issues = await client.getCrawlIssues(siteUrl);

        for (const issue of issues) {
          await db.insert(aetherBingCrawlIssues)
            .values({
              userId: this.userId,
              siteUrl,
              url: issue.Url,
              issueType: issue.IssueType,
              severity: issue.Severity,
              httpStatusCode: issue.HttpStatusCode || null,
              lastCrawled: issue.LastCrawled ? new Date(issue.LastCrawled) : null,
              detectedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: [
                aetherBingCrawlIssues.userId,
                aetherBingCrawlIssues.siteUrl,
                aetherBingCrawlIssues.url,
              ],
              set: {
                issueType: issue.IssueType,
                severity: issue.Severity,
                httpStatusCode: issue.HttpStatusCode || null,
                lastCrawled: issue.LastCrawled ? new Date(issue.LastCrawled) : null,
              },
            });
          totalInserted++;
        }
      }

      console.log(`[Bing Sync] ✓ Synced ${totalInserted} crawl issues for ${siteUrls.length} sites`);
      return { success: true, count: totalInserted };
    } catch (error) {
      console.error('[Bing Sync] Crawl issues sync failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async syncSitemaps() {
    console.log('[Bing Sync] Starting sitemaps sync...');
    
    try {
      const client = await createBingClient(this.userId);
      const siteUrls = await this.getUserSiteUrls();
      
      if (siteUrls.length === 0) {
        return { success: true, count: 0, message: 'No verified sites' };
      }

      let totalInserted = 0;
      
      for (const siteUrl of siteUrls) {
        const sitemaps = await client.getSitemaps(siteUrl);

        for (const sitemap of sitemaps) {
          await db.insert(aetherBingSitemaps)
            .values({
              userId: this.userId,
              siteUrl,
              sitemapUrl: sitemap.Url,
              status: sitemap.Status,
              urls: sitemap.Urls,
              errors: sitemap.Errors,
              lastSubmitted: sitemap.LastSubmitted ? new Date(sitemap.LastSubmitted) : null,
              lastDownloaded: sitemap.LastDownloaded ? new Date(sitemap.LastDownloaded) : null,
              lastSynced: new Date(),
            })
            .onConflictDoUpdate({
              target: [
                aetherBingSitemaps.userId,
                aetherBingSitemaps.siteUrl,
                aetherBingSitemaps.sitemapUrl,
              ],
              set: {
                status: sitemap.Status,
                urls: sitemap.Urls,
                errors: sitemap.Errors,
                lastSubmitted: sitemap.LastSubmitted ? new Date(sitemap.LastSubmitted) : null,
                lastDownloaded: sitemap.LastDownloaded ? new Date(sitemap.LastDownloaded) : null,
                lastSynced: new Date(),
              },
            });
          totalInserted++;
        }
      }

      console.log(`[Bing Sync] ✓ Synced ${totalInserted} sitemaps for ${siteUrls.length} sites`);
      return { success: true, count: totalInserted };
    } catch (error) {
      console.error('[Bing Sync] Sitemaps sync failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async syncBacklinks() {
    console.log('[Bing Sync] Starting backlinks sync...');
    
    try {
      const client = await createBingClient(this.userId);
      const siteUrls = await this.getUserSiteUrls();
      
      if (siteUrls.length === 0) {
        return { success: true, count: 0, message: 'No verified sites' };
      }

      let totalInserted = 0;
      let totalBacklinks = 0;
      
      for (const siteUrl of siteUrls) {
        const backlinkData = await client.getBacklinks(siteUrl);
        totalBacklinks += backlinkData.totalBacklinks;

        for (const backlink of backlinkData.domains) {
          await db.insert(aetherBingBacklinks)
            .values({
              userId: this.userId,
              siteUrl,
              sourceUrl: backlink.SourceUrl,
              targetUrl: backlink.TargetUrl,
              anchorText: backlink.AnchorText || null,
              firstSeen: backlink.FirstSeen ? new Date(backlink.FirstSeen) : new Date(),
              lastSynced: new Date(),
            })
            .onConflictDoUpdate({
              target: [
                aetherBingBacklinks.userId,
                aetherBingBacklinks.siteUrl,
                aetherBingBacklinks.sourceUrl,
              ],
              set: {
                targetUrl: backlink.TargetUrl,
                anchorText: backlink.AnchorText || null,
                lastSynced: new Date(),
              },
            });
          totalInserted++;
        }
      }

      console.log(`[Bing Sync] ✓ Synced ${totalInserted} backlinks for ${siteUrls.length} sites (total: ${totalBacklinks})`);
      return { success: true, count: totalInserted, total: totalBacklinks };
    } catch (error) {
      console.error('[Bing Sync] Backlinks sync failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async syncAll() {
    console.log('[Bing Sync] Starting full data sync...');
    
    const results = {
      sites: await this.syncSites(),
      performance: await this.syncPerformance(),
      crawlIssues: await this.syncCrawlIssues(),
      sitemaps: await this.syncSitemaps(),
      backlinks: await this.syncBacklinks(),
    };

    const allSuccess = Object.values(results).every(r => r.success);
    
    console.log('[Bing Sync] Full sync completed', {
      success: allSuccess,
      results,
    });

    return {
      success: allSuccess,
      timestamp: new Date().toISOString(),
      results,
    };
  }
}

export async function createBingDataSync(userId: string): Promise<BingDataSync> {
  return new BingDataSync(userId);
}

export async function runBingSync(userId: string) {
  const sync = new BingDataSync(userId);
  return sync.syncAll();
}
