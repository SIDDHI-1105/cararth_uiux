/**
 * AETHER Auto-SEO Content Generation Routes
 * API endpoints for hyperlocal car article generation
 */

import express from 'express';
import { z } from 'zod';
import { contentGenerator } from './generator.js';
import { contentPublisher } from './publisher.js';
import { impactTracker } from './impactTracker.js';
import { aetherAuthMiddleware } from '../rbacMiddleware.js';

const router = express.Router();

/**
 * Validation schemas
 */
const generateArticleSchema = z.object({
  topic: z.string().min(5).max(200),
  city: z.string().min(2).max(100)
});

const listArticlesSchema = z.object({
  city: z.string().optional(),
  status: z.enum(['draft', 'published']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0)
});

/**
 * POST /api/aether/content/generate
 * Generate new article with hyperlocal content
 */
router.post('/generate', async (req, res) => {
  try {
    console.log('[AETHER Content API] Starting generate request...');
    
    // Validate request body
    const validated = generateArticleSchema.parse(req.body);
    
    console.log(`[AETHER Content API] Generate request validated: ${validated.topic} in ${validated.city}`);
    
    // Generate article
    const article = await contentGenerator.generateArticle({
      topic: validated.topic,
      city: validated.city
    });
    
    console.log(`[AETHER Content API] Article generated, sending response...`);
    
    res.status(200).json({
      success: true,
      article: {
        id: article.id,
        city: article.city,
        topic: article.topic,
        slug: article.slug,
        meta: article.meta,
        geoIntro: article.geoIntro,
        contentHtml: article.contentHtml,
        schema: article.schema,
        internalLinks: article.internalLinks,
        cta: article.cta,
        seoChecklist: article.seoChecklist,
        status: article.status,
        wordCount: article.wordCount,
        createdAt: article.createdAt
      },
      mock: article.mock || false
    });
  } catch (error) {
    console.error('[AETHER Content API] Generate error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }
    
    if (error.message.includes('token budget')) {
      return res.status(429).json({
        success: false,
        error: 'Token budget exceeded',
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to generate article',
      message: error.message
    });
  }
});

/**
 * GET /api/aether/content/preview/:id
 * Get article preview with metadata and SEO checklist
 */
router.get('/preview/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Article ID is required'
      });
    }
    
    console.log(`[AETHER Content API] Preview request: ${id}`);
    
    const article = await contentGenerator.getArticlePreview(id);
    
    if (!article) {
      return res.status(404).json({
        success: false,
        error: 'Article not found'
      });
    }
    
    res.json({
      success: true,
      article: {
        id: article.id,
        city: article.city,
        topic: article.topic,
        slug: article.slug,
        meta: article.meta,
        geoIntro: article.geoIntro,
        contentPreview: article.preview,
        schema: article.schema,
        internalLinks: article.internalLinks,
        cta: article.cta,
        seoChecklist: article.seoChecklist,
        status: article.status,
        wordCount: article.wordCount,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt
      }
    });
  } catch (error) {
    console.error('[AETHER Content API] Preview error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get article preview',
      message: error.message
    });
  }
});

/**
 * GET /api/aether/content/list
 * List all articles with optional filters
 */
router.get('/list', async (req, res) => {
  try {
    // Validate query parameters
    const validated = listArticlesSchema.parse(req.query);
    
    console.log(`[AETHER Content API] List request:`, validated);
    
    const result = await contentGenerator.listArticles({
      city: validated.city,
      status: validated.status,
      limit: validated.limit,
      offset: validated.offset
    });
    
    res.json({
      success: true,
      ...result,
      filters: {
        city: validated.city || null,
        status: validated.status || null
      }
    });
  } catch (error) {
    console.error('[AETHER Content API] List error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to list articles',
      message: error.message
    });
  }
});

