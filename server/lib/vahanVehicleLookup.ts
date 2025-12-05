/**
 * VAHAN Vehicle Lookup Service
 * Fetches individual vehicle details from VAHAN API by registration number
 */

import axios from 'axios';

export interface VahanVehicleDetails {
  registrationNumber: string;
  make: string;
  model: string;
  fuelType: string;
  registrationYear: number;
  registrationDate?: string;
  engineNumber?: string;
  chassisNumber?: string;
  color?: string;
  registeredState?: string;
  registeredCity?: string;
  vehicleClass?: string;
  transmission?: string;
  ownerSerial?: number;
}

export interface VahanApiResponse {
  success: boolean;
  data?: VahanVehicleDetails;
  error?: string;
}

export class VahanVehicleLookupService {
  private apiKey: string;
  private baseUrl: string;
  private cache: Map<string, { data: VahanVehicleDetails; timestamp: number }>;
  private cacheTTL: number = 3600000; // 1 hour in milliseconds

  constructor() {
    this.apiKey = process.env.VAHAN_API_KEY || '';
    this.baseUrl = process.env.VAHAN_BASE_URL || 'https://vahan.parivahan.gov.in/vahan4dashboard/vahan/api';
    this.cache = new Map();
  }

  /**
   * Fetch vehicle details by registration number
   */
  async fetchByRegNumber(registrationNumber: string): Promise<VahanVehicleDetails> {
    const cleanRegNo = registrationNumber.trim().toUpperCase().replace(/\s+/g, '');

    // Validate registration number format
    if (!this.isValidRegistrationNumber(cleanRegNo)) {
      throw new Error(`Invalid registration number format: ${registrationNumber}`);
    }

    // Check cache first
    const cached = this.cache.get(cleanRegNo);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      console.log(`📦 VAHAN cache hit for: ${cleanRegNo}`);
      return cached.data;
    }

    console.log(`🔍 Fetching VAHAN data for: ${cleanRegNo}`);

