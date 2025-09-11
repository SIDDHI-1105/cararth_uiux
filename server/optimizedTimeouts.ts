// Optimized timeout and retry configuration for all AI services
export interface TimeoutConfig {
  fast: number;
  standard: number;
  thorough: number;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  exponentialBase: number;
}

export const timeoutConfigs = {
  // Firecrawl configurations for different use cases
  firecrawl: {
    fast: 15000,        // 15s for quick extractions
    standard: 30000,    // 30s for standard scraping
    thorough: 45000     // 45s for comprehensive extraction
  },
  
  // Gemini configurations optimized for response time
  gemini: {
    fast: 5000,         // 5s for quick validations
    standard: 10000,    // 10s for standard analysis
    thorough: 20000     // 20s for complex processing
  },
  
  // Perplexity configurations for market intelligence
  perplexity: {
    fast: 3000,         // 3s for quick validation
    standard: 8000,     // 8s for market analysis
    thorough: 15000     // 15s for comprehensive research
  },
  
  // OpenAI configurations for conversational AI
  openai: {
    fast: 8000,         // 8s for quick responses
    standard: 15000,    // 15s for detailed analysis
    thorough: 25000     // 25s for complex reasoning
  }
};

export const retryConfigs: Record<string, RetryConfig> = {
  // Network-related retries (Firecrawl, Perplexity)
  network: {
    maxRetries: 3,
    baseDelay: 1000,    // 1s
    maxDelay: 8000,     // 8s max
    exponentialBase: 2
  },
  
  // AI model retries (Gemini, OpenAI)
  ai_model: {
    maxRetries: 2,
    baseDelay: 2000,    // 2s
    maxDelay: 10000,    // 10s max
    exponentialBase: 2.5
  },
  
  // Database operation retries
  database: {
    maxRetries: 3,
    baseDelay: 500,     // 0.5s
    maxDelay: 5000,     // 5s max
    exponentialBase: 2
  }
};

// Utility function for smart timeouts based on operation type
export function getOptimalTimeout(service: keyof typeof timeoutConfigs, operation: 'fast' | 'standard' | 'thorough'): number {
  return timeoutConfigs[service][operation];
}

// Enhanced retry logic with exponential backoff
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig,
  isRetryable: (error: any) => boolean = () => true
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry on last attempt or non-retryable errors
      if (attempt === config.maxRetries || !isRetryable(error)) {
        throw error;
      }
      
      // Calculate delay with exponential backoff + jitter
      const delay = Math.min(
        config.baseDelay * Math.pow(config.exponentialBase, attempt),
        config.maxDelay
      );
      const jitter = Math.random() * 0.3 * delay; // ±30% jitter
      const finalDelay = delay + jitter;
      
      console.log(`🔄 Retry attempt ${attempt + 1}/${config.maxRetries} after ${Math.round(finalDelay)}ms`);
      await new Promise(resolve => setTimeout(resolve, finalDelay));
    }
  }
  
  throw lastError;
}

// Smart timeout wrapper with fallback
export async function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number,
  fallback?: () => T
): Promise<T> {
  const timeoutPromise = new Promise<T>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
  
  try {
    return await Promise.race([operation(), timeoutPromise]);
  } catch (error) {
    if (fallback && error instanceof Error && error.message.includes('timed out')) {
      console.log(`⏰ Timeout fallback activated for ${timeoutMs}ms operation`);
      return fallback();
    }
    throw error;
  }
}

// Circuit breaker pattern for external services
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private readonly failureThreshold: number = 5,
    private readonly resetTimeoutMs: number = 60000 // 1 minute
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.resetTimeoutMs) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open - service temporarily unavailable');
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
  
  getFailureCount(): number {
    return this.failures;
  }
}

// Specialized error handling for different service types
export const isRetryableError = {
  network: (error: any): boolean => {
    return error.code === 'ECONNRESET' ||
           error.code === 'ETIMEDOUT' ||
           error.code === 'ENOTFOUND' ||
           error.message?.includes('timeout') ||
           (error.status >= 500 && error.status < 600) ||
           error.status === 429;
  },
  
  ai_model: (error: any): boolean => {
    return error.message?.includes('overloaded') ||
           error.message?.includes('timeout') ||
           error.status === 503 ||
           error.status === 429;
  },
  
  database: (error: any): boolean => {
    return error.code === 'ECONNRESET' ||
           error.code === 'ETIMEDOUT' ||
           error.message?.includes('connection') ||
           error.message?.includes('timeout');
  }
};

// Performance monitoring for timeouts and retries
export class PerformanceMonitor {
  private metrics = new Map<string, {
    totalCalls: number;
    successfulCalls: number;
    averageLatency: number;
    timeouts: number;
    retries: number;
  }>();
  
  recordCall(service: string, latency: number, success: boolean, timeouts: number = 0, retries: number = 0): void {
    const current = this.metrics.get(service) || {
      totalCalls: 0,
      successfulCalls: 0,
      averageLatency: 0,
      timeouts: 0,
      retries: 0
    };
    
    current.totalCalls++;
    if (success) current.successfulCalls++;
    current.timeouts += timeouts;
    current.retries += retries;
    
    // Rolling average for latency
    current.averageLatency = (current.averageLatency * (current.totalCalls - 1) + latency) / current.totalCalls;
    
    this.metrics.set(service, current);
  }
  
  getStats(service?: string) {
    if (service) {
      return this.metrics.get(service) || null;
    }
    return Object.fromEntries(this.metrics.entries());
  }
  
  getRecommendations(): string[] {
    const recommendations: string[] = [];
    
    for (const [service, stats] of this.metrics) {
      const successRate = stats.successfulCalls / stats.totalCalls;
      const timeoutRate = stats.timeouts / stats.totalCalls;
      
      if (successRate < 0.85) {
        recommendations.push(`${service}: Low success rate (${Math.round(successRate * 100)}%) - consider circuit breaker`);
      }
      
      if (timeoutRate > 0.1) {
        recommendations.push(`${service}: High timeout rate (${Math.round(timeoutRate * 100)}%) - increase timeout limits`);
      }
      
      if (stats.averageLatency > 10000) {
        recommendations.push(`${service}: High latency (${Math.round(stats.averageLatency)}ms) - optimize or cache`);
      }
    }
    
    return recommendations;
  }
}

export const performanceMonitor = new PerformanceMonitor();