/**
 * VAHAN API Service
 * Handles vehicle registration lookup via backend proxy
 *
 * Security: Backend handles VAHAN credentials, frontend only sends reg number
 * Privacy: Registration numbers are hashed before analytics logging
 */

export interface VahanVehicle {
  reg_number: string;
  make: string;
  model: string;
  variant?: string;
  manufacture_year: string;
  registration_year?: string;
  fuel_type: string;
  transmission: string;
  no_of_owners: number;
  color?: string;
  chassis_number?: string;
  engine_number?: string;
  registration_date?: string;
  images?: string[];
}

export interface VahanResponse {
  status: 'ok' | 'not_found' | 'error';
  vehicle?: VahanVehicle;
  source?: string;
  meta?: {
    fetched_at: string;
    confidence?: number;
  };
  message?: string;
}

export interface VahanError {
  status: number;
  body: {
    message: string;
    code?: string;
  };
}

export interface ListingFormData {
  brand: string;
  model: string;
  variant?: string;
  year: string;
  fuelType: string;
  transmission: string;
  ownerCount: string;
  color: string;
  chassisNumber: string;
  engineNumber: string;
  registrationDate: string;
  registrationNumber: string;
  images: string[];
  vahanVerified?: boolean;
  vahanConfidence?: number;
  raw?: VahanVehicle; // For debugging, not for analytics
}

/**
 * Validates Indian vehicle registration number format
 * Examples: MH12AB1234, DL01CA9999, KA03MH7777
 */
export function validateRegistrationNumber(regNumber: string): {
  valid: boolean;
  error?: string;
} {
  if (!regNumber || regNumber.trim().length === 0) {
    return { valid: false, error: 'Registration number is required' };
  }

  const trimmed = regNumber.trim().toUpperCase();

  // Indian registration format: 2 letters + 2 digits + 1-2 letters + 1-4 digits
  // Examples: MH12AB1234, DL1CA9999, KA3MH777
  const regexPattern = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{1,4}$/;

  if (!regexPattern.test(trimmed)) {
    return {
      valid: false,
      error: 'Invalid format. Example: MH12AB1234',
    };
  }

  return { valid: true };
}

/**
 * Normalize registration number (trim & uppercase)
 */
export function normalizeRegistrationNumber(regNumber: string): string {
  return regNumber.trim().toUpperCase();
}

/**
 * Hash registration number for privacy-safe analytics
 * Uses simple hash to avoid logging PII
 */
async function hashRegNumber(regNumber: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(regNumber);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.substring(0, 16); // First 16 chars for brevity
}

/**
 * Fetch vehicle details from VAHAN via backend proxy
 *
 * @param regNumber - Vehicle registration number (will be normalized)
 * @param timeout - Request timeout in milliseconds (default: 15000)
 * @returns Promise<VahanResponse>
 * @throws VahanError with status code and error details
 */
export async function fetchVahanDetails(
  regNumber: string,
  timeout: number = 15000
): Promise<VahanResponse> {
  const normalized = normalizeRegistrationNumber(regNumber);

  // Validate before sending
  const validation = validateRegistrationNumber(normalized);
  if (!validation.valid) {
    throw {
      status: 400,
      body: {
        message: validation.error || 'Invalid registration number',
        code: 'VALIDATION_ERROR',
      },
    } as VahanError;
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch('/api/vahan/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reg_number: normalized }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({
        message: 'Unknown error occurred',
        code: 'UNKNOWN_ERROR',
      }));

      throw {
        status: response.status,
        body: errorBody,
      } as VahanError;
    }

    const data: VahanResponse = await response.json();

    // Track success (with hashed reg number for privacy)
    const hashedReg = await hashRegNumber(normalized);
    console.log('[VAHAN] Lookup success:', {
      reg_hash: hashedReg,
      status: data.status,
      confidence: data.meta?.confidence,
    });

    return data;
  } catch (error: any) {
    clearTimeout(timeoutId);

    // Handle abort (timeout)
    if (error.name === 'AbortError') {
      throw {
        status: 408,
        body: {
          message: 'Request timed out. Please try again.',
          code: 'TIMEOUT',
        },
      } as VahanError;
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw {
        status: 0,
        body: {
          message: 'Network error. Please check your connection.',
          code: 'NETWORK_ERROR',
        },
      } as VahanError;
    }

    // Re-throw VahanError
    if ('status' in error && 'body' in error) {
      throw error;
    }

    // Unknown error
    throw {
      status: 500,
      body: {
        message: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR',
      },
    } as VahanError;
  }
}

