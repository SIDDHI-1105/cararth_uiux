/**
 * AETHER Auto-SEO Content Generation Types
 * Production-ready types for hyperlocal car article generation
 */

export interface GeneratedArticle {
  id: string;
  city: string;
  topic: string;
  slug: string;
  meta: {
    title: string;
    description: string;
    robots: string;
    canonical: string;
    ogImage?: string;
  };
  geoIntroQA: string; // GEO-friendly intro (120-180 words)
  contentHtml: string; // Full HTML with H1-H3, tables, lists
  schema: {
    faq?: any;
    breadcrumb?: any;
    vehicleOfferBlocks?: any[];
    localBusiness?: any;
  };
  internalLinks: Array<{
    href: string;
    anchor: string;
    rel?: string;
  }>;
  cta: {
    text: string;
    href: string;
  };
  seoChecklist: {
    pass: string[];
    warn: string[];
  };
  assets?: {
    s3Paths: string[];
  };
  createdAt: string;
}

export interface ArticleMetrics {
  gsc?: {
    clicks?: number;
    impressions?: number;
    ctr?: number;
    position?: number;
  };
  ga4?: {
    views?: number;
    engagedSessions?: number;
    conversions?: number;
  };
  geo?: {
    aiMentionRate?: number;
  };
}

export interface ArticleImpact {
  id: string;
  articleId: string;
  date: string;
  metrics: ArticleMetrics;
  deltas?: {
    gsc7d?: Partial<ArticleMetrics['gsc']>;
    gsc28d?: Partial<ArticleMetrics['gsc']>;
    ga47d?: Partial<ArticleMetrics['ga4']>;
    ga428d?: Partial<ArticleMetrics['ga4']>;
    geo7d?: Partial<ArticleMetrics['geo']>;
    geo28d?: Partial<ArticleMetrics['geo']>;
  };
}

export interface CMSPublishRequest {
  slug: string;
  meta: GeneratedArticle['meta'];
  contentHtml: string;
  schema: GeneratedArticle['schema'];
  internalLinks: GeneratedArticle['internalLinks'];
  cta: GeneratedArticle['cta'];
  status: 'draft' | 'published';
}

export interface CMSPublishResponse {
  cmsRef: string;
  publishedUrl?: string;
  version?: number;
}

export interface PublishMode {
  type: 'A' | 'B';
  zipUrl?: string; // Mode A
  cmsRef?: string; // Mode B
  publishedUrl?: string; // Mode B
}

export interface HyperlocalData {
  city: string;
  neighborhoods: string[];
  rtoAddresses: Array<{
    code: string;
    address: string;
    district: string;
  }>;
  priceBands: {
    budget: [number, number]; // [min, max] in lakhs
    midRange: [number, number];
    premium: [number, number];
    luxury: [number, number];
  };
  emiRanges: {
    tenure36: [number, number]; // [min, max] monthly EMI
    tenure48: [number, number];
    tenure60: [number, number];
  };
  popularDealers: Array<{
    name: string;
    area: string;
    specialization: string;
  }>;
  marketInsights?: {
    topBrands: string[];
    avgPrice: number;
    avgMileage: number;
    demandScore: number;
  };
}
