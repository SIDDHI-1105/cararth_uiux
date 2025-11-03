# ÆTHER Production System - Setup & Usage Guide

## Overview

ÆTHER (Adaptive Engine for Trust, Heuristics & Evolving Rankings) is CarArth's production-ready lab prototype for SEO/GEO monitoring and market intelligence. The system provides:

- **GEO Sweep Monitoring**: Track CarArth mentions in AI responses vs competitors
- **SEO Structural Audits**: Analyze site health with scoring  
- **Content Brief Generation**: AI-powered content briefs with India-specific keywords
- **Experiments System**: A/B testing for content effectiveness
- **Learning Weights**: Self-improving prompt selection based on performance

## Architecture

```
├── server/lib/aether/          # Core production libraries
│   ├── openaiClient.js         # LLM client with retry & mocks
│   ├── cacheLayer.js           # Prompt-hash based caching
│   ├── tokenBudget.js          # Daily token cap enforcement
│   ├── vectorStore.js          # JSON-backed vector search
│   ├── scheduler.js            # Cron jobs & initial sweep
│   ├── aetherLearn.js          # Exponential smoothing weights
│   ├── experimentsService.js   # A/B testing engine
│   ├── productionService.js    # Main service orchestration
│   ├── routes.js               # API endpoints
│   ├── rbacMiddleware.js       # Admin auth enforcement
│   └── initialize.js           # System initialization
├── data/aether/                # Persistent storage
│   ├── prompts.json            # 100 seed prompts
│   ├── sweeps.json             # Append-only sweep logs
│   ├── experiments.json        # Experiment results
│   ├── weights.json            # Learning weights
│   ├── briefs/                 # Generated content briefs
│   ├── agent.log               # Structured activity log
│   ├── error.log               # Error tracking
│   ├── token_usage.log         # LLM token consumption
│   └── .initial_sweep.lock     # First-run marker
└── .aether_cache/              # LLM response cache (hash-keyed)
```

## Environment Variables

### Required
- `OPENAI_API_KEY` (optional) - OpenAI API key. If absent, uses deterministic mocks

### Optional Configuration
- `AETHER_DAILY_TOKEN_CAP` - Max tokens per day (default: `20000`)
- `AETHER_MAX_TOKENS_PER_PROMPT` - Max per request (default: `1200`)
- `AETHER_CRON_ENABLED` - Enable weekly sweeps (default: `false`)
- `AETHER_ADMIN_KEY` - Secret for CI/scripted access (header: `x-aether-admin-key`)
- `DOMAIN` - Base domain (default: `https://www.cararth.com`)
- `NODE_ENV` - Environment (default: `development`)

## Setup

### 1. Install Dependencies
```bash
npm install
# Already includes: node-cron, openai
```

### 2. Configure Secrets
```bash
# Option A: Use OpenAI for real sweeps
export OPENAI_API_KEY="sk-..."

# Option B: Use mocks (no key needed)
# System auto-switches to deterministic mocks when OPENAI_API_KEY is absent
```

### 3. Set Token Budget (Optional)
```bash
# Limit daily spend
export AETHER_DAILY_TOKEN_CAP=20000
```

### 4. Start Server
```bash
npm run dev
# AETHER initializes automatically on startup
```

## Initial Sweep

The system runs an **initial sweep** once on first startup:
- Uses 3 demo prompts from `data/aether/prompts.json`
- Creates `/data/demo-sweep.json` snapshot
- Sets lock file: `/data/aether/.initial_sweep.lock`

To **re-run** initial sweep:
```bash
# Clear lock file
rm data/aether/.initial_sweep.lock

# Restart server (sweep runs automatically)
npm run dev
```

Or use API:
```bash
curl -X POST http://localhost:5000/api/aether/scheduler/clear-lock \
  -H "x-aether-admin-key: YOUR_KEY"

curl -X POST http://localhost:5000/api/aether/scheduler/run-initial-sweep \
  -H "x-aether-admin-key: YOUR_KEY"
```

## API Endpoints

