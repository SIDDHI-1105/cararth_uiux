# VAHAN RTO Lookup Feature - Integration Guide

## Overview

This document describes the VAHAN RTO lookup feature for automatic vehicle details fetching on the "List Your Car" page. The feature allows users to enter their registration number and automatically populate the listing form with verified vehicle data from the government VAHAN database.

---

## Architecture

### Frontend Components

1. **`RTOLookup.tsx`** - Main lookup interface with input validation and error handling
2. **`VehiclePreviewCard.tsx`** - Preview card showing fetched vehicle details
3. **`sell-car-v2.tsx`** - Complete listing flow integrating RTO lookup
4. **`vahanService.ts`** - API client and data mapping logic

### Backend Requirements

The backend must implement:

**Route:** `POST /api/vahan/lookup`

**Request Body:**
```json
{
  "reg_number": "MH12AB1234"
}
```

**Success Response (200):**
```json
{
  "status": "ok",
  "vehicle": {
    "reg_number": "MH12AB1234",
    "make": "Maruti",
    "model": "Swift",
    "variant": "VXi",
    "manufacture_year": "2019",
    "registration_year": "2019",
    "fuel_type": "Petrol",
    "transmission": "Manual",
    "no_of_owners": 1,
    "color": "White",
    "chassis_number": "XXXXXXXXXXXX",
    "engine_number": "YYYYYYYYYYYY",
    "registration_date": "2019-03-15",
    "images": []
  },
  "source": "vahan",
  "meta": {
    "fetched_at": "2025-12-05T12:00:00Z",
    "confidence": 0.98
  }
}
```

**Not Found Response (404):**
```json
{
  "status": "not_found",
  "message": "Vehicle not found in VAHAN database",
  "code": "NOT_FOUND"
}
```

**Rate Limit Response (429):**
```json
{
  "status": "error",
  "message": "Too many requests. Please try again later.",
  "code": "RATE_LIMITED"
}
```

**Service Unavailable (503):**
```json
{
  "status": "error",
  "message": "VAHAN service temporarily unavailable",
  "code": "SERVICE_UNAVAILABLE"
}
```

---

## User Flow

### Happy Path (VAHAN Lookup Success)

1. User navigates to `/sell-car-v2`
2. User enters registration number (e.g., `MH12AB1234`)
3. User clicks "Fetch Details"
4. System shows loading state
5. Backend fetches from VAHAN and returns vehicle data
6. System displays preview card with auto-filled details
7. User reviews and clicks "Confirm & Continue"
8. User completes remaining fields (price, mileage, contact info)
9. User uploads images
10. User submits listing

### Fallback Path (Manual Entry)

1. User navigates to `/sell-car-v2`
2. User clicks "Enter Manually" OR VAHAN lookup fails
3. System shows full form without auto-fill
4. User manually enters all vehicle details
5. User uploads images
6. User submits listing

### Error Paths

**Vehicle Not Found:**
- Show alert: "Vehicle not found - You can enter details manually"
- Provide "Enter Details Manually" button
- Pre-fill registration number if user entered one

**Rate Limiting:**
- Show alert: "Too many requests - Please wait a minute"
- Provide "Try Again" button (disabled for 60 seconds)
- Provide "Enter Details Manually" fallback

**Network Error:**
- Show alert: "Connection error - Please check your internet"
- Provide "Try Again" button
- Provide "Enter Details Manually" fallback

**Timeout:**
- Show alert: "Request timed out - VAHAN service is slow"
- Provide "Try Again" button
- Provide "Enter Details Manually" fallback

---

## Integration Test Checklist

### Pre-Test Setup

- [ ] Backend `/api/vahan/lookup` endpoint is deployed
- [ ] VAHAN API credentials configured on backend
- [ ] Frontend deployed with latest RTO lookup feature
- [ ] Test registration numbers available (valid & invalid)

### Test Cases

#### 1. Registration Number Validation

