import OpenAI from 'openai';

// Initialize OpenAI client with timeout and retry configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 20000, // 20 second timeout
  maxRetries: 0, // We handle retries manually for better control
});

export interface AssistantQuery {
  message: string;
  filters?: any;
  context?: string;
}

export interface AssistantResponse {
  message: string;
  suggestedFilters?: any;
  action?: 'search' | 'clarify' | 'recommend';
  confidence?: number;
}

export interface AssistantMetrics {
  totalRequests: number;
  successfulRequests: number;
  fallbackResponses: number;
  averageProcessingTime: number;
  averageConfidence: number;
  errorRate: number;
}

export class AssistantService {
  private metrics: AssistantMetrics;
  
  constructor() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      fallbackResponses: 0,
      averageProcessingTime: 0,
      averageConfidence: 0,
      errorRate: 0
    };
  }
  
  getMetrics(): AssistantMetrics {
    return { ...this.metrics };
  }

  private systemPrompt = `You are "The Assistant" for The Mobility Hub, India's premier car marketplace aggregator. You help users find the perfect used cars by understanding their natural language requests and converting them to precise search filters.

CAPABILITIES:
- Understand conversational queries about car preferences
- Extract search parameters from natural language
- Suggest relevant filters and options
- Provide personalized recommendations
- Ask clarifying questions when needed

AVAILABLE FILTERS (use exact format):
- brand: string (Maruti Suzuki, Hyundai, Tata, Honda, Toyota, Kia, Mahindra, etc.)
- model: string (specific car models)
- priceMin/priceMax: number (price in rupees, not lakhs)
- city: string (Hyderabad, Delhi, Mumbai, Bangalore, etc.)
- state: string (Telangana, Delhi, Maharashtra, Karnataka, etc.)
- fuelType: array of strings ["Petrol", "Diesel", "CNG", "Electric", "Hybrid"]
- transmission: array of strings ["Manual", "Automatic"]
- yearMin/yearMax: number (manufacturing year range)
- mileageMax: number (maximum kilometers driven)
- condition: array of strings ["Excellent", "Good", "Fair"]
- owners: array of numbers [1, 2, 3] (number of previous owners)
- hasImages: boolean
- hasWarranty: boolean

RESPONSE FORMAT:
Always respond with JSON containing:
{
  "message": "Your conversational response to the user",
  "suggestedFilters": { /* filters object if applicable */ },
  "action": "search|clarify|recommend",
  "confidence": 0.1-1.0
}

EXAMPLES:
User: "I need a family SUV under 15 lakhs"
Response: {
  "message": "Perfect! I'd recommend looking at family-friendly SUVs in your budget. Popular options include Hyundai Creta, Kia Seltos, and Tata Nexon. Would you prefer petrol or diesel?",
  "suggestedFilters": {
    "priceMax": 1500000,
    "condition": ["Excellent", "Good"],
    "hasImages": true
  },
  "action": "clarify",
  "confidence": 0.8
}

User: "Show me automatic Maruti cars in Hyderabad"
Response: {
  "message": "Great choice! Searching for Maruti Suzuki automatic cars in Hyderabad. You'll find models like Swift, Baleno, and Dzire with smooth automatic transmissions.",
  "suggestedFilters": {
    "brand": "Maruti Suzuki",
    "transmission": ["Automatic"],
    "city": "Hyderabad",
    "state": "Telangana",
    "hasImages": true
  },
  "action": "search",
  "confidence": 0.95
}

Always be helpful, conversational, and focused on understanding the user's car buying needs. When in doubt, ask clarifying questions to better understand their requirements.`;

  private async callOpenAIWithRetry(messages: any[], retries = 2): Promise<any> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const completion = await Promise.race([
          openai.chat.completions.create({
            model: 'gpt-4o',
            messages,
            max_tokens: 500,
            temperature: 0.7,
            response_format: { type: "json_object" }
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), 15000)
          )
        ]);
        return completion;
      } catch (error: any) {
        const isLastAttempt = attempt === retries;
        console.warn(`🔄 OpenAI API attempt ${attempt + 1} failed:`, error.message);
        
        if (isLastAttempt || !this.isRetryableError(error)) {
          throw error;
        }
        
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  private isRetryableError(error: any): boolean {
    // Retry on network errors, timeouts, and server errors (5xx)
    return error.message?.includes('timeout') ||
           error.status >= 500 ||
           error.code === 'ECONNRESET' ||
           error.code === 'ETIMEDOUT' ||
           error.message?.includes('overloaded');
  }

  private updateMetrics(startTime: number, confidence: number, success: boolean, fallbackUsed: boolean): void {
    const processingTime = Date.now() - startTime;
    this.metrics.totalRequests++;
    
    if (success && !fallbackUsed) {
      this.metrics.successfulRequests++;
    } else if (fallbackUsed) {
      this.metrics.fallbackResponses++;
    }
    
    // Update running averages
    const totalResponses = this.metrics.successfulRequests + this.metrics.fallbackResponses;
    if (totalResponses > 0) {
      this.metrics.averageProcessingTime = 
        (this.metrics.averageProcessingTime * (totalResponses - 1) + processingTime) / totalResponses;
      this.metrics.averageConfidence = 
        (this.metrics.averageConfidence * (totalResponses - 1) + confidence) / totalResponses;
    }
    
    // Calculate error rate (fallbacks count as errors)
    this.metrics.errorRate = ((this.metrics.fallbackResponses + (this.metrics.totalRequests - this.metrics.successfulRequests - this.metrics.fallbackResponses)) / this.metrics.totalRequests) * 100;
  }

  async processQuery(query: AssistantQuery): Promise<AssistantResponse> {
    const startTime = Date.now();
    let fallbackUsed = false;
    
    try {
      // Input validation
      if (!query.message || query.message.trim().length === 0) {
        throw new Error('Empty message provided');
      }

      const messages = [
        {
          role: 'system' as const,
          content: this.systemPrompt
        },
        {
          role: 'user' as const,
          content: `User query: "${query.message}"\n\nCurrent filters: ${JSON.stringify(query.filters || {})}\n\nContext: ${query.context || 'First interaction'}`
        }
      ];

      console.log(`🤖 Processing assistant query: ${query.message.substring(0, 50)}...`);
      
      const completion = await this.callOpenAIWithRetry(messages);
      
      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      let parsedResponse: AssistantResponse;
      try {
        parsedResponse = JSON.parse(response);
      } catch (parseError) {
        console.warn('🔄 JSON parse failed, using rule-based fallback');
        parsedResponse = this.getRuleBasedResponse(query);
        fallbackUsed = true;
      }
      
      // Validate and sanitize response
      const sanitizedResponse = this.sanitizeResponse(parsedResponse);
      
      // Track metrics - fallback usage counts as error
      this.updateMetrics(startTime, sanitizedResponse.confidence || 0.5, !fallbackUsed, fallbackUsed);
      
      console.log(`✅ Assistant response ${fallbackUsed ? '(fallback)' : ''}:`, sanitizedResponse.action, '-', sanitizedResponse.message.substring(0, 50) + '...');
      
      return sanitizedResponse;

    } catch (error: any) {
      console.error('❌ Assistant service error:', error.message);
      
      // Use rule-based fallback for better user experience
      const fallbackResponse = this.getRuleBasedResponse(query);
      
      // Track metrics - complete API failure counts as error with fallback
      this.updateMetrics(startTime, fallbackResponse.confidence || 0.7, false, true);
      
      console.log('🔄 Using rule-based fallback response');
      
      return fallbackResponse;
    }
  }

  private sanitizeResponse(response: any): AssistantResponse {
    return {
      message: response.message || "I'd be happy to help you find a car. What are you looking for?",
      suggestedFilters: response.suggestedFilters || {},
      action: ['search', 'clarify', 'recommend'].includes(response.action) ? response.action : 'clarify',
      confidence: typeof response.confidence === 'number' && response.confidence >= 0 && response.confidence <= 1 
        ? response.confidence 
        : 0.5
    };
  }

  private getRuleBasedResponse(query: AssistantQuery): AssistantResponse {
    const message = query.message.toLowerCase();
    
    // Extract filters using rule-based approach as fallback
    const extractedFilters = this.extractFiltersFromText(query.message);
    
    let responseMessage = "I can help you find the perfect car! ";
    let action: 'search' | 'clarify' | 'recommend' = 'clarify';
    
    if (Object.keys(extractedFilters).length > 2) { // More than just defaults
      responseMessage += "Based on your preferences, I've prepared a search. ";
      if (extractedFilters.brand) {
        responseMessage += `Looking for ${extractedFilters.brand} cars `;
      }
      if (extractedFilters.city) {
        responseMessage += `in ${extractedFilters.city} `;
      }
      responseMessage += "with your specified criteria.";
      action = 'search';
    } else {
      responseMessage += "Could you tell me more about what you're looking for? For example, your budget, preferred brand, or the city where you'd like to buy?";
    }
    
    return {
      message: responseMessage,
      suggestedFilters: extractedFilters,
      action,
      confidence: 0.7
    };
  }

  // Helper method to convert natural language to filter parameters (matches marketplace schema)
  private extractFiltersFromText(text: string): any {
    const filters: any = {};
    const lowerText = text.toLowerCase();

    // Brand extraction
    const brands = ['maruti suzuki', 'maruti', 'hyundai', 'tata', 'honda', 'toyota', 'kia', 'mahindra', 'renault', 'nissan', 'volkswagen', 'skoda', 'ford', 'chevrolet'];
    brands.forEach(brand => {
      if (lowerText.includes(brand)) {
        filters.brand = brand === 'maruti' ? 'Maruti Suzuki' : brand.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }
    });

    // Price extraction - convert lakhs to rupees for marketplace schema
    const priceMatches = text.match(/(\d+)\s*lakh/gi);
    if (priceMatches) {
      const prices = priceMatches.map(match => parseInt(match.replace(/[^\d]/g, '')) * 100000);
      if (lowerText.includes('under') || lowerText.includes('below')) {
        filters.priceMax = Math.max(...prices);
      } else if (lowerText.includes('above') || lowerText.includes('over')) {
        filters.priceMin = Math.min(...prices);
      }
    }

    // Fuel type extraction - use arrays to match marketplace schema
    const fuelTypes: string[] = [];
    if (lowerText.includes('petrol')) fuelTypes.push('Petrol');
    if (lowerText.includes('diesel')) fuelTypes.push('Diesel');
    if (lowerText.includes('cng')) fuelTypes.push('CNG');
    if (lowerText.includes('electric')) fuelTypes.push('Electric');
    if (fuelTypes.length > 0) filters.fuelType = fuelTypes;

    // Transmission extraction - use arrays to match marketplace schema
    const transmissions: string[] = [];
    if (lowerText.includes('automatic') || lowerText.includes('auto')) transmissions.push('Automatic');
    if (lowerText.includes('manual')) transmissions.push('Manual');
    if (transmissions.length > 0) filters.transmission = transmissions;

    // Year extraction - use yearMin/yearMax for marketplace schema
    const yearMatches = text.match(/(\d{4})/g);
    if (yearMatches) {
      const years = yearMatches.map(y => parseInt(y)).filter(y => y >= 2000 && y <= new Date().getFullYear());
      if (years.length > 0) {
        if (lowerText.includes('after') || lowerText.includes('from')) {
          filters.yearMin = Math.min(...years);
        } else if (lowerText.includes('before') || lowerText.includes('until')) {
          filters.yearMax = Math.max(...years);
        } else {
          filters.yearMin = Math.min(...years);
          filters.yearMax = Math.max(...years);
        }
      }
    }

    // City and State extraction
    const cityStateMap: { [key: string]: { city: string; state: string } } = {
      'hyderabad': { city: 'Hyderabad', state: 'Telangana' },
      'delhi': { city: 'Delhi', state: 'Delhi' },
      'mumbai': { city: 'Mumbai', state: 'Maharashtra' },
      'bangalore': { city: 'Bangalore', state: 'Karnataka' },
      'chennai': { city: 'Chennai', state: 'Tamil Nadu' },
      'pune': { city: 'Pune', state: 'Maharashtra' },
      'kolkata': { city: 'Kolkata', state: 'West Bengal' },
      'ahmedabad': { city: 'Ahmedabad', state: 'Gujarat' }
    };
    
    Object.keys(cityStateMap).forEach(city => {
      if (lowerText.includes(city)) {
        filters.city = cityStateMap[city].city;
        filters.state = cityStateMap[city].state;
      }
    });

    // Default preferences for better search results
    filters.hasImages = true;
    filters.condition = ['Excellent', 'Good'];

    return filters;
  }
}

export const assistantService = new AssistantService();