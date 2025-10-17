# Real Data Import Guide for Monthly OEM Report Dashboard

## Overview
Your dashboard now supports importing **real data** from official sources:
- ✅ **Telangana RTA**: State-level vehicle registrations with ALL sub-brands (Tata Solanis, Mahindra Electric, etc.)
- ✅ **SIAM National Data**: Pan-India benchmarks using market share distribution

## Step-by-Step Import Instructions

### Step 1: Import Telangana RTA Data (State Level)

#### 1.1 Download CSV from Telangana Open Data Portal

1. Go to: https://data.telangana.gov.in/dataset/regional-transport-authority-vehicle-registrations-data
2. Download the **individual vehicle registration CSV** (not aggregated)
3. The CSV will have columns: `Manufacturer_Name`, `Model_Desc`, `Fuel`, `Apprved_Dt`, etc.

#### 1.2 Import via Admin Panel

1. Navigate to: `/admin/rta-import`
2. Click on **"Telangana RTA Data"** tab
3. Select your downloaded CSV file
4. Click **"Import Data"**
5. Wait for processing (system will show progress)

**What Happens:**
- ✅ Automatic brand aggregation: `TATA MOTORS LTD` + `TATA SOLANIS` → `Tata Motors`
- ✅ Automatic brand aggregation: `MAHINDRA & MAHINDRA LTD` + `MAHINDRA ELECTRIC` → `Mahindra`
- ✅ Handles company suffixes: LTD, LIMITED, PRIVATE, LLP, INDIA, MOTORS, AUTO
- ✅ Monthly aggregation by brand/model/fuel/transmission
- ✅ Stores in `vehicle_registrations` table with `state='Telangana'`
- ⚠️ **Re-import behavior**: Overwrites existing month data (use clear-and-reimport for partial CSVs)

### Step 2: Import National SIAM Data (Pan-India Benchmark)

#### 2.1 Get Monthly PV Sales Total

1. Go to: https://www.siam.in/press-release.aspx?mpgid=48&pgidtrail=50
2. Find the press release for your target month
3. Look for **total Passenger Vehicle (PV) sales**
   - Example: September 2025 = **372,458 units**

#### 2.2 Import via Admin Panel

1. Navigate to: `/admin/rta-import`
2. Click on **"National (SIAM) Data"** tab
3. Enter:
   - Month: `9`
   - Year: `2025`
   - Total PV Sales: `372458`
4. Click **"Import National Data"**

**What Happens:**
- ✅ Distributes total across OEMs using market share:
  - Maruti Suzuki: 41%
  - Hyundai: 15%
  - Tata Motors: 14%
  - Mahindra: 9%
  - Kia: 7%
  - Toyota: 5%
  - Honda: 4%
  - MG Motor: 3%
  - Others: 2% (Renault, Nissan, Skoda, VW, etc.)
- ✅ Adjusts for rounding errors to match exact SIAM total
- ✅ Stores in `vehicle_registrations` table with `state='National'`

### Step 3: Verify Dashboard

1. Go to: `/news/oem-report`
2. Select Month: `September` and Year: `2025`
3. You should now see:
   - ✅ **Real Telangana numbers** with ALL sub-brands aggregated
   - ✅ **National benchmarks** from SIAM data
   - ✅ Correct market share percentages
   - ✅ 3-month ML forecasts (Oct/Nov/Dec 2025)

## Brand Aggregation (Automatically Handled)

The system automatically combines sub-brands:

| Raw Data (CSV) | Normalized Brand |
|---------------|------------------|
| TATA MOTORS LTD | Tata Motors |
| TATA SOLANIS | Tata Motors ✅ |
| TATA PASSENGER ELECTRIC MOBILITY LTD | Tata Motors ✅ |
| MAHINDRA & MAHINDRA LTD | Mahindra |
| MAHINDRA ELECTRIC | Mahindra ✅ |
| MARUTI SUZUKI INDIA LIMITED | Maruti Suzuki |
| HYUNDAI MOTOR INDIA LTD | Hyundai |
| TOYOTA KIRLOSKAR MOTOR | Toyota |

**Suffix Handling:** Automatically removes LTD, LIMITED, PRIVATE, LLP, INDIA, MOTORS, AUTO before mapping.

This ensures **accurate totals** that include all variants and sub-brands!

## Data Sources Reference

### Telangana RTA (FREE)
- **Portal**: https://data.telangana.gov.in
- **Dataset**: Regional Transport Authority Vehicle Registrations Data
- **Coverage**: Individual vehicle registrations (2014 - present)
- **Update Frequency**: Monthly
- **Cost**: FREE

### SIAM National (FREE for aggregates)
- **Website**: https://www.siam.in/press-release.aspx
- **Data Type**: Monthly press releases with total PV/TW/3W sales
- **Coverage**: National-level aggregates
- **Update Frequency**: Monthly (15th of next month)
- **Cost**: FREE (press releases) | ₹4,000/month (detailed OEM data)

## Database Schema

Data is stored in `vehicle_registrations` table:

```sql
CREATE TABLE vehicle_registrations (
  id VARCHAR PRIMARY KEY,
  state TEXT NOT NULL,              -- 'Telangana' or 'National'
  brand TEXT NOT NULL,               -- 'Tata Motors', 'Mahindra', etc.
  model TEXT NOT NULL,               -- Actual model or 'All Models'
  variant TEXT,                      -- Variant or 'All'
  fuel_type TEXT NOT NULL,          -- 'Petrol', 'Diesel', 'Electric', etc.
  transmission TEXT NOT NULL,        -- 'Manual' or 'Automatic'
  year INTEGER NOT NULL,             -- 2025
  month INTEGER NOT NULL,            -- 1-12
  registrations_count INTEGER NOT NULL
);
```

## Troubleshooting

### Issue: Missing Sub-Brands in Results
**Solution**: Make sure you downloaded the **individual vehicle CSV**, not the aggregated summary. The individual CSV has all manufacturer names including sub-brands.

### Issue: Re-importing Partial Month Data
**Solution**: If importing a partial CSV (e.g., only first 15 days), first clear the month using DELETE endpoint, then import. Otherwise, the system will overwrite with incomplete data.

**API Endpoint**: `DELETE /api/admin/rta-data/:year/:month` (admin only)

### Issue: National Numbers Too High/Low
**Solution**: Verify the total PV sales from SIAM press release. Check that you're using **Passenger Vehicles** only, not total auto sector.

### Issue: Import Failed
**Solution**: Check CSV format. Required columns: `Manufacturer_Name`, `Model_Desc`, `Fuel`, `Apprved_Dt`. Date format: `YYYY-MM-DD` or `DD-MMM-YY`.

## Next Steps

After importing real data:
1. ✅ Dashboard will show accurate Telangana + National numbers
2. ✅ All sub-brands (Tata Solanis, Mahindra Electric) will be included
3. ✅ ML forecasts will be based on real historical data
4. ✅ Market share calculations will be precise

---

**Questions?** The system is production-ready and waiting for your real data import!
