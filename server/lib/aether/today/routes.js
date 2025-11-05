import express from 'express';
import { rankActionsForCity, getLatestActions } from './rankActions.js';
import { generateAssetForAction } from './generateAssets.js';
import { db } from '../../../db.js';
import { aetherDailyDigest, aetherActions } from '../../../../shared/schema.js';
import { eq, desc } from 'drizzle-orm';

const router = express.Router();

/**
 * Async handler wrapper
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * POST /run
 * Generate Top 5 actions for a city
 */
router.post('/run', asyncHandler(async (req, res) => {
  const { city = 'Hyderabad' } = req.query;
  
  console.log(`[AETHER Today] Running Top-5 generation for ${city}`);
  
  try {
    // Generate Top 5 actions
    const actions = await rankActionsForCity(city);
    
    // Generate assets for each action
    const actionsWithAssets = await Promise.all(
      actions.map(async (action) => {
        const asset = await generateAssetForAction(action);
        return {
          ...action,
          asset
        };
      })
    );
    
    // Save digest
    const [digest] = await db.insert(aetherDailyDigest).values({
      runAt: new Date(),
      city,
      actions: actionsWithAssets,
      tokenCostUsd: 0, // MVP: no actual LLM calls yet
      notes: `MVP: Generated ${actionsWithAssets.length} actions with mock metrics`
    }).returning();
    
    res.json({
      success: true,
      digest_id: digest.id,
      city,
      actions_generated: actionsWithAssets.length,
      message: `✓ Top ${actionsWithAssets.length} actions generated for ${city}`
    });
    
  } catch (err) {
    console.error('[AETHER Today] Error:', err);
    res.status(500).json({
      error: 'Failed to generate actions',
      message: err.message
    });
  }
}));

/**
 * GET /digest
 * Get latest digest for a city
 */
router.get('/digest', asyncHandler(async (req, res) => {
  const { city = 'Hyderabad', date } = req.query;
  
  try {
    let query = db
      .select()
      .from(aetherDailyDigest)
      .where(eq(aetherDailyDigest.city, city))
      .orderBy(desc(aetherDailyDigest.runAt))
      .limit(1);
    
    const [digest] = await query;
    
    if (!digest) {
      return res.status(404).json({
        error: 'No digest found',
        message: `No digest found for ${city}. Run POST /api/aether/today/run?city=${city} to generate.`
      });
    }
    
    res.json(digest);
    
  } catch (err) {
    console.error('[AETHER Today] Error getting digest:', err);
    res.status(500).json({
      error: 'Failed to get digest',
      message: err.message
    });
  }
}));

/**
 * GET /actions
 * Get actions with optional filtering
 */
router.get('/actions', asyncHandler(async (req, res) => {
  const { city = 'Hyderabad', limit = 10 } = req.query;
  
  try {
    const actions = await getLatestActions(city, parseInt(limit));
    res.json({
      actions,
      count: actions.length
    });
  } catch (err) {
    console.error('[AETHER Today] Error getting actions:', err);
    res.status(500).json({
      error: 'Failed to get actions',
      message: err.message
    });
  }
}));

/**
 * POST /actions/:id/asset
 * Generate/regenerate asset for a specific action
 */
router.post('/actions/:id/asset', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  try {
    // Get action from database
    const [action] = await db
      .select()
      .from(aetherActions)
      .where(eq(aetherActions.id, id))
      .limit(1);
    
    if (!action) {
      return res.status(404).json({
        error: 'Action not found',
        action_id: id
      });
    }
    
    // Generate asset
    const asset = await generateAssetForAction(action);
    
    res.json({
      action_id: id,
      action_title: action.title,
      asset
    });
    
  } catch (err) {
    console.error('[AETHER Today] Error generating asset:', err);
    res.status(500).json({
      error: 'Failed to generate asset',
      message: err.message
    });
  }
}));

export default router;
