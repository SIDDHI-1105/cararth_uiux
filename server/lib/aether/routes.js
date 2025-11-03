import express from 'express';
import { productionAetherService } from './productionService.js';
import { experimentsService } from './experimentsService.js';
import { cacheLayer } from './cacheLayer.js';
import { tokenBudget } from './tokenBudget.js';
import { vectorStore } from './vectorStore.js';
import { aetherLearn } from './aetherLearn.js';
import { scheduler } from './scheduler.js';
import { auditEngine } from './auditEngine.js';
import { reportGenerator } from './reportGenerator.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

/**
 * Async handler wrapper
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Health endpoint - no auth required for monitoring
 */
router.get('/health', asyncHandler(async (req, res) => {
  const health = productionAetherService.getHealth();
  res.json(health);
}));

/**
 * Run single GEO sweep
 */
router.post('/sweep', asyncHandler(async (req, res) => {
  const { promptText, promptCategory, model } = req.body;
  
  if (!promptText || promptText.length < 5) {
    return res.status(400).json({ error: 'promptText is required (min 5 chars)' });
  }

  const result = await productionAetherService.runGeoSweep({
    promptText,
    promptCategory,
    model
  });

  res.json({
    success: true,
    sweep_id: result.id,
    status: 'completed',
    result
  });
}));

/**
 * Get sweep by ID
 */
router.get('/sweep/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const sweep = productionAetherService.getSweepById(id);
  
  if (!sweep) {
    return res.status(404).json({ error: 'Sweep not found' });
  }

  res.json(sweep);
}));

/**
 * Run batch sweeps
 */
router.post('/sweeps/batch', asyncHandler(async (req, res) => {
  const { prompts } = req.body;
  
  if (!Array.isArray(prompts) || prompts.length === 0) {
    return res.status(400).json({ error: 'prompts array is required' });
  }

  // Queue batch operation (run async)
  const batchId = `batch_${Date.now()}`;
  
  // Start async execution
  productionAetherService.runBatchSweeps(prompts).catch(err => {
    console.error('[AETHER] Batch sweep failed:', err);
  });

  res.json({
    success: true,
    batch_id: batchId,
    status: 'queued',
    total_prompts: prompts.length,
    message: 'Batch sweep started'
  });
}));

/**
 * Get recent sweeps
 */
router.get('/sweeps', asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const sweeps = productionAetherService.loadSweeps(limit);
  
  res.json({
    sweeps,
    total: sweeps.length
  });
}));

/**
 * Get sweep statistics
 */
router.get('/sweeps/stats', asyncHandler(async (req, res) => {
  const sweeps = productionAetherService.loadSweeps(1000);
  const mentioned = sweeps.filter(s => s.cararthMentioned).length;
  const totalCost = sweeps.reduce((sum, s) => sum + parseFloat(s.cost || 0), 0);
  
  res.json({
    totalSweeps: sweeps.length,
    mentionedSweeps: mentioned,
    mentionRate: sweeps.length > 0 ? ((mentioned / sweeps.length) * 100).toFixed(1) + '%' : '0%',
    totalCost: totalCost.toFixed(6),
    avgRelevance: 0
  });
}));

/**
 * Generate content brief
 */
router.post('/content', asyncHandler(async (req, res) => {
  const { topic, targetKeywords, contentType } = req.body;
  
  if (!topic) {
    return res.status(400).json({ error: 'topic is required' });
  }

  const brief = await productionAetherService.generateContentBrief({
    topic,
    targetKeywords: targetKeywords || [],
    contentType: contentType || 'article'
  });

  res.json({
    success: true,
    brief
  });
}));

/**
 * Create and run experiment
 */
router.post('/experiment', asyncHandler(async (req, res) => {
  const { brief_id, promptId, page, kpis, duration_days, metadata } = req.body;
  
  if (!page) {
    return res.status(400).json({ error: 'page is required' });
  }

  const experiment = await experimentsService.createExperiment({
    briefId: brief_id,
    promptId,
    page,
    kpis: kpis || { geo_delta: 0, organic_pct: 0 },
    durationDays: duration_days || 0,
    metadata: metadata || {}
  });

  res.json({
    success: true,
    experiment
  });
}));

/**
 * Get experiments list
 */
router.get('/experiments', asyncHandler(async (req, res) => {
  const filters = {
    status: req.query.status,
    page: req.query.page,
    limit: parseInt(req.query.limit) || 100,
    offset: parseInt(req.query.offset) || 0
  };

  const result = experimentsService.getExperiments(filters);
  res.json(result);
}));

/**
 * Get experiment by ID
 */
router.get('/experiment/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const experiment = experimentsService.getExperiment(id);
  
  if (!experiment) {
    return res.status(404).json({ error: 'Experiment not found' });
  }

  res.json(experiment);
}));

/**
 * Get experiment statistics
 */
router.get('/experiments/stats', asyncHandler(async (req, res) => {
  const stats = experimentsService.getStats();
  res.json(stats);
}));

/**
 * Get cache statistics
 */
router.get('/cache/stats', asyncHandler(async (req, res) => {
  const stats = cacheLayer.getStats();
  res.json(stats);
}));

/**
 * Clear cache
 */
router.post('/cache/clear', asyncHandler(async (req, res) => {
  const cleared = cacheLayer.clear();
  res.json({
    success: true,
    cleared,
    message: `Cleared ${cleared} cache entries`
  });
}));