- [ ] **Test 1.1:** Enter valid format `MH12AB1234` → Should accept
- [ ] **Test 1.2:** Enter valid format `DL01CA9999` → Should accept
- [ ] **Test 1.3:** Enter valid format `KA03MH7777` → Should accept
- [ ] **Test 1.4:** Enter invalid format `123456` → Should show inline error
- [ ] **Test 1.5:** Enter invalid format `ABCD1234` → Should show inline error
- [ ] **Test 1.6:** Enter empty value → Button should be disabled
- [ ] **Test 1.7:** Enter lowercase `mh12ab1234` → Should auto-uppercase

#### 2. Successful VAHAN Lookup

- [ ] **Test 2.1:** Enter valid registration → Click "Fetch Details" → Loading spinner appears
- [ ] **Test 2.2:** Backend returns 200 OK → Preview card displays
- [ ] **Test 2.3:** Preview card shows: Brand, Model, Year, Fuel, Transmission
- [ ] **Test 2.4:** Preview card shows "VAHAN Verified" badge
- [ ] **Test 2.5:** Preview card "Edit" button works → Navigates to form
- [ ] **Test 2.6:** Preview card "Confirm & Continue" works → Navigates to form
- [ ] **Test 2.7:** Form is pre-filled with VAHAN data
- [ ] **Test 2.8:** User can edit pre-filled fields
- [ ] **Test 2.9:** Toast notification shows success message

#### 3. Error Handling

- [ ] **Test 3.1:** Backend returns 404 → Shows "Vehicle not found" alert
- [ ] **Test 3.2:** 404 alert has "Enter Details Manually" button
- [ ] **Test 3.3:** Manual entry button pre-fills registration number
- [ ] **Test 3.4:** Backend returns 429 → Shows "Too many requests" alert
- [ ] **Test 3.5:** 429 alert suggests waiting → "Try Again" button available
- [ ] **Test 3.6:** Backend returns 503 → Shows "Service unavailable" alert
- [ ] **Test 3.7:** Network fails → Shows "Connection error" alert
- [ ] **Test 3.8:** Request times out (>15s) → Shows "Timeout" alert
- [ ] **Test 3.9:** All error alerts have appropriate action buttons

#### 4. Manual Entry Fallback

- [ ] **Test 4.1:** Click "Enter Manually" on lookup screen → Shows form
- [ ] **Test 4.2:** Form fields are empty (not pre-filled)
- [ ] **Test 4.3:** User can fill all fields manually
- [ ] **Test 4.4:** Form validation works on manual entry
- [ ] **Test 4.5:** Can submit listing without VAHAN lookup

#### 5. Form Completion & Submission

- [ ] **Test 5.1:** After VAHAN lookup, can complete remaining fields
- [ ] **Test 5.2:** Price field validation (min ₹10,000)
- [ ] **Test 5.3:** Mileage field validation (non-negative)
- [ ] **Test 5.4:** Phone field validation (10 digits, starts with 6-9)
- [ ] **Test 5.5:** Email field validation (valid format)
- [ ] **Test 5.6:** Can upload images (up to 12)
- [ ] **Test 5.7:** Submit button disabled while uploading
- [ ] **Test 5.8:** Can submit complete listing
- [ ] **Test 5.9:** Success screen shows after submission

#### 6. Responsive Design

- [ ] **Test 6.1:** Desktop (>1024px) → All elements visible and aligned
- [ ] **Test 6.2:** Tablet (768-1024px) → Form grid adjusts to 2 columns
- [ ] **Test 6.3:** Mobile (< 768px) → Form fields stack vertically
- [ ] **Test 6.4:** Input fields have proper touch targets (min 44px)
- [ ] **Test 6.5:** Preview card responsive on mobile

#### 7. Dark Mode

