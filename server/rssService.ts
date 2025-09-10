import { z } from 'zod';
import Parser from 'rss-parser';
import { PerplexityService } from './perplexityService';

// RSS Feed Item Schema for validation
const RSSItemSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  link: z.string().url(),
  pubDate: z.string().optional(),
  category: z.string().optional(),
  guid: z.string().optional(),
});

const RSSFeedSchema = z.object({
  title: z.string(),
  description: z.string(),
  link: z.string().url(),
  items: z.array(RSSItemSchema),
});

export type RSSItem = z.infer<typeof RSSItemSchema>;
export type RSSFeed = z.infer<typeof RSSFeedSchema>;

export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  author: string;
  source: string;
  sourceUrl: string;
  publishedAt: Date;
  category: string;
  attribution: string;
  isExternal: boolean;
  coverImage?: string;
}

export class RSSAggregatorService {
  private parser: Parser;
  private perplexityService: PerplexityService;

  constructor() {
    this.parser = new Parser();
    this.perplexityService = new PerplexityService();
  }

  private readonly RSS_SOURCES = [
    {
      name: 'TeamBHP',
      url: 'https://www.team-bhp.com/forum/external.php?type=RSS2',
      category: 'Community Discussions',
      attribution: 'Content sourced from Team-BHP - The Definitive Indian Car Community'
    },
    {
      name: 'AutocarIndia',
      url: 'https://www.autocarindia.com/rss/all-news.xml',
      category: 'Industry News',
      attribution: 'Content sourced from Autocar India'
    },
    {
      name: 'CarAndBike',
      url: 'https://www.carandbike.com/rss/news.xml',
      category: 'Automotive News',
      attribution: 'Content sourced from CarAndBike'
    }
  ];

  /**
   * Fetch and parse RSS feeds from automotive sources
   * Implements legal content aggregation with proper attribution
   */
  async aggregateAutomotiveContent(): Promise<CommunityPost[]> {
    const allPosts: CommunityPost[] = [];

    for (const source of this.RSS_SOURCES) {
      try {
        console.log(`🔍 Fetching RSS feed from ${source.name}...`);
        const posts = await this.fetchRSSFeed(source);
        allPosts.push(...posts);
      } catch (error) {
        console.error(`⚠️ Error fetching RSS from ${source.name}:`, error);
        // Continue with other sources even if one fails
      }
    }

    // Sort by publish date (most recent first)
    return allPosts.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  }

  /**
   * Fetch individual RSS feed with real RSS parsing and Perplexity fallback for 404s
   */
  private async fetchRSSFeed(source: typeof this.RSS_SOURCES[0]): Promise<CommunityPost[]> {
    try {
      console.log(`📡 Fetching authentic RSS feed from ${source.url}`);
      
      // Parse real RSS feed using rss-parser
      const feed = await this.parser.parseURL(source.url);
      
      const posts: CommunityPost[] = feed.items.slice(0, 10).map(item => ({
        id: item.guid || `${source.name.toLowerCase()}-${Date.now()}-${Math.random()}`,
        title: item.title || 'Untitled Article',
        content: item.contentSnippet || item.content || item.summary || this.generatePreviewContent(item.title || 'Article'),
        author: item.creator || item.author || `${source.name} Editorial`,
        source: source.name,
        sourceUrl: item.link || source.url, // Real working URL from RSS feed
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
        category: source.category,
        attribution: source.attribution,
        isExternal: true,
        coverImage: this.generateCoverImage(item.title || 'Article', source.category)
      }));

      console.log(`✅ Successfully fetched ${posts.length} authentic articles from ${source.name}`);
      return posts;
      
    } catch (error: any) {
      console.error(`❌ RSS fetch failed for ${source.name}:`, error.message);
      
      // Use Perplexity fallback only for 404 or network errors
      if (error.code === 'ENOTFOUND' || error.status === 404 || error.message.includes('404')) {
        console.log(`🔄 RSS 404 detected for ${source.name}, using Perplexity fallback...`);
        return await this.perplexityFallback(source);
      }
      
      // For other errors, return empty array to continue with other sources
      return [];
    }
  }

