import axios from 'axios';
import sizeOf from 'image-size';

export interface ImageValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  dimensions?: {
    width: number;
    height: number;
  };
  fileSize?: number;
  mimeType?: string;
}

const MIN_WIDTH = 800;
const MIN_HEIGHT = 600;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

/**
 * Validates image from file buffer
 * Google Vehicle Listing requirement: min 800x600, max 5MB
 */
export async function validateImageFromBuffer(
  buffer: Buffer,
  fileName: string
): Promise<ImageValidationResult> {
  const result: ImageValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  try {
    // Check file size
    result.fileSize = buffer.length;
    if (result.fileSize > MAX_FILE_SIZE) {
      result.isValid = false;
      result.errors.push(
        `Image "${fileName}" exceeds maximum size of 5MB ` +
        `(actual: ${(result.fileSize / 1024 / 1024).toFixed(2)}MB)`
      );
      return result;
    }

    // Get image dimensions
    try {
      const dimensions = sizeOf(buffer);
      result.dimensions = {
        width: dimensions.width || 0,
        height: dimensions.height || 0,
      };
      result.mimeType = dimensions.type;

      // Validate minimum dimensions
      if (result.dimensions.width < MIN_WIDTH || result.dimensions.height < MIN_HEIGHT) {
        result.isValid = false;
        result.errors.push(
          `Image "${fileName}" does not meet minimum dimensions ` +
          `(requires ${MIN_WIDTH}x${MIN_HEIGHT}, actual: ${result.dimensions.width}x${result.dimensions.height})`
        );
      }

      // Warn about non-standard aspect ratios
      const aspectRatio = result.dimensions.width / result.dimensions.height;
      if (aspectRatio < 1.2 || aspectRatio > 1.8) {
        result.warnings.push(
          `Image "${fileName}" has unusual aspect ratio (${aspectRatio.toFixed(2)}). ` +
          `Recommended: 1.33 (4:3) or 1.5 (3:2)`
        );
      }
    } catch (dimensionError) {
      result.isValid = false;
      result.errors.push(`Unable to read image dimensions for "${fileName}". File may be corrupted.`);
      return result;
    }
  } catch (error) {
    result.isValid = false;
    result.errors.push(`Failed to validate image "${fileName}": ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Validates image from URL (for external images)
 */
export async function validateImageFromUrl(url: string): Promise<ImageValidationResult> {
  const result: ImageValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  try {
    // Check if URL is reachable and get image data
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 10000, // 10 second timeout
      maxContentLength: MAX_FILE_SIZE,
    });

    const buffer = Buffer.from(response.data);
    
    // Validate the downloaded image
    const bufferValidation = await validateImageFromBuffer(buffer, url);
    return bufferValidation;
  } catch (error) {
    result.isValid = false;
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        result.errors.push(`Image URL "${url}" timed out after 10 seconds`);
      } else if (error.response?.status === 404) {
        result.errors.push(`Image not found at URL "${url}"`);
      } else if (error.response?.status === 403) {
        result.errors.push(`Access denied to image URL "${url}"`);
      } else {
        result.errors.push(`Unable to access image at "${url}": ${error.message}`);
      }
    } else {
      result.errors.push(`Failed to validate image from URL "${url}": ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return result;
}

/**
 * Batch image validation
 */
export async function validateImageBatch(
  images: Array<{ buffer?: Buffer; url?: string; fileName: string }>
): Promise<Map<string, ImageValidationResult>> {
  const results = new Map<string, ImageValidationResult>();

  for (const image of images) {
    let validationResult: ImageValidationResult;

    if (image.buffer) {
      validationResult = await validateImageFromBuffer(image.buffer, image.fileName);
    } else if (image.url) {
      validationResult = await validateImageFromUrl(image.url);
    } else {
      validationResult = {
        isValid: false,
        errors: ['No image buffer or URL provided'],
        warnings: [],
      };
    }

    results.set(image.fileName, validationResult);
  }

  return results;
}

/**
 * Validate that at least one valid image exists (Google requirement)
 */
export function validateMinimumImages(imageResults: ImageValidationResult[]): {
  hasMinimum: boolean;
  error?: string;
} {
  const validImages = imageResults.filter(r => r.isValid);

  if (validImages.length === 0) {
    return {
      hasMinimum: false,
      error: 'At least one valid image is required (min 800x600, max 5MB)',
    };
  }

  return { hasMinimum: true };
}