/**
 * Map VAHAN response to listing form data
 * Handles partial data gracefully (fills what's available)
 */
export function mapVahanToFormData(
  vahanData: VahanVehicle,
  existingData?: Partial<ListingFormData>
): ListingFormData {
  return {
    // Merge with existing data (user might have started manual entry)
    ...existingData,

    // VAHAN data takes precedence
    brand: vahanData.make || existingData?.brand || '',
    model: vahanData.model || existingData?.model || '',
    variant: vahanData.variant || existingData?.variant || '',
    year: vahanData.manufacture_year || vahanData.registration_year || existingData?.year || '',
    fuelType: vahanData.fuel_type || existingData?.fuelType || '',
    transmission: vahanData.transmission || existingData?.transmission || '',
    ownerCount: vahanData.no_of_owners?.toString() || existingData?.ownerCount || '',
    color: vahanData.color || existingData?.color || '',
    chassisNumber: vahanData.chassis_number || existingData?.chassisNumber || '',
    engineNumber: vahanData.engine_number || existingData?.engineNumber || '',
    registrationDate: vahanData.registration_date || existingData?.registrationDate || '',
    registrationNumber: vahanData.reg_number || existingData?.registrationNumber || '',
    images: vahanData.images || existingData?.images || [],

    // Metadata
    vahanVerified: true,
    vahanConfidence: undefined, // Will be set from meta
    raw: vahanData, // Keep raw data for debugging (not logged to analytics)
  };
}

/**
 * Get user-friendly error message based on error code/status
 */
export function getErrorMessage(error: VahanError): {
  title: string;
  message: string;
  action: 'retry' | 'manual' | 'wait';
} {
  const { status, body } = error;

  // Rate limiting
  if (status === 429 || body.code === 'RATE_LIMITED') {
    return {
      title: 'Too many requests',
      message: 'Please wait a minute before trying again.',
      action: 'wait',
    };
  }

  // Not found
  if (status === 404 || body.code === 'NOT_FOUND') {
    return {
      title: 'Vehicle not found',
      message: 'We could not find this registration in VAHAN records. You can enter details manually.',
      action: 'manual',
    };
  }

  // Timeout
  if (status === 408 || body.code === 'TIMEOUT') {
    return {
      title: 'Request timed out',
      message: 'The service is taking longer than expected. Please try again.',
      action: 'retry',
    };
  }

  // Service unavailable
  if (status === 503 || body.code === 'SERVICE_UNAVAILABLE') {
    return {
      title: 'Service temporarily unavailable',
      message: 'VAHAN service is currently down. Please try again later or enter details manually.',
      action: 'manual',
    };
  }

  // Network error
  if (status === 0 || body.code === 'NETWORK_ERROR') {
    return {
      title: 'Connection error',
      message: 'Please check your internet connection and try again.',
      action: 'retry',
    };
  }

  // Validation error
  if (status === 400 || body.code === 'VALIDATION_ERROR') {
    return {
      title: 'Invalid registration number',
      message: body.message || 'Please check the format and try again.',
      action: 'retry',
    };
  }

  // Generic error
  return {
    title: 'Something went wrong',
    message: body.message || 'An unexpected error occurred. Please try again or enter details manually.',
    action: 'retry',
  };
}

/**
 * Get fields that are missing or need confirmation
 * Useful for showing which fields user should verify
 */
export function getMissingFields(formData: ListingFormData): string[] {
  const required = [
    { key: 'brand', label: 'Brand' },
    { key: 'model', label: 'Model' },
    { key: 'year', label: 'Year' },
    { key: 'fuelType', label: 'Fuel Type' },
    { key: 'transmission', label: 'Transmission' },
  ];

  return required
    .filter(field => !formData[field.key as keyof ListingFormData])
    .map(field => field.label);
}
