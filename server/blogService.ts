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
    // Add some sample articles for demo with enhanced visual content
    const sampleArticles: BlogArticle[] = [
      {
        id: 'sample-1',
        title: 'Top 5 Pre-owned Cars Under ₹5 Lakhs in India 2024',
        content: `# Top 5 Pre-owned Cars Under ₹5 Lakhs in India 2024

The Indian pre-owned car market has witnessed significant growth, offering excellent opportunities for budget-conscious buyers. Here's our comprehensive guide to the best value-for-money vehicles.

## 🚗 1. Maruti Suzuki Alto 800 (2018-2020)
**Price Range**: ₹3.2 - ₹4.8 Lakhs
- **Fuel Efficiency**: 22-24 kmpl
- **Maintenance**: Very affordable parts and service
- **Best For**: First-time buyers and city driving

## 🏎️ 2. Hyundai Grand i10 (2017-2019) 
**Price Range**: ₹4.0 - ₹4.9 Lakhs
- **Features**: Touchscreen infotainment, automatic climate control
- **Engine**: Reliable 1.2L Kappa petrol engine
- **Best For**: Families seeking comfort and features

## 🚙 3. Tata Tiago (2018-2020)
**Price Range**: ₹3.8 - ₹4.7 Lakhs
- **Safety**: 4-star NCAP rating
- **Design**: Contemporary styling with spacious interior
- **Best For**: Safety-conscious buyers

## 💰 Key Buying Tips:
- Always check vehicle history and service records
- Inspect for rust, accident damage, and engine condition
- Verify ownership documents and NOC status
- Consider certified pre-owned programs from dealers
- Factor in insurance, registration, and immediate repair costs

## 📊 Market Insights:
The pre-owned car segment has grown by 15% in 2024, with increasing demand for well-maintained vehicles under ₹5 lakhs. Financing options have become more accessible, with banks offering up to 85% funding for cars up to 5 years old.

**Final Verdict**: These vehicles offer the perfect balance of affordability, reliability, and features for budget-conscious Indian buyers.`,
        excerpt: 'Discover the best value-for-money pre-owned cars under ₹5 lakhs that offer reliability, fuel efficiency, and low maintenance costs. Complete with buying tips and market insights.',
        category: 'buying-guides',
        tags: ['#cararth', '#preownedcars', '#budget', '#india'],
        author: 'CarArth Team',
        publishedAt: new Date().toISOString(),
        readTime: 8,
        sources: [],
        status: 'published',
        socialMediaShared: true
      },
      {
        id: 'sample-2',
        title: 'Electric Vehicle Revolution: Impact on Pre-owned Car Values',
        content: `# Electric Vehicle Revolution: Impact on Pre-owned Car Values

## 📈 The EV Shift and Market Dynamics

The rapid adoption of electric vehicles is reshaping the automotive landscape, creating both opportunities and challenges in the pre-owned car market.

### Key Market Changes:
- **Petrol Car Depreciation**: Accelerated due to EV adoption
- **Hybrid Premium**: Used hybrids now command higher prices
- **ICE Longevity**: Well-maintained petrol cars still valuable for budget buyers

### Smart Investment Tips:
1. **Consider Total Cost of Ownership** - Factor in fuel savings vs. maintenance
2. **Research Brand Reliability** - Some EVs hold value better than others
3. **Check Battery Health** - Critical for EV resale value

The transition period offers unique opportunities for smart buyers and sellers alike.`,
        excerpt: 'How the electric vehicle revolution is changing pre-owned car values and what it means for buyers and sellers in the Indian market.',
        category: 'market-trends',
        tags: ['#cararth', '#electricvehicles', '#markettrends', '#investment'],
        author: 'CarArth Team',
        publishedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        readTime: 6,
        sources: [],
        status: 'published',
        socialMediaShared: false
      },
      {
        id: 'sample-3',
        title: 'Maruti vs Hyundai: Complete Comparison Guide 2024',
        content: `# Maruti vs Hyundai: Complete Comparison Guide 2024

## 🚗 Brand Comparison Overview

Two of India's most trusted automotive brands go head-to-head. Here's everything you need to know before making your choice.

### Quick Comparison Table
| Aspect | Maruti Suzuki | Hyundai |
|--------|---------------|---------|
| **Market Share** | 41.2% | 16.8% |
| **Service Network** | 4,500+ centers | 1,300+ centers |
| **Avg. Fuel Efficiency** | 20.5 kmpl | 18.8 kmpl |
| **Resale Value** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Feature Content** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

## 🔧 Service & Maintenance

### Maruti Suzuki Advantages:
- **Extensive Network**: Service available in smallest towns
- **Affordable Parts**: Genuine parts cost 20-30% less
- **Quick Service**: Average 2-hour service time

### Hyundai Advantages:
- **Premium Experience**: More comfortable service centers
- **Digital Integration**: Better app-based service booking
- **Skilled Technicians**: Specialized EV and tech training

## 💰 Cost of Ownership (5 Years)

**Maruti Alto vs Hyundai Santro:**
- Maruti: ₹2.8L total cost
- Hyundai: ₹3.2L total cost

**Difference**: Maruti saves ₹40,000 over 5 years

## 🏆 Best Picks by Segment:

### Entry Level (Under ₹6L):
**Winner**: Maruti Alto 800
- Lowest running costs
- Proven reliability

### Compact (₹6-10L):
**Winner**: Hyundai Grand i10 NIOS
- Better features and comfort
- Modern design

### Mid-size (₹10-15L):
**Winner**: Tie between Maruti Ciaz & Hyundai Verna
- Choose Ciaz for fuel economy
- Choose Verna for features

## 📊 Market Insights:
- Maruti leads in rural markets (65% share)
- Hyundai dominates premium segments (25% share in ₹15L+ category)
- Both brands have strong EV roadmaps for 2024-2025`,
        excerpt: 'Detailed comparison between India\'s top two car brands - Maruti Suzuki and Hyundai. Find out which brand suits your needs and budget better.',
        category: 'buying-guides',
        tags: ['#cararth', '#marutisuzuki', '#hyundai', '#comparison'],
        author: 'CarArth Team',
        publishedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        readTime: 7,
        sources: [],
        status: 'published',
        socialMediaShared: true
      },
      {
        id: 'sample-4',
        title: '⚡ Quick Tips: Car Loan Approval Secrets',
        content: `# ⚡ Quick Tips: Car Loan Approval Secrets

## 💡 Pro Tips for Guaranteed Approval

### Credit Score Boosters:
- **Pay existing EMIs on time** - Even 1 late payment hurts
- **Keep credit utilization below 30%** - Lower is better
- **Don't close old credit cards** - Longer history = better score

### Documentation Hacks:
1. **Salary Slips**: Last 6 months + bonus letters
2. **Bank Statements**: Show consistent savings pattern  
3. **ITR**: Filed and verified for last 2 years
4. **Job Stability**: Same employer for 2+ years preferred

## 📊 Interest Rate Comparison (March 2024):
- **SBI**: 8.5% - 9.5%
- **HDFC**: 8.7% - 10.5%
- **ICICI**: 8.8% - 10.2%
- **Bajaj Finance**: 9.5% - 12%

### Hidden Costs to Budget:
- Processing Fee: ₹5,000 - ₹15,000
- Insurance: ₹25,000 - ₹50,000/year
- Extended Warranty: ₹20,000 - ₹40,000
- Accessories: ₹15,000 - ₹75,000

## 🎯 Smart Negotiation Tips:
1. **Get pre-approved** from multiple banks
2. **Compare dealer vs bank financing**
3. **Negotiate on total cost, not EMI**
4. **Read fine print** for prepayment charges

**Success Rate**: Following these tips increases approval chances by 85%!`,
        excerpt: 'Insider secrets and pro tips for getting your car loan approved at the best rates. Everything banks don\'t want you to know.',
        category: 'buying-guides',
        tags: ['#cararth', '#carloan', '#finance', '#tips'],
        author: 'CarArth Team',
        publishedAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
        readTime: 4,
        sources: [],
        status: 'published',
        socialMediaShared: true
      },
      {
        id: 'sample-5',
        title: '📊 Market Report: Pre-owned Car Prices Drop 12% in Q1 2024',
        content: `# 📊 Market Report: Pre-owned Car Prices Drop 12% in Q1 2024

## 📉 Price Movement Analysis

The pre-owned car market has seen significant price corrections across all segments.

### Segment-wise Price Changes:
- **Hatchbacks**: ↓ 8.5%
- **Sedans**: ↓ 15.2%  
- **SUVs**: ↓ 6.8%
- **Luxury**: ↓ 18.7%

## 🎯 Best Buying Opportunities:

### Sedans (Biggest Drops):
1. **Honda City 2018-2020**: Now ₹8.2L (was ₹9.8L)
2. **Hyundai Verna 2017-2019**: Now ₹7.8L (was ₹9.2L) 
3. **Maruti Ciaz 2018-2020**: Now ₹7.5L (was ₹8.7L)

### Why Prices Dropped:
- **New Car Discounts**: Up to ₹1.5L discounts on new cars
- **EV Adoption**: 23% growth affecting ICE car demand
- **Festival Season**: Traditional low-demand period
- **Interest Rates**: Higher EMIs reducing affordability

## 📈 Recovery Forecast:
**Industry experts predict 5-8% price recovery by festival season (Sept-Nov 2024)**

### Regional Variations:
- **Mumbai/Delhi**: Steepest drops (15%+)
- **Tier-2 Cities**: Moderate drops (8-10%)
- **Rural Markets**: Minimal impact (3-5%)

## 💰 Buyer's Market Tips:
- **Negotiate aggressively** - Dealers have high inventory
- **Finance pre-approved** - Better negotiating position  
- **Inspect thoroughly** - More choice means better selection
- **Buy before June** - Prices expected to stabilize post-monsoon

**Bottom Line**: This is the best time in 3 years to buy a pre-owned car!`,
        excerpt: 'Pre-owned car prices have dropped significantly in Q1 2024. Here\'s your complete guide to the best buying opportunities and market predictions.',
        category: 'market-trends',
        tags: ['#cararth', '#marketreport', '#prices', '#trends'],
        author: 'CarArth Team',
        publishedAt: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
        readTime: 5,
        sources: [],
        status: 'published',
        socialMediaShared: false
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
      linkedin: `https://linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://cararth.com/blog/${article.id}`)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(posts.twitter.content)}&url=${encodeURIComponent(`https://cararth.com/blog/${article.id}`)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://cararth.com/blog/${article.id}`)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${posts.whatsapp.content} https://cararth.com/blog/${article.id}`)}`
    };

    article.status = 'shared';
    article.socialMediaShared = true;
    article.shareLinks = shareLinks;

    this.articles.set(articleId, article);
    return article;
  }

  private generateSocialMediaPosts(article: BlogArticle): Record<string, SocialMediaPost> {
    const baseUrl = 'https://cararth.com/blog/' + article.id;
    const hashtags = ['#cararth', '#preownedcars', '#automotiveindia'];

    return {
      linkedin: {
        platform: 'linkedin',
        content: `🚗 ${article.title}\n\n${article.excerpt}\n\nRead the full insights on cararth.com. Perfect for anyone looking to make smart car buying decisions in India.`,
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
        content: `${article.title}\n\n${article.excerpt}\n\nStay informed about the latest automotive trends and make better car buying decisions with cararth.com.`,
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
    
    // Check API status for transparency
    const apiStatus = {
      perplexity: !!process.env.PERPLEXITY_API_KEY,
      gemini: !!process.env.GEMINI_API_KEY,
      firecrawl: !!process.env.FIRECRAWL_API_KEY
    };

    // Determine data authenticity
    const realArticles = articles.filter(a => a.sources && a.sources.length > 0);
    const sampleArticles = articles.filter(a => a.id.startsWith('sample-'));
    
    return {
      // Basic metrics
      total: articles.length,
      published: articles.filter(a => a.status === 'published').length,
      pending: articles.filter(a => a.status === 'pending_approval').length,
      shared: articles.filter(a => a.socialMediaShared).length,
      categories: this.getCategoryStats(articles),
      recentActivity: articles.slice(0, 5),
      
      // Transparency metrics
      dataStatus: {
        realContent: realArticles.length,
        sampleContent: sampleArticles.length,
        aiGenerated: articles.length - realArticles.length - sampleArticles.length
      },
      
      // API availability
      apiStatus,
      
      // Data source warnings
      warnings: [
        ...(apiStatus.perplexity ? [] : ['⚠️ Perplexity API unavailable - using cached trending topics']),
        ...(apiStatus.gemini ? [] : ['⚠️ Gemini API unavailable - limited content generation']),
        ...(apiStatus.firecrawl ? [] : ['⚠️ Firecrawl API unavailable - no real-time portal scraping'])
      ],
      
      // Last updated timestamp
      lastUpdated: new Date().toISOString()
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