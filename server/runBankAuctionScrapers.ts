import { eauctionsIndiaScraper } from './eauctionsIndiaScraper.js';

async function main() {
  console.log('🚀 Starting EauctionsIndia bank auction scraper for Hyderabad...\n');
  
  const results = {
    totalListings: 0,
    totalAuthenticated: 0,
    errors: [] as string[]
  };
  
  // Run EauctionsIndia scraper for all major banks in Hyderabad
  try {
    console.log('🏦 Running EauctionsIndia scraper for all banks (Hyderabad focus)...');
    const auctionResult = await eauctionsIndiaScraper.scrapeListings({
      bank: 'all',
      city: 'Hyderabad',
      maxPages: 50,
      vehicleType: 'car'
    });
    
    results.totalListings = auctionResult.totalFound;
    results.totalAuthenticated = auctionResult.authenticatedListings;
    results.errors.push(...auctionResult.errors);
    
    console.log(`✅ EauctionsIndia: ${auctionResult.authenticatedListings}/${auctionResult.totalFound} authenticated bank auction listings\n`);
  } catch (error) {
    const msg = `EauctionsIndia failed: ${error instanceof Error ? error.message : 'Unknown'}`;
    results.errors.push(msg);
    console.error(`❌ ${msg}\n`);
  }
  
  console.log('\n📊 Bank Auction Scraping Summary:');
  console.log(`   Total auction listings found: ${results.totalListings}`);
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
