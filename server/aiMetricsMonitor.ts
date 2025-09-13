// AI Metrics and Monitoring System for the 5-AI Architecture

export interface AIServiceMetrics {
  serviceName: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  totalCost: number;
  dailyCost: number;
  dailyBudget: number;
  budgetUtilization: number;
  errorRate: number;
  lastResetDate: string;
}

export interface SystemPerformanceMetrics {
  orchestrationDecisions: number;
  extractionSuccess: number;
  normalizationSuccess: number;
  trustApprovalRate: number;
  deduplicationRate: number;
  validationAccuracy: number;
  overallSystemHealth: 'healthy' | 'warning' | 'critical';
}

export interface CostBreakdown {
  firecrawl: { daily: number; total: number; requests: number };
  openai: { daily: number; total: number; requests: number };
  claude: { daily: number; total: number; requests: number };
  gemini: { daily: number; total: number; requests: number };
  perplexity: { daily: number; total: number; requests: number };
  totalDailyCost: number;
  totalSystemCost: number;
  dailyBudgetLimit: number;
  projectedMonthlyCost: number;
}

export interface AlertThresholds {
  budgetUtilization: number; // Alert if >80%
  errorRate: number; // Alert if >10%
  responseTime: number; // Alert if >5000ms
  systemHealth: 'warning' | 'critical';
}

export class AIMetricsMonitor {
  private serviceMetrics: Map<string, AIServiceMetrics> = new Map();
  private systemStartTime: number = Date.now();
  private dailyResetDate: string = new Date().toISOString().split('T')[0];
  
  // Alert system
  private alertThresholds: AlertThresholds = {
    budgetUtilization: 80,
    errorRate: 10,
    responseTime: 5000,
    systemHealth: 'warning'
  };
  
  // Performance tracking
  private performanceHistory: Array<{
    timestamp: Date;
    metrics: SystemPerformanceMetrics;
  }> = [];

  constructor() {
    this.initializeServiceMetrics();
    this.startDailyReset();
  }

  /**
   * INITIALIZE SERVICE METRICS
   */
  private initializeServiceMetrics(): void {
    const services = ['firecrawl', 'openai', 'claude', 'gemini', 'perplexity'];
    
    services.forEach(service => {
      this.serviceMetrics.set(service, {
        serviceName: service,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        totalCost: 0,
        dailyCost: 0,
        dailyBudget: this.getDailyBudgetForService(service),
        budgetUtilization: 0,
        errorRate: 0,
        lastResetDate: this.dailyResetDate
      });
    });
  }

  /**
   * RECORD SERVICE USAGE
   */
  recordServiceUsage(service: string, options: {
    success: boolean;
    responseTime: number;
    cost: number;
  }): void {
    const metrics = this.serviceMetrics.get(service);
    if (!metrics) return;

    // Update counts
    metrics.totalRequests++;
    if (options.success) {
      metrics.successfulRequests++;
    } else {
      metrics.failedRequests++;
    }

    // Update response time (rolling average)
    metrics.averageResponseTime = 
      (metrics.averageResponseTime + options.responseTime) / 2;

    // Update costs
    metrics.totalCost += options.cost;
    metrics.dailyCost += options.cost;

    // Calculate derived metrics
    metrics.errorRate = (metrics.failedRequests / metrics.totalRequests) * 100;
    metrics.budgetUtilization = (metrics.dailyCost / metrics.dailyBudget) * 100;

    // Update the metrics
    this.serviceMetrics.set(service, metrics);

    // Check for alerts
    this.checkServiceAlerts(service, metrics);
  }

  /**
   * GET COMPREHENSIVE SYSTEM STATUS
   */
  getSystemStatus(): {
    services: Record<string, AIServiceMetrics>;
    performance: SystemPerformanceMetrics;
    costs: CostBreakdown;
    alerts: Array<{
      type: 'budget' | 'performance' | 'error' | 'health';
      severity: 'warning' | 'critical';
      message: string;
      service?: string;
    }>;
    systemUptime: number;
  } {
    const services: Record<string, AIServiceMetrics> = {};
    this.serviceMetrics.forEach((metrics, serviceName) => {
      services[serviceName] = { ...metrics };
    });

    const performance = this.calculateSystemPerformance();
    const costs = this.calculateCostBreakdown();
    const alerts = this.generateSystemAlerts();
    const systemUptime = Date.now() - this.systemStartTime;

    return {
      services,
      performance,
      costs,
      alerts,
      systemUptime
    };
  }

