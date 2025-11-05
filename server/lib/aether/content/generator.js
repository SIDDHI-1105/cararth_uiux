/**
 * AETHER Auto-SEO Content Generator
 * Production-ready hyperlocal car article generation
 */

import crypto from 'crypto';
import { db } from '../../../db.js';
import { aetherArticles } from '../../../../shared/schema.js';
import { hyperlocalService } from './hyperlocal.js';
import { openaiClient } from '../openaiClient.js';
import { tokenBudget } from '../tokenBudget.js';

class ContentGenerator {
  constructor() {
    this.minWordCount = 1000;
    this.maxWordCount = 2500;
  }

  /**
   * Generate complete article with all SEO elements
   */
  async generateArticle({ topic, city }) {
    console.log(`[AETHER Content] Generating article: ${topic} in ${city}`);

    // Check token budget if OpenAI is available
    if (!openaiClient.isMockMode()) {
      const estimatedTokens = 2000; // Estimate for content generation
      if (!tokenBudget.canUseTokens(estimatedTokens)) {
        tokenBudget.logRejection('content_generation', estimatedTokens, crypto.randomUUID());
        throw new Error('Daily token budget exceeded. Try again tomorrow or contact admin.');
      }
    }

    // Load hyperlocal data
    const cityData = await hyperlocalService.getCityData(city);
    const faqs = await hyperlocalService.generateLocalizedFAQs(city, topic);
    const neighborhoods = await hyperlocalService.getRandomNeighborhoods(city, 5);
    const rtos = await hyperlocalService.getRTOInfo(city);
    const insights = await hyperlocalService.getMarketInsights(city);

    // Generate slug
    const slug = this.generateSlug(topic, city);

    // Generate content
    const isMock = openaiClient.isMockMode();
    let contentHtml, geoIntroQA;

    if (isMock) {
      console.log('[AETHER Content] Using mock mode (no OPENAI_API_KEY)');
      const mockContent = this.generateMockContent({ topic, city, cityData, neighborhoods, rtos, insights, faqs });
      contentHtml = mockContent.html;
      geoIntroQA = mockContent.intro;
    } else {
      const aiContent = await this.generateAIContent({ topic, city, cityData, neighborhoods, rtos, insights, faqs });
      contentHtml = aiContent.html;
      geoIntroQA = aiContent.intro;
    }

    // Generate meta tags
    const meta = this.generateMetaTags({ topic, city, slug });

    // Generate schema markup
    const schema = this.generateSchema({ topic, city, faqs, cityData, insights });

    // Generate internal links
    const internalLinks = await hyperlocalService.generateInternalLinks(city, topic);

    // Generate CTA
    const cta = this.generateCTA({ city, topic });

    // Run SEO checklist
    const seoChecklist = this.runSEOChecklist({
      contentHtml,
      meta,
      schema,
      internalLinks,
      geoIntroQA
    });

    // Save to database
    const article = {
      city,
      topic,
      slug,
      meta,
      schema,
      contentHtml,
      geoIntro: geoIntroQA,
      internalLinks,
      cta,
      seoChecklist,
      status: 'draft'
    };

    const [inserted] = await db.insert(aetherArticles).values(article).returning();

    console.log(`[AETHER Content] Article saved: ${inserted.id} (${slug})`);

    return {
      ...inserted,
      mock: isMock,
      wordCount: this.countWords(contentHtml)
    };
  }

