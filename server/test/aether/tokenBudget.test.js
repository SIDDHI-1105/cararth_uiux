import { tokenBudget } from '../../lib/aether/tokenBudget.js';
import assert from 'assert';

console.log('🧪 Testing Token Budget...\n');

// Test 1: Get Stats
console.log('Test 1: Get Budget Stats');
const stats = tokenBudget.getStats();

assert(stats.dailyCap !== undefined, 'Should have daily cap');
assert(stats.tokensUsed !== undefined, 'Should track tokens used');
assert(stats.tokensRemaining !== undefined, 'Should calculate remaining tokens');
assert(stats.resetTime, 'Should show reset time');

console.log(`✅ PASS: Budget stats (cap: ${stats.dailyCap}, used: ${stats.tokensUsed}, remaining: ${stats.tokensRemaining})\n`);

// Test 2: Can Use Tokens Check
console.log('Test 2: Can Use Tokens Check');
const canUseSmal = tokenBudget.canUseTokens(100);
const canUseLarge = tokenBudget.canUseTokens(1000000);

assert(typeof canUseSmall === 'boolean', 'Should return boolean');
if (stats.dailyCap > 0) {
  assert(canUseSmall === true || stats.tokensRemaining < 100, 'Small requests should generally be allowed');
  console.log(`✅ PASS: Can use 100 tokens: ${canUseSmall}`);
  console.log(`✅ PASS: Can use 1M tokens: ${canUseLarge}\n`);
} else {
  console.log('⏭️  SKIP: Budget cap is 0 (disabled)\n');
}

// Test 3: Usage Breakdown
console.log('Test 3: Usage Breakdown');
const breakdown = tokenBudget.getUsageBreakdown();

assert(breakdown.operations, 'Should have operations list');
assert(breakdown.date, 'Should include date');
assert(breakdown.totalTokens !== undefined, 'Should track total tokens');

console.log(`✅ PASS: Usage breakdown (${breakdown.operations.length} operations, ${breakdown.totalTokens} total tokens)\n`);

if (breakdown.operations.length > 0) {
  console.log('Recent operations:');
  breakdown.operations.slice(0, 3).forEach(op => {
    console.log(`  - ${op.operation}: ${op.count} calls, ${op.tokens} tokens`);
  });
  console.log('');
}

// Test 4: Today's Usage
console.log('Test 4: Today\'s Usage Calculation');
const today = tokenBudget.getTodayString();
const todayUsage = tokenBudget.getTodayUsage();

assert(typeof today === 'string', 'Should return date string');
assert(typeof todayUsage === 'number', 'Should return number');
assert(todayUsage >= 0, 'Usage should be non-negative');

console.log(`✅ PASS: Today (${today}) usage: ${todayUsage} tokens\n`);

console.log('🎉 All Token Budget tests passed!\n');
