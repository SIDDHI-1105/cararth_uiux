import { db } from '../../../db.js';
import { aetherTopicRecos } from '../../../../shared/schema.js';
import { getWeights } from '../aetherLearn.js';

/**
 * Topic Recommendation Service
 * Generates actionable recommendations (brief/article/landing page) with uplift estimates
 */

/**
 * Generate content brief recommendation
 * @param {string} topicId - Topic ID
 * @param {string} query - Search query
 * @param {Array} sources - Topic sources
 * @param {Object} scores - Topic scores
 * @returns {Object} Brief recommendation
 */
function generateBriefReco(topicId, query, sources, scores) {
  // Extract entities and topics from top sources
  const entities = new Set();
  const topics = new Set();
  
  sources.slice(0, 5).forEach(source => {
    try {
      const sourceEntities = typeof source.entities === 'string' 
        ? JSON.parse(source.entities) 
        : source.entities;
      
      if (sourceEntities) {
        sourceEntities.makes?.forEach(m => entities.add(m));
        sourceEntities.cities?.forEach(c => topics.add(`${query} in ${c}`));
      }
      
      if (source.title) {
        topics.add(source.title);
      }
    } catch {}
  });
  
  // Generate brief outline
  const outline = [
    {
      section: 'Introduction',
      points: [
        `Overview of ${query}`,
        'Why this topic matters',
        'What readers will learn'
      ]
    },
    {
      section: 'Main Content',
      points: [
        'Key considerations',
        'Best practices and tips',
        'Common mistakes to avoid',
        'Real-world examples'
      ]
    },
    {
      section: 'FAQs',
      points: Array.from(topics).slice(0, 5).map(t => `Q: ${t}?`)
    },
    {
      section: 'Conclusion',
      points: [
        'Summary of key points',
        'Next steps for readers',
        'Call to action'
      ]
    }
  ];
  
  // Estimate uplift based on SEO gap
  const seoGap = 1 - scores.seoScore;
  const expectedUplift = Math.min(0.4, seoGap * 0.5); // Up to 40% uplift
  
  return {
    topicId,
    recoType: 'generate_brief',
    payload: {
      query,
      outline,
      entities: Array.from(entities),
      relatedTopics: Array.from(topics).slice(0, 10),
      targetWordCount: 1500,
      tone: 'informative and helpful',
      targetAudience: 'car buyers in India'
    },
    expectedUplift,
    effort: expectedUplift > 0.25 ? 'medium' : 'low',
    confidence: 0.7
  };
}

/**
 * Generate article recommendation
 * @param {string} topicId - Topic ID
 * @param {string} query - Search query
 * @param {string} city - Target city
 * @param {Array} sources - Topic sources
 * @param {Object} scores - Topic scores
 * @returns {Object} Article recommendation
 */
function generateArticleReco(topicId, query, city, sources, scores) {
  // Determine article type based on query
  let articleType = 'guide';
  if (query.toLowerCase().includes('best')) {
    articleType = 'listicle';
  } else if (query.toLowerCase().includes('vs') || query.toLowerCase().includes('compare')) {
    articleType = 'comparison';
  } else if (query.toLowerCase().includes('how')) {
    articleType = 'howto';
  }
  
  // Extract top competitors
  const topCompetitors = sources
    .sort((a, b) => (a.serpPosition || 10) - (b.serpPosition || 10))
    .slice(0, 3)
    .map(s => s.domain);
  
  // Estimate uplift based on GEO gap
  const geoGap = 1 - scores.geoScore;
  const expectedUplift = Math.min(0.5, geoGap * 0.6); // Up to 50% uplift
  
  return {
    topicId,
    recoType: 'generate_article',
    payload: {
      query,
      city,
      articleType,
      targetWordCount: articleType === 'listicle' ? 2000 : 1800,
      includeInventoryLinks: true,
      topCompetitors,
      keyPoints: [
        `Local insights for ${city}`,
        'Expert recommendations',
        'Real customer experiences',
        'Up-to-date market data'
      ],
      seoOptimizations: {
        includeSchema: true,
        includeInternalLinks: true,
        optimizeForFeaturedSnippet: true
      }
    },
    expectedUplift,
    effort: articleType === 'comparison' ? 'high' : 'medium',
    confidence: 0.75
  };
}

/**
 * Generate landing page recommendation
 * @param {string} topicId - Topic ID
 * @param {string} query - Search query
 * @param {string} city - Target city
 * @param {Array} sources - Topic sources
 * @param {Object} scores - Topic scores
 * @returns {Object} Landing page recommendation
 */
