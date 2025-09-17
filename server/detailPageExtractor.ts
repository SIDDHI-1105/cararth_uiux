import * as cheerio from 'cheerio';
import { imageAssetService, ImageProcessingResult } from './imageAssetService.js';

export interface ExtractionResult {
  success: boolean;
  images: ExtractedImage[];
  metadata?: PageMetadata;
  errors?: string[];
}

export interface ExtractedImage {
  url: string;
  selector: string;
  context: string; // 'jsonld', 'opengraph', 'schema', 'gallery'
  alt?: string;
  title?: string;
  width?: number;
  height?: number;
  position?: number; // Position in image gallery
}

export interface PageMetadata {
  title?: string;
  description?: string;
  price?: string;
  currency?: string;
  brand?: string;
  model?: string;
  year?: number;
  mileage?: number;
  location?: string;
}

interface PortalConfig {
  name: string;
  selectors: {
    jsonld?: string[];
    gallery?: string[];
    heroImage?: string[];
    thumbnails?: string[];
  };
  imageUrlPatterns?: RegExp[];
  excludePatterns?: RegExp[];
}

/**
 * PERMANENT FIX for image authenticity - deterministic extraction from detail pages
 * Replaces AI-based guessing with structured data parsing from known sources
 */
export class DetailPageExtractor {
  private portalConfigs: Map<string, PortalConfig>;

  constructor() {
    this.portalConfigs = new Map();
    this.initializePortalConfigs();
  }

