import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const tests = [
  'auditEngine.test.js',
  'schemaChecker.test.js',
  'indexabilityChecker.test.js',
  'rbac.test.js'
];

async function runTest(testFile) {
  return new Promise((resolve, reject) => {
    console.log(`\n🏃 Running ${testFile}...`);
    
    const testPath = join(__dirname, testFile);
    const child = spawn('node', [testPath], {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: process.env.NODE_ENV || 'development' }
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Test ${testFile} failed with code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function runAllTests() {
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║  ÆTHER SEO Audit System - Complete Test Suite        ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      await runTest(test);
      passed++;
    } catch (error) {
      console.error(`\n❌ ${test} failed:`, error.message);
      failed++;
    }
  }

  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║  Test Summary                                         ║');
  console.log('╠═══════════════════════════════════════════════════════╣');
  console.log(`║  Total Tests:  ${tests.length}                                       ║`);
  console.log(`║  Passed:       ${passed}                                       ║`);
  console.log(`║  Failed:       ${failed}                                       ║`);
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  if (failed > 0) {
    console.error('❌ Some tests failed\n');
    process.exit(1);
  } else {
    console.log('✅ All tests passed!\n');
    process.exit(0);
  }
}

runAllTests();
