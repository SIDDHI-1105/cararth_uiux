/**
 * AETHER Content Publisher
 * Mode A: Manual export (ZIP/JSON bundle)
 * Mode B: CMS Push via API
 */

import { db } from '../../../db.js';
import { aetherArticles } from '../../../../shared/schema.js';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import axios from 'axios';

class ContentPublisher {
  constructor() {
    this.mode = process.env.AETHER_PUBLISH_MODE || 'A'; // Default to Mode A
    this.cmsApiBase = process.env.CMS_API_BASE;
    this.cmsApiKey = process.env.CMS_API_KEY;
    this.maxVersions = 3;
    
    console.log(`[AETHER Publisher] Initialized in Mode ${this.mode}`);
    
    if (this.mode === 'B' && (!this.cmsApiBase || !this.cmsApiKey)) {
      console.warn('[AETHER Publisher] Mode B configured but CMS credentials missing. Will use mock mode.');
    }
  }

  /**
   * Publish an article
   * Mode A: Create JSON bundle and update status to 'ready_for_manual'
   * Mode B: POST to CMS API and update status to 'published'
   */
  async publishArticle(articleId) {
    console.log(`[AETHER Publisher] Publishing article ${articleId} in Mode ${this.mode}`);
    
    // Fetch article from database
    const [article] = await db
      .select()
      .from(aetherArticles)
      .where(eq(aetherArticles.id, articleId))
      .limit(1);
    
    if (!article) {
      throw new Error(`Article ${articleId} not found`);
    }
    
    if (article.status === 'published') {
      throw new Error(`Article ${articleId} is already published`);
    }
    
    // Store current version before publishing
    await this.saveVersion(article);
    
    if (this.mode === 'A') {
      return await this.publishModeA(article);
    } else {
      return await this.publishModeB(article);
    }
  }

  /**
   * Mode A: Create JSON bundle for manual export
   */
  async publishModeA(article) {
    console.log(`[AETHER Publisher] Mode A: Creating JSON bundle for ${article.id}`);
    
    const bundle = {
      meta: {
        id: article.id,
        city: article.city,
        topic: article.topic,
        slug: article.slug,
        exportedAt: new Date().toISOString()
      },
      files: {
        'meta.json': article.meta,
        'schema.json': article.schema,
        'links.json': article.internalLinks,
        'content.html': article.contentHtml,
        'geo_intro.html': article.geoIntro,
        'cta.json': article.cta,
        'seo_checklist.json': article.seoChecklist
      }
    };
    
    // Update article status
    await db
      .update(aetherArticles)
      .set({
        status: 'ready_for_manual',
        updatedAt: new Date()
      })
      .where(eq(aetherArticles.id, article.id));
    
    console.log(`[AETHER Publisher] Mode A: Article ${article.id} marked as ready_for_manual`);
    
    return {
      success: true,
      mode: 'A',
      articleId: article.id,
      status: 'ready_for_manual',
      bundle: bundle,
      message: 'Article ready for manual export. Download bundle to publish manually.'
    };
  }

  /**
   * Mode B: POST to CMS API
   */
  async publishModeB(article) {
    console.log(`[AETHER Publisher] Mode B: Publishing to CMS for ${article.id}`);
    
    // Check if mock mode
    const isMock = !this.cmsApiBase || !this.cmsApiKey;
    
    if (isMock) {
      return await this.publishModeBMock(article);
    }
    
    try {
      const payload = {
        slug: article.slug,
        meta: article.meta,
        contentHtml: article.contentHtml,
        geoIntro: article.geoIntro,
        schema: article.schema,
        internalLinks: article.internalLinks,
        cta: article.cta,
        status: 'published'
      };
      
      // POST to CMS API
      const response = await axios.post(
        `${this.cmsApiBase}/articles`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.cmsApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );
      
      const cmsRef = response.data.id || response.data.cmsRef || crypto.randomUUID();
      const publishedUrl = response.data.url || response.data.publishedUrl;
      
      // Update article in database
      await db
        .update(aetherArticles)
        .set({
          status: 'published',
          cmsRef: cmsRef,
          updatedAt: new Date()
        })
        .where(eq(aetherArticles.id, article.id));
      
      console.log(`[AETHER Publisher] Mode B: Article ${article.id} published successfully (CMS ref: ${cmsRef})`);
      
      return {
        success: true,
        mode: 'B',
        articleId: article.id,
        status: 'published',
        cmsRef: cmsRef,
        publishedUrl: publishedUrl,
        message: 'Article published to CMS successfully'
      };
    } catch (error) {
      console.error('[AETHER Publisher] Mode B: Failed to publish to CMS:', error.message);
      throw new Error(`Failed to publish to CMS: ${error.message}`);
    }
  }

