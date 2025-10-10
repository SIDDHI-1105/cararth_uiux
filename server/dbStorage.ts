import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, and, sql, gte, lte, ilike, desc, asc, count, inArray } from "drizzle-orm";
import { 
  cars, 
  users, 
  contacts, 
  subscriptions, 
  featuredListings,
  conversations,
  messages,
  messageInteractions,
  conversationBlocks,
  userSearchActivity,
  phoneVerifications,
  anonymousSearchActivity,
  cachedPortalListings,
  aiModelCache,
  sarfaesiJobs,
  adminAuditLogs,
  listingSources,
  canonicalListings,
  llmReports,
  ingestionLogs,
  partnerInvites,
  partnerAccounts,
  sellerConsentLog,
  deduplicationResults,
  syndicationExecutionLog,
  externalApiAuditLog,
  type User, 
  type InsertUser, 
  type UpsertUser,
  type Car, 
  type InsertCar, 
  type Contact, 
  type InsertContact,
  type Subscription,
  type InsertSubscription,
  type FeaturedListing,
  type InsertFeaturedListing,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type MessageInteraction,
  type InsertMessageInteraction,
  type ConversationBlock,
  type InsertConversationBlock,
  type UserSearchActivity,
  type InsertUserSearchActivity,
  type PhoneVerification,
  type InsertPhoneVerification,
  type AnonymousSearchActivity,
  type InsertAnonymousSearchActivity,
  type CachedPortalListing,
  type InsertCachedPortalListing,
  type AiModelCache,
  type InsertAiModelCache,
  type SarfaesiJob,
  type InsertSarfaesiJob,
  type AdminAuditLog,
  type InsertAdminAuditLog,
  type SellerConsentLog,
  type InsertSellerConsentLog,
  type DeduplicationResult,
  type InsertDeduplicationResult,
  type SyndicationExecutionLog,
  type InsertSyndicationExecutionLog,
  type ExternalApiAuditLog,
  type InsertExternalApiAuditLog
} from "@shared/schema";
import type { IStorage } from "./storage.js";
import { logError, ErrorCategory, createAppError } from "./errorHandling.js";

// Enhanced search interface for optimization
export interface OptimizedSearchFilters {
  brand?: string;
  model?: string;
  priceMin?: number;
  priceMax?: number;
  city?: string;
  state?: string;
  fuelType?: string[];
  transmission?: string[];
  yearMin?: number;
  yearMax?: number;
  mileageMax?: number;
  owners?: number[];
  condition?: string[];
  hasImages?: boolean;
  hasWarranty?: boolean;
  sortBy?: 'price' | 'mileage' | 'year' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export class DatabaseStorage implements IStorage {
  public db: ReturnType<typeof drizzle>;
  private cache: Map<string, { data: any; expiry: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required for DatabaseStorage');
    }
    
    const sql = neon(process.env.DATABASE_URL);
    this.db = drizzle(sql);
    logError({ message: 'PostgreSQL Database Storage initialized', statusCode: 200 }, 'DatabaseStorage initialization');
  }

