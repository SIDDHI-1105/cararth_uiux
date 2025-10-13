import { teamBhpScraper } from './teamBhpScraper.js';
import { automotiveIndiaScraper } from './automotiveIndiaScraper.js';
import { quikrScraper } from './quikrScraper.js';
import { redditScraper } from './redditScraper.js';
import { db } from './db.js';
import { DatabaseStorage } from './dbStorage.js';

async function main() {
  console.log('🚀 Starting forum scrapers for Hyderabad listings...\n');
  
  const storage = new DatabaseStorage(db);
  const results = {
    totalScraped: 0,
    totalNew: 0,
    errors: [] as string[]
  };
  
  // Run Team-BHP scraper
  try {
    console.log('📋 Running Team-BHP Classifieds scraper...');
    const teamBhpResult = await teamBhpScraper.scrapeLatestListings(storage.db);
    results.totalScraped += teamBhpResult.scrapedCount;
    results.totalNew += teamBhpResult.newListings;
    results.errors.push(...teamBhpResult.errors);
    console.log(`✅ Team-BHP: ${teamBhpResult.newListings} new listings\n`);
  } catch (error) {
    const msg = `Team-BHP failed: ${error instanceof Error ? error.message : 'Unknown'}`;
    results.errors.push(msg);
    console.error(`❌ ${msg}\n`);
  }
  
  // Run TheAutomotiveIndia scraper
  try {
    console.log('📋 Running TheAutomotiveIndia Marketplace scraper...');
    const automotiveResult = await automotiveIndiaScraper.scrapeLatestListings(storage.db);
    results.totalScraped += automotiveResult.scrapedCount;
    results.totalNew += automotiveResult.newListings;
    results.errors.push(...automotiveResult.errors);
    console.log(`✅ TheAutomotiveIndia: ${automotiveResult.newListings} new listings\n`);
  } catch (error) {
    const msg = `TheAutomotiveIndia failed: ${error instanceof Error ? error.message : 'Unknown'}`;
    results.errors.push(msg);
    console.error(`❌ ${msg}\n`);
  }
  
  // Run Quikr scraper
  try {
    console.log('📋 Running Quikr Cars scraper...');
    const quikrResult = await quikrScraper.scrapeLatestListings(storage.db);
    results.totalScraped += quikrResult.scrapedCount;
    results.totalNew += quikrResult.newListings;
    results.errors.push(...quikrResult.errors);
    console.log(`✅ Quikr: ${quikrResult.newListings} new listings\n`);
  } catch (error) {
    const msg = `Quikr failed: ${error instanceof Error ? error.message : 'Unknown'}`;
    results.errors.push(msg);
    console.error(`❌ ${msg}\n`);
  }
  
  // Run Reddit scraper
  try {
    console.log('📋 Running Reddit r/CarsIndia scraper...');
    const redditResult = await redditScraper.scrapeLatestListings(storage.db);
    results.totalScraped += redditResult.scrapedCount;
    results.totalNew += redditResult.newListings;
    results.errors.push(...redditResult.errors);
    console.log(`✅ Reddit: ${redditResult.newListings} new listings\n`);
  } catch (error) {
    const msg = `Reddit failed: ${error instanceof Error ? error.message : 'Unknown'}`;
    results.errors.push(msg);
    console.error(`❌ ${msg}\n`);
  }
  
  console.log('\n📊 Forum Scraping Summary:');
  console.log(`   Total scraped: ${results.totalScraped}`);
  console.log(`   New listings added: ${results.totalNew}`);
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
