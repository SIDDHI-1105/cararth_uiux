import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCarSchema, insertContactSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all cars with optional filters
  app.get("/api/cars", async (req, res) => {
    try {
      const filters = {
        brand: req.query.brand as string,
        priceMin: req.query.priceMin ? parseFloat(req.query.priceMin as string) : undefined,
        priceMax: req.query.priceMax ? parseFloat(req.query.priceMax as string) : undefined,
        city: req.query.city as string,
        fuelType: req.query.fuelType as string,
        transmission: req.query.transmission as string,
        yearMin: req.query.yearMin ? parseInt(req.query.yearMin as string) : undefined,
        yearMax: req.query.yearMax ? parseInt(req.query.yearMax as string) : undefined,
      };

      const cars = await storage.searchCars(filters);
      res.json(cars);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cars" });
    }
  });

  // Get car by ID
  app.get("/api/cars/:id", async (req, res) => {
    try {
      const car = await storage.getCar(req.params.id);
      if (!car) {
        return res.status(404).json({ error: "Car not found" });
      }
      res.json(car);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch car" });
    }
  });

  // Create new car listing
  app.post("/api/cars", async (req, res) => {
    try {
      const carData = insertCarSchema.parse(req.body);
      const car = await storage.createCar(carData);
      res.status(201).json(car);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid car data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create car listing" });
    }
  });

  // Search cars (alternative endpoint)
  app.post("/api/cars/search", async (req, res) => {
    try {
      const searchSchema = z.object({
        brand: z.string().optional(),
        priceMin: z.number().optional(),
        priceMax: z.number().optional(),
        city: z.string().optional(),
        fuelType: z.string().optional(),
        transmission: z.string().optional(),
        yearMin: z.number().optional(),
        yearMax: z.number().optional(),
      });

      const filters = searchSchema.parse(req.body);
      const cars = await storage.searchCars(filters);
      res.json(cars);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid search parameters", details: error.errors });
      }
      res.status(500).json({ error: "Failed to search cars" });
    }
  });

  // Create contact inquiry
  app.post("/api/contacts", async (req, res) => {
    try {
      const contactData = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(contactData);
      res.status(201).json(contact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid contact data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create contact inquiry" });
    }
  });

  // Get contacts for a car (for sellers)
  app.get("/api/cars/:id/contacts", async (req, res) => {
    try {
      const contacts = await storage.getContactsForCar(req.params.id);
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contacts" });
    }
  });

  // Get car seller info
  app.get("/api/cars/:id/seller", async (req, res) => {
    try {
      const car = await storage.getCar(req.params.id);
      if (!car) {
        return res.status(404).json({ error: "Car not found" });
      }
      
      const seller = await storage.getUser(car.sellerId);
      if (!seller) {
        return res.status(404).json({ error: "Seller not found" });
      }

      // Don't send sensitive info
      const { password, ...sellerInfo } = seller;
      res.json(sellerInfo);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch seller information" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
