import express from 'express';
import { auditEngine } from '../lib/aether/auditEngine.js';
import { reportGenerator } from '../lib/aether/reportGenerator.js';
import { aetherAuthMiddleware } from '../lib/aether/rbacMiddleware.js';
import { getWeights, resetAuditWeights } from '../lib/aether/aetherLearn.js';

const router = express.Router();

/**
 * POST /api/aether/audit/run
 * Start a new SEO audit
 */
router.post('/run', aetherAuthMiddleware, async (req, res) => {
  try {
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

    // Generate audit ID first
    const auditId = auditEngine.generateAuditId();
    const correlationId = req.headers['x-correlation-id'] || null;
    
    // Run audit asynchronously with the pre-generated ID
    auditEngine.runAudit(url, modules, correlationId, auditId)
      .catch(err => {
        console.error('[AuditAPI] Background audit failed:', err);
      });

    // Immediately return audit_id and queued status
    res.json({
      audit_id: auditId,
      status: 'queued',
      message: 'Audit started, check status at /api/aether/audit/:audit_id'
    });
  } catch (error) {
    console.error('[AuditAPI] Error starting audit:', error);
    res.status(500).json({
      error: 'Failed to start audit',
      message: error.message
    });
  }
});

/**
 * GET /api/aether/audit/:audit_id
 * Get audit results by ID
 */
router.get('/:audit_id', aetherAuthMiddleware, async (req, res) => {
  try {
    const { audit_id } = req.params;

    const audit = auditEngine.getAudit(audit_id);

    if (!audit) {
      return res.status(404).json({
        error: 'Audit not found',
        audit_id
      });
    }

    res.json(audit);
  } catch (error) {
    console.error('[AuditAPI] Error fetching audit:', error);
    res.status(500).json({
      error: 'Failed to fetch audit',
      message: error.message
    });
  }
});

/**
 * GET /api/aether/audit/:audit_id/report.pdf
 * Download PDF report for audit
 */
router.get('/:audit_id/report.pdf', aetherAuthMiddleware, async (req, res) => {
  try {
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
  } catch (error) {
    console.error('[AuditAPI] Error generating PDF:', error);
    res.status(500).json({
      error: 'Failed to generate PDF report',
      message: error.message
    });
  }
});

/**
 * GET /api/aether/audits
 * List recent audits
 */
router.get('/', aetherAuthMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const result = auditEngine.listAudits(limit, offset);

    res.json(result);
  } catch (error) {
    console.error('[AuditAPI] Error listing audits:', error);
    res.status(500).json({
      error: 'Failed to list audits',
      message: error.message
    });
  }
});

/**
 * GET /api/aether/weights
 * Get current AETHER learning weights for audit modules
 */
router.get('/weights', aetherAuthMiddleware, async (req, res) => {
  try {
    const weights = getWeights();
    
    res.json({
      weights,
      learningEnabled: process.env.AETHER_LEARNING_MODE === 'true',
      description: 'Adaptive weights for SEO audit module impact correlation'
    });
  } catch (error) {
    console.error('[AuditAPI] Error fetching weights:', error);
    res.status(500).json({
      error: 'Failed to fetch learning weights',
      message: error.message
    });
  }
});

/**
 * POST /api/aether/weights/reset
 * Reset learning weights to defaults (admin only)
 */
router.post('/weights/reset', aetherAuthMiddleware, async (req, res) => {
  try {
    const weights = resetAuditWeights();
    
    res.json({
      success: true,
      weights,
      message: 'Learning weights reset to defaults'
    });
  } catch (error) {
    console.error('[AuditAPI] Error resetting weights:', error);
    res.status(500).json({
      error: 'Failed to reset weights',
      message: error.message
    });
  }
});

export default router;
