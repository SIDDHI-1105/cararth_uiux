# Data Import Safety Guide

## ⚠️ CRITICAL: Partial Import Protection

### The Risk
The import system **cannot automatically detect** if your CSV contains complete month data. Importing a partial CSV will:
- ❌ Overwrite existing complete data with incomplete data
- ❌ Show incorrect numbers on the dashboard
- ❌ Break forecasting and analytics

### Safe Import Checklist

Before importing Telangana RTA CSV:

1. **✅ Verify Complete Month Coverage**
   - CSV must contain ALL registrations for the entire month
   - Check date range: 1st to last day of month
   - Download from official portal: https://data.telangana.gov.in

2. **✅ Enable "Clear Existing Data" (Default ON)**
   - Always keep the checkbox checked
   - This prevents accumulation of duplicate data
   - System will clear detected months before import

3. **✅ One CSV Per Month**
   - Never merge partial files manually
   - Always use the official complete CSV from Telangana RTA Portal

### Known Limitations

❌ **Cannot Detect Partial CSVs**: System has no way to know if CSV is complete  
❌ **No Row Count Validation**: Cannot verify expected number of registrations  
✅ **Date Range Tracking**: System shows detected months for transparency  
✅ **Clear-and-Reimport**: Prevents duplicate accumulation

### Recommended Workflow

**For Fresh Import:**
1. Download complete month CSV from Telangana RTA Portal
2. Go to `/admin/rta-import`
3. Keep "Clear existing data" checkbox **CHECKED** ✅
4. Upload CSV
5. Verify detected months match your expectation

**For Re-Import (Data Correction):**
1. Download fresh complete CSV from official source
2. Keep "Clear existing data" checkbox **CHECKED** ✅
3. Upload - system will replace old data with new complete data

**Never Do This:**
- ❌ Upload partial month CSVs (first 15 days only)
- ❌ Upload manually filtered CSVs (specific brands only)
- ❌ Upload test/sample data to production
- ❌ Disable "Clear existing data" checkbox

### Validation (Your Responsibility)

After import, manually verify:
1. Go to `/news/oem-report`
2. Select imported month
3. Check if totals look reasonable (compare to previous months)
4. Verify major OEMs (Maruti, Hyundai, Tata) have non-zero counts

### Emergency: Rollback Bad Import

If you accidentally imported partial data:

1. **Delete Bad Data:**
   ```
   DELETE /api/admin/rta-data/{year}/{month}
   ```
   Example: `DELETE /api/admin/rta-data/2025/9`

2. **Re-import Complete CSV:**
   - Download fresh complete CSV
   - Upload with "Clear existing data" ✅ checked

## SIAM National Data Safety

### No Risk of Partial Data
- Manual input only (month, year, total)
- System validates total > 0
- Distribution uses fixed market share %

### Safe Workflow
1. Get total PV sales from SIAM press release
2. Enter month, year, total
3. Click "Import National Data"
4. System distributes across OEMs automatically

## Summary: Best Practices

✅ **DO:**
- Always download complete official CSVs
- Keep "Clear existing data" checked
- Verify results after import
- Use official data sources only

❌ **DON'T:**
- Upload partial/filtered CSVs
- Disable clear-and-reimport
- Import test data to production
- Assume system validates completeness

---

**Bottom Line**: The system is **safe IF you only upload complete official CSVs**. The responsibility to ensure data completeness rests with you, the operator.
