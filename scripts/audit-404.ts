#!/usr/bin/env tsx

/**
 * 404 Audit Script for cararth.com
 * Checks URLs for 404 errors and categorizes them for fixing
 */

interface AuditResult {
  url: string;
  status: number;
  category: string;
  recommended_fix: string;
  action_status: string;
}

const SEED_URLS = [
  "https://cararth.com/?brand=Honda",
  "https://cararth.com/faq",
  "https://cararth.com/api/news/market-insights",
  "https://cararth.com/cars/swift",
  "https://cararth.com/cars/hyundai",
  "https://cararth.com/cars/under-5-lakh",
  "https://cararth.com/cars/mumbai",
  "https://cararth.com/car/3b883fb3-dc57-4ede-8d82-765f931ebf62",
  "https://cararth.com/car/92e5a53e-58ed-49e8-8277-0cddb6046560"
];

async function checkUrl(url: string): Promise<AuditResult> {
  try {
    // First check with redirect: 'manual' to see initial status
    const manualResponse = await fetch(url, {
      method: 'HEAD',
      redirect: 'manual'
    });

    // Then follow redirects to get final status
    const finalResponse = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow'
    });

    const status = finalResponse.status;
    const initialStatus = manualResponse.status;
    let category = "unknown";
    let recommended_fix = "No action needed";

    // Categorize based on URL pattern
    if (url.includes('/api/')) {
      category = "API endpoint";
      recommended_fix = status === 404 
        ? "Add to robots.txt exclusion list (Disallow: /api/)"
        : "Already handled, add to robots.txt to prevent indexing";
    } else if (url.match(/\/car\/[a-f0-9-]{36}/)) {
      category = "Vehicle detail page";
      recommended_fix = status === 404
        ? "Return 410 Gone or redirect to /results"
        : "Working correctly";
    } else if (url.startsWith('https://cararth.com/cars/')) {
      category = "Listing page";
      recommended_fix = status === 404
        ? "Add SSR route or redirect to /results"
        : "Working correctly";
    } else if (url.includes('?brand=')) {
      category = "Query parameter page";
      recommended_fix = status === 404
        ? "Ensure homepage handles query params correctly"
        : "Working correctly";
    } else {
      category = "Static page";
      recommended_fix = status === 404
        ? "Create route or component for this page"
        : "Working correctly";
    }

    return {
      url,
      status,
      category,
      recommended_fix,
      action_status: status === 404 || status === 410 ? "needs_fix" : "ok"
    };
  } catch (error) {
    return {
      url,
      status: 0,
      category: "error",
      recommended_fix: `Failed to fetch: ${error}`,
      action_status: "error"
    };
  }
}

async function runAudit() {
  console.log("🔍 Starting 404 Audit for cararth.com\n");
  
  const results: AuditResult[] = [];
  
  for (const url of SEED_URLS) {
    const result = await checkUrl(url);
    results.push(result);
    
    const emoji = result.status === 200 ? "✅" : result.status === 404 ? "❌" : result.status === 410 ? "🚫" : "⚠️";
    console.log(`${emoji} ${url}`);
    console.log(`   Final Status: ${result.status}`);
    console.log(`   Category: ${result.category}`);
    console.log(`   Fix: ${result.recommended_fix}\n`);
  }

  // Summary
  const needsFix = results.filter(r => r.action_status === "needs_fix");
  const ok = results.filter(r => r.action_status === "ok");
  
  console.log("\n📊 SUMMARY:");
  console.log(`✅ Working: ${ok.length}`);
  console.log(`❌ Needs Fix: ${needsFix.length}`);
  
  if (needsFix.length > 0) {
    console.log("\n🔧 RECOMMENDED FIXES:");
    needsFix.forEach(r => {
      console.log(`- ${r.url}`);
      console.log(`  → ${r.recommended_fix}`);
    });
  }

  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    total_checked: results.length,
    needs_fix: needsFix.length,
    results
  };

  const fs = await import('fs/promises');
  await fs.writeFile('404_audit.json', JSON.stringify(report, null, 2));
  console.log("\n💾 Report saved to 404_audit.json");
}

runAudit().catch(console.error);
