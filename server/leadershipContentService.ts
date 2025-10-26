import { CommunityPost } from './rssService.js';
import { logError, ErrorCategory, createAppError } from './errorHandling.js';

interface LeadershipArticle extends CommunityPost {
  enhancedContent?: string;
  schemaMarkup?: string;
  internalLinks?: string[];
  leaderName?: string;
  companyName?: string;
  position?: string;
  enhancementMode?: 'grok' | 'perplexity' | 'fallback';
}

export class LeadershipContentService {
  private readonly LEADERSHIP_KEYWORDS = [
    'CEO', 'Chief Executive Officer',
    'MD', 'Managing Director',
    'CFO', 'Chief Financial Officer',
    'COO', 'Chief Operating Officer',
    'CTO', 'Chief Technology Officer',
    'President',
    'appointment', 'appointed',
    'promotion', 'promoted',
    'leadership', 'executive',
    'takes charge', 'new role',
    'joins as', 'named as',
    'elevation', 'elevated'
  ];

  private readonly INTERNAL_LINKS_MAP: Record<string, string> = {
    'electric vehicle': '/news?category=technology',
    'EV': '/news?category=technology',
    'hybrid': '/news?category=technology',
    'SUV': '/search?bodyType=SUV',
    'sedan': '/search?bodyType=Sedan',
    'market share': '/news?category=market',
    'sales': '/news?category=market',
    'Hyundai': '/search?brand=Hyundai',
    'Maruti': '/search?brand=Maruti%20Suzuki',
    'Tata': '/search?brand=Tata',
    'Mahindra': '/search?brand=Mahindra',
    'Honda': '/search?brand=Honda',
    'Toyota': '/search?brand=Toyota',
    'Kia': '/search?brand=Kia'
  };

  /**
   * Filter RSS posts to identify leadership-related articles
   */
  filterLeadershipArticles(posts: CommunityPost[]): LeadershipArticle[] {
    const leadershipPosts: LeadershipArticle[] = [];

    for (const post of posts) {
      const combinedText = `${post.title} ${post.content}`.toLowerCase();
      
      const hasLeadershipKeyword = this.LEADERSHIP_KEYWORDS.some(keyword => 
        combinedText.includes(keyword.toLowerCase())
      );

      if (hasLeadershipKeyword) {
        leadershipPosts.push({
          ...post,
          category: 'Leadership & Promotions'
        });
      }
    }

    console.log(`✅ Filtered ${leadershipPosts.length} leadership articles from ${posts.length} total posts`);

    return leadershipPosts;
  }

  /**
   * Extract leader and company information from article
   */
  extractLeadershipInfo(article: LeadershipArticle): { 
    leaderName?: string; 
    companyName?: string; 
    position?: string;
  } {
    const text = `${article.title} ${article.content}`;
    
    // Extract position (CEO, MD, etc.)
    const positionMatch = text.match(/\b(CEO|Chief Executive Officer|MD|Managing Director|CFO|COO|CTO|President)\b/i);
    const position = positionMatch ? positionMatch[1] : undefined;

    // Extract company name (common Indian auto brands)
    const companies = ['Hyundai', 'Maruti Suzuki', 'Tata Motors', 'Mahindra', 'Honda', 'Toyota', 'Kia', 'Nissan', 'Renault', 'Volkswagen', 'Skoda', 'MG Motor'];
    const companyName = companies.find(company => 
      text.toLowerCase().includes(company.toLowerCase())
    );

    // Extract leader name (heuristic: capitalized words before position)
    let leaderName: string | undefined;
    if (position) {
      const regex = new RegExp(`([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*?)\\s+(?:as\\s+|named\\s+|appointed\\s+)?${position}`, 'i');
      const nameMatch = text.match(regex);
      leaderName = nameMatch ? nameMatch[1].trim() : undefined;
    }

    return { leaderName, companyName, position };
  }

