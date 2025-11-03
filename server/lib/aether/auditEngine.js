import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { indexabilityChecker } from './checkers/indexabilityChecker.js';
import { schemaChecker } from './checkers/schemaChecker.js';
import { contentSemanticsChecker } from './checkers/contentSemanticsChecker.js';
import { performanceChecker } from './checkers/performanceChecker.js';
import { geoCorrelationChecker } from './checkers/geoCorrelationChecker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUDIT_WEIGHTS = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../config/auditWeights.json'), 'utf8')
);
const AUDITS_DIR = path.join(__dirname, '../../../data/aether/audits');
const AUDITS_REGISTRY = path.join(__dirname, '../../../data/aether/audits.json');
const AGENT_LOG = path.join(__dirname, '../../../data/aether/agent.log');

/**
 * ÆTHER Audit Engine
 * Orchestrates modular checkers and generates comprehensive SEO audit reports
 */
class AuditEngine {
  constructor() {
    this.checkers = {
      indexability: indexabilityChecker,
      schema: schemaChecker,
      content: contentSemanticsChecker,
      performance: performanceChecker,
      geo: geoCorrelationChecker
    };
    
    this.moduleTimeout = 25000; // 25 seconds per module
    this.ensureDirectories();
  }

  /**
   * Ensure audit directories exist
   */
  ensureDirectories() {
    const dirs = [AUDITS_DIR, path.dirname(AUDITS_REGISTRY)];
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }

