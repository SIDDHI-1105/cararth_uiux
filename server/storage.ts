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
  type InsertPhoneVerification
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
  getContactsForCar(carId: string): Promise<Contact[]>;
  
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
    const existingUser = this.users.get(userData.id);
    if (existingUser) {
      // Update existing user
      const updatedUser: User = {
        ...existingUser,
        ...userData,
        updatedAt: new Date(),
      };
      this.users.set(userData.id, updatedUser);
      return updatedUser;
    } else {
      // Create new user
      const newUser: User = {
        ...userData,
        phone: null,
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
    };
    this.contacts.set(id, contact);
    return contact;
  }

  async getContactsForCar(carId: string): Promise<Contact[]> {
    return Array.from(this.contacts.values()).filter(contact => contact.carId === carId);
  }

  // Premium subscription operations
  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const id = randomUUID();
    const subscription: Subscription = {
      ...insertSubscription,
      id,
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      createdAt: new Date(),
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
    for (const conversation of this.conversations.values()) {
      if (conversation.carId === carId && conversation.buyerId === buyerId) {
        return conversation;
      }
    }
    return undefined;
  }

  async getConversationsForUser(userId: string, userType: 'buyer' | 'seller'): Promise<Conversation[]> {
    const conversations: Conversation[] = [];
    for (const conversation of this.conversations.values()) {
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
      ...message,
      isRead: false,
      readAt: null,
      createdAt: new Date(),
    };
    this.messages.set(id, newMessage);
    return newMessage;
  }

  async getMessagesInConversation(conversationId: string): Promise<Message[]> {
    const messages: Message[] = [];
    for (const message of this.messages.values()) {
      if (message.conversationId === conversationId) {
        messages.push(message);
      }
    }
    return messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    for (const message of this.messages.values()) {
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
      maskedPhone: this.maskPhone(seller.phone),
      maskedEmail: this.maskEmail(seller.email),
    };
  }

  private maskPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length >= 10) {
      return `xxxxx${digits.slice(-4)}`;
    }
    return 'xxxxx0000';
  }

  private maskEmail(email: string): string {
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
    const resetDate = user.searchCountResetAt;
    const daysSinceReset = Math.floor((now.getTime() - resetDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceReset >= 30) {
      // Reset the search count
      user.searchCount = 0;
      user.searchCountResetAt = now;
      this.users.set(userId, user);
    }

    const searchesLeft = Math.max(0, 5 - user.searchCount);
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
    for (const verification of this.phoneVerifications.values()) {
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
      createdAt: new Date(),
    };
    this.userSearchActivity.set(id, searchActivity);
    return searchActivity;
  }
}

export const storage = new MemStorage();
