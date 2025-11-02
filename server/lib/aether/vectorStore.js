import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VECTOR_STORE_PATH = path.join(__dirname, '../../../data/aether/vectorstore.json');

/**
 * Simple JSON-backed vector store with cosine similarity
 */
class VectorStore {
  constructor() {
    this.vectors = new Map();
    this.metadata = new Map();
    this.load();
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have same dimension');
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      magnitudeA += vecA[i] * vecA[i];
      magnitudeB += vecB[i] * vecB[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Add or update a vector with metadata
   */
  upsert(id, vector, metadata = {}) {
    if (!Array.isArray(vector) || vector.length === 0) {
      throw new Error('Vector must be a non-empty array');
    }

    this.vectors.set(id, vector);
    this.metadata.set(id, {
      ...metadata,
      id,
      timestamp: new Date().toISOString(),
      dimension: vector.length
    });

    return true;
  }

  /**
   * Query for top K similar vectors
   */
  query(queryVector, topK = 5) {
    if (!Array.isArray(queryVector) || queryVector.length === 0) {
      throw new Error('Query vector must be a non-empty array');
    }

    const results = [];

    // Calculate similarity for all vectors
    for (const [id, vector] of this.vectors.entries()) {
      // Skip if dimensions don't match
      if (vector.length !== queryVector.length) {
        continue;
      }

      const similarity = this.cosineSimilarity(queryVector, vector);
      results.push({
        id,
        similarity,
        metadata: this.metadata.get(id),
        vector
      });
    }

    // Sort by similarity (descending) and return top K
    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, topK);
  }

  /**
   * Get vector by ID
   */
  get(id) {
    const vector = this.vectors.get(id);
    if (!vector) {
      return null;
    }

    return {
      id,
      vector,
      metadata: this.metadata.get(id)
    };
  }

  /**
   * Delete vector by ID
   */
  delete(id) {
    const deleted = this.vectors.delete(id);
    this.metadata.delete(id);
    return deleted;
  }

  /**
   * Get all vectors
   */
  list() {
    const results = [];
    for (const [id, vector] of this.vectors.entries()) {
      results.push({
        id,
        vector,
        metadata: this.metadata.get(id)
      });
    }
    return results;
  }

  /**
   * Get store statistics
   */
  stats() {
    const dimensions = new Set();
    for (const vector of this.vectors.values()) {
      dimensions.add(vector.length);
    }

    return {
      totalVectors: this.vectors.size,
      dimensions: Array.from(dimensions),
      storePath: VECTOR_STORE_PATH,
      lastLoaded: this.lastLoadTime
    };
  }

  /**
   * Persist to JSON file
   */
  persist() {
    try {
      // Ensure directory exists
      const dir = path.dirname(VECTOR_STORE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Convert Maps to objects for JSON serialization
      const data = {
        vectors: Object.fromEntries(this.vectors),
        metadata: Object.fromEntries(this.metadata),
        version: '1.0',
        persistedAt: new Date().toISOString()
      };

      fs.writeFileSync(VECTOR_STORE_PATH, JSON.stringify(data, null, 2));
      console.log(`[VectorStore] Persisted ${this.vectors.size} vectors to ${VECTOR_STORE_PATH}`);
      return true;
    } catch (error) {
      console.error('[VectorStore] Failed to persist:', error);
      return false;
    }
  }

  /**
   * Load from JSON file
   */
  load() {
    try {
      if (!fs.existsSync(VECTOR_STORE_PATH)) {
        console.log('[VectorStore] No existing store found, starting fresh');
        this.lastLoadTime = new Date().toISOString();
        return false;
      }

      const data = JSON.parse(fs.readFileSync(VECTOR_STORE_PATH, 'utf8'));

      // Convert objects back to Maps
      this.vectors = new Map(Object.entries(data.vectors || {}));
      this.metadata = new Map(Object.entries(data.metadata || {}));
      this.lastLoadTime = new Date().toISOString();

      console.log(`[VectorStore] Loaded ${this.vectors.size} vectors from ${VECTOR_STORE_PATH}`);
      return true;
    } catch (error) {
      console.error('[VectorStore] Failed to load:', error);
      this.vectors = new Map();
      this.metadata = new Map();
      this.lastLoadTime = new Date().toISOString();
      return false;
    }
  }

  /**
   * Clear all vectors
   */
  clear() {
    this.vectors.clear();
    this.metadata.clear();
    return true;
  }
}

// Export singleton instance
export const vectorStore = new VectorStore();
