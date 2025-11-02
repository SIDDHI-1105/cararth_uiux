-- Quick Production Database Seeding
-- Copy all cached_portal_listings from development to production
--
-- HOW TO USE:
-- 1. Open Replit Shell
-- 2. Make sure you're viewing PRODUCTION environment
-- 3. Run: psql $DATABASE_URL -f scripts/seed-production-simple.sql
--
-- Or manually in Database Pane > Production > SQL Editor:
-- Copy and paste the INSERT statements below

-- First check if production already has data
-- If this returns > 0, you may want to skip importing to avoid duplicates
SELECT COUNT(*) as current_listings FROM cached_portal_listings;

-- If you want to clear existing data first (OPTIONAL):
-- TRUNCATE TABLE cached_portal_listings CASCADE;

-- Since the data is too large for a single script,
-- use this simpler approach via Replit Shell:
-- 
-- Step 1: Export from development
-- psql $DATABASE_URL -c "COPY (SELECT * FROM cached_portal_listings) TO STDOUT CSV HEADER" > /tmp/listings.csv
--
-- Step 2: Switch to production environment in Replit
-- 
-- Step 3: Import to production
-- psql $DATABASE_URL -c "COPY cached_portal_listings FROM STDIN CSV HEADER" < /tmp/listings.csv
--
-- Done! Verify with:
-- psql $DATABASE_URL -c "SELECT COUNT(*) FROM cached_portal_listings"
