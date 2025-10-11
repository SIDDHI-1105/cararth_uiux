import axios from 'axios';
import * as cheerio from 'cheerio';
import { writeFileSync } from 'fs';

async function debugCarDekhoPage() {
  const url = 'https://www.cardekho.com/used-cars+in+hyderabad';
  
  console.log('📡 Fetching CarDekho page...');
  
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      timeout: 30000
    });
    
    // Save raw HTML for inspection
    writeFileSync('cardekho-debug.html', response.data);
    console.log('✅ Saved HTML to cardekho-debug.html');
    
    // Parse and find potential selectors
    const $ = cheerio.load(response.data);
    
    console.log('\n🔍 Looking for car listing patterns...\n');
    
    // Look for common patterns
    const patterns = [
      { name: 'divs with "car" class', selector: 'div[class*="car"]' },
      { name: 'divs with "listing" class', selector: 'div[class*="listing"]' },
      { name: 'divs with "card" class', selector: 'div[class*="card"]' },
      { name: 'article elements', selector: 'article' },
      { name: 'price elements', selector: '[class*="price"]' },
      { name: 'links with car URLs', selector: 'a[href*="/used"]' },
    ];
    
    patterns.forEach(({ name, selector }) => {
      const count = $(selector).length;
      if (count > 0) {
        console.log(`${name}: ${count} found`);
        
        // Show first few examples
        $(selector).slice(0, 3).each((i, el) => {
          const classes = $(el).attr('class') || 'no class';
          const text = $(el).text().trim().substring(0, 100);
          console.log(`  [${i}] ${selector} - classes: ${classes}`);
          if (text && text.length > 10) {
            console.log(`      text: ${text}...`);
          }
        });
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }
}

debugCarDekhoPage();
