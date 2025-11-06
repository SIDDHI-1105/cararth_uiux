import express from 'express';
import { db } from '../db.js';
import { aetherTopics, aetherTopicSources, aetherTopicScores, aetherTopicRecos } from '../../shared/schema.js';
import { eq, desc } from 'drizzle-orm';
import { aetherAuthMiddleware } from '../lib/aether/rbacMiddleware.js';
import { ingestTopic } from '../lib/aether/topic/ingest.js';
import { analyzeAIVisibility } from '../lib/aether/topic/aiVisibility.js';
import { scoreTopic } from '../lib/aether/topic/score.js';
import { generateRecommendations } from '../lib/aether/topic/recommend.js';

const router = express.Router();

/**
 * Background job queue for topic processing
 * In production, use BullMQ; for now, simple in-memory queue
 */
const jobQueue = new Map();

async function processTopicJob(jobId, query, city) {
  try {
    console.log(`[TopicJob] Starting job ${jobId}`);
    jobQueue.set(jobId, { status: 'running', progress: 0 });
    
    // Step 1: Ingest (20%)
    jobQueue.set(jobId, { status: 'running', progress: 20, stage: 'ingesting' });
    const ingestResult = await ingestTopic({ query, city });
    const topicId = ingestResult.topicId;
    
    // Step 2: Fetch sources (40%)
    jobQueue.set(jobId, { status: 'running', progress: 40, stage: 'fetching sources' });
    const sources = await db.select()
      .from(aetherTopicSources)
      .where(eq(aetherTopicSources.topicId, topicId));
    
    const serpDomains = sources.map(s => s.domain);
    
    // Step 3: AI Visibility (60%)
    jobQueue.set(jobId, { status: 'running', progress: 60, stage: 'analyzing AI visibility' });
    const aiVisibility = await analyzeAIVisibility(query, city, serpDomains);
    
    // Step 4: Score (80%)
    jobQueue.set(jobId, { status: 'running', progress: 80, stage: 'calculating scores' });
    const scores = await scoreTopic(topicId, sources, aiVisibility, city);
    
    // Step 5: Recommend (90%)
    jobQueue.set(jobId, { status: 'running', progress: 90, stage: 'generating recommendations' });
    const recommendations = await generateRecommendations(topicId, query, city, sources, scores);
    
    // Complete (100%)
    jobQueue.set(jobId, { 
      status: 'completed', 
      progress: 100, 
      topicId,
      result: {
        topicId,
        sourcesCount: sources.length,
        scores,
        recommendationsCount: recommendations.length,
        mock: ingestResult.mock || aiVisibility.mock
      }
    });
    
    console.log(`[TopicJob] Completed job ${jobId}`);
  } catch (error) {
    console.error(`[TopicJob] Error in job ${jobId}:`, error);
    jobQueue.set(jobId, { 
      status: 'failed', 
      error: error.message 
    });
  }
}

/**
 * POST /api/aether/topic/explore
 * Start topic exploration job
 */