  /**
   * Generate mock RSS data for demonstration
   * In production, replace this with actual RSS parsing library
   */
  private generateMockRSSData(source: typeof this.RSS_SOURCES[0]): RSSFeed {
    const articlesData = {
      'TeamBHP': [
        {
          title: 'New member review: Hyundai Creta after 50,000 km',
          url: 'https://www.team-bhp.com/forum/official-new-car-reviews/234567-hyundai-creta-ownership-review-50000-km.html'
        },
        {
          title: 'Travelogue: Mumbai to Goa in my Mahindra Thar',
          url: 'https://www.team-bhp.com/forum/travelogues/234568-mumbai-goa-mahindra-thar-adventure.html'
        },
        {
          title: 'Technical discussion: Best engine oil for Indian conditions',
          url: 'https://www.team-bhp.com/forum/technical-stuff/234569-best-engine-oil-indian-driving-conditions.html'
        },
        {
          title: 'Used car buying guide: What to check before purchase',
          url: 'https://www.team-bhp.com/forum/car-care/234570-used-car-buying-guide-complete-checklist.html'
        },
        {
          title: 'Road safety: Importance of defensive driving techniques',
          url: 'https://www.team-bhp.com/forum/road-safety/234571-defensive-driving-techniques-indian-roads.html'
        }
      ],
      'AutocarIndia': [
        {
          title: 'Maruti Suzuki launches updated Baleno with new features',
          url: 'https://www.autocarindia.com/car-news/maruti-suzuki-baleno-updated-new-features-launched-423456.aspx'
        },
        {
          title: 'Tata Motors reveals electric vehicle roadmap for 2025',
          url: 'https://www.autocarindia.com/car-news/tata-motors-electric-vehicle-roadmap-2025-announced-423457.aspx'
        },
        {
          title: 'Government announces new vehicle safety norms',
          url: 'https://www.autocarindia.com/car-news/government-announces-new-vehicle-safety-norms-india-423458.aspx'
        },
        {
          title: 'BMW introduces latest iX electric SUV in India',
          url: 'https://www.autocarindia.com/car-news/bmw-ix-electric-suv-launched-india-pricing-features-423459.aspx'
        },
        {
          title: 'Hyundai Motor India reports record monthly sales',
          url: 'https://www.autocarindia.com/car-news/hyundai-motor-india-record-monthly-sales-figures-423460.aspx'
        }
      ],
      'CarAndBike': [
        {
          title: 'Honda City Hybrid launched at competitive pricing',
          url: 'https://www.carandbike.com/news/honda-city-hybrid-launched-india-competitive-pricing-2734567'
        },
        {
          title: 'Bajaj Pulsar 250 review: Performance and efficiency',
          url: 'https://www.carandbike.com/reviews/bajaj-pulsar-250-review-performance-efficiency-detailed-2734568'
        },
        {
          title: 'Electric vehicle infrastructure development updates',
          url: 'https://www.carandbike.com/news/electric-vehicle-infrastructure-development-updates-india-2734569'
        },
        {
          title: 'Mahindra XUV700 vs Tata Harrier comparison',
          url: 'https://www.carandbike.com/reviews/mahindra-xuv700-vs-tata-harrier-detailed-comparison-2734570'
        },
        {
          title: 'Two-wheeler sales surge during festive season',
          url: 'https://www.carandbike.com/news/two-wheeler-sales-surge-festive-season-india-2734571'
        }
      ]
    };

    const sourceArticles = articlesData[source.name as keyof typeof articlesData] || articlesData['AutocarIndia'];

    return {
      title: `${source.name} Feed`,
      description: `Latest content from ${source.name}`,
      link: source.url,
      items: sourceArticles.map((article, index) => ({
        title: article.title,
        description: `Preview content for: ${article.title}. Visit the original source for full article.`,
        link: article.url,
        pubDate: new Date(Date.now() - (index * 3600000)).toISOString(), // Staggered times
        category: source.category,
        guid: `${source.name}-${index}-${Date.now()}`
      }))
    };
  }

  /**
   * Extract author from article title if mentioned
   */
  private extractAuthor(title: string): string | null {
    // Look for patterns like "by AuthorName" or "- AuthorName"
    const byPattern = /by\s+([A-Za-z\s]+)$/i;
    const dashPattern = /-\s+([A-Za-z\s]+)$/;
    
    const byMatch = title.match(byPattern);
    if (byMatch) return byMatch[1].trim();
    
    const dashMatch = title.match(dashPattern);
    if (dashMatch) return dashMatch[1].trim();
    
    return null;
  }

