// Training service for collecting conversation data for Alex improvements
import { logError, ErrorCategory, createAppError } from './errorHandling.js';

export interface ConversationLog {
  id: string;
  userId?: string;
  visitorId: string;
  messages: ConversationMessage[];
  userFeedback?: ConversationFeedback;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: {
    suggestedFilters?: any;
    action?: string;
    confidence?: number;
    processingTime?: number;
    modelUsed?: string;
  };
  timestamp: Date;
}

export interface ConversationFeedback {
  rating: number; // 1-5 stars
  isHelpful: boolean;
  userComment?: string;
  issueType?: 'accuracy' | 'relevance' | 'tone' | 'other';
  submittedAt: Date;
}

export interface TrainingDataExport {
  conversations: ConversationLog[];
  statistics: TrainingStatistics;
  exportedAt: Date;
}

export interface TrainingStatistics {
  totalConversations: number;
  averageRating: number;
  helpfulResponsesPercentage: number;
  commonIssues: { [key: string]: number };
  responseAccuracyTrends: { date: string; accuracy: number }[];
  modelPerformanceComparison: { [model: string]: { avgRating: number; responseCount: number } };
}

export class ConversationTrainingService {
  private conversations: Map<string, ConversationLog> = new Map();
  
  constructor() {
    this.loadExistingConversations();
  }

  private async loadExistingConversations(): Promise<void> {
    try {
      // Load conversations from storage if available
      // For now, start with in-memory storage
      logError({ message: 'ConversationTrainingService initialized', statusCode: 200 }, 'Training service initialization');
    } catch (error) {
      logError(createAppError('Failed to load existing conversations', 500, ErrorCategory.INTERNAL), 'Training service loading');
    }
  }

  /**
   * Start a new conversation log
   */
  startConversation(visitorId: string, userId?: string): string {
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const conversation: ConversationLog = {
      id: conversationId,
      userId,
      visitorId,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.conversations.set(conversationId, conversation);
    
    logError({ 
      message: `Started conversation tracking: ${conversationId}`, 
      statusCode: 200 
    }, 'Training conversation start');

    return conversationId;
  }

  /**
   * Log a user message
   */
  logUserMessage(conversationId: string, content: string): void {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      logError(createAppError(`Conversation not found: ${conversationId}`, 404, ErrorCategory.INTERNAL), 'Training message logging');
      return;
    }

    const message: ConversationMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      role: 'user',
      content,
      timestamp: new Date()
    };

    conversation.messages.push(message);
    conversation.updatedAt = new Date();
  }

  /**
   * Log an assistant response with metadata
   */
  logAssistantResponse(
    conversationId: string, 
    content: string, 
    metadata?: {
      suggestedFilters?: any;
      action?: string;
      confidence?: number;
      processingTime?: number;
      modelUsed?: string;
    }
  ): void {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      logError(createAppError(`Conversation not found: ${conversationId}`, 404, ErrorCategory.INTERNAL), 'Training response logging');
      return;
    }

    const message: ConversationMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      role: 'assistant',
      content,
      metadata: {
        ...metadata,
        modelUsed: metadata?.modelUsed || 'gpt-4o'
      },
      timestamp: new Date()
    };

    conversation.messages.push(message);
    conversation.updatedAt = new Date();
  }

  /**
   * Add user feedback to a conversation
   */
  addConversationFeedback(
    conversationId: string, 
    feedback: Omit<ConversationFeedback, 'submittedAt'>
  ): void {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      logError(createAppError(`Conversation not found: ${conversationId}`, 404, ErrorCategory.INTERNAL), 'Training feedback logging');
      return;
    }

    conversation.userFeedback = {
      ...feedback,
      submittedAt: new Date()
    };
    conversation.updatedAt = new Date();

    logError({ 
      message: `Feedback received for conversation ${conversationId}: ${feedback.rating}/5 stars`, 
      statusCode: 200 
    }, 'Training feedback collection');
  }

  /**
   * Get conversation for review/training
   */
  getConversation(conversationId: string): ConversationLog | null {
    return this.conversations.get(conversationId) || null;
  }

  /**
   * Get training statistics
   */
  getTrainingStatistics(): TrainingStatistics {
    const conversations = Array.from(this.conversations.values());
    const conversationsWithFeedback = conversations.filter(c => c.userFeedback);
    
    const totalConversations = conversations.length;
    const averageRating = conversationsWithFeedback.length > 0 
      ? conversationsWithFeedback.reduce((sum, c) => sum + (c.userFeedback?.rating || 0), 0) / conversationsWithFeedback.length
      : 0;
    
    const helpfulResponses = conversationsWithFeedback.filter(c => c.userFeedback?.isHelpful).length;
    const helpfulResponsesPercentage = conversationsWithFeedback.length > 0 
      ? (helpfulResponses / conversationsWithFeedback.length) * 100 
      : 0;

    const commonIssues: { [key: string]: number } = {};
    conversationsWithFeedback.forEach(c => {
      if (c.userFeedback?.issueType) {
        commonIssues[c.userFeedback.issueType] = (commonIssues[c.userFeedback.issueType] || 0) + 1;
      }
    });

    return {
      totalConversations,
      averageRating,
      helpfulResponsesPercentage,
      commonIssues,
      responseAccuracyTrends: [], // TODO: Implement temporal trends
      modelPerformanceComparison: {} // TODO: Implement model comparison
    };
  }

  /**
   * Export training data for fine-tuning
   */
  exportTrainingData(filterCriteria?: {
    minRating?: number;
    onlyHelpful?: boolean;
    dateRange?: { start: Date; end: Date };
  }): TrainingDataExport {
    let conversations = Array.from(this.conversations.values());

    // Apply filters
    if (filterCriteria) {
      conversations = conversations.filter(conv => {
        if (filterCriteria.minRating && conv.userFeedback && conv.userFeedback.rating < filterCriteria.minRating) {
          return false;
        }
        if (filterCriteria.onlyHelpful && (!conv.userFeedback || !conv.userFeedback.isHelpful)) {
          return false;
        }
        if (filterCriteria.dateRange) {
          const convDate = conv.createdAt;
          if (convDate < filterCriteria.dateRange.start || convDate > filterCriteria.dateRange.end) {
            return false;
          }
        }
        return true;
      });
    }

    return {
      conversations,
      statistics: this.getTrainingStatistics(),
      exportedAt: new Date()
    };
  }

  /**
   * Generate OpenAI fine-tuning format from conversations
   */
  generateFineTuningData(conversationIds?: string[]): Array<{ messages: Array<{ role: string; content: string }> }> {
    const conversations = conversationIds 
      ? conversationIds.map(id => this.conversations.get(id)).filter(Boolean) as ConversationLog[]
      : Array.from(this.conversations.values());

    return conversations
      .filter(conv => conv.messages.length >= 2 && conv.userFeedback?.rating && conv.userFeedback.rating >= 4)
      .map(conv => ({
        messages: conv.messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      }));
  }

  /**
   * Clear old conversations (data retention)
   */
  clearOldConversations(olderThanDays: number = 30): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    let deletedCount = 0;
    const entries = Array.from(this.conversations.entries());
    for (const [id, conversation] of entries) {
      if (conversation.createdAt < cutoffDate) {
        this.conversations.delete(id);
        deletedCount++;
      }
    }

    logError({ 
      message: `Cleared ${deletedCount} old conversations older than ${olderThanDays} days`, 
      statusCode: 200 
    }, 'Training data cleanup');

    return deletedCount;
  }
}

// Singleton instance
export const conversationTrainingService = new ConversationTrainingService();