router.post('/explore', aetherAuthMiddleware, async (req, res) => {
  try {
    const { query, city } = req.body;
    
    if (!query) {
      return res.status(400).json({
        error: 'Missing required parameter: query'
      });
    }
    
    // Generate job ID
    const jobId = `topic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Start background job
    jobQueue.set(jobId, { status: 'queued', progress: 0 });
    processTopicJob(jobId, query, city || process.env.AETHER_CITY_DEFAULT || 'Hyderabad')
      .catch(err => console.error(`[TopicAPI] Job ${jobId} failed:`, err));
    
    res.json({
      jobId,
      status: 'queued',
      message: 'Topic exploration started, check status at /api/aether/topic/result/:jobId'
    });
  } catch (error) {
    console.error('[TopicAPI] Error starting exploration:', error);
    res.status(500).json({
      error: 'Failed to start exploration',
      message: error.message
    });
  }
});

/**
 * GET /api/aether/topic/result/:jobId
 * Get topic exploration result
 */
router.get('/result/:jobId', aetherAuthMiddleware, async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const job = jobQueue.get(jobId);
    
    if (!job) {
      return res.status(404).json({
        error: 'Job not found',
        jobId
      });
    }
    
    // If job is still running, return status
    if (job.status !== 'completed') {
      return res.json({
        jobId,
        status: job.status,
        progress: job.progress,
        stage: job.stage,
        error: job.error
      });
    }
    
    // Job completed, fetch full results
    const topicId = job.topicId;
    
    const [topic] = await db.select()
      .from(aetherTopics)
      .where(eq(aetherTopics.id, topicId));
    
    const sources = await db.select()
      .from(aetherTopicSources)
      .where(eq(aetherTopicSources.topicId, topicId));
    
    const [scores] = await db.select()
      .from(aetherTopicScores)
      .where(eq(aetherTopicScores.topicId, topicId));
    
    const recommendations = await db.select()
      .from(aetherTopicRecos)
      .where(eq(aetherTopicRecos.topicId, topicId));
    
    res.json({
      jobId,
      status: 'completed',
      topic,
      sources,
      scores,
      recommendations,
      mock: job.result?.mock || false
    });
  } catch (error) {
    console.error('[TopicAPI] Error fetching result:', error);
    res.status(500).json({
      error: 'Failed to fetch result',
      message: error.message
    });
  }
});

/**
 * GET /api/aether/topic/suggest
 * Get top topics by win score
 */
router.get('/suggest', aetherAuthMiddleware, async (req, res) => {
  try {
    const { city, cluster, limit = 20 } = req.query;
    
    let query = db.select({
      topic: aetherTopics,
      scores: aetherTopicScores
    })
    .from(aetherTopics)
    .leftJoin(aetherTopicScores, eq(aetherTopics.id, aetherTopicScores.topicId))
    .orderBy(desc(aetherTopicScores.winScore))
    .limit(parseInt(limit));
    
    if (city) {
      query = query.where(eq(aetherTopics.city, city));
    }
    
    if (cluster) {
      query = query.where(eq(aetherTopics.cluster, cluster));
    }
    
    const results = await query;
    
    res.json({
      topics: results.map(r => ({
        ...r.topic,
        scores: r.scores
      }))
    });
  } catch (error) {
    console.error('[TopicAPI] Error fetching suggestions:', error);
    res.status(500).json({
      error: 'Failed to fetch suggestions',
      message: error.message
    });
  }
});

/**
 * POST /api/aether/topic/action/:topicId/brief
 * Generate content brief for topic
 */
router.post('/action/:topicId/brief', aetherAuthMiddleware, async (req, res) => {
  try {
    const { topicId } = req.params;
    
    // Find the brief recommendation
    const [reco] = await db.select()
      .from(aetherTopicRecos)
      .where(eq(aetherTopicRecos.topicId, topicId))
      .where(eq(aetherTopicRecos.recoType, 'generate_brief'))
      .limit(1);
    
    if (!reco) {
      return res.status(404).json({
        error: 'No brief recommendation found for this topic'
      });
    }
    
    // In production, this would call the Content Brief generator
    // For now, return the recommendation payload
    res.json({
      success: true,
      brief: reco.payload,
      message: 'Content brief generated successfully',
      id: `brief_${Date.now()}`
    });
  } catch (error) {
    console.error('[TopicAPI] Error generating brief:', error);
    res.status(500).json({
      error: 'Failed to generate brief',
      message: error.message
    });
  }
});

/**
 * POST /api/aether/topic/action/:topicId/article
 * Generate article for topic
 */
router.post('/action/:topicId/article', aetherAuthMiddleware, async (req, res) => {
  try {
    const { topicId } = req.params;
    
    // Find the article recommendation
    const [reco] = await db.select()
      .from(aetherTopicRecos)
      .where(eq(aetherTopicRecos.topicId, topicId))
      .where(eq(aetherTopicRecos.recoType, 'generate_article'))
      .limit(1);
    
    if (!reco) {
      return res.status(404).json({
        error: 'No article recommendation found for this topic'
      });
    }
    
    // In production, this would call the Auto-SEO Article generator
    res.json({
      success: true,
      article: reco.payload,
      message: 'Article generation queued',
      articleId: `article_${Date.now()}`
    });
  } catch (error) {
    console.error('[TopicAPI] Error generating article:', error);
    res.status(500).json({
      error: 'Failed to generate article',
      message: error.message
    });
  }
});

/**
 * POST /api/aether/topic/action/:topicId/lp
 * Generate landing page for topic
 */
router.post('/action/:topicId/lp', aetherAuthMiddleware, async (req, res) => {
  try {
    const { topicId } = req.params;
    
    // Find the landing page recommendation
    const [reco] = await db.select()
      .from(aetherTopicRecos)
      .where(eq(aetherTopicRecos.topicId, topicId))
      .where(eq(aetherTopicRecos.recoType, 'generate_lp'))
      .limit(1);
    
    if (!reco) {
      return res.status(404).json({
        error: 'No landing page recommendation found for this topic'
      });
    }
    
    // In production, this would call the Landing Page generator
    res.json({
      success: true,
      landingPage: reco.payload,
      message: 'Landing page generation queued',
      lpId: `lp_${Date.now()}`
    });
  } catch (error) {
    console.error('[TopicAPI] Error generating landing page:', error);
    res.status(500).json({
      error: 'Failed to generate landing page',
      message: error.message
    });
  }
});

export default router;
