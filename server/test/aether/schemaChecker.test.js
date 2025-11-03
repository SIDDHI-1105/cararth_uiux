import { checkSchema } from '../../lib/aether/checkers/schemaChecker.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(`❌ Assertion failed: ${message}`);
  }
  console.log(`✓ ${message}`);
}

const sampleHtmlWithVehicleSchema = `
<!DOCTYPE html>
<html>
<head>
  <title>Used Hyundai Creta 2021</title>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org/",
    "@type": "Car",
    "name": "2021 Hyundai Creta",
    "brand": {
      "@type": "Brand",
      "name": "Hyundai"
    },
    "model": "Creta",
    "vehicleModelDate": "2021",
    "fuelType": "Diesel",
    "vehicleTransmission": "Manual",
    "mileageFromOdometer": {
      "@type": "QuantitativeValue",
      "value": "45000",
      "unitCode": "KMT"
    }
  }
  </script>
</head>
<body>
  <h1>Used Hyundai Creta 2021</h1>
</body>
</html>
`;

const sampleHtmlWithOrganizationSchema = `
<!DOCTYPE html>
<html>
<head>
  <title>CarArth - Home</title>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org/",
    "@type": "Organization",
    "name": "CarArth",
    "url": "https://cararth.com",
    "logo": "https://cararth.com/logo.png"
  }
  </script>
</head>
<body>
  <h1>Welcome to CarArth</h1>
</body>
</html>
`;

const sampleHtmlWithoutSchema = `
<!DOCTYPE html>
<html>
<head>
  <title>No Schema Page</title>
</head>
<body>
  <h1>This page has no structured data</h1>
</body>
</html>
`;

const sampleHtmlWithInvalidSchema = `
<!DOCTYPE html>
<html>
<head>
  <title>Invalid Schema</title>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org/",
    "@type": "Car"
  }
  </script>
</head>
<body>
  <h1>Incomplete schema</h1>
</body>
</html>
`;

async function testVehicleSchemaDetection() {
  console.log('\n🧪 Testing Vehicle Schema Detection...\n');

  const result = await checkSchema('https://cararth.com/test-car', sampleHtmlWithVehicleSchema);

  assert(result.category === 'Schema', 'Category should be Schema');
  assert(typeof result.categoryScore === 'number', 'Category score should be number');
  assert(Array.isArray(result.issues), 'Issues should be array');

  const hasVehicleSchema = result.issues.every(issue => 
    !issue.description.toLowerCase().includes('missing car schema') &&
    !issue.description.toLowerCase().includes('missing vehicle schema')
  );
  
  assert(hasVehicleSchema, 'Should not report missing vehicle schema when present');
  assert(result.categoryScore >= 80, 'Score should be high when valid schema present');
  
  console.log(`✅ Vehicle schema detected correctly (score: ${result.categoryScore})`);
}

async function testOrganizationSchemaDetection() {
  console.log('\n🧪 Testing Organization Schema Detection...\n');

  const result = await checkSchema('https://cararth.com/', sampleHtmlWithOrganizationSchema);

  assert(result.category === 'Schema', 'Category should be Schema');
  
  const hasOrgSchema = result.issues.every(issue => 
    !issue.description.toLowerCase().includes('missing organization schema')
  );
  
  assert(hasOrgSchema, 'Should not report missing organization schema when present');
  
  console.log(`✅ Organization schema detected correctly`);
}

async function testMissingSchemaDetection() {
  console.log('\n🧪 Testing Missing Schema Detection...\n');

  const result = await checkSchema('https://cararth.com/no-schema', sampleHtmlWithoutSchema);

  assert(result.category === 'Schema', 'Category should be Schema');
  assert(result.issues.length > 0, 'Should report issues when schema is missing');
  
  const hasMissingSchemaIssue = result.issues.some(issue => 
    issue.description.toLowerCase().includes('missing') &&
    issue.description.toLowerCase().includes('schema')
  );
  
  assert(hasMissingSchemaIssue, 'Should report missing schema issue');
  assert(result.categoryScore < 50, 'Score should be low when schema is missing');
  
  console.log(`✅ Missing schema detected correctly`);
}

async function testInvalidSchemaDetection() {
  console.log('\n🧪 Testing Invalid Schema Detection...\n');

  const result = await checkSchema('https://cararth.com/invalid', sampleHtmlWithInvalidSchema);

  assert(result.category === 'Schema', 'Category should be Schema');
  assert(result.categoryScore < 70, 'Score should be reduced for incomplete schema');
  
  console.log(`✅ Invalid schema handling correct`);
}

async function testIssueStructure() {
  console.log('\n🧪 Testing Issue Structure...\n');

  const result = await checkSchema('https://cararth.com/test', sampleHtmlWithoutSchema);

  if (result.issues.length > 0) {
    const issue = result.issues[0];
    assert(issue.id, 'Issue should have ID');
    assert(issue.page, 'Issue should have page');
    assert(issue.severity, 'Issue should have severity');
    assert(['critical', 'high', 'medium', 'low'].includes(issue.severity), 'Severity should be valid');
    assert(issue.description, 'Issue should have description');
    assert(typeof issue.impact_score === 'number', 'Issue should have impact score');
    assert(issue.suggested_fix, 'Issue should have suggested fix');
  }
  
  console.log(`✅ Issue structure validated`);
}

async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Schema Checker - Unit Tests');
  console.log('═══════════════════════════════════════════════════════');

  try {
    await testVehicleSchemaDetection();
    await testOrganizationSchemaDetection();
    await testMissingSchemaDetection();
    await testInvalidSchemaDetection();
    await testIssueStructure();

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  ✅ All Schema Checker tests passed!');
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
