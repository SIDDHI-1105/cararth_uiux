/**
 * Production Database Seeding Script
 * 
 * This script copies all cached_portal_listings from development to production.
 * 
 * IMPORTANT: Only run this in PRODUCTION environment!
 * 
 * Usage in Replit:
 * 1. Open the Shell
 * 2. Run: NODE_ENV=production tsx scripts/seed-production-db.ts
 */

import { neon } from '@neondatabase/serverless';

async function seedProductionDatabase() {
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  console.log('🚀 Starting production database seeding...');
  console.log(`📊 Target database: ${DATABASE_URL.split('@')[1]?.split('/')[0]}`);

  const sql = neon(DATABASE_URL);

  try {
    // Check current listing count
    const countResult = await sql`SELECT COUNT(*) as count FROM cached_portal_listings`;
    const currentCount = parseInt(countResult[0].count);
    
    console.log(`📋 Current listings in production: ${currentCount}`);
    
    if (currentCount > 0) {
      console.log('⚠️  Production database already has listings.');
      console.log('⚠️  This script will SKIP seeding to avoid duplicates.');
      console.log('⚠️  If you want to re-seed, manually truncate the table first.');
      return;
    }

    // Fetch all listings from development (you'll need to provide these)
    console.log('📥 Fetching development data...');
    
    // Note: This is a placeholder - you need to export data from development first
    console.log('');
    console.log('❌ ERROR: No development data available to seed');
    console.log('');
    console.log('MANUAL STEPS REQUIRED:');
    console.log('1. In Development environment, run:');
    console.log('   tsx scripts/export-dev-data.ts > dev-listings.json');
    console.log('2. Copy the dev-listings.json file');
    console.log('3. Import it to production using this script');
    console.log('');
    console.log('Alternatively, use the Database Pane to manually export/import.');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedProductionDatabase();
