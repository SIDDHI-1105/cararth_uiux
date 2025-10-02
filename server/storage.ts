import { 
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
  type SarfaesiJob,
  type InsertSarfaesiJob,
  type AdminAuditLog,
  type InsertAdminAuditLog
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  // OAuth operations for authentication
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Car operations
  getCar(id: string): Promise<Car | undefined>;
  getAllCars(): Promise<Car[]>;
  getCarsBySeller(sellerId: string): Promise<Car[]>;
  createCar(car: InsertCar): Promise<Car>;
  updateCar(id: string, updates: Partial<Car>): Promise<Car | undefined>;
  searchCars(filters: {
    brand?: string;
    priceMin?: number;
    priceMax?: number;
    city?: string;
    fuelType?: string;
    transmission?: string;
    yearMin?: number;
    yearMax?: number;
  }): Promise<Car[]>;
  
  // Contact operations
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(contactId: string, updates: Partial<Contact>): Promise<Contact | null>;
  getContactsForCar(carId: string): Promise<Contact[]>;
  getContactsForSeller(sellerId: string): Promise<Contact[]>;
  
  // Premium subscription operations
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  getUserSubscription(userId: string): Promise<Subscription | undefined>;
  
  // Featured listing operations
  createFeaturedListing(featured: InsertFeaturedListing): Promise<FeaturedListing>;
  updateCarFeatured(carId: string, isFeatured: boolean, expiresAt?: Date): Promise<void>;
  
  // Messaging operations
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversation(id: string): Promise<Conversation | undefined>;
  getConversationByCarAndBuyer(carId: string, buyerId: string): Promise<Conversation | undefined>;
  getConversationsForUser(userId: string, userType: 'buyer' | 'seller'): Promise<Conversation[]>;
  updateConversationLastMessage(conversationId: string): Promise<void>;
  
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesInConversation(conversationId: string): Promise<Message[]>;
  markMessagesAsRead(conversationId: string, userId: string): Promise<void>;
  updateOfferStatus(messageId: string, status: string, userId: string): Promise<Message | undefined>;
  
  createConversationBlock(block: InsertConversationBlock): Promise<ConversationBlock>;
  
  // Enhanced user operations for messaging
  getSellerContactInfo(sellerId: string): Promise<any>;
  
  // Anonymous search tracking for 30-day rolling window
  logAnonymousSearch(activity: InsertAnonymousSearchActivity): Promise<AnonymousSearchActivity>;
  getAnonymousSearchCountSince(visitorId: string, since: Date): Promise<number>;
  pruneAnonymousSearches(before: Date): Promise<void>;
  
  // Subscription tier management
  checkUserSearchLimit(userId: string): Promise<{ canSearch: boolean; searchesLeft: number; resetDate: Date }>;
  incrementUserSearchCount(userId: string): Promise<void>;
  updateUserSubscriptionTier(userId: string, tier: 'free' | 'pro_seller' | 'pro_buyer' | 'superhero'): Promise<User>;
  
  // Phone verification operations
  createPhoneVerification(verification: InsertPhoneVerification): Promise<PhoneVerification>;
  verifyPhoneCode(userId: string, code: string): Promise<boolean>;
  markPhoneAsVerified(userId: string): Promise<void>;
  
  // Search activity tracking
  logUserSearchActivity(activity: InsertUserSearchActivity): Promise<UserSearchActivity>;
  
  // Claude AI rate limiting
  getUserClaudeRequestCount(userId: string): Promise<number>;
  incrementClaudeRequestCount(userId: string): Promise<void>;
  
  // Additional methods for backward compatibility
  getCars(options?: { limit?: number }): Promise<Car[]>;
  
  // Admin role management
  setUserRole(userId: string, role: 'user' | 'admin'): Promise<User>;
  isAdmin(userId: string): Promise<boolean>;
  listUsers(options?: { q?: string; limit?: number; offset?: number }): Promise<User[]>;
  
  // SARFAESI job management
  createSarfaesiJob(job: InsertSarfaesiJob): Promise<SarfaesiJob>;
  updateSarfaesiJob(id: string, updates: Partial<SarfaesiJob>): Promise<SarfaesiJob | undefined>;
  getSarfaesiJobs(options?: { limit?: number; status?: string }): Promise<SarfaesiJob[]>;
  getSarfaesiJob(id: string): Promise<SarfaesiJob | undefined>;
  
  // Admin audit logging
  logAdminAction(entry: InsertAdminAuditLog): Promise<AdminAuditLog>;

  // Email verification methods for seller MVP
  setUserVerificationToken(userId: string, token: string, expiresAt: Date): Promise<void>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  setUserEmailVerified(userId: string, verified: boolean): Promise<void>;
  clearUserVerificationToken(userId: string): Promise<void>;
  
  // Seller registration methods
  createSellerUser(userData: {
    email: string;
    firstName?: string;
    lastName?: string;
    sellerType: 'private' | 'dealer';
    consentSyndication: boolean;
    legalAgreementVersion: string;
  }): Promise<User>;

  // Posting limits enforcement methods
  checkPostingLimits(sellerId: string): Promise<{
    canPost: boolean;
    currentCount: number;
    limit: number;
    sellerType: 'private' | 'dealer';
    message?: string;
  }>;
  
  // Seller listings management
  createSellerListing(listingData: any): Promise<any>;
  getSellerListings(sellerId: string, options?: { limit?: number; status?: string }): Promise<any[]>;
  updateSellerListing(listingId: string, updates: any): Promise<any>;
  
  // Atomic listing creation with posting limits enforcement
  createSellerListingWithLimitsCheck(sellerId: string, listingData: any): Promise<{
    success: boolean;
    listing?: any;
    error?: string;
    limits?: {
      current: number;
      max: number;
      sellerType: 'private' | 'dealer';
    }
  }>;
  
  // Partner source management
  getListingSources(): Promise<any[]>;
  getListingSource(id: string): Promise<any | undefined>;
  createListingSource(data: any): Promise<any>;
  updateListingSource(id: string, updates: any): Promise<any | undefined>;
  deleteListingSource(id: string): Promise<void>;
  
  // Partner invite system
  createPartnerInvite(data: { listingSourceId: string; email?: string; createdBy: string }): Promise<any>;
  getPartnerInviteByToken(token: string): Promise<any | undefined>;
  acceptPartnerInvite(token: string, userId: string): Promise<{ success: boolean; error?: string; listingSourceId?: string }>;
  getPartnerInvitesBySource(listingSourceId: string): Promise<any[]>;
  
  // Partner account management
  createPartnerAccount(data: { listingSourceId: string; userId: string; role: string }): Promise<any>;
  getPartnerAccountByUser(userId: string): Promise<any | undefined>;
  getPartnerAccountsBySource(listingSourceId: string): Promise<any[]>;
  
  // Partner listing management
  createPartnerListing(listingData: any, partnerUserId: string, sourceId: string): Promise<any>;
  getPartnerListings(userId: string): Promise<any[]>;
  updatePartnerListing(listingId: string, userId: string, updates: any): Promise<any | undefined>;
  deletePartnerListing(listingId: string, userId: string): Promise<boolean>;
  
  // Bulk upload management
  createBulkUploadJob(data: any): Promise<any>;
  updateBulkUploadJob(jobId: string, updates: any): Promise<any | undefined>;
  getBulkUploadJob(jobId: string, userId: string): Promise<any | undefined>;
  
  // Ingestion management
  getIngestionStats(sourceId: string): Promise<any>;
  getIngestionLogs(sourceId: string, options?: { limit?: number }): Promise<any[]>;
  createIngestionLog(log: any): Promise<any>;
  
  // Canonical listings management
  getFlaggedListings(options?: { limit?: number }): Promise<any[]>;
  updateCanonicalListingStatus(listingId: string, status: string): Promise<any | undefined>;
  
  // Hero stats for dynamic homepage
  getHeroStats(): Promise<{
    totalListings: number;
    totalPlatforms: number;
    platforms: Array<{ name: string; count: number }>;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private cars: Map<string, Car>;
  private contacts: Map<string, Contact>;
  private subscriptions: Map<string, Subscription>;
  private featuredListings: Map<string, FeaturedListing>;
  private conversations: Map<string, Conversation>;
  private messages: Map<string, Message>;
  private messageInteractions: Map<string, MessageInteraction>;
  private conversationBlocks: Map<string, ConversationBlock>;
  private userSearchActivity: Map<string, UserSearchActivity>;
  private phoneVerifications: Map<string, PhoneVerification>;
  private anonymousSearchActivity: Map<string, AnonymousSearchActivity>;

  constructor() {
    this.users = new Map();
    this.cars = new Map();
    this.contacts = new Map();
    this.subscriptions = new Map();
    this.featuredListings = new Map();
    this.conversations = new Map();
    this.messages = new Map();
    this.messageInteractions = new Map();
    this.conversationBlocks = new Map();
    this.userSearchActivity = new Map();
    this.phoneVerifications = new Map();
    this.anonymousSearchActivity = new Map();
    
    // Clear any existing data and reinitialize
    this.cars.clear();
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample user (seller)
    const sampleSeller: User = {
      id: "seller-1",
      email: "rajesh@example.com",
      firstName: "Rajesh",
      lastName: "Kumar",
      profileImageUrl: null,
      phone: "+91 98765 43210",
      phoneVerified: true,
      phoneVerifiedAt: new Date(),
      emailVerified: true,
      verificationToken: null,
      verificationTokenExpiresAt: null,
      sellerType: 'private',
      consentSyndication: true,
      legalAgreementVersion: '1.0',
      legalAgreementAcceptedAt: new Date(),
      subscriptionTier: "free",
      subscriptionStatus: "active",
      subscriptionExpiresAt: null,
      searchCount: 0,
      searchCountResetAt: new Date(),
      role: "user", // Add missing role field
      isPremium: false,
      premiumExpiresAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(sampleSeller.id, sampleSeller);

    // Sample cars
    const sampleCars: Car[] = [
      {
        id: "car-1",
        sellerId: "seller-1",
        title: "2020 Maruti Swift VXI",
        brand: "Maruti Suzuki",
        model: "Swift VXI",
        year: 2020,
        price: "6.25",
        mileage: 35000,
        fuelType: "Petrol",
        transmission: "Manual",
        owners: 1,
        location: "Andheri West, Mumbai",
        city: "Mumbai",
        state: "Maharashtra",
        description: "Well-maintained Swift in excellent condition. Single owner, non-accidental car.",
        features: ["Power Steering", "Air Conditioning", "Central Locking", "ABS with EBD", "Dual Airbags"],
        images: ["https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=400&q=80"],
        source: "Google Places",
        isVerified: true,
        isSold: false,
        isFeatured: false,
        featuredExpiresAt: null,
        createdAt: new Date(),
      },
      {
        id: "car-2",
        sellerId: "seller-1",
        title: "2019 Hyundai i20 Sportz",
        brand: "Hyundai",
        model: "i20 Sportz",
        year: 2019,
        price: "7.80",
        mileage: 42000,
        fuelType: "Diesel",
        transmission: "Manual",
        owners: 1,
        location: "Connaught Place, Delhi",
        city: "Delhi",
        state: "Delhi",
        description: "Premium hatchback with all modern features. Great fuel efficiency.",
        features: ["Touchscreen Infotainment", "Reverse Camera", "Automatic Climate Control", "Projector Headlamps"],
        images: ["https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400&q=80"],
        source: "GMB Dealer",
        isVerified: true,
        isSold: false,
        isFeatured: false,
        featuredExpiresAt: null,
        createdAt: new Date(),
      },
      {
        id: "car-3",
        sellerId: "seller-1",
        title: "2021 Tata Nexon XZ+",
        brand: "Tata",
        model: "Nexon XZ+",
        year: 2021,
        price: "9.50",
        mileage: 28000,
        fuelType: "Petrol",
        transmission: "Manual",
        owners: 1,
        location: "Koramangala, Bangalore",
        city: "Bangalore",
        state: "Karnataka",
        description: "Compact SUV with 5-star safety rating. Almost new condition.",
        features: ["Sunroof", "7-inch Touchscreen", "Voice Commands", "Fast Charging", "Connected Car Features"],
        images: ["https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&q=80"],
        source: "Gov Auction",
        isVerified: true,
        isSold: false,
        isFeatured: false,
        featuredExpiresAt: null,
        createdAt: new Date(),
      },
      {
        id: "car-4",
        sellerId: "seller-1",
        title: "2018 Honda City VX",
        brand: "Honda",
        model: "City VX",
        year: 2018,
        price: "8.90",
        mileage: 52000,
        fuelType: "Petrol",
        transmission: "CVT",
        owners: 1,
        location: "T. Nagar, Chennai",
        city: "Chennai",
        state: "Tamil Nadu",
        description: "Reliable sedan with CVT automatic transmission. Perfect for city driving.",
        features: ["CVT Automatic", "Cruise Control", "Smart Key", "LED DRL", "Multi-information Display"],
        images: ["https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&q=80"],
        source: "Partner API",
        isVerified: true,
        isSold: false,
        isFeatured: false,
        featuredExpiresAt: null,
        createdAt: new Date(),
      },
      {
        id: "car-5",
        sellerId: "seller-1",
        title: "2020 Mahindra XUV500 W8",
        brand: "Mahindra",
        model: "XUV500 W8",
        year: 2020,
        price: "12.75",
        mileage: 38000,
        fuelType: "Diesel",
        transmission: "Manual",
        owners: 1,
        location: "Baner, Pune",
        city: "Pune",
        state: "Maharashtra",
        description: "Powerful 7-seater SUV with premium features. Great for long drives.",
        features: ["7 Seater", "All Wheel Drive", "Touchscreen Infotainment", "Premium Audio", "Hill Hold Control"],
        images: ["https://pixabay.com/get/g74d2edb73c0af2c28d85337c9fca7dba950ed5a7304fc969f6386870eaf804adebf05fac7ee85afeb4d3077ba46391a547c02ff1fce7cf565a0de3586f814b34_1280.jpg"],
        source: "RSS Feed",
        isVerified: true,
        isSold: false,
        isFeatured: false,
        featuredExpiresAt: null,
        createdAt: new Date(),
      },
      {
        id: "car-6",
        sellerId: "seller-1",
        title: "2019 Toyota Innova Crysta VX",
        brand: "Toyota",
        model: "Innova Crysta VX",
        year: 2019,
        price: "15.20",
        mileage: 45000,
        fuelType: "Diesel",
        transmission: "Manual",
        owners: 1,
        location: "Jubilee Hills, Hyderabad",
        city: "Hyderabad",
        state: "Telangana",
        description: "Premium MPV perfect for families. Known for reliability and comfort.",
        features: ["8 Seater", "Leather Seats", "Automatic Climate Control", "Touchscreen", "Reverse Camera"],
        images: ["https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400&q=80"],
        source: "Public Feed",
        isVerified: true,
        isSold: false,
        isFeatured: false,
        featuredExpiresAt: null,
        createdAt: new Date(),
      },
    ];

    sampleCars.forEach(car => this.cars.set(car.id, car));
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // Legacy support - search by first name for now
    return Array.from(this.users.values()).find(user => user.firstName === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser,
      email: insertUser.email ?? null,
      firstName: insertUser.firstName ?? null,
      lastName: insertUser.lastName ?? null,
      profileImageUrl: insertUser.profileImageUrl ?? null,
      phone: insertUser.phone ?? null,
      role: insertUser.role ?? "user",
      emailVerified: false,
      verificationToken: null,
      verificationTokenExpiresAt: null,
      sellerType: null,
      consentSyndication: null,
      legalAgreementVersion: null,
      legalAgreementAcceptedAt: null,
      id,
      phoneVerified: false,
      phoneVerifiedAt: null,
      subscriptionTier: "free",
      subscriptionStatus: "active", 
      subscriptionExpiresAt: null,
      searchCount: 0,
      searchCountResetAt: new Date(),
      isPremium: false,
      premiumExpiresAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    if (!userData.id) {
      throw new Error('User ID is required for upsert operation');
    }
    
    const existingUser = this.users.get(userData.id);
    if (existingUser) {
      // Update existing user
      const updatedUser: User = {
        ...existingUser,
        ...userData,
        email: userData.email ?? existingUser.email,
        firstName: userData.firstName ?? existingUser.firstName,
        lastName: userData.lastName ?? existingUser.lastName,
        profileImageUrl: userData.profileImageUrl ?? existingUser.profileImageUrl,
        updatedAt: new Date(),
      };
      this.users.set(userData.id, updatedUser);
      return updatedUser;
    } else {
      // Create new user
      const newUser: User = {
        id: userData.id,
        email: userData.email ?? null,
        firstName: userData.firstName ?? null,
        lastName: userData.lastName ?? null,
        profileImageUrl: userData.profileImageUrl ?? null,
        phone: null,
        phoneVerified: false,
        phoneVerifiedAt: null,
        emailVerified: false,
        verificationToken: null,
        verificationTokenExpiresAt: null,
        sellerType: null,
        consentSyndication: null,
        legalAgreementVersion: null,
        legalAgreementAcceptedAt: null,
        role: "user",
        subscriptionTier: "free",
        subscriptionStatus: "active",
        subscriptionExpiresAt: null,
        searchCount: 0,
        searchCountResetAt: new Date(),
        isPremium: false,
        premiumExpiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.users.set(userData.id, newUser);
      return newUser;
    }
  }

  async getCar(id: string): Promise<Car | undefined> {
    return this.cars.get(id);
  }

  async getAllCars(): Promise<Car[]> {
    return Array.from(this.cars.values()).filter(car => !car.isSold);
  }

  async getCarsBySeller(sellerId: string): Promise<Car[]> {
    return Array.from(this.cars.values()).filter(car => car.sellerId === sellerId);
  }

  async createCar(insertCar: InsertCar): Promise<Car> {
    const id = randomUUID();
    const car: Car = {
      ...insertCar,
      id,
      owners: insertCar.owners || 1,
      description: insertCar.description || null,
      features: insertCar.features || [],
      images: insertCar.images || [],
      source: insertCar.source || null,
      isVerified: false,
      isSold: false,
      isFeatured: false,
      featuredExpiresAt: null,
      createdAt: new Date(),
    };
    this.cars.set(id, car);
    return car;
  }

  async updateCar(id: string, updates: Partial<Car>): Promise<Car | undefined> {
    const car = this.cars.get(id);
    if (!car) return undefined;
    
    const updatedCar = { ...car, ...updates };
    this.cars.set(id, updatedCar);
    return updatedCar;
  }

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
    let cars = Array.from(this.cars.values()).filter(car => !car.isSold);

    if (filters.brand && filters.brand !== "All Brands") {
      cars = cars.filter(car => car.brand.toLowerCase().includes(filters.brand!.toLowerCase()));
    }

    if (filters.priceMin !== undefined) {
      cars = cars.filter(car => parseFloat(car.price) >= filters.priceMin!);
    }

    if (filters.priceMax !== undefined) {
      cars = cars.filter(car => parseFloat(car.price) <= filters.priceMax!);
    }

    if (filters.city && filters.city !== "Select City") {
      cars = cars.filter(car => car.city.toLowerCase() === filters.city!.toLowerCase());
    }

    if (filters.fuelType && filters.fuelType !== "Any Fuel") {
      cars = cars.filter(car => car.fuelType.toLowerCase() === filters.fuelType!.toLowerCase());
    }

    if (filters.transmission && filters.transmission !== "Any Transmission") {
      cars = cars.filter(car => car.transmission.toLowerCase() === filters.transmission!.toLowerCase());
    }

    if (filters.yearMin !== undefined) {
      cars = cars.filter(car => car.year >= filters.yearMin!);
    }

    if (filters.yearMax !== undefined) {
      cars = cars.filter(car => car.year <= filters.yearMax!);
    }

    return cars;
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    const id = randomUUID();
    const contact: Contact = {
      ...insertContact,
      id,
      message: insertContact.message || null,
      createdAt: new Date(),
      sellerId: null,
      buyerPhoneNormalized: null,
      sellerNotifiedAt: null,
      sellerNotificationMethod: null,
      sellerNotificationStatus: 'pending',
      sellerNotificationError: null,
      notificationRetryCount: 0,
      lastNotificationAttempt: null,
    };
    this.contacts.set(id, contact);
    return contact;
  }

  async updateContact(contactId: string, updates: Partial<Contact>): Promise<Contact | null> {
    const contact = this.contacts.get(contactId);
    if (!contact) return null;
    
    const updated = { ...contact, ...updates };
    this.contacts.set(contactId, updated);
    return updated;
  }

  async getContactsForCar(carId: string): Promise<Contact[]> {
    return Array.from(this.contacts.values()).filter(contact => contact.carId === carId);
  }

  async getContactsForSeller(sellerId: string): Promise<Contact[]> {
    // Find all cars belonging to the seller
    const sellerCars = Array.from(this.cars.values()).filter(car => car.sellerId === sellerId);
    const sellerCarIds = sellerCars.map(car => car.id);
    
    // Return all contacts for those cars
    return Array.from(this.contacts.values())
      .filter(contact => sellerCarIds.includes(contact.carId))
      .sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime; // Latest first
      });
  }

  // Premium subscription operations
  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const id = randomUUID();
    const subscription: Subscription = {
      ...insertSubscription,
      currency: insertSubscription.currency ?? 'INR',
      nextBillingDate: insertSubscription.nextBillingDate ?? null,
      stripeSubscriptionId: insertSubscription.stripeSubscriptionId ?? null,
      stripeCustomerId: insertSubscription.stripeCustomerId ?? null,
      locationRestriction: insertSubscription.locationRestriction ?? null,
      id,
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.subscriptions.set(id, subscription);
    return subscription;
  }

  async getUserSubscription(userId: string): Promise<Subscription | undefined> {
    return Array.from(this.subscriptions.values())
      .find(sub => sub.userId === userId && sub.status === 'active');
  }

  // Featured listing operations
  async createFeaturedListing(insertFeatured: InsertFeaturedListing): Promise<FeaturedListing> {
    const id = randomUUID();
    const featured: FeaturedListing = {
      ...insertFeatured,
      id,
      startDate: new Date(),
      endDate: new Date(Date.now() + insertFeatured.duration * 24 * 60 * 60 * 1000),
      isActive: true,
      createdAt: new Date(),
    };
    this.featuredListings.set(id, featured);
    return featured;
  }

  async updateCarFeatured(carId: string, isFeatured: boolean, expiresAt?: Date): Promise<void> {
    const car = this.cars.get(carId);
    if (car) {
      car.isFeatured = isFeatured;
      car.featuredExpiresAt = expiresAt ?? null;
      this.cars.set(carId, car);
    }
  }

  // Messaging operations implementation
  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const id = randomUUID();
    const newConversation: Conversation = {
      id,
      ...conversation,
      status: conversation.status || null,
      subject: conversation.subject || null,
      lastMessageAt: new Date(),
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.conversations.set(id, newConversation);
    return newConversation;
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async getConversationByCarAndBuyer(carId: string, buyerId: string): Promise<Conversation | undefined> {
    for (const conversation of Array.from(this.conversations.values())) {
      if (conversation.carId === carId && conversation.buyerId === buyerId) {
        return conversation;
      }
    }
    return undefined;
  }

  async getConversationsForUser(userId: string, userType: 'buyer' | 'seller'): Promise<Conversation[]> {
    const conversations: Conversation[] = [];
    for (const conversation of Array.from(this.conversations.values())) {
      if (
        (userType === 'buyer' && conversation.buyerId === userId) ||
        (userType === 'seller' && conversation.sellerId === userId)
      ) {
        conversations.push(conversation);
      }
    }
    return conversations.sort((a, b) => 
      (b.lastMessageAt?.getTime() || 0) - (a.lastMessageAt?.getTime() || 0)
    );
  }

  async updateConversationLastMessage(conversationId: string): Promise<void> {
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      conversation.lastMessageAt = new Date();
      conversation.updatedAt = new Date();
      this.conversations.set(conversationId, conversation);
    }
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const newMessage: Message = {
      id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      senderType: message.senderType,
      content: message.content,
      messageType: message.messageType ?? null,
      offerAmount: message.offerAmount ?? null,
      offerStatus: message.offerStatus ?? null,
      isSystemMessage: message.isSystemMessage ?? null,
      isModerated: message.isModerated ?? null,
      moderationStatus: message.moderationStatus ?? null,
      isRead: false,
      readAt: null,
      createdAt: new Date(),
    };
    this.messages.set(id, newMessage);
    return newMessage;
  }

  async getMessagesInConversation(conversationId: string): Promise<Message[]> {
    const messages: Message[] = [];
    for (const message of Array.from(this.messages.values())) {
      if (message.conversationId === conversationId) {
        messages.push(message);
      }
    }
    return messages.sort((a, b) => {
      const aTime = a.createdAt?.getTime() || 0;
      const bTime = b.createdAt?.getTime() || 0;
      return aTime - bTime;
    });
  }

  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    for (const message of Array.from(this.messages.values())) {
      if (message.conversationId === conversationId && message.senderId !== userId && !message.isRead) {
        message.isRead = true;
        message.readAt = new Date();
        this.messages.set(message.id, message);
      }
    }
  }

  async updateOfferStatus(messageId: string, status: string, userId: string): Promise<Message | undefined> {
    const message = this.messages.get(messageId);
    if (message && message.messageType === 'offer') {
      // Verify user has permission to update this offer
      const conversation = await this.getConversation(message.conversationId);
      if (conversation && (conversation.buyerId === userId || conversation.sellerId === userId)) {
        message.offerStatus = status;
        this.messages.set(messageId, message);
        return message;
      }
    }
    return undefined;
  }

  async createConversationBlock(block: InsertConversationBlock): Promise<ConversationBlock> {
    const id = randomUUID();
    const newBlock: ConversationBlock = {
      id,
      ...block,
      reason: block.reason ?? null,
      createdAt: new Date(),
    };
    this.conversationBlocks.set(id, newBlock);
    return newBlock;
  }

  async getSellerContactInfo(sellerId: string): Promise<any> {
    const seller = this.users.get(sellerId);
    if (!seller) {
      return null;
    }

    // Return masked contact info for privacy
    return {
      buyerDisplayName: `Seller ${sellerId.slice(-4)}`,
      maskedPhone: this.maskPhone(seller.phone || ''),
      maskedEmail: this.maskEmail(seller.email || ''),
    };
  }

  private maskPhone(phone: string | null): string {
    if (!phone) return 'xxxxx0000';
    const digits = phone.replace(/\D/g, '');
    if (digits.length >= 10) {
      return `xxxxx${digits.slice(-4)}`;
    }
    return 'xxxxx0000';
  }

  private maskEmail(email: string | null): string {
    if (!email) return 'xxxxx@example.com';
    const [localPart, domain] = email.split('@');
    if (localPart && domain) {
      return `${localPart.charAt(0)}xxxxx@${domain}`;
    }
    return 'xxxxx@example.com';
  }

  // Subscription tier management implementation
  async checkUserSearchLimit(userId: string): Promise<{ canSearch: boolean; searchesLeft: number; resetDate: Date }> {
    const user = this.users.get(userId);
    if (!user) {
      return { canSearch: false, searchesLeft: 0, resetDate: new Date() };
    }

    // Premium users have unlimited searches
    if (user.subscriptionTier !== 'free') {
      return { canSearch: true, searchesLeft: -1, resetDate: new Date() };
    }

    // Check if 30 days have passed since last reset
    const now = new Date();
    const resetDate = user.searchCountResetAt || new Date();
    const daysSinceReset = Math.floor((now.getTime() - resetDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceReset >= 30) {
      // Reset the search count
      user.searchCount = 0;
      user.searchCountResetAt = now;
      this.users.set(userId, user);
    }

    const searchesLeft = Math.max(0, 5 - (user.searchCount || 0));
    const canSearch = searchesLeft > 0;
    const nextResetDate = new Date(resetDate.getTime() + (30 * 24 * 60 * 60 * 1000));

    return { canSearch, searchesLeft, resetDate: nextResetDate };
  }

  async incrementUserSearchCount(userId: string): Promise<void> {
    const user = this.users.get(userId);
    if (user && user.subscriptionTier === 'free') {
      user.searchCount = (user.searchCount || 0) + 1;
      user.updatedAt = new Date();
      this.users.set(userId, user);
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

  async updateUserSubscriptionTier(userId: string, tier: 'free' | 'pro_seller' | 'pro_buyer' | 'superhero'): Promise<User> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.subscriptionTier = tier;
    user.subscriptionStatus = 'active';
    user.updatedAt = new Date();
    
    // Reset search count for tier changes
    if (tier !== 'free') {
      user.searchCount = 0;
    }

    this.users.set(userId, user);
    return user;
  }

  // Phone verification implementation
  async createPhoneVerification(verification: InsertPhoneVerification): Promise<PhoneVerification> {
    const id = randomUUID();
    const phoneVerification: PhoneVerification = {
      id,
      ...verification,
      verified: false,
      createdAt: new Date(),
    };
    this.phoneVerifications.set(id, phoneVerification);
    return phoneVerification;
  }

  async verifyPhoneCode(userId: string, code: string): Promise<boolean> {
    // Find verification record for this user
    for (const verification of Array.from(this.phoneVerifications.values())) {
      if (verification.userId === userId && verification.verificationCode === code) {
        const now = new Date();
        if (now <= verification.expiresAt && !verification.verified) {
          verification.verified = true;
          this.phoneVerifications.set(verification.id, verification);
          return true;
        }
      }
    }
    return false;
  }

  async markPhoneAsVerified(userId: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.phoneVerified = true;
      user.phoneVerifiedAt = new Date();
      user.updatedAt = new Date();
      this.users.set(userId, user);
    }
  }

  // Search activity tracking implementation
  async logUserSearchActivity(activity: InsertUserSearchActivity): Promise<UserSearchActivity> {
    const id = randomUUID();
    const searchActivity: UserSearchActivity = {
      id,
      ...activity,
      userAgent: activity.userAgent ?? null,
      searchFilters: activity.searchFilters ?? null,
      resultsCount: activity.resultsCount ?? null,
      ipAddress: activity.ipAddress ?? null,
      createdAt: new Date(),
    };
    this.userSearchActivity.set(id, searchActivity);
    return searchActivity;
  }

  // Anonymous search tracking for 30-day rolling window
  async logAnonymousSearch(activity: InsertAnonymousSearchActivity): Promise<AnonymousSearchActivity> {
    const id = randomUUID();
    const newActivity: AnonymousSearchActivity = {
      id,
      ...activity,
      ipHash: activity.ipHash ?? null,
      userAgent: activity.userAgent ?? null,
      createdAt: new Date(),
    };
    this.anonymousSearchActivity.set(id, newActivity);
    return newActivity;
  }

  async getAnonymousSearchCountSince(visitorId: string, since: Date): Promise<number> {
    let count = 0;
    for (const activity of Array.from(this.anonymousSearchActivity.values())) {
      if (activity.visitorId === visitorId && activity.createdAt && activity.createdAt >= since) {
        count++;
      }
    }
    return count;
  }

  async pruneAnonymousSearches(before: Date): Promise<void> {
    for (const [id, activity] of Array.from(this.anonymousSearchActivity.entries())) {
      if (activity.createdAt && activity.createdAt < before) {
        this.anonymousSearchActivity.delete(id);
      }
    }
  }
  
  // Additional method for backward compatibility
  async getCars(options?: { limit?: number }): Promise<Car[]> {
    const cars = Array.from(this.cars.values());
    if (options?.limit) {
      return cars.slice(0, options.limit);
    }
    return cars;
  }

  // Admin role management stub implementations (in-memory only)
  async setUserRole(userId: string, role: 'user' | 'admin'): Promise<User> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }
    user.role = role;
    user.updatedAt = new Date();
    this.users.set(userId, user);
    return user;
  }

  async isAdmin(userId: string): Promise<boolean> {
    const user = this.users.get(userId);
    return user?.role === 'admin' || false;
  }

  async listUsers(options?: { q?: string; limit?: number; offset?: number }): Promise<User[]> {
    let users = Array.from(this.users.values());
    
    if (options?.q) {
      const query = options.q.toLowerCase();
      users = users.filter(user => 
        user.email?.toLowerCase().includes(query) ||
        user.firstName?.toLowerCase().includes(query) ||
        user.lastName?.toLowerCase().includes(query)
      );
    }
    
    const offset = options?.offset || 0;
    const limit = options?.limit || 50;
    
    return users.slice(offset, offset + limit);
  }

  // SARFAESI job management stub implementations
  async createSarfaesiJob(job: InsertSarfaesiJob): Promise<SarfaesiJob> {
    const id = randomUUID();
    const newJob: SarfaesiJob = {
      id,
      ...job,
      status: 'queued',
      totalFound: 0,
      authenticatedListings: 0,
      errors: [],
      startedAt: null,
      finishedAt: null,
      createdAt: new Date(),
    };
    // In-memory storage doesn't persist SARFAESI jobs
    return newJob;
  }

  async updateSarfaesiJob(id: string, updates: Partial<SarfaesiJob>): Promise<SarfaesiJob | undefined> {
    // In-memory storage doesn't persist SARFAESI jobs
    return undefined;
  }

  async getSarfaesiJobs(options?: { limit?: number; status?: string }): Promise<SarfaesiJob[]> {
    // In-memory storage doesn't persist SARFAESI jobs
    return [];
  }

  async getSarfaesiJob(id: string): Promise<SarfaesiJob | undefined> {
    // In-memory storage doesn't persist SARFAESI jobs
    return undefined;
  }

  // Admin audit logging stub implementation
  async logAdminAction(entry: InsertAdminAuditLog): Promise<AdminAuditLog> {
    const id = randomUUID();
    const auditLog: AdminAuditLog = {
      id,
      actorUserId: entry.actorUserId,
      action: entry.action,
      targetType: entry.targetType ?? null,
      targetId: entry.targetId ?? null,
      metadata: entry.metadata ?? {},
      createdAt: new Date(),
    };
    // In-memory storage doesn't persist audit logs
    return auditLog;
  }

  // Email verification methods for seller MVP - in-memory implementations
  async setUserVerificationToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      (user as any).verificationToken = token;
      (user as any).verificationTokenExpiresAt = expiresAt;
    }
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => 
      (user as any).verificationToken === token
    );
  }

  async setUserEmailVerified(userId: string, verified: boolean): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      (user as any).emailVerified = verified;
    }
  }

  async clearUserVerificationToken(userId: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      (user as any).verificationToken = null;
      (user as any).verificationTokenExpiresAt = null;
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
    const id = randomUUID();
    const newUser = {
      id,
      email: userData.email,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: null,
      phone: null,
      phoneVerified: false,
      phoneVerifiedAt: null,
      emailVerified: false,
      verificationToken: null,
      verificationTokenExpiresAt: null,
      sellerType: userData.sellerType,
      consentSyndication: userData.consentSyndication,
      consentTimestamp: userData.consentSyndication ? new Date() : null,
      legalAgreementVersion: userData.legalAgreementVersion,
      legalAgreementAcceptedAt: new Date(),
      subscriptionTier: 'free',
      subscriptionStatus: 'active',
      subscriptionExpiresAt: null,
      searchCount: 0,
      searchCountResetAt: new Date(),
      role: 'user',
      isPremium: false,
      premiumExpiresAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User;

    this.users.set(id, newUser);
    return newUser;
  }

  // Posting limits enforcement methods - in-memory stub implementations
  async checkPostingLimits(sellerId: string): Promise<{
    canPost: boolean;
    currentCount: number;
    limit: number;
    sellerType: 'private' | 'dealer';
    message?: string;
  }> {
    const user = this.users.get(sellerId);
    if (!user) {
      return {
        canPost: false,
        currentCount: 0,
        limit: 0,
        sellerType: 'private',
        message: 'User not found'
      };
    }

    const sellerType = ((user as any).sellerType || 'private') as 'private' | 'dealer';
    const limit = sellerType === 'dealer' ? 3 : 1;
    
    // In-memory storage doesn't persist seller listings, so always allow posting
    return {
      canPost: true,
      currentCount: 0,
      limit,
      sellerType,
      message: undefined
    };
  }

  // Seller listings management - in-memory stub implementations
  async createSellerListing(listingData: any): Promise<any> {
    const id = randomUUID();
    const newListing = {
      id,
      ...listingData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    // In-memory storage doesn't persist seller listings
    return newListing;
  }

  async getSellerListings(sellerId: string, options?: { limit?: number; status?: string }): Promise<any[]> {
    // In-memory storage doesn't persist seller listings
    return [];
  }

  async updateSellerListing(listingId: string, updates: any): Promise<any> {
    // In-memory storage doesn't persist seller listings
    return undefined;
  }

  // Atomic listing creation with limits check - in-memory stub
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
    // In-memory implementation - always allows posting for development
    const user = this.users.get(sellerId);
    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    const sellerType = ((user as any).sellerType || 'private') as 'private' | 'dealer';
    const limit = sellerType === 'dealer' ? 3 : 1;

    const listing = await this.createSellerListing(listingData);
    return {
      success: true,
      listing,
      limits: {
        current: 1,
        max: limit,
        sellerType
      }
    };
  }

  // Partner source management - in-memory stubs
  async getListingSources(): Promise<any[]> {
    return [];
  }

  async getListingSource(id: string): Promise<any | undefined> {
    return undefined;
  }

  async createListingSource(data: any): Promise<any> {
    return { id: randomUUID(), ...data, createdAt: new Date(), updatedAt: new Date() };
  }

  async updateListingSource(id: string, updates: any): Promise<any | undefined> {
    return undefined;
  }

  async deleteListingSource(id: string): Promise<void> {
    return;
  }

  // Ingestion management - in-memory stubs
  async getIngestionStats(sourceId: string): Promise<any> {
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

  async getIngestionLogs(sourceId: string, options?: { limit?: number }): Promise<any[]> {
    return [];
  }

  async createIngestionLog(log: any): Promise<any> {
    return { id: randomUUID(), ...log, createdAt: new Date() };
  }

  // Canonical listings management - in-memory stubs
  async getFlaggedListings(options?: { limit?: number }): Promise<any[]> {
    return [];
  }

  async updateCanonicalListingStatus(listingId: string, status: string): Promise<any | undefined> {
    return undefined;
  }

  // Hero stats for dynamic homepage
  async getHeroStats(): Promise<{
    totalListings: number;
    totalPlatforms: number;
    platforms: Array<{ name: string; count: number }>;
  }> {
    // Return mock data for in-memory storage
    return {
      totalListings: this.cars.size,
      totalPlatforms: 1,
      platforms: [
        { name: 'In-Memory Storage', count: this.cars.size }
      ]
    };
  }

  // Partner invite system - in-memory stubs
  async createPartnerInvite(data: { listingSourceId: string; email?: string; createdBy: string }): Promise<any> {
    return { id: randomUUID(), token: randomUUID(), ...data, createdAt: new Date() };
  }

  async getPartnerInviteByToken(token: string): Promise<any | undefined> {
    return undefined;
  }

  async acceptPartnerInvite(token: string, userId: string): Promise<{ success: boolean; error?: string; listingSourceId?: string }> {
    return { success: false, error: 'Not implemented in memory storage' };
  }

  async getPartnerInvitesBySource(listingSourceId: string): Promise<any[]> {
    return [];
  }

  // Partner account management - in-memory stubs
  async createPartnerAccount(data: { listingSourceId: string; userId: string; role: string }): Promise<any> {
    return { id: randomUUID(), ...data, createdAt: new Date() };
  }

  async getPartnerAccountByUser(userId: string): Promise<any | undefined> {
    return undefined;
  }

  async getPartnerAccountsBySource(listingSourceId: string): Promise<any[]> {
    return [];
  }

  // Partner listing management - in-memory stubs
  async createPartnerListing(listingData: any, partnerUserId: string, sourceId: string): Promise<any> {
    return { id: randomUUID(), ...listingData, partnerUserId, sourceId, createdAt: new Date() };
  }

  async getPartnerListings(userId: string): Promise<any[]> {
    return [];
  }

  async updatePartnerListing(listingId: string, userId: string, updates: any): Promise<any | undefined> {
    return undefined;
  }

  async deletePartnerListing(listingId: string, userId: string): Promise<boolean> {
    return false;
  }

  // Bulk upload management - in-memory stubs
  async createBulkUploadJob(data: any): Promise<any> {
    return { id: randomUUID(), ...data, createdAt: new Date() };
  }

  async updateBulkUploadJob(jobId: string, updates: any): Promise<any | undefined> {
    return undefined;
  }

  async getBulkUploadJob(jobId: string, userId: string): Promise<any | undefined> {
    return undefined;
  }
}

import { DatabaseStorage } from './dbStorage.js';

// Use optimized PostgreSQL storage for better performance
export const storage = process.env.DATABASE_URL 
  ? new DatabaseStorage() 
  : new MemStorage();
