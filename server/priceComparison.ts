import { webSearch } from "../shared/webSearch.js";

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
  private async searchCarPrices(carData: CarPriceData): Promise<any[]> {
    const searchQueries = [
      `${carData.year} ${carData.brand} ${carData.model} price ${carData.city} India used car`,
      `${carData.brand} ${carData.model} ${carData.year} price range India second hand`,
      `used ${carData.brand} ${carData.model} ${carData.year} cost India market price`,
      `${carData.brand} ${carData.model} ${carData.year} ${carData.fuelType} price India OLX CarDekho`
    ];

    const searchResults = [];
    
    for (const query of searchQueries) {
      try {
        const result = await webSearch(query);
        if (result && result.length > 0) {
          searchResults.push(...result);
        }
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error searching for: ${query}`, error);
      }
    }

    return searchResults;
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