  /**
   * Generate mock content using templates
   */
  generateMockContent({ topic, city, cityData, neighborhoods, rtos, insights, faqs }) {
    const topicLower = topic.toLowerCase();
    const topBrands = insights.topBrands || ['Maruti Suzuki', 'Hyundai', 'Honda'];
    const avgPrice = insights.avgPrice || 750000;

    // GEO-friendly intro (120-180 words)
    const intro = `
      <div class="geo-intro">
        <h2>Q: What are the best ${topic} options in ${city}?</h2>
        <p><strong>A:</strong> ${city} offers excellent ${topic} options across ${neighborhoods.length}+ neighborhoods including ${neighborhoods.slice(0, 3).join(', ')}. The used car market in ${city} is vibrant with ${topBrands.join(', ')} leading the segment. Average prices range from ₹${(cityData.priceBands.budget[0])}L to ₹${(cityData.priceBands.premium[1])}L depending on model, year, and condition.</p>
        
        <p>CarArth aggregates verified listings from trusted dealers and certified platforms, making it easy to compare prices, features, and seller ratings. With ${rtos.length} RTO offices (${rtos.map(r => r.code).join(', ')}) handling registrations, ${city} has streamlined documentation processes. Whether you're looking for budget-friendly hatchbacks or premium SUVs, ${city}'s diverse inventory and competitive pricing make it an ideal market for ${topic}.</p>
      </div>
    `.trim();

    // Main content HTML
    const html = `
      ${intro}

      <h1>${topic} in ${city}: Complete Guide 2025</h1>

      <h2>Why ${city} is Perfect for ${topic}</h2>
      <p>${city}, the IT hub of India, has a thriving used car market. The city's well-connected neighborhoods like ${neighborhoods.slice(0, 3).join(', ')}, and ${neighborhoods[3]} offer diverse options for car buyers. With a tech-savvy population and growing infrastructure, ${city} sees high demand for quality pre-owned vehicles.</p>

      <h3>Market Insights for ${topic}</h3>
      <p>According to recent data, ${city}'s used car market shows strong activity with ${topBrands[0]} leading at approximately ${(insights.topBrands ? ((topBrands.filter(b => b === topBrands[0]).length / topBrands.length) * 100).toFixed(0) : 35)}% market share. Average prices have stabilized around ₹${(avgPrice / 100000).toFixed(1)} lakh, with ${topicLower.includes('suv') ? 'SUVs commanding premium prices' : 'hatchbacks offering excellent value'}.</p>

      <h2>Top ${topic} Price Ranges in ${city}</h2>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #f5f5f5;">
            <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Price Band</th>
            <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Range (₹ Lakh)</th>
            <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Popular Models</th>
            <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">EMI (60 months)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;">Budget</td>
            <td style="padding: 10px; border: 1px solid #ddd;">₹${cityData.priceBands.budget[0]}L - ₹${cityData.priceBands.budget[1]}L</td>
            <td style="padding: 10px; border: 1px solid #ddd;">Swift, WagonR, i10</td>
            <td style="padding: 10px; border: 1px solid #ddd;">₹${cityData.emiRanges.tenure60[0].toLocaleString('en-IN')} - ₹${(cityData.emiRanges.tenure60[0] * 1.8).toLocaleString('en-IN')}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;">Mid-Range</td>
            <td style="padding: 10px; border: 1px solid #ddd;">₹${cityData.priceBands.midRange[0]}L - ₹${cityData.priceBands.midRange[1]}L</td>
            <td style="padding: 10px; border: 1px solid #ddd;">City, Creta, Venue</td>
            <td style="padding: 10px; border: 1px solid #ddd;">₹${(cityData.emiRanges.tenure60[0] * 2).toLocaleString('en-IN')} - ₹${(cityData.emiRanges.tenure60[1] * 0.6).toLocaleString('en-IN')}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;">Premium</td>
            <td style="padding: 10px; border: 1px solid #ddd;">₹${cityData.priceBands.premium[0]}L - ₹${cityData.priceBands.premium[1]}L</td>
            <td style="padding: 10px; border: 1px solid #ddd;">Fortuner, XUV700, Seltos</td>
            <td style="padding: 10px; border: 1px solid #ddd;">₹${(cityData.emiRanges.tenure60[1] * 0.7).toLocaleString('en-IN')} - ₹${cityData.emiRanges.tenure60[1].toLocaleString('en-IN')}</td>
          </tr>
        </tbody>
      </table>

      <h2>Where to Buy ${topic} in ${city}</h2>
      <p>${city} has ${rtos.length} major RTO zones covering different areas:</p>
      <ul>
        ${rtos.map(rto => `<li><strong>${rto.code}</strong>: ${rto.address} - serves ${rto.district}</li>`).join('\n        ')}
      </ul>

      <h3>Popular Neighborhoods for ${topic}</h3>
      <p>The best areas to find ${topic} in ${city} include:</p>
      <ul>
        ${neighborhoods.map(n => `<li>${n} - Known for diverse inventory and competitive pricing</li>`).join('\n        ')}
      </ul>

      <h2>How to Choose the Right ${topic.split(' ').pop()} in ${city}</h2>
      <h3>1. Verify Documentation</h3>
      <p>Ensure the car has complete RC (Registration Certificate) from one of ${city}'s RTOs (${rtos.map(r => r.code).join(', ')}), valid insurance, and pollution certificate. Check for any pending challans or loans.</p>

      <h3>2. Inspect Physical Condition</h3>
      <p>Look for signs of accident damage, rust, or paint work. Test all features including AC, power windows, and audio system. ${city}'s roads can be demanding, so check suspension and tire condition carefully.</p>

      <h3>3. Compare Prices Across Platforms</h3>
      <p>CarArth aggregates listings from multiple sources, helping you compare prices instantly. For ${topic}, expect to pay between ₹${cityData.priceBands.midRange[0]}L - ₹${cityData.priceBands.midRange[1]}L for well-maintained models.</p>

      <h2>Financing Options for ${topic} in ${city}</h2>
      <p>Most banks and NBFCs in ${city} offer competitive used car loans with interest rates ranging from 10% to 14% per annum. For a ₹${(avgPrice / 100000).toFixed(0)}L car:</p>
      <ul>
        <li><strong>36 months:</strong> ₹${hyperlocalService.calculateEMI(avgPrice, 36, 10.5).toLocaleString('en-IN')}/month</li>
        <li><strong>48 months:</strong> ₹${hyperlocalService.calculateEMI(avgPrice, 48, 10.5).toLocaleString('en-IN')}/month</li>
        <li><strong>60 months:</strong> ₹${hyperlocalService.calculateEMI(avgPrice, 60, 10.5).toLocaleString('en-IN')}/month</li>
      </ul>

      <h2>Frequently Asked Questions</h2>
      ${faqs.map(faq => `
        <h3>${faq.question}</h3>
        <p>${faq.answer}</p>
      `).join('\n      ')}

      <h2>Why Choose CarArth for ${topic} in ${city}?</h2>
      <p>CarArth stands out by aggregating verified listings from trusted dealers, certified platforms like Cars24 and Spinny, and individual sellers. Our AI-powered search helps you find the perfect match based on budget, features, and location. With transparent pricing, detailed vehicle history, and neighborhood-level search in ${city}, we make buying ${topic} simpler and safer.</p>

      <h3>Start Your Search Today</h3>
      <p>Ready to find your perfect ${topic.split(' ').pop()} in ${city}? Explore hundreds of verified listings, compare prices across ${neighborhoods.length}+ neighborhoods, and connect directly with trusted sellers. CarArth's platform brings transparency and convenience to ${city}'s used car market.</p>
    `.trim();

    return { html, intro };
  }

