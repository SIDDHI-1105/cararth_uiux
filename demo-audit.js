#!/usr/bin/env node
/**
 * Demo Script: Run ÆTHER SEO Audit
 * Demonstrates the audit system with real output
 */

import { auditEngine } from './server/lib/aether/auditEngine.js';

console.log('🔍 ÆTHER SEO AUDIT 2.0 - LIVE DEMO\n');
console.log('═'.repeat(60));
console.log('Target: https://cararth.com');
console.log('Modules: All (indexability, schema, content, performance, geo)');
console.log('═'.repeat(60));
console.log('');

try {
  console.log('⏳ Starting audit...\n');
  
  const startTime = Date.now();
  const result = await auditEngine.runAudit('https://cararth.com');
  const duration = Date.now() - startTime;
  
  console.log('✅ Audit Complete!\n');
  console.log('═'.repeat(60));
  console.log('AUDIT RESULTS');
  console.log('═'.repeat(60));
  console.log('');
  
  // Overall Score
  const scoreColor = result.score >= 80 ? '🟢' : result.score >= 50 ? '🟡' : '🔴';
  console.log(`${scoreColor} Overall SEO Health Score: ${result.score}/100`);
  console.log(`⏱️  Duration: ${duration}ms`);
  console.log(`🆔 Audit ID: ${result.audit_id}`);
  console.log(`🔗 Correlation ID: ${result.correlation_id}`);
  console.log('');
  
  // Module Scores
  console.log('─'.repeat(60));
  console.log('MODULE SCORES:');
  console.log('─'.repeat(60));
  
  const modules = result.modules;
  for (const [moduleName, moduleData] of Object.entries(modules)) {
    const moduleScore = moduleData.categoryScore;
    const moduleEmoji = moduleScore >= 80 ? '✅' : moduleScore >= 50 ? '⚠️' : '❌';
    const capitalizedName = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);
    console.log(`${moduleEmoji} ${capitalizedName.padEnd(20)} ${moduleScore}/100 (${moduleData.issues.length} issues)`);
  }
  console.log('');
  
  // Top Issues
  console.log('─'.repeat(60));
  console.log('TOP 5 CRITICAL ISSUES (by Impact):');
  console.log('─'.repeat(60));
  console.log('');
  
  const topIssues = result.impactMatrix.slice(0, 5);
  topIssues.forEach((issue, index) => {
    const severityEmoji = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🔵'
    }[issue.severity] || '⚪';
    
    console.log(`${index + 1}. ${severityEmoji} [${issue.severity.toUpperCase()}] ${issue.description}`);
    console.log(`   📄 Page: ${issue.page}`);
    console.log(`   📊 Impact Score: ${(issue.impact * 100).toFixed(1)}%`);
    console.log(`   💡 Fix: ${issue.suggested_fix}`);
    console.log('');
  });
  
  // Issue Breakdown
  console.log('─'.repeat(60));
  console.log('ISSUE BREAKDOWN BY SEVERITY:');
  console.log('─'.repeat(60));
  
  const allIssues = [];
  for (const moduleData of Object.values(modules)) {
    allIssues.push(...moduleData.issues);
  }
  
  const severityCounts = {
    critical: allIssues.filter(i => i.severity === 'critical').length,
    high: allIssues.filter(i => i.severity === 'high').length,
    medium: allIssues.filter(i => i.severity === 'medium').length,
    low: allIssues.filter(i => i.severity === 'low').length
  };
  
  console.log(`🔴 Critical: ${severityCounts.critical}`);
  console.log(`🟠 High:     ${severityCounts.high}`);
  console.log(`🟡 Medium:   ${severityCounts.medium}`);
  console.log(`🔵 Low:      ${severityCounts.low}`);
  console.log(`📋 Total:    ${allIssues.length} issues found`);
  console.log('');
  
  // File Locations
  console.log('─'.repeat(60));
  console.log('FILES GENERATED:');
  console.log('─'.repeat(60));
  console.log(`📁 Full audit JSON: data/aether/audits/${result.audit_id}.json`);
  console.log(`📄 PDF report: /api/aether/audit/${result.audit_id}/report.pdf`);
  console.log('');
  
  // Next Steps
  console.log('═'.repeat(60));
  console.log('NEXT STEPS:');
  console.log('═'.repeat(60));
  console.log('1. View full results in the dashboard:');
  console.log(`   http://localhost:5000/admin/aether (Structural Audit tab)`);
  console.log('');
  console.log('2. Download PDF report:');
  console.log(`   http://localhost:5000/api/aether/audit/${result.audit_id}/report.pdf`);
  console.log('');
  console.log('3. Review detailed JSON:');
  console.log(`   cat data/aether/audits/${result.audit_id}.json`);
  console.log('');
  console.log('═'.repeat(60));
  
} catch (error) {
  console.error('❌ Audit failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}