- [ ] **Test 7.1:** Dark mode toggle works
- [ ] **Test 7.2:** All text is readable in dark mode
- [ ] **Test 7.3:** Form inputs styled correctly in dark mode
- [ ] **Test 7.4:** Alerts and badges styled correctly
- [ ] **Test 7.5:** Loading spinner visible in dark mode

#### 8. Accessibility

- [ ] **Test 8.1:** All form inputs have associated labels
- [ ] **Test 8.2:** Error messages announced via aria-live
- [ ] **Test 8.3:** Loading states announced to screen readers
- [ ] **Test 8.4:** Keyboard navigation works (Tab, Enter)
- [ ] **Test 8.5:** Focus styles visible on all interactive elements
- [ ] **Test 8.6:** Form validation errors linked to inputs (aria-describedby)

#### 9. Edge Cases

- [ ] **Test 9.1:** Backend returns partial data → Form shows what's available
- [ ] **Test 9.2:** Backend returns empty arrays → No crash
- [ ] **Test 9.3:** User clicks "Back" after VAHAN lookup → Returns to lookup screen
- [ ] **Test 9.4:** User refreshes page mid-flow → Flow resets
- [ ] **Test 9.5:** Multiple rapid clicks on "Fetch Details" → Only one request sent

#### 10. Security & Privacy

- [ ] **Test 10.1:** Registration number not logged to browser analytics
- [ ] **Test 10.2:** VAHAN response not exposed in console (production)
- [ ] **Test 10.3:** Sensitive fields (chassis, engine) displayed only if needed
- [ ] **Test 10.4:** HTTPS used for all API calls
- [ ] **Test 10.5:** No CORS errors in browser console

---

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm test

# Run VAHAN service tests only
npm test vahanService.test.ts

# Run with coverage
npm test -- --coverage
```

Expected output:
```
✓ validateRegistrationNumber (5/5 tests pass)
✓ normalizeRegistrationNumber (3/3 tests pass)
✓ fetchVahanDetails (6/6 tests pass)
✓ mapVahanToFormData (3/3 tests pass)
✓ getErrorMessage (5/5 tests pass)
✓ getMissingFields (3/3 tests pass)
```

### E2E Tests (Manual)

1. **Setup test environment:**
   ```bash
   npm run dev
   ```

2. **Navigate to:** `http://localhost:5000/sell-car-v2`

3. **Follow integration test checklist above**

4. **Log results in test spreadsheet**

---

## Deployment Checklist

### Backend

- [ ] Deploy `/api/vahan/lookup` endpoint
- [ ] Configure VAHAN API credentials (env vars)
- [ ] Set up rate limiting (e.g., 10 requests/min per IP)
- [ ] Enable response caching (1 hour TTL)
- [ ] Configure monitoring/alerts for VAHAN API errors
- [ ] Test endpoint manually with Postman/cURL

### Frontend

- [ ] Build production bundle: `npm run build`
- [ ] Verify no console errors in build
- [ ] Deploy to staging environment
- [ ] Run smoke tests on staging
- [ ] Deploy to production
- [ ] Monitor error tracking (Sentry/etc.)

### Post-Deployment

- [ ] Test with real registration numbers
- [ ] Monitor API success/failure rates
- [ ] Check for unexpected errors in logs
- [ ] Verify analytics tracking
- [ ] Gather user feedback

---

## API Contract for Backend Team

### Request

```typescript
interface VahanLookupRequest {
  reg_number: string; // Uppercase, validated format
}
```

### Response

```typescript
interface VahanLookupResponse {
  status: 'ok' | 'not_found' | 'error';
  vehicle?: {
    reg_number: string;
    make: string;              // e.g., "Maruti"
    model: string;             // e.g., "Swift"
    variant?: string;          // e.g., "VXi"
    manufacture_year: string;  // e.g., "2019"
    registration_year?: string;
    fuel_type: string;         // e.g., "Petrol", "Diesel", "CNG", "Electric"
    transmission: string;      // e.g., "Manual", "Automatic"
    no_of_owners: number;      // 1, 2, 3, etc.
    color?: string;
    chassis_number?: string;
    engine_number?: string;
    registration_date?: string; // ISO 8601 format
    images?: string[];
  };
  source?: string;             // e.g., "vahan"
  meta?: {
    fetched_at: string;        // ISO 8601 timestamp
    confidence?: number;       // 0.0 - 1.0
  };
  message?: string;            // Error message
  code?: string;               // Error code
}
```

