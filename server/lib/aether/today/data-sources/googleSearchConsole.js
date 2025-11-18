import { google } from 'googleapis';

/**
 * Google Search Console Data Fetcher
 * Fetches real ranking, clicks, impressions data per URL
 */
export class GoogleSearchConsoleService {
  constructor() {
    this.credentials = {
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      privateKey: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      siteUrl: process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL || 'https://www.cararth.com'
    };
    
    this.client = null;
    this.enabled = !!(this.credentials.email && this.credentials.privateKey);
    
    if (this.enabled) {
      this.initialize();
    } else {
      console.warn('[GSC] Service account credentials not configured, using mock data');
    }
  }

  initialize() {
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: this.credentials.email,
          private_key: this.credentials.privateKey,
        },
        scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
      });

      this.client = google.searchconsole({ version: 'v1', auth });
      console.log('[GSC] ✓ Service initialized');
    } catch (err) {
      console.error('[GSC] Failed to initialize:', err.message);
      this.enabled = false;
    }
  }

  /**
   * Fetch Search Console data for specific URLs
   * @param {string[]} urls - Array of page URLs to fetch data for
   * @param {number} days - Number of days to look back (default: 28)
   */
  async fetchUrlMetrics(urls, days = 28) {
    if (!this.enabled) {
      console.log('[GSC] Using mock data (credentials not configured)');
      return this.getMockData(urls);
    }

    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const response = await this.client.searchanalytics.query({
        siteUrl: this.credentials.siteUrl,
        requestBody: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          dimensions: ['page'],
          rowLimit: 1000,
        },
      });

      const rows = response.data?.rows || [];
      const metrics = {};

      // Process each URL
      for (const url of urls) {
        const fullUrl = `${this.credentials.siteUrl}${url}`;
        const data = rows.find(row => row.keys[0] === fullUrl);

        metrics[url] = {
          clicks: data?.clicks || 0,
          impressions: data?.impressions || 0,
          ctr: data?.ctr || 0,
          position: data?.position || 100,
        };
      }

      console.log(`[GSC] ✓ Fetched data for ${Object.keys(metrics).length} URLs`);
      return metrics;
    } catch (err) {
      console.error('[GSC] Failed to fetch data:', err.message);
      return this.getMockData(urls);
    }
  }

  /**
   * Mock data fallback when credentials not available
   */
  getMockData(urls) {
    const mockMetrics = {
      '/': { clicks: 1240, impressions: 8500, ctr: 0.146, position: 12.5 },
      '/used-cars/hyderabad': { clicks: 2850, impressions: 15200, ctr: 0.187, position: 8.2 },
      '/guides/ai-verified-used-car-trust-india': { clicks: 420, impressions: 2100, ctr: 0.2, position: 6.8 },
      '/sell': { clicks: 180, impressions: 1200, ctr: 0.15, position: 15.3 },
      '/news': { clicks: 95, impressions: 680, ctr: 0.14, position: 18.7 },
    };

    const metrics = {};
    for (const url of urls) {
      metrics[url] = mockMetrics[url] || { clicks: 50, impressions: 400, ctr: 0.125, position: 25 };
    }
    
    return metrics;
  }
}

// Singleton instance
let instance = null;
export function getGSCService() {
  if (!instance) {
    instance = new GoogleSearchConsoleService();
  }
  return instance;
}
