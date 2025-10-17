# Automated Data Import Guide

## Overview

The system now features **fully automated data import** - no manual CSV downloads required!

### What's Automated
✅ **Telangana RTA Data** - Scrapes directly from Open Data Portal API  
✅ **SIAM National Data** - Scrapes from press release pages  
✅ **Scheduled Imports** - Runs automatically on 5th of each month  

## Quick Start

### 1. One-Time Setup

Go to `/admin/import-data` → **Automated** tab:

1. Enter the **Telangana RTA Resource ID**:
   - Visit: https://data.telangana.gov.in/dataset/regional-transport-authority-vehicle-registrations-data
   - Look for "API" or dataset URL
   - Resource ID format: `cc9950ce-89aa-455b-847b-d87756db8f91`

2. Click **"Save Configuration"**

### 2. Run Import

**Option A: Import Latest Month (Recommended)**
- Click **"Run Automated Import (Latest Month)"**
- System automatically:
  - Fetches latest Telangana RTA data via API
  - Scrapes latest SIAM press release
  - Imports both into database

**Option B: Import Specific Month**
- Select month and year
- Click **"Import [Month]/[Year]"**
- System fetches data for that specific period

## How It Works

### Telangana RTA Scraper
- **Source**: Telangana Open Data Portal REST API
- **Method**: Direct API calls (no HTML parsing)
- **Data Flow**:
  1. Queries API with month/year filters
  2. Paginates through all results (1000 records/batch)
  3. Filters to target month locally
  4. Converts to CSV format
  5. Imports via existing CSV service (with brand normalization)

### SIAM Press Release Scraper
- **Source**: https://www.siam.in/press-release.aspx
- **Method**: Web scraping with pattern matching
- **Data Flow**:
  1. Fetches press release list page
  2. Finds latest release or searches by month/year
  3. Extracts PV sales number from text
  4. Distributes across OEMs using market share
  5. Imports to database

## Scheduled Automation

### Cron Schedule
- **Runs**: 5th of each month at 2:00 AM IST
- **Why 5th?**: Most data portals update by month start
- **What it does**:
  - Auto-imports previous month data
  - Logs results to console

### API Endpoints

**Start Scheduled Imports:**
```
POST /api/admin/auto-import/schedule/start
```

**Stop Scheduled Imports:**
```
POST /api/admin/auto-import/schedule/stop
```

**Manual Trigger (Latest Month):**
```
POST /api/admin/auto-import/run-latest
```

**Manual Trigger (Specific Month):**
```
POST /api/admin/auto-import/run-month
Body: { "month": 9, "year": 2025 }
```

## Error Handling

### Common Issues

**1. Resource ID Not Configured**
```
Error: Telangana resource ID not configured
```
**Solution**: Enter Resource ID in Automated tab

**2. No Data Found**
```
Telangana: No records found for 9/2025
```
**Solution**: Data not yet available on portal - try previous month

**3. SIAM Press Release Not Found**
```
SIAM: No press release found for September 2025
```
**Solution**: Press release not published yet - SIAM publishes ~mid-month

### Partial Success
System can succeed with one source and fail with another:
```json
{
  "success": false,
  "telanganaResult": { "success": true, "message": "..." },
  "siamResult": { "success": false, "message": "..." },
  "errors": ["SIAM: Press release not found"]
}
```

Action: Re-run after SIAM publishes their data.

## Advantages Over Manual Import

| Feature | Manual CSV | Automated API |
|---------|-----------|---------------|
| Setup Time | 5-10 min/month | 1 min one-time |
| Human Error Risk | High (partial CSVs) | None |
| Scheduling | Manual | Automatic |
| Data Freshness | Depends on operator | Always latest |
| Brand Normalization | ✅ Same | ✅ Same |
| Sub-brand Aggregation | ✅ Same | ✅ Same |

## Technical Details

### Brand Normalization
Both automated and manual imports use the same normalization:
- Iterative suffix removal (LTD, LIMITED, PRIVATE, etc.)
- BRAND_MAPPING for special cases
- Aggregates sub-brands (Tata Solanis → Tata Motors)

### Data Safety
- **Clear-and-reimport**: Enabled by default
- **Month detection**: Tracks which months are in dataset
- **Validation**: Same as manual CSV import

### API Structure

**Telangana RTA API:**
```
GET https://data.telangana.gov.in/api/action/datastore/search.json
Params:
  - resource_id: Dataset ID
  - limit: Records per page (max 1000)
  - offset: Pagination offset
```

**SIAM Press Release:**
```
URL Pattern: https://www.siam.in/pressrelease-details.aspx?mpgid=48&pgidtrail=50&pid={ID}
Extraction:
  - Month/Year: Regex pattern from title
  - PV Sales: Regex pattern from body text
```

## Best Practices

✅ **DO:**
- Configure Resource ID once and forget
- Use "Latest Month" for regular updates
- Check import results for errors
- Verify dashboard after import

❌ **DON'T:**
- Run multiple imports simultaneously
- Change Resource ID unnecessarily
- Disable clear-and-reimport (keeps data clean)

## Monitoring

After automated import, verify:
1. Go to `/news/oem-report`
2. Select imported month
3. Check OEM totals look reasonable
4. Compare to previous months for sanity

## Future Enhancements

Potential additions:
- Email notifications on import success/failure
- Slack/webhook integration
- Historical backfill (import last 12 months)
- Auto-retry on failure
- Import queue with priority

---

**Bottom Line**: Set it up once, never worry about manual CSV downloads again!
