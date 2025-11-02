# Production Database Setup Guide

## Quick Start: 2-Step Process

### Step 1: Seed Production Database (Copy 329 listings)

**Option A: Using Replit Shell** (Recommended - 30 seconds)

```bash
# 1. In DEVELOPMENT environment, export data
psql $DATABASE_URL -c "COPY (SELECT * FROM cached_portal_listings) TO STDOUT CSV HEADER" > /tmp/listings.csv

# 2. Switch to PRODUCTION in Replit UI

# 3. Import to production
psql $DATABASE_URL -c "COPY cached_portal_listings FROM STDIN CSV HEADER" < /tmp/listings.csv

# 4. Verify
psql $DATABASE_URL -c "SELECT COUNT(*) FROM cached_portal_listings"
```

**Option B: Using Database Pane** (Manual, 2 minutes)

1. Database Pane → Development → `cached_portal_listings`
2. Select all rows → Copy
3. Switch to Production
4. Paste data → Save

---

### Step 2: Run Fresh Scrapers (Get new listings)

After seeding, trigger scrapers on production to fetch fresh listings:

**Option A: Via Browser Console** (Instant)

1. Open https://cararth.com
2. Press F12 (Developer Tools)
3. Go to Console tab
4. Run:

```javascript
fetch('https://cararth.com/api/run_ingestion', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
.then(r => r.json())
.then(d => console.log('✅ Scrapers started:', d))
```

**Option B: Via cURL** (From Shell)

```bash
curl -X POST https://cararth.com/api/run_ingestion \
  -H "Content-Type: application/json"
```

---

## What Gets Scraped

- **CarDekho**: Hyderabad listings (real photos)
- **OLX**: 5 major cities (Hyderabad, Delhi, Mumbai, Bangalore, Pune)
- **Facebook Marketplace**: Metro areas

**Timeline**: 
- Step 1 (seeding): Instant
- Step 2 (scraping): ~5-10 minutes for completion

**Result**: Production will have 329 existing + fresh scraped listings

---

## Verification

Check production listings count:

```bash
psql $DATABASE_URL -c "SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE has_real_image = true) as real_images FROM cached_portal_listings"
```

Visit https://cararth.com and search for any brand - you should see listings with proper image quality sorting!
