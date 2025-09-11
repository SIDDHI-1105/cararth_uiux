/**
 * Visitor ID Management for Anonymous Search Tracking
 * 
 * Implements a robust visitor identification system with multi-store persistence:
 * - localStorage for immediate access
 * - cookies for server-side access  
 * - IndexedDB for durability across browser data clearing
 */

const VISITOR_ID_KEY = 'cararth_visitor_id';
const VISITOR_ID_COOKIE = 'cararth_vid';

// Generate a new visitor ID
function generateVisitorId(): string {
  return crypto.randomUUID();
}

// localStorage operations
function getFromLocalStorage(): string | null {
  try {
    return localStorage.getItem(VISITOR_ID_KEY);
  } catch {
    return null;
  }
}

function setToLocalStorage(id: string): void {
  try {
    localStorage.setItem(VISITOR_ID_KEY, id);
  } catch {
    // localStorage unavailable (incognito mode, etc.)
  }
}

// Cookie operations
function getFromCookie(): string | null {
  try {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === VISITOR_ID_COOKIE) {
        return decodeURIComponent(value);
      }
    }
    return null;
  } catch {
    return null;
  }
}

function setToCookie(id: string): void {
  try {
    // Set cookie for 1 year
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    
    document.cookie = `${VISITOR_ID_COOKIE}=${encodeURIComponent(id)}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
  } catch {
    // Cookie setting failed
  }
}

// IndexedDB operations for maximum persistence
function getFromIndexedDB(): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open('CararthDB', 1);
      
      request.onerror = () => resolve(null);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('visitor')) {
          db.createObjectStore('visitor');
        }
      };
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(['visitor'], 'readonly');
        const store = transaction.objectStore('visitor');
        const getRequest = store.get(VISITOR_ID_KEY);
        
        getRequest.onsuccess = () => {
          resolve(getRequest.result || null);
        };
        
        getRequest.onerror = () => resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
}

function setToIndexedDB(id: string): Promise<void> {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open('CararthDB', 1);
      
      request.onerror = () => resolve();
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('visitor')) {
          db.createObjectStore('visitor');
        }
      };
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(['visitor'], 'readwrite');
        const store = transaction.objectStore('visitor');
        store.put(id, VISITOR_ID_KEY);
        resolve();
      };
    } catch {
      resolve();
    }
  });
}

// Main visitor ID manager
class VisitorIdManager {
  private visitorId: string | null = null;
  private initialized = false;

  async initialize(): Promise<string> {
    if (this.initialized && this.visitorId) {
      return this.visitorId;
    }

    // Try to get existing visitor ID from multiple sources
    let visitorId = getFromLocalStorage() || getFromCookie();
    
    if (!visitorId) {
      // Try IndexedDB as fallback
      visitorId = await getFromIndexedDB();
    }

    // If no existing ID found, generate new one
    if (!visitorId) {
      visitorId = generateVisitorId();
      console.log('🆔 Generated new visitor ID:', visitorId.substring(0, 8) + '...');
    } else {
      console.log('🔍 Retrieved existing visitor ID:', visitorId.substring(0, 8) + '...');
    }

    // Store in all locations for redundancy
    setToLocalStorage(visitorId);
    setToCookie(visitorId);
    setToIndexedDB(visitorId); // async but non-blocking

    this.visitorId = visitorId;
    this.initialized = true;

    return visitorId;
  }

  getVisitorId(): string | null {
    return this.visitorId;
  }

  // Reset visitor ID (for testing or user request)
  reset(): string {
    const newId = generateVisitorId();
    
    // Clear from all stores
    try {
      localStorage.removeItem(VISITOR_ID_KEY);
      document.cookie = `${VISITOR_ID_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    } catch {}

    // Set new ID
    setToLocalStorage(newId);
    setToCookie(newId);
    setToIndexedDB(newId);

    this.visitorId = newId;
    console.log('🔄 Reset to new visitor ID:', newId.substring(0, 8) + '...');
    
    return newId;
  }
}

// Export singleton instance
export const visitorIdManager = new VisitorIdManager();

// Export utility function for components
export async function getVisitorId(): Promise<string> {
  return await visitorIdManager.initialize();
}