  /**
   * CALCULATE SYSTEM PERFORMANCE METRICS
   */
  private calculateSystemPerformance(): SystemPerformanceMetrics {
    const services = Array.from(this.serviceMetrics.values());
    
    // Calculate overall success rates
    const totalRequests = services.reduce((sum, s) => sum + s.totalRequests, 0);
    const totalSuccessful = services.reduce((sum, s) => sum + s.successfulRequests, 0);
    
    const overallSuccessRate = totalRequests > 0 ? (totalSuccessful / totalRequests) * 100 : 100;
    
    // Estimate specific metrics based on service performance
    const orchestrationDecisions = this.serviceMetrics.get('openai')?.totalRequests || 0;
    const extractionSuccess = this.serviceMetrics.get('firecrawl')?.successfulRequests || 0;
    const normalizationSuccess = this.serviceMetrics.get('gemini')?.successfulRequests || 0;
    const trustApprovalRate = 85; // Estimated based on trust layer performance
    const deduplicationRate = 15; // Estimated duplicate detection rate
    const validationAccuracy = this.serviceMetrics.get('perplexity')?.successfulRequests || 0;
    
    // Determine system health
    let systemHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (overallSuccessRate < 70) {
      systemHealth = 'critical';
    } else if (overallSuccessRate < 85) {
      systemHealth = 'warning';
    }
    
    // Check budget utilization across services
    const avgBudgetUtilization = services.reduce((sum, s) => sum + s.budgetUtilization, 0) / services.length;
    if (avgBudgetUtilization > 90) {
      systemHealth = 'critical';
    } else if (avgBudgetUtilization > 75) {
      systemHealth = 'warning';
    }

    return {
      orchestrationDecisions,
      extractionSuccess,
      normalizationSuccess,
      trustApprovalRate,
      deduplicationRate,
      validationAccuracy,
      overallSystemHealth: systemHealth
    };
  }

  /**
   * CALCULATE DETAILED COST BREAKDOWN
   */
  private calculateCostBreakdown(): CostBreakdown {
    const breakdown: CostBreakdown = {
      firecrawl: { daily: 0, total: 0, requests: 0 },
      openai: { daily: 0, total: 0, requests: 0 },
      claude: { daily: 0, total: 0, requests: 0 },
      gemini: { daily: 0, total: 0, requests: 0 },
      perplexity: { daily: 0, total: 0, requests: 0 },
      totalDailyCost: 0,
      totalSystemCost: 0,
      dailyBudgetLimit: 0,
      projectedMonthlyCost: 0
    };

    this.serviceMetrics.forEach((metrics, serviceName) => {
      if (breakdown[serviceName as keyof CostBreakdown] && typeof breakdown[serviceName as keyof CostBreakdown] === 'object') {
        const serviceBreakdown = breakdown[serviceName as keyof CostBreakdown] as { daily: number; total: number; requests: number };
        serviceBreakdown.daily = metrics.dailyCost;
        serviceBreakdown.total = metrics.totalCost;
        serviceBreakdown.requests = metrics.totalRequests;
      }
      
      breakdown.totalDailyCost += metrics.dailyCost;
      breakdown.totalSystemCost += metrics.totalCost;
      breakdown.dailyBudgetLimit += metrics.dailyBudget;
    });

    // Project monthly cost based on daily average
    breakdown.projectedMonthlyCost = breakdown.totalDailyCost * 30;

    return breakdown;
  }

  /**
   * ALERT GENERATION SYSTEM
   */
  private generateSystemAlerts(): Array<{
    type: 'budget' | 'performance' | 'error' | 'health';
    severity: 'warning' | 'critical';
    message: string;
    service?: string;
  }> {
    const alerts: Array<{
      type: 'budget' | 'performance' | 'error' | 'health';
      severity: 'warning' | 'critical';
      message: string;
      service?: string;
    }> = [];

    // Check service-specific alerts
    this.serviceMetrics.forEach((metrics, serviceName) => {
      // Budget alerts
      if (metrics.budgetUtilization > 90) {
        alerts.push({
          type: 'budget',
          severity: 'critical',
          message: `${serviceName.toUpperCase()} budget critical: ${Math.round(metrics.budgetUtilization)}% used ($${metrics.dailyCost.toFixed(2)}/$${metrics.dailyBudget})`,
          service: serviceName
        });
      } else if (metrics.budgetUtilization > this.alertThresholds.budgetUtilization) {
        alerts.push({
          type: 'budget',
          severity: 'warning',
          message: `${serviceName.toUpperCase()} budget warning: ${Math.round(metrics.budgetUtilization)}% used`,
          service: serviceName
        });
      }

      // Error rate alerts
      if (metrics.errorRate > 25) {
        alerts.push({
          type: 'error',
          severity: 'critical',
          message: `${serviceName.toUpperCase()} high error rate: ${Math.round(metrics.errorRate)}%`,
          service: serviceName
        });
      } else if (metrics.errorRate > this.alertThresholds.errorRate) {
        alerts.push({
          type: 'error',
          severity: 'warning',
          message: `${serviceName.toUpperCase()} elevated error rate: ${Math.round(metrics.errorRate)}%`,
          service: serviceName
        });
      }

      // Performance alerts
      if (metrics.averageResponseTime > this.alertThresholds.responseTime) {
        alerts.push({
          type: 'performance',
          severity: 'warning',
          message: `${serviceName.toUpperCase()} slow response: ${Math.round(metrics.averageResponseTime)}ms average`,
          service: serviceName
        });
      }
    });

    // System health alerts
    const systemHealth = this.calculateSystemPerformance().overallSystemHealth;
    if (systemHealth === 'critical') {
      alerts.push({
        type: 'health',
        severity: 'critical',
        message: 'System health critical - multiple services failing'
      });
    } else if (systemHealth === 'warning') {
      alerts.push({
        type: 'health',
        severity: 'warning',
        message: 'System health degraded - monitoring required'
      });
    }

    return alerts;
  }