  /**
   * Mode B Mock: Simulate CMS publish
   */
  async publishModeBMock(article) {
    console.log(`[AETHER Publisher] Mode B Mock: Simulating CMS publish for ${article.id}`);
    
    const mockCmsRef = `mock-cms-${crypto.randomBytes(4).toString('hex')}`;
    const mockUrl = `https://cms.example.com/articles/${article.slug}`;
    
    // Update article in database
    await db
      .update(aetherArticles)
      .set({
        status: 'published',
        cmsRef: mockCmsRef,
        updatedAt: new Date()
      })
      .where(eq(aetherArticles.id, article.id));
    
    return {
      success: true,
      mode: 'B',
      mock: true,
      articleId: article.id,
      status: 'published',
      cmsRef: mockCmsRef,
      publishedUrl: mockUrl,
      message: 'Article published in mock mode (CMS credentials not configured)'
    };
  }

  /**
   * Unpublish article (Mode B only)
   */
  async unpublishArticle(articleId) {
    console.log(`[AETHER Publisher] Unpublishing article ${articleId}`);
    
    if (this.mode !== 'B') {
      throw new Error('Unpublish is only available in Mode B');
    }
    
    // Fetch article
    const [article] = await db
      .select()
      .from(aetherArticles)
      .where(eq(aetherArticles.id, articleId))
      .limit(1);
    
    if (!article) {
      throw new Error(`Article ${articleId} not found`);
    }
    
    if (article.status !== 'published') {
      throw new Error(`Article ${articleId} is not published`);
    }
    
    if (!article.cmsRef) {
      throw new Error(`Article ${articleId} has no CMS reference`);
    }
    
    const isMock = !this.cmsApiBase || !this.cmsApiKey;
    
    if (!isMock) {
      try {
        // DELETE from CMS API
        await axios.delete(
          `${this.cmsApiBase}/articles/${article.cmsRef}`,
          {
            headers: {
              'Authorization': `Bearer ${this.cmsApiKey}`
            },
            timeout: 30000
          }
        );
      } catch (error) {
        console.error('[AETHER Publisher] Failed to unpublish from CMS:', error.message);
        throw new Error(`Failed to unpublish from CMS: ${error.message}`);
      }
    }
    
    // Update article in database
    await db
      .update(aetherArticles)
      .set({
        status: 'draft',
        updatedAt: new Date()
      })
      .where(eq(aetherArticles.id, articleId));
    
    console.log(`[AETHER Publisher] Article ${articleId} unpublished successfully`);
    
    return {
      success: true,
      articleId: articleId,
      status: 'draft',
      message: isMock ? 'Article unpublished (mock mode)' : 'Article unpublished from CMS'
    };
  }

  /**
   * Rollback to a previous version (Mode B only)
   */
  async rollbackArticle(articleId, versionIndex = 0) {
    console.log(`[AETHER Publisher] Rolling back article ${articleId} to version ${versionIndex}`);
    
    if (this.mode !== 'B') {
      throw new Error('Rollback is only available in Mode B');
    }
    
    // Fetch article
    const [article] = await db
      .select()
      .from(aetherArticles)
      .where(eq(aetherArticles.id, articleId))
      .limit(1);
    
    if (!article) {
      throw new Error(`Article ${articleId} not found`);
    }
    
    // Get versions from metadata (stored in meta.versions)
    const versions = article.meta?.versions || [];
    
    if (versionIndex >= versions.length) {
      throw new Error(`Version ${versionIndex} not found. Available versions: ${versions.length}`);
    }
    
    const targetVersion = versions[versionIndex];
    
    // Save current state as a version before rolling back
    await this.saveVersion(article);
    
    // Restore the target version
    await db
      .update(aetherArticles)
      .set({
        contentHtml: targetVersion.contentHtml,
        geoIntro: targetVersion.geoIntro,
        schema: targetVersion.schema,
        internalLinks: targetVersion.internalLinks,
        cta: targetVersion.cta,
        seoChecklist: targetVersion.seoChecklist,
        updatedAt: new Date()
      })
      .where(eq(aetherArticles.id, articleId));
    
    console.log(`[AETHER Publisher] Article ${articleId} rolled back to version ${versionIndex}`);
    
    return {
      success: true,
      articleId: articleId,
      versionIndex: versionIndex,
      restoredAt: targetVersion.savedAt,
      message: 'Article rolled back successfully'
    };
  }

