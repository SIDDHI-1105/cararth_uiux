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
  type InsertCachedPortalListing
} from "@shared/schema";
import type { IStorage } from "./storage.js";

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
  private db: ReturnType<typeof drizzle>;
  private cache: Map<string, { data: any; expiry: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required for DatabaseStorage');
    }
    
    const sql = neon(process.env.DATABASE_URL);
    this.db = drizzle(sql);
    console.log('✅ PostgreSQL Database Storage initialized');
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
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.email, username))
      .limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const cacheKey = `user:email:${email}`;
    const cached = this.getCached<User>(cacheKey);
    if (cached) return cached;

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
  }

  async createUser(user: InsertUser): Promise<User> {
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
  }

  async upsertUser(user: UpsertUser): Promise<User> {
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
  }

  // Optimized car operations with performance indexes
  async getCar(id: string): Promise<Car | undefined> {
    const cacheKey = `car:${id}`;
    const cached = this.getCached<Car>(cacheKey);
    if (cached) return cached;

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
  }

  async getCachedPortalListing(id: string): Promise<any | undefined> {
    const cacheKey = `portal_listing:${id}`;
    const cached = this.getCached<any>(cacheKey);
    if (cached) return cached;

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
  }

  async getAllCars(): Promise<Car[]> {
    const cacheKey = 'cars:all:active';
    const cached = this.getCached<Car[]>(cacheKey);
    if (cached) return cached;

    const result = await this.db
      .select()
      .from(cars)
      .where(eq(cars.isSold, false))
      .orderBy(desc(cars.createdAt))
      .limit(100);
    
    this.setCache(cacheKey, result, 60000); // 1 minute cache for active listings
    return result;
  }

  async getCarsBySeller(sellerId: string): Promise<Car[]> {
    const result = await this.db
      .select()
      .from(cars)
      .where(eq(cars.sellerId, sellerId))
      .orderBy(desc(cars.createdAt));
    
    return result;
  }

  async createCar(car: InsertCar): Promise<Car> {
    const result = await this.db
      .insert(cars)
      .values(car)
      .returning();
    
    const newCar = result[0];
    this.setCache(`car:${newCar.id}`, newCar);
    
    // Invalidate related caches
    this.cache.delete('cars:all:active');
    
    return newCar;
  }

  async updateCar(id: string, updates: Partial<Car>): Promise<Car | undefined> {
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
    
    console.log(`🔍 PostgreSQL search: ${result.length} results for filters:`, filters);
    return result;
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
    
    console.log(`🚀 Optimized search: ${carResults.length}/${totalResult.count} results`);
    return result;
  }

  // Contact operations
  async createContact(contact: InsertContact): Promise<Contact> {
    const result = await this.db
      .insert(contacts)
      .values(contact)
      .returning();
    return result[0];
  }

  async getContactsForCar(carId: string): Promise<Contact[]> {
    const result = await this.db
      .select()
      .from(contacts)
      .where(eq(contacts.carId, carId))
      .orderBy(desc(contacts.createdAt));
    return result;
  }

  // Subscription operations
  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const result = await this.db
      .insert(subscriptions)
      .values(subscription)
      .returning();
    return result[0];
  }

  async getUserSubscription(userId: string): Promise<Subscription | undefined> {
    const cacheKey = `subscription:${userId}`;
    const cached = this.getCached<Subscription>(cacheKey);
    if (cached) return cached;

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
  }

  // Featured listing operations
  async createFeaturedListing(featured: InsertFeaturedListing): Promise<FeaturedListing> {
    const result = await this.db
      .insert(featuredListings)
      .values(featured)
      .returning();
    return result[0];
  }

  async updateCarFeatured(carId: string, isFeatured: boolean, expiresAt?: Date): Promise<void> {
    await this.db
      .update(cars)
      .set({
        isFeatured,
        featuredExpiresAt: expiresAt || null
      })
      .where(eq(cars.id, carId));
    
    // Invalidate cache
    this.cache.delete(`car:${carId}`);
  }

  // Messaging operations (stubs for now)
  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const result = await this.db
      .insert(conversations)
      .values(conversation)
      .returning();
    return result[0];
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    const result = await this.db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id))
      .limit(1);
    return result[0];
  }

  async getConversationByCarAndBuyer(carId: string, buyerId: string): Promise<Conversation | undefined> {
    const result = await this.db
      .select()
      .from(conversations)
      .where(and(
        eq(conversations.carId, carId),
        eq(conversations.buyerId, buyerId)
      ))
      .limit(1);
    return result[0];
  }

  async getConversationsForUser(userId: string, userType: 'buyer' | 'seller'): Promise<Conversation[]> {
    const condition = userType === 'buyer' 
      ? eq(conversations.buyerId, userId)
      : eq(conversations.sellerId, userId);
    
    const result = await this.db
      .select()
      .from(conversations)
      .where(condition)
      .orderBy(desc(conversations.lastMessageAt));
    return result;
  }

  async updateConversationLastMessage(conversationId: string): Promise<void> {
    await this.db
      .update(conversations)
      .set({ lastMessageAt: sql`now()`, updatedAt: sql`now()` })
      .where(eq(conversations.id, conversationId));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const result = await this.db
      .insert(messages)
      .values(message)
      .returning();
    return result[0];
  }

  async getMessagesInConversation(conversationId: string): Promise<Message[]> {
    const result = await this.db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt));
    return result;
  }

  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    await this.db
      .update(messages)
      .set({ isRead: true, readAt: sql`now()` })
      .where(and(
        eq(messages.conversationId, conversationId),
        eq(messages.senderId, userId)
      ));
  }

  async updateOfferStatus(messageId: string, status: string, userId: string): Promise<Message | undefined> {
    const result = await this.db
      .update(messages)
      .set({ offerStatus: status })
      .where(and(
        eq(messages.id, messageId),
        eq(messages.senderId, userId)
      ))
      .returning();
    return result[0];
  }

  async createConversationBlock(block: InsertConversationBlock): Promise<ConversationBlock> {
    const result = await this.db
      .insert(conversationBlocks)
      .values(block)
      .returning();
    return result[0];
  }

  async getSellerContactInfo(sellerId: string): Promise<any> {
    const user = await this.getUser(sellerId);
    if (!user) return null;
    
    return {
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      email: user.email,
      phone: user.phone
    };
  }

  // Subscription tier management
  async checkUserSearchLimit(userId: string): Promise<{ canSearch: boolean; searchesLeft: number; resetDate: Date }> {
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
  }

  async incrementUserSearchCount(userId: string): Promise<void> {
    await this.db
      .update(users)
      .set({ 
        searchCount: sql`${users.searchCount} + 1`,
        updatedAt: sql`now()`
      })
      .where(eq(users.id, userId));
    
    // Invalidate user cache
    this.cache.delete(`user:${userId}`);
  }

  async updateUserSubscriptionTier(userId: string, tier: 'free' | 'pro_seller' | 'pro_buyer' | 'superhero'): Promise<User> {
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
  }

  // Phone verification operations
  async createPhoneVerification(verification: InsertPhoneVerification): Promise<PhoneVerification> {
    const result = await this.db
      .insert(phoneVerifications)
      .values(verification)
      .returning();
    return result[0];
  }

  async verifyPhoneCode(userId: string, code: string): Promise<boolean> {
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
  }

  async markPhoneAsVerified(userId: string): Promise<void> {
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
  }

  // Search activity tracking
  async logUserSearchActivity(activity: InsertUserSearchActivity): Promise<UserSearchActivity> {
    const result = await this.db
      .insert(userSearchActivity)
      .values(activity)
      .returning();
    return result[0];
  }

  // Anonymous search activity tracking for 30-day rolling window
  async logAnonymousSearch(activity: InsertAnonymousSearchActivity): Promise<AnonymousSearchActivity> {
    const result = await this.db
      .insert(anonymousSearchActivity)
      .values(activity)
      .returning();
    return result[0];
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
    console.log('🧹 Cache cleared');
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
    
    console.log(`🔍 Cached portal search: ${result.length} results for filters:`, filters);
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
      console.error('❌ Failed to get filter options:', error);
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
      console.error('❌ Failed to get portal stats:', error);
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
    
    console.log(`✅ Created cached portal listing: ${newListing.title}`);
    return newListing;
  }

  /**
   * Cleanup old cached listings before a certain date
   */
  async cleanupOldCachedListings(before: Date): Promise<void> {
    const result = await this.db
      .delete(cachedPortalListings)
      .where(lte(cachedPortalListings.fetchedAt, before));
    
    // Clear all portal-related caches after cleanup
    Array.from(this.cache.keys())
      .filter(key => key.startsWith('portal_'))
      .forEach(key => this.cache.delete(key));
    
    console.log(`🧹 Cleaned up cached portal listings before ${before.toISOString()}`);
  }
}