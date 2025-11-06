import crypto from 'crypto';

/**
 * Encryption utility for Google Service Account credentials
 * Uses AES-256-GCM for authenticated encryption
 */

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

// Derive encryption key from JWT_SECRET
function getEncryptionKey() {
  const secret = process.env.JWT_SECRET || 'development-secret-key';
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypt credentials object
 * @param {Object} credentials - Service account JSON or OAuth tokens
 * @returns {string} Encrypted string (base64)
 */
export function encryptCredentials(credentials) {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    const plaintext = JSON.stringify(credentials);
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const authTag = cipher.getAuthTag();
    
    // Combine: iv + authTag + encrypted
    const combined = Buffer.concat([
      iv,
      authTag,
      Buffer.from(encrypted, 'base64')
    ]);
    
    return combined.toString('base64');
  } catch (error) {
    console.error('[Google Crypto] Encryption failed:', error.message);
    throw new Error('Failed to encrypt credentials');
  }
}

/**
 * Decrypt credentials
 * @param {string} encryptedData - Base64 encrypted string
 * @returns {Object} Decrypted credentials object
 */
export function decryptCredentials(encryptedData) {
  try {
    const key = getEncryptionKey();
    const combined = Buffer.from(encryptedData, 'base64');
    
    // Extract: iv + authTag + encrypted
    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('[Google Crypto] Decryption failed:', error.message);
    throw new Error('Failed to decrypt credentials');
  }
}
