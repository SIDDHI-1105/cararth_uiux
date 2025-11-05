import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate FAQ JSON-LD schema for an action
 * MVP: Uses predefined FAQ templates based on page type
 */
export function generateFAQSchema(action) {
  const faqs = getFAQsForPage(action.page, action.city);
  
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
  
  return {
    schema: JSON.stringify(schema, null, 2),
    preview: faqs.map(f => f.question).join('\n')
  };
}

/**
 * Get FAQ questions and answers based on page
 */
function getFAQsForPage(page, city) {
  const faqTemplates = {
    '/': [
      {
        question: `What is CarArth and how does it help buyers in ${city}?`,
        answer: `CarArth is India's comprehensive used car search engine that aggregates listings from multiple portals. We help ${city} buyers discover, compare, and buy used cars with confidence through AI-powered verification, authentic pricing intelligence, and comprehensive market analytics.`
      },
      {
        question: `How does CarArth's AI verification work for used cars in ${city}?`,
        answer: `Our AI-powered system validates every listing using multiple intelligence layers: document verification, pricing analysis against ${city} market data, seller authenticity checks, and compliance validation. This ensures you only see trustworthy listings.`
      },
      {
        question: `Is CarArth free to use for buyers in ${city}?`,
        answer: `Yes! CarArth is completely free for car buyers in ${city}. You can search unlimited listings, compare prices, check AI verification scores, and contact sellers without any charges.`
      },
      {
        question: `Which used car portals does CarArth aggregate in ${city}?`,
        answer: `CarArth aggregates listings from major platforms including CarDekho, OLX, Facebook Marketplace, and direct dealer inventories in ${city}. We provide a single search interface across all these sources.`
      },
      {
        question: `How accurate is CarArth's pricing data for ${city} used cars?`,
        answer: `Our pricing intelligence combines real-time market data from ${city}, RTA registration statistics, Google Trends analysis, and AI-powered deal quality scoring to provide highly accurate price recommendations specific to the ${city} market.`
      }
    ],
    '/used-cars/hyderabad': [
      {
        question: `How many used cars are available in ${city} on CarArth?`,
        answer: `CarArth aggregates thousands of verified used car listings in ${city} from multiple sources including dealers, individual sellers, and major portals. Our inventory is updated daily with new listings.`
      },
      {
        question: `What are the most popular used car brands in ${city}?`,
        answer: `Based on ${city} market data, the most popular used car brands are Maruti Suzuki, Hyundai, Honda, Mahindra, and Tata. We provide detailed analytics and pricing trends for each brand in the ${city} market.`
      },
      {
        question: `How do I verify a used car listing in ${city} is genuine?`,
        answer: `Every listing on CarArth includes an AI verification score, document validation status, price analysis, and seller authenticity check. Look for listings with high verification scores and complete documentation for ${city} vehicles.`
      },
      {
        question: `What is the average price of used cars in ${city}?`,
        answer: `Used car prices in ${city} vary by brand, model, year, and condition. CarArth provides real-time market pricing with AI-powered deal quality scores to help you identify fair prices in the ${city} market.`
      },
      {
        question: `Can I sell my used car in ${city} through CarArth?`,
        answer: `Yes! CarArth offers a free seller platform for ${city} residents. List your car once and we'll syndicate it across multiple portals, maximizing your visibility to potential buyers in ${city}.`
      }
    ],
    '/sell': [
      {
        question: `How do I list my used car for sale in ${city}?`,
        answer: `Simply create a free account, fill out your vehicle details, upload photos, and publish your listing. CarArth will automatically syndicate your listing to multiple platforms, maximizing exposure to ${city} buyers.`
      },
      {
        question: `Is there any fee to sell a car on CarArth in ${city}?`,
        answer: `No! Listing your car on CarArth is completely free for sellers in ${city}. You pay nothing to post your listing or connect with potential buyers.`
      },
      {
        question: `How long does it take to sell a car in ${city} through CarArth?`,
        answer: `With our multi-platform syndication and ${city} market reach, most well-priced, verified listings receive inquiries within 24-48 hours. The complete sale process typically takes 7-14 days depending on pricing and vehicle condition.`
      },
      {
        question: `What documents do I need to sell my car in ${city}?`,
        answer: `You'll need: RC (Registration Certificate), valid insurance, PUC (Pollution Under Control) certificate, service records, and owner ID proof. CarArth helps ${city} sellers prepare all required documentation.`
      }
    ],
    '/guides/ai-verified-used-car-trust-india': [
      {
        question: `What is AI verification for used cars?`,
        answer: `AI verification uses machine learning to analyze listing data, documents, pricing, seller history, and compliance factors to generate a trust score. This helps ${city} buyers identify authentic, fairly-priced vehicles.`
      },
      {
        question: `How accurate is AI verification compared to manual inspection?`,
        answer: `AI verification excels at document validation, pricing analysis, and pattern detection across thousands of listings. However, it complements—not replaces—manual physical inspection. We recommend both for ${city} used car purchases.`
      },
      {
        question: `What factors does CarArth's AI check for used cars in ${city}?`,
        answer: `Our AI checks: document authenticity, ${city} RTA registration data, pricing vs. market benchmarks, seller reputation, Google Vehicle Listing compliance, image quality, and listing completeness.`
      }
    ]
  };
  
  return faqTemplates[page] || faqTemplates['/'];
}

/**
 * Generate content brief for content-related actions
 */
export function generateContentBrief(action) {
  const brief = `# Content Brief: ${action.title}

## Page: ${action.page}
## City: ${action.city}
## Expected Uplift: +${action.expectedUplift}%

### Objective
${action.do}

### What NOT to Do
${action.dont}

### Recommended Structure

#### H2: ${action.city} Used Car Market Overview
- Local market statistics
- Popular models and brands
- Average price ranges
- Seasonal trends

#### H2: Why Choose CarArth for ${action.city}
- AI-powered verification
- Comprehensive listings
- Price intelligence
- Seller authenticity

#### H2: FAQs About Used Cars in ${action.city}
- Include 5-8 common questions
- Use natural language
- Include specific ${action.city} data

### Key Entities to Include
- CarArth (brand)
- ${action.city} (location)
- RTA ${action.city} (authority)
- Specific car brands popular in ${action.city}

### Internal Linking Targets
- Other city pages
- Popular brand pages
- Trust and verification guides
- Seller platform

### Word Count Target: 800-1200 words
`;

  return brief;
}

/**
 * Generate asset for an action based on pillar
 */
export async function generateAssetForAction(action) {
  console.log(`[GenerateAssets] Creating asset for: ${action.title}`);
  
  if (action.pillar === 'Schema' && action.title.toLowerCase().includes('faq')) {
    const faqAsset = generateFAQSchema(action);
    return {
      type: 'faq_schema',
      content: faqAsset.schema,
      preview: faqAsset.preview
    };
  }
  
  if (action.pillar === 'Content') {
    const brief = generateContentBrief(action);
    return {
      type: 'content_brief',
      content: brief,
      preview: brief.substring(0, 200) + '...'
    };
  }
  
  // Default: return suggested fix as asset
  return {
    type: 'text',
    content: action.suggestedFix || action.do,
    preview: action.do
  };
}
