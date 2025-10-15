// Manual scraper trigger for immediate data refresh
import { DatabaseStorage } from './dbStorage.js';
import { CarDekhoScraper } from './carDekhoScraper.js';
import { scrapeOLX } from './apifyOlxScraper.js';
import { scrapeFacebookMarketplace } from './apifyFacebookScraper.js';

async function main() {
  console.log('🚀 MANUAL SCRAPER RUN - Getting fresh Hyderabad listings...\n');
  
  const storage = new DatabaseStorage();
  const cities = ['Hyderabad'];
  
  // 1. CarDekho scraper (3 pages = 60 listings)
  console.log('📊 1/3: Running CarDekho scraper (3 pages)...');
  try {
    const carDekhoScraper = new CarDekhoScraper(storage);
    const cdResult = await carDekhoScraper.scrapeCarDekhoCars('Hyderabad', 3);
    console.log(`   ✅ CarDekho: ${cdResult.savedCount} saved from ${cdResult.scrapedCount} scraped\n`);
  } catch (error) {
    console.error(`   ❌ CarDekho failed: ${error.message}\n`);
  }
  
  // 2. OLX scraper (via Apify)
  console.log('📊 2/3: Running OLX scraper (via Apify)...');
  try {
    const olxResult = await scrapeOLX(cities, storage);
    console.log(`   ✅ OLX: ${olxResult.totalSaved} saved from ${olxResult.totalScraped} scraped\n`);
  } catch (error) {
    console.error(`   ❌ OLX failed: ${error.message}\n`);
  }
  
  // 3. Facebook Marketplace scraper (via Apify)
  console.log('📊 3/3: Running Facebook Marketplace scraper (via Apify)...');
  try {
    const fbResult = await scrapeFacebookMarketplace(cities, storage);
    console.log(`   ✅ Facebook: ${fbResult.totalSaved} saved from ${fbResult.totalScraped} scraped\n`);
  } catch (error) {
    console.error(`   ❌ Facebook failed: ${error.message}\n`);
  }
  
  console.log('🎉 Manual scraper run completed!');
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
