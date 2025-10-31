# Throttle Talk Automated Content Generator

Automated news article generation system for CarArth's Throttle Talk feed. Runs twice daily at **9:00 AM and 9:00 PM IST**.

## Features

- **Dual-LLM System**: Perplexity API (primary) → xAI Grok (fallback)
- **Deduplication**: 85% similarity check against last 14 days of posts
- **Source Validation**: Ensures all numeric claims are properly cited
- **Exponential Backoff**: Automatic retry with backoff on API failures
- **Rate Limiting**: Respects API rate limits (1 req/sec)
- **Dry-Run Mode**: Test without publishing
- **Structured Logging**: Console + file logging with timestamps

## Required Secrets

Configure these in **Replit Secrets** (or environment variables):

| Secret Name | Description | Required | Example |
|-------------|-------------|----------|---------|
| `PERPLEXITY_API_KEY` | Perplexity API key | ✅ Yes | `pplx-abc123...` |
| `XAI_API_KEY` or `GROK_API_KEY` | xAI Grok API key | ✅ Yes | `xai-abc123...` |
| `CMS_ENDPOINT` | CarArth CMS URL | No (defaults to https://www.cararth.com) | `https://www.cararth.com` |
| `CMS_API_KEY` | API key for CMS authentication | ⚠️  Optional | `cms-abc123...` |
| `ALERT_WEBHOOK` | Webhook URL for error alerts | No | `https://hooks.slack.com/...` |
| `NEWS_LOOKBACK_DAYS` | Days to check for duplicates | No (default: 14) | `14` |

## Usage

### Local Testing (Dry-Run)

Test the script without publishing:

```bash
cd scripts
npm run throttle-talk:dry-run
# or
tsx throttle-talk-automation.ts --dry-run
```

### Live Execution

Run the script in live mode (publishes to CMS):

```bash
cd scripts
npm run throttle-talk
# or
tsx throttle-talk-automation.ts
```

### Scheduled Execution

The script is automatically run twice daily via GitHub Actions:
- **9:00 AM IST** (3:30 AM UTC)
- **9:00 PM IST** (3:30 PM UTC)

See `.github/workflows/throttle-talk.yml` for the cron configuration.

## Output Format

The script generates articles in this exact Markdown format:

```markdown
# India Used Car Market Grows 15.5% YoY
by Perplexity AI | Category: Market Insights | Date: 31/10/2025

### 📈 Summary:
3–5 sentences summarizing top developments...

### 🔍 Data Highlights:
- 📊 Market Size: ₹XXB (SIAM Report)
- 🚗 Used/New Ratio: X.Xx (source)
- ⚡ EV Listings: +X% YoY (source)
- 🏢 Top OEM: [OEM Name] (source)

### 💡 AI Insight:
3–4 sentences synthesizing implications...

### ✅ Actionable Recommendations:
- 🎯 Dealer: short recommendation
- 🔋 Seller: short recommendation
- 🏎️ Buyer: short recommendation

### 📚 Sources:
- Source 1 — https://example.com/source1
- Source 2 — https://example.com/source2
- Source 3 — https://example.com/source3

All data reflects the most recent updates available from verified sources.
```

## Logging

Logs are written to:
- **Console**: Real-time stdout
- **File**: `scripts/throttletalk.log`

Log format: `[ISO-Timestamp] [LEVEL] Message`

Example:
```
[2025-10-31T09:00:00.000Z] [INFO] Throttle Talk automation started
[2025-10-31T09:00:02.500Z] [SUCCESS] Perplexity API response received (1234 chars)
[2025-10-31T09:00:05.100Z] [SUCCESS] Article published successfully
```

## Deduplication Logic

The script compares new article titles and first 80 characters against posts from the last 14 days:
- **Similarity threshold**: 85%
- **Algorithm**: Levenshtein distance
- **Action on duplicate**: Skip publication and log warning

## Error Handling

### Retry Strategy
- **Max retries**: 5 attempts
- **Initial backoff**: 2 seconds
- **Backoff multiplier**: Exponential (2s → 4s → 8s → 16s → 32s)

### Fallback Chain
1. Try Perplexity API (with retries)
2. If fails → Try xAI Grok (with retries)
3. If both fail → Send alert webhook & abort

### Alert Webhook
If `ALERT_WEBHOOK` is configured, the script sends error details on critical failures:

```json
{
  "error": "Content generation failed",
  "perplexityError": "API timeout",
  "grokError": "Rate limit exceeded",
  "timestamp": "2025-10-31T09:00:00.000Z"
}
```

## API Endpoints

### CMS Publish Endpoint
**POST** `${CMS_ENDPOINT}/api/news`

Headers:
```json
{
  "Authorization": "Bearer ${CMS_API_KEY}",
  "Content-Type": "application/json"
}
```

Payload:
```json
{
  "title": "Article Title",
  "byline": "Perplexity AI",
  "category": "Market Insights",
  "date": "31/10/2025",
  "markdown": "# Full markdown content...",
  "sources": ["https://...", "https://..."],
  "tags": ["Market Data", "Used Cars", "Throttle Talk"]
}
```

### Recent Posts Endpoint (for deduplication)
**GET** `${CMS_ENDPOINT}/api/news?from=YYYY-MM-DD&limit=100`

Returns:
```json
[
  {
    "title": "Post Title",
    "content": "Post content...",
    "createdAt": "2025-10-31T09:00:00.000Z"
  }
]
```

## Troubleshooting

### Script fails to fetch recent posts
**Error**: `Failed to fetch recent posts: 404 Not Found`

**Solution**: Ensure the `/api/news` GET endpoint exists on your CMS.

### Perplexity/Grok API errors
**Error**: `Perplexity API error 401: Unauthorized`

**Solution**: Check that `PERPLEXITY_API_KEY` or `XAI_API_KEY` is correctly set in Replit Secrets.

### Duplicate detection too sensitive
**Error**: All articles marked as duplicates

**Solution**: Reduce lookback days: Set `NEWS_LOOKBACK_DAYS=7` instead of default 14.

### No articles published
**Check**:
1. Run in dry-run mode: `npm run throttle-talk:dry-run`
2. Check logs: `cat scripts/throttletalk.log`
3. Verify API keys are set
4. Ensure CMS endpoint is accessible

## Development

### Add to package.json scripts
```json
{
  "scripts": {
    "throttle-talk": "tsx scripts/throttle-talk-automation.ts",
    "throttle-talk:dry-run": "tsx scripts/throttle-talk-automation.ts --dry-run"
  }
}
```

### Manual Testing
```bash
# Test article generation only (no publish)
tsx scripts/throttle-talk-automation.ts --dry-run

# Test full pipeline (with publish)
tsx scripts/throttle-talk-automation.ts
```

## Monitoring

Monitor the automation in:
1. **GitHub Actions**: Check workflow runs at https://github.com/your-repo/actions
2. **Log file**: `tail -f scripts/throttletalk.log`
3. **CMS**: Verify articles appear in Throttle Talk feed

## License

Internal CarArth automation tool. Not for redistribution.
