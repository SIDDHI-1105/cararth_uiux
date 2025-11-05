/**
 * AETHER Hyperlocal Data Service
 * Loads and provides city-specific data for content generation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class HyperlocalService {
  constructor() {
    this.citiesPath = path.join(__dirname, '../../../../data/cities');
    this.cache = new Map();
  }

  /**
   * Load city data from JSON file
   */
  async getCityData(cityName) {
    const key = cityName.toLowerCase();
    
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    const filepath = path.join(this.citiesPath, `${key}.json`);
    
    if (!fs.existsSync(filepath)) {
      console.log(`[Hyperlocal] City data not found for ${cityName}, using fallback`);
      return this.getFallbackData(cityName);
    }

    try {
      const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
      this.cache.set(key, data);
      return data;
    } catch (error) {
      console.error(`[Hyperlocal] Error loading city data for ${cityName}:`, error);
      return this.getFallbackData(cityName);
    }
  }

  /**
   * Fallback data for cities without JSON files
   */
  getFallbackData(cityName) {
    return {
      city: cityName,
      neighborhoods: [],
      rtoAddresses: [],
      priceBands: {
        budget: [2, 6],
        midRange: [6, 12],
        premium: [12, 25],
        luxury: [25, 100]
      },
      emiRanges: {
        tenure36: [5500, 35000],
        tenure48: [4500, 28000],
        tenure60: [3800, 23000]
      },
      popularDealers: [],
      marketInsights: {
        topBrands: ['Maruti Suzuki', 'Hyundai', 'Honda'],
        avgPrice: 700000,
        avgMileage: 45000,
        demandScore: 0.75
      }
    };
  }

  /**
   * Get random neighborhoods for content variety
   */
  getRandomNeighborhoods(cityName, count = 5) {
    return this.getCityData(cityName).then(data => {
      if (data.neighborhoods.length === 0) return [];
      const shuffled = [...data.neighborhoods].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count);
    });
  }

  /**
   * Get RTO info for legal authenticity
   */
  async getRTOInfo(cityName) {
    const data = await this.getCityData(cityName);
    return data.rtoAddresses;
  }

  /**
   * Get price band for a given range
   */
  async getPriceBand(cityName, bandType = 'midRange') {
    const data = await this.getCityData(cityName);
    return data.priceBands[bandType] || [6, 12];
  }

  /**
   * Calculate EMI for a price
   */
  calculateEMI(price, tenure = 60, interestRate = 10.5) {
    const principal = price;
    const monthlyRate = interestRate / 12 / 100;
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / 
                  (Math.pow(1 + monthlyRate, tenure) - 1);
    return Math.round(emi);
  }

  /**
   * Get popular dealers for trust signals
   */
  async getPopularDealers(cityName, count = 3) {
    const data = await this.getCityData(cityName);
    return data.popularDealers.slice(0, count);
  }

  /**
   * Get market insights for data-driven content
   */
  async getMarketInsights(cityName) {
    const data = await this.getCityData(cityName);
    return data.marketInsights || {};
  }

  /**
   * Generate FAQ data injected with hyperlocal context
   */
  async generateLocalizedFAQs(cityName, topic) {
    const data = await this.getCityData(cityName);
    const insights = data.marketInsights || {};
    
    // Topic-specific FAQs with city data
    const faqs = [
      {
        question: `What is the average price of used cars in ${cityName}?`,
        answer: `The average price of used cars in ${cityName} is approximately ₹${Math.round(insights.avgPrice / 100000)} lakh. Prices vary based on brand, model, year, and condition. Budget cars (₹${data.priceBands.budget[0]}-${data.priceBands.budget[1]}L) are popular, while premium options range from ₹${data.priceBands.premium[0]}-${data.priceBands.premium[1]}L.`
      },
      {
        question: `Which RTO offices serve ${cityName} for used car registration?`,
        answer: `${cityName} has ${data.rtoAddresses.length} main RTO offices: ${data.rtoAddresses.map(r => r.code).join(', ')}. The most central is ${data.rtoAddresses[0]?.code} at ${data.rtoAddresses[0]?.address}.`
      },
      {
        question: `What are typical EMI rates for used cars in ${cityName}?`,
        answer: `For a ₹${Math.round(insights.avgPrice / 100000)} lakh used car in ${cityName}, expect EMIs of ₹${this.calculateEMI(insights.avgPrice, 36, 10.5).toLocaleString('en-IN')} (3 years), ₹${this.calculateEMI(insights.avgPrice, 48, 10.5).toLocaleString('en-IN')} (4 years), or ₹${this.calculateEMI(insights.avgPrice, 60, 10.5).toLocaleString('en-IN')} (5 years) at 10.5% interest.`
      },
      {
        question: `Which used car brands are most popular in ${cityName}?`,
        answer: `${insights.topBrands?.slice(0, 5).join(', ')} are the top-selling used car brands in ${cityName}. ${insights.topBrands?.[0]} leads due to strong resale value and service network.`
      }
    ];

    return faqs;
  }

  /**
   * Generate internal links based on city and topic
   */
  async generateInternalLinks(cityName, topic) {
    const links = [];
    const citySlug = cityName.toLowerCase().replace(/\s+/g, '-');
    
    // City landing page
    links.push({
      href: `/used-cars-${citySlug}`,
      anchor: `Used Cars in ${cityName}`,
      rel: 'related'
    });

    // Search with filters
    const data = await this.getCityData(cityName);
    if (data.priceBands.budget) {
      links.push({
        href: `/used-cars/${citySlug}?priceMax=${data.priceBands.budget[1] * 100000}`,
        anchor: `Cars under ₹${data.priceBands.budget[1]}L in ${cityName}`
      });
    }

    // Popular brands
    if (data.marketInsights?.topBrands) {
      const topBrand = data.marketInsights.topBrands[0];
      links.push({
        href: `/used-cars/${citySlug}?brand=${topBrand.replace(/\s+/g, '+')}`,
        anchor: `${topBrand} Cars in ${cityName}`
      });
    }

    return links;
  }
}

export const hyperlocalService = new HyperlocalService();
