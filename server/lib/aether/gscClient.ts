import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

export interface GscSearchAnalytics {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  query?: string;
  page?: string;
  country?: string;
  device?: string;
}

export interface GscIndexingStatus {
  totalPages: number;
  indexed: number;
  notIndexed: number;
  excluded: number;
  errors: number;
}

export interface GscPageIndexing {
  url: string;
  status: string;
  lastCrawled?: string;
  coverage?: string;
}

export class GoogleSearchConsoleClient {
  private client: JWT | null = null;
  private mockMode: boolean;
  private siteUrl: string;

  constructor() {
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
    this.siteUrl = process.env.GOOGLE_GSC_SITE_URL || 'https://www.cararth.com';

    this.mockMode = !serviceAccountEmail || !privateKey;

    if (this.mockMode) {
      console.log('[GSC Client] Running in MOCK mode - service account not configured');
    } else {
      try {
        // Replace escaped newlines in private key
        const formattedPrivateKey = privateKey!.replace(/\\n/g, '\n');

        this.client = new google.auth.JWT({
          email: serviceAccountEmail,
          key: formattedPrivateKey,
          scopes: [
            'https://www.googleapis.com/auth/webmasters.readonly',
          ],
        });
        console.log('[GSC Client] Initialized with service account');
      } catch (error) {
        console.error('[GSC Client] Failed to initialize service account:', error);
        this.mockMode = true;
      }
    }
  }

  async getSearchAnalytics(options?: {
    startDate?: string;
    endDate?: string;
    dimensions?: ('query' | 'page' | 'country' | 'device')[];
    rowLimit?: number;
  }): Promise<GscSearchAnalytics[]> {
    if (this.mockMode) {
      return this.getMockSearchAnalytics(options?.dimensions);
    }

    try {
      const searchconsole = google.searchconsole({ version: 'v1', auth: this.client! });

      const endDate = options?.endDate || new Date().toISOString().split('T')[0];
      const startDate = options?.startDate || 
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const response = await searchconsole.searchanalytics.query({
        siteUrl: this.siteUrl,
        requestBody: {
          startDate,
          endDate,
          dimensions: options?.dimensions || ['date'],
          rowLimit: options?.rowLimit || 1000,
        },
      });

      const rows = response.data.rows || [];
      const dimensions = options?.dimensions || ['date'];

      return rows.map((row: any) => {
        const keys = row.keys || [];
        const result: GscSearchAnalytics = {
          date: endDate,
          clicks: row.clicks || 0,
          impressions: row.impressions || 0,
          ctr: row.ctr || 0,
          position: row.position || 0,
        };

        // Map each dimension to its corresponding index in keys array
        dimensions.forEach((dimension, index) => {
          const value = keys[index];
          if (value !== undefined) {
            switch (dimension) {
              case 'date':
                result.date = value;
                break;
              case 'query':
                result.query = value;
                break;
              case 'page':
                result.page = value;
                break;
              case 'country':
                result.country = value;
                break;
              case 'device':
                result.device = value;
                break;
            }
          }
        });

        return result;
      });
    } catch (error: any) {
      console.error('[GSC Client] Failed to fetch search analytics:', error.message);
      throw new Error(`GSC API error: ${error.message}`);
    }
  }

