# CarArth News Enhancer 🚀

Automated content generation for CarArth's "Throttle Talk" section using Perplexity AI and authentic Indian automotive data.

## 📋 Overview

This Python script automatically generates fresh, SEO-optimized automotive news articles by:
- 🔍 Searching the web using Perplexity AI's real-time data
- 📊 Incorporating open source data from Kaggle and Data.gov.in
- ✍️ Creating well-structured Markdown articles with citations
- 🔗 Adding backlinks to cararth.com for SEO

## 🚀 Quick Start

### 1. Get Perplexity API Key

**Obtain API key from perplexity.ai:**
1. Visit [https://www.perplexity.ai](https://www.perplexity.ai)
2. Sign up or log in
3. Go to **Settings** → **API** (or directly: https://www.perplexity.ai/settings/api)
4. Click **"Generate New API Key"**
5. Copy your API key

### 2. Setup Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env and add your API key
# PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxxx
```

### 3. Install Dependencies

Dependencies are already installed in this Replit project:
- ✅ `requests` - API calls
- ✅ `pandas` - Data handling
- ✅ `python-dotenv` - Environment variables

### 4. Run the Script

```bash
python3 news_enhancer.py
```

## 📝 Usage

### Interactive Mode

When you run the script, you'll see:

```
==========================================================
CarArth News Enhancer - Automated Content Generation
==========================================================

Available topics:
1. Latest Trends in India's Used Car Market
2. GBP Listings for Indian Dealers - Opportunities and Best Practices
3. Electric Vehicle Revolution in India's Used Car Segment
4. Enter custom topic

Select topic number (or press Enter for topic 1):
```

### Output

The script generates:
- **Markdown file**: `news-article-YYYYMMDD-HHMMSS.md`
- **Log file**: `logs.txt` (for audit trail)

Example output structure:
```markdown
# Latest Trends in India's Used Car Market

**Published:** October 16, 2025 | 12:30 PM IST
**Category:** Automotive News | Market Insights

[AI-generated content with latest 2025 data...]

## Market Data Insights
- Used car market growing at 15% CAGR
- Top selling segments: Hatchback (35%), SUV (28%)
- Digital platforms: 42% of transactions

## Sources & Citations
**Data Sources:** Kaggle Indian Car Market Dataset, Data.gov.in...

**Web Sources:**
1. [Source 1 URL]
2. [Source 2 URL]

**Backlink:** Read more on CarArth
```

## 🛡️ Guardrails & Compliance

### Rate Limiting
- ⏱️ Max 5 API calls per run
- 🕐 1-second delay between calls
- 📊 Call counter with limits

### Data Freshness
- 📅 Queries specify "latest 2025 data"
- 🔍 Flags non-2025 content in logs
- ✅ Validates source dates

### Error Handling
- 📝 All errors logged to `logs.txt`
- 🔄 Graceful fallbacks for missing data
- 🚫 Rejects non-factual content

### Citations
- 🔗 Extracts Perplexity web sources
- ✓ Validates URL formats
- 📚 Includes data.gov.in and Kaggle citations

## 📊 Open Source Data Sources

### Current Sources
1. **Kaggle**: Indian Car Market Dataset
   - Brand analysis
   - Price trends
   - Market segments

2. **Data.gov.in**: Category-wise Automobile Production
   - Production statistics
   - Government verified data
   - Monthly updates

### Adding New Data Sources

To add your own CSV data:
1. Download dataset (e.g., from Kaggle)
2. Save as `indian_car_market.csv` in project root
3. Script will automatically detect and analyze it

## 🧪 Testing

Test with specific topics relevant to CarArth:

```bash
# Test GBP listings (Google Business Profile pilot)
python3 news_enhancer.py
# Select option 2: "GBP Listings for Indian Dealers"

# Test custom topic
python3 news_enhancer.py
# Select option 4 and enter: "Hyderabad Used Car Market Analysis 2025"
```

## 📂 Output Files

| File | Description |
|------|-------------|
| `news-article-*.md` | Generated article (ready for cararth.com/news) |
| `logs.txt` | Activity log for audit |
| `.env` | API configuration (keep secret!) |

## 🔗 Integration with CarArth

### Publishing to Throttle Talk

1. **Manual Upload**:
   - Copy content from generated `.md` file
   - Paste into CarArth admin panel
   - Publish to `/news`

2. **Automated Upload** (Future):
   - Use CarArth API to post directly
   - Schedule with cron jobs
   - Auto-publish to social media

## 🚨 Troubleshooting

### "PERPLEXITY_API_KEY not found"
- Ensure `.env` file exists
- Check API key is uncommented
- Verify key format: `pplx-xxxxx`

### "Rate limit reached"
- Script enforces 5 calls/run
- Wait 1 minute and retry
- Or restart with fresh session

### "No citations found"
- Check internet connection
- Verify Perplexity API status
- Review query formatting

## 📅 Deployment Timeline

**Target:** October 18, 2025 ✅

**Status:** Ready for production use!

## 🤝 Support

For issues or questions:
- Check `logs.txt` for error details
- Review API key configuration
- Contact CarArth development team

---

**CarArth.com** - A unit of Aaro7 Fintech Private Limited  
*Automating automotive content with AI precision* 🚗✨
