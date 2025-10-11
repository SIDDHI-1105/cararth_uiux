import { CarDekhoScraper } from './server/carDekhoScraper.js';
import { DatabaseStorage } from './server/dbStorage.js';

async function testCarDekhoScraper() {
  console.log('🧪 Testing CarDekho scraper for Hyderabad...\n');
  
  const storage = new DatabaseStorage();
  const scraper = new CarDekhoScraper(storage);
  
  try {
    const result = await scraper.scrapeCarDekhoCars('Hyderabad', 10); // Just 10 listings for test
    
    console.log('\n📊 Scraping Results:');
    console.log('Success:', result.success);
    console.log('Scraped Count:', result.scrapedCount);
    console.log('Saved Count:', result.savedCount);
    console.log('Errors:', result.errors.length);
    
    if (result.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.errors.forEach(err => console.log('  -', err));
    }
    
    console.log('\n✅ Test completed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCarDekhoScraper();
