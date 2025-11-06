/**
 * Seed script for Google Integration (GSC + GA4)
 * Creates CarArth organization and placeholder properties
 */
import { db } from '../server/db.ts';
import { aetherOrganizations, aetherUsers, aetherProperties } from '../shared/schema.ts';
import { eq } from 'drizzle-orm';

async function seedGoogleIntegration() {
  console.log('[SEED] Starting Google integration seed...');

  try {
    // 1. Check if CarArth organization exists
    const existingOrg = await db
      .select()
      .from(aetherOrganizations)
      .where(eq(aetherOrganizations.slug, 'cararth'))
      .limit(1);

    let orgId;
    
    if (existingOrg.length > 0) {
      orgId = existingOrg[0].id;
      console.log(`[SEED] ✓ CarArth organization exists (ID: ${orgId})`);
    } else {
      // Create CarArth organization
      const [newOrg] = await db
        .insert(aetherOrganizations)
        .values({
          slug: 'cararth',
          name: 'CarArth',
          domain: 'cararth.com',
        })
        .returning();
      
      orgId = newOrg.id;
      console.log(`[SEED] ✓ Created CarArth organization (ID: ${orgId})`);
    }

    // 2. Create/Update GSC property
    const existingGSC = await db
      .select()
      .from(aetherProperties)
      .where(eq(aetherProperties.source, 'gsc'))
      .limit(1);

    if (existingGSC.length > 0) {
      console.log(`[SEED] ✓ GSC property exists (External ID: ${existingGSC[0].externalId})`);
    } else {
      await db.insert(aetherProperties).values({
        orgId,
        source: 'gsc',
        externalId: process.env.GOOGLE_GSC_SITE_URL || 'sc-domain:cararth.com',
        displayName: 'CarArth Search Console',
        kind: 'site',
      });
      console.log('[SEED] ✓ Created GSC property (placeholder)');
    }

    // 3. Create/Update GA4 property
    const existingGA4 = await db
      .select()
      .from(aetherProperties)
      .where(eq(aetherProperties.source, 'ga4'))
      .limit(1);

    if (existingGA4.length > 0) {
      console.log(`[SEED] ✓ GA4 property exists (External ID: ${existingGA4[0].externalId})`);
    } else {
      await db.insert(aetherProperties).values({
        orgId,
        source: 'ga4',
        externalId: process.env.GOOGLE_GA4_PROPERTY_ID || '000000000',
        displayName: 'CarArth Analytics',
        kind: 'property',
      });
      console.log('[SEED] ✓ Created GA4 property (placeholder)');
    }

    console.log('[SEED] ✅ Google integration seed complete!');
    console.log('[SEED] Note: Add Google Service Account credentials to enable real data');
    
  } catch (error) {
    console.error('[SEED] ✗ Error:', error.message);
    throw error;
  }
}

// Run seed
seedGoogleIntegration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