  /**
   * Generate internal links based on article content
   */
  generateInternalLinks(article: LeadershipArticle): string[] {
    const links: string[] = [];
    const combinedText = `${article.title} ${article.content}`.toLowerCase();

    for (const [keyword, url] of Object.entries(this.INTERNAL_LINKS_MAP)) {
      if (combinedText.includes(keyword.toLowerCase())) {
        if (!links.includes(url)) {
          links.push(url);
        }
      }
    }

    return links.slice(0, 3); // Limit to 3 internal links
  }

  /**
   * Generate Schema.org JSON-LD markup for leadership article
   */
  generateSchemaMarkup(article: LeadershipArticle): string {
    const { leaderName, companyName, position } = this.extractLeadershipInfo(article);

    // Clean description (truncate at sentence boundary, max 200 chars)
    let description = article.content.substring(0, 200);
    const lastPeriod = description.lastIndexOf('.');
    if (lastPeriod > 100) {
      description = description.substring(0, lastPeriod + 1);
    }

    const schema: Record<string, any> = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": article.title,
      "description": description.trim(),
      "datePublished": article.publishedAt.toISOString(),
      "author": {
        "@type": "Organization",
        "name": article.source
      },
      "publisher": {
        "@type": "Organization",
        "name": "CarArth",
        "url": "https://www.cararth.com"
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": article.sourceUrl
      },
      "articleSection": "Leadership & Promotions",
      "keywords": ["automotive leadership", "India auto industry", position, companyName, leaderName].filter(Boolean)
    };

    // Add Person entity if leader identified (only include defined fields)
    if (leaderName) {
      const personEntity: Record<string, any> = {
        "@type": "Person",
        "name": leaderName
      };
      
      if (position) {
        personEntity.jobTitle = position;
      }
      
      if (companyName) {
        personEntity.worksFor = {
          "@type": "Organization",
          "name": companyName
        };
      }
      
      schema["mentions"] = personEntity;
    }

    // Add Organization entity if company identified
    if (companyName && !leaderName) {
      schema["about"] = {
        "@type": "Organization",
        "name": companyName
      };
    }

