import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';

async function importSeedData() {
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }

  const sql = neon(DATABASE_URL);
  
  console.log('📥 Loading seed data from data/dev-seed.json...');
  const seedData = JSON.parse(fs.readFileSync('data/dev-seed.json', 'utf-8'));
  
  // Filter only valid car listings (exclude spam entries)
  const validListings = seedData.filter((listing: any) => 
    listing.brand && 
    listing.model && 
    listing.year && 
    listing.price > 0 &&
    !listing.title?.includes('FINALISE THE LOAN')
  );
  
  console.log(`📊 Found ${validListings.length} valid listings to import (filtered from ${seedData.length})`);

  let imported = 0;
  let skipped = 0;
  
  // Use a placeholder seller ID for seed data
  const seedSellerId = 'seed-data-seller';
  
  // Map cities to states
  const cityToState: Record<string, string> = {
    'Hyderabad': 'Telangana',
    'Delhi NCR': 'Delhi',
    'Delhi': 'Delhi',
    'Mumbai': 'Maharashtra',
    'Bangalore': 'Karnataka',
    'Chennai': 'Tamil Nadu',
    'Pune': 'Maharashtra',
    'Kolkata': 'West Bengal',
  };

  for (const listing of validListings) {
    try {
      // Determine state from city
      const state = listing.state || cityToState[listing.city] || 'Telangana';
      
      await sql`
        INSERT INTO cars (
          id, seller_id, title, brand, model, year, price, mileage, fuel_type, transmission,
          owners, location, city, state, images, source, listing_source,
          is_verified, is_sold, created_at
        ) VALUES (
          ${listing.id},
          ${seedSellerId},
          ${listing.title},
          ${listing.brand},
          ${listing.model},
          ${listing.year},
          ${listing.price},
          ${listing.mileage},
          ${listing.fuel_type},
          ${listing.transmission},
          ${listing.owners || 1},
          ${listing.location || listing.city},
          ${listing.city || 'Hyderabad'},
          ${state},
          ${listing.images},
          ${listing.portal},
          ${listing.listing_source || 'seed'},
          ${listing.verification_status === 'verified'},
          false,
          ${listing.created_at || new Date().toISOString()}
        )
        ON CONFLICT (id) DO NOTHING
      `;
      imported++;
      if (imported % 50 === 0) {
        console.log(`📥 Imported ${imported} listings...`);
      }
    } catch (error: any) {
      console.log(`⚠️ Skipped ${listing.title}: ${error.message}`);
      skipped++;
    }
  }

  console.log(`✅ Imported ${imported} listings`);
  console.log(`⚠️ Skipped ${skipped} listings`);
  
  const countResult = await sql`SELECT COUNT(*) as count FROM cars`;
  console.log(`📊 Total listings in database: ${countResult[0].count}`);
}

importSeedData().catch(console.error);
