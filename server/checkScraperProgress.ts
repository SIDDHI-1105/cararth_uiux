import { db } from './db.js';
import { cachedPortalListings } from '@shared/schema';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('📊 Scraper Progress Report\n');
  
  // Get total counts by portal
  const portalCounts = await db
    .select({
      portal: cachedPortalListings.portal,
      total: sql<number>`count(*)::int`,
      hyderabad: sql<number>`count(*) filter (where lower(location) like '%hyderabad%' or lower(city) like '%hyderabad%')::int`
    })
    .from(cachedPortalListings)
    .groupBy(cachedPortalListings.portal);
  
  console.log('By Portal:');
  let totalAll = 0;
  let totalHyd = 0;
  
  portalCounts.forEach(row => {
    totalAll += row.total;
    totalHyd += row.hyderabad;
    console.log(`  ${row.portal}: ${row.total} total (${row.hyderabad} Hyderabad)`);
  });
  
  console.log(`\nTotals: ${totalAll} listings (${totalHyd} Hyderabad)\n`);
  
  // Get recent additions (last 10 minutes)
  const recentListings = await db
    .select({
      count: sql<number>`count(*)::int`
    })
    .from(cachedPortalListings)
    .where(sql`fetched_at > now() - interval '10 minutes'`);
  
  console.log(`Recent additions (last 10 min): ${recentListings[0]?.count || 0}`);
  
  process.exit(0);
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
