interface PerplexityResponse {
  id: string;
  model: string;
  object: string;
  created: number;
  citations: string[];
  choices: Array<{
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
    delta: {
      role: string;
      content: string;
    };
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface BlogArticle {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string[];
  author: string;
  publishedAt: string;
  readTime: number;
  sources: string[];
  image?: string;
}

import { aiDatabaseCache } from './aiDatabaseCache.js';

class PerplexityService {
  private apiKey: string;
  private baseUrl = 'https://api.perplexity.ai/chat/completions';

  constructor() {
    this.apiKey = process.env.PERPLEXITY_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('PERPLEXITY_API_KEY is required');
    }
  }

  async generateArticle(topic: string, category: string = 'automotive'): Promise<BlogArticle> {
    const prompt = `Write a comprehensive, engaging article about ${topic} in the Indian automotive market. 

Requirements:
- Focus on practical insights for car buyers and sellers
- Include current market trends and data
- Make it relevant to Indian consumers
- Add actionable advice
- Write in a professional yet accessible tone
- Include specific examples and real-world scenarios
- End with key takeaways

Structure the article with:
1. Compelling headline
2. Brief introduction (2-3 sentences)
3. Main content with subheadings
4. Practical tips or advice
5. Conclusion with key insights

Include relevant hashtags like #cararth #automotiveindia #preownedcars

Target length: 800-1200 words.`;

    try {
      // Create cache key for cost savings
      const messages = [
        {
          role: 'system',
          content: 'You are an expert automotive journalist specializing in the Indian car market. Write informative, engaging articles that help consumers make better car buying and selling decisions.'
        },
        {
          role: 'user',
          content: prompt
        }
      ];
      const cacheKey = JSON.stringify({ messages, topic, category });
      const requestParams = {
        model: 'sonar-pro',
        messages,
        max_tokens: 2000,
        temperature: 0.7,
        top_p: 0.9,
        search_recency_filter: 'month',
        return_images: false,
        return_related_questions: false,
        stream: false
      };

      // Check AI cache first for cost savings
      const cacheResult = await aiDatabaseCache.get(cacheKey, {
        model: 'sonar-pro',
        provider: 'perplexity',
        estimatedCost: 0.05 // Estimated cost per request
      }, requestParams);

      if (cacheResult.hit) {
        console.log(`💾 AI Cache HIT: Saved $${cacheResult.costSaved} on Perplexity API call`);
        return cacheResult.response;
      }

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestParams)
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
      }

      const data: PerplexityResponse = await response.json();
      const content = data.choices[0]?.message?.content || '';
      
      // Extract title from content (first line or heading)
      const lines = content.split('\n');
      const title = lines.find(line => line.trim().length > 0)?.replace(/^#+\s*/, '') || `${topic} - Automotive Insights`;
      
      // Generate excerpt (first paragraph)
      const paragraphs = content.split('\n\n');
      const excerpt = paragraphs.find(p => p.trim().length > 50)?.substring(0, 200) + '...' || '';
      
      // Estimate read time (average 200 words per minute)
      const wordCount = content.split(' ').length;
      const readTime = Math.ceil(wordCount / 200);

      // Generate category-specific image
      const categoryImages = {
        'buying-guides': '/api/placeholder/buying-guide-image',
        'market-trends': '/api/placeholder/market-trend-image', 
        'technology': '/api/placeholder/tech-image',
        'policy': '/api/placeholder/policy-image',
        'automotive': '/api/placeholder/automotive-hero-image'
      };

      const blogArticle = {
        id: `article-${Date.now()}`,
        title: title.substring(0, 100),
        content,
        excerpt,
        category,
        tags: ['#cararth', '#automotiveindia', '#preownedcars', '#carmarket'],
        author: 'CarArth Team',
        publishedAt: new Date().toISOString(),
        readTime,
        sources: data.citations || [],
        image: categoryImages[category as keyof typeof categoryImages] || categoryImages['automotive']
      };

    } catch (error) {
      console.error('Error generating article:', error);
      throw new Error('Failed to generate article content');
    }
  }

  async generateMultipleArticles(topics: string[], category: string = 'automotive'): Promise<BlogArticle[]> {
    const articles: BlogArticle[] = [];
    
    for (const topic of topics) {
      try {
        const article = await this.generateArticle(topic, category);
        articles.push(article);
        
        // Add delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Failed to generate article for topic: ${topic}`, error);
      }
    }
    
    return articles;
  }

  async getTrendingTopics(): Promise<string[]> {
    const prompt = `What are the top 10 trending topics in the Indian automotive industry right now? Focus on:
    - Pre-owned car market trends
    - New car launches affecting resale values
    - Electric vehicle adoption
    - Fuel price impacts
    - Government policies affecting cars
    - Popular car brands and models
    - Financing and insurance trends
    - Technology in cars
    
    Return only a simple numbered list of specific, actionable topics that would interest car buyers and sellers in India.`;

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sonar-pro',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.5,
          search_recency_filter: 'week',
          stream: false
        })
      });

      const data: PerplexityResponse = await response.json();
      const content = data.choices[0]?.message?.content || '';
      
      // Extract topics from numbered list
      const topics = content
        .split('\n')
        .filter(line => /^\d+\./.test(line.trim()))
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(topic => topic.length > 10);

      return topics.slice(0, 10);
    } catch (error) {
      console.error('Error getting trending topics:', error);
      return [
        'Best Pre-owned Cars Under 5 Lakhs in India 2024',
        'Electric Vehicle Resale Value Analysis',
        'Impact of New Car Launches on Used Car Prices',
        'Fuel Efficiency vs Maintenance Cost Comparison',
        'Car Insurance Tips for Pre-owned Vehicles'
      ];
    }
  }
}

export default PerplexityService;