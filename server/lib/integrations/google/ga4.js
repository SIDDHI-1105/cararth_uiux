import { google } from 'googleapis';

/**
 * Google Analytics 4 API wrapper
 * Supports both service account and OAuth authentication
 */
export class GA4Client {
  constructor(auth) {
    this.auth = auth;
    this.analyticsData = google.analyticsdata({ version: 'v1beta', auth });
    this.analyticsAdmin = google.analyticsadmin({ version: 'v1beta', auth });
  }

  /**
   * Run a GA4 report
   * @param {string} propertyId - GA4 property ID (format: properties/123456789)
   * @param {Object} options - Report options
   * @returns {Promise<Object>} Report data
   */
  async runReport(propertyId, options = {}) {
    const {
      startDate = '7daysAgo',
      endDate = 'today',
      metrics = [{ name: 'sessions' }],
      dimensions = [],
    } = options;

    try {
      const response = await this.analyticsData.properties.runReport({
        property: propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          metrics,
          dimensions,
        },
      });

      return {
        rows: response.data.rows || [],
        metricHeaders: response.data.metricHeaders || [],
        dimensionHeaders: response.data.dimensionHeaders || [],
      };
    } catch (error) {
      console.error(`[GA4] Error running report for ${propertyId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get summary metrics
   * @param {string} propertyId
   * @param {Object} options
   * @returns {Promise<Object>} Summary metrics
   */
  async getSummaryMetrics(propertyId, options = {}) {
    const {
      startDate = '7daysAgo',
      endDate = 'today',
    } = options;

    try {
      const result = await this.runReport(propertyId, {
        startDate,
        endDate,
        metrics: [
          { name: 'sessions' },
          { name: 'totalUsers' },
          { name: 'conversions' },
          { name: 'bounceRate' },
          { name: 'averageSessionDuration' },
        ],
        dimensions: [],
      });

      if (result.rows.length === 0) {
        return {
          sessions: 0,
          users: 0,
          conversions: 0,
          bounceRate: 0,
          avgSessionDuration: 0,
        };
      }

      const values = result.rows[0].metricValues;
      return {
        sessions: parseInt(values[0]?.value || '0'),
        users: parseInt(values[1]?.value || '0'),
        conversions: parseInt(values[2]?.value || '0'),
        bounceRate: parseFloat(values[3]?.value || '0'),
        avgSessionDuration: parseFloat(values[4]?.value || '0'),
      };
    } catch (error) {
      console.error('[GA4] Error fetching summary metrics:', error.message);
      return {
        sessions: 0,
        users: 0,
        conversions: 0,
        bounceRate: 0,
        avgSessionDuration: 0,
      };
    }
  }

  /**
   * Get conversion events
   * @param {string} propertyId
   * @param {Object} options
   * @returns {Promise<Array>} Conversion events with counts
   */
  async getConversionEvents(propertyId, options = {}) {
    const {
      startDate = '7daysAgo',
      endDate = 'today',
    } = options;

    try {
      const result = await this.runReport(propertyId, {
        startDate,
        endDate,
        metrics: [{ name: 'conversions' }],
        dimensions: [{ name: 'eventName' }],
      });

      return result.rows.map(row => ({
        eventName: row.dimensionValues[0]?.value || 'unknown',
        conversions: parseInt(row.metricValues[0]?.value || '0'),
      }));
    } catch (error) {
      console.error('[GA4] Error fetching conversion events:', error.message);
      return [];
    }
  }

  /**
   * List all accessible GA4 properties
   * @returns {Promise<Array>} List of properties
   */
  async listProperties() {
    try {
      const response = await this.analyticsAdmin.accounts.list();
      const accounts = response.data.accounts || [];
      
      const allProperties = [];
      for (const account of accounts) {
        const propertiesResponse = await this.analyticsAdmin.properties.list({
          filter: `parent:${account.name}`,
        });
        allProperties.push(...(propertiesResponse.data.properties || []));
      }
      
      return allProperties;
    } catch (error) {
      console.error('[GA4] Error listing properties:', error.message);
      return [];
    }
  }
}
