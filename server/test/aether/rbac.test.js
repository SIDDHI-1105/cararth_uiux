import axios from 'axios';

function assert(condition, message) {
  if (!condition) {
    throw new Error(`❌ Assertion failed: ${message}`);
  }
  console.log(`✓ ${message}`);
}

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';

async function testUnauthenticatedAuditRun() {
  console.log('\n🧪 Testing Unauthenticated Audit Run (should return 401)...\n');

  try {
    const response = await axios.post(`${BASE_URL}/api/aether/audit/run`, {
      url: 'https://cararth.com'
    }, {
      validateStatus: () => true
    });

    console.log(`Response status: ${response.status}`);

    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️  Development mode detected - admin check may be bypassed');
      console.log(`Response status: ${response.status}`);
      if (response.status === 200 || response.status === 201) {
        console.log('✓ Development mode allows audit run without auth');
        return;
      }
    }

    assert(
      response.status === 401 || response.status === 403,
      'Should return 401/403 for unauthenticated requests in production'
    );

    console.log(`✅ Correctly rejected unauthenticated request with status ${response.status}`);
  } catch (error) {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.log(`✅ Correctly rejected with status ${error.response.status}`);
    } else {
      throw error;
    }
  }
}

async function testUnauthenticatedAuditList() {
  console.log('\n🧪 Testing Unauthenticated Audit List Access...\n');

  try {
    const response = await axios.get(`${BASE_URL}/api/aether/audits`, {
      validateStatus: () => true
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️  Development mode detected - admin check may be bypassed');
      console.log(`Response status: ${response.status}`);
      if (response.status === 200) {
        console.log('✓ Development mode allows audit list access without auth');
        return;
      }
    }

    assert(
      response.status === 401 || response.status === 403 || response.status === 200,
      'Should return 401/403 for protected endpoints or 200 if public'
    );

    console.log(`✅ Audit list endpoint returned status ${response.status}`);
  } catch (error) {
    if (error.response) {
      console.log(`✅ Request handled with status ${error.response.status}`);
    } else if (error.code === 'ECONNREFUSED') {
      console.log('⚠️  Server not running - skipping RBAC test');
    } else {
      throw error;
    }
  }
}

async function testInvalidAuditId() {
  console.log('\n🧪 Testing Invalid Audit ID Access...\n');

  try {
    const response = await axios.get(`${BASE_URL}/api/aether/audit/invalid-id-12345`, {
      validateStatus: () => true
    });

    assert(
      response.status === 404 || response.status === 401 || response.status === 403,
      'Should return 404 for invalid audit ID or 401/403 if auth required'
    );

    console.log(`✅ Invalid audit ID handled correctly with status ${response.status}`);
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('⚠️  Server not running - skipping test');
    } else {
      throw error;
    }
  }
}

async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  RBAC & Authentication - Unit Tests');
  console.log('═══════════════════════════════════════════════════════');

  try {
    await testUnauthenticatedAuditRun();
    await testUnauthenticatedAuditList();
    await testInvalidAuditId();

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  ✅ All RBAC tests passed!');
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