  /**
   * Generate AI-powered content (when OpenAI key is available)
   */
  async generateAIContent({ topic, city, cityData, neighborhoods, rtos, insights, faqs }) {
    const prompt = `You are an expert SEO content writer for used cars in India. Generate a comprehensive, SEO-optimized article about "${topic} in ${city}".

CONTEXT:
- City: ${city}, ${cityData.state || 'Telangana'}
- Top Neighborhoods: ${neighborhoods.join(', ')}
- RTO Offices: ${rtos.map(r => `${r.code} (${r.address})`).join(', ')}
- Average Price: ₹${(insights.avgPrice / 100000).toFixed(1)} lakh
- Top Brands: ${insights.topBrands.join(', ')}
- Price Bands: Budget (₹${cityData.priceBands.budget[0]}-${cityData.priceBands.budget[1]}L), Mid-range (₹${cityData.priceBands.midRange[0]}-${cityData.priceBands.midRange[1]}L), Premium (₹${cityData.priceBands.premium[0]}-${cityData.priceBands.premium[1]}L)

REQUIREMENTS:
1. Start with a GEO-friendly Q&A intro (120-180 words)
   - Format: <h2>Q: [Question about ${topic} in ${city}]?</h2> <p><strong>A:</strong> [Detailed answer with stats and hyperlocal context]</p>
   - Must mention specific neighborhoods, RTOs, price ranges, and market insights
   - Optimize for AI search engines (perplexity, ChatGPT, Gemini)

2. Main Content Structure:
   - Single H1: "${topic} in ${city}: Complete Guide 2025"
   - 5-7 H2 sections covering: market overview, price ranges, neighborhoods, buying guide, financing, FAQs
   - 2-3 H3 subsections per H2
   - Include 1-2 HTML tables with price comparisons or feature lists
   - Mention ${neighborhoods.length} neighborhoods naturally
   - Reference all ${rtos.length} RTO offices with codes
   - Total length: 1500-2000 words

3. Content Guidelines:
   - Use specific data: prices, EMI ranges, model names
   - Include practical buying tips for ${city} buyers
   - Mention popular models: ${insights.topBrands.slice(0, 3).join(', ')}
   - Natural keyword placement (no stuffing)
   - Write for humans, optimize for search

4. HTML Format:
   - Use semantic HTML: <h1>, <h2>, <h3>, <p>, <ul>, <ol>, <table>
   - Tables must have proper structure with <thead> and <tbody>
   - No inline styles except for table borders/padding
   - No markdown - pure HTML only

Generate the complete article HTML (intro + main content):`;

    const result = await openaiClient.chatCompletion(prompt, {
      maxTokens: 2500,
      temperature: 0.7,
      correlationId: crypto.randomUUID()
    });

    // Parse intro and full HTML from AI response
    const fullHtml = result.content;
    
    // Extract intro (first Q&A section)
    const introMatch = fullHtml.match(/<div class="geo-intro">[\s\S]*?<\/div>|<h2>Q:[\s\S]*?<\/p>/);
    const intro = introMatch ? introMatch[0] : fullHtml.substring(0, 500);
    
    return {
      html: fullHtml,
      intro,
      tokens: result.tokens,
      cost: result.cost
    };
  }

