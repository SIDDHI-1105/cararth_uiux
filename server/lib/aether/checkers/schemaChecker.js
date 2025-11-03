import crypto from 'crypto';
import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Schema Checker
 * Detect and validate JSON-LD (Vehicle, Organization, LocalBusiness, Article schemas)
 */
export class SchemaChecker {
  constructor() {
    this.timeout = 25000;
    this.expectedSchemas = {
      '/': ['Organization', 'WebSite'],
      '/used-cars': ['Product', 'Vehicle'],
      '/news': ['Article', 'NewsArticle'],
      '/about': ['Organization']
    };
  }

  /**
   * Run schema checks
   */
  async check(url, correlationId) {
    const startTime = Date.now();
    const issues = [];
    
    try {
      // Check main pages for schema
      const pagesToCheck = ['/', '/used-cars', '/news'];
      
      for (const page of pagesToCheck) {
        const pageUrl = new URL(page, url).toString();
        const pageIssues = await this.checkPageSchema(pageUrl, page);
        issues.push(...pageIssues);
      }

      const categoryScore = this.calculateScore(issues);
      
      return {
        category: 'Schema',
        issues,
        categoryScore,
        duration: Date.now() - startTime,
        correlationId
      };
    } catch (error) {
      console.error('[SchemaChecker] Error:', error);
      return this.getMockResult(url, correlationId);
    }
  }

  /**
   * Check schema for a specific page
   */
  async checkPageSchema(url, page) {
    const issues = [];
    
    try {
      const response = await axios.get(url, {
        timeout: 8000,
        validateStatus: () => true
      });

      if (response.status !== 200) {
        return issues;
      }

      const html = response.data;
      const $ = cheerio.load(html);
      
      // Extract all JSON-LD scripts
      const schemas = [];
      $('script[type="application/ld+json"]').each((i, elem) => {
        try {
          const schemaData = JSON.parse($(elem).html());
          schemas.push(schemaData);
        } catch (err) {
          issues.push({
            id: `schema_invalid_json_${page.replace(/\//g, '_')}`,
            page,
            severity: 'high',
            description: 'Invalid JSON-LD schema syntax',
            impact_score: 0.60,
            suggested_fix: 'Fix JSON syntax in <script type="application/ld+json"> tag'
          });
        }
      });

      // Check if expected schemas are present
      const expected = this.expectedSchemas[page] || [];
      const foundTypes = schemas.map(s => s['@type']).flat();
      
      for (const expectedType of expected) {
        if (!foundTypes.includes(expectedType)) {
          const severity = expectedType === 'Vehicle' || expectedType === 'Product' ? 'critical' : 'high';
          const impact = severity === 'critical' ? 0.85 : 0.65;
          
          issues.push({
            id: `schema_missing_${expectedType.toLowerCase()}_${page.replace(/\//g, '_')}`,
            page,
            severity,
            description: `Missing ${expectedType} schema JSON-LD`,
            impact_score: impact,
            suggested_fix: `Add schema.org/${expectedType} structured data`
          });
        }
      }

      // Validate Vehicle schema if present
      const vehicleSchema = schemas.find(s => 
        s['@type'] === 'Vehicle' || s['@type'] === 'Car' || s['@type'] === 'Product'
      );
      
      if (vehicleSchema) {
        const validationIssues = this.validateVehicleSchema(vehicleSchema, page);
        issues.push(...validationIssues);
      }

      // Validate Organization schema
      const orgSchema = schemas.find(s => s['@type'] === 'Organization');
      if (orgSchema) {
        const validationIssues = this.validateOrganizationSchema(orgSchema, page);
        issues.push(...validationIssues);
      }

    } catch (error) {
      console.error(`[SchemaChecker] Failed to check ${page}:`, error.message);
    }

    return issues;
  }

  /**
   * Validate Vehicle/Product schema
   */
  validateVehicleSchema(schema, page) {
    const issues = [];
    const requiredFields = ['name', 'description'];
    const recommendedFields = ['brand', 'model', 'price', 'image'];
    
    for (const field of requiredFields) {
      if (!schema[field]) {
        issues.push({
          id: `schema_vehicle_missing_${field}_${page.replace(/\//g, '_')}`,
          page,
          severity: 'high',
          description: `Vehicle schema missing required field: ${field}`,
          impact_score: 0.70,
          suggested_fix: `Add "${field}" property to Vehicle schema`
        });
      }
    }

    for (const field of recommendedFields) {
      if (!schema[field] && !schema.offers?.[field]) {
        issues.push({
          id: `schema_vehicle_missing_${field}_${page.replace(/\//g, '_')}`,
          page,
          severity: 'medium',
          description: `Vehicle schema missing recommended field: ${field}`,
          impact_score: 0.40,
          suggested_fix: `Add "${field}" property to Vehicle schema for better visibility`
        });
      }
    }

    return issues;
  }

  /**
   * Validate Organization schema
   */
  validateOrganizationSchema(schema, page) {
    const issues = [];
    const requiredFields = ['name', 'url'];
    const recommendedFields = ['logo', 'sameAs', 'contactPoint'];
    
    for (const field of requiredFields) {
      if (!schema[field]) {
        issues.push({
          id: `schema_org_missing_${field}_${page.replace(/\//g, '_')}`,
          page,
          severity: 'medium',
          description: `Organization schema missing required field: ${field}`,
          impact_score: 0.50,
          suggested_fix: `Add "${field}" property to Organization schema`
        });
      }
    }

    for (const field of recommendedFields) {
      if (!schema[field]) {
        issues.push({
          id: `schema_org_missing_${field}_${page.replace(/\//g, '_')}`,
          page,
          severity: 'low',
          description: `Organization schema missing recommended field: ${field}`,
          impact_score: 0.25,
          suggested_fix: `Add "${field}" property to Organization schema for better branding`
        });
      }
    }

    return issues;
  }

  /**
   * Calculate category score based on issues
   */
  calculateScore(issues) {
    if (issues.length === 0) return 100;

    let totalImpact = 0;
    for (const issue of issues) {
      totalImpact += issue.impact_score;
    }

    const score = Math.max(0, 100 - (totalImpact * 100));
    return Math.round(score);
  }

  /**
   * Generate deterministic mock result based on URL hash
   */
  getMockResult(url, correlationId) {
    const hash = crypto.createHash('sha256').update(url).digest('hex');
    const hashValue = parseInt(hash.substring(0, 8), 16);
    
    const issues = [];
    
    // Deterministic issues based on hash
    if (hashValue % 2 === 0) {
      issues.push({
        id: 'schema_missing_vehicle',
        page: '/used-cars',
        severity: 'critical',
        description: 'Missing Vehicle schema JSON-LD on listing pages',
        impact_score: 0.85,
        suggested_fix: 'Add schema.org/Vehicle with make/model/year/price'
      });
    }

    if (hashValue % 3 === 0) {
      issues.push({
        id: 'schema_org_missing_logo',
        page: '/',
        severity: 'low',
        description: 'Organization schema missing logo field',
        impact_score: 0.25,
        suggested_fix: 'Add "logo" property to Organization schema'
      });
    }

    if (hashValue % 4 === 0) {
      issues.push({
        id: 'schema_missing_article',
        page: '/news',
        severity: 'high',
        description: 'Missing Article schema on news pages',
        impact_score: 0.65,
        suggested_fix: 'Add schema.org/Article or NewsArticle to blog posts'
      });
    }

    const categoryScore = this.calculateScore(issues);

    return {
      category: 'Schema',
      issues,
      categoryScore,
      mock: true,
      correlationId
    };
  }
}

export const schemaChecker = new SchemaChecker();
