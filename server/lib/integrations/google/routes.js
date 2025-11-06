import express from 'express';
import { GoogleClientFactory, getCarArthGSCMetrics, getCarArthGA4Metrics } from './client.js';
import { encryptCredentials } from './crypto.js';
import { db } from '../../../db.js';
import { aetherGoogleTokens, aetherProperties, aetherOrganizations } from '../../../../shared/schema.js';
import { eq, and } from 'drizzle-orm';

const router = express.Router();

/**
 * GET /api/integrations/google/gsc/metrics
 * Fetch Google Search Console metrics
 */
router.get('/gsc/metrics', async (req, res) => {
  try {
    const {
      startDate = '7daysAgo',
      endDate = 'today',
    } = req.query;

    const metrics = await getCarArthGSCMetrics({
      startDate,
      endDate,
    });

    if (!metrics) {
      // Return mock data if no credentials configured
      return res.json({
        mock: true,
        data: {
          clicks: 1250,
          impressions: 45000,
          ctr: 0.0278,
          position: 12.5,
        },
        message: 'Google Service Account not configured. Using mock data.',
      });
    }

    res.json({
      mock: false,
      data: metrics,
    });
  } catch (error) {
    console.error('[API] GSC metrics error:', error.message);
    
    // Fallback to mock data on error
    res.json({
      mock: true,
      data: {
        clicks: 1250,
        impressions: 45000,
        ctr: 0.0278,
        position: 12.5,
      },
      message: error.message,
    });
  }
});

/**
 * GET /api/integrations/google/ga4/metrics
 * Fetch Google Analytics 4 metrics
 */
router.get('/ga4/metrics', async (req, res) => {
  try {
    const {
      startDate = '7daysAgo',
      endDate = 'today',
    } = req.query;

    const metrics = await getCarArthGA4Metrics({
      startDate,
      endDate,
    });

    if (!metrics) {
      // Return mock data if no credentials configured
      return res.json({
        mock: true,
        data: {
          sessions: 5420,
          users: 3890,
          conversions: 42,
          bounceRate: 0.45,
          avgSessionDuration: 125.5,
        },
        message: 'Google Service Account not configured. Using mock data.',
      });
    }

    res.json({
      mock: false,
      data: metrics,
    });
  } catch (error) {
    console.error('[API] GA4 metrics error:', error.message);
    
    // Fallback to mock data on error
    res.json({
      mock: true,
      data: {
        sessions: 5420,
        users: 3890,
        conversions: 42,
        bounceRate: 0.45,
        avgSessionDuration: 125.5,
      },
      message: error.message,
    });
  }
});

/**
 * GET /api/integrations/google/status
 * Check Google integration status
 */
router.get('/status', async (req, res) => {
  try {
    const orgId = await GoogleClientFactory.getCarArthOrgId();
    
    const tokenRecord = await db
      .select()
      .from(aetherGoogleTokens)
      .where(eq(aetherGoogleTokens.orgId, orgId))
      .limit(1);

    const gscProperty = await db
      .select()
      .from(aetherProperties)
      .where(and(
        eq(aetherProperties.orgId, orgId),
        eq(aetherProperties.source, 'gsc')
      ))
      .limit(1);

    const ga4Property = await db
      .select()
      .from(aetherProperties)
      .where(and(
        eq(aetherProperties.orgId, orgId),
        eq(aetherProperties.source, 'ga4')
      ))
      .limit(1);

    res.json({
      connected: tokenRecord.length > 0,
      tokenType: tokenRecord.length > 0 ? tokenRecord[0].tokenType : null,
      gscConfigured: gscProperty.length > 0,
      gscSiteUrl: gscProperty.length > 0 ? gscProperty[0].externalId : null,
      ga4Configured: ga4Property.length > 0,
      ga4PropertyId: ga4Property.length > 0 ? ga4Property[0].externalId : null,
    });
  } catch (error) {
    console.error('[API] Status check error:', error.message);
    res.json({
      connected: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/integrations/google/setup
 * Setup Google service account credentials
 */
router.post('/setup', async (req, res) => {
  try {
    const {
      serviceAccountEmail,
      serviceAccountPrivateKey,
      gscSiteUrl,
      ga4PropertyId,
    } = req.body;

    if (!serviceAccountEmail || !serviceAccountPrivateKey) {
      return res.status(400).json({
        error: 'Service account credentials are required',
      });
    }

    const orgId = await GoogleClientFactory.getCarArthOrgId();

    // Create service account credentials object
    const credentials = {
      type: 'service_account',
      client_email: serviceAccountEmail,
      private_key: serviceAccountPrivateKey,
      project_id: 'cararth-analytics', // Default project ID
    };

    // Encrypt and store credentials
    const encryptedCreds = encryptCredentials(credentials);

    // Check if token already exists
    const existingToken = await db
      .select()
      .from(aetherGoogleTokens)
      .where(eq(aetherGoogleTokens.orgId, orgId))
      .limit(1);

    if (existingToken.length > 0) {
      // Update existing
      await db
        .update(aetherGoogleTokens)
        .set({
          tokenType: 'service_account',
          credentials: encryptedCreds,
          scopes: ['webmasters.readonly', 'analytics.readonly'],
          updatedAt: new Date(),
        })
        .where(eq(aetherGoogleTokens.id, existingToken[0].id));
    } else {
      // Insert new
      await db.insert(aetherGoogleTokens).values({
        orgId,
        tokenType: 'service_account',
        credentials: encryptedCreds,
        scopes: ['webmasters.readonly', 'analytics.readonly'],
      });
    }

    // Store GSC site URL
    if (gscSiteUrl) {
      const existingGSC = await db
        .select()
        .from(aetherProperties)
        .where(and(
          eq(aetherProperties.orgId, orgId),
          eq(aetherProperties.source, 'gsc')
        ))
        .limit(1);

      if (existingGSC.length > 0) {
        await db
          .update(aetherProperties)
          .set({
            externalId: gscSiteUrl,
            updatedAt: new Date(),
          })
          .where(eq(aetherProperties.id, existingGSC[0].id));
      } else {
        await db.insert(aetherProperties).values({
          orgId,
          source: 'gsc',
          externalId: gscSiteUrl,
          displayName: 'CarArth Search Console',
          kind: 'site',
        });
      }
    }

    // Store GA4 property ID
    if (ga4PropertyId) {
      const existingGA4 = await db
        .select()
        .from(aetherProperties)
        .where(and(
          eq(aetherProperties.orgId, orgId),
          eq(aetherProperties.source, 'ga4')
        ))
        .limit(1);

      if (existingGA4.length > 0) {
        await db
          .update(aetherProperties)
          .set({
            externalId: ga4PropertyId,
            updatedAt: new Date(),
          })
          .where(eq(aetherProperties.id, existingGA4[0].id));
      } else {
        await db.insert(aetherProperties).values({
          orgId,
          source: 'ga4',
          externalId: ga4PropertyId,
          displayName: 'CarArth Analytics',
          kind: 'property',
        });
      }
    }

    res.json({
      success: true,
      message: 'Google integration configured successfully',
    });
  } catch (error) {
    console.error('[API] Setup error:', error.message);
    res.status(500).json({
      error: error.message,
    });
  }
});

export default router;
