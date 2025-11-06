# Production Deployment Guide - CarArth.com

## Current Status
**Ready for Production with External API Top-ups Required**

### ✅ Production-Ready Features
- Advanced search & filtering system
- Dealer inventory management (Quick Add + Bulk CSV upload)
- Google Vehicle Feed (RSS/XML) generation
- Project AETHER (SEO/GEO monitoring & analytics)
- Throttle Talk (News & Community platform)
- City landing pages (6 major cities)
- Market intelligence & analytics
- User authentication & session management
- Database schema & migrations
- Auto-SEO content generation
- Topic Explorer & Content Strategy interface

### ⚠️ External Dependencies Requiring Setup

#### Critical (Blocking Core Features)
1. **Anthropic Claude API** - CREDITS DEPLETED
   - **Impact**: Blocks Trust Layer validation for ALL listing ingestion
   - **Required for**: Copyright analysis, PII detection, content moderation
   - **Action**: Add credits to Anthropic account
   - **Secret**: `ANTHROPIC_API_KEY` (already configured)

2. **Apify OLX Actor** - FREE TRIAL EXPIRED
   - **Impact**: Cannot scrape OLX listings
   - **Required for**: OLX marketplace aggregation
   - **Action**: Subscribe to paid Apify plan and rent the OLX actor
   - **Secret**: `APIFY_API_TOKEN` (already configured)

#### Optional (Enhanced Features)
3. **Google Search Console** - Mock data fallback active
   - **Impact**: AETHER uses mock data instead of real search performance metrics
   - **Action**: Set up service account and grant GSC access
   - **Secrets**: `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`, `GOOGLE_SEARCH_CONSOLE_SITE_URL`

4. **Google Analytics 4** - Mock data fallback active
   - **Impact**: AETHER uses mock data instead of real user behavior metrics
   - **Action**: Set up service account and grant GA4 access
   - **Secrets**: `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`, `GOOGLE_GA4_PROPERTY_ID`

5. **Facebook Marketplace Scraper**
   - **Status**: Functional but listings rejected due to Claude credit issue
   - **Action**: Once Claude credits added, scraper will work automatically

## Required Environment Secrets

### Already Configured ✓
- `APIFY_API_TOKEN` - Apify platform access
- `FACEBOOK_ACCESS_TOKEN` - Facebook Graph API
- `FACEBOOK_APP_ID` - Facebook OAuth
- `FACEBOOK_APP_SECRET` - Facebook OAuth
- `GROK_API_KEY` - xAI Grok (market intelligence & UGC moderation)
- `TWILIO_ACCOUNT_SID` - WhatsApp notifications
- `TWILIO_AUTH_TOKEN` - WhatsApp notifications
- `TWILIO_WHATSAPP_NUMBER` - WhatsApp sender number

### Required for Production (Currently Missing)
```bash
# Google Services (for AETHER real data)
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SEARCH_CONSOLE_SITE_URL=https://cararth.com
GOOGLE_GA4_PROPERTY_ID=123456789

# Optional: Facebook Catalog (for automotive feed)
FACEBOOK_CATALOG_ID=your-catalog-id

# Optional: LinkedIn (for content distribution)
LINKEDIN_ACCESS_TOKEN=your-token
LINKEDIN_CLIENT_ID=your-client-id
LINKEDIN_CLIENT_SECRET=your-secret

# Optional: OLX API (alternative to Apify scraper)
OLX_CLIENT_ID=your-client-id
OLX_CLIENT_SECRET=your-secret

# Optional: Redis (for enhanced caching)
REDIS_URL=redis://user:password@host:port
```

## Database Configuration
**Status**: ✅ PostgreSQL (Neon) configured and operational

Current tables:
- Users & authentication
- Cars & dealer vehicles
- Community posts & news articles
- AETHER monitoring data
- Dealer inventory & validation reports
- Market intelligence data

**Migration Strategy**: Using Drizzle ORM with `npm run db:push`

## Pre-Production Test Results

### Core Features Status
| Feature | Status | Notes |
|---------|--------|-------|
| Car Search & Filtering | ✅ Working | Empty database, infrastructure ready |
| Dealer Dashboard | ✅ Working | Routes configured, UI operational |
| Google Vehicle Feed | ✅ Working | Generating valid RSS/XML (0 listings currently) |
| AETHER Dashboard | ✅ Working | All tabs load correctly, mock data mode |
| Throttle Talk News | ✅ Working | 10+ articles, CarArth Team attribution |
| City Landing Pages | ✅ Working | 6 cities configured |
| User Authentication | ✅ Working | Session management operational |
| Scraper Infrastructure | ⚠️ Blocked | CarDekho works, OLX/Facebook need API credits |

### API Health Check
- Overall Status: **Warning** (AI services idle due to credit issues)
- Database: **Healthy** (PostgreSQL connected)
- Perplexity: **Healthy** (0 requests, ready for use)
- Claude: **Idle** (0 analyses, credits needed)
- Firecrawl MCP: **Idle** (ready for use)

## Production Deployment Checklist

### Phase 1: External API Setup
- [ ] Add Anthropic Claude credits (CRITICAL)
- [ ] Subscribe to Apify paid plan and rent OLX actor (CRITICAL)
- [ ] Set up Google Service Account for GSC/GA4 (OPTIONAL)
- [ ] Configure Google Search Console access (OPTIONAL)
- [ ] Configure Google Analytics 4 access (OPTIONAL)