  /**
   * Extract images and metadata from a listing detail page
   */
  async extractFromUrl(params: {
    url: string;
    listingId: string;
    portal: string;
    processImages?: boolean; // Whether to immediately process through ImageAssetService
  }): Promise<ExtractionResult & { processedImages?: ImageProcessingResult[] }> {
    try {
      console.log(`🔍 Extracting from detail page: ${params.url}`);

      // Fetch the page with proper headers
      const html = await this.fetchPage(params.url);
      if (!html) {
        return {
          success: false,
          images: [],
          errors: ['Failed to fetch page content'],
        };
      }

      // Parse HTML with Cheerio
      const $ = cheerio.load(html);

      // Extract images using multiple methods
      const images: ExtractedImage[] = [];
      const metadata: PageMetadata = {};

      // 1. Extract from JSON-LD structured data (highest priority)
      const jsonldImages = this.extractFromJsonLD($);
      images.push(...jsonldImages);

      // 2. Extract from Open Graph meta tags
      const opengraphImages = this.extractFromOpenGraph($);
      images.push(...opengraphImages);

      // 3. Extract from portal-specific selectors
      const portalImages = await this.extractFromPortalSelectors($, params.portal);
      images.push(...portalImages);

      // 4. Extract basic metadata
      this.extractMetadata($, metadata);

      // Remove duplicates and apply filters
      const filteredImages = this.filterAndDeduplicateImages(images);

      console.log(`📸 Extracted ${filteredImages.length} unique images from ${params.url}`);

      // Optionally process images through ImageAssetService
      let processedImages: ImageProcessingResult[] = [];
      if (params.processImages) {
        console.log(`🔄 Processing ${filteredImages.length} images through ImageAssetService...`);
        
        processedImages = await Promise.all(
          filteredImages.map(async (img) => {
            return await imageAssetService.processImageFromUrl({
              listingId: params.listingId,
              portal: params.portal,
              pageUrl: params.url,
              imageUrl: img.url,
              selector: `${img.context}:${img.selector}`,
            });
          })
        );

        const passedCount = processedImages.filter(r => r.success && r.passedGate).length;
        console.log(`✅ ${passedCount}/${processedImages.length} images passed authenticity gate`);
      }

      return {
        success: true,
        images: filteredImages,
        metadata,
        processedImages: processedImages.length > 0 ? processedImages : undefined,
      };

    } catch (error) {
      console.error(`❌ Error extracting from ${params.url}:`, error);
      return {
        success: false,
        images: [],
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Fetch page content with proper headers and error handling
   */
  private async fetchPage(url: string): Promise<string | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`HTTP ${response.status} for ${url}`);
        return null;
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/html')) {
        console.error(`Non-HTML content type: ${contentType}`);
        return null;
      }

      return await response.text();

    } catch (error) {
      console.error(`Failed to fetch ${url}:`, error);
      return null;
    }
  }

  /**
   * Extract images from JSON-LD structured data
   */
  private extractFromJsonLD($: cheerio.CheerioAPI): ExtractedImage[] {
    const images: ExtractedImage[] = [];

    $('script[type="application/ld+json"]').each((_: number, element: any) => {
      try {
        const jsonText = $(element).text().trim();
        const data = JSON.parse(jsonText);

        // Handle both single objects and arrays
        const items = Array.isArray(data) ? data : [data];

        items.forEach((item, index) => {
          this.extractImagesFromJsonLDItem(item, images, `jsonld[${index}]`);
        });

      } catch (error) {
        console.warn('Failed to parse JSON-LD:', error);
      }
    });

    return images;
  }

  /**
   * Recursively extract images from JSON-LD item
   */
  private extractImagesFromJsonLDItem(
    item: any, 
    images: ExtractedImage[], 
    selector: string
  ): void {
    if (!item || typeof item !== 'object') return;

    // Common image properties in JSON-LD
    const imageProps = ['image', 'images', 'photo', 'photos', 'thumbnail', 'logo'];
    
    imageProps.forEach(prop => {
      if (item[prop]) {
        const imageData = item[prop];
        
        if (typeof imageData === 'string') {
          images.push({
            url: imageData,
            selector: `${selector}.${prop}`,
            context: 'jsonld',
          });
        } else if (Array.isArray(imageData)) {
          imageData.forEach((img, idx) => {
            if (typeof img === 'string') {
              images.push({
                url: img,
                selector: `${selector}.${prop}[${idx}]`,
                context: 'jsonld',
                position: idx,
              });
            } else if (img && img.url) {
              images.push({
                url: img.url,
                selector: `${selector}.${prop}[${idx}].url`,
                context: 'jsonld',
                width: img.width,
                height: img.height,
                position: idx,
              });
            }
          });
        } else if (imageData && imageData.url) {
          images.push({
            url: imageData.url,
            selector: `${selector}.${prop}.url`,
            context: 'jsonld',
            width: imageData.width,
            height: imageData.height,
          });
        }
      }
    });

    // Recursively check nested objects
    Object.keys(item).forEach(key => {
      if (typeof item[key] === 'object' && item[key] !== null) {
        this.extractImagesFromJsonLDItem(item[key], images, `${selector}.${key}`);
      }
    });
  }

  /**
   * Extract images from Open Graph and Twitter meta tags
   */
  private extractFromOpenGraph($: cheerio.CheerioAPI): ExtractedImage[] {
    const images: ExtractedImage[] = [];

    // Open Graph image tags
    $('meta[property^="og:image"], meta[name^="og:image"]').each((index: number, element: any) => {
      const content = $(element).attr('content');
      const property = $(element).attr('property') || $(element).attr('name');
      
      if (content && this.isValidImageUrl(content)) {
        images.push({
          url: content,
          selector: `meta[property="${property}"]`,
          context: 'opengraph',
          position: index,
        });
      }
    });

    // Twitter Card images
    $('meta[name^="twitter:image"]').each((index: number, element: any) => {
      const content = $(element).attr('content');
      const name = $(element).attr('name');
      
      if (content && this.isValidImageUrl(content)) {
        images.push({
          url: content,
          selector: `meta[name="${name}"]`,
          context: 'opengraph',
          position: index,
        });
      }
    });

    return images;
  }

  /**
   * Extract images using portal-specific selectors
   */
  private async extractFromPortalSelectors(
    $: cheerio.CheerioAPI, 
    portal: string
  ): Promise<ExtractedImage[]> {
    const images: ExtractedImage[] = [];
    const config = this.portalConfigs.get(portal);

    if (!config) {
      // Generic fallback selectors
      return this.extractWithGenericSelectors($);
    }

    // Use portal-specific selectors
    if (config.selectors.gallery) {
      config.selectors.gallery.forEach(selector => {
        $(selector).each((index: number, element: any) => {
          const src = $(element).attr('src') || $(element).attr('data-src') || $(element).attr('data-original');
          if (src && this.isValidImageUrl(src)) {
            images.push({
              url: src,
              selector,
              context: 'gallery',
              alt: $(element).attr('alt'),
              title: $(element).attr('title'),
              position: index,
            });
          }
        });
      });
    }

    if (config.selectors.heroImage) {
      config.selectors.heroImage.forEach(selector => {
        $(selector).each((index: number, element: any) => {
          const src = $(element).attr('src') || $(element).attr('data-src');
          if (src && this.isValidImageUrl(src)) {
            images.push({
              url: src,
              selector,
              context: 'hero',
              alt: $(element).attr('alt'),
              title: $(element).attr('title'),
            });
          }
        });
      });
    }

    return images;
  }

  /**
   * Generic image extraction fallback
   */
  private extractWithGenericSelectors($: cheerio.CheerioAPI): ExtractedImage[] {
    const images: ExtractedImage[] = [];

    // Common gallery selectors
    const gallerySelectors = [
      '.gallery img',
      '.image-gallery img',
      '.car-images img',
      '.listing-images img',
      '.photo-gallery img',
      '[class*="gallery"] img',
      '[class*="slider"] img',
      '[class*="carousel"] img',
    ];

    gallerySelectors.forEach(selector => {
      $(selector).each((index: number, element: any) => {
        const src = $(element).attr('src') || $(element).attr('data-src') || $(element).attr('data-original');
        if (src && this.isValidImageUrl(src)) {
          images.push({
            url: src,
            selector,
            context: 'gallery',
            alt: $(element).attr('alt'),
            position: index,
          });
        }
      });
    });

    return images;
  }

  /**
   * Extract basic page metadata
   */
  private extractMetadata($: cheerio.CheerioAPI, metadata: PageMetadata): void {
    // Title
    metadata.title = $('title').text() || 
                    $('meta[property="og:title"]').attr('content') || 
                    $('h1').first().text();

    // Description
    metadata.description = $('meta[name="description"]').attr('content') || 
                          $('meta[property="og:description"]').attr('content');

    // Price information
    const priceSelectors = [
      '[class*="price"]',
      '[data-price]',
      '.amount',
      '.cost',
    ];

    priceSelectors.forEach(selector => {
      if (!metadata.price) {
        const priceText = $(selector).first().text().trim();
        if (priceText && /₹|INR|\d+/.test(priceText)) {
          metadata.price = priceText;
        }
      }
    });
  }

  /**
   * Filter and deduplicate extracted images
   */
  private filterAndDeduplicateImages(images: ExtractedImage[]): ExtractedImage[] {
    const seen = new Set<string>();
    const filtered: ExtractedImage[] = [];

    // Sort by priority: jsonld > opengraph > gallery
    const priorityOrder: Record<string, number> = { jsonld: 0, opengraph: 1, gallery: 2, hero: 1 };
    images.sort((a, b) => (priorityOrder[a.context] || 99) - (priorityOrder[b.context] || 99));

    images.forEach(img => {
      // Normalize URL for deduplication
      const normalizedUrl = this.normalizeImageUrl(img.url);
      
      if (!seen.has(normalizedUrl) && this.isValidCarImage(img)) {
        seen.add(normalizedUrl);
        filtered.push(img);
      }
    });

    return filtered;
  }

  /**
   * Validate if URL looks like a valid car image
   */
  private isValidCarImage(img: ExtractedImage): boolean {
    const url = img.url.toLowerCase();
    
    // Skip obvious non-car images
    const skipPatterns = [
      /logo/i,
      /banner/i,
      /advertisement/i,
      /sponsor/i,
      /dealer.*logo/i,
      /brand.*icon/i,
      /social/i,
      /facebook/i,
      /twitter/i,
      /instagram/i,
    ];

    if (skipPatterns.some(pattern => pattern.test(url))) {
      return false;
    }

    // Skip very small images (likely icons)
    if (img.width && img.height && (img.width < 100 || img.height < 100)) {
      return false;
    }

    return true;
  }

  /**
   * Basic image URL validation
   */
  private isValidImageUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    
    try {
      const parsed = new URL(url, 'https://example.com'); // Allow relative URLs
      return /\.(jpe?g|png|webp|gif)(\?|$)/i.test(parsed.pathname);
    } catch {
      return false;
    }
  }

  /**
   * Normalize image URL for deduplication
   */
  private normalizeImageUrl(url: string): string {
    try {
      const parsed = new URL(url, 'https://example.com');
      // Remove common query parameters that don't affect the image
      const paramsToRemove = ['imwidth', 'imheight', 'w', 'h', 'quality', 'format', 'cache', 'v', 'version'];
      paramsToRemove.forEach(param => parsed.searchParams.delete(param));
      return parsed.toString();
    } catch {
      return url;
    }
  }

  /**
   * Initialize portal-specific configurations
   */
  private initializePortalConfigs(): void {
    // CarDekho configuration
    this.portalConfigs.set('cardekho.com', {
      name: 'CarDekho',
      selectors: {
        gallery: [
          '.gsc_imgBig img',
          '.car-gallery img',
          '.image-gallery img'
        ],
        heroImage: ['.car-hero-image img'],
        thumbnails: ['.thumbnail-gallery img']
      },
      imageUrlPatterns: [/images\.cardekho\.com/],
      excludePatterns: [/logo/, /banner/]
    });

    // Cars24 configuration  
    this.portalConfigs.set('cars24.com', {
      name: 'Cars24',
      selectors: {
        gallery: [
          '.image-gallery-slides img',
          '.car-images img',
          '[data-testid="car-gallery"] img'
        ],
        heroImage: ['.hero-image img']
      },
      imageUrlPatterns: [/images\.cars24\.com/],
      excludePatterns: [/logo/, /watermark/]
    });

    // OLX configuration
    this.portalConfigs.set('olx.in', {
      name: 'OLX',
      selectors: {
        gallery: [
          '.gallery-image img',
          '.image-gallery img',
          '[data-cy="ad-gallery"] img'
        ],
        heroImage: ['.main-image img']
      },
      imageUrlPatterns: [/apollo\.olx\.in/, /images\.olx\.in/],
      excludePatterns: [/logo/, /default/]
    });

    // CarWale configuration
    this.portalConfigs.set('carwale.com', {
      name: 'CarWale',
      selectors: {
        gallery: [
          '.car-gallery img',
          '.image-slider img',
          '.vehicle-images img'
        ],
      },
      imageUrlPatterns: [/images\.carwale\.com/],
    });

    // AutoTrader configuration
    this.portalConfigs.set('autotrader.com', {
      name: 'AutoTrader',
      selectors: {
        gallery: [
          '.image-gallery img',
          '.vehicle-photos img'
        ],
      },
    });

    // Maruti True Value configuration - CERTIFIED PRE-OWNED INTEGRATION
    this.portalConfigs.set('marutisuzukitruevalue.com', {
      name: 'Maruti True Value',
      selectors: {
        gallery: [
          '.car-gallery img',
          '.image-gallery img',
          '.car-images img',
          '.listing-images img',
          '[class*="gallery"] img',
          '[class*="slider"] img',
          '[class*="carousel"] img'
        ],
        heroImage: [
          '.hero-image img',
          '.main-car-image img',
          '.primary-image img'
        ],
        thumbnails: [
          '.thumbnail-gallery img',
          '.thumb-images img',
          '.small-images img'
        ]
      },
      imageUrlPatterns: [
        /dt5rjsxbvck7d\.cloudfront\.net/, // Primary CDN
        /az-ci-afde-prd-trv-01-.*\.azurefd\.net/, // Azure CDN
        /images\.marutisuzukitruevalue\.com/,
        /assets\.truevalue\.com/
      ],
      excludePatterns: [
        /logo/i,
        /banner/i,
        /watermark/i,
        /placeholder/i,
        /default/i,
        /icon/i,
        /header/i,
        /footer/i,
        /masterloader/i // Exclude loading animations
      ]
    });
  }

  /**
   * Get available portal configurations
   */
  getPortalConfigs(): string[] {
    return Array.from(this.portalConfigs.keys());
  }

  /**
   * Test extraction on a single URL (for debugging)
   */
  async testExtraction(url: string): Promise<void> {
    console.log(`\n🧪 Testing extraction for: ${url}`);
    
    const result = await this.extractFromUrl({
      url,
      listingId: 'test-123',
      portal: new URL(url).hostname,
      processImages: false,
    });

    console.log(`\n📊 Results:`);
    console.log(`Success: ${result.success}`);
    console.log(`Images found: ${result.images.length}`);
    
    if (result.errors?.length) {
      console.log(`Errors: ${result.errors.join(', ')}`);
    }

    result.images.forEach((img, idx) => {
      console.log(`${idx + 1}. ${img.context} | ${img.selector} | ${img.url}`);
    });

    if (result.metadata) {
      console.log(`\nMetadata: ${JSON.stringify(result.metadata, null, 2)}`);
    }
  }
}

export const detailPageExtractor = new DetailPageExtractor();