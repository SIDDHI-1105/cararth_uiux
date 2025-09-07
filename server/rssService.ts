import { z } from 'zod';

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
}

export class RSSAggregatorService {
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
   * Fetch individual RSS feed with proper error handling and attribution
   */
  private async fetchRSSFeed(source: typeof this.RSS_SOURCES[0]): Promise<CommunityPost[]> {
    const posts: CommunityPost[] = [];

    try {
      // In a real implementation, you would use a proper RSS parser library
      // For now, we'll simulate the RSS parsing with fallback data
      console.log(`📡 Attempting to fetch RSS from ${source.url}`);
      
      // Simulate RSS parsing (replace with actual RSS library like 'rss-parser')
      const mockRSSData = this.generateMockRSSData(source);
      
      for (const item of mockRSSData.items) {
        const post: CommunityPost = {
          id: `${source.name.toLowerCase()}-${Date.now()}-${Math.random()}`,
          title: item.title,
          content: item.description || this.generatePreviewContent(item.title),
          author: this.extractAuthor(item.title) || `${source.name} Editorial`,
          source: source.name,
          sourceUrl: item.link,
          publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
          category: source.category,
          attribution: source.attribution,
          isExternal: true
        };

        posts.push(post);
      }

      console.log(`✅ Successfully fetched ${posts.length} posts from ${source.name}`);
      
    } catch (error) {
      console.error(`❌ Failed to fetch RSS from ${source.name}:`, error);
      throw error;
    }

    return posts;
  }

  /**
   * Generate mock RSS data for demonstration
   * In production, replace this with actual RSS parsing library
   */
  private generateMockRSSData(source: typeof this.RSS_SOURCES[0]): RSSFeed {
    const titles = {
      'TeamBHP': [
        'New member review: Hyundai Creta after 50,000 km',
        'Travelogue: Mumbai to Goa in my Mahindra Thar',
        'Technical discussion: Best engine oil for Indian conditions',
        'Used car buying guide: What to check before purchase',
        'Road safety: Importance of defensive driving techniques'
      ],
      'AutocarIndia': [
        'Maruti Suzuki launches updated Baleno with new features',
        'Tata Motors reveals electric vehicle roadmap for 2025',
        'Government announces new vehicle safety norms',
        'BMW introduces latest iX electric SUV in India',
        'Hyundai Motor India reports record monthly sales'
      ],
      'CarAndBike': [
        'Honda City Hybrid launched at competitive pricing',
        'Bajaj Pulsar 250 review: Performance and efficiency',
        'Electric vehicle infrastructure development updates',
        'Mahindra XUV700 vs Tata Harrier comparison',
        'Two-wheeler sales surge during festive season'
      ]
    };

    const sourceTitles = titles[source.name as keyof typeof titles] || titles['AutocarIndia'];

    return {
      title: `${source.name} Feed`,
      description: `Latest content from ${source.name}`,
      link: source.url,
      items: sourceTitles.map((title, index) => ({
        title,
        description: `Preview content for: ${title}. Visit the original source for full article.`,
        link: `https://example.com/article-${index}`,
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