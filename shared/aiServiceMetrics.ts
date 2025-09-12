// Standardized AI Service Metrics Interface
// This ensures honest reporting across all AI services for investor transparency

export interface StandardAIMetrics {
  // Request tracking
  totalRequests: number;
  successfulRequests: number;      // Only true AI responses count as success
  fallbackResponses: number;       // Fallback responses count as failures
  completeFailures: number;        // No response at all

  // Performance metrics
  averageProcessingTime: number;   // In milliseconds
  averageConfidence: number;       // 0-1 scale

  // Error metrics (honest reporting)
  errorRate: number;               // Percentage of requests that failed or used fallbacks
  fallbackRate: number;           // Percentage specifically using fallbacks
  
  // API-specific metrics
  apiTimeouts: number;
  apiQuotaExceeded: number;
  apiErrorsOther: number;
  
  // Timestamps
  lastSuccessfulRequest?: Date;
  lastFailureTimestamp?: Date;
}

export interface AIServiceResponse<T = any> {
  data: T;
  isFromFallback: boolean;        // Critical: marks if response is fallback
  confidence: number;             // 0-1 scale
  processingTime: number;         // milliseconds
  apiProvider: string;            // "claude" | "openai" | "perplexity" etc.
  errorDetails?: string;
}

/**
 * Base class that all AI services should extend for consistent metrics
 */
export abstract class StandardAIService {
  protected metrics: StandardAIMetrics;
  
  constructor(serviceName: string) {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      fallbackResponses: 0,
      completeFailures: 0,
      averageProcessingTime: 0,
      averageConfidence: 0,
      errorRate: 0,
      fallbackRate: 0,
      apiTimeouts: 0,
      apiQuotaExceeded: 0,
      apiErrorsOther: 0
    };
  }
  
  /**
   * Update metrics with honest reporting
   * @param startTime - Request start timestamp
   * @param isSuccess - True only if real AI response (not fallback)
   * @param isFromFallback - True if using fallback/default data
   * @param confidence - Confidence score 0-1
   * @param errorType - Type of error if applicable
   */
  protected updateMetrics(
    startTime: number, 
    isSuccess: boolean, 
    isFromFallback: boolean, 
    confidence: number,
    errorType?: 'timeout' | 'quota' | 'other'
  ): void {
    const processingTime = Date.now() - startTime;
    this.metrics.totalRequests++;
    
    if (isSuccess && !isFromFallback) {
      this.metrics.successfulRequests++;
      this.metrics.lastSuccessfulRequest = new Date();
    } else if (isFromFallback) {
      this.metrics.fallbackResponses++;
      this.metrics.lastFailureTimestamp = new Date();
    } else {
      this.metrics.completeFailures++;
      this.metrics.lastFailureTimestamp = new Date();
    }
    
    // Track specific error types
    if (errorType === 'timeout') this.metrics.apiTimeouts++;
    else if (errorType === 'quota') this.metrics.apiQuotaExceeded++;
    else if (errorType === 'other') this.metrics.apiErrorsOther++;
    
    // Update running averages
    const totalResponses = this.metrics.successfulRequests + this.metrics.fallbackResponses;
    if (totalResponses > 0) {
      this.metrics.averageProcessingTime = 
        (this.metrics.averageProcessingTime * (totalResponses - 1) + processingTime) / totalResponses;
      this.metrics.averageConfidence = 
        (this.metrics.averageConfidence * (totalResponses - 1) + confidence) / totalResponses;
    }
    
    // Calculate honest error rates
    this.metrics.errorRate = 
      ((this.metrics.fallbackResponses + this.metrics.completeFailures) / this.metrics.totalRequests) * 100;
    this.metrics.fallbackRate = 
      (this.metrics.fallbackResponses / this.metrics.totalRequests) * 100;
  }
  
  /**
   * Get metrics for reporting to investors/stakeholders
   * These numbers are honest and don't hide fallback usage as "success"
   */
  public getMetrics(): StandardAIMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Get a summary suitable for dashboards
   */
  public getMetricsSummary(): {
    realSuccessRate: number;
    fallbackUsageRate: number;
    avgResponseTime: number;
    totalRequests: number;
    healthStatus: 'healthy' | 'degraded' | 'failing';
  } {
    const realSuccessRate = this.metrics.totalRequests > 0 
      ? (this.metrics.successfulRequests / this.metrics.totalRequests) * 100 
      : 0;
    
    const healthStatus = 
      realSuccessRate > 80 ? 'healthy' : 
      realSuccessRate > 50 ? 'degraded' : 'failing';
    
    return {
      realSuccessRate: Math.round(realSuccessRate * 100) / 100,
      fallbackUsageRate: Math.round(this.metrics.fallbackRate * 100) / 100,
      avgResponseTime: Math.round(this.metrics.averageProcessingTime),
      totalRequests: this.metrics.totalRequests,
      healthStatus
    };
  }
}

/**
 * Utility to aggregate metrics across all AI services
 */
export function aggregateAIServiceMetrics(services: { [key: string]: StandardAIMetrics }): {
  overallSuccessRate: number;
  overallFallbackRate: number;
  totalRequests: number;
  servicesHealth: { [key: string]: 'healthy' | 'degraded' | 'failing' };
} {
  let totalRequests = 0;
  let totalSuccesses = 0;
  let totalFallbacks = 0;
  const servicesHealth: { [key: string]: 'healthy' | 'degraded' | 'failing' } = {};
  
  Object.entries(services).forEach(([serviceName, metrics]) => {
    totalRequests += metrics.totalRequests;
    totalSuccesses += metrics.successfulRequests;
    totalFallbacks += metrics.fallbackResponses;
    
    const successRate = metrics.totalRequests > 0 
      ? (metrics.successfulRequests / metrics.totalRequests) * 100 
      : 0;
    
    servicesHealth[serviceName] = 
      successRate > 80 ? 'healthy' : 
      successRate > 50 ? 'degraded' : 'failing';
  });
  
  return {
    overallSuccessRate: totalRequests > 0 ? (totalSuccesses / totalRequests) * 100 : 0,
    overallFallbackRate: totalRequests > 0 ? (totalFallbacks / totalRequests) * 100 : 0,
    totalRequests,
    servicesHealth
  };
}