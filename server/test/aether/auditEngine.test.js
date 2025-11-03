import { runAudit } from '../../lib/aether/auditEngine.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function assert(condition, message) {
  if (!condition) {
    throw new Error(`❌ Assertion failed: ${message}`);
  }
  console.log(`✓ ${message}`);
}

async function testAuditEngineOrchestrator() {
  console.log('\n🧪 Testing Audit Engine Orchestrator...\n');

  const testUrl = 'https://cararth.com/test-page';
  const result = await runAudit(testUrl);

  assert(result.audit_id, 'Audit ID should be generated');
  assert(result.audit_id.startsWith('audit_'), 'Audit ID should have correct prefix');
  assert(result.url === testUrl, 'URL should match input');
  assert(result.status === 'completed', 'Status should be completed');
  assert(result.correlation_id, 'Correlation ID should be generated');
  assert(typeof result.score === 'number', 'Score should be a number');
  assert(result.score >= 0 && result.score <= 100, 'Score should be between 0-100');

  assert(result.modules, 'Modules should exist');
  assert(result.modules.indexability, 'Indexability module should exist');
  assert(result.modules.schema, 'Schema module should exist');
  assert(result.modules.content, 'Content module should exist');
  assert(result.modules.performance, 'Performance module should exist');
  assert(result.modules.geo, 'GEO module should exist');

  assert(Array.isArray(result.modules.indexability.issues), 'Indexability issues should be array');
  assert(typeof result.modules.indexability.categoryScore === 'number', 'Indexability score should be number');

  assert(Array.isArray(result.impactMatrix), 'Impact matrix should be array');

  console.log(`✅ Audit completed with score: ${result.score}`);
  console.log(`✅ Found ${result.impactMatrix.length} issues across all modules`);
}

async function testAuditDataPersistence() {
  console.log('\n🧪 Testing Audit Data Persistence...\n');

  const testUrl = 'https://cararth.com/persistence-test';
  const result = await runAudit(testUrl);
  
  const auditFilePath = `data/aether/audits/${result.audit_id}.json`;
  assert(existsSync(auditFilePath), `Audit file should exist at ${auditFilePath}`);
  
  const savedData = JSON.parse(readFileSync(auditFilePath, 'utf8'));
  assert(savedData.audit_id === result.audit_id, 'Saved audit ID should match');
  assert(savedData.score === result.score, 'Saved score should match');
  
  console.log(`✅ Audit data persisted correctly`);
}

async function testWeightedScoring() {
  console.log('\n🧪 Testing Weighted Scoring System...\n');

  const result = await runAudit('https://cararth.com/weights-test');
  
  const weights = {
    indexability: 0.30,
    schema: 0.25,
    content: 0.20,
    performance: 0.15,
    geo: 0.10
  };
  
  const calculatedScore = 
    result.modules.indexability.categoryScore * weights.indexability +
    result.modules.schema.categoryScore * weights.schema +
    result.modules.content.categoryScore * weights.content +
    result.modules.performance.categoryScore * weights.performance +
    result.modules.geo.categoryScore * weights.geo;
  
  const scoreDiff = Math.abs(result.score - calculatedScore);
  assert(scoreDiff < 1, `Weighted score calculation should be correct (diff: ${scoreDiff})`);
  
  console.log(`✅ Weighted scoring verified`);
}

async function testCorrelationIdTracking() {
  console.log('\n🧪 Testing Correlation ID Tracking...\n');

  const result1 = await runAudit('https://cararth.com/correlation-1');
  const result2 = await runAudit('https://cararth.com/correlation-2');
  
  assert(result1.correlation_id, 'First audit should have correlation ID');
  assert(result2.correlation_id, 'Second audit should have correlation ID');
  assert(result1.correlation_id !== result2.correlation_id, 'Correlation IDs should be unique');
  
  console.log(`✅ Correlation ID tracking working`);
}

async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  ÆTHER SEO Audit Engine - Unit Tests');
  console.log('═══════════════════════════════════════════════════════');

  try {
    await testAuditEngineOrchestrator();
    await testAuditDataPersistence();
    await testWeightedScoring();
    await testCorrelationIdTracking();

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  ✅ All Audit Engine tests passed!');
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
