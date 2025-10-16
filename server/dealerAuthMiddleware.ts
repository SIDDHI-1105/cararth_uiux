import { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { dealers } from '../shared/schema';
import { eq } from 'drizzle-orm';
import type { Dealer } from '../shared/schema';

// Extend Express Request to include dealer
declare global {
  namespace Express {
    interface Request {
      dealer?: Dealer;
    }
  }
}

/**
 * Dealer API Key Authentication Middleware
 * Validates Bearer token from Authorization header
 * Usage: POST /api/dealer/:dealerId/upload
 *        Authorization: Bearer <api_key>
 */
export async function authenticateDealer(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get API key from X-API-Key header (preferred) or Authorization header (fallback)
    let apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        apiKey = authHeader.substring(7); // Remove "Bearer " prefix
      }
    }

    if (!apiKey) {
      res.status(401).json({
        success: false,
        error: 'Missing API key. Provide X-API-Key header or Authorization: Bearer <api_key>',
      });
      return;
    }

    // Look up dealer by API key
    const dealerResult = await db
      .select()
      .from(dealers)
      .where(eq(dealers.apiKey, apiKey))
      .limit(1);

    if (dealerResult.length === 0) {
      res.status(401).json({
        success: false,
        error: 'Invalid API key',
      });
      return;
    }

    const dealer = dealerResult[0];

    // Check if dealer is active
    if (!dealer.isActive) {
      res.status(403).json({
        success: false,
        error: 'Dealer account is inactive. Please contact support.',
      });
      return;
    }

    // Check if dealer ID in URL matches authenticated dealer (if dealerId is in params)
    if (req.params.dealerId && req.params.dealerId !== dealer.id) {
      res.status(403).json({
        success: false,
        error: 'Access denied. Dealer ID mismatch.',
      });
      return;
    }

    // Check rate limits
    const now = new Date();
    const limitResetDate = dealer.limitResetAt ? new Date(dealer.limitResetAt) : new Date();
    
    // Reset monthly counter if month has passed
    if (limitResetDate < now) {
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      await db
        .update(dealers)
        .set({
          currentMonthUploads: 0,
          limitResetAt: nextMonth,
          updatedAt: now,
        })
        .where(eq(dealers.id, dealer.id));
      
      dealer.currentMonthUploads = 0;
    }

    // Check if monthly limit exceeded
    const currentUploads = dealer.currentMonthUploads || 0;
    const uploadLimit = dealer.monthlyUploadLimit || 100;
    
    if (currentUploads >= uploadLimit) {
      res.status(429).json({
        success: false,
        error: `Monthly upload limit of ${dealer.monthlyUploadLimit} vehicles exceeded. Limit resets on ${limitResetDate.toLocaleDateString()}`,
        limit: dealer.monthlyUploadLimit,
        used: dealer.currentMonthUploads,
        resetDate: limitResetDate.toISOString(),
      });
      return;
    }

    // Attach dealer to request
    req.dealer = dealer;
    
    next();
  } catch (error) {
    console.error('Dealer authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
    });
  }
}

/**
 * Generate a secure API key for a dealer
 */
export function generateApiKey(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const length = 32;
  let apiKey = 'cararth_';
  
  for (let i = 0; i < length; i++) {
    apiKey += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return apiKey;
}
