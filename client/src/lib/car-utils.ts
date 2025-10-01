import { type CarListing } from "@shared/schema";

const FALLBACK_CAR_IMAGE_URL = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZSBBdmFpbGFibGU8L3RleHQ+PC9zdmc+';

/**
 * Unified helper to get source from car data consistently across components
 * Handles the inconsistency between different data shapes where source 
 * might be in 'source', 'portal', or other fields
 */
export const getCarSource = (car: CarListing): string | undefined => {
  return (car as any).source || (car as any).portal || car.portal;
};

/**
 * Check if a car listing has valid, verified images (not placeholders/fallback)
 * Used for sorting to prioritize listings with professional images
 */
export const hasValidImages = (car: CarListing): boolean => {
  const images = car.images;
  
  // No images array or empty
  if (!images || !Array.isArray(images) || images.length === 0) {
    return false;
  }
  
  const firstImage = images[0];
  
  // Check for placeholder patterns
  const placeholderPatterns = ['spacer3x2.png', 'CD-Shimmer.svg', 'placeholder.png', 'data:image/svg+xml'];
  const isPlaceholder = placeholderPatterns.some(pattern => 
    firstImage?.toLowerCase().includes(pattern.toLowerCase())
  );
  
  // Has valid image if not a placeholder and not empty
  return !isPlaceholder && firstImage && firstImage.trim().length > 0;
};

/**
 * Enhanced source badge color system for data transparency
 * Color-codes different source types to build user trust
 */
export const getSourceBadgeColor = (source?: string): string => {
  const sourceLower = source?.toLowerCase() || '';
  
  // OEM/CERTIFIED SOURCES - Premium Gold/Amber (Highest Trust)
  if (sourceLower.includes('maruti') || sourceLower.includes('true value') || 
      sourceLower.includes('certified') || sourceLower.includes('oem')) {
    return 'bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700 font-semibold';
  }
  
  // BANK/GOVERNMENT AUCTIONS - Blue Institutional (High Trust)
  if (sourceLower.includes('bank') || sourceLower.includes('auction') || 
      sourceLower.includes('government') || sourceLower.includes('eauctions') ||
      sourceLower.includes('sbi') || sourceLower.includes('hdfc') || sourceLower.includes('icici')) {
    return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700 font-medium';
  }
  
  // PRIMARY MARKETPLACES - Distinct Colors for Major Platforms
  switch (sourceLower) {
    case 'cardekho':
      return 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700';
    case 'cars24':
      return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700';
    case 'olx':
    case 'olx autos':
      return 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-700';
    case 'carwale':
      return 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-700';
      
    // SECONDARY SOURCES - Muted Styling for Newer Platforms  
    case 'autotrader':
      return 'bg-slate-100 dark:bg-slate-800/20 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-600';
    case 'spinny':
      return 'bg-teal-100 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-600';
    case 'droom':
      return 'bg-pink-100 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400 border border-pink-200 dark:border-pink-600';
    case 'cartrade':
      return 'bg-cyan-100 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-600';
      
    // DEFAULT - Neutral for Unknown Sources
    default:
      return 'bg-gray-100 dark:bg-gray-800/20 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600';
  }
};