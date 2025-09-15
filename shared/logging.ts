// Shared logging interface for consistent error handling across server and shared modules
export enum LogCategory {
  DATABASE = 'database',
  EXTERNAL_API = 'external_api', 
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  RATE_LIMIT = 'rate_limit',
  INTERNAL = 'internal',
  USER_INPUT = 'user_input'
}

export interface LogContext {
  category?: LogCategory;
  requestId?: string;
  operation?: string;
  userId?: string;
}

export interface ILogger {
  error(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  debug(message: string, context?: LogContext): void;
}

// Default console-based logger for development/fallback
export class ConsoleLogger implements ILogger {
  error(message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      level: 'ERROR',
      message,
      timestamp,
      ...context
    };
    console.error(`[${timestamp}] ERROR:`, logEntry);
  }

  warn(message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      level: 'WARN', 
      message,
      timestamp,
      ...context
    };
    console.warn(`[${timestamp}] WARN:`, logEntry);
  }

  info(message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      level: 'INFO',
      message, 
      timestamp,
      ...context
    };
    console.info(`[${timestamp}] INFO:`, logEntry);
  }

  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString();
      const logEntry = {
        level: 'DEBUG',
        message,
        timestamp,
        ...context
      };
      console.debug(`[${timestamp}] DEBUG:`, logEntry);
    }
  }
}

// Global logger instance that can be injected
export let globalLogger: ILogger = new ConsoleLogger();

// Function to set the global logger (used by server to inject centralized logger)
export function setGlobalLogger(logger: ILogger): void {
  globalLogger = logger;
}

// Convenience functions for logging
export function logError(message: string, context?: LogContext): void {
  globalLogger.error(message, context);
}

export function logWarn(message: string, context?: LogContext): void {
  globalLogger.warn(message, context);
}

export function logInfo(message: string, context?: LogContext): void {
  globalLogger.info(message, context);
}

export function logDebug(message: string, context?: LogContext): void {
  globalLogger.debug(message, context);
}