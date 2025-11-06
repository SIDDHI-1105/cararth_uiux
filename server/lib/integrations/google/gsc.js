import { google } from 'googleapis';

/**
 * Google Search Console API wrapper
 * Supports both service account and OAuth authentication
 */
export class GSCClient {
  constructor(auth) {
    this.auth = auth;
    this.searchconsole = google.searchconsole({ version: 'v1', auth });
  }

  /**
   * Get search analytics data
   * @param {string} siteUrl - GSC site URL (e.g., 'sc-domain:cararth.com' or 'https://www.cararth.com/')
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Analytics data
   */
  async getSearchAnalytics(siteUrl, options = {}) {
    const {
      startDate,
      endDate,
      dimensions = ['query', 'page'],
      rowLimit = 25000,
      aggregationType = 'auto'
    } = options;

    try {
      const response = await this.searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate,
          endDate,
          dimensions,
          rowLimit,
          aggregationType,
        },
      });

      return {
        rows: response.data.rows || [],
        responseAggregationType: response.data.responseAggregationType,
      };
    } catch (error) {
      console.error(`[GSC] Error fetching analytics for ${siteUrl}:`, error.message);
      throw error;
    }
  }

  /**
   * Get top queries
   * @param {string} siteUrl
   * @param {Object} options
   * @returns {Promise<Array>} Top queries with metrics
   */
  async getTopQueries(siteUrl, options = {}) {
    const {
      startDate,
      endDate,
      limit = 100
    } = options;

    try {
      const result = await this.getSearchAnalytics(siteUrl, {
        startDate,
        endDate,
        dimensions: ['query'],
        rowLimit: limit,
      });

      return result.rows.map(row => ({
        query: row.keys[0],
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
      }));
    } catch (error) {
      console.error('[GSC] Error fetching top queries:', error.message);
      return [];
    }
  }

  /**
   * Get site summary metrics
   * @param {string} siteUrl
   * @param {Object} options
   * @returns {Promise<Object>} Aggregated metrics
   */
  async getSiteSummary(siteUrl, options = {}) {
    const {
      startDate,
      endDate,
    } = options;

    try {
      const result = await this.getSearchAnalytics(siteUrl, {
        startDate,
        endDate,
        dimensions: [],
        rowLimit: 1,
      });

      if (result.rows.length === 0) {
        return {
          clicks: 0,
          impressions: 0,
          ctr: 0,
          position: 0,
        };
      }

      const row = result.rows[0];
      return {
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        position: row.position || 0,
      };
    } catch (error) {
      console.error('[GSC] Error fetching site summary:', error.message);
      return {
        clicks: 0,
        impressions: 0,
        ctr: 0,
        position: 0,
      };
    }
  }

  /**
   * List all sites accessible to the authenticated account
   * @returns {Promise<Array>} List of sites
   */
  async listSites() {
    try {
      const response = await this.searchconsole.sites.list();
      return response.data.siteEntry || [];
    } catch (error) {
      console.error('[GSC] Error listing sites:', error.message);
      return [];
    }
  }
}