### Error Codes

| HTTP Status | Code | Meaning | Action |
|------------|------|---------|--------|
| 400 | VALIDATION_ERROR | Invalid registration format | Show validation error |
| 404 | NOT_FOUND | Vehicle not in VAHAN DB | Offer manual entry |
| 408 | TIMEOUT | VAHAN API timeout | Retry or manual entry |
| 429 | RATE_LIMITED | Too many requests | Wait & retry |
| 503 | SERVICE_UNAVAILABLE | VAHAN API down | Manual entry |

### Implementation Notes

1. **Rate Limiting:** Implement per-IP rate limiting (e.g., 10 req/min)
2. **Caching:** Cache successful responses for 1 hour (keyed by reg_number)
3. **Timeout:** Set 10s timeout for VAHAN API calls
4. **Retry Logic:** Do NOT retry on frontend - backend should handle retries
5. **Logging:** Log all VAHAN API calls (hash reg_number for privacy)
6. **Monitoring:** Alert if VAHAN API success rate drops below 90%

---

## Troubleshooting

### Issue: "Fetch Details" button stuck in loading state

**Cause:** Backend not responding or CORS error

**Solution:**
1. Check browser console for errors
2. Verify backend endpoint is reachable: `curl -X POST http://localhost:5000/api/vahan/lookup -d '{"reg_number":"MH12AB1234"}'`
3. Check backend logs for errors

### Issue: Form not pre-filling after successful lookup

**Cause:** Data mapping issue

**Solution:**
1. Check browser console for mapping errors
2. Verify backend response format matches contract
3. Check `mapVahanToFormData` function for bugs

### Issue: Validation errors on pre-filled data

**Cause:** VAHAN data doesn't match form schema

**Solution:**
1. Normalize data before mapping (trim, uppercase, etc.)
2. Add data validation in `mapVahanToFormData`
3. Set sensible defaults for missing fields

### Issue: "Vehicle not found" for valid registrations

**Cause:** VAHAN API limitations or incorrect registration format

**Solution:**
1. Verify registration number format
2. Check if vehicle is registered in VAHAN system
3. Use manual entry fallback

---

## Performance Metrics

Track these metrics in production:

- **Lookup Success Rate:** `(successful lookups / total lookups) × 100%`
  - Target: >90%

- **Average Response Time:** Time from click to data displayed
  - Target: <3 seconds

- **Error Rate by Type:**
  - NOT_FOUND: <5%
  - RATE_LIMITED: <1%
  - TIMEOUT: <2%
  - OTHER: <3%

- **Manual Entry Rate:** `(manual entries / total submissions) × 100%`
  - Baseline: 15% (users who skip VAHAN lookup)

- **Form Completion Rate:** `(completed forms / started forms) × 100%`
  - Target: >80%

---

## Future Enhancements

1. **Caching:** Client-side cache for recently looked up vehicles
2. **Predictive Input:** Auto-suggest registration format as user types
3. **Bulk Upload:** Allow dealers to upload multiple registrations via CSV
4. **Historical Data:** Show previous lookup results for returning users
5. **Confidence Score:** Display VAHAN confidence score to users
6. **Partial Match:** Suggest similar vehicles if exact match not found

---

## Support

- **Frontend Issues:** Open issue in GitHub repository
- **Backend API Issues:** Contact backend team
- **VAHAN API Issues:** Check VAHAN service status page
- **User Support:** support@cararth.com

---

**Last Updated:** 2025-12-05
**Version:** 1.0.0
**Author:** CarArth Development Team