### Authentication
All endpoints (except `/health`) require **admin auth**:
- **Option A**: Login as admin user (via UI)
- **Option B**: Set `x-aether-admin-key` header with `AETHER_ADMIN_KEY` value

### Core Endpoints

#### Health Check (Public)
```bash
GET /api/aether/health
```
Returns:
```json
{
  "ok": true,
  "timestamp": "2025-11-02T18:22:00.000Z",
  "tokenBudget": { "cap": 20000, "used": 1234, "remaining": 18766 },
  "cache": { "hits": 5, "misses": 3, "hitRate": "62.5%" },
  "vectorStore": { "totalVectors": 0 },
  "mockMode": false
}
```

#### Run GEO Sweep
```bash
POST /api/aether/sweep
Content-Type: application/json

{
  "promptText": "Best used car search engines in India",
  "promptCategory": "general_search",
  "model": "gpt-4o-mini"
}
```

#### Get Sweep by ID
```bash
GET /api/aether/sweep/{id}
```

#### Get Recent Sweeps
```bash
GET /api/aether/sweeps?limit=100
```

#### Get Sweep Statistics
```bash
GET /api/aether/sweeps/stats
```

#### Run Batch Sweeps
```bash
POST /api/aether/sweeps/batch
Content-Type: application/json

{
  "prompts": [
    { "text": "...", "category": "general_search" },
    { "text": "...", "category": "trust_safety" }
  ]
}
```

#### Generate Content Brief
```bash
POST /api/aether/content
Content-Type: application/json

{
  "topic": "Best used cars under 5 lakhs in India",
  "targetKeywords": ["used cars india", "cheap cars", "hyderabad"],
  "contentType": "article"
}
```

#### Create Experiment (Fast-Forward)
```bash
POST /api/aether/experiment
Content-Type: application/json

{
  "page": "/used-cars-hyderabad",
  "kpis": { "geo_delta": 15, "organic_pct": 8 },
  "duration_days": 0,
  "metadata": { "promptId": "demo_1", "category": "general_search" }
}
```

#### Get Experiments
```bash
GET /api/aether/experiments?status=completed&limit=50
```

#### Cache Statistics
```bash
GET /api/aether/cache/stats
```

#### Token Budget Status
```bash
GET /api/aether/budget/stats
```

#### Set Daily Cap
```bash
POST /api/aether/budget/set-cap
Content-Type: application/json

{
  "cap": 50000
}
```

## Caching System

### How it Works
1. **Hash-based keys**: `sha256(prompt + model + temperature)`
2. **Location**: `.aether_cache/{hash}.json`
3. **TTL**: Permanent (manual clear only)
4. **Benefit**: Eliminates duplicate LLM calls

### Clear Cache
```bash
POST /api/aether/cache/clear
```

### Cache Hit Rate
```bash
GET /api/aether/cache/stats
# Returns: { hits: 10, misses: 5, hitRate: "66.67%" }
```

## Token Budget Enforcement

### Daily Cap Logic
- Tracks usage in `/data/aether/token_usage.log`
- Resets at midnight UTC
- Rejects requests when cap exceeded
- Logs rejections to `/data/aether/cost_control.log`

### Check Remaining Budget
```bash
curl http://localhost:5000/api/aether/budget/stats
```

Returns:
```json
{
  "dailyCap": 20000,
  "tokensUsed": 1234,
  "tokensRemaining": 18766,
  "usagePercentage": "6.17%",
  "resetTime": "5h 38m",
  "breakdown": {
    "operations": [
      { "operation": "chat_completion", "count": 3, "tokens": 1200, "cost": 0.000234 }
    ],
    "totalTokens": 1234,
    "totalCost": "0.000234"
  }
}
```

## Mock Mode (No OpenAI Key)

When `OPENAI_API_KEY` is **not set**:
- System uses **deterministic mocks**
- Responses based on `sha256(prompt)` hash
- Consistent results for same prompts
- Zero API cost
- Still logs tokens (mock values)

**Example**: Hash ending in `0-4 mod 5` → CarArth mentioned = `true`

## Switching from Mock to Production