  /**
   * Save current version to version history
   * Keeps only last 3 versions in meta.versions JSONB field
   */
  async saveVersion(article) {
    console.log(`[AETHER Publisher] Saving version for article ${article.id}`);
    
    // Get existing versions
    const versions = article.meta?.versions || [];
    
    // Create new version snapshot
    const newVersion = {
      savedAt: new Date().toISOString(),
      contentHtml: article.contentHtml,
      geoIntro: article.geoIntro,
      schema: article.schema,
      internalLinks: article.internalLinks,
      cta: article.cta,
      seoChecklist: article.seoChecklist,
      status: article.status
    };
    
    // Add to beginning of array
    versions.unshift(newVersion);
    
    // Keep only last 3 versions
    const trimmedVersions = versions.slice(0, this.maxVersions);
    
    // Update meta with versions
    const updatedMeta = {
      ...article.meta,
      versions: trimmedVersions
    };
    
    // Save back to database
    await db
      .update(aetherArticles)
      .set({
        meta: updatedMeta,
        updatedAt: new Date()
      })
      .where(eq(aetherArticles.id, article.id));
    
    console.log(`[AETHER Publisher] Version saved. Total versions: ${trimmedVersions.length}`);
  }

  /**
   * Get version diff (Mode B only)
   * Compare current draft vs published version
   */
  async getVersionDiff(articleId) {
    console.log(`[AETHER Publisher] Getting version diff for article ${articleId}`);
    
    // Fetch article
    const [article] = await db
      .select()
      .from(aetherArticles)
      .where(eq(aetherArticles.id, articleId))
      .limit(1);
    
    if (!article) {
      throw new Error(`Article ${articleId} not found`);
    }
    
    const versions = article.meta?.versions || [];
    
    if (versions.length === 0) {
      return {
        articleId: articleId,
        hasChanges: false,
        message: 'No previous versions available'
      };
    }
    
    // Compare current with most recent version
    const publishedVersion = versions[0];
    const current = {
      contentHtml: article.contentHtml,
      geoIntro: article.geoIntro,
      schema: article.schema,
      internalLinks: article.internalLinks,
      cta: article.cta,
      seoChecklist: article.seoChecklist,
      status: article.status
    };
    
    // Simple diff check
    const hasChanges = JSON.stringify(current) !== JSON.stringify({
      contentHtml: publishedVersion.contentHtml,
      geoIntro: publishedVersion.geoIntro,
      schema: publishedVersion.schema,
      internalLinks: publishedVersion.internalLinks,
      cta: publishedVersion.cta,
      seoChecklist: publishedVersion.seoChecklist,
      status: publishedVersion.status
    });
    
    return {
      articleId: articleId,
      hasChanges: hasChanges,
      current: {
        status: article.status,
        updatedAt: article.updatedAt,
        wordCount: this.countWords(article.contentHtml)
      },
      published: {
        status: publishedVersion.status,
        savedAt: publishedVersion.savedAt,
        wordCount: this.countWords(publishedVersion.contentHtml)
      },
      availableVersions: versions.length
    };
  }

  /**
   * Count words in HTML content
   */
  countWords(html) {
    if (!html) return 0;
    const text = html.replace(/<[^>]*>/g, ' ');
    const words = text.trim().split(/\s+/);
    return words.filter(w => w.length > 0).length;
  }
}

// Singleton instance
let publisherInstance = null;

export function getPublisher() {
  if (!publisherInstance) {
    publisherInstance = new ContentPublisher();
  }
  return publisherInstance;
}

export const contentPublisher = getPublisher();