### Phase 2: Configuration
- [ ] Set production domain in environment (cararth.com)
- [ ] Update sitemap.xml canonical URLs (remove www prefix if needed)
- [ ] Configure CORS for production domain
- [ ] Set up SSL/TLS certificates (Replit handles this automatically)
- [ ] Configure production logging level

### Phase 3: Data Seeding
- [ ] Run initial scraper sweep (CarDekho, OLX, Facebook Marketplace)
- [ ] Verify Trust Layer validation working with Claude
- [ ] Check listing quality scores and image ranking
- [ ] Validate Google Vehicle Feed exports

### Phase 4: Monitoring & Observability
- [ ] Enable AETHER cron jobs:
  - `AETHER_CRON_ENABLED=true` (weekly GEO sweeps)
  - `AETHER_BENCHMARK_CRON_ENABLED=true` (nightly competitive analysis)
  - `AETHER_CONTENT_CRON_ENABLED=true` (nightly impact tracking)
- [ ] Set up error alerting (use existing logging infrastructure)
- [ ] Configure database backups (Neon handles automatically)
- [ ] Set up uptime monitoring (Replit provides built-in monitoring)

### Phase 5: Performance Optimization
- [ ] Review cache hit rates after initial data load
- [ ] Optimize slow queries (use database query logs)
- [ ] Configure CDN for static assets (object storage integration)
- [ ] Enable response compression (already in Express)

### Phase 6: Security Hardening
- [ ] Review RBAC permissions (admin routes already protected)
- [ ] Audit API rate limiting (dealer upload limits configured)
- [ ] Verify secret rotation policies
- [ ] Check session security settings (configured with connect-pg-simple)

### Phase 7: Go Live
- [ ] Switch from development to production mode (`NODE_ENV=production`)
- [ ] Update Replit deployment settings
- [ ] Run smoke tests on production URL
- [ ] Monitor error rates and performance
- [ ] Enable production analytics

## Post-Deployment Monitoring

### Key Metrics to Watch
1. **Scraper Health**
   - Daily successful ingestion rate
   - Retry queue depth
   - Trust Layer rejection rate

2. **User Engagement**
   - Search queries per day
   - Listing views
   - Contact form submissions
   - Community post engagement

3. **SEO/GEO Performance**
   - AETHER GEO mention rate (target: >30%)
   - Google Search Console impressions/clicks
   - Organic traffic growth
   - Featured snippet wins

4. **System Health**
   - API response times (target: <500ms p95)
   - Database connection pool utilization
   - Cache hit rates (target: >80%)
   - Error rates (target: <0.1%)

## Rollback Plan
If issues arise post-deployment:
1. Use Replit's built-in checkpoint/rollback feature
2. Database state is preserved (Neon provides point-in-time recovery)
3. Revert to previous deployment with one click
4. All secrets and configuration preserved

## Known Limitations & Future Work

### Current Limitations
1. **Listing Data**: Database currently empty, needs initial scraper run
2. **AI Credits**: Claude credits depleted, affects all listing ingestion
3. **OLX Scraper**: Requires paid Apify subscription
4. **GSC/GA4**: Using mock data in AETHER (real data needs service account setup)

### Future Enhancements
1. **WhatsApp Integration**: Twilio configured but not fully integrated in buyer flow
2. **LinkedIn Syndication**: Credentials needed for automatic post distribution
3. **Facebook Catalog**: Auto-sync dealer inventory to Facebook Marketplace
4. **Redis Caching**: Optional upgrade for enhanced performance
5. **Multi-city Expansion**: Add more city landing pages beyond current 6

## Support & Troubleshooting

### Common Issues

**Issue**: Scrapers not ingesting listings
- **Check**: Anthropic Claude credits available?
- **Check**: Apify API token valid and actor rented?
- **Solution**: Top up credits or subscribe to paid plan

**Issue**: AETHER showing empty data
- **Check**: Has initial GEO sweep been run?
- **Check**: Are GSC/GA4 credentials configured?
- **Solution**: Run manual sweep or configure real data sources

**Issue**: Google Vehicle Feed empty
- **Check**: Are dealer vehicles uploaded and approved?
- **Solution**: Use dealer dashboard to add inventory

**Issue**: Search returns 0 results
- **Check**: Has initial scraper run completed?
- **Solution**: Trigger manual ingestion via /api/run_ingestion endpoint

## Architecture Notes

### Database
- **Provider**: Neon (Serverless PostgreSQL)
- **ORM**: Drizzle
- **Migrations**: `npm run db:push` (no manual SQL)
- **Backup**: Automatic (handled by Neon)

### Caching Strategy
- **In-memory**: Advanced caching system with TTL
- **Cache invalidation**: Automatic on data updates
- **Optional Redis**: For distributed caching (not required)

### AI Service Architecture
- **Multi-LLM**: OpenAI, Gemini, Claude, Perplexity, Grok
- **Cost Optimization**: Batch processing, shadow modes, rate limiting
- **Fallback**: Mock data for non-critical services

### Deployment Platform
- **Host**: Replit (managed Node.js runtime)
- **Port**: 5000 (Express + Vite on same port)
- **Domain**: Will be *.repl.co or custom domain
- **SSL**: Automatic (Replit managed)

## Contact & Escalation
For production issues or questions:
- Check logs: Use Replit's built-in log viewer
- Database: Access via Replit's database pane
- Rollback: Use checkpoint system in Replit UI