### Step 1: Add OpenAI Key
```bash
export OPENAI_API_KEY="sk-..."
```

### Step 2: Clear Cache (Optional)
```bash
curl -X POST http://localhost:5000/api/aether/cache/clear
```

### Step 3: Restart Server
```bash
npm run dev
```

System automatically detects key and switches to real OpenAI calls.

## Experiments System

### Create Fast-Forward Experiment
```javascript
{
  "page": "/used-cars-hyderabad",
  "kpis": {
    "geo_delta": 15,      // -100 to +100 (improvement in GEO mention rate)
    "organic_pct": 8      // 0 to 100 (organic traffic improvement %)
  },
  "duration_days": 0,     // 0 = instant evaluation
  "metadata": {
    "promptId": "demo_1",
    "category": "general_search"
  }
}
```

### Performance Score Calculation
```
geoScore = (geo_delta + 100) / 200       # Normalize to 0-1
organicScore = organic_pct / 100          # Normalize to 0-1
performanceScore = (geoScore * 0.6) + (organicScore * 0.4)
```

### Weight Updates
Experiments with `performanceScore >= 0.6` trigger weight updates:
```
new_weight = (1 - α) * old_weight + α * performanceScore
```
where `α` = learning rate (default: `0.1`)

## Logging

### Structured Logs
- **agent.log**: All operations with correlation IDs
- **error.log**: Errors with stack traces
- **token_usage.log**: Per-call token consumption
- **cost_control.log**: Budget rejections

### Log Format
```json
{
  "timestamp": "2025-11-02T18:22:00.000Z",
  "level": "info",
  "message": "GEO sweep completed",
  "correlationId": "uuid-here",
  "duration": 1234,
  "cararthMentioned": true
}
```

## Troubleshooting

### Issue: "Budget exceeded" errors
**Solution**: Check and increase daily cap
```bash
curl -X POST http://localhost:5000/api/aether/budget/set-cap \
  -H "Content-Type: application/json" \
  -d '{"cap": 50000}'
```

### Issue: Sweeps not caching
**Check**: Ensure `.aether_cache/` directory exists and is writable
```bash
mkdir -p .aether_cache
chmod 755 .aether_cache
```

### Issue: Initial sweep keeps running
**Solution**: Check lock file
```bash
cat data/aether/.initial_sweep.lock
# If corrupt, delete and restart
rm data/aether/.initial_sweep.lock
```

### Issue: 401/403 on API calls
**Solution**: Add admin key header
```bash
curl -H "x-aether-admin-key: YOUR_SECRET" http://localhost:5000/api/aether/health
```

## Next Steps: Lab → Staging

To move AETHER to staging environment:

1. **Replace Mocks with Real Services**
   - Connect Google Search Console API
   - Integrate Milvus/pgvector for production vector store
   - Add GA4 for real experiment metrics

2. **Enable Cron Jobs**
   ```bash
   export AETHER_CRON_ENABLED=true
   # Runs weekly sweeps every Sunday 2 AM UTC
   ```

3. **Scale Token Budget**
   ```bash
   export AETHER_DAILY_TOKEN_CAP=100000
   ```

4. **Production Monitoring**
   - Monitor `/api/aether/health` endpoint
   - Set alerts on token usage
   - Track cache hit rate for cost optimization

5. **Database Migration**
   - Move from JSON files to PostgreSQL
   - Keep existing file-based system as backup

## Frontend Access

Navigate to: **http://localhost:5000/admin/aether**

Dashboard shows:
- ✅ GEO visibility scans
- ✅ SEO structural audits  
- ✅ Content brief generation
- ✅ System health metrics
- ✅ Token budget status
- ✅ Cache performance

## SEO Structural Audits

ÆTHER includes a comprehensive SEO audit system that analyzes your site's technical health across multiple dimensions.

### Architecture

The audit system consists of:
- **Audit Engine**: Orchestrates modular checkers with timeout protection
- **5 Checker Modules**: Indexability, Schema, Content Semantics, Performance, GEO Correlation
- **Weighted Scoring**: Configurable category weights for overall health score
- **Impact Matrix**: Ranked issue prioritization by severity × impact × pages affected
- **PDF Reports**: Downloadable audit summaries with actionable recommendations

