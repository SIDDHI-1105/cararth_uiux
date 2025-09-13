// Integration layer to wire AI services with metrics monitoring
import { aiMetricsMonitor } from './aiMetricsMonitor';

export class AIMetricsIntegration {
  
  /**
   * Record metrics for any AI service call
   */
  static async recordServiceCall<T>(
    serviceName: string,
    operation: () => Promise<T>,
    estimatedCost: number = 0
  ): Promise<T> {
    const startTime = Date.now();
    let success = false;
    
    try {
      const result = await operation();
      success = true;
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const responseTime = Date.now() - startTime;
      
      aiMetricsMonitor.recordServiceUsage(serviceName, {
        success,
        responseTime,
        cost: estimatedCost
      });
    }
  }

  /**
   * Wrapper for OpenAI calls
   */
  static async recordOpenAI<T>(operation: () => Promise<T>, cost: number = 0.01): Promise<T> {
    return this.recordServiceCall('openai', operation, cost);
  }

  /**
   * Wrapper for Claude calls
   */
  static async recordClaude<T>(operation: () => Promise<T>, cost: number = 0.05): Promise<T> {
    return this.recordServiceCall('claude', operation, cost);
  }

  /**
   * Wrapper for Gemini calls
   */
  static async recordGemini<T>(operation: () => Promise<T>, cost: number = 0.02): Promise<T> {
    return this.recordServiceCall('gemini', operation, cost);
  }

  /**
   * Wrapper for Perplexity calls
   */
  static async recordPerplexity<T>(operation: () => Promise<T>, cost: number = 1.0): Promise<T> {
    return this.recordServiceCall('perplexity', operation, cost);
  }

  /**
   * Wrapper for Firecrawl calls
   */
  static async recordFirecrawl<T>(operation: () => Promise<T>, cost: number = 0.5): Promise<T> {
    return this.recordServiceCall('firecrawl', operation, cost);
  }

  /**
   * Get current system status
   */
  static getSystemStatus() {
    return aiMetricsMonitor.getSystemStatus();
  }

  /**
   * Export metrics for external monitoring
   */
  static exportMetrics() {
    return aiMetricsMonitor.exportMetricsForMonitoring();
  }
}

export const metricsIntegration = AIMetricsIntegration;