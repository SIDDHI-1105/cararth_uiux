import { google } from 'googleapis';
import { db } from '../../../db.js';
import { aetherGoogleTokens, aetherProperties, aetherOrganizations } from '../../../../shared/schema.js';
import { eq } from 'drizzle-orm';
import { decryptCredentials } from './crypto.js';
import { GSCClient } from './gsc.js';
import { GA4Client } from './ga4.js';

/**
 * Google API Client Factory
 * Creates authenticated GSC and GA4 clients from stored credentials
 */
export class GoogleClientFactory {
  /**
   * Get auth client for an organization
   * @param {string} orgId - Organization ID
   * @returns {Promise<Object>} Google Auth client
   */
  static async getAuthClient(orgId) {
    try {
      // Fetch encrypted credentials from database
      const tokenRecord = await db
        .select()
        .from(aetherGoogleTokens)
        .where(eq(aetherGoogleTokens.orgId, orgId))
        .limit(1);

      if (tokenRecord.length === 0) {
        throw new Error(`No Google credentials found for org ${orgId}`);
      }

      const { tokenType, credentials: encryptedCreds } = tokenRecord[0];

      // Decrypt credentials
      const credentials = decryptCredentials(encryptedCreds);

      if (tokenType === 'service_account') {
        // Create JWT auth for service account
        const auth = new google.auth.GoogleAuth({
          credentials,
          scopes: [
            'https://www.googleapis.com/auth/webmasters.readonly',
            'https://www.googleapis.com/auth/analytics.readonly',
          ],
        });

        return await auth.getClient();
      } else if (tokenType === 'oauth') {
        // Create OAuth2 client
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET
        );

        oauth2Client.setCredentials(credentials);
        return oauth2Client;
      } else {
        throw new Error(`Unknown token type: ${tokenType}`);
      }
    } catch (error) {
      console.error('[Google Client] Error creating auth client:', error.message);
      throw error;
    }
  }

  /**
   * Get GSC client for an organization
   * @param {string} orgId - Organization ID
   * @returns {Promise<GSCClient>} Authenticated GSC client
   */
  static async getGSCClient(orgId) {
    const auth = await this.getAuthClient(orgId);
    return new GSCClient(auth);
  }

  /**
   * Get GA4 client for an organization
   * @param {string} orgId - Organization ID
   * @returns {Promise<GA4Client>} Authenticated GA4 client
   */
  static async getGA4Client(orgId) {
    const auth = await this.getAuthClient(orgId);
    return new GA4Client(auth);
  }

  /**
   * Get GSC site URL for an organization
   * @param {string} orgId
   * @returns {Promise<string|null>} GSC site URL
   */
  static async getGSCSiteUrl(orgId) {
    try {
      const property = await db
        .select()
        .from(aetherProperties)
        .where(eq(aetherProperties.orgId, orgId))
        .where(eq(aetherProperties.source, 'gsc'))
        .limit(1);

      return property.length > 0 ? property[0].externalId : null;
    } catch (error) {
      console.error('[Google Client] Error fetching GSC site URL:', error.message);
      return null;
    }
  }

  /**
   * Get GA4 property ID for an organization
   * @param {string} orgId
   * @returns {Promise<string|null>} GA4 property ID
   */
  static async getGA4PropertyId(orgId) {
    try {
      const property = await db
        .select()
        .from(aetherProperties)
        .where(eq(aetherProperties.orgId, orgId))
        .where(eq(aetherProperties.source, 'ga4'))
        .limit(1);

      return property.length > 0 ? property[0].externalId : null;
    } catch (error) {
      console.error('[Google Client] Error fetching GA4 property ID:', error.message);
      return null;
    }
  }

  /**
   * Get organization ID for CarArth (default)
   * @returns {Promise<string>} Organization ID
   */
  static async getCarArthOrgId() {
    try {
      const org = await db
        .select()
        .from(aetherOrganizations)
        .where(eq(aetherOrganizations.name, 'CarArth'))
        .limit(1);

      if (org.length === 0) {
        console.warn('[Google Client] CarArth organization not found, creating...');
        // Create default CarArth org
        const newOrg = await db
          .insert(aetherOrganizations)
          .values({
            name: 'CarArth',
            domain: 'cararth.com',
          })
          .returning();
        
        return newOrg[0].id;
      }

      return org[0].id;
    } catch (error) {
      console.error('[Google Client] Error getting CarArth org ID:', error.message);
      throw error;
    }
  }
}

/**
 * Convenience function to get CarArth's GSC metrics
 * @param {Object} options - Date range and other options
 * @returns {Promise<Object>} GSC metrics
 */
export async function getCarArthGSCMetrics(options = {}) {
  try {
    const orgId = await GoogleClientFactory.getCarArthOrgId();
    const siteUrl = await GoogleClientFactory.getGSCSiteUrl(orgId);
    
    if (!siteUrl) {
      console.warn('[GSC] No site URL configured for CarArth');
      return null;
    }

    const client = await GoogleClientFactory.getGSCClient(orgId);
    return await client.getSiteSummary(siteUrl, options);
  } catch (error) {
    console.error('[GSC] Error fetching CarArth metrics:', error.message);
    return null;
  }
}

/**
 * Convenience function to get CarArth's GA4 metrics
 * @param {Object} options - Date range and other options
 * @returns {Promise<Object>} GA4 metrics
 */
export async function getCarArthGA4Metrics(options = {}) {
  try {
    const orgId = await GoogleClientFactory.getCarArthOrgId();
    const propertyId = await GoogleClientFactory.getGA4PropertyId(orgId);
    
    if (!propertyId) {
      console.warn('[GA4] No property ID configured for CarArth');
      return null;
    }

    const client = await GoogleClientFactory.getGA4Client(orgId);
    return await client.getSummaryMetrics(propertyId, options);
  } catch (error) {
    console.error('[GA4] Error fetching CarArth metrics:', error.message);
    return null;
  }
}