/**
 * GET /api/aether/content/:id
 * Get full article by ID (including complete HTML content)
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Article ID is required'
      });
    }
    
    console.log(`[AETHER Content API] Get article: ${id}`);
    
    const article = await contentGenerator.getArticlePreview(id);
    
    if (!article) {
      return res.status(404).json({
        success: false,
        error: 'Article not found'
      });
    }
    
    // Return full article (not just preview)
    res.json({
      success: true,
      article: {
        id: article.id,
        city: article.city,
        topic: article.topic,
        slug: article.slug,
        meta: article.meta,
        geoIntro: article.geoIntro,
        contentHtml: article.contentHtml, // Full HTML
        schema: article.schema,
        internalLinks: article.internalLinks,
        cta: article.cta,
        seoChecklist: article.seoChecklist,
        status: article.status,
        wordCount: article.wordCount,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
        cmsRef: article.cmsRef
      }
    });
  } catch (error) {
    console.error('[AETHER Content API] Get article error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get article',
      message: error.message
    });
  }
});

/**
 * POST /api/aether/content/publish/:id
 * Publish article (Mode A: JSON bundle, Mode B: CMS push)
 */
router.post('/publish/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Article ID is required'
      });
    }
    
    console.log(`[AETHER Content API] Publish request: ${id}`);
    
    const result = await contentPublisher.publishArticle(id);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('[AETHER Content API] Publish error:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('already published')) {
      return res.status(409).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to publish article',
      message: error.message
    });
  }
});

/**
 * POST /api/aether/content/unpublish/:id
 * Unpublish article (Mode B only)
 */
router.post('/unpublish/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Article ID is required'
      });
    }
    
    console.log(`[AETHER Content API] Unpublish request: ${id}`);
    
    const result = await contentPublisher.unpublishArticle(id);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('[AETHER Content API] Unpublish error:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('only available in Mode B')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('not published')) {
      return res.status(409).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to unpublish article',
      message: error.message
    });
  }
});

/**
 * GET /api/aether/content/diff/:id
 * Compare draft vs published version (Mode B only)
 */
router.get('/diff/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Article ID is required'
      });
    }
    
    console.log(`[AETHER Content API] Version diff request: ${id}`);
    
    const diff = await contentPublisher.getVersionDiff(id);
    
    res.status(200).json({
      success: true,
      ...diff
    });
  } catch (error) {
    console.error('[AETHER Content API] Version diff error:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to get version diff',
      message: error.message
    });
  }
});

/**
 * GET /api/aether/content/impact/aggregate
 * Get aggregated impact metrics from last 5 published articles (for Needle Movement widget)
 */
router.get('/impact/aggregate', async (req, res) => {
  try {
    console.log(`[AETHER Content API] Impact metrics request: aggregate`);
    
    const impact = await impactTracker.getAggregateImpact();
    
    res.status(200).json({
      success: true,
      ...impact
    });
  } catch (error) {
    console.error('[AETHER Content API] Aggregate impact error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get aggregate impact metrics',
      message: error.message
    });
  }
});

/**
 * GET /api/aether/content/impact/:id
 * Get impact metrics with deltas for specific article
 */
router.get('/impact/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Article ID is required'
      });
    }
    
    console.log(`[AETHER Content API] Impact metrics request: ${id}`);
    
    const impact = await impactTracker.getArticleImpact(id);
    
    res.status(200).json({
      success: true,
      ...impact
    });
  } catch (error) {
    console.error('[AETHER Content API] Impact metrics error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get impact metrics',
      message: error.message
    });
  }
});

/**
 * POST /api/aether/content/track-impact/:id
 * Manually trigger impact tracking for specific article
 */
router.post('/track-impact/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Article ID is required'
      });
    }
    
    console.log(`[AETHER Content API] Track impact request: ${id}`);
    
    const result = await impactTracker.trackArticleImpact(id);
    
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('[AETHER Content API] Track impact error:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to track impact',
      message: error.message
    });
  }
});

/**
 * POST /api/aether/content/track-all-impacts
 * Track impact for all published articles (last 30 days)
 */
router.post('/track-all-impacts', async (req, res) => {
  try {
    console.log('[AETHER Content API] Track all impacts request');
    
    const results = await impactTracker.trackAllArticles();
    
    res.status(200).json({
      success: true,
      ...results
    });
  } catch (error) {
    console.error('[AETHER Content API] Track all impacts error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to track all impacts',
      message: error.message
    });
  }
});

export default router;
