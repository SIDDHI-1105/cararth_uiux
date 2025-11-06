import { db } from '../../../db.js';
import { aetherTopics, aetherTopicSources } from '../../../../shared/schema.js';
import { eq } from 'drizzle-orm';

/**
 * Topic Ingestion Service
 * Fetches SERP data, crawls page metadata, and stores topic sources
 */

const DEFAULT_CITY = process.env.AETHER_CITY_DEFAULT || 'Hyderabad';

/**
 * Generate query variants for better SERP coverage
 * @param {string} baseQuery - Base search query
 * @param {string} city - Target city
 * @returns {string[]} Array of query variants
 */
function generateQueryVariants(baseQuery, city) {
  const variants = new Set();
  
  // Base query with city
  variants.add(`${baseQuery} ${city}`);
  
  // Plural/singular variations
  if (baseQuery.endsWith('s')) {
    variants.add(`${baseQuery.slice(0, -1)} ${city}`);
  } else {
    variants.add(`${baseQuery}s ${city}`);
  }
  
  // Budget range variations (for car-related queries)
  if (baseQuery.toLowerCase().includes('car') || baseQuery.toLowerCase().includes('cars')) {
    variants.add(`${baseQuery} under 5 lakh ${city}`);
    variants.add(`${baseQuery} under 10 lakh ${city}`);
    variants.add(`best ${baseQuery} ${city}`);
    variants.add(`used ${baseQuery} ${city}`);
  }
  
  // "Near me" variation
  variants.add(`${baseQuery} near ${city}`);
  
  // "In city" variation
  variants.add(`${baseQuery} in ${city}`);
  
  return Array.from(variants).slice(0, 5); // Limit to 5 variants to control costs
}

/**
 * Mock SERP results for when API keys are missing
 * @param {string} query - Search query
 * @returns {Array} Mock SERP results
 */
function getMockSERPResults(query) {
  const mockDomains = [
    'cardekho.com',
    'cars24.com',
    'spinny.com',
    'olx.in',
    'carwale.com',
    'cartrade.com',
    'zigwheels.com',
    'auto.ndtv.com',
    'carandbike.com',
    'team-bhp.com'
  ];
  
  return mockDomains.map((domain, index) => ({
    url: `https://www.${domain}/${query.toLowerCase().replace(/\s+/g, '-')}`,
    title: `${query} - ${domain}`,
    snippet: `Find the best ${query} with detailed reviews, prices, and specifications on ${domain}.`,
    position: index + 1,
    domain
  }));
}

/**
 * Fetch SERP results using Firecrawl or Apify
 * @param {string} query - Search query
 * @returns {Promise<Array>} SERP results
 */
async function fetchSERP(query) {
  const firecrawlKey = process.env.FIRECRAWL_KEY;
  const apifyToken = process.env.APIFY_TOKEN;
  
  // Try Firecrawl first
  if (firecrawlKey) {
    try {
      console.log(`[TopicIngest] Fetching SERP via Firecrawl for: ${query}`);
      
      // Firecrawl search endpoint
      const response = await fetch('https://api.firecrawl.dev/v0/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query,
          limit: 20,
          scrapeOptions: {
            formats: ['html'],
            onlyMainContent: true
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Firecrawl error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data?.map((result, index) => ({
        url: result.url,
        title: result.metadata?.title || result.url,
        snippet: result.metadata?.description || '',
        position: index + 1,
        domain: new URL(result.url).hostname.replace('www.', '')
      })) || [];
    } catch (error) {
      console.warn(`[TopicIngest] Firecrawl failed: ${error.message}`);
    }
  }
  
  // Try Apify as fallback
  if (apifyToken) {
    try {
      console.log(`[TopicIngest] Fetching SERP via Apify for: ${query}`);
      
      // Use Apify's Google Search Results actor
      const apifyClient = await import('apify-client');
      const client = new apifyClient.ApifyClient({ token: apifyToken });
      
      const run = await client.actor('apify/google-search-scraper').call({
        queries: query,
        maxPagesPerQuery: 1,
        resultsPerPage: 20,
        mobileResults: false
      });
      
      const { items } = await client.dataset(run.defaultDatasetId).listItems();
      
      return items[0]?.organicResults?.map((result, index) => ({
        url: result.url,
        title: result.title,
        snippet: result.description || '',
        position: index + 1,
        domain: new URL(result.url).hostname.replace('www.', '')
      })) || [];
    } catch (error) {
      console.warn(`[TopicIngest] Apify failed: ${error.message}`);
    }
  }
  
  // Use mock data if no API keys or all failed
  console.log(`[TopicIngest] Using mock SERP data for: ${query}`);
  return getMockSERPResults(query);
}

/**
 * Crawl page metadata (title, meta tags, H1, word count)
 * @param {string} url - Page URL
 * @returns {Promise<Object>} Page metadata
 */
async function crawlPageMetadata(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AETHERBot/1.0; +https://cararth.com/aether)'
      },
      timeout: 5000
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    
    // Extract title
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';
    
    // Extract meta description
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/i);
    const description = descMatch ? descMatch[1].trim() : '';
    
    // Extract H1
    const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const h1 = h1Match ? h1Match[1].replace(/<[^>]*>/g, '').trim() : '';
    
    // Approximate word count (body text only)
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    const bodyText = bodyMatch ? bodyMatch[1].replace(/<[^>]*>/g, ' ') : html;
    const wordcount = bodyText.split(/\s+/).filter(w => w.length > 0).length;
    
    // Detect schema types
    const schemaTypes = new Set();
    const schemaMatches = html.matchAll(/"@type"\s*:\s*"([^"]+)"/g);
    for (const match of schemaMatches) {
      schemaTypes.add(match[1]);
    }
    
    // Extract entities (make, model, year, city mentions)
    const entities = {
      makes: [],
      models: [],
      years: [],
      cities: []
    };
    
    // Common car makes (Indian market)
    const makes = ['maruti', 'hyundai', 'honda', 'mahindra', 'tata', 'toyota', 'kia', 'volkswagen', 'skoda', 'renault'];
    const textLower = html.toLowerCase();
    makes.forEach(make => {
      if (textLower.includes(make)) {
        entities.makes.push(make);
      }
    });
    
    // Extract years (2015-2025)
    const yearMatches = html.matchAll(/\b(20[12][0-9])\b/g);
    for (const match of yearMatches) {
      if (!entities.years.includes(match[1])) {
        entities.years.push(match[1]);
      }
    }
    
    // Extract city mentions
    const cities = ['hyderabad', 'bangalore', 'mumbai', 'delhi', 'pune', 'chennai'];
    cities.forEach(city => {
      if (textLower.includes(city)) {
        entities.cities.push(city);
      }
    });
    
    return {
      title: title || null,
      description,
      h1,
      wordcount,
      schemaTypes: Array.from(schemaTypes),
      entities
    };
  } catch (error) {
    console.warn(`[TopicIngest] Failed to crawl ${url}: ${error.message}`);
    return {
      title: null,
      description: '',
      h1: '',
      wordcount: 0,
      schemaTypes: [],
      entities: { makes: [], models: [], years: [], cities: [] }
    };
  }
}

