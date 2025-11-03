import { checkIndexability } from '../../lib/aether/checkers/indexabilityChecker.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(`❌ Assertion failed: ${message}`);
  }
  console.log(`✓ ${message}`);
}

const sampleRobotsTxt = `
User-agent: *
Disallow: /admin/
Disallow: /api/
Allow: /

Sitemap: https://cararth.com/sitemap.xml
`;

const sampleSitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://cararth.com/</loc>
    <lastmod>2025-11-01</lastmod>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://cararth.com/used-cars/hyundai-creta-2021</loc>
    <lastmod>2025-11-02</lastmod>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://cararth.com/blog/buying-guide</loc>
    <lastmod>2025-11-03</lastmod>
    <priority>0.7</priority>
  </url>
</urlset>`;

const sampleHtmlWithCanonical = `
<!DOCTYPE html>
<html>
<head>
  <link rel="canonical" href="https://cararth.com/used-cars/creta" />
  <title>Used Hyundai Creta</title>
</head>
<body>
  <h1>Used Hyundai Creta</h1>
</body>
</html>
`;

const sampleHtmlWithNoindex = `
<!DOCTYPE html>
<html>
<head>
  <meta name="robots" content="noindex, nofollow" />
  <title>Private Page</title>
</head>
<body>
  <h1>This page should not be indexed</h1>
</body>
</html>
`;

const sampleHtmlWithoutCanonical = `
<!DOCTYPE html>
<html>
<head>
  <title>Page Without Canonical</title>
</head>
<body>
  <h1>No canonical tag</h1>
</body>
</html>
`;

async function testRobotsTxtValidation() {
  console.log('\n🧪 Testing robots.txt Validation...\n');

  const result = await checkIndexability('https://cararth.com', {
    robotsTxt: sampleRobotsTxt,
    sitemapXml: sampleSitemapXml,
    html: sampleHtmlWithCanonical
  });

  assert(result.category === 'Indexability', 'Category should be Indexability');
  assert(typeof result.categoryScore === 'number', 'Category score should be number');
  assert(Array.isArray(result.issues), 'Issues should be array');

  const hasRobotsTxtIssue = result.issues.some(issue => 
    issue.description.toLowerCase().includes('robots.txt')
  );

  console.log(`✅ robots.txt validation complete (has issue: ${hasRobotsTxtIssue})`);
}

async function testSitemapValidation() {
  console.log('\n🧪 Testing Sitemap Validation...\n');

  const result = await checkIndexability('https://cararth.com', {
    robotsTxt: sampleRobotsTxt,
    sitemapXml: sampleSitemapXml,
    html: sampleHtmlWithCanonical
  });

  const sitemapIssues = result.issues.filter(issue => 
    issue.description.toLowerCase().includes('sitemap')
  );

  console.log(`✅ Sitemap validation complete (found ${sitemapIssues.length} sitemap-related issues)`);
}

async function testCanonicalUrlDetection() {
  console.log('\n🧪 Testing Canonical URL Detection...\n');

  const resultWithCanonical = await checkIndexability('https://cararth.com/test', {
    robotsTxt: sampleRobotsTxt,
    sitemapXml: sampleSitemapXml,
    html: sampleHtmlWithCanonical
  });

  const resultWithoutCanonical = await checkIndexability('https://cararth.com/test2', {
    robotsTxt: sampleRobotsTxt,
    sitemapXml: sampleSitemapXml,
    html: sampleHtmlWithoutCanonical
  });

  const missingCanonicalIssue = resultWithoutCanonical.issues.some(issue =>
    issue.description.toLowerCase().includes('canonical')
  );

  assert(missingCanonicalIssue, 'Should detect missing canonical tags');

  console.log(`✅ Canonical URL detection working`);
}

async function testNoindexDetection() {
  console.log('\n🧪 Testing Noindex Detection...\n');

  const result = await checkIndexability('https://cararth.com/private', {
    robotsTxt: sampleRobotsTxt,
    sitemapXml: sampleSitemapXml,
    html: sampleHtmlWithNoindex
  });

  const noindexIssue = result.issues.some(issue =>
    issue.description.toLowerCase().includes('noindex')
  );

  assert(noindexIssue, 'Should detect noindex meta tags');
  assert(result.categoryScore < 50, 'Score should be low when noindex is detected');

  console.log(`✅ Noindex detection working`);
}

async function testScoringSeverity() {
  console.log('\n🧪 Testing Issue Severity Scoring...\n');

  const result = await checkIndexability('https://cararth.com', {
    robotsTxt: '',
    sitemapXml: '',
    html: sampleHtmlWithoutCanonical
  });

  const criticalIssues = result.issues.filter(i => i.severity === 'critical');
  const highIssues = result.issues.filter(i => i.severity === 'high');

  if (criticalIssues.length > 0 || highIssues.length > 0) {
    assert(result.categoryScore < 60, 'Score should be low when critical/high issues exist');
  }

  console.log(`✅ Severity scoring validated (critical: ${criticalIssues.length}, high: ${highIssues.length})`);
}

async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Indexability Checker - Unit Tests');
  console.log('═══════════════════════════════════════════════════════');

  try {
    await testRobotsTxtValidation();
    await testSitemapValidation();
    await testCanonicalUrlDetection();
    await testNoindexDetection();
    await testScoringSeverity();

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  ✅ All Indexability Checker tests passed!');
    console.log('═══════════════════════════════════════════════════════\n');
    process.exit(0);
  } catch (error) {
    console.error('\n═══════════════════════════════════════════════════════');
    console.error('  ❌ Test failed:', error.message);
    console.error('═══════════════════════════════════════════════════════\n');
    process.exit(1);
  }
}

runAllTests();