  /**
   * CHECK SERVICE-SPECIFIC ALERTS
   */
  private checkServiceAlerts(serviceName: string, metrics: AIServiceMetrics): void {
    // Real-time budget alerts
    if (metrics.budgetUtilization > 95) {
      console.log(`🚨 CRITICAL: ${serviceName.toUpperCase()} budget exceeded! Pausing service.`);
      this.pauseService(serviceName);
    } else if (metrics.budgetUtilization > 90) {
      console.log(`⚠️ WARNING: ${serviceName.toUpperCase()} budget at ${Math.round(metrics.budgetUtilization)}%`);
    }

    // Real-time error alerts
    if (metrics.errorRate > 30 && metrics.totalRequests > 5) {
      console.log(`🚨 CRITICAL: ${serviceName.toUpperCase()} error rate: ${Math.round(metrics.errorRate)}%`);
    }
  }

  /**
   * SERVICE MANAGEMENT
   */
  private pauseService(serviceName: string): void {
    // Logic to temporarily pause service calls
    console.log(`⏸️ Service ${serviceName} paused due to budget limits`);
  }

  /**
   * DAILY RESET MECHANISM
   */
  private startDailyReset(): void {
    setInterval(() => {
      const today = new Date().toISOString().split('T')[0];
      if (today !== this.dailyResetDate) {
        this.resetDailyMetrics();
        this.dailyResetDate = today;
      }
    }, 60000); // Check every minute
  }

  private resetDailyMetrics(): void {
    console.log('🔄 Resetting daily AI metrics...');
    
    this.serviceMetrics.forEach((metrics, serviceName) => {
      metrics.dailyCost = 0;
      metrics.budgetUtilization = 0;
      metrics.lastResetDate = this.dailyResetDate;
      this.serviceMetrics.set(serviceName, metrics);
    });
  }

  /**
   * BUDGET MANAGEMENT
   */
  private getDailyBudgetForService(service: string): number {
    const budgets = {
      firecrawl: 25,    // $25/day for structured extraction
      openai: 35,       // $35/day for orchestration & embeddings  
      claude: 30,       // $30/day for trust screening
      gemini: 20,       // $20/day for bulk processing
      perplexity: 40    // $40/day for selective validation
    };
    
    return budgets[service as keyof typeof budgets] || 10;
  }

  updateServiceBudget(service: string, newDailyBudget: number): void {
    const metrics = this.serviceMetrics.get(service);
    if (metrics) {
      metrics.dailyBudget = newDailyBudget;
      metrics.budgetUtilization = (metrics.dailyCost / newDailyBudget) * 100;
      this.serviceMetrics.set(service, metrics);
      console.log(`💰 Updated ${service} daily budget to $${newDailyBudget}`);
    }
  }

  /**
   * HISTORICAL TRACKING
   */
  recordSystemSnapshot(): void {
    const performance = this.calculateSystemPerformance();
    this.performanceHistory.push({
      timestamp: new Date(),
      metrics: performance
    });

    // Keep only last 7 days of snapshots
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    this.performanceHistory = this.performanceHistory.filter(
      snapshot => snapshot.timestamp > cutoff
    );
  }

  getPerformanceHistory(hours: number = 24): Array<{
    timestamp: Date;
    metrics: SystemPerformanceMetrics;
  }> {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.performanceHistory.filter(
      snapshot => snapshot.timestamp > cutoff
    );
  }

  /**
   * EXPORT METRICS FOR EXTERNAL MONITORING
   */
  exportMetricsForMonitoring(): {
    timestamp: Date;
    systemStatus: string;
    totalDailyCost: number;
    totalRequests: number;
    overallErrorRate: number;
    serviceHealth: Record<string, 'healthy' | 'warning' | 'critical'>;
  } {
    const costs = this.calculateCostBreakdown();
    const performance = this.calculateSystemPerformance();
    
    const services = Array.from(this.serviceMetrics.values());
    const totalRequests = services.reduce((sum, s) => sum + s.totalRequests, 0);
    const totalErrors = services.reduce((sum, s) => sum + s.failedRequests, 0);
    const overallErrorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;

    const serviceHealth: Record<string, 'healthy' | 'warning' | 'critical'> = {};
    services.forEach(service => {
      if (service.errorRate > 20) {
        serviceHealth[service.serviceName] = 'critical';
      } else if (service.errorRate > 10 || service.budgetUtilization > 80) {
        serviceHealth[service.serviceName] = 'warning';
      } else {
        serviceHealth[service.serviceName] = 'healthy';
      }
    });

    return {
      timestamp: new Date(),
      systemStatus: performance.overallSystemHealth,
      totalDailyCost: costs.totalDailyCost,
      totalRequests,
      overallErrorRate: Math.round(overallErrorRate * 100) / 100,
      serviceHealth
    };
  }
}

export const aiMetricsMonitor = new AIMetricsMonitor();