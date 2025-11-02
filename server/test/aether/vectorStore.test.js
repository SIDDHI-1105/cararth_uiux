import { vectorStore } from '../../lib/aether/vectorStore.js';
import assert from 'assert';

console.log('🧪 Testing VectorStore...\n');

// Test 1: Upsert and Get
console.log('Test 1: Upsert and Get');
const testId = 'test_vector_1';
const testVector = [0.1, 0.2, 0.3, 0.4, 0.5];
const testMeta = { description: 'Test vector' };

vectorStore.upsert(testId, testVector, testMeta);
const retrieved = vectorStore.get(testId);

assert(retrieved !== null, 'Retrieved vector should not be null');
assert(retrieved.id === testId, 'ID should match');
assert.deepEqual(retrieved.vector, testVector, 'Vector should match');
assert(retrieved.metadata.description === 'Test vector', 'Metadata should match');
console.log('✅ PASS: Upsert and Get\n');

// Test 2: Cosine Similarity
console.log('Test 2: Cosine Similarity');
const vec1 = [1, 0, 0];
const vec2 = [1, 0, 0]; // Same as vec1
const vec3 = [0, 1, 0]; // Orthogonal to vec1

const sim1 = vectorStore.cosineSimilarity(vec1, vec2);
const sim2 = vectorStore.cosineSimilarity(vec1, vec3);

assert(Math.abs(sim1 - 1.0) < 0.01, 'Identical vectors should have similarity ~1.0');
assert(Math.abs(sim2) < 0.01, 'Orthogonal vectors should have similarity ~0.0');
console.log(`✅ PASS: Cosine Similarity (identical: ${sim1.toFixed(3)}, orthogonal: ${sim2.toFixed(3)})\n`);

// Test 3: Query Top K
console.log('Test 3: Query Top K');
vectorStore.clear();
vectorStore.upsert('v1', [1, 0, 0], { name: 'v1' });
vectorStore.upsert('v2', [0.9, 0.1, 0], { name: 'v2' });
vectorStore.upsert('v3', [0, 1, 0], { name: 'v3' });

const queryVec = [1, 0, 0];
const results = vectorStore.query(queryVec, 2);

assert(results.length === 2, 'Should return top 2 results');
assert(results[0].id === 'v1', 'First result should be v1 (exact match)');
assert(results[1].id === 'v2', 'Second result should be v2 (close match)');
assert(results[0].similarity > results[1].similarity, 'Results should be sorted by similarity');
console.log(`✅ PASS: Query Top K (results: ${results.map(r => r.id).join(', ')})\n`);

// Test 4: Stats
console.log('Test 4: Stats');
const stats = vectorStore.stats();
assert(stats.totalVectors === 3, 'Should have 3 vectors');
assert(stats.dimensions.includes(3), 'Should track dimension 3');
console.log(`✅ PASS: Stats (${stats.totalVectors} vectors, dimensions: ${stats.dimensions})\n`);

console.log('🎉 All VectorStore tests passed!\n');
