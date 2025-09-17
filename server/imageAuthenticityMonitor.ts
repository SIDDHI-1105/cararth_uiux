import { AIMetricsMonitor } from './aiMetricsMonitor.js';

/**
 * Singleton instance for Image Authenticity Monitoring
 * 
 * This provides easy access to the monitoring system for integration
 * with ImageAssetService, TrustLayer, and other components.
 */
export const imageAuthenticityMonitor = AIMetricsMonitor.getInstance();

/**
 * Helper functions for recording image authenticity metrics
 */
export const recordImageProcessing = (data: {
  imageProcessed: boolean;
  passedGate: boolean;
  wasPlaceholder: boolean;
  wasDuplicate: boolean;
  listingId?: string;
}) => {
  imageAuthenticityMonitor.recordImageAuthenticity(data);
};

export const recordListingProcessing = (data: {
  listingId: string;
  totalImages: number;
  verifiedImages: number;
  hasVerifiedImages: boolean;
}) => {
  imageAuthenticityMonitor.recordListingAuthenticity(data);
};

/**
 * Get current image authenticity metrics for API/dashboard
 */
export const getImageAuthenticityStats = () => {
  return imageAuthenticityMonitor.getImageAuthenticityMetrics();
};

/**
 * Get full system status including image authenticity
 */
export const getSystemStatus = () => {
  return imageAuthenticityMonitor.getSystemStatus();
};