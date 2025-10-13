import { CarDekhoScraper } from './carDekhoScraper.js';
import { db } from './db.js';
import { DatabaseStorage } from './dbStorage.js';

async function main() {
  console.log('🚀 Starting CarDekho scraper for Hyderabad (500+ listings target)...');
  
  const storage = new DatabaseStorage(db);
  const scraper = new CarDekhoScraper(storage);
  
  const result = await scraper.scrapeCarDekhoCars('Hyderabad', 500);
  
  console.log('\n✅ CarDekho scraping complete!');
  console.log(`   Scraped: ${result.scrapedCount} listings`);
  console.log(`   Saved: ${result.savedCount} listings`);
  console.log(`   Errors: ${result.errors.length}`);
  
  if (result.errors.length > 0) {
    console.log('\n❌ Errors:');
    result.errors.slice(0, 10).forEach(err => console.log(`   - ${err}`));
    if (result.errors.length > 10) {
      console.log(`   ... and ${result.errors.length - 10} more errors`);
    }
  }
  
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