  /**
   * Generate preview content from title for better engagement
   */
  private generatePreviewContent(title: string): string {
    const templates = [
      `Join the discussion about ${title.toLowerCase()}. Community members share their experiences and insights.`,
      `Latest update: ${title}. Read the full article and participate in community discussions.`,
      `Community spotlight: ${title}. Share your thoughts and experiences with fellow automotive enthusiasts.`,
      `Breaking: ${title}. Stay updated with the latest developments in the automotive industry.`
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Perplexity fallback for when RSS feeds return 404 or are unavailable
   */
  private async perplexityFallback(source: typeof this.RSS_SOURCES[0]): Promise<CommunityPost[]> {
    try {
      console.log(`🧠 Using Perplexity fallback for ${source.name}...`);
      
      // Get trending topics from Perplexity
      const topics = await this.perplexityService.getTrendingTopics();
      
      // Generate posts using trending topics
      return topics.slice(0, 3).map((topic, index) => ({
        id: `perplexity-${source.name.toLowerCase()}-${Date.now()}-${index}`,
        title: topic,
        content: `Latest insights on: ${topic}. Stay updated with trending automotive discussions and market developments.`,
        author: 'AI Editorial Team',
        source: source.name,
        sourceUrl: `#article-${Date.now()}-${index}`, // Internal link for AI content
        publishedAt: new Date(Date.now() - (index * 3600000)), // Staggered times
        category: source.category,
        attribution: `${source.attribution} - Content generated via AI when RSS unavailable`,
        isExternal: false,
        coverImage: this.generateCoverImage(topic, source.category)
      }));
      
    } catch (error) {
      console.error(`❌ Perplexity fallback failed for ${source.name}:`, error);
      return [];
    }
  }

  /**
   * Generate compelling cover images for articles based on title and category
   */
  private generateCoverImage(title: string, category: string): string {
    // Create base64 SVG cover images for different categories
    const colors = {
      'Community Discussions': { primary: '#8B5CF6', secondary: '#06B6D4', accent: '#F59E0B' },
      'Industry News': { primary: '#EF4444', secondary: '#10B981', accent: '#F59E0B' },
      'Automotive News': { primary: '#3B82F6', secondary: '#8B5CF6', accent: '#06B6D4' }
    };

    const color = colors[category as keyof typeof colors] || colors['Automotive News'];
    const icon = this.getCategoryIcon(category);
    const displayTitle = title.length > 60 ? title.substring(0, 57) + '...' : title;

    const svg = `
      <svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${color.primary};stop-opacity:1" />
            <stop offset="50%" style="stop-color:${color.secondary};stop-opacity:0.9" />
            <stop offset="100%" style="stop-color:${color.accent};stop-opacity:0.8" />
          </linearGradient>
          <filter id="shadow">
            <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.3"/>
          </filter>
        </defs>
        
        <!-- Background -->
        <rect width="400" height="200" fill="url(#bgGrad)" rx="12"/>
        
        <!-- Overlay pattern -->
        <pattern id="dots" patternUnits="userSpaceOnUse" width="20" height="20">
          <circle cx="10" cy="10" r="1" fill="white" opacity="0.1"/>
        </pattern>
        <rect width="400" height="200" fill="url(#dots)"/>
        
        <!-- Category badge -->
        <rect x="20" y="20" width="auto" height="24" fill="rgba(255,255,255,0.2)" rx="12"/>
        <text x="32" y="36" font-family="Inter, sans-serif" font-size="11" font-weight="600" fill="white">${category.toUpperCase()}</text>
        
        <!-- Main title -->
        <foreignObject x="20" y="60" width="360" height="100">
          <div xmlns="http://www.w3.org/1999/xhtml" style="color: white; font-family: Inter, sans-serif; font-size: 18px; font-weight: 700; line-height: 1.3; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
            ${displayTitle}
          </div>
        </foreignObject>
        
        <!-- Icon -->
        <g transform="translate(340, 160)" fill="white" opacity="0.8">
          ${icon}
        </g>
        
        <!-- Bottom accent -->
        <rect x="0" y="180" width="400" height="20" fill="rgba(0,0,0,0.1)" rx="0 0 12 12"/>
        <text x="20" y="194" font-family="Inter, sans-serif" font-size="10" font-weight="500" fill="white" opacity="0.8">The Mobility Hub</text>
      </svg>
    `;

    // Convert SVG to data URL
    const base64 = btoa(unescape(encodeURIComponent(svg)));
    return `data:image/svg+xml;base64,${base64}`;
  }

  /**
   * Get category-specific icon SVG
   */
  private getCategoryIcon(category: string): string {
    const icons = {
      'Community Discussions': '<path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" stroke="currentColor" stroke-width="2" fill="none"/>',
      'Industry News': '<path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2m-13-3L6 7l-4 4v9a2 2 0 002 2h14a2 2 0 002-2v-9.5z" stroke="currentColor" stroke-width="2" fill="none"/>',
      'Automotive News': '<path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v0zM3 7l7 4 7-4" stroke="currentColor" stroke-width="2" fill="none"/>'
    };
    return icons[category as keyof typeof icons] || icons['Automotive News'];
  }

  /**
   * Get community statistics for dashboard
   */
  async getCommunityStats() {
    // In real implementation, fetch from database
    return {
      totalPosts: 15847,
      activeMembersToday: 3421,
      discussionsToday: 156,
      sourceFeeds: this.RSS_SOURCES.length,
      lastUpdate: new Date()
    };
  }

  /**
   * Validate RSS feed structure
   */
  private validateRSSFeed(data: any): RSSFeed {
    try {
      return RSSFeedSchema.parse(data);
    } catch (error) {
      console.error('RSS validation error:', error);
      throw new Error('Invalid RSS feed structure');
    }
  }
}

export const rssAggregator = new RSSAggregatorService();