#!/usr/bin/env node
/**
 * AETHER Test Runner
 * Runs all unit tests and reports results
 */

console.log('\n');
console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║                  ÆTHER TEST SUITE                        ║');
console.log('╚══════════════════════════════════════════════════════════╝');
console.log('\n');

const tests = [
  './vectorStore.test.js',
  './openaiClient.test.js',
  './tokenBudget.test.js'
];

let passedTests = 0;
let failedTests = 0;

for (const test of tests) {
  try {
    console.log(`Running: ${test}`);
    console.log('─'.repeat(60));
    await import(test);
    passedTests++;
    console.log('─'.repeat(60));
    console.log('');
  } catch (error) {
    failedTests++;
    console.error(`\n❌ Test failed: ${test}`);
    console.error(error);
    console.log('');
  }
}

console.log('═'.repeat(60));
console.log('TEST SUMMARY');
console.log('═'.repeat(60));
console.log(`✅ Passed: ${passedTests}/${tests.length}`);
console.log(`❌ Failed: ${failedTests}/${tests.length}`);
console.log('');

if (failedTests === 0) {
  console.log('🎉 All tests passed!');
  process.exit(0);
} else {
  console.error('⚠️  Some tests failed');
  process.exit(1);
}
