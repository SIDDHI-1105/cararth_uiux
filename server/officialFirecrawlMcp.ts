import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { MarketplaceListing } from './marketplaceAggregator.js';

export interface OfficialMcpOptions {
  apiKey: string;
  baseUrl?: string;
}

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number | string;
  method: string;
  params?: any;
}

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number | string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface McpExtractionResult {
  success: boolean;
  data?: any;
  error?: string;
  listings?: MarketplaceListing[];
}

/**
 * Complete Firecrawl MCP Client Implementation
 * Uses JSON-RPC 2.0 protocol over STDIO transport with npx firecrawl-mcp process
 */
export class OfficialFirecrawlMcpService extends EventEmitter {
  private apiKey: string;
  private baseUrl?: string;
  private mcpProcess: ChildProcess | null = null;
  private isReady: boolean = false;
  private isConnecting: boolean = false;
  private requestIdCounter: number = 1;
  private pendingRequests: Map<string | number, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }> = new Map();
  private messageBuffer: string = '';

  constructor(options: OfficialMcpOptions) {
    super();
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl;
  }

  /**
   * Initialize the official MCP server process with JSON-RPC transport
   */
  async initialize(): Promise<void> {
    if (this.isReady || this.isConnecting) return;
    
    this.isConnecting = true;
    
    try {
      console.log('🚀 Starting Official Firecrawl MCP Server...');
      
      // Spawn the official MCP server process
      this.mcpProcess = spawn('npx', ['-y', 'firecrawl-mcp'], {
        env: {
          ...process.env,
          FIRECRAWL_API_KEY: this.apiKey,
          ...(this.baseUrl && { FIRECRAWL_BASE_URL: this.baseUrl })
        },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      if (!this.mcpProcess.stdout || !this.mcpProcess.stdin) {
        throw new Error('Failed to establish STDIO pipes with MCP process');
      }

      // Set up message handling for JSON-RPC over STDIO
      this.mcpProcess.stdout.on('data', (data: Buffer) => {
        this.handleIncomingData(data.toString());
      });

      this.mcpProcess.stderr?.on('data', (data: Buffer) => {
        console.log('MCP Server Log:', data.toString());
      });

      this.mcpProcess.on('error', (error) => {
        console.error('❌ MCP Process Error:', error);
        this.isReady = false;
        this.isConnecting = false;
        this.emit('error', error);
      });

      this.mcpProcess.on('exit', (code) => {
        console.log(`🔌 MCP Process exited with code: ${code}`);
        this.isReady = false;
        this.isConnecting = false;
        this.emit('disconnect');
      });

      // Send initialization request
      await this.sendJsonRpcRequest('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {
          roots: {
            listChanged: true
          },
          sampling: {}
        },
        clientInfo: {
          name: 'CarArth-MCP-Client',
          version: '1.0.0'
        }
      });

      this.isReady = true;
      this.isConnecting = false;
      console.log('✅ Official Firecrawl MCP Server connected successfully');
      
    } catch (error) {
      this.isConnecting = false;
      console.error('❌ Failed to initialize Official MCP:', error);
      throw error;
    }
  }

  /**
   * Handle incoming JSON-RPC data from MCP server
   */
  private handleIncomingData(data: string): void {
    this.messageBuffer += data;
    
    // Split by newlines to handle multiple messages
    const lines = this.messageBuffer.split('\n');
    this.messageBuffer = lines.pop() || ''; // Keep incomplete line in buffer
    
    for (const line of lines) {
      if (line.trim()) {
        try {
          const response: JsonRpcResponse = JSON.parse(line);
          this.handleJsonRpcResponse(response);
        } catch (error) {
          console.error('❌ Failed to parse JSON-RPC response:', error, 'Line:', line);
        }
      }
    }
  }

  /**
   * Handle JSON-RPC response from MCP server
   */
  private handleJsonRpcResponse(response: JsonRpcResponse): void {
    const { id } = response;
    const pending = this.pendingRequests.get(id);
    
    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingRequests.delete(id);
      
      if (response.error) {
        pending.reject(new Error(`MCP Error: ${response.error.message}`));
      } else {
        pending.resolve(response.result);
      }
    }
  }

  /**
   * Send JSON-RPC request to MCP server
   */
  private async sendJsonRpcRequest(method: string, params?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.mcpProcess?.stdin) {
        reject(new Error('MCP process not ready'));
        return;
      }

      const id = this.requestIdCounter++;
      const request: JsonRpcRequest = {
        jsonrpc: '2.0',
        id,
        method,
        params
      };

      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`MCP request timeout: ${method}`));
      }, 30000);

      this.pendingRequests.set(id, { resolve, reject, timeout });

      const message = JSON.stringify(request) + '\n';
      this.mcpProcess.stdin.write(message);
    });
  }

  /**
   * Extract car listings using official MCP protocol
   */
  async extractCarListings(url: string, prompt: string): Promise<McpExtractionResult> {
    if (!this.isReady) {
      await this.initialize();
    }

    try {
      console.log(`🔗 Official MCP extraction: ${url}`);
      
      // Use the official MCP firecrawl_extract tool
      const result = await this.sendJsonRpcRequest('tools/call', {
        name: 'firecrawl_extract',
        arguments: {
          url,
          schema: this.getCarListingSchema(),
          prompt,
          timeout: 60000,
          waitFor: 8000
        }
      });

      console.log(`✅ MCP extraction completed for: ${url}`);
      
      // Parse and validate the response
      if (result?.content) {
        const extractedData = typeof result.content === 'string' 
          ? JSON.parse(result.content) 
          : result.content;
        
        if (extractedData?.listings && Array.isArray(extractedData.listings)) {
          return {
            success: true,
            data: extractedData,
            listings: extractedData.listings
          };
        }
      }

      return {
        success: false,
        error: 'No listings found in MCP response'
      };
      
    } catch (error) {
      console.error(`❌ Official MCP extraction failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'MCP extraction error'
      };
    }
  }

  /**
   * Scrape a single page using MCP firecrawl_scrape tool
   */
  async scrapePage(url: string): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!this.isReady) {
      await this.initialize();
    }

    try {
      const result = await this.sendJsonRpcRequest('tools/call', {
        name: 'firecrawl_scrape',
        arguments: {
          url,
          formats: ['markdown'],
          timeout: 30000
        }
      });

      return {
        success: true,
        data: result
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Scraping failed'
      };
    }
  }

  /**
   * Get the car listing extraction schema for MCP
   */
  private getCarListingSchema() {
    return {
      type: "object",
      properties: {
        listings: {
          type: "array", 
          description: "Array of car listings found on the page",
          items: {
            type: "object",
            properties: {
              title: { type: "string", description: "Car title or name" },
              brand: { type: "string", description: "Car brand/manufacturer" },
              model: { type: "string", description: "Car model" },
              year: { type: "number", description: "Manufacturing year" },
              price: { type: "number", description: "Price in Indian Rupees" },
              mileage: { type: "number", description: "Mileage in kilometers" },
              fuelType: { type: "string", description: "Fuel type" },
              transmission: { type: "string", description: "Transmission type" },
              location: { type: "string", description: "Location or city" },
              condition: { type: "string", description: "Car condition" },
              sellerType: { type: "string", description: "Seller type" },
              url: { type: "string", description: "Direct listing URL" },
              images: { 
                type: "array", 
                description: "Array of image URLs showing the actual car",
                items: { type: "string" }
              }
            },
            required: ["title", "brand", "model", "year", "price"]
          }
        }
      },
      required: ["listings"]
    };
  }

  /**
   * Check if MCP service is available and ready
   */
  getStatus() {
    return {
      ready: this.isReady,
      type: 'official',
      version: '1.0.0',
      features: [
        'Enhanced LLM context sharing',
        'Official Firecrawl support', 
        'JSON-RPC protocol compliance',
        'Automatic retries and error handling'
      ]
    };
  }

  /**
   * Check if MCP service is available and ready
   */
  getStatus() {
    return {
      ready: this.isReady,
      connecting: this.isConnecting,
      hasProcess: !!this.mcpProcess,
      type: 'official-jsonrpc',
      version: '2.0.0',
      features: [
        'JSON-RPC 2.0 protocol',
        'STDIO transport',
        'Process lifecycle management', 
        'Official npx firecrawl-mcp server',
        'firecrawl_scrape tool',
        'firecrawl_extract tool',
        'Structured data extraction',
        'Timeout and error handling'
      ]
    };
  }

  /**
   * Cleanup MCP resources
   */
  async cleanup(): Promise<void> {
    console.log('🔌 Cleaning up Official MCP Service...');
    
    // Clear all pending requests
    for (const [id, pending] of this.pendingRequests) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('MCP service shutting down'));
    }
    this.pendingRequests.clear();

    // Terminate the MCP process
    if (this.mcpProcess) {
      this.mcpProcess.kill('SIGTERM');
      
      // Give it time to gracefully shutdown, then force kill
      setTimeout(() => {
        if (this.mcpProcess && !this.mcpProcess.killed) {
          this.mcpProcess.kill('SIGKILL');
        }
      }, 5000);
      
      this.mcpProcess = null;
    }
    
    this.isReady = false;
    this.isConnecting = false;
    console.log('✅ Official MCP Service cleaned up');
  }
}