    return JSON.stringify(schema, null, 2);
  }

  /**
   * Enhance leadership article with AI-generated content (Grok → Perplexity → Fallback)
   */
  async enhanceWithAI(article: LeadershipArticle): Promise<{ content: string; mode: 'grok' | 'perplexity' | 'fallback' }> {
    const { leaderName, companyName, position } = this.extractLeadershipInfo(article);
    
    // Try Grok first
    if (process.env.GROK_API_KEY) {
      try {
        const response = await fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.GROK_API_KEY}`
          },
          body: JSON.stringify({
            model: 'grok-beta',
            messages: [
              {
                role: 'system',
                content: 'You are an expert automotive industry writer creating engaging, SEO-optimized content for the Indian market. Write in a vivid, storytelling style that captures reader attention.'
              },
              {
                role: 'user',
                content: `Create an engaging 500-word article about this automotive leadership news:

Title: ${article.title}
Summary: ${article.content}
${leaderName ? `Leader: ${leaderName}` : ''}
${companyName ? `Company: ${companyName}` : ''}
${position ? `Position: ${position}` : ''}

Requirements:
- Start with vivid storytelling (e.g., "Picture ${leaderName || 'a visionary leader'} steering ${companyName || 'an automotive giant'} into a new era...")
- Include intent-based keywords like "top Indian auto leaders 2025", "automotive CEO India"
- Add industry context and market implications
- Make it relatable with analogies to everyday experiences
- End with a forward-looking statement about India's automotive future
- Use conversational, engaging tone
- Focus on human interest and business impact`
              }
            ],
            temperature: 0.7,
            max_tokens: 800
          })
        });

        if (response.ok) {
          const data = await response.json();
          const enhancedContent = data.choices?.[0]?.message?.content || '';
          
          if (enhancedContent) {
            console.log(`✅ Enhanced leadership article with Grok: ${article.title}`);
            return {
              content: enhancedContent,
              mode: 'grok'
            };
          }
        }
      } catch (error) {
        console.log(`⚠️ Grok failed for ${article.title}, trying Perplexity...`);
        logError(createAppError('Grok enhancement failed', 500, ErrorCategory.EXTERNAL_API), 'Leadership content enhancement');
      }
    }

    // Try Perplexity as fallback
    if (process.env.PERPLEXITY_API_KEY) {
      try {
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`
          },
          body: JSON.stringify({
            model: 'llama-3.1-sonar-small-128k-online',
            messages: [
              {
                role: 'system',
                content: 'You are an expert automotive industry writer creating engaging, SEO-optimized content for the Indian market. Write in a vivid, storytelling style.'
              },
              {
                role: 'user',
                content: `Write an engaging 500-word article about this automotive leadership news in India:

Title: ${article.title}
Summary: ${article.content}
${leaderName ? `Leader: ${leaderName}` : ''}
${companyName ? `Company: ${companyName}` : ''}
${position ? `Position: ${position}` : ''}

Requirements:
- Start with vivid storytelling
- Include keywords like "Indian auto leaders 2025", "automotive CEO India"
- Add industry context and market implications
- Use conversational, engaging tone
- Focus on business impact`
              }
            ],
            temperature: 0.7,
            max_tokens: 800
          })
        });

        if (response.ok) {
          const data = await response.json();
          const enhancedContent = data.choices?.[0]?.message?.content || '';
          
          if (enhancedContent) {
            console.log(`✅ Enhanced leadership article with Perplexity: ${article.title}`);
            return {
              content: enhancedContent,
              mode: 'perplexity'
            };
          }
        }
      } catch (error) {
        console.log(`⚠️ Perplexity failed for ${article.title}, using fallback`);
        logError(createAppError('Perplexity enhancement failed', 500, ErrorCategory.EXTERNAL_API), 'Leadership content enhancement');
      }
    }

    // Use basic fallback
    console.log(`ℹ️ Using basic fallback for ${article.title}`);
    return {
      content: this.generateFallbackEnhancement(article, leaderName, companyName, position),
      mode: 'fallback'
    };
  }

  /**
   * Generate fallback enhancement if AI is unavailable
   */
  private generateFallbackEnhancement(
    article: LeadershipArticle, 
    leaderName?: string, 
    companyName?: string, 
    position?: string
  ): string {
    const leader = leaderName || 'a seasoned automotive executive';
    const company = companyName || 'a leading automotive company';
    
    return `Picture ${leader} steering ${company} into a new era of automotive excellence in India. ${article.content}

This leadership transition comes at a pivotal time for India's automotive industry, as the sector navigates the dual challenges of electrification and evolving consumer preferences. ${position ? `As ${position}, ` : ''}${leader} brings deep industry expertise to drive growth and innovation.

India's automotive landscape is rapidly evolving, with leadership playing a crucial role in shaping the future of mobility. This appointment signals ${company}'s commitment to strengthening its position in one of the world's fastest-growing automotive markets.

For car buyers and industry watchers on CarArth, this leadership change could signal new product launches, strategic shifts, and enhanced customer experiences in the coming months.`;
  }

  /**
   * Process and enhance leadership articles
   */
  async processLeadershipArticles(posts: CommunityPost[]): Promise<LeadershipArticle[]> {
    const leadershipArticles = this.filterLeadershipArticles(posts);
    const enhancedArticles: LeadershipArticle[] = [];

    for (const article of leadershipArticles) {
      try {
        const [enhancementResult, schemaMarkup, internalLinks] = await Promise.all([
          this.enhanceWithAI(article),
          Promise.resolve(this.generateSchemaMarkup(article)),
          Promise.resolve(this.generateInternalLinks(article))
        ]);

        const { leaderName, companyName, position } = this.extractLeadershipInfo(article);

        enhancedArticles.push({
          ...article,
          enhancedContent: enhancementResult.content,
          enhancementMode: enhancementResult.mode,
          schemaMarkup,
          internalLinks,
          leaderName,
          companyName,
          position
        });

      } catch (error) {
        console.log(`⚠️ Failed to process leadership article: ${article.title}`);
        logError(createAppError('Failed to process leadership article', 500, ErrorCategory.INTERNAL), `Leadership processing: ${article.title}`);
        // Include original article without enhancements
        enhancedArticles.push(article);
      }
    }

    return enhancedArticles;
  }
}

export const leadershipContentService = new LeadershipContentService();
