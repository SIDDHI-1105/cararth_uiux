/**
 * Unit Tests for VAHAN Service
 *
 * Tests:
 * - Registration number validation
 * - VAHAN API fetch (success, errors, timeout)
 * - Data mapping from VAHAN to form format
 * - Error message generation
 * - Missing fields detection
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  validateRegistrationNumber,
  normalizeRegistrationNumber,
  fetchVahanDetails,
  mapVahanToFormData,
  getErrorMessage,
  getMissingFields,
  type VahanVehicle,
  type VahanError,
  type ListingFormData,
} from './vahanService';

describe('validateRegistrationNumber', () => {
  it('should validate correct registration numbers', () => {
    const validNumbers = [
      'MH12AB1234',
      'DL1CA9999',
      'KA03MH7777',
      'TN09BK8765',
      'GJ01AA1111',
    ];

    validNumbers.forEach((regNumber) => {
      const result = validateRegistrationNumber(regNumber);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  it('should reject empty or whitespace-only input', () => {
    const result1 = validateRegistrationNumber('');
    expect(result1.valid).toBe(false);
    expect(result1.error).toBe('Registration number is required');

    const result2 = validateRegistrationNumber('   ');
    expect(result2.valid).toBe(false);
    expect(result2.error).toBe('Registration number is required');
  });

  it('should reject invalid formats', () => {
    const invalidNumbers = [
      '123ABCD',           // No state code
      'MH12345678',        // No letters in middle
      'MHAB1234',          // Missing digits after state
      'MH12A12345',        // Too many digits at end
      'mh12ab1234',        // Lowercase (should be normalized before validation)
    ];

    invalidNumbers.forEach((regNumber) => {
      const result = validateRegistrationNumber(regNumber);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid format');
    });
  });
});

describe('normalizeRegistrationNumber', () => {
  it('should trim and uppercase registration numbers', () => {
    expect(normalizeRegistrationNumber('  mh12ab1234  ')).toBe('MH12AB1234');
    expect(normalizeRegistrationNumber('dl01ca9999')).toBe('DL01CA9999');
    expect(normalizeRegistrationNumber('Ka03MH7777')).toBe('KA03MH7777');
  });
});

describe('fetchVahanDetails', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('should successfully fetch vehicle details', async () => {
    const mockResponse: any = {
      status: 'ok',
      vehicle: {
        reg_number: 'MH12AB1234',
        make: 'Maruti',
        model: 'Swift',
        manufacture_year: '2019',
        fuel_type: 'Petrol',
        transmission: 'Manual',
        no_of_owners: 1,
        color: 'White',
      },
      source: 'vahan',
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await fetchVahanDetails('MH12AB1234');

    expect(result.status).toBe('ok');
    expect(result.vehicle).toBeDefined();
    expect(result.vehicle?.make).toBe('Maruti');
    expect(fetch).toHaveBeenCalledWith(
      '/api/vahan/lookup',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reg_number: 'MH12AB1234' }),
      })
    );
  });

  it('should handle validation errors before API call', async () => {
    await expect(fetchVahanDetails('INVALID')).rejects.toMatchObject({
      status: 400,
      body: {
        code: 'VALIDATION_ERROR',
      },
    });

    // Fetch should not be called
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should handle 404 not found', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({
        message: 'Vehicle not found',
        code: 'NOT_FOUND',
      }),
    });

    await expect(fetchVahanDetails('MH12AB1234')).rejects.toMatchObject({
      status: 404,
      body: {
        message: 'Vehicle not found',
        code: 'NOT_FOUND',
      },
    });
  });

  it('should handle 429 rate limiting', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({
        message: 'Too many requests',
        code: 'RATE_LIMITED',
      }),
    });

    await expect(fetchVahanDetails('MH12AB1234')).rejects.toMatchObject({
      status: 429,
      body: {
        code: 'RATE_LIMITED',
      },
    });
  });

  it('should handle network errors', async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(fetchVahanDetails('MH12AB1234')).rejects.toMatchObject({
      status: 0,
      body: {
        code: 'NETWORK_ERROR',
      },
    });
  });

  it('should handle timeout', async () => {
    global.fetch = vi.fn().mockImplementation(
      () =>
        new Promise((_, reject) => {
          setTimeout(() => reject(new DOMException('Aborted', 'AbortError')), 100);
        })
    );

    await expect(fetchVahanDetails('MH12AB1234', 50)).rejects.toMatchObject({
      status: 408,
      body: {
        code: 'TIMEOUT',
      },
    });
  }, 10000);
});

describe('mapVahanToFormData', () => {
  it('should map complete VAHAN data to form data', () => {
    const vahanData: VahanVehicle = {
      reg_number: 'MH12AB1234',
      make: 'Maruti',
      model: 'Swift',
      variant: 'VXi',
      manufacture_year: '2019',
      registration_year: '2019',
      fuel_type: 'Petrol',
      transmission: 'Manual',
      no_of_owners: 1,
      color: 'White',
      chassis_number: 'CHASSIS123',
      engine_number: 'ENGINE456',
      registration_date: '2019-03-15',
      images: ['https://example.com/image1.jpg'],
    };

    const formData = mapVahanToFormData(vahanData);

    expect(formData.brand).toBe('Maruti');
    expect(formData.model).toBe('Swift');
    expect(formData.variant).toBe('VXi');
    expect(formData.year).toBe('2019');
    expect(formData.fuelType).toBe('Petrol');
    expect(formData.transmission).toBe('Manual');
    expect(formData.ownerCount).toBe('1');
    expect(formData.color).toBe('White');
    expect(formData.chassisNumber).toBe('CHASSIS123');
    expect(formData.engineNumber).toBe('ENGINE456');
    expect(formData.registrationDate).toBe('2019-03-15');
    expect(formData.registrationNumber).toBe('MH12AB1234');
    expect(formData.images).toEqual(['https://example.com/image1.jpg']);
    expect(formData.vahanVerified).toBe(true);
  });

  it('should handle partial VAHAN data', () => {
    const partialData: VahanVehicle = {
      reg_number: 'DL01CA9999',
      make: 'Honda',
      model: 'City',
      manufacture_year: '2020',
      fuel_type: 'Petrol',
      transmission: 'Automatic',
      no_of_owners: 1,
    };

    const formData = mapVahanToFormData(partialData);

    expect(formData.brand).toBe('Honda');
    expect(formData.model).toBe('City');
    expect(formData.year).toBe('2020');
    expect(formData.color).toBe('');
    expect(formData.variant).toBe('');
    expect(formData.chassisNumber).toBe('');
  });

  it('should merge with existing data', () => {
    const vahanData: VahanVehicle = {
      reg_number: 'MH12AB1234',
      make: 'Maruti',
      model: 'Swift',
      manufacture_year: '2019',
      fuel_type: 'Petrol',
      transmission: 'Manual',
      no_of_owners: 1,
    };

    const existingData: Partial<ListingFormData> = {
      color: 'Red', // User might have pre-filled this
      registrationNumber: 'OLD123',
    };

    const formData = mapVahanToFormData(vahanData, existingData);

    // VAHAN data should override
    expect(formData.registrationNumber).toBe('MH12AB1234');
    expect(formData.brand).toBe('Maruti');

    // But color from existing should be kept if VAHAN doesn't provide it
    expect(formData.color).toBe('Red');
  });
});

describe('getErrorMessage', () => {
  it('should return correct message for rate limiting', () => {
    const error: VahanError = {
      status: 429,
      body: { message: 'Too many requests', code: 'RATE_LIMITED' },
    };

    const result = getErrorMessage(error);

    expect(result.title).toBe('Too many requests');
    expect(result.message).toContain('wait a minute');
    expect(result.action).toBe('wait');
  });

  it('should return correct message for not found', () => {
    const error: VahanError = {
      status: 404,
      body: { message: 'Vehicle not found', code: 'NOT_FOUND' },
    };

    const result = getErrorMessage(error);

    expect(result.title).toBe('Vehicle not found');
    expect(result.message).toContain('manually');
    expect(result.action).toBe('manual');
  });

  it('should return correct message for timeout', () => {
    const error: VahanError = {
      status: 408,
      body: { message: 'Timeout', code: 'TIMEOUT' },
    };

    const result = getErrorMessage(error);

    expect(result.title).toBe('Request timed out');
    expect(result.action).toBe('retry');
  });

  it('should return correct message for network error', () => {
    const error: VahanError = {
      status: 0,
      body: { message: 'Network error', code: 'NETWORK_ERROR' },
    };

    const result = getErrorMessage(error);

    expect(result.title).toBe('Connection error');
    expect(result.message).toContain('internet connection');
    expect(result.action).toBe('retry');
  });

  it('should return generic message for unknown errors', () => {
    const error: VahanError = {
      status: 500,
      body: { message: 'Internal server error' },
    };

    const result = getErrorMessage(error);

    expect(result.title).toBe('Something went wrong');
    expect(result.action).toBe('retry');
  });
});

describe('getMissingFields', () => {
  it('should return empty array for complete data', () => {
    const completeData: ListingFormData = {
      brand: 'Maruti',
      model: 'Swift',
      year: '2019',
      fuelType: 'Petrol',
      transmission: 'Manual',
      ownerCount: '1',
      color: 'White',
      chassisNumber: '',
      engineNumber: '',
      registrationDate: '',
      registrationNumber: 'MH12AB1234',
      images: [],
    };

    const missing = getMissingFields(completeData);
    expect(missing).toEqual([]);
  });

  it('should identify missing required fields', () => {
    const incompleteData: ListingFormData = {
      brand: '',
      model: 'Swift',
      year: '',
      fuelType: 'Petrol',
      transmission: '',
      ownerCount: '1',
      color: 'White',
      chassisNumber: '',
      engineNumber: '',
      registrationDate: '',
      registrationNumber: 'MH12AB1234',
      images: [],
    };

    const missing = getMissingFields(incompleteData);
    expect(missing).toContain('Brand');
    expect(missing).toContain('Year');
    expect(missing).toContain('Transmission');
    expect(missing.length).toBe(3);
  });

  it('should not flag optional fields as missing', () => {
    const dataWithoutOptional: ListingFormData = {
      brand: 'Honda',
      model: 'City',
      year: '2020',
      fuelType: 'Petrol',
      transmission: 'Automatic',
      ownerCount: '1',
      color: '',          // Optional
      chassisNumber: '',  // Optional
      engineNumber: '',   // Optional
      registrationDate: '',
      registrationNumber: 'DL01CA9999',
      images: [],
    };

    const missing = getMissingFields(dataWithoutOptional);
    expect(missing).toEqual([]);
  });
});