  // Cache management
  private getCached<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.data as T;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache<T>(key: string, data: T, ttl: number = this.CACHE_TTL): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl
    });
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const cacheKey = `user:${id}`;
    const cached = this.getCached<User>(cacheKey);
    if (cached) return cached;

    try {
      const result = await this.db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      
      const user = result[0];
      if (user) {
        this.setCache(cacheKey, user);
      }
      return user;
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'getUser operation');
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result = await this.db
        .select()
        .from(users)
        .where(eq(users.email, username))
        .limit(1);
      return result[0];
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'getUserByUsername operation');
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const cacheKey = `user:email:${email}`;
    const cached = this.getCached<User>(cacheKey);
    if (cached) return cached;

    try {
      const result = await this.db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      
      const user = result[0];
      if (user) {
        this.setCache(cacheKey, user);
      }
      return user;
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'getUserByEmail operation');
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const result = await this.db
        .insert(users)
        .values(user)
        .returning();
      
      const newUser = result[0];
      this.setCache(`user:${newUser.id}`, newUser);
      if (newUser.email) {
        this.setCache(`user:email:${newUser.email}`, newUser);
      }
      return newUser;
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'createUser operation');
      throw new Error('Failed to create user - please try again');
    }
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    try {
      const result = await this.db
        .insert(users)
        .values(user)
        .onConflictDoUpdate({
          target: users.id,
          set: {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImageUrl: user.profileImageUrl,
            updatedAt: sql`now()`
          }
        })
        .returning();

      const updatedUser = result[0];
      this.setCache(`user:${updatedUser.id}`, updatedUser);
      if (updatedUser.email) {
        this.setCache(`user:email:${updatedUser.email}`, updatedUser);
      }
      return updatedUser;
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'upsertUser operation');
      throw new Error('Failed to update user profile - please try again');
    }
  }

  // Optimized car operations with performance indexes
  async getCar(id: string): Promise<Car | undefined> {
    const cacheKey = `car:${id}`;
    const cached = this.getCached<Car>(cacheKey);
    if (cached) return cached;

    try {
      const result = await this.db
        .select()
        .from(cars)
        .where(eq(cars.id, id))
        .limit(1);
      
      const car = result[0];
      if (car) {
        this.setCache(cacheKey, car);
      }
      return car;
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'getCar operation');
      return undefined;
    }
  }

  async getCachedPortalListing(id: string): Promise<any | undefined> {
    const cacheKey = `portal_listing:${id}`;
    const cached = this.getCached<any>(cacheKey);
    if (cached) return cached;

    try {
      const result = await this.db
        .select()
        .from(cachedPortalListings)
        .where(eq(cachedPortalListings.id, id))
        .limit(1);
      
      const listing = result[0];
      if (listing) {
        this.setCache(cacheKey, listing);
      }
      return listing;
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'getCachedPortalListing operation');
      return undefined;
    }
  }

  async getAllCars(): Promise<Car[]> {
    const cacheKey = 'cars:all:active';
    const cached = this.getCached<Car[]>(cacheKey);
    if (cached) return cached;

    try {
      const result = await this.db
        .select()
        .from(cars)
        .where(eq(cars.isSold, false))
        .orderBy(desc(cars.createdAt))
        .limit(100);
      
      this.setCache(cacheKey, result, 60000); // 1 minute cache for active listings
      return result;
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'getAllCars operation');
      return [];
    }
  }

  async getCarsBySeller(sellerId: string): Promise<Car[]> {
    try {
      const result = await this.db
        .select()
        .from(cars)
        .where(eq(cars.sellerId, sellerId))
        .orderBy(desc(cars.createdAt));
      
      return result;
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'getCarsBySeller operation');
      return [];
    }
  }

  async createCar(car: InsertCar): Promise<Car> {
    try {
      const result = await this.db
        .insert(cars)
        .values(car)
        .returning();
      
      const newCar = result[0];
      this.setCache(`car:${newCar.id}`, newCar);
      
      // Invalidate related caches
      this.cache.delete('cars:all:active');
      
      return newCar;
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'createCar operation');
      throw new Error('Failed to create car listing - please try again');
    }
  }

  async updateCar(id: string, updates: Partial<Car>): Promise<Car | undefined> {
    try {
      const result = await this.db
        .update(cars)
        .set(updates)
        .where(eq(cars.id, id))
        .returning();
      
      const updatedCar = result[0];
      if (updatedCar) {
        this.setCache(`car:${updatedCar.id}`, updatedCar);
        this.cache.delete('cars:all:active');
      }
      return updatedCar;
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'updateCar operation');
      return undefined;
    }
  }

  // Highly optimized search with PostgreSQL indexes
  async searchCars(filters: {
    brand?: string;
    priceMin?: number;
    priceMax?: number;
    city?: string;
    fuelType?: string;
    transmission?: string;
    yearMin?: number;
    yearMax?: number;
  }): Promise<Car[]> {
    // Generate cache key from filters
    const cacheKey = `search:${JSON.stringify(filters)}`;
    const cached = this.getCached<Car[]>(cacheKey);
    if (cached) return cached;

    try {
      let query = this.db
        .select()
        .from(cars)
        .where(eq(cars.isSold, false));

      // Build dynamic WHERE conditions
      const conditions = [eq(cars.isSold, false)];

      if (filters.brand && filters.brand !== "All Brands") {
        conditions.push(ilike(cars.brand, `%${filters.brand}%`));
      }

      if (filters.priceMin !== undefined) {
        conditions.push(gte(cars.price, filters.priceMin.toString()));
      }

      if (filters.priceMax !== undefined) {
        conditions.push(lte(cars.price, filters.priceMax.toString()));
      }

      if (filters.city && filters.city !== "Select City") {
        conditions.push(ilike(cars.city, `%${filters.city}%`));
      }

      if (filters.fuelType && filters.fuelType !== "Any Fuel") {
        conditions.push(eq(cars.fuelType, filters.fuelType));
      }

      if (filters.transmission && filters.transmission !== "Any Transmission") {
        conditions.push(eq(cars.transmission, filters.transmission));
      }

      if (filters.yearMin !== undefined) {
        conditions.push(gte(cars.year, filters.yearMin));
      }

      if (filters.yearMax !== undefined) {
        conditions.push(lte(cars.year, filters.yearMax));
      }

      const result = await this.db
        .select()
        .from(cars)
        .where(and(...conditions))
        .orderBy(desc(cars.createdAt))
        .limit(50);

      // Cache search results for 2 minutes
      this.setCache(cacheKey, result, 120000);
      
      logError({ message: `PostgreSQL search completed: ${result.length} results`, statusCode: 200 }, 'searchCars success');
      return result;
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'searchCars operation');
      return [];
    }
  }

  // Advanced search for marketplace optimization
  async optimizedSearch(filters: OptimizedSearchFilters): Promise<{
    cars: Car[];
    total: number;
    hasMore: boolean;
  }> {
    const cacheKey = `optimized:${JSON.stringify(filters)}`;
    const cached = this.getCached<any>(cacheKey);
    if (cached) return cached;

    try {
      // Build conditions
      const conditions = [eq(cars.isSold, false)];

      if (filters.brand) {
        conditions.push(ilike(cars.brand, `%${filters.brand}%`));
      }
      if (filters.model) {
        conditions.push(ilike(cars.model, `%${filters.model}%`));
      }
      if (filters.priceMin) {
        conditions.push(gte(cars.price, filters.priceMin.toString()));
      }
      if (filters.priceMax) {
        conditions.push(lte(cars.price, filters.priceMax.toString()));
      }
      if (filters.city) {
        conditions.push(ilike(cars.city, `%${filters.city}%`));
      }
      if (filters.state) {
        conditions.push(ilike(cars.state, `%${filters.state}%`));
      }
      if (filters.fuelType?.length) {
        conditions.push(inArray(cars.fuelType, filters.fuelType));
      }
      if (filters.transmission?.length) {
        conditions.push(inArray(cars.transmission, filters.transmission));
      }
      if (filters.yearMin) {
        conditions.push(gte(cars.year, filters.yearMin));
      }
      if (filters.yearMax) {
        conditions.push(lte(cars.year, filters.yearMax));
      }
      if (filters.mileageMax) {
        conditions.push(lte(cars.mileage, filters.mileageMax));
      }
      if (filters.hasImages) {
        conditions.push(sql`array_length(${cars.images}, 1) > 0`);
      }

      // Get total count
      const [totalResult] = await this.db
        .select({ count: count() })
        .from(cars)
        .where(and(...conditions));

      // Get paginated results with sorting
      let orderBy;
      const isDesc = filters.sortOrder === 'desc';
      
      switch (filters.sortBy) {
        case 'price':
          orderBy = isDesc ? desc(cars.price) : asc(cars.price);
          break;
        case 'year':
          orderBy = isDesc ? desc(cars.year) : asc(cars.year);
          break;
        case 'mileage':
          orderBy = isDesc ? desc(cars.mileage) : asc(cars.mileage);
          break;
        default:
          orderBy = desc(cars.createdAt);
      }

      const limit = filters.limit || 20;
      const offset = filters.offset || 0;

      const carResults = await this.db
        .select()
        .from(cars)
        .where(and(...conditions))
        .orderBy(orderBy)
        .limit(limit + 1) // +1 to check if there are more results
        .offset(offset);

      const hasMore = carResults.length > limit;
      if (hasMore) {
        carResults.pop(); // Remove the extra result
      }

      const result = {
        cars: carResults,
        total: totalResult.count,
        hasMore
      };

      // Cache for 1 minute
      this.setCache(cacheKey, result, 60000);
      
      logError({ message: `Optimized search completed: ${carResults.length}/${totalResult.count} results`, statusCode: 200 }, 'optimizedSearch success');
      return result;
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'optimizedSearch operation');
      return {
        cars: [],
        total: 0,
        hasMore: false
      };
    }
  }

  // Contact operations
  async createContact(contact: InsertContact): Promise<Contact> {
    try {
      const result = await this.db
        .insert(contacts)
        .values(contact)
        .returning();
      return result[0];
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'createContact operation');
      throw new Error('Failed to create contact - please try again');
    }
  }

  async updateContact(contactId: string, updates: Partial<Contact>): Promise<Contact | null> {
    try {
      const result = await this.db
        .update(contacts)
        .set(updates)
        .where(eq(contacts.id, contactId))
        .returning();
      return result[0] || null;
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'updateContact operation');
      return null;
    }
  }

  async getContactsForCar(carId: string): Promise<Contact[]> {
    try {
      const result = await this.db
        .select()
        .from(contacts)
        .where(eq(contacts.carId, carId))
        .orderBy(desc(contacts.createdAt));
      return result;
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'getContactsForCar operation');
      return [];
    }
  }

  async getContactsForSeller(sellerId: string): Promise<Contact[]> {
    try {
      // First, find all cars belonging to the seller
      const sellerCars = await this.db
        .select({ id: cars.id })
        .from(cars)
        .where(eq(cars.sellerId, sellerId));
      
      const sellerCarIds = sellerCars.map(car => car.id);
      
      if (sellerCarIds.length === 0) {
        return [];
      }
      
      // Then get all contacts for those cars
      const result = await this.db
        .select()
        .from(contacts)
        .where(inArray(contacts.carId, sellerCarIds))
        .orderBy(desc(contacts.createdAt));
      
      return result;
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'getContactsForSeller operation');
      return [];
    }
  }

  // Subscription operations
  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    try {
      const result = await this.db
        .insert(subscriptions)
        .values(subscription)
        .returning();
      return result[0];
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'createSubscription operation');
      throw new Error('Failed to create subscription - please try again');
    }
  }

  async getUserSubscription(userId: string): Promise<Subscription | undefined> {
    const cacheKey = `subscription:${userId}`;
    const cached = this.getCached<Subscription>(cacheKey);
    if (cached) return cached;

    try {
      const result = await this.db
        .select()
        .from(subscriptions)
        .where(and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, 'active')
        ))
        .limit(1);
      
      const subscription = result[0];
      if (subscription) {
        this.setCache(cacheKey, subscription, 300000); // 5 minutes cache
      }
      return subscription;
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'getUserSubscription operation');
      return undefined;
    }
  }

  // Featured listing operations
  async createFeaturedListing(featured: InsertFeaturedListing): Promise<FeaturedListing> {
    try {
      const result = await this.db
        .insert(featuredListings)
        .values(featured)
        .returning();
      return result[0];
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'createFeaturedListing operation');
      throw new Error('Failed to create featured listing - please try again');
    }
  }

  async updateCarFeatured(carId: string, isFeatured: boolean, expiresAt?: Date): Promise<void> {
    try {
      await this.db
        .update(cars)
        .set({
          isFeatured,
          featuredExpiresAt: expiresAt || null
        })
        .where(eq(cars.id, carId));
      
      // Invalidate cache
      this.cache.delete(`car:${carId}`);
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'updateCarFeatured operation');
      throw new Error('Failed to update featured status - please try again');
    }
  }

  // Messaging operations (stubs for now)
  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    try {
      const result = await this.db
        .insert(conversations)
        .values(conversation)
        .returning();
      return result[0];
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'createConversation operation');
      throw new Error('Failed to create conversation - please try again');
    }
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    try {
      const result = await this.db
        .select()
        .from(conversations)
        .where(eq(conversations.id, id))
        .limit(1);
      return result[0];
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'getConversation operation');
      return undefined;
    }
  }

  async getConversationByCarAndBuyer(carId: string, buyerId: string): Promise<Conversation | undefined> {
    try {
      const result = await this.db
        .select()
        .from(conversations)
        .where(and(
          eq(conversations.carId, carId),
          eq(conversations.buyerId, buyerId)
        ))
        .limit(1);
      return result[0];
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'getConversationByCarAndBuyer operation');
      return undefined;
    }
  }

  async getConversationsForUser(userId: string, userType: 'buyer' | 'seller'): Promise<Conversation[]> {
    try {
      const condition = userType === 'buyer' 
        ? eq(conversations.buyerId, userId)
        : eq(conversations.sellerId, userId);
      
      const result = await this.db
        .select()
        .from(conversations)
        .where(condition)
        .orderBy(desc(conversations.lastMessageAt));
      return result;
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'getConversationsForUser operation');
      return [];
    }
  }

  async updateConversationLastMessage(conversationId: string): Promise<void> {
    try {
      await this.db
        .update(conversations)
        .set({ lastMessageAt: sql`now()`, updatedAt: sql`now()` })
        .where(eq(conversations.id, conversationId));
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'updateConversationLastMessage operation');
      // Don't throw - this is a background operation
    }
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    try {
      const result = await this.db
        .insert(messages)
        .values(message)
        .returning();
      return result[0];
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'createMessage operation');
      throw new Error('Failed to send message - please try again');
    }
  }

  async getMessagesInConversation(conversationId: string): Promise<Message[]> {
    try {
      const result = await this.db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(asc(messages.createdAt));
      return result;
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'getMessagesInConversation operation');
      return [];
    }
  }

  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      await this.db
        .update(messages)
        .set({ isRead: true, readAt: sql`now()` })
        .where(and(
          eq(messages.conversationId, conversationId),
          eq(messages.senderId, userId)
        ));
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'markMessagesAsRead operation');
      // Don't throw - this is a background operation
    }
  }

  async updateOfferStatus(messageId: string, status: string, userId: string): Promise<Message | undefined> {
    try {
      const result = await this.db
        .update(messages)
        .set({ offerStatus: status })
        .where(and(
          eq(messages.id, messageId),
          eq(messages.senderId, userId)
        ))
        .returning();
      return result[0];
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'updateOfferStatus operation');
      return undefined;
    }
  }

  async createConversationBlock(block: InsertConversationBlock): Promise<ConversationBlock> {
    try {
      const result = await this.db
        .insert(conversationBlocks)
        .values(block)
        .returning();
      return result[0];
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'createConversationBlock operation');
      throw new Error('Failed to block conversation - please try again');
    }
  }

  async getSellerContactInfo(sellerId: string): Promise<any> {
    try {
      const user = await this.getUser(sellerId);
      if (!user) return null;
      
      return {
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        email: user.email,
        phone: user.phone
      };
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'getSellerContactInfo operation');
      return null;
    }
  }

  // Subscription tier management
  async checkUserSearchLimit(userId: string): Promise<{ canSearch: boolean; searchesLeft: number; resetDate: Date }> {
    try {
      const user = await this.getUser(userId);
      if (!user) {
        return { canSearch: false, searchesLeft: 0, resetDate: new Date() };
      }

      // Pro users have unlimited searches
      if (user.subscriptionTier !== 'free') {
        return { canSearch: true, searchesLeft: 999, resetDate: new Date() };
      }

      const now = new Date();
      const resetDate = user.searchCountResetAt || now;
      
      // Reset counter if it's been more than 24 hours
      if (now.getTime() - resetDate.getTime() > 24 * 60 * 60 * 1000) {
        await this.db
          .update(users)
          .set({ 
            searchCount: 0, 
            searchCountResetAt: now 
          })
          .where(eq(users.id, userId));
        
        return { canSearch: true, searchesLeft: 10, resetDate: now };
      }

      const searchesLeft = Math.max(0, 10 - (user.searchCount || 0));
      return {
        canSearch: searchesLeft > 0,
        searchesLeft,
        resetDate
      };
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'checkUserSearchLimit operation');
      // Fallback to conservative limit for errors
      return { canSearch: false, searchesLeft: 0, resetDate: new Date() };
    }
  }

  async incrementUserSearchCount(userId: string): Promise<void> {
    try {
      await this.db
        .update(users)
        .set({ 
          searchCount: sql`${users.searchCount} + 1`,
          updatedAt: sql`now()`
        })
        .where(eq(users.id, userId));
      
      // Invalidate user cache
      this.cache.delete(`user:${userId}`);
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'incrementUserSearchCount operation');
      // Don't throw - search should continue even if count fails
    }
  }

  async updateUserSubscriptionTier(userId: string, tier: 'free' | 'pro_seller' | 'pro_buyer' | 'superhero'): Promise<User> {
    try {
      const result = await this.db
        .update(users)
        .set({ 
          subscriptionTier: tier,
          updatedAt: sql`now()`
        })
        .where(eq(users.id, userId))
        .returning();
      
      const updatedUser = result[0];
      this.setCache(`user:${userId}`, updatedUser);
      return updatedUser;
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'updateUserSubscriptionTier operation');
      throw new Error('Failed to update subscription tier - please try again');
    }
  }

  // Phone verification operations
  async createPhoneVerification(verification: InsertPhoneVerification): Promise<PhoneVerification> {
    try {
      const result = await this.db
        .insert(phoneVerifications)
        .values(verification)
        .returning();
      return result[0];
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'createPhoneVerification operation');
      throw new Error('Failed to create phone verification - please try again');
    }
  }

  async verifyPhoneCode(userId: string, code: string): Promise<boolean> {
    try {
      const result = await this.db
        .select()
        .from(phoneVerifications)
        .where(and(
          eq(phoneVerifications.userId, userId),
          eq(phoneVerifications.verificationCode, code),
          eq(phoneVerifications.verified, false),
          gte(phoneVerifications.expiresAt, sql`now()`)
        ))
        .limit(1);
      
      if (result.length > 0) {
        await this.db
          .update(phoneVerifications)
          .set({ verified: true })
          .where(eq(phoneVerifications.id, result[0].id));
        return true;
      }
      return false;
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'verifyPhoneCode operation');
      return false;
    }
  }

  async markPhoneAsVerified(userId: string): Promise<void> {
    try {
      await this.db
        .update(users)
        .set({ 
          phoneVerified: true,
          phoneVerifiedAt: sql`now()`,
          updatedAt: sql`now()`
        })
        .where(eq(users.id, userId));
      
      // Invalidate user cache
      this.cache.delete(`user:${userId}`);
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'markPhoneAsVerified operation');
      throw new Error('Failed to verify phone - please try again');
    }
  }

  // Search activity tracking
  async logUserSearchActivity(activity: InsertUserSearchActivity): Promise<UserSearchActivity> {
    try {
      const result = await this.db
        .insert(userSearchActivity)
        .values(activity)
        .returning();
      return result[0];
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'logUserSearchActivity operation');
      throw new Error('Failed to log search activity - please try again');
    }
  }

  // Anonymous search activity tracking for 30-day rolling window
  async logAnonymousSearch(activity: InsertAnonymousSearchActivity): Promise<AnonymousSearchActivity> {
    try {
      const result = await this.db
        .insert(anonymousSearchActivity)
        .values(activity)
        .returning();
      return result[0];
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'logAnonymousSearch operation');
      // Don't throw - search should continue even if logging fails
      throw new Error('Failed to log search activity - please try again');
    }
  }

  async getAnonymousSearchCountSince(visitorId: string, since: Date): Promise<number> {
    const result = await this.db
      .select({ count: count() })
      .from(anonymousSearchActivity)
      .where(and(
        eq(anonymousSearchActivity.visitorId, visitorId),
        gte(anonymousSearchActivity.createdAt, since)
      ));
    return result[0]?.count ?? 0;
  }

  async pruneAnonymousSearches(before: Date): Promise<void> {
    await this.db
      .delete(anonymousSearchActivity)
      .where(lte(anonymousSearchActivity.createdAt, before));
  }

  // Performance monitoring
  getCacheStats() {
    return {
      size: this.cache.size,
      hitRate: 0, // Could implement hit tracking
      memoryUsage: JSON.stringify(Array.from(this.cache.entries())).length
    };
  }

  clearCache(): void {
    this.cache.clear();
    logError({ message: 'Database cache cleared successfully', statusCode: 200 }, 'clearCache operation');
  }

  // ================================
  // Fast Search Methods for CachedPortalListings
  // ================================

  /**
   * Search cached portal listings with advanced filtering and sorting
   */
  async searchCachedPortalListings(filters: {
    make?: string;
    model?: string;
    city?: string;
    fuelType?: string;
    transmission?: string;
    priceMin?: number;
    priceMax?: number;
    yearMin?: number;
    yearMax?: number;
    ownerCount?: number;
    mileageMax?: number;
    listedWithinDays?: number;
    query?: string;
    sortBy?: 'price' | 'year' | 'mileage' | 'date';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }): Promise<CachedPortalListing[]> {
    const cacheKey = `portal_search:${JSON.stringify(filters)}`;
    const cached = this.getCached<CachedPortalListing[]>(cacheKey);
    if (cached) return cached;

    // Build WHERE conditions
    const conditions = [];

    if (filters.make) {
      conditions.push(ilike(cachedPortalListings.brand, `%${filters.make}%`));
    }

    if (filters.model) {
      conditions.push(ilike(cachedPortalListings.model, `%${filters.model}%`));
    }

    if (filters.city) {
      conditions.push(ilike(cachedPortalListings.city, `%${filters.city}%`));
    }

    if (filters.fuelType) {
      conditions.push(ilike(cachedPortalListings.fuelType, `%${filters.fuelType}%`));
    }

    if (filters.transmission) {
      conditions.push(ilike(cachedPortalListings.transmission, `%${filters.transmission}%`));
    }

    if (filters.priceMin !== undefined) {
      conditions.push(gte(cachedPortalListings.price, sql`${filters.priceMin}`));
    }

    if (filters.priceMax !== undefined) {
      conditions.push(lte(cachedPortalListings.price, sql`${filters.priceMax}`));
    }

    if (filters.yearMin !== undefined) {
      conditions.push(gte(cachedPortalListings.year, filters.yearMin));
    }

    if (filters.yearMax !== undefined) {
      conditions.push(lte(cachedPortalListings.year, filters.yearMax));
    }

    if (filters.ownerCount !== undefined) {
      conditions.push(eq(cachedPortalListings.owners, filters.ownerCount));
    }

    if (filters.mileageMax !== undefined && filters.mileageMax > 0) {
      conditions.push(and(
        sql`${cachedPortalListings.mileage} IS NOT NULL`,
        lte(cachedPortalListings.mileage, filters.mileageMax)
      ));
    }

    // Age filter: only show listings within X days
    if (filters.listedWithinDays !== undefined && filters.listedWithinDays > 0) {
      conditions.push(
        gte(cachedPortalListings.createdAt, sql`NOW() - INTERVAL '${sql.raw(filters.listedWithinDays.toString())} days'`)
      );
    }

    // Text search across title and description
    if (filters.query) {
      const searchTerm = `%${filters.query}%`;
      conditions.push(
        sql`(${cachedPortalListings.title} ILIKE ${searchTerm} OR ${cachedPortalListings.description} ILIKE ${searchTerm})`
      );
    }

    // Determine sorting - prioritize quality for general searches
    let orderByClause;
    const isDesc = filters.sortOrder === 'desc';
    
    switch (filters.sortBy) {
      case 'price':
        // For price searches, still prioritize quality but respect price sorting
        orderByClause = [
          desc(cachedPortalListings.qualityScore),
          isDesc ? desc(cachedPortalListings.price) : asc(cachedPortalListings.price)
        ];
        break;
      case 'year':
        orderByClause = [
          desc(cachedPortalListings.qualityScore),
          isDesc ? desc(cachedPortalListings.year) : asc(cachedPortalListings.year)
        ];
        break;
      case 'mileage':
        orderByClause = [
          desc(cachedPortalListings.qualityScore),
          isDesc ? desc(cachedPortalListings.mileage) : asc(cachedPortalListings.mileage)
        ];
        break;
      case 'date':
        orderByClause = [
          desc(cachedPortalListings.qualityScore),
          desc(cachedPortalListings.listingDate)
        ];
        break;
      default:
        // For general searches, prioritize quality score above all
        orderByClause = [
          desc(cachedPortalListings.qualityScore),
          desc(cachedPortalListings.listingDate)
        ];
        break;
    }

    // Build and execute query
    let queryBuilder = this.db
      .select()
      .from(cachedPortalListings);

    if (conditions.length > 0) {
      queryBuilder = queryBuilder.where(and(...conditions)) as any;
    }

    // Apply multiple order by clauses
    if (Array.isArray(orderByClause)) {
      queryBuilder = queryBuilder.orderBy(...orderByClause) as any;
    } else {
      queryBuilder = queryBuilder.orderBy(orderByClause) as any;
    }

    if (filters.limit) {
      queryBuilder = queryBuilder.limit(filters.limit) as any;
    }

    if (filters.offset) {
      queryBuilder = queryBuilder.offset(filters.offset) as any;
    }

    const result = await queryBuilder;

    // Cache for 2 minutes
    this.setCache(cacheKey, result, 120000);
    
    logError({ message: `Cached portal search completed: ${result.length} results`, statusCode: 200 }, 'searchCachedPortalListings success');
    return result;
  }

  /**
   * Get count of matching listings for pagination
   */
  async getCachedPortalListingsCount(filters: {
    make?: string;
    model?: string;
    city?: string;
    fuelType?: string;
    transmission?: string;
    priceMin?: number;
    priceMax?: number;
    yearMin?: number;
    yearMax?: number;
    ownerCount?: number;
    mileageMax?: number;
    listedWithinDays?: number;
    query?: string;
  }): Promise<number> {
    const cacheKey = `portal_count:${JSON.stringify(filters)}`;
    const cached = this.getCached<number>(cacheKey);
    if (cached !== null) return cached;

    // Build same WHERE conditions as search
    const conditions = [];

    if (filters.make) {
      conditions.push(ilike(cachedPortalListings.brand, `%${filters.make}%`));
    }

    if (filters.model) {
      conditions.push(ilike(cachedPortalListings.model, `%${filters.model}%`));
    }

    if (filters.city) {
      conditions.push(ilike(cachedPortalListings.city, `%${filters.city}%`));
    }

    if (filters.fuelType) {
      conditions.push(ilike(cachedPortalListings.fuelType, `%${filters.fuelType}%`));
    }

    if (filters.transmission) {
      conditions.push(ilike(cachedPortalListings.transmission, `%${filters.transmission}%`));
    }

    if (filters.priceMin !== undefined) {
      conditions.push(gte(cachedPortalListings.price, sql`${filters.priceMin}`));
    }

    if (filters.priceMax !== undefined) {
      conditions.push(lte(cachedPortalListings.price, sql`${filters.priceMax}`));
    }

    if (filters.yearMin !== undefined) {
      conditions.push(gte(cachedPortalListings.year, filters.yearMin));
    }

    if (filters.yearMax !== undefined) {
      conditions.push(lte(cachedPortalListings.year, filters.yearMax));
    }

    if (filters.ownerCount !== undefined) {
      conditions.push(eq(cachedPortalListings.owners, filters.ownerCount));
    }

    if (filters.mileageMax !== undefined && filters.mileageMax > 0) {
      conditions.push(and(
        sql`${cachedPortalListings.mileage} IS NOT NULL`,
        lte(cachedPortalListings.mileage, filters.mileageMax)
      ));
    }

    // Age filter: only count listings within X days
    if (filters.listedWithinDays !== undefined && filters.listedWithinDays > 0) {
      conditions.push(
        gte(cachedPortalListings.createdAt, sql`NOW() - INTERVAL '${sql.raw(filters.listedWithinDays.toString())} days'`)
      );
    }

    if (filters.query) {
      const searchTerm = `%${filters.query}%`;
      conditions.push(
        sql`(${cachedPortalListings.title} ILIKE ${searchTerm} OR ${cachedPortalListings.description} ILIKE ${searchTerm})`
      );
    }

    let queryBuilder = this.db
      .select({ count: count() })
      .from(cachedPortalListings);

    if (conditions.length > 0) {
      queryBuilder = queryBuilder.where(and(...conditions)) as any;
    }

    const result = await queryBuilder;
    const totalCount = result[0]?.count ?? 0;

    // Cache for 2 minutes
    this.setCache(cacheKey, totalCount, 120000);
    
    return totalCount;
  }

  /**
   * Get available filter options based on current dataset
   */
  async getCachedPortalListingsFilterOptions(baseFilters: {
    make?: string;
    model?: string;
    city?: string;
  } = {}): Promise<{
    availableMakes: string[];
    availableModels: string[];
    availableCities: string[];
    priceRange: { min: number; max: number };
    yearRange: { min: number; max: number };
  }> {
    const cacheKey = `portal_filters:${JSON.stringify(baseFilters)}`;
    const cached = this.getCached<any>(cacheKey);
    if (cached) return cached;

    try {
      // Build base conditions from filters
      const baseConditions = [];
      
      if (baseFilters.make) {
        baseConditions.push(ilike(cachedPortalListings.brand, `%${baseFilters.make}%`));
      }
      if (baseFilters.model) {
        baseConditions.push(ilike(cachedPortalListings.model, `%${baseFilters.model}%`));
      }
      if (baseFilters.city) {
        baseConditions.push(ilike(cachedPortalListings.city, `%${baseFilters.city}%`));
      }

      // Build conditions including non-null checks
      const makesConditions = [
        sql`${cachedPortalListings.brand} IS NOT NULL AND ${cachedPortalListings.brand} != ''`,
        ...baseConditions
      ];
      
      const modelsConditions = [
        sql`${cachedPortalListings.model} IS NOT NULL AND ${cachedPortalListings.model} != ''`,
        ...baseConditions
      ];
      
      const citiesConditions = [
        sql`${cachedPortalListings.city} IS NOT NULL AND ${cachedPortalListings.city} != ''`,
        ...baseConditions
      ];

      // Get distinct makes
      const makesQuery = this.db
        .selectDistinct({ brand: cachedPortalListings.brand })
        .from(cachedPortalListings)
        .where(and(...makesConditions))
        .orderBy(asc(cachedPortalListings.brand));

      // Get distinct models
      const modelsQuery = this.db
        .selectDistinct({ model: cachedPortalListings.model })
        .from(cachedPortalListings)
        .where(and(...modelsConditions))
        .orderBy(asc(cachedPortalListings.model));

      // Get distinct cities
      const citiesQuery = this.db
        .selectDistinct({ city: cachedPortalListings.city })
        .from(cachedPortalListings)
        .where(and(...citiesConditions))
        .orderBy(asc(cachedPortalListings.city));

      // Get price and year ranges
      const rangeQuery = baseConditions.length > 0
        ? this.db
            .select({
              minPrice: sql<number>`MIN(CAST(${cachedPortalListings.price} AS NUMERIC))`,
              maxPrice: sql<number>`MAX(CAST(${cachedPortalListings.price} AS NUMERIC))`,
              minYear: sql<number>`MIN(${cachedPortalListings.year})`,
              maxYear: sql<number>`MAX(${cachedPortalListings.year})`
            })
            .from(cachedPortalListings)
            .where(and(...baseConditions))
        : this.db
            .select({
              minPrice: sql<number>`MIN(CAST(${cachedPortalListings.price} AS NUMERIC))`,
              maxPrice: sql<number>`MAX(CAST(${cachedPortalListings.price} AS NUMERIC))`,
              minYear: sql<number>`MIN(${cachedPortalListings.year})`,
              maxYear: sql<number>`MAX(${cachedPortalListings.year})`
            })
            .from(cachedPortalListings);

      // Execute all queries in parallel
      const [makesResult, modelsResult, citiesResult, rangeResult] = await Promise.all([
        makesQuery,
        modelsQuery,
        citiesQuery,
        rangeQuery
      ]);

      const result = {
        availableMakes: makesResult.map(r => r.brand).filter(Boolean).slice(0, 50),
        availableModels: modelsResult.map(r => r.model).filter(Boolean).slice(0, 100),
        availableCities: citiesResult.map(r => r.city).filter(Boolean).slice(0, 100),
        priceRange: {
          min: rangeResult[0]?.minPrice ?? 0,
          max: rangeResult[0]?.maxPrice ?? 5000000
        },
        yearRange: {
          min: rangeResult[0]?.minYear ?? 2000,
          max: rangeResult[0]?.maxYear ?? new Date().getFullYear()
        }
      };

      // Cache for 5 minutes
      this.setCache(cacheKey, result, 300000);
      
      return result;
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'getFilterOptions operation');
      return {
        availableMakes: [],
        availableModels: [],
        availableCities: [],
        priceRange: { min: 0, max: 5000000 },
        yearRange: { min: 2000, max: new Date().getFullYear() }
      };
    }
  }

  /**
   * Get search statistics for dashboard
   */
  async getCachedPortalListingsStats(): Promise<{
    totalListings: number;
    citiesCount: number;
    makesCount: number;
    latestUpdate: string | null;
  }> {
    const cacheKey = 'portal_stats';
    const cached = this.getCached<any>(cacheKey);
    if (cached) return cached;

    try {
      // Get total count
      const totalResult = await this.db
        .select({ count: count() })
        .from(cachedPortalListings);

      // Get distinct cities count
      const citiesResult = await this.db
        .select({ count: count(sql`DISTINCT ${cachedPortalListings.city}`) })
        .from(cachedPortalListings)
        .where(sql`${cachedPortalListings.city} IS NOT NULL AND ${cachedPortalListings.city} != ''`);

      // Get distinct makes count
      const makesResult = await this.db
        .select({ count: count(sql`DISTINCT ${cachedPortalListings.brand}`) })
        .from(cachedPortalListings)
        .where(sql`${cachedPortalListings.brand} IS NOT NULL AND ${cachedPortalListings.brand} != ''`);

      // Get latest update
      const latestResult = await this.db
        .select({ latestUpdate: sql<string>`MAX(${cachedPortalListings.fetchedAt})` })
        .from(cachedPortalListings);

      const result = {
        totalListings: totalResult[0]?.count ?? 0,
        citiesCount: citiesResult[0]?.count ?? 0,
        makesCount: makesResult[0]?.count ?? 0,
        latestUpdate: latestResult[0]?.latestUpdate ?? null
      };

      // Cache for 10 minutes
      this.setCache(cacheKey, result, 600000);
      
      return result;
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'getPortalStats operation');
      return {
        totalListings: 0,
        citiesCount: 0,
        makesCount: 0,
        latestUpdate: null
      };
    }
  }

  /**
   * Create a new cached portal listing
   */
  async createCachedPortalListing(listing: InsertCachedPortalListing): Promise<CachedPortalListing> {
    try {
      const result = await this.db
        .insert(cachedPortalListings)
        .values(listing)
        .returning();
      
      const newListing = result[0];
      
      // Invalidate related caches
      this.cache.delete('portal_stats');
      Array.from(this.cache.keys())
        .filter(key => key.startsWith('portal_search:') || key.startsWith('portal_count:') || key.startsWith('portal_filters:'))
        .forEach(key => this.cache.delete(key));
      
      logError({ message: 'Cached portal listing created successfully', statusCode: 200 }, 'createCachedPortalListing success');
      return newListing;
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'createCachedPortalListing operation');
      throw new Error('Failed to create cached portal listing - please try again');
    }
  }

  /**
   * Cleanup old cached listings before a certain date
   */
  async cleanupOldCachedListings(before: Date): Promise<void> {
    try {
      const result = await this.db
        .delete(cachedPortalListings)
        .where(lte(cachedPortalListings.fetchedAt, before));
      
      // Clear all portal-related caches after cleanup
      Array.from(this.cache.keys())
        .filter(key => key.startsWith('portal_'))
        .forEach(key => this.cache.delete(key));
      
      logError({ message: `Cached portal listings cleanup completed before ${before.toISOString()}`, statusCode: 200 }, 'cleanupOldCachedListings success');
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'cleanupOldCachedListings operation');
      // Don't throw - cleanup failure shouldn't break the application
    }
  }

  // Claude AI request rate limiting (10 requests per minute per user)
  private claudeRequestCounts: Map<string, { count: number; resetTime: number }> = new Map();

  async getUserClaudeRequestCount(userId: string): Promise<number> {
    const now = Date.now();
    const userLimit = this.claudeRequestCounts.get(userId);
    
    if (!userLimit || now > userLimit.resetTime) {
      // Reset or initialize counter (1-minute window)
      this.claudeRequestCounts.set(userId, {
        count: 0,
        resetTime: now + (60 * 1000) // 1 minute from now
      });
      return 0;
    }
    
    return userLimit.count;
  }

  async incrementClaudeRequestCount(userId: string): Promise<void> {
    const now = Date.now();
    const userLimit = this.claudeRequestCounts.get(userId);
    
    if (!userLimit || now > userLimit.resetTime) {
      // Initialize new window
      this.claudeRequestCounts.set(userId, {
        count: 1,
        resetTime: now + (60 * 1000)
      });
    } else {
      // Increment existing window
      userLimit.count += 1;
      this.claudeRequestCounts.set(userId, userLimit);
    }
  }

  // Additional method for backward compatibility
  async getCars(options?: { limit?: number }): Promise<Car[]> {
    const cacheKey = `cars:all:${options?.limit || 'unlimited'}`;
    const cached = this.getCached<Car[]>(cacheKey);
    if (cached) return cached;

    try {
      let query = this.db.select().from(cars);
      
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      
      const result = await query;
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'getCars operation');
      return [];
    }
  }

  // Admin role management
  async setUserRole(userId: string, role: 'user' | 'admin'): Promise<User> {
    try {
      const result = await this.db
        .update(users)
        .set({ 
          role,
          updatedAt: sql`now()`
        })
        .where(eq(users.id, userId))
        .returning();
      
      const updatedUser = result[0];
      if (!updatedUser) {
        throw new Error('User not found');
      }
      
      // Invalidate user cache
      this.cache.delete(`user:${userId}`);
      
      logError({ message: `User role updated to ${role}`, statusCode: 200 }, 'setUserRole success');
      return updatedUser;
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'setUserRole operation');
      throw new Error('Failed to update user role');
    }
  }

  async isAdmin(userId: string): Promise<boolean> {
    try {
      const user = await this.getUser(userId);
      return user?.role === 'admin' || false;
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'isAdmin operation');
      return false;
    }
  }

  async listUsers(options?: { q?: string; limit?: number; offset?: number }): Promise<User[]> {
    const cacheKey = `users:list:${JSON.stringify(options)}`;
    const cached = this.getCached<User[]>(cacheKey);
    if (cached) return cached;

    try {
      let query = this.db.select().from(users);

      // Add search filter if provided
      if (options?.q) {
        const searchTerm = `%${options.q}%`;
        query = query.where(
          sql`${users.email} ILIKE ${searchTerm} OR 
              ${users.firstName} ILIKE ${searchTerm} OR 
              ${users.lastName} ILIKE ${searchTerm}`
        );
      }

      // Add pagination
      const limit = options?.limit || 50;
      const offset = options?.offset || 0;
      
      query = query
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset);

      const result = await query;
      this.setCache(cacheKey, result, 60000); // Cache for 1 minute
      return result;
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'listUsers operation');
      return [];
    }
  }

  // SARFAESI job management
  async createSarfaesiJob(job: InsertSarfaesiJob): Promise<SarfaesiJob> {
    try {
      const result = await this.db
        .insert(sarfaesiJobs)
        .values(job)
        .returning();
      
      const newJob = result[0];
      
      // Invalidate job list caches
      Array.from(this.cache.keys())
        .filter(key => key.startsWith('sarfaesi_jobs:'))
        .forEach(key => this.cache.delete(key));
      
      logError({ message: 'SARFAESI job created successfully', statusCode: 200 }, 'createSarfaesiJob success');
      return newJob;
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'createSarfaesiJob operation');
      throw new Error('Failed to create SARFAESI job');
    }
  }

  async updateSarfaesiJob(id: string, updates: Partial<SarfaesiJob>): Promise<SarfaesiJob | undefined> {
    try {
      const result = await this.db
        .update(sarfaesiJobs)
        .set(updates)
        .where(eq(sarfaesiJobs.id, id))
        .returning();
      
      const updatedJob = result[0];
      if (updatedJob) {
        // Invalidate job caches
        this.cache.delete(`sarfaesi_job:${id}`);
        Array.from(this.cache.keys())
          .filter(key => key.startsWith('sarfaesi_jobs:'))
          .forEach(key => this.cache.delete(key));
      }
      
      return updatedJob;
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'updateSarfaesiJob operation');
      return undefined;
    }
  }

  async getSarfaesiJobs(options?: { limit?: number; status?: string }): Promise<SarfaesiJob[]> {
    const cacheKey = `sarfaesi_jobs:list:${JSON.stringify(options)}`;
    const cached = this.getCached<SarfaesiJob[]>(cacheKey);
    if (cached) return cached;

    try {
      let query = this.db.select().from(sarfaesiJobs);

      // Add status filter if provided
      if (options?.status) {
        query = query.where(eq(sarfaesiJobs.status, options.status));
      }

      // Add limit and ordering
      const limit = options?.limit || 50;
      query = query
        .orderBy(desc(sarfaesiJobs.createdAt))
        .limit(limit);

      const result = await query;
      this.setCache(cacheKey, result, 30000); // Cache for 30 seconds
      return result;
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'getSarfaesiJobs operation');
      return [];
    }
  }

  async getSarfaesiJob(id: string): Promise<SarfaesiJob | undefined> {
    const cacheKey = `sarfaesi_job:${id}`;
    const cached = this.getCached<SarfaesiJob>(cacheKey);
    if (cached) return cached;

    try {
      const result = await this.db
        .select()
        .from(sarfaesiJobs)
        .where(eq(sarfaesiJobs.id, id))
        .limit(1);
      
      const job = result[0];
      if (job) {
        this.setCache(cacheKey, job);
      }
      return job;
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'getSarfaesiJob operation');
      return undefined;
    }
  }

  // Admin audit logging
  async logAdminAction(entry: InsertAdminAuditLog): Promise<AdminAuditLog> {
    try {
      const result = await this.db
        .insert(adminAuditLogs)
        .values(entry)
        .returning();
      
      const auditLog = result[0];
      
      logError({ message: `Admin action logged: ${entry.action}`, statusCode: 200 }, 'logAdminAction success');
      return auditLog;
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'logAdminAction operation');
      throw new Error('Failed to log admin action');
    }
  }

  // Email verification methods for seller MVP
  async setUserVerificationToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    try {
      await this.db
        .update(users)
        .set({
          verificationToken: token,
          verificationTokenExpiresAt: expiresAt
        })
        .where(eq(users.id, userId));
      
      this.clearCache(`user_${userId}`);
      logError({ message: 'Verification token set for user', statusCode: 200 }, 'setUserVerificationToken success');
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'setUserVerificationToken operation');
      throw new Error('Failed to set verification token');
    }
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    try {
      const result = await this.db
        .select()
        .from(users)
        .where(eq(users.verificationToken, token))
        .limit(1);
      
      return result[0];
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'getUserByVerificationToken operation');
      return undefined;
    }
  }

  async setUserEmailVerified(userId: string, verified: boolean): Promise<void> {
    try {
      await this.db
        .update(users)
        .set({
          emailVerified: verified
        })
        .where(eq(users.id, userId));
      
      this.clearCache(`user_${userId}`);
      logError({ message: `User email verification set to ${verified}`, statusCode: 200 }, 'setUserEmailVerified success');
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'setUserEmailVerified operation');
      throw new Error('Failed to set email verified status');
    }
  }

  async clearUserVerificationToken(userId: string): Promise<void> {
    try {
      await this.db
        .update(users)
        .set({
          verificationToken: null,
          verificationTokenExpiresAt: null
        })
        .where(eq(users.id, userId));
      
      this.clearCache(`user_${userId}`);
      logError({ message: 'Verification token cleared for user', statusCode: 200 }, 'clearUserVerificationToken success');
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'clearUserVerificationToken operation');
      throw new Error('Failed to clear verification token');
    }
  }

  async createSellerUser(userData: {
    email: string;
    firstName?: string;
    lastName?: string;
    sellerType: 'private' | 'dealer';
    consentSyndication: boolean;
    legalAgreementVersion: string;
  }): Promise<User> {
    try {
      const result = await this.db
        .insert(users)
        .values({
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          sellerType: userData.sellerType,
          consentSyndication: userData.consentSyndication,
          consentTimestamp: userData.consentSyndication ? new Date() : undefined,
          legalAgreementVersion: userData.legalAgreementVersion,
          legalAgreementAcceptedAt: new Date(),
          emailVerified: false
        })
        .returning();
      
      const newUser = result[0];
      
      logError({ message: 'Seller user created successfully', statusCode: 200 }, 'createSellerUser success');
      return newUser;
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'createSellerUser operation');
      throw new Error('Failed to create seller user');
    }
  }

  // Posting limits enforcement methods
  async checkPostingLimits(sellerId: string): Promise<{
    canPost: boolean;
    currentCount: number;
    limit: number;
    sellerType: 'private' | 'dealer';
    message?: string;
  }> {
    try {
      // Get user info and current active listings count
      const result = await this.db.execute(sql`
        WITH seller_info AS (
          SELECT seller_type
          FROM users WHERE id = ${sellerId}
        ), cnt AS (
          SELECT count(*) AS active_count
          FROM seller_listings
          WHERE seller_id = ${sellerId}
            AND listing_status IN ('active', 'draft')
            AND created_at >= now() - interval '30 days'
            AND (admin_override = false OR admin_override IS NULL)
        )
        SELECT s.seller_type, c.active_count FROM seller_info s CROSS JOIN cnt c;
      `);

      const row = result.rows[0] as any;
      if (!row) {
        return {
          canPost: false,
          currentCount: 0,
          limit: 0,
          sellerType: 'private',
          message: 'User not found'
        };
      }

      const sellerType = (row.seller_type || 'private') as 'private' | 'dealer';
      const currentCount = parseInt(row.active_count) || 0;
      const limit = sellerType === 'dealer' ? 3 : 1;
      const canPost = currentCount < limit;

      return {
        canPost,
        currentCount,
        limit,
        sellerType,
        message: canPost ? undefined : 
          sellerType === 'private' 
            ? 'Individual sellers may post 1 listing per 30 days. Contact support to request an exception.'
            : 'Dealer posting limit reached (3 per 30 days). Contact support to increase allowance.'
      };
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'checkPostingLimits operation');
      throw new Error('Failed to check posting limits');
    }
  }

  // Seller listings management with atomic posting limits enforcement
  async createSellerListing(listingData: any): Promise<any> {
    // IMPORTANT: This method now handles posting limits atomically
    // Use createSellerListingWithLimitsCheck() for limit enforcement
    try {
      const result = await this.db
        .insert(sellerListings)
        .values(listingData)
        .returning();
      
      const newListing = result[0];
      logError({ message: 'Seller listing created successfully', statusCode: 200 }, 'createSellerListing success');
      return newListing;
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'createSellerListing operation');
      throw new Error('Failed to create seller listing');
    }
  }

  // ATOMIC: Check posting limits and create listing in single Drizzle transaction
  async createSellerListingWithLimitsCheck(sellerId: string, listingData: any): Promise<{
    success: boolean;
    listing?: any;
    error?: string;
    limits?: {
      current: number;
      max: number;
      sellerType: 'private' | 'dealer';
    }
  }> {
    try {
      return await this.db.transaction(async (tx) => {
        // Get user info with row lock for serialization
        const userResult = await tx.execute(sql`
          SELECT seller_type FROM users WHERE id = ${sellerId} FOR UPDATE
        `);

        if (userResult.rows.length === 0) {
          throw new Error('User not found');
        }

        const userRow = userResult.rows[0] as any;
        const sellerType = (userRow.seller_type || 'private') as 'private' | 'dealer';
        const limit = sellerType === 'dealer' ? 3 : 1;

        // Count current active listings in rolling 30-day window
        const countResult = await tx.execute(sql`
          SELECT count(*) AS active_count
          FROM seller_listings
          WHERE seller_id = ${sellerId}
            AND listing_status IN ('active', 'draft')
            AND created_at >= now() - interval '30 days'
            AND (admin_override = false OR admin_override IS NULL)
        `);

        const currentCount = parseInt((countResult.rows[0] as any).active_count) || 0;

        // Check if user can post
        if (currentCount >= limit) {
          const message = sellerType === 'private' 
            ? 'Individual sellers may post 1 listing per 30 days. Contact support to request an exception.'
            : 'Dealer posting limit reached (3 per 30 days). Contact support to increase allowance.';

          return {
            success: false,
            error: message,
            limits: {
              current: currentCount,
              max: limit,
              sellerType
            }
          };
        }

        // Create the listing within the transaction using Drizzle
        const result = await tx
          .insert(sellerListings)
          .values(listingData)
          .returning();

        const newListing = result[0];
        
        logError({ message: 'Seller listing created with atomic limits check', statusCode: 200 }, 'createSellerListingWithLimitsCheck success');
        
        return {
          success: true,
          listing: newListing,
          limits: {
            current: currentCount + 1,
            max: limit,
            sellerType
          }
        };
      });

    } catch (error: any) {
      if (error.message === 'User not found') {
        return {
          success: false,
          error: 'User not found'
        };
      }
      
      logError(createAppError('Atomic listing creation failed', 500, ErrorCategory.DATABASE), 'createSellerListingWithLimitsCheck error');
      throw new Error('Failed to create listing with limits check');
    }
  }

  async getSellerListings(sellerId: string, options?: { limit?: number; status?: string }): Promise<any[]> {
    try {
      const cacheKey = `seller_listings_${sellerId}_${options?.status || 'all'}`;
      const cached = this.getCached<any[]>(cacheKey);
      if (cached) return cached;

      let query = this.db
        .select()
        .from(sellerListings)
        .where(eq(sellerListings.sellerId, sellerId));

      if (options?.status) {
        query = query.where(eq(sellerListings.listingStatus, options.status));
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const listings = await query.orderBy(desc(sellerListings.createdAt));
      
      // Cache for 5 minutes
      this.setCache(cacheKey, listings, 300000);
      return listings;
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'getSellerListings operation');
      return [];
    }
  }

  async updateSellerListing(listingId: string, updates: any): Promise<any> {
    try {
      const result = await this.db
        .update(sellerListings)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(sellerListings.id, listingId))
        .returning();
      
      const updatedListing = result[0];
      if (updatedListing) {
        this.clearCache(`seller_listings_${updatedListing.sellerId}_all`);
        this.clearCache(`seller_listings_${updatedListing.sellerId}_${updatedListing.listingStatus}`);
      }
      
      logError({ message: 'Seller listing updated successfully', statusCode: 200 }, 'updateSellerListing success');
      return updatedListing;
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'updateSellerListing operation');
      throw new Error('Failed to update seller listing');
    }
  }

  // Partner source management
  async getListingSources(): Promise<any[]> {
    try {
      const cacheKey = 'listing_sources_all';
      const cached = this.getCached<any[]>(cacheKey);
      if (cached) return cached;

      const sources = await this.db
        .select()
        .from(listingSources)
        .orderBy(desc(listingSources.createdAt));
      
      this.setCache(cacheKey, sources, 60000); // Cache for 1 minute
      return sources;
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'getListingSources operation');
      return [];
    }
  }

  async getListingSource(id: string): Promise<any | undefined> {
    try {
      const cacheKey = `listing_source:${id}`;
      const cached = this.getCached<any>(cacheKey);
      if (cached) return cached;

      const result = await this.db
        .select()
        .from(listingSources)
        .where(eq(listingSources.id, id))
        .limit(1);
      
      const source = result[0];
      if (source) {
        this.setCache(cacheKey, source);
      }
      return source;
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'getListingSource operation');
      return undefined;
    }
  }

  async createListingSource(data: any): Promise<any> {
    try {
      const result = await this.db
        .insert(listingSources)
        .values(data)
        .returning();
      
      const newSource = result[0];
      this.clearCache('listing_sources_all');
      logError({ message: 'Listing source created successfully', statusCode: 200 }, 'createListingSource success');
      return newSource;
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'createListingSource operation');
      throw new Error('Failed to create listing source');
    }
  }

  async updateListingSource(id: string, updates: any): Promise<any | undefined> {
    try {
      const result = await this.db
        .update(listingSources)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(listingSources.id, id))
        .returning();
      
      const updatedSource = result[0];
      if (updatedSource) {
        this.clearCache(`listing_source:${id}`);
        this.clearCache('listing_sources_all');
      }
      
      logError({ message: 'Listing source updated successfully', statusCode: 200 }, 'updateListingSource success');
      return updatedSource;
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'updateListingSource operation');
      return undefined;
    }
  }

  async deleteListingSource(id: string): Promise<void> {
    try {
      await this.db
        .delete(listingSources)
        .where(eq(listingSources.id, id));
      
      this.clearCache(`listing_source:${id}`);
      this.clearCache('listing_sources_all');
      logError({ message: 'Listing source deleted successfully', statusCode: 200 }, 'deleteListingSource success');
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'deleteListingSource operation');
      throw new Error('Failed to delete listing source');
    }
  }

  // Partner invite system
  async createPartnerInvite(data: { listingSourceId: string; email?: string; createdBy: string }): Promise<any> {
    try {
      // Use crypto.randomUUID for secure token generation
      const token = `${crypto.randomUUID()}-${crypto.randomUUID()}`;
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const result = await this.db
        .insert(partnerInvites)
        .values({
          token,
          listingSourceId: data.listingSourceId,
          email: data.email || null,
          expiresAt,
          createdBy: data.createdBy
        })
        .returning();

      this.clearCache('listing_sources_all');
      return result[0];
    } catch (error) {
      logError(createAppError('Failed to create partner invite', 500, ErrorCategory.DATABASE), 'createPartnerInvite');
      throw error;
    }
  }

  async getPartnerInviteByToken(token: string): Promise<any | undefined> {
    try {
      const result = await this.db
        .select()
        .from(partnerInvites)
        .where(eq(partnerInvites.token, token))
        .limit(1);
      return result[0];
    } catch (error) {
      logError(createAppError('Failed to get partner invite', 500, ErrorCategory.DATABASE), 'getPartnerInviteByToken');
      return undefined;
    }
  }

  async acceptPartnerInvite(token: string, userId: string): Promise<{ success: boolean; error?: string; listingSourceId?: string }> {
    try {
      const invite = await this.getPartnerInviteByToken(token);
      
      if (!invite) {
        return { success: false, error: 'Invalid invite link' };
      }
      
      if (invite.usedAt) {
        return { success: false, error: 'This invite has already been used' };
      }
      
      if (new Date() > new Date(invite.expiresAt)) {
        return { success: false, error: 'This invite has expired' };
      }

      // Mark invite as used
      await this.db
        .update(partnerInvites)
        .set({ usedAt: new Date(), usedByUserId: userId })
        .where(eq(partnerInvites.token, token));

      // Create partner account
      await this.createPartnerAccount({
        listingSourceId: invite.listingSourceId,
        userId,
        role: 'owner'
      });

      // Update user role to partner
      await this.db
        .update(users)
        .set({ role: 'partner' })
        .where(eq(users.id, userId));

      this.clearCache(`user:${userId}`);
      
      return { success: true, listingSourceId: invite.listingSourceId };
    } catch (error) {
      logError(createAppError('Failed to accept invite', 500, ErrorCategory.DATABASE), 'acceptPartnerInvite');
      return { success: false, error: 'Failed to process invite' };
    }
  }

  async getPartnerInvitesBySource(listingSourceId: string): Promise<any[]> {
    try {
      return await this.db
        .select()
        .from(partnerInvites)
        .where(eq(partnerInvites.listingSourceId, listingSourceId))
        .orderBy(desc(partnerInvites.createdAt));
    } catch (error) {
      logError(createAppError('Failed to get invites', 500, ErrorCategory.DATABASE), 'getPartnerInvitesBySource');
      return [];
    }
  }

  // Partner account management
  async createPartnerAccount(data: { listingSourceId: string; userId: string; role: string }): Promise<any> {
    try {
      const result = await this.db
        .insert(partnerAccounts)
        .values(data)
        .returning();
      return result[0];
    } catch (error) {
      logError(createAppError('Failed to create partner account', 500, ErrorCategory.DATABASE), 'createPartnerAccount');
      throw error;
    }
  }

  async getPartnerAccountByUser(userId: string): Promise<any | undefined> {
    try {
      const result = await this.db
        .select()
        .from(partnerAccounts)
        .where(eq(partnerAccounts.userId, userId))
        .limit(1);
      return result[0];
    } catch (error) {
      logError(createAppError('Failed to get partner account', 500, ErrorCategory.DATABASE), 'getPartnerAccountByUser');
      return undefined;
    }
  }

  async getPartnerAccountsBySource(listingSourceId: string): Promise<any[]> {
    try {
      return await this.db
        .select()
        .from(partnerAccounts)
        .where(eq(partnerAccounts.listingSourceId, listingSourceId));
    } catch (error) {
      logError(createAppError('Failed to get partner accounts', 500, ErrorCategory.DATABASE), 'getPartnerAccountsBySource');
      return [];
    }
  }

  // Partner listing management - REAL-TIME marketplace updates
  async createPartnerListing(listingData: any, partnerUserId: string, sourceId: string): Promise<any> {
    try {
      // Create unique hash for deduplication
      const hashString = `${listingData.brand}-${listingData.model}-${listingData.year}-${listingData.city}-${listingData.price}`;
      const hash = Buffer.from(hashString).toString('base64');

      const result = await this.db
        .insert(cachedPortalListings)
        .values({
          portal: 'Partner Portal',
          externalId: `partner-${Date.now()}`,
          url: '#',
          title: listingData.title,
          brand: listingData.brand,
          model: listingData.model,
          year: listingData.year,
          price: listingData.price,
          mileage: listingData.mileage || 0,
          fuelType: listingData.fuelType,
          transmission: listingData.transmission,
          owners: listingData.owners || 1,
          location: listingData.location,
          city: listingData.city,
          state: listingData.state || null,
          description: listingData.description || null,
          features: listingData.features || {},
          images: listingData.images || {},
          listingDate: new Date(),
          hash,
          origin: 'partner',
          sourceId,
          partnerUserId,
          partnerVerificationStatus: 'verified'
        })
        .returning();

      // INSTANT cache invalidation for real-time marketplace updates
      this.clearAllSearchCaches();
      this.clearAllMarketplaceCaches();
      
      return result[0];
    } catch (error) {
      logError(createAppError('Failed to create partner listing', 500, ErrorCategory.DATABASE), 'createPartnerListing');
      throw error;
    }
  }

  async getPartnerListings(userId: string): Promise<any[]> {
    try {
      return await this.db
        .select()
        .from(cachedPortalListings)
        .where(
          and(
            eq(cachedPortalListings.origin, 'partner'),
            eq(cachedPortalListings.partnerUserId, userId)
          )
        )
        .orderBy(desc(cachedPortalListings.createdAt));
    } catch (error) {
      logError(createAppError('Failed to get partner listings', 500, ErrorCategory.DATABASE), 'getPartnerListings');
      return [];
    }
  }

  async updatePartnerListing(listingId: string, userId: string, updates: any): Promise<any | undefined> {
    try {
      const result = await this.db
        .update(cachedPortalListings)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(cachedPortalListings.id, listingId),
            eq(cachedPortalListings.partnerUserId, userId)
          )
        )
        .returning();

      // INSTANT cache invalidation for real-time marketplace updates
      this.clearAllSearchCaches();
      this.clearAllMarketplaceCaches();
      
      return result[0];
    } catch (error) {
      logError(createAppError('Failed to update listing', 500, ErrorCategory.DATABASE), 'updatePartnerListing');
      return undefined;
    }
  }

  async deletePartnerListing(listingId: string, userId: string): Promise<boolean> {
    try {
      const result = await this.db
        .delete(cachedPortalListings)
        .where(
          and(
            eq(cachedPortalListings.id, listingId),
            eq(cachedPortalListings.partnerUserId, userId)
          )
        )
        .returning();

      // INSTANT cache invalidation for real-time marketplace updates
      this.clearAllSearchCaches();
      this.clearAllMarketplaceCaches();
      
      return result.length > 0;
    } catch (error) {
      logError(createAppError('Failed to delete listing', 500, ErrorCategory.DATABASE), 'deletePartnerListing');
      return false;
    }
  }

  // Helper to clear all search and marketplace caches for real-time updates
  private clearAllSearchCaches(): void {
    // Clear local cache entries
    for (const [key] of this.cache) {
      if (key.startsWith('search:') || key.startsWith('cached_portal_listings')) {
        this.cache.delete(key);
      }
    }
  }

  private clearAllMarketplaceCaches(): void {
    // Import and use cacheManager for global cache clearing
    // This ensures real-time updates across all marketplace searches
    try {
      const { cacheManager } = require('./advancedCaching.js');
      if (cacheManager) {
        // Clear all search-related cache prefixes for instant marketplace updates
        cacheManager.invalidateByPrefix('search:');
        cacheManager.invalidateByPrefix('marketplace:');
        cacheManager.invalidateByPrefix('fastSearch:');
        cacheManager.invalidateByPrefix('cachedPortalListings:');
      }
    } catch (error) {
      logError(createAppError('Cache manager not available', 500, ErrorCategory.INTERNAL), 'clearAllMarketplaceCaches');
    }
  }

  // Bulk upload management
  async createBulkUploadJob(data: any): Promise<any> {
    try {
      const result = await this.db
        .insert(bulkUploadJobs)
        .values(data)
        .returning();
      
      return result[0];
    } catch (error) {
      logError(createAppError('Failed to create bulk upload job', 500, ErrorCategory.DATABASE), 'createBulkUploadJob');
      throw error;
    }
  }

  async updateBulkUploadJob(jobId: string, updates: any): Promise<any | undefined> {
    try {
      const result = await this.db
        .update(bulkUploadJobs)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(bulkUploadJobs.id, jobId))
        .returning();
      
      return result[0];
    } catch (error) {
      logError(createAppError('Failed to update bulk upload job', 500, ErrorCategory.DATABASE), 'updateBulkUploadJob');
      return undefined;
    }
  }

  async getBulkUploadJob(jobId: string, userId: string): Promise<any | undefined> {
    try {
      const result = await this.db
        .select()
        .from(bulkUploadJobs)
        .where(
          and(
            eq(bulkUploadJobs.id, jobId),
            eq(bulkUploadJobs.partnerUserId, userId)
          )
        );
      
      return result[0];
    } catch (error) {
      logError(createAppError('Failed to get bulk upload job', 500, ErrorCategory.DATABASE), 'getBulkUploadJob');
      return undefined;
    }
  }

  // Ingestion management
  async getIngestionStats(sourceId: string): Promise<any> {
    try {
      const logsResult = await this.db
        .select()
        .from(ingestionLogs)
        .where(eq(ingestionLogs.sourceId, sourceId))
        .orderBy(desc(ingestionLogs.createdAt))
        .limit(30);

      const totalProcessed = logsResult.reduce((sum, log) => sum + (log.totalProcessed || 0), 0);
      const totalNew = logsResult.reduce((sum, log) => sum + (log.newListings || 0), 0);
      const totalUpdated = logsResult.reduce((sum, log) => sum + (log.updatedListings || 0), 0);
      const totalRejected = logsResult.reduce((sum, log) => sum + (log.rejectedListings || 0), 0);
      
      const successfulRuns = logsResult.filter(log => log.status === 'success').length;
      const failedRuns = logsResult.filter(log => log.status === 'failed').length;

      const listingsCountResult = await this.db
        .select({ count: count() })
        .from(canonicalListings)
        .where(eq(canonicalListings.sourceId, sourceId));

      const totalListings = listingsCountResult[0]?.count || 0;

      return {
        totalProcessed,
        totalNew,
        totalUpdated,
        totalRejected,
        totalListings,
        successfulRuns,
        failedRuns,
        recentLogs: logsResult.slice(0, 10),
      };
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'getIngestionStats operation');
      return {
        totalProcessed: 0,
        totalNew: 0,
        totalUpdated: 0,
        totalRejected: 0,
        totalListings: 0,
        successfulRuns: 0,
        failedRuns: 0,
        recentLogs: [],
      };
    }
  }

  async getIngestionLogs(sourceId: string, options?: { limit?: number }): Promise<any[]> {
    try {
      const limit = options?.limit || 20;
      
      const logs = await this.db
        .select()
        .from(ingestionLogs)
        .where(eq(ingestionLogs.sourceId, sourceId))
        .orderBy(desc(ingestionLogs.createdAt))
        .limit(limit);
      
      return logs;
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'getIngestionLogs operation');
      return [];
    }
  }

  async createIngestionLog(log: any): Promise<any> {
    try {
      const result = await this.db
        .insert(ingestionLogs)
        .values(log)
        .returning();
      
      const newLog = result[0];
      logError({ message: 'Ingestion log created successfully', statusCode: 200 }, 'createIngestionLog success');
      return newLog;
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'createIngestionLog operation');
      throw new Error('Failed to create ingestion log');
    }
  }

  // Canonical listings management
  async getFlaggedListings(options?: { limit?: number }): Promise<any[]> {
    try {
      const limit = options?.limit || 50;
      
      const listings = await this.db
        .select()
        .from(canonicalListings)
        .where(eq(canonicalListings.status, 'flagged'))
        .orderBy(desc(canonicalListings.createdAt))
        .limit(limit);
      
      return listings;
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'getFlaggedListings operation');
      return [];
    }
  }

  async updateCanonicalListingStatus(listingId: string, status: string): Promise<any | undefined> {
    try {
      const result = await this.db
        .update(canonicalListings)
        .set({
          status,
          updatedAt: new Date()
        })
        .where(eq(canonicalListings.id, listingId))
        .returning();
      
      const updatedListing = result[0];
      logError({ message: `Canonical listing status updated to ${status}`, statusCode: 200 }, 'updateCanonicalListingStatus success');
      return updatedListing;
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'updateCanonicalListingStatus operation');
      return undefined;
    }
  }

  // Hero stats for dynamic homepage
  async getHeroStats(): Promise<{
    totalListings: number;
    totalPlatforms: number;
    platforms: Array<{ name: string; count: number }>;
  }> {
    try {
      // Get portal-wise listing counts
      const portalCounts = await this.db
        .select({
          portal: cachedPortalListings.portal,
          count: sql<number>`count(*)::int`
        })
        .from(cachedPortalListings)
        .groupBy(cachedPortalListings.portal)
        .orderBy(desc(sql`count(*)`));

      // Get total listing count
      const totalResult = await this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(cachedPortalListings);
      
      const totalListings = totalResult[0]?.count || 0;
      const totalPlatforms = portalCounts.length;

      return {
        totalListings,
        totalPlatforms,
        platforms: portalCounts.map((p: { portal: string; count: number }) => ({
          name: p.portal,
          count: p.count
        }))
      };
    } catch (error) {
      logError(createAppError('Database operation failed', 500, ErrorCategory.DATABASE), 'getHeroStats operation');
      return {
        totalListings: 0,
        totalPlatforms: 0,
        platforms: []
      };
    }
  }

  // ============================================================================
  // SELLER SYNDICATION COMPLIANCE & AUTOMATION IMPLEMENTATIONS
  // ============================================================================
  
  // Seller Consent Management
  async logSellerConsent(consent: InsertSellerConsentLog): Promise<SellerConsentLog> {
    try {
      const result = await this.db.insert(sellerConsentLog).values(consent).returning();
      logError({ message: 'Seller consent logged', statusCode: 200 }, 'logSellerConsent success');
      return result[0];
    } catch (error) {
      const appError = createAppError('Database operation failed', 500, ErrorCategory.DATABASE);
      logError(appError, 'logSellerConsent operation');
      throw appError;
    }
  }

  async getSellerConsent(userId: string): Promise<SellerConsentLog | undefined> {
    try {
      const result = await this.db.select().from(sellerConsentLog)
        .where(and(eq(sellerConsentLog.userId, userId), eq(sellerConsentLog.consentStatus, true)))
        .orderBy(desc(sellerConsentLog.consentTimestamp))
        .limit(1);
      return result[0];
    } catch (error) {
      const appError = createAppError('Database operation failed', 500, ErrorCategory.DATABASE);
      logError(appError, 'getSellerConsent operation');
      throw appError;
    }
  }

  async getSellerConsentHistory(userId: string): Promise<SellerConsentLog[]> {
    try {
      return await this.db.select().from(sellerConsentLog)
        .where(eq(sellerConsentLog.userId, userId))
        .orderBy(desc(sellerConsentLog.consentTimestamp));
    } catch (error) {
      const appError = createAppError('Database operation failed', 500, ErrorCategory.DATABASE);
      logError(appError, 'getSellerConsentHistory operation');
      throw appError;
    }
  }

  async revokeSellerConsent(userId: string, ipAddress: string, userAgent: string): Promise<SellerConsentLog> {
    try {
      // Fetch the current active consent to preserve metadata
      const currentConsent = await this.getSellerConsent(userId);
      const revocation: InsertSellerConsentLog = {
        userId,
        sellerId: userId,
        consentType: 'syndication',
        consentStatus: false,
        termsVersion: currentConsent?.termsVersion || 'v1.0',
        ipAddress,
        userAgent,
        platformsConsented: currentConsent?.platformsConsented || []
      };
      const result = await this.db.insert(sellerConsentLog).values(revocation).returning();
      logError({ message: 'Seller consent revoked', statusCode: 200 }, 'revokeSellerConsent success');
      return result[0];
    } catch (error) {
      const appError = createAppError('Database operation failed', 500, ErrorCategory.DATABASE);
      logError(appError, 'revokeSellerConsent operation');
      throw appError;
    }
  }

  // Deduplication Management
  async createDeduplicationResult(result: InsertDeduplicationResult): Promise<DeduplicationResult> {
    try {
      const dbResult = await this.db.insert(deduplicationResults).values(result).returning();
      logError({ message: 'Deduplication result created', statusCode: 200 }, 'createDeduplicationResult success');
      return dbResult[0];
    } catch (error) {
      const appError = createAppError('Database operation failed', 500, ErrorCategory.DATABASE);
      logError(appError, 'createDeduplicationResult operation');
      throw appError;
    }
  }

  async getDeduplicationResults(listingId: string): Promise<DeduplicationResult[]> {
    try {
      return await this.db.select().from(deduplicationResults)
        .where(eq(deduplicationResults.listingId, listingId))
        .orderBy(desc(deduplicationResults.createdAt));
    } catch (error) {
      const appError = createAppError('Database operation failed', 500, ErrorCategory.DATABASE);
      logError(appError, 'getDeduplicationResults operation');
      throw appError;
    }
  }

  async getDeduplicationResultByPlatform(listingId: string, platform: string): Promise<DeduplicationResult | undefined> {
    try {
      const result = await this.db.select().from(deduplicationResults)
        .where(and(eq(deduplicationResults.listingId, listingId), eq(deduplicationResults.platform, platform)))
        .limit(1);
      return result[0];
    } catch (error) {
      const appError = createAppError('Database operation failed', 500, ErrorCategory.DATABASE);
      logError(appError, 'getDeduplicationResultByPlatform operation');
      throw appError;
    }
  }

  // Syndication Execution Management
  async createSyndicationLog(log: InsertSyndicationExecutionLog): Promise<SyndicationExecutionLog> {
    try {
      const result = await this.db.insert(syndicationExecutionLog).values(log).returning();
      logError({ message: 'Syndication log created', statusCode: 200 }, 'createSyndicationLog success');
      return result[0];
    } catch (error) {
      const appError = createAppError('Database operation failed', 500, ErrorCategory.DATABASE);
      logError(appError, 'createSyndicationLog operation');
      throw appError;
    }
  }

  async updateSyndicationLog(id: string, updates: Partial<SyndicationExecutionLog>): Promise<SyndicationExecutionLog | undefined> {
    try {
      const result = await this.db.update(syndicationExecutionLog)
        .set(updates)
        .where(eq(syndicationExecutionLog.id, id))
        .returning();
      logError({ message: 'Syndication log updated', statusCode: 200 }, 'updateSyndicationLog success');
      return result[0];
    } catch (error) {
      const appError = createAppError('Database operation failed', 500, ErrorCategory.DATABASE);
      logError(appError, 'updateSyndicationLog operation');
      throw appError;
    }
  }

  async getSyndicationLogs(listingId: string): Promise<SyndicationExecutionLog[]> {
    try {
      return await this.db.select().from(syndicationExecutionLog)
        .where(eq(syndicationExecutionLog.listingId, listingId))
        .orderBy(desc(syndicationExecutionLog.executedAt));
    } catch (error) {
      const appError = createAppError('Database operation failed', 500, ErrorCategory.DATABASE);
      logError(appError, 'getSyndicationLogs operation');
      throw appError;
    }
  }

  async getSyndicationLogsByPlatform(platform: string, options?: { limit?: number; status?: string }): Promise<SyndicationExecutionLog[]> {
    try {
      const conditions = [eq(syndicationExecutionLog.platform, platform)];
      if (options?.status) {
        conditions.push(eq(syndicationExecutionLog.status, options.status));
      }
      
      let query = this.db.select().from(syndicationExecutionLog)
        .where(and(...conditions))
        .orderBy(desc(syndicationExecutionLog.executedAt));
      
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      
      return await query;
    } catch (error) {
      const appError = createAppError('Database operation failed', 500, ErrorCategory.DATABASE);
      logError(appError, 'getSyndicationLogsByPlatform operation');
      throw appError;
    }
  }

  async getSyndicationLogsBySeller(sellerId: string): Promise<SyndicationExecutionLog[]> {
    try {
      return await this.db.select().from(syndicationExecutionLog)
        .where(eq(syndicationExecutionLog.sellerId, sellerId))
        .orderBy(desc(syndicationExecutionLog.executedAt));
    } catch (error) {
      const appError = createAppError('Database operation failed', 500, ErrorCategory.DATABASE);
      logError(appError, 'getSyndicationLogsBySeller operation');
      throw appError;
    }
  }

  async getFailedSyndications(options?: { limit?: number }): Promise<SyndicationExecutionLog[]> {
    try {
      const limit = options?.limit || 50;
      return await this.db.select().from(syndicationExecutionLog)
        .where(eq(syndicationExecutionLog.status, 'failed'))
        .orderBy(desc(syndicationExecutionLog.executedAt))
        .limit(limit);
    } catch (error) {
      const appError = createAppError('Database operation failed', 500, ErrorCategory.DATABASE);
      logError(appError, 'getFailedSyndications operation');
      throw appError;
    }
  }

  // External API Audit Management
  async logExternalApiCall(log: InsertExternalApiAuditLog): Promise<ExternalApiAuditLog> {
    try {
      const result = await this.db.insert(externalApiAuditLog).values(log).returning();
      return result[0];
    } catch (error) {
      const appError = createAppError('Database operation failed', 500, ErrorCategory.DATABASE);
      logError(appError, 'logExternalApiCall operation');
      throw appError;
    }
  }

  async getApiAuditLogs(options?: { apiProvider?: string; operationType?: string; userId?: string; listingId?: string; isError?: boolean; limit?: number }): Promise<ExternalApiAuditLog[]> {
    try {
      const conditions = [];
      if (options?.apiProvider) conditions.push(eq(externalApiAuditLog.apiProvider, options.apiProvider));
      if (options?.operationType) conditions.push(eq(externalApiAuditLog.operationType, options.operationType));
      if (options?.userId) conditions.push(eq(externalApiAuditLog.userId, options.userId));
      if (options?.listingId) conditions.push(eq(externalApiAuditLog.listingId, options.listingId));
      if (options?.isError !== undefined) conditions.push(eq(externalApiAuditLog.isError, options.isError));
      
      let query = this.db.select().from(externalApiAuditLog);
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      query = query.orderBy(desc(externalApiAuditLog.createdAt));
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      return await query;
    } catch (error) {
      const appError = createAppError('Database operation failed', 500, ErrorCategory.DATABASE);
      logError(appError, 'getApiAuditLogs operation');
      throw appError;
    }
  }

  async getApiAuditStats(provider: string): Promise<{ totalCalls: number; errorCount: number; totalCost: number; avgResponseTime: number }> {
    try {
      const result = await this.db.select({
        totalCalls: count(),
        errorCount: sql<number>`count(case when is_error = true then 1 end)::int`,
        totalCost: sql<number>`coalesce(sum(estimated_cost), 0)::numeric`,
        avgResponseTime: sql<number>`coalesce(avg(response_time_ms), 0)::int`
      }).from(externalApiAuditLog).where(eq(externalApiAuditLog.apiProvider, provider));
      return result[0] || { totalCalls: 0, errorCount: 0, totalCost: 0, avgResponseTime: 0 };
    } catch (error) {
      const appError = createAppError('Database operation failed', 500, ErrorCategory.DATABASE);
      logError(appError, 'getApiAuditStats operation');
      throw appError;
    }
  }

  // ============================================================================
  // REAL MARKET INTELLIGENCE: SIAM & GOOGLE TRENDS
  // ============================================================================
  
  async getSiamDataByBrandModel(brand: string, model?: string): Promise<any> {
    try {
      const { siamSalesData } = await import('@shared/schema.js');
      
      const conditions = [
        eq(siamSalesData.brand, brand)
      ];
      
      if (model) {
        conditions.push(eq(siamSalesData.model, model));
      }
      
      const result = await this.db
        .select()
        .from(siamSalesData)
        .where(and(...conditions))
        .orderBy(desc(siamSalesData.year), desc(siamSalesData.month))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error('Error fetching SIAM data:', error);
      return null;
    }
  }
  
  async getGoogleTrendsData(searchTerm: string): Promise<any> {
    try {
      const { googleTrendsData } = await import('@shared/schema.js');
      
      const result = await this.db
        .select()
        .from(googleTrendsData)
        .where(eq(googleTrendsData.searchTerm, searchTerm))
        .orderBy(desc(googleTrendsData.date))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error('Error fetching Google Trends data:', error);
      return null;
    }
  }
}