    try {
      // If no API key, return mock data for development
      if (!this.apiKey) {
        console.warn('⚠️ VAHAN_API_KEY not set, returning mock data');
        return this.getMockData(cleanRegNo);
      }

      // Call VAHAN API
      const response = await axios.get(`${this.baseUrl}/vehicle/${cleanRegNo}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'CarArth-VehicleVerification/1.0'
        },
        timeout: 10000
      });

      if (!response.data || !response.data.success) {
        throw new Error('VAHAN API returned unsuccessful response');
      }

      const vehicleData = this.parseVahanResponse(response.data, cleanRegNo);

      // Cache the result
      this.cache.set(cleanRegNo, {
        data: vehicleData,
        timestamp: Date.now()
      });

      return vehicleData;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Vehicle not found in VAHAN database');
        }
        if (error.response?.status === 429) {
          throw new Error('VAHAN API rate limit exceeded. Please try again later.');
        }
        console.error(`❌ VAHAN API error: ${error.message}`);
      }
      throw new Error(`Failed to fetch vehicle details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate Indian vehicle registration number format
   */
  private isValidRegistrationNumber(regNo: string): boolean {
    // Format: XX00XX0000 or XX00X0000 (state code, RTO code, series, number)
    const pattern = /^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$/;
    return pattern.test(regNo);
  }

  /**
   * Parse VAHAN API response to our format
   */
  private parseVahanResponse(apiData: any, regNo: string): VahanVehicleDetails {
    const raw = apiData.data || apiData;

    return {
      registrationNumber: regNo,
      make: raw.maker_model?.split(' ')[0] || raw.make || 'Unknown',
      model: raw.maker_model?.split(' ').slice(1).join(' ') || raw.model || 'Unknown',
      fuelType: this.normalizeFuelType(raw.fuel_type || raw.fuelType),
      registrationYear: this.extractYear(raw.registration_date || raw.registrationDate),
      registrationDate: raw.registration_date || raw.registrationDate || undefined,
      engineNumber: this.maskSensitiveData(raw.engine_number || raw.engineNumber),
      chassisNumber: this.maskSensitiveData(raw.chassis_number || raw.chassisNumber),
      color: raw.color || raw.colour || undefined,
      registeredState: raw.state_name || raw.state || this.extractStateFromRegNo(regNo),
      registeredCity: raw.office_name || raw.city || undefined,
      vehicleClass: raw.vehicle_class || raw.vehicleClass || 'Passenger',
      transmission: raw.transmission || undefined,
      ownerSerial: raw.owner_serial || raw.ownerSerial || 1
    };
  }

  /**
   * Normalize fuel type to standard values
   */
  private normalizeFuelType(fuelType?: string): string {
    if (!fuelType) return 'Petrol';

    const normalized = fuelType.toLowerCase();
    if (normalized.includes('diesel')) return 'Diesel';
    if (normalized.includes('petrol') || normalized.includes('gasoline')) return 'Petrol';
    if (normalized.includes('cng')) return 'CNG';
    if (normalized.includes('electric') || normalized.includes('ev')) return 'Electric';
    if (normalized.includes('hybrid')) return 'Hybrid';

    return fuelType;
  }

  /**
   * Extract year from registration date
   */
  private extractYear(dateStr?: string): number {
    if (!dateStr) return new Date().getFullYear() - 5; // Default to 5 years old

    const match = dateStr.match(/\d{4}/);
    return match ? parseInt(match[0]) : new Date().getFullYear() - 5;
  }

  /**
   * Extract state code from registration number
   */
  private extractStateFromRegNo(regNo: string): string {
    const stateCode = regNo.substring(0, 2);
    const stateMap: Record<string, string> = {
      'AP': 'Andhra Pradesh',
      'AR': 'Arunachal Pradesh',
      'AS': 'Assam',
      'BR': 'Bihar',
      'CG': 'Chhattisgarh',
      'GA': 'Goa',
      'GJ': 'Gujarat',
      'HR': 'Haryana',
      'HP': 'Himachal Pradesh',
      'JH': 'Jharkhand',
      'KA': 'Karnataka',
      'KL': 'Kerala',
      'MP': 'Madhya Pradesh',
      'MH': 'Maharashtra',
      'MN': 'Manipur',
      'ML': 'Meghalaya',
      'MZ': 'Mizoram',
      'NL': 'Nagaland',
      'OD': 'Odisha',
      'PB': 'Punjab',
      'RJ': 'Rajasthan',
      'SK': 'Sikkim',
      'TN': 'Tamil Nadu',
      'TS': 'Telangana',
      'TR': 'Tripura',
      'UP': 'Uttar Pradesh',
      'UK': 'Uttarakhand',
      'WB': 'West Bengal',
      'DL': 'Delhi',
      'AN': 'Andaman and Nicobar',
      'CH': 'Chandigarh',
      'DD': 'Daman and Diu',
      'DN': 'Dadra and Nagar Haveli',
      'JK': 'Jammu and Kashmir',
      'LA': 'Ladakh',
      'LD': 'Lakshadweep',
      'PY': 'Puducherry'
    };

    return stateMap[stateCode] || stateCode;
  }

  /**
   * Mask sensitive data (show only first 3 and last 3 characters)
   */
  private maskSensitiveData(data?: string): string | undefined {
    if (!data || data.length < 7) return data;
    return `${data.substring(0, 3)}${'*'.repeat(data.length - 6)}${data.substring(data.length - 3)}`;
  }

  /**
   * Get mock data for development/testing
   */
  private getMockData(regNo: string): VahanVehicleDetails {
    const stateCode = regNo.substring(0, 2);
    const state = this.extractStateFromRegNo(regNo);

    return {
      registrationNumber: regNo,
      make: 'Maruti Suzuki',
      model: 'Swift VDi',
      fuelType: 'Diesel',
      registrationYear: 2018,
      registrationDate: '2018-03-15',
      engineNumber: 'D13A***5678',
      chassisNumber: 'MA3***********234',
      color: 'Pearl White',
      registeredState: state,
      registeredCity: stateCode === 'TS' ? 'Hyderabad' : stateCode === 'KA' ? 'Bangalore' : 'Unknown',
      vehicleClass: 'Passenger',
      transmission: 'Manual',
      ownerSerial: 1
    };
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const vahanVehicleLookupService = new VahanVehicleLookupService();
