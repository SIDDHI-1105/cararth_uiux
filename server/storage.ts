import { type User, type InsertUser, type Car, type InsertCar, type Contact, type InsertContact, type Subscription, type InsertSubscription, type FeaturedListing, type InsertFeaturedListing } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private cars: Map<string, Car>;
  private contacts: Map<string, Contact>;
  private subscriptions: Map<string, Subscription>;
  private featuredListings: Map<string, FeaturedListing>;

  constructor() {
    this.users = new Map();
    this.cars = new Map();
    this.contacts = new Map();
    this.subscriptions = new Map();
    this.featuredListings = new Map();
    
    // Initialize with some sample data for development
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample user (seller)
    const sampleSeller: User = {
      id: "seller-1",
      username: "rajesh_kumar",
      email: "rajesh@example.com",
      phone: "+91 98765 43210",
      name: "Rajesh Kumar",
      password: "hashed_password",
      isPremium: false,
      premiumExpiresAt: null,
      createdAt: new Date(),
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
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      isPremium: false,
      premiumExpiresAt: null,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
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
}

export const storage = new MemStorage();
