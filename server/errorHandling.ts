// Centralized error handling utilities and process-level error handlers
import type { Request, Response, NextFunction } from 'express';
import { setGlobalLogger, type ILogger, LogCategory as SharedLogCategory } from '../shared/logging';

// Error types for better categorization
export enum ErrorCategory {
  DATABASE = 'database',
  EXTERNAL_API = 'external_api',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  RATE_LIMIT = 'rate_limit',
  INTERNAL = 'internal',
  USER_INPUT = 'user_input'
}

export interface AppError extends Error {
  statusCode?: number;
  category?: ErrorCategory;
  isOperational?: boolean;
  userId?: string;
  requestId?: string;
}

// Create standardized error with proper categorization
export function createAppError(
  message: string,
  statusCode: number = 500,
  category: ErrorCategory = ErrorCategory.INTERNAL,
  isOperational: boolean = true
): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.category = category;
  error.isOperational = isOperational;
  error.name = 'AppError';
  return error;
}

// Production-grade logger that implements shared interface
export class ProductionLogger implements ILogger {
  error(message: string, context?: any): void {
    const errorInfo = {
      level: 'ERROR',
      message,
      timestamp: new Date().toISOString(),
      ...context
    };
    console.error('🔥 ERROR:', errorInfo);
  }

  warn(message: string, context?: any): void {
    const errorInfo = {
      level: 'WARN',
      message,
      timestamp: new Date().toISOString(),
      ...context
    };
    console.warn('⚠️ WARN:', errorInfo);
  }

  info(message: string, context?: any): void {
    const errorInfo = {
      level: 'INFO',
      message,
      timestamp: new Date().toISOString(),
      ...context
    };
    console.info('ℹ️ INFO:', errorInfo);
  }

  debug(message: string, context?: any): void {
    if (process.env.NODE_ENV === 'development') {
      const errorInfo = {
        level: 'DEBUG',
        message,
        timestamp: new Date().toISOString(),
        ...context
      };
      console.debug('🐛 DEBUG:', errorInfo);
    }
  }
}

// Safe logging without PII
export function logError(error: any, context: string = '', requestId?: string) {
  const errorInfo = {
    message: error.message || 'Unknown error',
    category: error.category || ErrorCategory.INTERNAL,
    statusCode: error.statusCode || 500,
    context,
    requestId,
    timestamp: new Date().toISOString(),
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  };
  
  // Use production logger
  const logger = new ProductionLogger();
  if (error.statusCode >= 500) {
    logger.error('Critical Error', errorInfo);
  } else if (error.statusCode >= 400) {
    logger.warn('Client Error', errorInfo);
  } else {
    console.info('ℹ️ Info:', errorInfo);
  }
}

// Express error handling middleware
export function errorHandler(error: AppError, req: Request, res: Response, next: NextFunction) {
  // Generate request ID if not present
  const requestId = req.headers['x-request-id'] as string || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Log error without PII
  logError(error, `${req.method} ${req.path}`, requestId);
  
  // Determine response based on error type
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error';
  
  // Don't expose internal error details in production
  if (statusCode >= 500 && process.env.NODE_ENV === 'production') {
    message = 'Something went wrong. Please try again later.';
  }
  
  // Send error response
  res.status(statusCode).json({
    error: {
      message,
      category: error.category || ErrorCategory.INTERNAL,
      requestId,
      timestamp: new Date().toISOString()
    }
  });
}

// Async route wrapper to catch unhandled promise rejections
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Database operation wrapper with error handling
export async function safeDbOperation<T>(
  operation: () => Promise<T>,
  operationName: string,
  fallbackValue?: T
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    logError(error, `Database operation: ${operationName}`);
    
    if (fallbackValue !== undefined) {
      console.warn(`Using fallback value for failed database operation: ${operationName}`);
      return fallbackValue;
    }
    
    throw createAppError(
      `Database operation failed: ${operationName}`,
      500,
      ErrorCategory.DATABASE
    );
  }
}

// External API operation wrapper with error handling
export async function safeApiOperation<T>(
  operation: () => Promise<T>,
  operationName: string,
  fallbackValue?: T
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    logError(error, `External API operation: ${operationName}`);
    
    if (fallbackValue !== undefined) {
      console.warn(`Using fallback value for failed API operation: ${operationName}`);
      return fallbackValue;
    }
    
    throw createAppError(
      `External service temporarily unavailable: ${operationName}`,
      503,
      ErrorCategory.EXTERNAL_API
    );
  }
}

// Setup process-level error handlers
export function setupProcessErrorHandlers() {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error: Error) => {
    console.error('🚨 UNCAUGHT EXCEPTION - Process will exit:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // Graceful shutdown
    process.exit(1);
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    console.error('🚨 UNHANDLED PROMISE REJECTION:', {
      reason: reason instanceof Error ? reason.message : reason,
      stack: reason instanceof Error ? reason.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    // Don't exit for unhandled rejections in production, just log
    if (process.env.NODE_ENV === 'development') {
      process.exit(1);
    }
  });
  
  // Handle SIGTERM gracefully
  process.on('SIGTERM', () => {
    console.info('🔄 SIGTERM received. Starting graceful shutdown...');
    process.exit(0);
  });
  
  // Handle SIGINT gracefully (Ctrl+C)
  process.on('SIGINT', () => {
    console.info('🔄 SIGINT received. Starting graceful shutdown...');
    process.exit(0);
  });
  
  console.log('✅ Process-level error handlers initialized');
}

// Health check with error boundaries
export function createHealthCheckHandler() {
  return asyncHandler(async (req: Request, res: Response) => {
    try {
      // Basic health checks
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development'
      };
      
      res.status(200).json(health);
    } catch (error) {
      throw createAppError(
        'Health check failed',
        503,
        ErrorCategory.INTERNAL
      );
    }
  });
}

// Request ID middleware
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const requestId = req.headers['x-request-id'] as string || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
}