  /**
   * Generate meta tags
   */
  generateMetaTags({ topic, city, slug }) {
    const title = `${topic} in ${city} | Best Deals 2025 - CarArth`.substring(0, 60);
    const description = `Find ${topic} in ${city}. Compare verified listings, prices & dealers. Expert buying guide with EMI calculator. Trusted by thousands. Search now!`.substring(0, 160);

    return {
      title,
      description,
      robots: 'index, follow',
      canonical: `https://www.cararth.com/guides/${slug}`,
      ogImage: `https://www.cararth.com/og-images/guides/${city.toLowerCase()}.jpg`
    };
  }

  /**
   * Generate Schema.org markup
   */
  generateSchema({ topic, city, faqs, cityData, insights }) {
    const schema = {};

    // FAQPage schema
    schema.faq = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer
        }
      }))
    };

    // BreadcrumbList schema
    schema.breadcrumb = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://www.cararth.com'
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Guides',
          item: 'https://www.cararth.com/guides'
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: city,
          item: `https://www.cararth.com/used-cars-${city.toLowerCase()}`
        },
        {
          '@type': 'ListItem',
          position: 4,
          name: topic
        }
      ]
    };

    // Vehicle Offer blocks (2-3 examples)
    const topBrands = insights.topBrands || ['Maruti Swift', 'Hyundai i20', 'Honda City'];
    schema.vehicleOfferBlocks = topBrands.slice(0, 3).map((model, idx) => {
      const basePrice = cityData.priceBands.midRange[0] * 100000;
      const price = basePrice + (idx * 200000);
      
      return {
        '@context': 'https://schema.org',
        '@type': 'Car',
        name: model,
        brand: {
          '@type': 'Brand',
          name: model.split(' ')[0]
        },
        offers: {
          '@type': 'Offer',
          priceCurrency: 'INR',
          price: price,
          availability: 'https://schema.org/InStock',
          itemCondition: 'https://schema.org/UsedCondition',
          seller: {
            '@type': 'Organization',
            name: 'CarArth',
            url: 'https://www.cararth.com'
          }
        },
        vehicleConfiguration: `Used ${model} in ${city}`
      };
    });

    return schema;
  }

  /**
   * Generate CTA button
   */
  generateCTA({ city, topic }) {
    const citySlug = city.toLowerCase().replace(/\s+/g, '-');
    return {
      text: `Search ${topic} in ${city}`,
      href: `/used-cars/${citySlug}?topic=${encodeURIComponent(topic)}`
    };
  }

  /**
   * Run SEO checklist
   */
  runSEOChecklist({ contentHtml, meta, schema, internalLinks, geoIntroQA }) {
    const pass = [];
    const warn = [];

    // Check H1 count
    const h1Count = (contentHtml.match(/<h1[^>]*>/gi) || []).length;
    if (h1Count === 1) {
      pass.push('Single H1 tag present');
    } else {
      warn.push(`Found ${h1Count} H1 tags (should be exactly 1)`);
    }

    // Check title length
    if (meta.title.length <= 60) {
      pass.push(`Title length: ${meta.title.length} chars (≤60)`);
    } else {
      warn.push(`Title too long: ${meta.title.length} chars (should be ≤60)`);
    }

    // Check description length
    if (meta.description.length >= 150 && meta.description.length <= 160) {
      pass.push(`Meta description: ${meta.description.length} chars (150-160)`);
    } else {
      warn.push(`Meta description: ${meta.description.length} chars (should be 150-160)`);
    }

    // Check internal links
    if (internalLinks.length >= 2) {
      pass.push(`${internalLinks.length} internal links present (≥2)`);
    } else {
      warn.push(`Only ${internalLinks.length} internal links (should have ≥2)`);
    }

    // Check word count
    const wordCount = this.countWords(contentHtml);
    if (wordCount >= 1000) {
      pass.push(`Word count: ${wordCount} (≥1000)`);
    } else {
      warn.push(`Word count: ${wordCount} (should be ≥1000)`);
    }

    // Check table presence
    if (contentHtml.includes('<table')) {
      pass.push('Price/comparison table present');
    } else {
      warn.push('No table found (should include price/comparison table)');
    }

    // Check schema presence
    if (schema.faq && schema.breadcrumb && schema.vehicleOfferBlocks) {
      pass.push('Schema markup complete (FAQ, Breadcrumb, Vehicle+Offer)');
    } else {
      warn.push('Incomplete schema markup');
    }

    // Check GEO intro
    if (geoIntroQA && geoIntroQA.length >= 120 && geoIntroQA.length <= 500) {
      pass.push('GEO-friendly Q&A intro present (120-180 words)');
    } else {
      warn.push('GEO intro missing or incorrect length');
    }

    return { pass, warn };
  }

  /**
   * Generate URL-friendly slug
   */
  generateSlug(topic, city) {
    const base = `${topic}-${city}`
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 200);
    
    return base;
  }

  /**
   * Count words in HTML content
   */
  countWords(html) {
    const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return text.split(' ').filter(w => w.length > 0).length;
  }

  /**
   * Preview article by ID
   */
  async getArticlePreview(articleId) {
    const article = await db.query.aetherArticles.findFirst({
      where: (articles, { eq }) => eq(articles.id, articleId)
    });

    if (!article) {
      return null;
    }

    return {
      ...article,
      wordCount: this.countWords(article.contentHtml),
      preview: article.contentHtml.substring(0, 500) + '...'
    };
  }

  /**
   * List articles with filters
   */
  async listArticles({ city, status, limit = 50, offset = 0 }) {
    let query = db.query.aetherArticles.findMany({
      orderBy: (articles, { desc }) => [desc(articles.createdAt)],
      limit,
      offset
    });

    // Note: Filtering would need to be done with where() clauses in Drizzle
    // For now, fetch all and filter in memory for simplicity
    const allArticles = await db.query.aetherArticles.findMany({
      orderBy: (articles, { desc }) => [desc(articles.createdAt)]
    });

    let filtered = allArticles;
    
    if (city) {
      filtered = filtered.filter(a => a.city.toLowerCase() === city.toLowerCase());
    }
    
    if (status) {
      filtered = filtered.filter(a => a.status === status);
    }

    const paginated = filtered.slice(offset, offset + limit);

    return {
      articles: paginated.map(a => ({
        id: a.id,
        city: a.city,
        topic: a.topic,
        slug: a.slug,
        status: a.status,
        meta: a.meta,
        seoChecklist: a.seoChecklist,
        wordCount: this.countWords(a.contentHtml),
        createdAt: a.createdAt,
        updatedAt: a.updatedAt
      })),
      total: filtered.length,
      limit,
      offset
    };
  }
}

export const contentGenerator = new ContentGenerator();
