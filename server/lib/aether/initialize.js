import aetherRoutes from './routes.js';
import { aetherAuthMiddleware } from './rbacMiddleware.js';
import { scheduler } from './scheduler.js';
import { productionAetherService } from './productionService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Initialize AETHER system
 * - Mount routes with RBAC
 * - Run initial sweep (if not already done)
 * - Schedule weekly sweeps (if cron enabled)
 */
export async function initializeAether(app) {
  console.log('[AETHER] Initializing production system...');

  try {
    // Mount AETHER routes at /api/aether with RBAC middleware
    // Note: Health endpoint is public, others require auth
    app.use('/api/aether', (req, res, next) => {
      // Skip auth for health endpoint
      if (req.path === '/health') {
        return next();
      }
      // Apply RBAC to all other endpoints
      return aetherAuthMiddleware(req, res, next);
    }, aetherRoutes);

    console.log('[AETHER] ✓ Routes mounted at /api/aether');

    // Run initial sweep if not already done
    const promptsPath = path.join(__dirname, '../../../data/aether/prompts.json');
    
    if (fs.existsSync(promptsPath) && !scheduler.hasInitialSweepRun()) {
      console.log('[AETHER] Running initial sweep (first-time setup)...');
      
      // Load prompts
      const prompts = JSON.parse(fs.readFileSync(promptsPath, 'utf8'));
      
      // Take first 3 demo prompts
      const demoPrompts = prompts.filter(p => p.id.startsWith('demo_')).map(p => ({
        text: p.text,
        category: p.category
      }));

      // Run initial sweep in background
      scheduler.runInitialSweep(async () => {
        return await productionAetherService.runBatchSweeps(demoPrompts);
      }).then(result => {
        if (result.success) {
          console.log('[AETHER] ✓ Initial sweep completed');
        } else if (result.skipped) {
          console.log('[AETHER] ⊙ Initial sweep already completed');
        } else {
          console.error('[AETHER] ✗ Initial sweep failed:', result.error);
        }
      }).catch(err => {
        console.error('[AETHER] ✗ Initial sweep error:', err);
      });
    } else {
      console.log('[AETHER] ⊙ Initial sweep already completed or prompts not found');
    }

    // Schedule weekly sweeps if cron enabled
    if (process.env.AETHER_CRON_ENABLED === 'true') {
      scheduler.scheduleWeeklySweep(async () => {
        const prompts = JSON.parse(fs.readFileSync(promptsPath, 'utf8'));
        const weeklyPrompts = prompts.slice(0, 20).map(p => ({
          text: p.text,
          category: p.category
        }));
        return await productionAetherService.runBatchSweeps(weeklyPrompts);
      });
      console.log('[AETHER] ✓ Weekly sweeps scheduled');
    } else {
      console.log('[AETHER] ⊙ Weekly sweeps disabled (AETHER_CRON_ENABLED=false)');
    }

    console.log('[AETHER] ✓ Production system initialized');
    return true;
  } catch (error) {
    console.error('[AETHER] ✗ Initialization failed:', error);
    return false;
  }
}

/**
 * Get AETHER system status
 */
export function getAetherStatus() {
  return {
    initialized: true,
    scheduler: scheduler.getStatus(),
    mockMode: process.env.OPENAI_API_KEY ? false : true,
    cronEnabled: process.env.AETHER_CRON_ENABLED === 'true',
    dailyTokenCap: parseInt(process.env.AETHER_DAILY_TOKEN_CAP || '20000')
  };
}