function generateLandingPageReco(topicId, query, city, sources, scores) {
  // Extract make/model from query
  let make = null;
  let model = null;
  
  const makes = ['maruti', 'hyundai', 'honda', 'mahindra', 'tata', 'toyota', 'kia'];
  makes.forEach(m => {
    if (query.toLowerCase().includes(m)) {
      make = m;
    }
  });
  
  // Extract price range if present
  let priceRange = null;
  if (query.toLowerCase().includes('under')) {
    const match = query.match(/under\s+(\d+)\s+lakh/i);
    if (match) {
      priceRange = { max: parseInt(match[1]) * 100000 };
    }
  }
  
  // Estimate uplift based on combined SEO + GEO gap
  const seoGap = 1 - scores.seoScore;
  const geoGap = 1 - scores.geoScore;
  const weights = getWeights();
  const combinedGap = (seoGap * (weights.indexability || 0.6)) + (geoGap * (1 - (weights.indexability || 0.6)));
  const expectedUplift = Math.min(0.6, combinedGap * 0.7); // Up to 60% uplift
  
  return {
    topicId,
    recoType: 'generate_lp',
    payload: {
      query,
      city,
      make,
      model,
      priceRange,
      sections: [
        {
          type: 'hero',
          title: query,
          subtitle: `Find the best ${query} in ${city}`,
          cta: 'Browse Inventory'
        },
        {
          type: 'inventory_grid',
          filters: {
            city,
            make,
            model,
            ...priceRange
          },
          limit: 12
        },
        {
          type: 'trust_signals',
          points: [
            'AI-verified listings',
            'Transparent pricing',
            'Certified dealers',
            'Free inspection reports'
          ]
        },
        {
          type: 'local_insights',
          city,
          showMarketTrends: true,
          showPopularModels: true
        },
        {
          type: 'faq',
          questions: [
            `Best ${query} in ${city}?`,
            `Average price for ${query}?`,
            `Where to buy ${query} in ${city}?`
          ]
        }
      ],
      seoOptimizations: {
        schema: 'LocalBusiness',
        canonical: `/used-cars/${city.toLowerCase()}/${query.toLowerCase().replace(/\s+/g, '-')}`,
        og: true,
        twitter: true
      }
    },
    expectedUplift,
    effort: 'medium',
    confidence: 0.8
  };
}

/**
 * Generate one-off promotional recommendation
 * @param {string} topicId - Topic ID
 * @param {string} query - Search query
 * @param {Object} scores - Topic scores
 * @returns {Object|null} Promo recommendation or null
 */
function generatePromoReco(topicId, query, scores) {
  // Only suggest promo if it's a high-competition topic
  if (scores.competition < 0.6) {
    return null;
  }
  
  return {
    topicId,
    recoType: 'run_promo',
    payload: {
      query,
      channels: ['google_ads', 'facebook_ads'],
      budget: 5000, // ₹5000 pilot budget
      duration: 7, // 7 days
      targeting: {
        location: scores.details?.city || 'Hyderabad',
        interests: ['used cars', 'car buying', 'automotive'],
        age: '25-45'
      }
    },
    expectedUplift: 0.3, // 30% short-term boost
    effort: 'low',
    confidence: 0.6
  };
}

/**
 * Generate recommendations for a topic
 * @param {string} topicId - Topic ID
 * @param {string} query - Search query
 * @param {string} city - Target city
 * @param {Array} sources - Topic sources
 * @param {Object} scores - Topic scores
 * @returns {Promise<Array>} Array of recommendations
 */
export async function generateRecommendations(topicId, query, city, sources, scores) {
  console.log(`[TopicReco] Generating recommendations for topic ${topicId}`);
  
  const recommendations = [];
  
  // Always recommend content brief (lowest effort)
  const briefReco = generateBriefReco(topicId, query, sources, scores);
  recommendations.push(briefReco);
  
  // Recommend article if win score is decent (> 0.3)
  if (scores.winScore > 0.3) {
    const articleReco = generateArticleReco(topicId, query, city, sources, scores);
    recommendations.push(articleReco);
  }
  
  // Recommend landing page if win score is strong (> 0.5)
  if (scores.winScore > 0.5) {
    const lpReco = generateLandingPageReco(topicId, query, city, sources, scores);
    recommendations.push(lpReco);
  }
  
  // Optionally recommend promo for high-competition topics
  const promoReco = generatePromoReco(topicId, query, scores);
  if (promoReco) {
    recommendations.push(promoReco);
  }
  
  // Store in database
  for (const reco of recommendations) {
    await db.insert(aetherTopicRecos).values(reco);
  }
  
  console.log(`[TopicReco] Generated ${recommendations.length} recommendations`);
  
  return recommendations;
}
