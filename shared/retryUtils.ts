// Utility functions for retry logic with exponential backoff and jitter
export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  timeoutMs?: number;
  jitterFactor?: number;
  shouldRetry?: (error: any) => boolean;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: any;
  attempts: number;
}

/**
 * Default retry predicate - retries on network errors, timeouts, and 5xx errors
 */
const defaultShouldRetry = (error: any): boolean => {
  if (!error) return false;
  
  const message = error.message?.toLowerCase() || '';
  
  // Retry on network errors
  if (message.includes('network') || 
      message.includes('timeout') || 
      message.includes('connection') ||
      message.includes('econnreset') ||
      message.includes('enotfound')) {
    return true;
  }
  
  // Retry on rate limiting
  if (message.includes('rate limit') || 
      message.includes('too many requests')) {
    return true;
  }
  
  // Retry on temporary service errors
  if (message.includes('service unavailable') ||
      message.includes('internal server error') ||
      message.includes('bad gateway')) {
    return true;
  }
  
  // Don't retry on authentication errors or bad requests
  if (message.includes('unauthorized') || 
      message.includes('forbidden') ||
      message.includes('bad request') ||
      message.includes('invalid') ||
      message.includes('not found')) {
    return false;
  }
  
  return false;
};

/**
 * Sleep function with jitter for backoff delays
 */
const sleep = (ms: number, jitterFactor: number = 0.1): Promise<void> => {
  const jitter = Math.random() * jitterFactor * ms;
  const delayWithJitter = ms + jitter;
  return new Promise(resolve => setTimeout(resolve, delayWithJitter));
};

/**
 * Execute a function with retry logic, exponential backoff, and jitter
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelayMs = 1000,
    maxDelayMs = 30000,
    timeoutMs = 15000,
    jitterFactor = 0.1,
    shouldRetry = defaultShouldRetry
  } = options;

  let lastError: any;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Add timeout wrapper if specified
      if (timeoutMs > 0) {
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error(`Operation timeout after ${timeoutMs}ms`)), timeoutMs)
        );
        
        const result = await Promise.race([operation(), timeoutPromise]);
        return result;
      } else {
        const result = await operation();
        return result;
      }
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${attempt}/${maxAttempts} failed:`, {
        error: error.message,
        attempt,
        maxAttempts
      });
      
      // Don't retry on last attempt or if error is not retryable
      if (attempt === maxAttempts || !shouldRetry(error)) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelayMs * Math.pow(2, attempt - 1), maxDelayMs);
      
      console.log(`Retrying in ${delay}ms... (attempt ${attempt + 1}/${maxAttempts})`);
      await sleep(delay, jitterFactor);
    }
  }
  
  throw lastError;
}

/**
 * Execute multiple operations with retry logic and return partial results
 */
export async function withRetryBatch<T>(
  operations: (() => Promise<T>)[],
  options: RetryOptions = {}
): Promise<RetryResult<T>[]> {
  const results = await Promise.allSettled(
    operations.map(async (operation, index) => {
      try {
        const data = await withRetry(operation, options);
        return { success: true, data, attempts: 1 };
      } catch (error) {
        console.error(`Batch operation ${index} failed after retries:`, error.message);
        return { success: false, error, attempts: options.maxAttempts || 3 };
      }
    })
  );
  
  return results.map(result => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return { 
        success: false, 
        error: result.reason, 
        attempts: options.maxAttempts || 3 
      };
    }
  });
}

/**
 * Circuit breaker pattern for external services
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private failureThreshold = 5,
    private timeoutMs = 60000, // 1 minute
    private resetTimeoutMs = 30000 // 30 seconds
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.resetTimeoutMs) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is OPEN - service temporarily unavailable');
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }
  
  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'open';
    }
  }
  
  getState(): string {
    return this.state;
  }
}