### Running Audits

#### Via API
```bash
# Start new audit
curl -X POST http://localhost:5000/api/aether/audit/run \
  -H "Content-Type: application/json" \
  -H "x-aether-admin-key: $AETHER_ADMIN_KEY" \
  -d '{"url": "https://cararth.com"}'

# Get audit results
curl http://localhost:5000/api/aether/audit/audit_20251103_123456_a1b2

# Download PDF report
curl http://localhost:5000/api/aether/audit/audit_20251103_123456_a1b2/report.pdf \
  -o audit_report.pdf

# List recent audits
curl http://localhost:5000/api/aether/audits
```

#### Via UI
Navigate to `/admin/aether` → "Structural Audit" tab:
1. Enter target URL
2. Select audit modules (or run all)
3. Click "Run Audit"
4. View results with filterable issue list
5. Download PDF report

### Audit Modules

#### 1. Indexability (Weight: 30%)
- Validates robots.txt configuration
- Checks sitemap.xml structure and accessibility
- Detects canonical URLs and noindex directives
- Identifies crawl blockers

#### 2. Schema Markup (Weight: 25%)
- Detects JSON-LD structured data
- Validates Vehicle, Organization, LocalBusiness schemas
- Checks for missing or incomplete schema
- Provides schema.org implementation guidance

#### 3. Content Semantics (Weight: 20%)
- Analyzes readability scores
- Calculates keyword density
- Extracts key entities
- Uses deterministic heuristics (no external API required)

#### 4. Performance (Weight: 15%)
- Mock Lighthouse scores (FCP, LCP, CLS, TBT)
- Deterministic scoring based on URL patterns
- Identifies performance bottlenecks

#### 5. GEO Correlation (Weight: 10%)
- Correlates SEO issues with AI mention rates
- Reads from existing sweep data in `data/aether/sweeps.json`
- Uses Pearson correlation to identify impact
- Falls back to mocks if no sweep data exists

### Scoring System

Overall audit score (0-100) is calculated using weighted category scores:

```javascript
score = 
  indexability_score × 0.30 +
  schema_score × 0.25 +
  content_score × 0.20 +
  performance_score × 0.15 +
  geo_score × 0.10
```

Severity weights for issue prioritization:
- **Critical**: 1.0 (major blocker, fix immediately)
- **High**: 0.7 (significant impact, fix soon)
- **Medium**: 0.4 (moderate impact, plan fix)
- **Low**: 0.1 (minor issue, nice to have)

### Data Storage

Audit results are persisted in two locations:
- **Registry**: `data/aether/audits.json` (append-only list)
- **Individual Audits**: `data/aether/audits/{audit_id}.json`

### Testing Audits Locally

```bash
# Run all audit tests
cd server/test/aether
node runTests.js

# Run individual test suites
node auditEngine.test.js
node schemaChecker.test.js
node indexabilityChecker.test.js
node rbac.test.js
```

### Configuration

Audit weights can be customized in `server/config/auditWeights.json`:

```json
{
  "weights": {
    "indexability": 0.30,
    "schema": 0.25,
    "content": 0.20,
    "performance": 0.15,
    "geo": 0.10
  },
  "severityWeights": {
    "critical": 1.0,
    "high": 0.7,
    "medium": 0.4,
    "low": 0.1
  }
}
```

### Token Budget Integration

Audits respect the same token budget as sweeps:
- If `AETHER_DAILY_TOKEN_CAP` is reached, audit switches to deterministic mocks
- All mock usage is logged to `data/aether/agent.log`
- No external API calls made when in mock mode

### Correlation IDs

Every audit run receives a unique correlation ID for tracing:
- Logged in `data/aether/agent.log`
- Included in audit JSON response
- Used for debugging and performance analysis

## Support

For issues, check:
1. `/data/aether/error.log` - Error details
2. `/data/aether/agent.log` - Operation history
3. `GET /api/aether/health` - System status

## License

Proprietary - CarArth Internal Use Only
