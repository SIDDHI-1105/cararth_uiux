import { EventSource } from 'eventsource';

export interface FirecrawlMcpOptions {
  apiKey: string;
  baseUrl?: string;
}

export interface FirecrawlMcpRequest {
  method: 'scrape' | 'extract' | 'crawl';
  url: string;
  options?: {
    formats?: string[];
    extract?: {
      prompt?: string;
      schema?: any;
    };
    onlyMainContent?: boolean;
    timeout?: number;
    waitFor?: number;
  };
}

export interface FirecrawlMcpResponse {
  success: boolean;
  data?: any;
  markdown?: string;
  error?: string;
  metadata?: any;
}

export class FirecrawlMcpService {
  private eventSource: EventSource | null = null;
  private apiKey: string;
  private baseUrl: string;
  private connected: boolean = false;
  private responseCallbacks: Map<string, (response: any) => void> = new Map();

  constructor(options: FirecrawlMcpOptions) {
    this.apiKey = options.apiKey;
    // SECURITY FIX: Remove API key from URL - use only Authorization header
    this.baseUrl = options.baseUrl || `https://mcp.firecrawl.dev/v2`;
  }


  async connect(): Promise<void> {
    if (this.connected) return;
    
    try {
      console.log('🔗 Connecting to Firecrawl MCP Server...');
      this.eventSource = new EventSource(`${this.baseUrl}/sse`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      this.eventSource.onopen = () => {
        this.connected = true;
        console.log('✅ Firecrawl MCP Service connected successfully');
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const requestId = data.requestId;
          if (requestId && this.responseCallbacks.has(requestId)) {
            const callback = this.responseCallbacks.get(requestId);
            if (callback) {
              callback(data);
              this.responseCallbacks.delete(requestId);
            }
          }
        } catch (error) {
          console.error('MCP message parse error:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('MCP connection error:', error);
        this.connected = false;
      };

      // Wait for connection
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Connection timeout')), 10000);
        this.eventSource!.onopen = () => {
          clearTimeout(timeout);
          this.connected = true;
          resolve(undefined);
        };
      });
      
    } catch (error) {
      console.error('❌ Failed to connect to Firecrawl MCP:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connected || !this.eventSource) return;
    
    try {
      this.eventSource.close();
      this.eventSource = null;
      this.connected = false;
      this.responseCallbacks.clear();
      console.log('🔌 Firecrawl MCP Service disconnected');
    } catch (error) {
      console.error('❌ Failed to disconnect from Firecrawl MCP:', error);
    }
  }

  async scrapeUrl(url: string, options: FirecrawlMcpRequest['options'] = {}): Promise<FirecrawlMcpResponse> {
    await this.connect();
    
    try {
      console.log(`🕸️ MCP Scraping: ${url}`);
      
      const request: FirecrawlMcpRequest = {
        method: 'scrape',
        url,
        options
      };

      // Send request through MCP protocol
      const response = await this.sendMcpRequest(request);
      
      if (response.success) {
        console.log(`✅ MCP Scrape successful for ${url}`);
        return response;
      } else {
        console.error(`❌ MCP Scrape failed for ${url}:`, response.error);
        return response;
      }
      
    } catch (error) {
      console.error(`❌ MCP Scrape error for ${url}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown MCP error'
      };
    }
  }

  async extractWithLLM(url: string, prompt: string, schema?: any): Promise<FirecrawlMcpResponse> {
    await this.connect();
    
    try {
      console.log(`🧠 MCP LLM Extraction: ${url}`);
      
      const request: FirecrawlMcpRequest = {
        method: 'extract',
        url,
        options: {
          formats: ['extract'],
          extract: {
            prompt,
            schema
          }
        }
      };

      const response = await this.sendMcpRequest(request);
      
      if (response.success) {
        console.log(`✅ MCP LLM Extract successful for ${url}`);
        return response;
      } else {
        console.error(`❌ MCP LLM Extract failed for ${url}:`, response.error);
        return response;
      }
      
    } catch (error) {
      console.error(`❌ MCP LLM Extract error for ${url}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown MCP LLM error'
      };
    }
  }

  private async sendMcpRequest(request: FirecrawlMcpRequest): Promise<FirecrawlMcpResponse> {
    return new Promise((resolve, reject) => {
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const timeout = setTimeout(() => {
        this.responseCallbacks.delete(requestId);
        resolve({
          success: false,
          error: 'MCP request timeout'
        });
      }, 30000); // 30 second timeout

      // Set up response callback
      this.responseCallbacks.set(requestId, (response: any) => {
        clearTimeout(timeout);
        if (response.success) {
          resolve({
            success: true,
            data: response.data,
            markdown: response.markdown,
            metadata: response.metadata
          });
        } else {
          resolve({
            success: false,
            error: response.error || 'MCP request failed'
          });
        }
      });

      // Send request through HTTP POST to MCP endpoint
      const requestPayload = { ...request, requestId };
      
      fetch(`${this.baseUrl}/execute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestPayload)
      }).catch((error: any) => {
        clearTimeout(timeout);
        this.responseCallbacks.delete(requestId);
        resolve({
          success: false,
          error: error.message || 'Failed to send MCP request'
        });
      });
    });
  }

  // Fallback to direct API if MCP fails
  async fallbackToDirectAPI(url: string, options: any = {}): Promise<FirecrawlMcpResponse> {
    try {
      console.log(`🔄 Falling back to direct Firecrawl API for: ${url}`);
      
      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url,
          ...options
        })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          data: data.data,
          markdown: data.markdown,
          metadata: data.metadata
        };
      } else {
        const error = await response.text();
        return {
          success: false,
          error: `Direct API failed: ${error}`
        };
      }
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Direct API error'
      };
    }
  }

  getConnectionStatus(): { connected: boolean; url: string } {
    return {
      connected: this.connected,
      url: this.baseUrl
    };
  }
}