    // Initialize audits registry if doesn't exist
    if (!fs.existsSync(AUDITS_REGISTRY)) {
      fs.writeFileSync(AUDITS_REGISTRY, JSON.stringify([], null, 2));
    }
  }

  /**
   * Log to agent.log
   */
  logAgent(message, data = {}) {
    const timestamp = new Date().toISOString();
    const entry = JSON.stringify({
      timestamp,
      level: 'info',
      component: 'AuditEngine',
      message,
      ...data
    }) + '\n';
    
    try {
      fs.appendFileSync(AGENT_LOG, entry);
    } catch (err) {
      console.error('Failed to write agent log:', err);
    }
  }

  /**
   * Generate audit ID
   */
  generateAuditId() {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').split('.')[0];
    const random = crypto.randomBytes(2).toString('hex');
    return `audit_${timestamp}_${random}`;
  }

  /**
   * Run full SEO audit
   */
  async runAudit(url, modules = null, correlationId = null, auditId = null) {
    const finalAuditId = auditId || this.generateAuditId();
    const corrId = correlationId || crypto.randomUUID();
    const startTime = Date.now();
    
    this.logAgent('Starting SEO audit', {
      auditId: finalAuditId,
      url,
      correlationId: corrId,
      modules: modules || 'all'
    });

    try {
      // Determine which modules to run
      const modulesToRun = modules || Object.keys(this.checkers);
      
      // Create initial audit record
      const audit = {
        audit_id: finalAuditId,
        url,
        status: 'running',
        correlation_id: corrId,
        timestamp: new Date().toISOString(),
        score: null,
        modules: {},
        impactMatrix: [],
        startTime: Date.now()
      };

      // Save initial state
      this.saveAudit(audit);

      // Run all checkers with timeout
      const moduleResults = await this.runModules(url, modulesToRun, corrId);
      
      // Calculate aggregate score
      const score = this.calculateAggregateScore(moduleResults);
      
      // Generate impact matrix
      const impactMatrix = this.generateImpactMatrix(moduleResults);
      
      // Update audit with results
      audit.status = 'completed';
      audit.score = score;
      audit.modules = moduleResults;
      audit.impactMatrix = impactMatrix;
      audit.duration = Date.now() - startTime;
      
      // Save final audit
      this.saveAudit(audit);
      this.addToRegistry(audit);
      
      this.logAgent('Audit completed', {
        auditId: finalAuditId,
        score,
        duration: audit.duration,
        correlationId: corrId
      });
      
      return audit;
    } catch (error) {
      this.logAgent('Audit failed', {
        auditId: finalAuditId,
        error: error.message,
        correlationId: corrId
      });
      
      // Save failed audit
      const failedAudit = {
        audit_id: finalAuditId,
        url,
        status: 'failed',
        correlation_id: corrId,
        timestamp: new Date().toISOString(),
        error: error.message,
        duration: Date.now() - startTime
      };
      
      this.saveAudit(failedAudit);
      throw error;
    }
  }

  /**
   * Run all checker modules
   */
  async runModules(url, modulesToRun, correlationId) {
    const results = {};
    
    for (const moduleName of modulesToRun) {
      const checker = this.checkers[moduleName];
      if (!checker) {
        console.warn(`[AuditEngine] Unknown module: ${moduleName}`);
        continue;
      }

      try {
        const moduleResult = await Promise.race([
          checker.check(url, correlationId),
          this.timeoutPromise(this.moduleTimeout, moduleName)
        ]);
        
        results[moduleName] = moduleResult;
      } catch (error) {
        console.error(`[AuditEngine] Module ${moduleName} failed:`, error);
        
        // Use fallback/mock on error
        results[moduleName] = {
          category: moduleName,
          issues: [],
          categoryScore: 0,
          error: error.message,
          fallback: true
        };
      }
    }
    
    return results;
  }

  /**
   * Create timeout promise
   */
  timeoutPromise(ms, moduleName) {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Module ${moduleName} timeout after ${ms}ms`));
      }, ms);
    });
  }

  /**
   * Calculate aggregate SEO Health Score (0-100)
   */
  calculateAggregateScore(moduleResults) {
    const weights = AUDIT_WEIGHTS.weights;
    let totalWeightedScore = 0;
    let totalWeight = 0;
    
    for (const [moduleName, result] of Object.entries(moduleResults)) {
      const weight = weights[moduleName] || 0;
      const score = result.categoryScore || 0;
      
      totalWeightedScore += score * weight;
      totalWeight += weight;
    }
    
    if (totalWeight === 0) return 0;
    
    return Math.round(totalWeightedScore / totalWeight);
  }

  /**
   * Generate Impact Matrix
   * Ranked by severity × impact_score × pagesAffected
   */
  generateImpactMatrix(moduleResults) {
    const severityWeights = AUDIT_WEIGHTS.severityWeights;
    const allIssues = [];
    
    // Collect all issues from all modules
    for (const [moduleName, result] of Object.entries(moduleResults)) {
      if (result.issues && Array.isArray(result.issues)) {
        for (const issue of result.issues) {
          const severityWeight = severityWeights[issue.severity] || 0.5;
          const impactScore = issue.impact_score || 0.5;
          const pagesAffected = issue.pagesAffected || 1;
          
          allIssues.push({
            ...issue,
            module: moduleName,
            impactRank: severityWeight * impactScore * pagesAffected
          });
        }
      }
    }
    
    // Sort by impact rank (descending)
    allIssues.sort((a, b) => b.impactRank - a.impactRank);
    
    return allIssues;
  }

  /**
   * Save audit to individual file
   */
  saveAudit(audit) {
    const filePath = path.join(AUDITS_DIR, `${audit.audit_id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(audit, null, 2));
  }

  /**
   * Add audit to registry
   */
  addToRegistry(audit) {
    try {
      const registry = JSON.parse(fs.readFileSync(AUDITS_REGISTRY, 'utf8'));
      
      // Add summary to registry
      registry.unshift({
        audit_id: audit.audit_id,
        url: audit.url,
        status: audit.status,
        score: audit.score,
        timestamp: audit.timestamp,
        duration: audit.duration,
        issueCount: audit.impactMatrix?.length || 0
      });
      
      // Keep only last 100 audits
      if (registry.length > 100) {
        registry.splice(100);
      }
      
      fs.writeFileSync(AUDITS_REGISTRY, JSON.stringify(registry, null, 2));
    } catch (error) {
      console.error('[AuditEngine] Failed to update registry:', error);
    }
  }

  /**
   * Get audit by ID
   */
  getAudit(auditId) {
    const filePath = path.join(AUDITS_DIR, `${auditId}.json`);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  /**
   * List recent audits
   */
  listAudits(limit = 20, offset = 0) {
    try {
      const registry = JSON.parse(fs.readFileSync(AUDITS_REGISTRY, 'utf8'));
      const total = registry.length;
      const audits = registry.slice(offset, offset + limit);
      
      return {
        audits,
        total,
        limit,
        offset
      };
    } catch (error) {
      console.error('[AuditEngine] Failed to list audits:', error);
      return {
        audits: [],
        total: 0,
        limit,
        offset
      };
    }
  }
}

export const auditEngine = new AuditEngine();