/**
 * Estimate backlinks using heuristic buckets
 * @param {string} domain - Domain name
 * @returns {number} Estimated backlink count
 */
function estimateBacklinks(domain) {
  // Heuristic buckets based on domain authority tiers
  const highAuthority = ['cardekho.com', 'cars24.com', 'auto.ndtv.com', 'carandbike.com', 'team-bhp.com'];
  const mediumAuthority = ['spinny.com', 'carwale.com', 'cartrade.com', 'zigwheels.com'];
  const lowAuthority = ['olx.in'];
  
  if (highAuthority.some(d => domain.includes(d))) return 50000;
  if (mediumAuthority.some(d => domain.includes(d))) return 10000;
  if (lowAuthority.some(d => domain.includes(d))) return 5000;
  
  // Default for unknown domains
  return 1000;
}

/**
 * Estimate traffic based on SERP position
 * @param {number} position - SERP position (1-20)
 * @returns {number} Estimated monthly traffic
 */
function estimateTraffic(position) {
  // CTR model: position 1 gets 30%, position 2 gets 15%, etc.
  const ctrByPosition = {
    1: 0.30, 2: 0.15, 3: 0.10, 4: 0.07, 5: 0.05,
    6: 0.04, 7: 0.03, 8: 0.02, 9: 0.02, 10: 0.01
  };
  
  const baseCTR = ctrByPosition[position] || 0.005; // < 0.5% for position 11+
  const estimatedSearchVolume = 10000; // Assume 10k monthly searches for topic
  
  return Math.round(estimatedSearchVolume * baseCTR);
}

/**
 * Ingest a topic and fetch SERP sources
 * @param {Object} options - Ingestion options
 * @param {string} options.query - Search query
 * @param {string} [options.city] - Target city (defaults to AETHER_CITY_DEFAULT)
 * @returns {Promise<Object>} Ingestion result with topic ID and sources
 */
export async function ingestTopic({ query, city = DEFAULT_CITY }) {
  console.log(`[TopicIngest] Starting ingestion for: ${query} (${city})`);
  
  try {
    // Step 1: Create or update topic
    const [topic] = await db.insert(aetherTopics)
      .values({
        query,
        city,
        cluster: null, // Will be set later by clustering algorithm
        intent: null   // Will be inferred from SERP patterns
      })
      .returning();
    
    console.log(`[TopicIngest] Created topic ${topic.id}`);
    
    // Step 2: Generate query variants
    const variants = generateQueryVariants(query, city);
    console.log(`[TopicIngest] Generated ${variants.length} query variants`);
    
    // Step 3: Fetch SERP results for all variants
    const allResults = [];
    for (const variant of variants) {
      const results = await fetchSERP(variant);
      allResults.push(...results);
    }
    
    // Deduplicate by URL
    const uniqueResults = Array.from(
      new Map(allResults.map(r => [r.url, r])).values()
    ).slice(0, 20); // Top 20 unique URLs
    
    console.log(`[TopicIngest] Fetched ${uniqueResults.length} unique SERP results`);
    
    // Step 4: Crawl metadata for each result
    const sources = [];
    for (const result of uniqueResults) {
      const metadata = await crawlPageMetadata(result.url);
      const backlinks = estimateBacklinks(result.domain);
      const traffic = estimateTraffic(result.position);
      
      sources.push({
        topicId: topic.id,
        url: result.url,
        title: metadata.title || result.title,
        domain: result.domain,
        serpPosition: result.position,
        estTraffic: traffic,
        backlinks,
        wordcount: metadata.wordcount,
        entities: metadata.entities
      });
    }
    
    // Step 5: Store sources in database
    if (sources.length > 0) {
      await db.insert(aetherTopicSources).values(sources);
      console.log(`[TopicIngest] Stored ${sources.length} sources`);
    }
    
    return {
      topicId: topic.id,
      sourcesCount: sources.length,
      mock: !process.env.FIRECRAWL_KEY && !process.env.APIFY_TOKEN
    };
  } catch (error) {
    console.error(`[TopicIngest] Error ingesting topic:`, error);
    throw error;
  }
}
