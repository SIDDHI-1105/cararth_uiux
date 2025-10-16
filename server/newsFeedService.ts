import { db } from './db.js';
import { communityPosts, users } from '../shared/schema.js';
import { desc, eq } from 'drizzle-orm';

interface RSSItem {
  title: string;
  description: string;
  link: string;
  pubDate: Date;
  author: string;
  category: string;
  guid: string;
}

export class NewsFeedService {
  /**
   * Generate RSS 2.0 feed for Throttle Talk articles
   * Compatible with Zapier, IFTTT, Buffer, and other automation tools
   */
  async generateRSSFeed(): Promise<string> {
    try {
      const posts = await db
        .select({
          id: communityPosts.id,
          title: communityPosts.title,
          content: communityPosts.content,
          category: communityPosts.category,
          createdAt: communityPosts.createdAt,
          author: users.firstName,
        })
        .from(communityPosts)
        .leftJoin(users, eq(communityPosts.authorId, users.id))
        .orderBy(desc(communityPosts.createdAt))
        .limit(50);

      const rssItems: RSSItem[] = posts.map(post => ({
        title: this.escapeXml(post.title || 'Untitled Post'),
        description: this.escapeXml(this.truncateDescription(post.content || '')),
        link: `https://cararth.com/news/${post.id}`,
        pubDate: new Date(post.createdAt || Date.now()),
        author: this.escapeXml(post.author || 'CarArth Community'),
        category: this.escapeXml(post.category || 'General'),
        guid: `cararth-news-${post.id}`,
      }));

      return this.buildRSSXML(rssItems);
    } catch (error) {
      console.error('❌ RSS feed generation error:', error);
      return this.buildEmptyRSSFeed();
    }
  }

  /**
   * Build RSS 2.0 XML structure
   */
  private buildRSSXML(items: RSSItem[]): string {
    const itemsXML = items.map(item => `
    <item>
      <title>${item.title}</title>
      <description>${item.description}</description>
      <link>${item.link}</link>
      <pubDate>${item.pubDate.toUTCString()}</pubDate>
      <author>${item.author}</author>
      <category>${item.category}</category>
      <guid isPermaLink="false">${item.guid}</guid>
    </item>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Throttle Talk - CarArth Automotive News</title>
    <link>https://cararth.com/news</link>
    <description>India's automotive community discussing used cars, market trends, and industry insights. Cararth.com is a unit of Aaro7 Fintech Private Limited.</description>
    <language>en-IN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://cararth.com/feed/news.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>https://cararth.com/cararth-logo.png</url>
      <title>Throttle Talk - CarArth</title>
      <link>https://cararth.com/news</link>
    </image>
${itemsXML}
  </channel>
</rss>`;
  }

  /**
   * Build empty RSS feed when no posts available
   */
  private buildEmptyRSSFeed(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Throttle Talk - CarArth Automotive News</title>
    <link>https://cararth.com/news</link>
    <description>India's automotive community news and insights</description>
    <language>en-IN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  </channel>
</rss>`;
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Truncate description to 300 characters for RSS readers
   */
  private truncateDescription(content: string): string {
    const cleaned = content.replace(/<[^>]*>/g, '').trim();
    return cleaned.length > 300 
      ? cleaned.substring(0, 297) + '...' 
      : cleaned;
  }
}

export const newsFeedService = new NewsFeedService();
