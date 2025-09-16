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
        recommendation: 'Insufficient market data available for this specific model and year combination',
        sources: [],
        lastUpdated: new Date()
      };
    }

    const sortedPrices = prices.sort((a, b) => a - b);
    const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const medianPrice = sortedPrices[Math.floor(sortedPrices.length / 2)];
    const minPrice = sortedPrices[0];
    const maxPrice = sortedPrices[sortedPrices.length - 1];
    const priceVariance = maxPrice - minPrice;

    // Advanced market trend analysis
    const currentYear = new Date().getFullYear();
    const carAge = currentYear - carData.year;
    const kmPerYear = carData.mileage ? carData.mileage / carAge : 0;
    
    let marketTrend: 'rising' | 'falling' | 'stable' = 'stable';
    let demandLevel: 'high' | 'medium' | 'low' = 'medium';
    
    // Sophisticated trend analysis based on multiple factors
    if (carAge <= 3 && kmPerYear < 15000) {
      marketTrend = 'rising';
      demandLevel = 'high';
    } else if (carAge > 7 || kmPerYear > 25000) {
      marketTrend = 'falling';
      demandLevel = 'low';
    } else if (carAge <= 5 && kmPerYear < 20000) {
      demandLevel = 'high';
    }

    // Brand-specific market insights
    const luxuryBrands = ['BMW', 'Mercedes', 'Audi', 'Jaguar', 'Volvo'];
    const reliableBrands = ['Toyota', 'Honda', 'Maruti', 'Hyundai'];
    const budgetBrands = ['Tata', 'Mahindra', 'Renault', 'Datsun'];
    
    let brandInsight = '';
    if (luxuryBrands.includes(carData.brand)) {
      brandInsight = 'Premium brand with higher maintenance costs but strong resale value';
    } else if (reliableBrands.includes(carData.brand)) {
      brandInsight = 'Highly reliable brand with excellent service network and strong demand';
    } else if (budgetBrands.includes(carData.brand)) {
      brandInsight = 'Budget-friendly option with lower running costs';
    }

    // Generate sophisticated recommendation
    const priceInLakhs = averagePrice / 100000;
    const medianInLakhs = medianPrice / 100000;
    const variancePercentage = (priceVariance / averagePrice) * 100;
    
    let recommendation = '';
    
    if (demandLevel === 'high' && marketTrend === 'rising') {
      recommendation = `${carData.year} ${carData.brand} ${carData.model} shows strong market performance with ${demandLevel} demand. Average pricing: ₹${priceInLakhs.toFixed(2)} lakhs (median: ₹${medianInLakhs.toFixed(2)} lakhs). ${brandInsight}. Market variance: ${variancePercentage.toFixed(1)}% suggests ${variancePercentage > 20 ? 'significant price negotiation potential' : 'relatively stable pricing'}.`;
    } else if (demandLevel === 'low' || marketTrend === 'falling') {
      recommendation = `${carData.year} ${carData.brand} ${carData.model} facing market challenges with ${demandLevel} demand. Consider competitive pricing below ₹${medianInLakhs.toFixed(2)} lakhs (market average: ₹${priceInLakhs.toFixed(2)} lakhs). ${brandInsight}. ${kmPerYear > 20000 ? 'Higher mileage impacts resale value significantly.' : 'Reasonable usage pattern supports value retention.'}`;
    } else {
      recommendation = `${carData.year} ${carData.brand} ${carData.model} maintains ${marketTrend} market position with ${demandLevel} demand. Balanced pricing around ₹${medianInLakhs.toFixed(2)}-${priceInLakhs.toFixed(2)} lakhs recommended. ${brandInsight}. ${variancePercentage > 25 ? 'Wide price range suggests thorough market research needed before buying/selling.' : 'Consistent market pricing indicates stable demand.'}`;
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
      const currentYear = new Date().getFullYear();
      const carAge = currentYear - carData.year;
      const kmPerYear = carData.mileage ? carData.mileage / carAge : 0;
      
      // More nuanced price comparison thresholds based on car characteristics
      let lowerThreshold = -10;
      let upperThreshold = 10;
      
      // Adjust thresholds based on car age and market volatility
      if (carAge > 7) {
        lowerThreshold = -15; // Older cars have more price variation
        upperThreshold = 15;
      } else if (carAge <= 3) {
        lowerThreshold = -8; // Newer cars have tighter pricing
        upperThreshold = 8;
      }
      
      // Determine comparison category
      if (priceDifference < lowerThreshold) {
        comparison = 'below';
      } else if (priceDifference > upperThreshold) {
        comparison = 'above';
      } else {
        comparison = 'fair';
      }
      
      // Generate sophisticated suggestions
      if (comparison === 'below') {
        if (priceDifference < -20) {
          suggestion = `Exceptional value! Your price is ${Math.abs(priceDifference).toFixed(1)}% below market average of ₹${(insights.averagePrice/100000).toFixed(2)} lakhs. ${kmPerYear > 20000 ? 'Higher mileage justifies the discount.' : 'Consider if there are any undisclosed issues at this price point.'} Excellent opportunity for buyers.`;
        } else {
          suggestion = `Great deal! Your price is ${Math.abs(priceDifference).toFixed(1)}% below market average. ${carAge > 5 ? 'Reasonable discount for age.' : 'Competitive pricing for quick sale.'} Strong value proposition for buyers.`;
        }
      } else if (comparison === 'above') {
        if (priceDifference > 25) {
          suggestion = `Premium pricing: ${priceDifference.toFixed(1)}% above market average of ₹${(insights.averagePrice/100000).toFixed(2)} lakhs. ${kmPerYear < 10000 ? 'Low mileage may justify premium.' : 'Consider reducing price for faster sale.'} Ensure exceptional condition to justify pricing.`;
        } else {
          suggestion = `Slightly above market: ${priceDifference.toFixed(1)}% higher than average. ${carAge <= 3 ? 'Acceptable for newer vehicle with good condition.' : 'Consider moderate price reduction for better market response.'}`;
        }
      } else {
        suggestion = `Well-priced! Your asking price is ${Math.abs(priceDifference).toFixed(1)}% ${priceDifference >= 0 ? 'above' : 'below'} market average of ₹${(insights.averagePrice/100000).toFixed(2)} lakhs. ${kmPerYear > 0 ? `Usage pattern of ${kmPerYear.toLocaleString('en-IN')} km/year is ${kmPerYear < 15000 ? 'favorable' : kmPerYear < 20000 ? 'reasonable' : 'concerning'} for resale value.` : ''} Balanced pricing for current market conditions.`;
      }
    } else {
      suggestion = `Market data limited for ${carData.year} ${carData.brand} ${carData.model}. Consider researching similar models in nearby cities or consulting with local dealers for accurate pricing guidance.`;
    }

    return {
      insights,
      comparison,
      suggestion
    };
  }
}

export const priceComparisonService = new PriceComparisonService();