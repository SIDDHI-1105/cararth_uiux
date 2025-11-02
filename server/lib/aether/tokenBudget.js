import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TOKEN_USAGE_LOG = path.join(__dirname, '../../../data/aether/token_usage.log');
const COST_CONTROL_LOG = path.join(__dirname, '../../../data/aether/cost_control.log');

/**
 * Daily token budget enforcement
 */
class TokenBudget {
  constructor() {
    this.dailyCap = parseInt(process.env.AETHER_DAILY_TOKEN_CAP || '20000');
    this.ensureLogDirectories();
  }

  ensureLogDirectories() {
    const dirs = [path.dirname(TOKEN_USAGE_LOG), path.dirname(COST_CONTROL_LOG)];
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  /**
   * Get today's date string for comparison
   */
  getTodayString() {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Parse token usage log and calculate today's usage
   */
  getTodayUsage() {
    try {
      if (!fs.existsSync(TOKEN_USAGE_LOG)) {
        return 0;
      }

      const logContent = fs.readFileSync(TOKEN_USAGE_LOG, 'utf8');
      const lines = logContent.trim().split('\n').filter(l => l);
      const today = this.getTodayString();
      
      let totalTokens = 0;

      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          const entryDate = entry.timestamp.split('T')[0];
          
          // Only count today's tokens
          if (entryDate === today) {
            totalTokens += entry.tokens || 0;
          }
        } catch (err) {
          // Skip malformed lines
          continue;
        }
      }

      return totalTokens;
    } catch (error) {
      console.error('[TokenBudget] Failed to read usage log:', error);
      return 0;
    }
  }

  /**
   * Check how many tokens remain today
   */
  tokensRemaining() {
    const used = this.getTodayUsage();
    const remaining = Math.max(0, this.dailyCap - used);
    
    return {
      cap: this.dailyCap,
      used,
      remaining,
      percentage: this.dailyCap > 0 ? ((used / this.dailyCap) * 100).toFixed(2) : 0
    };
  }

  /**
   * Check if a request would exceed the budget
   */
  canUseTokens(estimatedTokens) {
    const { remaining } = this.tokensRemaining();
    return estimatedTokens <= remaining;
  }

  /**
   * Log a budget rejection
   */
  logRejection(operation, requestedTokens, correlationId) {
    const timestamp = new Date().toISOString();
    const { used, cap, remaining } = this.tokensRemaining();
    
    const logEntry = JSON.stringify({
      timestamp,
      correlationId,
      event: 'budget_exceeded',
      operation,
      requestedTokens,
      dailyCap: cap,
      tokensUsed: used,
      tokensRemaining: remaining
    }) + '\n';

    try {
      fs.appendFileSync(COST_CONTROL_LOG, logEntry);
      console.warn(`[TokenBudget] REJECTED: ${operation} requesting ${requestedTokens} tokens, only ${remaining} remaining`);
    } catch (error) {
      console.error('[TokenBudget] Failed to log rejection:', error);
    }
  }

  /**
   * Log budget info
   */
  logInfo(message, metadata = {}) {
    const timestamp = new Date().toISOString();
    
    const logEntry = JSON.stringify({
      timestamp,
      event: 'budget_info',
      message,
      ...metadata
    }) + '\n';

    try {
      fs.appendFileSync(COST_CONTROL_LOG, logEntry);
    } catch (error) {
      console.error('[TokenBudget] Failed to log info:', error);
    }
  }

  /**
   * Get budget statistics
   */
  getStats() {
    const { cap, used, remaining, percentage } = this.tokensRemaining();
    
    return {
      dailyCap: cap,
      tokensUsed: used,
      tokensRemaining: remaining,
      usagePercentage: percentage + '%',
      budgetEnabled: cap > 0,
      resetTime: this.getNextResetTime()
    };
  }

  /**
   * Get time until next reset (midnight UTC)
   */
  getNextResetTime() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    
    const msUntilReset = tomorrow.getTime() - now.getTime();
    const hoursUntilReset = Math.floor(msUntilReset / (1000 * 60 * 60));
    const minutesUntilReset = Math.floor((msUntilReset % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hoursUntilReset}h ${minutesUntilReset}m`;
  }

  /**
   * Set new daily cap (for admin control)
   */
  setDailyCap(newCap) {
    this.dailyCap = newCap;
    this.logInfo('Daily cap updated', { newCap });
    return this.getStats();
  }

  /**
   * Get detailed usage breakdown
   */
  getUsageBreakdown() {
    try {
      if (!fs.existsSync(TOKEN_USAGE_LOG)) {
        return { operations: [], total: 0 };
      }

      const logContent = fs.readFileSync(TOKEN_USAGE_LOG, 'utf8');
      const lines = logContent.trim().split('\n').filter(l => l);
      const today = this.getTodayString();
      
      const operations = {};
      let totalTokens = 0;
      let totalCost = 0;

      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          const entryDate = entry.timestamp.split('T')[0];
          
          // Only count today's usage
          if (entryDate === today) {
            const op = entry.operation || 'unknown';
            if (!operations[op]) {
              operations[op] = { count: 0, tokens: 0, cost: 0 };
            }
            
            operations[op].count++;
            operations[op].tokens += entry.tokens || 0;
            operations[op].cost += entry.cost || 0;
            
            totalTokens += entry.tokens || 0;
            totalCost += entry.cost || 0;
          }
        } catch (err) {
          continue;
        }
      }

      // Convert to array and sort by token usage
      const operationsList = Object.entries(operations)
        .map(([name, data]) => ({ operation: name, ...data }))
        .sort((a, b) => b.tokens - a.tokens);

      return {
        operations: operationsList,
        totalTokens,
        totalCost: totalCost.toFixed(6),
        date: today
      };
    } catch (error) {
      console.error('[TokenBudget] Failed to get usage breakdown:', error);
      return { operations: [], total: 0, error: error.message };
    }
  }
}

// Export singleton instance
export const tokenBudget = new TokenBudget();
