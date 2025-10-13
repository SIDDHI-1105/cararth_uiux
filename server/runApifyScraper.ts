import { ApifyOlxScraper } from './apifyOlxScraper.js';
import { ApifyFacebookScraper } from './apifyFacebookScraper.js';
import { db } from './db.js';
import { DatabaseStorage } from './dbStorage.js';

async function main() {
  const apiToken = process.env.APIFY_API_TOKEN;
  
  if (!apiToken) {
    console.error('❌ APIFY_API_TOKEN environment variable not set');
    process.exit(1);
  }
  
  const storage = new DatabaseStorage(db);
  
  // Run OLX scraper for Hyderabad
  console.log('🚀 Starting Apify OLX scraper for Hyderabad...');
  const olxScraper = new ApifyOlxScraper(apiToken, storage);
  const olxResult = await olxScraper.scrapeOlxCars('Hyderabad', 250);
  
  console.log('\n✅ OLX scraping complete!');
  console.log(`   Scraped: ${olxResult.scrapedCount} listings`);
  console.log(`   Saved: ${olxResult.savedCount} listings`);
  console.log(`   Errors: ${olxResult.errors.length}`);
  
  // Run Facebook Marketplace scraper for Hyderabad
  console.log('\n🚀 Starting Apify Facebook Marketplace scraper for Hyderabad...');
  const fbScraper = new ApifyFacebookScraper(apiToken, storage);
  const fbResult = await fbScraper.scrapeFacebookCars('Hyderabad', 150);
  
  console.log('\n✅ Facebook Marketplace scraping complete!');
  console.log(`   Scraped: ${fbResult.scrapedCount} listings`);
  console.log(`   Saved: ${fbResult.savedCount} listings`);
  console.log(`   Errors: ${fbResult.errors.length}`);
  
  console.log('\n📊 Total Apify Results:');
  console.log(`   Total scraped: ${olxResult.scrapedCount + fbResult.scrapedCount}`);
  console.log(`   Total saved: ${olxResult.savedCount + fbResult.savedCount}`);
  
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
