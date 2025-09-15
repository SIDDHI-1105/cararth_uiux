import { GoogleGenAI } from "@google/genai";
import { logError, ErrorCategory, createAppError } from './errorHandling.js';

export interface LocationData {
  city: string;
  state: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  isSupported: boolean;
  supportDate?: string; // For Delhi NCR: "2024-09-09"
  nearbyAreas: string[];
  marketZone: 'hyderabad' | 'delhi-ncr' | 'future';
}

export interface GeoSearchContext {
  location: LocationData;
  searchRadius: number;
  marketDensity: 'high' | 'medium' | 'low';
  popularAreas: string[];
  priceModifiers: {
    areaMultiplier: number;
    demandFactor: number;
  };
}

export class GeographicIntelligenceService {
  private ai: GoogleGenAI;

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required for geographic intelligence');
    }
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  /**
   * Enhanced location processing with Google Maps integration via Gemini
   */
  async enrichLocationContext(userLocation: string): Promise<LocationData> {
    try {
      const prompt = `You are a geographic intelligence system with access to Google Maps data for India's automotive markets.

User Location Input: "${userLocation}"

Using your knowledge of Indian geography and Google Maps data, provide detailed location information in JSON format:

{
  "city": "normalized city name",
  "state": "state name", 
  "coordinates": {
    "lat": latitude,
    "lng": longitude
  },
  "isSupported": boolean (true only for Hyderabad and Delhi NCR),
  "supportDate": "YYYY-MM-DD or null",
  "nearbyAreas": ["area1", "area2", "area3"],
  "marketZone": "hyderabad|delhi-ncr|future"
}

CRITICAL BUSINESS RULES:
- Hyderabad: isSupported=true, supportDate=null (live now)
- Delhi NCR (Gurgaon, Noida, Faridabad, Ghaziabad, New Delhi): isSupported=true, supportDate="2024-09-09"  
- All other cities: isSupported=false, marketZone="future"

Normalize location names (e.g., "Hyd" -> "Hyderabad", "Gurugram" -> "Gurgaon").
Include nearby important areas for car market density analysis.`;

      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const resultText = response.text || "";
      const jsonMatch = resultText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const locationData: LocationData = JSON.parse(jsonMatch[0]);
        
        // Validate critical business logic
        const currentDate = new Date();
        const supportDate = locationData.supportDate ? new Date(locationData.supportDate) : null;
        
        // Override isSupported based on business rules
        if (locationData.marketZone === 'hyderabad') {
          locationData.isSupported = true;
        } else if (locationData.marketZone === 'delhi-ncr') {
          locationData.isSupported = true; // Delhi NCR is now LIVE!
        } else {
          locationData.isSupported = false;
        }
        
        logError({ message: 'Location context enriched successfully', statusCode: 200 }, 'Geographic intelligence processing');
        return locationData;
      }
      
      // Fallback for parsing errors
      return this.getFallbackLocationData(userLocation);
      
    } catch (error) {
      console.error('🚫 Geographic intelligence error:', error);
      return this.getFallbackLocationData(userLocation);
    }
  }

  /**
   * Generate geographic search context for marketplace queries
   */
  async generateGeoSearchContext(locationData: LocationData, searchFilters: any): Promise<GeoSearchContext> {
    try {
      const prompt = `You are an automotive market intelligence system for India.

Location: ${locationData.city}, ${locationData.state}
Search Filters: ${JSON.stringify(searchFilters)}
Market Zone: ${locationData.marketZone}

Generate geographic search context in JSON:

{
  "location": ${JSON.stringify(locationData)},
  "searchRadius": number (km radius for search),
  "marketDensity": "high|medium|low",
  "popularAreas": ["area1", "area2", "area3"],
  "priceModifiers": {
    "areaMultiplier": number (0.8-1.3),
    "demandFactor": number (0.7-1.4)
  }
}

MARKET INTELLIGENCE:
- Hyderabad: High density, popular areas include Madhapur, Gachibowli, Jubilee Hills, Banjara Hills
- Delhi NCR: Very high density, includes Gurgaon, Noida, Dwarka, Lajpat Nagar
- Consider proximity to IT hubs, airports, metro connectivity for price modifiers
- Higher demand areas get demandFactor > 1.0, lower demand areas < 1.0`;

      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const resultText = response.text || "";
      const jsonMatch = resultText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const context: GeoSearchContext = JSON.parse(jsonMatch[0]);
        logError({ message: 'Geographic context generated successfully', statusCode: 200 }, 'Geographic context generation');
        return context;
      }

      // Fallback context
      return {
        location: locationData,
        searchRadius: locationData.marketZone === 'hyderabad' ? 50 : 75,
        marketDensity: 'medium',
        popularAreas: [],
        priceModifiers: {
          areaMultiplier: 1.0,
          demandFactor: 1.0
        }
      };

    } catch (error) {
      console.error('🚫 Geographic context generation error:', error);
      return {
        location: locationData,
        searchRadius: 50,
        marketDensity: 'medium',
        popularAreas: [],
        priceModifiers: {
          areaMultiplier: 1.0,
          demandFactor: 1.0
        }
      };
    }
  }

  /**
   * Enhance search URLs with geographic intelligence
   */
  generateLocationOptimizedUrls(baseUrl: string, geoContext: GeoSearchContext, filters: any): string[] {
    const { location } = geoContext;
    const urls: string[] = [];
    
    // Primary city URL
    urls.push(baseUrl.replace('{city}', location.city.toLowerCase().replace(' ', '-')));
    
    // Add nearby area URLs for better coverage
    geoContext.popularAreas.forEach(area => {
      const areaUrl = baseUrl.replace('{city}', `${area.toLowerCase().replace(' ', '-')}`);
      urls.push(areaUrl);
    });

    // State-level URL as fallback
    urls.push(baseUrl.replace('{city}', location.state.toLowerCase().replace(' ', '-')));
    
    console.log(`🌐 Generated ${urls.length} geo-optimized URLs for ${location.city}`);
    return urls;
  }

  /**
   * Validate if location is currently supported for authentic data
   */
  isLocationActiveForSearch(locationData: LocationData): boolean {
    if (!locationData.isSupported) {
      return false;
    }

    // Hyderabad is always active
    if (locationData.marketZone === 'hyderabad') {
      return true;
    }

    // Delhi NCR check against launch date
    if (locationData.marketZone === 'delhi-ncr' && locationData.supportDate) {
      const currentDate = new Date();
      const launchDate = new Date(locationData.supportDate);
      return currentDate >= launchDate;
    }

    return false;
  }

  private getFallbackLocationData(userLocation: string): LocationData {
    const normalizedInput = userLocation.toLowerCase().trim();
    
    // Basic recognition for critical cities
    if (normalizedInput.includes('hyderabad') || normalizedInput.includes('hyd') || 
        normalizedInput.includes('secunderabad') || normalizedInput.includes('telangana')) {
      return {
        city: 'Hyderabad',
        state: 'Telangana',
        coordinates: { lat: 17.3850, lng: 78.4867 },
        isSupported: true,
        nearbyAreas: ['Madhapur', 'Gachibowli', 'Jubilee Hills', 'Banjara Hills'],
        marketZone: 'hyderabad'
      };
    }

    if (normalizedInput.includes('delhi') || normalizedInput.includes('ncr') || 
        normalizedInput.includes('gurgaon') || normalizedInput.includes('noida') ||
        normalizedInput.includes('faridabad') || normalizedInput.includes('ghaziabad')) {
      return {
        city: 'New Delhi',
        state: 'Delhi',
        coordinates: { lat: 28.7041, lng: 77.1025 },
        isSupported: true,
        supportDate: '2024-09-09',
        nearbyAreas: ['Gurgaon', 'Noida', 'Dwarka', 'Lajpat Nagar'],
        marketZone: 'delhi-ncr'
      };
    }

    // Unsupported location
    return {
      city: userLocation,
      state: 'Unknown',
      coordinates: { lat: 0, lng: 0 },
      isSupported: false,
      nearbyAreas: [],
      marketZone: 'future'
    };
  }
}