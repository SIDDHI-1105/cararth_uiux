import { marutiTrueValueScraper } from './marutiTrueValueScraper.js';
import { hyundaiPromiseScraper } from './hyundaiPromiseScraper.js';
import { mahindraFirstChoiceScraper } from './mahindraFirstChoiceScraper.js';

async function main() {
  console.log('🚀 Starting OEM certified dealer scrapers for Hyderabad...\n');
  
  const results = {
    totalListings: 0,
    totalAuthenticated: 0,
    errors: [] as string[]
  };
  
  // Run Maruti True Value scraper
  try {
    console.log('🏭 Running Maruti True Value scraper...');
    const marutiResult = await marutiTrueValueScraper.scrapeListings({
      city: 'Hyderabad',
      maxPages: 50
    });
    results.totalListings += marutiResult.totalFound;
    results.totalAuthenticated += marutiResult.authenticatedListings;
    results.errors.push(...marutiResult.errors);
    console.log(`✅ Maruti True Value: ${marutiResult.authenticatedListings}/${marutiResult.totalFound} authenticated\n`);
  } catch (error) {
    const msg = `Maruti True Value failed: ${error instanceof Error ? error.message : 'Unknown'}`;
    results.errors.push(msg);
    console.error(`❌ ${msg}\n`);
  }
  
  // Run Hyundai H-Promise scraper
  try {
    console.log('🏭 Running Hyundai H-Promise scraper...');
    const hyundaiResult = await hyundaiPromiseScraper.scrapeListings({
      city: 'Hyderabad',
      maxPages: 25
    });
    results.totalListings += hyundaiResult.totalFound;
    results.totalAuthenticated += hyundaiResult.authenticatedListings;
    results.errors.push(...hyundaiResult.errors);
    console.log(`✅ Hyundai H-Promise: ${hyundaiResult.authenticatedListings}/${hyundaiResult.totalFound} authenticated\n`);
  } catch (error) {
    const msg = `Hyundai H-Promise failed: ${error instanceof Error ? error.message : 'Unknown'}`;
    results.errors.push(msg);
    console.error(`❌ ${msg}\n`);
  }
  
  // Run Mahindra First Choice scraper
  try {
    console.log('🏭 Running Mahindra First Choice scraper...');
    const mahindraResult = await mahindraFirstChoiceScraper.scrapeListings({
      city: 'Hyderabad',
      maxPages: 25
    });
    results.totalListings += mahindraResult.totalFound;
    results.totalAuthenticated += mahindraResult.authenticatedListings;
    results.errors.push(...mahindraResult.errors);
    console.log(`✅ Mahindra First Choice: ${mahindraResult.authenticatedListings}/${mahindraResult.totalFound} authenticated\n`);
  } catch (error) {
    const msg = `Mahindra First Choice failed: ${error instanceof Error ? error.message : 'Unknown'}`;
    results.errors.push(msg);
    console.error(`❌ ${msg}\n`);
  }
  
  console.log('\n📊 OEM Scraping Summary:');
  console.log(`   Total listings found: ${results.totalListings}`);
  console.log(`   Authenticated listings: ${results.totalAuthenticated}`);
  console.log(`   Errors: ${results.errors.length}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    results.errors.slice(0, 5).forEach(err => console.log(`   - ${err}`));
  }
  
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