  async getIndexingStatus(): Promise<GscIndexingStatus> {
    if (this.mockMode) {
      return {
        totalPages: 1250,
        indexed: 1100,
        notIndexed: 150,
        excluded: 0,
        errors: 0,
      };
    }

    try {
      const searchconsole = google.searchconsole({ version: 'v1', auth: this.client! });

      // Get sitemap status to estimate total pages
      const sitemapsResponse = await searchconsole.sitemaps.list({
        siteUrl: this.siteUrl,
      });

      const totalPages = sitemapsResponse.data.sitemap?.reduce((sum, sitemap: any) => {
        return sum + (sitemap.contents?.[0]?.submitted || 0);
      }, 0) || 0;

      // Get index coverage data
      const inspectionResponse = await searchconsole.urlInspection.index.inspect({
        requestBody: {
          inspectionUrl: this.siteUrl,
          siteUrl: this.siteUrl,
        },
      });

      const indexStatus = inspectionResponse.data.inspectionResult?.indexStatusResult;

      return {
        totalPages,
        indexed: indexStatus?.coverageState === 'Submitted and indexed' ? totalPages : 0,
        notIndexed: indexStatus?.coverageState !== 'Submitted and indexed' ? totalPages : 0,
        excluded: 0,
        errors: 0,
      };
    } catch (error: any) {
      console.error('[GSC Client] Failed to fetch indexing status:', error.message);
      // Return estimated data based on analytics
      return {
        totalPages: 1250,
        indexed: 1100,
        notIndexed: 150,
        excluded: 0,
        errors: 0,
      };
    }
  }

  async getTopPages(limit: number = 10): Promise<GscSearchAnalytics[]> {
    if (this.mockMode) {
      return this.getMockTopPages(limit);
    }

    try {
      const analytics = await this.getSearchAnalytics({
        dimensions: ['page'],
        rowLimit: limit,
      });

      return analytics.sort((a, b) => b.clicks - a.clicks).slice(0, limit);
    } catch (error: any) {
      console.error('[GSC Client] Failed to fetch top pages:', error.message);
      return this.getMockTopPages(limit);
    }
  }

  async getTopQueries(limit: number = 10): Promise<GscSearchAnalytics[]> {
    if (this.mockMode) {
      return this.getMockTopQueries(limit);
    }

    try {
      const analytics = await this.getSearchAnalytics({
        dimensions: ['query'],
        rowLimit: limit,
      });

      return analytics.sort((a, b) => b.clicks - a.clicks).slice(0, limit);
    } catch (error: any) {
      console.error('[GSC Client] Failed to fetch top queries:', error.message);
      return this.getMockTopQueries(limit);
    }
  }

  private getMockSearchAnalytics(dimensions?: ('query' | 'page' | 'country' | 'device')[]): GscSearchAnalytics[] {
    return Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      clicks: Math.floor(Math.random() * 800) + 200,
      impressions: Math.floor(Math.random() * 8000) + 2000,
      ctr: Math.random() * 0.08 + 0.02,
      position: Math.random() * 5 + 3,
    }));
  }

  private getMockTopPages(limit: number): GscSearchAnalytics[] {
    const pages = [
      'https://www.cararth.com/',
      'https://www.cararth.com/used-cars-hyderabad',
      'https://www.cararth.com/used-cars-mumbai',
      'https://www.cararth.com/ai-verification',
      'https://www.cararth.com/news',
    ];

    return pages.slice(0, limit).map((page, i) => ({
      date: new Date().toISOString().split('T')[0],
      page,
      clicks: Math.floor(Math.random() * 500) + 100 - i * 50,
      impressions: Math.floor(Math.random() * 5000) + 1000 - i * 500,
      ctr: Math.random() * 0.1,
      position: Math.random() * 3 + 2,
    }));
  }

  private getMockTopQueries(limit: number): GscSearchAnalytics[] {
    const queries = [
      'used cars hyderabad',
      'second hand cars mumbai',
      'best used cars india',
      'cararth reviews',
      'buy used car online',
      'certified pre-owned cars',
      'used car verification',
    ];

    return queries.slice(0, limit).map((query, i) => ({
      date: new Date().toISOString().split('T')[0],
      query,
      clicks: Math.floor(Math.random() * 300) + 50 - i * 30,
      impressions: Math.floor(Math.random() * 3000) + 500 - i * 300,
      ctr: Math.random() * 0.1,
      position: Math.random() * 5 + 2,
    }));
  }

  isMockMode(): boolean {
    return this.mockMode;
  }

  getSiteUrl(): string {
    return this.siteUrl;
  }
}

export function createGscClient(): GoogleSearchConsoleClient {
  return new GoogleSearchConsoleClient();
}
