import { openaiClient } from '../../lib/aether/openaiClient.js';
import assert from 'assert';

console.log('🧪 Testing OpenAI Client...\n');

// Test 1: Mock Mode Detection
console.log('Test 1: Mock Mode Detection');
const isMock = openaiClient.isMockMode();
if (isMock) {
  console.log('✅ PASS: Running in mock mode (no OPENAI_API_KEY detected)\n');
} else {
  console.log('✅ PASS: Running with real OpenAI client (OPENAI_API_KEY found)\n');
}

// Test 2: Chat Completion (Mock or Real)
console.log('Test 2: Chat Completion');
try {
  const result = await openaiClient.chatCompletion(
    'What are the best used car platforms in India?',
    { correlationId: 'test_123' }
  );

  assert(result.content, 'Should return content');
  assert(result.tokens > 0, 'Should track tokens');
  assert(result.model, 'Should return model name');
  
  if (result.mock) {
    console.log(`✅ PASS: Mock chat completion (${result.tokens} tokens, mock mode)\n`);
  } else {
    console.log(`✅ PASS: Real chat completion (${result.tokens} tokens, cost: $${result.cost})\n`);
  }
} catch (error) {
  console.error('❌ FAIL: Chat completion failed', error.message);
  throw error;
}

// Test 3: Deterministic Mock Behavior
if (isMock) {
  console.log('Test 3: Deterministic Mock Behavior');
  const prompt = 'Best used cars in Hyderabad';
  
  const result1 = await openaiClient.chatCompletion(prompt);
  const result2 = await openaiClient.chatCompletion(prompt);
  
  assert.deepEqual(result1.content, result2.content, 'Same prompt should produce identical mock responses');
  assert.equal(result1.tokens, result2.tokens, 'Token counts should be identical');
  
  console.log('✅ PASS: Deterministic mock behavior verified\n');
}

// Test 4: Token Counting
console.log('Test 4: Token Counting');
const shortPrompt = 'Hello';
const longPrompt = 'Tell me everything about used car markets in India, Delhi, Mumbai, Bangalore, Hyderabad, and Pune with detailed analysis of pricing trends, dealer networks, customer preferences, and market dynamics over the past 5 years.';

const shortResult = await openaiClient.chatCompletion(shortPrompt);
const longResult = await openaiClient.chatCompletion(longPrompt);

assert(longResult.tokens > shortResult.tokens, 'Longer prompts should use more tokens');
console.log(`✅ PASS: Token counting (short: ${shortResult.tokens}, long: ${longResult.tokens})\n`);

console.log('🎉 All OpenAI Client tests passed!\n');
