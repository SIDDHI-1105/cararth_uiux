/**
 * Production Database Import Script
 * 
 * Imports cached_portal_listings data into production database
 * 
 * Usage:
 * 1. Make sure you're in PRODUCTION environment
 * 2. Run: NODE_ENV=production tsx scripts/import-to-production.ts
 */

import { neon } from '@neondatabase/serverless';
import devData from './dev-listings-export.json';

async function importToProduction() {
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }

  console.log('🚀 Starting production database import...');
  
  const sql = neon(DATABASE_URL);

  try {
    // Check current count
    const countResult = await sql`SELECT COUNT(*) as count FROM cached_portal_listings`;
    const currentCount = parseInt(countResult[0].count);
    
    console.log(`📊 Current listings in production: ${currentCount}`);
    
    if (currentCount > 0) {
      console.log('⚠️  Production already has listings. Clearing first...');
      await sql`TRUNCATE TABLE cached_portal_listings CASCADE`;
      console.log('✅ Table cleared');
    }

    // Import listings
    console.log(`📥 Importing ${devData.length} listings...`);
    
    let imported = 0;
    const batchSize = 50;
    
    for (let i = 0; i < devData.length; i += batchSize) {
      const batch = devData.slice(i, i + batchSize);
      
      for (const listing of batch) {
        await sql`
          INSERT INTO cached_portal_listings (
            id, portal, title, brand, model, year, price, mileage,
            fuel_type, transmission, location, city, state, images,
            url, listing_date, condition, seller_type, verification_status,
            owners, has_real_image, quality_score, image_authenticity,
            listing_source, created_at
          ) VALUES (
            ${listing.id}, ${listing.portal}, ${listing.title}, ${listing.brand},
            ${listing.model}, ${listing.year}, ${listing.price}, ${listing.mileage},
            ${listing.fuel_type}, ${listing.transmission}, ${listing.location},
            ${listing.city}, ${listing.state}, ${listing.images}::jsonb,
            ${listing.url}, ${listing.listing_date}, ${listing.condition},
            ${listing.seller_type}, ${listing.verification_status}, ${listing.owners},
            ${listing.has_real_image}, ${listing.quality_score}, ${listing.image_authenticity},
            ${listing.listing_source}, ${listing.created_at}
          )
        `;
        imported++;
      }
      
      console.log(`  ✓ Imported ${Math.min(i + batchSize, devData.length)}/${devData.length} listings...`);
    }

    // Verify final count
    const finalResult = await sql`SELECT COUNT(*) as count FROM cached_portal_listings`;
    const finalCount = parseInt(finalResult[0].count);
    
    console.log('');
    console.log('✅ Import complete!');
    console.log(`📊 Total listings in production: ${finalCount}`);
    console.log(`📈 Image quality stats:`);
    
    const statsResult = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE has_real_image = true) as real_images,
        COUNT(*) FILTER (WHERE has_real_image = false) as placeholders
      FROM cached_portal_listings
    `;
    
    console.log(`   - Real images: ${statsResult[0].real_images}`);
    console.log(`   - Placeholders: ${statsResult[0].placeholders}`);
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

importToProduction();
