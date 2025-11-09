import { getValidBingToken } from "../../routes/aether/bingAuth";

const BING_API_BASE = "https://www.bing.com/webmaster/api.svc/json";

interface BingSite {
  Url: string;
  Verified: boolean;
  OwnerType: string;
}

interface BingTrafficData {
  Date: string;
  Clicks: number;
  Impressions: number;
  Ctr: number;
  AvgPosition: number;
  Query?: string;
  Page?: string;
  Country?: string;
  Device?: string;
}

interface BingCrawlIssue {
  Url: string;
  IssueType: string;
  Severity: string;
  HttpStatusCode?: number;
  LastCrawled?: string;
}

interface BingSitemap {
  Url: string;
  Status: string;
  Urls: number;
  Errors: number;
  LastSubmitted?: string;
  LastDownloaded?: string;
}

interface BingBacklink {
  SourceUrl: string;
  TargetUrl: string;
  AnchorText?: string;
  FirstSeen?: string;
}

export class BingWebmasterClient {
  private userId: string;
  private mockMode: boolean;
  private useApiKey: boolean;
  private apiKey: string | undefined;
  private siteUrl: string;

  constructor(userId: string) {
    this.userId = userId;
    this.apiKey = process.env.BING_WEBMASTER_API_KEY;
    this.siteUrl = process.env.BING_WEBMASTER_SITE_URL || 'https://www.cararth.com/';
    
    // Prefer API key over OAuth if available
    this.useApiKey = !!this.apiKey;
    this.mockMode = !this.useApiKey && (!process.env.BING_CLIENT_ID || !process.env.BING_CLIENT_SECRET);
    
    if (this.mockMode) {
      console.log('[Bing Webmaster Client] Running in MOCK mode - credentials not configured');
    } else if (this.useApiKey) {
      console.log('[Bing Webmaster Client] Using API key authentication');
    } else {
      console.log('[Bing Webmaster Client] Using OAuth authentication');
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    params: Record<string, string> = {}
  ): Promise<T> {
    if (this.mockMode) {
      return this.getMockResponse<T>(endpoint);
    }

    const url = new URL(`${BING_API_BASE}/${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.useApiKey) {
      // API key authentication
      headers['apikey'] = this.apiKey!;
    } else {
      // OAuth authentication
      const token = await getValidBingToken(this.userId);
      if (!token) {
        throw new Error('No valid Bing access token available. Please connect your Bing account.');
      }
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Bing API error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  private getMockResponse<T>(endpoint: string): T {
    const mockResponses: Record<string, any> = {
      GetSites: {
        d: [
          {
            Url: 'https://cararth.com/',
            Verified: true,
            OwnerType: 'User',
          },
        ],
      },
      GetTraffic: {
        d: Array.from({ length: 30 }, (_, i) => ({
          Date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          Clicks: Math.floor(Math.random() * 500) + 100,
          Impressions: Math.floor(Math.random() * 5000) + 1000,
          Ctr: Math.random() * 0.1,
          AvgPosition: Math.random() * 10 + 5,
        })),
      },
      GetQueryStats: {
        d: Array.from({ length: 7 }, (_, i) => ({
          Date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          Clicks: Math.floor(Math.random() * 50) + 10,
          Impressions: Math.floor(Math.random() * 500) + 100,
          Ctr: Math.random() * 0.1,
          AvgPosition: Math.random() * 10 + 5,
          Query: 'mock query',
        })),
      },
      GetCrawlIssues: {
        d: [
          {
            Url: 'https://cararth.com/page-not-found',
            IssueType: 'NotFound',
            Severity: 'High',
            HttpStatusCode: 404,
            LastCrawled: new Date().toISOString(),
          },
          {
            Url: 'https://cararth.com/slow-page',
            IssueType: 'Timeout',
            Severity: 'Medium',
            LastCrawled: new Date().toISOString(),
          },
        ],
      },
      GetSitemaps: {
        d: [
          {
            Url: 'https://cararth.com/sitemap.xml',
            Status: 'Success',
            Urls: 1250,
            Errors: 0,
            LastSubmitted: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            LastDownloaded: new Date().toISOString(),
          },
        ],
      },
      GetLinkedDomains: {
        d: {
          domains: [
            {
              SourceUrl: 'https://example.com/article',
              TargetUrl: 'https://cararth.com/',
              AnchorText: 'best used cars',
              FirstSeen: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              SourceUrl: 'https://carblog.in/review',
              TargetUrl: 'https://cararth.com/used-cars-hyderabad',
              AnchorText: 'CarArth listings',
              FirstSeen: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            },
          ],
          totalBacklinks: 225,
        },
      },
    };

    if (!mockResponses[endpoint]) {
      throw new Error(
        `Mock response not implemented for endpoint: ${endpoint}. ` +
        `Available endpoints: ${Object.keys(mockResponses).join(', ')}`
      );
    }

    return mockResponses[endpoint] as T;
  }

  async getSites(): Promise<BingSite[]> {
    const response = await this.makeRequest<{ d: BingSite[] }>('GetSites');
    return response.d || [];
  }

  async getTraffic(
    siteUrl: string,
    startDate: string,
    endDate: string,
    options?: {
      query?: string;
      page?: string;
      country?: string;
      device?: string;
    }
  ): Promise<BingTrafficData[]> {
    const params: Record<string, string> = {
      siteUrl,
      start: startDate,
      end: endDate,
    };

    if (options?.query) params.query = options.query;
    if (options?.page) params.page = options.page;
    if (options?.country) params.country = options.country;
    if (options?.device) params.device = options.device;

    const response = await this.makeRequest<{ d: BingTrafficData[] }>('GetTraffic', params);
    return response.d || [];
  }

  async getCrawlIssues(siteUrl: string): Promise<BingCrawlIssue[]> {
    const response = await this.makeRequest<{ d: BingCrawlIssue[] }>('GetCrawlIssues', { siteUrl });
    return response.d || [];
  }

  async getSitemaps(siteUrl: string): Promise<BingSitemap[]> {
    const response = await this.makeRequest<{ d: BingSitemap[] }>('GetSitemaps', { siteUrl });
    return response.d || [];
  }

  async getBacklinks(
    siteUrl: string,
    page?: string
  ): Promise<{ domains: BingBacklink[]; totalBacklinks: number }> {
    const params: Record<string, string> = { siteUrl };
    if (page) params.page = page;
    
    const response = await this.makeRequest<{ 
      d: { domains: BingBacklink[]; totalBacklinks: number } 
    }>('GetLinkedDomains', params);
    
    return response.d || { domains: [], totalBacklinks: 0 };
  }

  async getQueryStats(
    siteUrl: string,
    query: string,
    startDate: string,
    endDate: string
  ): Promise<BingTrafficData[]> {
    const params = {
      siteUrl,
      query,
      start: startDate,
      end: endDate,
    };

    const response = await this.makeRequest<{ d: BingTrafficData[] }>('GetQueryStats', params);
    return response.d || [];
  }

  isMockMode(): boolean {
    return this.mockMode;
  }
}

export async function createBingClient(userId: string): Promise<BingWebmasterClient> {
  return new BingWebmasterClient(userId);
}
