import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface Crawl4AIOptions {
  llmProvider?: 'openai' | 'gemini' | 'anthropic';
  llmModel?: string;
}

export interface Crawl4AIResponse {
  success: boolean;
  data?: {
    title: string;
    make: string;
    model: string;
    variant?: string;
    year: number;
    price_amount: number;
    price_currency: string;
    kms?: number;
    fuel?: string;
    transmission?: string;
    owner_count?: number;
    city: string;
    registration_state?: string;
    pincode?: string;
    description?: string;
    images?: string[];
    seller_name?: string;
    seller_phone?: string;
  };
  metadata?: {
    url: string;
    title: string;
    description: string;
    llm_provider: string;
    llm_model: string;
  };
  markdown?: string;
  error?: string;
}

export interface Crawl4AIBatchResponse {
  success: boolean;
  results?: Crawl4AIResponse[];
  total?: number;
  succeeded?: number;
  failed?: number;
  error?: string;
}

export class Crawl4AIService {
  private pythonPath: string;
  private servicePath: string;

  constructor() {
    this.pythonPath = 'python3';
    this.servicePath = path.join(__dirname, 'crawl4aiService.py');
  }

  async scrapeUrl(url: string, options: Crawl4AIOptions = {}): Promise<Crawl4AIResponse> {
    try {
      console.log(`🤖 Crawl4AI Scraping: ${url}`);
      
      const llmProvider = options.llmProvider || 'openai';
      const llmModel = options.llmModel || 'gpt-4o-mini';
      
      const result = await this.executePythonScript(
        'scrape',
        url,
        llmProvider,
        llmModel
      );
      
      if (result.success) {
        console.log(`✅ Crawl4AI Scrape successful for ${url}`);
      } else {
        console.error(`❌ Crawl4AI Scrape failed for ${url}:`, result.error);
      }
      
      return result;
      
    } catch (error) {
      console.error(`❌ Crawl4AI Scrape error for ${url}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown Crawl4AI error'
      };
    }
  }

  async batchScrape(urls: string[], options: Crawl4AIOptions = {}): Promise<Crawl4AIBatchResponse> {
    try {
      console.log(`🤖 Crawl4AI Batch Scraping: ${urls.length} URLs`);
      
      const llmProvider = options.llmProvider || 'openai';
      
      const result = await this.executePythonScript(
        'batch',
        JSON.stringify(urls),
        llmProvider
      );
      
      if (result.success) {
        console.log(`✅ Crawl4AI Batch Scrape completed: ${result.succeeded}/${result.total} succeeded`);
      } else {
        console.error(`❌ Crawl4AI Batch Scrape failed:`, result.error);
      }
      
      return result;
      
    } catch (error) {
      console.error(`❌ Crawl4AI Batch Scrape error:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown Crawl4AI batch error'
      };
    }
  }

  private executePythonScript(...args: string[]): Promise<any> {
    return new Promise((resolve, reject) => {
      const python = spawn(this.pythonPath, [this.servicePath, ...args]);
      
      let stdout = '';
      let stderr = '';
      
      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      python.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python script exited with code ${code}: ${stderr}`));
          return;
        }
        
        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse Python output: ${stdout}`));
        }
      });
      
      python.on('error', (error) => {
        reject(new Error(`Failed to spawn Python process: ${error.message}`));
      });
    });
  }

  getServiceInfo(): { pythonPath: string; servicePath: string } {
    return {
      pythonPath: this.pythonPath,
      servicePath: this.servicePath
    };
  }
}
