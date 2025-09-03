import PerplexityService from './perplexityService';

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
  status: 'draft' | 'pending_approval' | 'approved' | 'published' | 'shared';
  approvedBy?: string;
  approvedAt?: string;
  socialMediaShared?: boolean;
  shareLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    whatsapp?: string;
  };
}

interface SocialMediaPost {
  platform: 'linkedin' | 'twitter' | 'facebook' | 'whatsapp';
  content: string;
  articleUrl: string;
  hashtags: string[];
  scheduledFor?: string;
}

class BlogService {
  private perplexityService: PerplexityService;
  private articles: Map<string, BlogArticle> = new Map();

  constructor() {
    this.perplexityService = new PerplexityService();
    this.initializeSampleArticles();
  }

  private initializeSampleArticles() {
    // Add some sample articles for demo
    const sampleArticles: BlogArticle[] = [
      {
        id: 'sample-1',
        title: 'Top 5 Pre-owned Cars Under ₹5 Lakhs in India 2024',
        content: `The Indian pre-owned car market has witnessed significant growth, offering excellent opportunities for budget-conscious buyers...`,
        excerpt: 'Discover the best value-for-money pre-owned cars under ₹5 lakhs that offer reliability, fuel efficiency, and low maintenance costs.',
        category: 'buying-guides',
        tags: ['#themobilityhub', '#preownedcars', '#budget', '#india'],
        author: 'The Mobility Hub Editorial Team',
        publishedAt: new Date().toISOString(),
        readTime: 8,
        sources: [],
        status: 'published',
        socialMediaShared: true
      }
    ];

    sampleArticles.forEach(article => {
      this.articles.set(article.id, article);
    });
  }

  async generateArticle(topic: string, category: string = 'automotive'): Promise<BlogArticle> {
    const baseArticle = await this.perplexityService.generateArticle(topic, category);
    
    const article: BlogArticle = {
      ...baseArticle,
      status: 'pending_approval', // All new articles need approval
      socialMediaShared: false
    };

    this.articles.set(article.id, article);
    return article;
  }

  async getTrendingTopics(): Promise<string[]> {
    return this.perplexityService.getTrendingTopics();
  }

  getAllArticles(): BlogArticle[] {
    return Array.from(this.articles.values()).sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  }

  getArticleById(id: string): BlogArticle | undefined {
    return this.articles.get(id);
  }

  getPendingApprovalArticles(): BlogArticle[] {
    return this.getAllArticles().filter(article => article.status === 'pending_approval');
  }

  approveArticle(articleId: string, approverName: string): BlogArticle | null {
    const article = this.articles.get(articleId);
    if (!article) return null;

    article.status = 'approved';
    article.approvedBy = approverName;
    article.approvedAt = new Date().toISOString();

    this.articles.set(articleId, article);
    return article;
  }

  publishArticle(articleId: string): BlogArticle | null {
    const article = this.articles.get(articleId);
    if (!article || article.status !== 'approved') return null;

    article.status = 'published';
    this.articles.set(articleId, article);
    return article;
  }

  async shareToSocialMedia(articleId: string): Promise<BlogArticle | null> {
    const article = this.articles.get(articleId);
    if (!article || article.status !== 'published') return null;

    // Generate social media posts
    const posts = this.generateSocialMediaPosts(article);
    
    // In a real app, you would call actual social media APIs here
    // For now, we'll simulate the sharing process
    
    const shareLinks = {
      linkedin: `https://linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://themobilityhub.in/blog/${article.id}`)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(posts.twitter.content)}&url=${encodeURIComponent(`https://themobilityhub.in/blog/${article.id}`)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://themobilityhub.in/blog/${article.id}`)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${posts.whatsapp.content} https://themobilityhub.in/blog/${article.id}`)}`
    };

    article.status = 'shared';
    article.socialMediaShared = true;
    article.shareLinks = shareLinks;

    this.articles.set(articleId, article);
    return article;
  }

  private generateSocialMediaPosts(article: BlogArticle): Record<string, SocialMediaPost> {
    const baseUrl = 'https://themobilityhub.in/blog/' + article.id;
    const hashtags = ['#themobilityhub', '#preownedcars', '#automotiveindia'];

    return {
      linkedin: {
        platform: 'linkedin',
        content: `🚗 ${article.title}\n\n${article.excerpt}\n\nRead the full insights on The Mobility Hub. Perfect for anyone looking to make smart car buying decisions in India.`,
        articleUrl: baseUrl,
        hashtags
      },
      twitter: {
        platform: 'twitter',
        content: `🚗 ${article.title.substring(0, 180)}\n\n${hashtags.join(' ')}`,
        articleUrl: baseUrl,
        hashtags
      },
      facebook: {
        platform: 'facebook',
        content: `${article.title}\n\n${article.excerpt}\n\nStay informed about the latest automotive trends and make better car buying decisions with The Mobility Hub.`,
        articleUrl: baseUrl,
        hashtags
      },
      whatsapp: {
        platform: 'whatsapp',
        content: `🚗 *${article.title}*\n\n${article.excerpt}\n\nCheck out the latest automotive insights:`,
        articleUrl: baseUrl,
        hashtags
      }
    };
  }

  async refreshContent(): Promise<BlogArticle[]> {
    const topics = await this.getTrendingTopics();
    const newArticles: BlogArticle[] = [];

    // Generate 2-3 new articles from trending topics
    const selectedTopics = topics.slice(0, 3);
    
    for (const topic of selectedTopics) {
      try {
        const article = await this.generateArticle(topic);
        newArticles.push(article);
        
        // Add delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        console.error(`Failed to generate article for topic: ${topic}`, error);
      }
    }

    return newArticles;
  }

  getArticlesByStatus(status: BlogArticle['status']): BlogArticle[] {
    return this.getAllArticles().filter(article => article.status === status);
  }

  updateArticle(articleId: string, updates: Partial<BlogArticle>): BlogArticle | null {
    const article = this.articles.get(articleId);
    if (!article) return null;

    const updatedArticle = { ...article, ...updates };
    this.articles.set(articleId, updatedArticle);
    return updatedArticle;
  }

  deleteArticle(articleId: string): boolean {
    return this.articles.delete(articleId);
  }

  getAnalytics() {
    const articles = this.getAllArticles();
    return {
      total: articles.length,
      published: articles.filter(a => a.status === 'published').length,
      pending: articles.filter(a => a.status === 'pending_approval').length,
      shared: articles.filter(a => a.socialMediaShared).length,
      categories: this.getCategoryStats(articles),
      recentActivity: articles.slice(0, 5)
    };
  }

  private getCategoryStats(articles: BlogArticle[]) {
    const stats: Record<string, number> = {};
    articles.forEach(article => {
      stats[article.category] = (stats[article.category] || 0) + 1;
    });
    return stats;
  }
}

export default BlogService;