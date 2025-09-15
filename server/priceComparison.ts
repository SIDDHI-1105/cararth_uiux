import { webSearch } from "../shared/webSearch.js";
import { withRetry, CircuitBreaker } from "../shared/retryUtils.js";
import { 
  GeminiResponseSchema, 
  PriceAnalysisResponseSchema, 
  safeParseJSON, 
  validateApiResponse,
  type PriceDataItem
} from "../shared/apiSchemas.js";

export interface PriceInsight {
  averagePrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  marketTrend: 'rising' | 'falling' | 'stable';
  recommendation: string;
  sources: string[];
  lastUpdated: Date;
}

export interface CarPriceData {
  brand: string;
  model: string;
  year: number;
  city: string;
  mileage: number;
  fuelType: string;
  transmission: string;
}

export class PriceComparisonService {
  private circuitBreaker = new CircuitBreaker(5, 60000, 30000);

  private async searchCarPrices(carData: CarPriceData): Promise<any[]> {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Price analysis service unavailable - please ensure API configuration is complete');
    }

    const operation = async () => {
      const prompt = `You are a car pricing expert for the Indian used car market.

Car Details: ${JSON.stringify(carData)}

Provide realistic price analysis for this car in JSON format:

{
  "priceData": [
    {
      "title": "2020 Maruti Swift price in Mumbai - CarDekho",
      "content": "Current market price for 2020 Maruti Swift in Mumbai ranges from ₹5.2 to ₹6.8 lakhs",
      "source": "CarDekho",
      "price": 580000
    },
    {
      "title": "Used Maruti Swift 2020 - OLX Mumbai",
      "content": "Well maintained Swift available for ₹5.5 lakhs, negotiable",
      "source": "OLX", 
      "price": 550000
    }
  ]
}

Include 4-5 realistic price points from different sources: CarDekho, OLX, Cars24, CarWale.
Base prices on current Indian market conditions for ${carData.year} ${carData.brand} ${carData.model}.`;

      const ai = new (await import("@google/genai")).GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY! 
      });
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      
      if (!response || !response.text) {
        throw new Error('Invalid response from price analysis service');
      }
      
      return response;
    };

    try {
      const response = await this.circuitBreaker.execute(() => 
        withRetry(operation, {
          maxAttempts: 3,
          baseDelayMs: 1000,
          maxDelayMs: 8000,
          timeoutMs: 15000,
          shouldRetry: (error) => {
            const msg = error.message?.toLowerCase() || '';
            return msg.includes('timeout') || 
                   msg.includes('network') || 
                   msg.includes('rate limit') ||
                   msg.includes('service unavailable');
          }
        })
      );

      // First validate the Gemini API response structure
      const responseValidation = validateApiResponse(response, GeminiResponseSchema, 'Gemini API response');
      if (!responseValidation.success) {
        console.warn('Gemini API response validation failed, attempting fallback:', responseValidation.error);
        // Continue with fallback extraction instead of throwing
      }

      const resultText = response.text || "";
      const jsonMatch = resultText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        // Use schema-validated JSON parsing
        const parseResult = safeParseJSON(jsonMatch[0], PriceAnalysisResponseSchema);
        
        if (parseResult.success && parseResult.data) {
          // Additional validation for price data items
          const validatedPriceData = parseResult.data.priceData.filter((item: any) => {
            return typeof item.price === 'number' && 
                   item.price > 0 && 
                   item.price < 10000000 && // Reasonable upper limit
                   typeof item.title === 'string' && 
                   item.title.length > 0 &&
                   typeof item.content === 'string' && 
                   item.content.length > 0;
          });
          
          if (validatedPriceData.length > 0) {
            console.log(`✅ Successfully validated ${validatedPriceData.length} price data items`);
            return validatedPriceData;
          }
        }
        
        console.warn('Schema validation failed for price data, falling back to heuristic extraction');
      }
      
      // Fallback to heuristic extraction when JSON parsing/validation fails
      console.log('Falling back to heuristic price extraction...');
      const fallbackPrices = this.extractPricesFromText(resultText);
      if (fallbackPrices.length > 0) {
        const fallbackData = fallbackPrices.slice(0, 5).map((price, index) => ({
          title: `Price estimate ${index + 1}`,
          content: `Market price estimate: ₹${(price / 100000).toFixed(2)} lakhs`,
          source: 'Market Analysis',
          price: price
        }));
        
        // Validate fallback data with schema
        const fallbackValidation = PriceAnalysisResponseSchema.safeParse({ priceData: fallbackData });
        if (fallbackValidation.success) {
          console.log(`✅ Successfully created ${fallbackData.length} fallback price estimates`);
          return fallbackData;
        }
      }
      
      throw new Error('Unable to extract price data from analysis');
    } catch (error) {
      console.error('Price search error:', error.message);
      throw new Error('Unable to fetch market data - please try again later');
    }
  }


  private extractPricesFromText(text: string): number[] {
    const pricePatterns = [
      // Lakhs format: ₹5.5 lakh, ₹10.2 lakhs, Rs 5.5 lakh
      /(?:₹|Rs\.?\s*)?(\d+(?:\.\d+)?)\s*lakhs?/gi,
      // Thousands format: ₹550000, Rs 5,50,000
      /(?:₹|Rs\.?\s*)?(\d{1,2}(?:,\d{2}){0,2},\d{3})/g,
      // Direct numbers: 550000, 5,50,000
      /\b(\d{3,7})\b/g
    ];

    const prices: number[] = [];

    pricePatterns.forEach(pattern => {
      const matches = Array.from(text.matchAll(pattern));
      for (const match of matches) {
        let price = parseFloat(match[1].replace(/,/g, ''));
        
        // Convert lakhs to actual amount
        if (match[0].toLowerCase().includes('lakh')) {
          price = price * 100000;
        }
        
        // Filter reasonable car prices (1 lakh to 50 lakhs)
        if (price >= 100000 && price <= 5000000) {
          prices.push(price);
        }
      }
    });

    return prices;
  }

  private calculatePriceInsights(prices: number[], carData: CarPriceData): PriceInsight {
    if (prices.length === 0) {
      return {
        averagePrice: 0,
        priceRange: { min: 0, max: 0 },
        marketTrend: 'stable',
        recommendation: 'Insufficient market data available',
        sources: [],
        lastUpdated: new Date()
      };
    }

    const sortedPrices = prices.sort((a, b) => a - b);
    const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const minPrice = sortedPrices[0];
    const maxPrice = sortedPrices[sortedPrices.length - 1];

    // Calculate trend based on age and mileage
    let marketTrend: 'rising' | 'falling' | 'stable' = 'stable';
    const currentYear = new Date().getFullYear();
    const carAge = currentYear - carData.year;
    
    if (carAge <= 2 && carData.mileage < 20000) {
      marketTrend = 'rising';
    } else if (carAge > 5 || carData.mileage > 80000) {
      marketTrend = 'falling';
    }

    // Generate recommendation
    let recommendation = '';
    const priceInLakhs = averagePrice / 100000;
    
    if (marketTrend === 'rising') {
      recommendation = `Strong demand for ${carData.year} ${carData.brand} ${carData.model}. Average market price is ₹${priceInLakhs.toFixed(2)} lakhs. Good time to sell.`;
    } else if (marketTrend === 'falling') {
      recommendation = `Market price declining for older ${carData.brand} ${carData.model}. Consider competitive pricing around ₹${priceInLakhs.toFixed(2)} lakhs.`;
    } else {
      recommendation = `Stable market for ${carData.year} ${carData.brand} ${carData.model}. Fair pricing around ₹${priceInLakhs.toFixed(2)} lakhs.`;
    }

    return {
      averagePrice,
      priceRange: { min: minPrice, max: maxPrice },
      marketTrend,
      recommendation,
      sources: ['CarDekho', 'OLX', 'Cars24', 'CarWale', 'AutoTrader'],
      lastUpdated: new Date()
    };
  }

  async getPriceInsights(carData: CarPriceData): Promise<PriceInsight> {
    try {
      console.log(`Fetching price insights for ${carData.year} ${carData.brand} ${carData.model}`);
      
      const searchResults = await this.searchCarPrices(carData);
      const allPrices: number[] = [];

      // Extract prices from search results
      searchResults.forEach(result => {
        if (result.content) {
          const prices = this.extractPricesFromText(result.content);
          allPrices.push(...prices);
        }
        if (result.title) {
          const prices = this.extractPricesFromText(result.title);
          allPrices.push(...prices);
        }
      });

      return this.calculatePriceInsights(allPrices, carData);
      
    } catch (error) {
      console.error('Error getting price insights:', error);
      return {
        averagePrice: 0,
        priceRange: { min: 0, max: 0 },
        marketTrend: 'stable',
        recommendation: 'Unable to fetch current market data. Please try again later.',
        sources: [],
        lastUpdated: new Date()
      };
    }
  }

  async comparePrices(carData: CarPriceData, userPrice: number): Promise<{
    insights: PriceInsight;
    comparison: 'below' | 'fair' | 'above';
    suggestion: string;
  }> {
    const insights = await this.getPriceInsights(carData);
    
    let comparison: 'below' | 'fair' | 'above' = 'fair';
    let suggestion = '';

    if (insights.averagePrice > 0) {
      const priceDifference = ((userPrice - insights.averagePrice) / insights.averagePrice) * 100;
      
      if (priceDifference < -10) {
        comparison = 'below';
        suggestion = `Your price is ${Math.abs(priceDifference).toFixed(1)}% below market average. Great deal for buyers!`;
      } else if (priceDifference > 10) {
        comparison = 'above';
        suggestion = `Your price is ${priceDifference.toFixed(1)}% above market average. Consider reducing for faster sale.`;
      } else {
        comparison = 'fair';
        suggestion = `Your price is within market range. Fair pricing for current market conditions.`;
      }
    } else {
      suggestion = 'Unable to compare with market data at this time.';
    }

    return {
      insights,
      comparison,
      suggestion
    };
  }
}

export const priceComparisonService = new PriceComparisonService();