# Judicious Scraping Strategy for CarArth

## Current Situation (Oct 13, 2025)
- **Total Listings**: 329 (last updated: Oct 11, 2025)
- **Data is 2 days old** - needs refresh

## Scraper Status & Cost Analysis

### ✅ FREE & WORKING
1. **CarDekho Scraper** (Node.js - Axios + Cheerio)
   - Cost: FREE
   - Coverage: 192/329 listings (58%)
   - Status: Working but needs debugging
   - **ACTION**: Fix and prioritize

2. **Scheduled Automation** (11 AM & 11 PM IST)
   - Cost: FREE
   - Auto-runs: Twice daily
   - **ACTION**: Keep enabled

### ❌ PAID/BLOCKED - AVOID
1. **Apify OLX** - Free trial expired → $$$
2. **Apify Facebook** - Unreliable (Trust Layer rejects)
3. **Beautiful Soup OLX** - Blocked by anti-bot protection

### ⚠️ USE SPARINGLY
1. **AI-Powered Extraction** (OpenAI/Claude/Gemini)
   - Cost: ~$0.01-0.05 per listing
   - Use only for: Complex/unstructured sources
   - **ACTION**: Reserve for premium sources only

## Recommended Strategy

### Priority 1: Fix CarDekho Scraper (FREE)
- **Why**: Provides 58% of listings at zero cost
- **Action**: Debug why scraped data isn't saving to DB
- **Timeline**: Immediate

### Priority 2: Enable Scheduled Runs (FREE)
- **Why**: Automated, no manual effort
- **Action**: Ensure 11 AM & 11 PM cron jobs work
- **Timeline**: Next scheduled run

### Priority 3: Add OEM Sources (FREE)
- Maruti True Value (41 listings) - already working
- Hyundai H-Promise - needs scraper
- Mahindra First Choice - needs scraper
- **Why**: Official sources = higher quality, no bot blocking

### Priority 4: Explore API Integrations (CONDITIONAL)
- **CarDekho API**: Check if available (free tier)
- **Cars24 API**: Check if available (free tier)
- **Why**: APIs are more reliable than scraping

## Cost Discipline Rules

### 🚫 NEVER DO
1. Pay for Apify or similar services (we have free alternatives)
2. Run AI extraction on bulk data (too expensive)
3. Scrape hourly (excessive, adds no value)

### ✅ ALWAYS DO
1. Cache aggressively (5-minute cache for searches)
2. Use scheduled jobs (twice daily is sufficient)
3. Prefer official sources over marketplaces
4. Monitor scraper health (use existing monitoring)

### 💡 SMART PRACTICES
1. **Deduplication**: Remove duplicates before AI processing
2. **Batch Processing**: Process in chunks, not one-by-one
3. **Fallback Strategy**: Use cached data when scraping fails
4. **Quality over Quantity**: 300 verified listings > 1000 spam listings

## Action Plan (Next Steps)

1. ✅ Install Beautiful Soup (DONE - for future use)
2. 🔧 Debug CarDekho scraper data persistence
3. 📊 Verify scheduled automation works
4. 🎯 Add 1-2 OEM sources (Hyundai, Mahindra)
5. 📈 Monitor & optimize (not expand blindly)

## Monthly Cost Target: $0-5
- Current: ~$0 (only using free tools)
- AI usage: <$5/month (emergency only)
- No paid scraping services

---
**Last Updated**: Oct 13, 2025
**Next Review**: After fixing CarDekho scraper