/**
 * Get token budget status
 */
router.get('/budget/stats', asyncHandler(async (req, res) => {
  const stats = tokenBudget.getStats();
  const breakdown = tokenBudget.getUsageBreakdown();
  
  res.json({
    ...stats,
    breakdown
  });
}));

/**
 * Set daily token cap (admin only)
 */
router.post('/budget/set-cap', asyncHandler(async (req, res) => {
  const { cap } = req.body;
  
  if (typeof cap !== 'number' || cap < 0) {
    return res.status(400).json({ error: 'cap must be a positive number' });
  }

  const stats = tokenBudget.setDailyCap(cap);
  
  res.json({
    success: true,
    message: `Daily cap updated to ${cap} tokens`,
    stats
  });
}));

/**
 * Get learning weights statistics
 */
router.get('/learn/stats', asyncHandler(async (req, res) => {
  const stats = aetherLearn.getStats();
  res.json(stats);
}));

/**
 * Set learning rate
 */
router.post('/learn/set-rate', asyncHandler(async (req, res) => {
  const { rate } = req.body;
  
  if (typeof rate !== 'number' || rate <= 0 || rate > 1) {
    return res.status(400).json({ error: 'rate must be between 0 and 1' });
  }

  const success = aetherLearn.setLearningRate(rate);
  
  if (!success) {
    return res.status(400).json({ error: 'Failed to set learning rate' });
  }

  res.json({
    success: true,
    rate,
    message: `Learning rate updated to ${rate}`
  });
}));

/**
 * Get vector store statistics
 */
router.get('/vectors/stats', asyncHandler(async (req, res) => {
  const stats = vectorStore.stats();
  res.json(stats);
}));

/**
 * Get scheduler status
 */
router.get('/scheduler/status', asyncHandler(async (req, res) => {
  const status = scheduler.getStatus();
  res.json(status);
}));

/**
 * Clear initial sweep lock (for testing)
 */
router.post('/scheduler/clear-lock', asyncHandler(async (req, res) => {
  const cleared = scheduler.clearLock();
  
  res.json({
    success: cleared,
    message: cleared ? 'Lock file cleared' : 'No lock file found'
  });
}));

/**
 * Run initial sweep manually
 */
router.post('/scheduler/run-initial-sweep', asyncHandler(async (req, res) => {
  // Load prompts from file
  const promptsPath = path.join(__dirname, '../../../data/aether/prompts.json');
  const prompts = JSON.parse(fs.readFileSync(promptsPath, 'utf8'));
  
  // Take first 10 prompts for demo
  const demoPrompts = prompts.slice(0, 10).map(p => ({
    text: p.text,
    category: p.category
  }));

  const result = await scheduler.runInitialSweep(async () => {
    return await productionAetherService.runBatchSweeps(demoPrompts);
  });

  res.json({
    success: !result.skipped,
    result
  });
}));

/**
 * ============================================
 * SEO AUDIT ENDPOINTS
 * ============================================
 */

/**
 * POST /audit/run
 * Start a new SEO audit
 */
router.post('/audit/run', asyncHandler(async (req, res) => {
  const { url, modules } = req.body;

  if (!url) {
    return res.status(400).json({
      error: 'Missing required parameter: url'
    });
  }

  // Validate URL
  try {
    new URL(url);
  } catch (err) {
    return res.status(400).json({
      error: 'Invalid URL format'
    });
  }

  const correlationId = req.headers['x-correlation-id'] || null;
  
  // Start audit (returns Promise, runs async)
  const auditPromise = auditEngine.runAudit(url, modules, correlationId);
  
  // Get audit ID early
  const auditId = auditEngine.generateAuditId();
  
  // Run in background
  auditPromise.catch(err => {
    console.error('[AuditAPI] Background audit failed:', err);
  });

  res.json({
    audit_id: auditId,
    status: 'queued',
    message: 'Audit started, check status at /api/aether/audit/:audit_id'
  });
}));

/**
 * GET /audit/:audit_id
 * Get audit results by ID
 */
router.get('/audit/:audit_id', asyncHandler(async (req, res) => {
  const { audit_id } = req.params;

  const audit = auditEngine.getAudit(audit_id);

  if (!audit) {
    return res.status(404).json({
      error: 'Audit not found',
      audit_id
    });
  }

  res.json(audit);
}));

/**
 * GET /audit/:audit_id/report.pdf
 * Download PDF report for audit
 */
router.get('/audit/:audit_id/report.pdf', asyncHandler(async (req, res) => {
  const { audit_id } = req.params;

  const audit = auditEngine.getAudit(audit_id);

  if (!audit) {
    return res.status(404).json({
      error: 'Audit not found',
      audit_id
    });
  }

  if (audit.status !== 'completed') {
    return res.status(400).json({
      error: 'Audit not yet completed',
      status: audit.status
    });
  }

  // Generate PDF
  const pdfBuffer = await reportGenerator.generatePDF(audit);

  // Set headers for PDF download
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${audit_id}_report.pdf"`);
  res.setHeader('Content-Length', pdfBuffer.length);

  res.send(pdfBuffer);
}));

/**
 * GET /audits
 * List recent audits
 */
router.get('/audits', asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;

  const result = auditEngine.listAudits(limit, offset);

  res.json(result);
}));

export default router;
