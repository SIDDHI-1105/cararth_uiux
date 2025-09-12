# Cararth - India's First Used Car Search Engine

## Overview

Cararth is India's first comprehensive used car search engine that revolutionizes how Indians discover, compare, and buy cars online. The platform aggregates listings from multiple car portals (CarDekho, OLX, Cars24, CarWale, AutoTrader) to provide intelligent pricing insights, authentic verification, and AI-powered market analytics.

**Brand Mission:** "Discover cars from across platforms, compare smarter, and buy or sell with confidence. More than a marketplace — your guide, your community, your car's true value (arth)."

**Contact:** connect@cararth.com  
**Domain:** cararth.com

Cararth follows a monorepo structure with shared TypeScript schemas, uses Drizzle ORM with PostgreSQL for database management, and implements a clean REST API architecture. It's designed as a production-ready cross-platform search engine with features like:

- **Multi-LLM AI Intelligence:** GPT-4o, Gemini, and Perplexity for market analysis
- **Advanced Caching System:** Multi-tier caching with performance optimization  
- **Smart Timeout Management:** Circuit breakers and retry logic for all external services
- **Hyderabad Market Intelligence:** Local market data and area-specific pricing
- **Real-time Aggregation:** Live data from 10+ automotive platforms
- **Authentic Verification:** AI-powered listing validation and quality scoring

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Fast Search Architecture (Batch Ingestion System)

**Performance Achievement**: 100x+ improvement from 76+ second searches to sub-second responses

- **Batch Ingestion**: Scheduled jobs scrape all portals (CarDekho, OLX, Cars24, etc.) and normalize data into PostgreSQL
- **Fast Database Search**: All user searches served directly from database in 600-800ms, cached responses in 0ms
- **Smart Fallback**: Falls back to real-time portal search only if database is empty
- **Cross-Filter Support**: Any filter combination works (price OR model OR city OR fuel, combined with AND logic)

**Production Deployment:**
- **Scheduling**: Use external cron services (cron-job.org, GitHub Actions, Railway) to hit `/api/run_ingestion` endpoint 2x daily
- **Database**: PostgreSQL with proper indexes for fast numeric sorting/filtering
- **Caching**: Two-tier system with in-memory L1 cache and database L2 cache
- **Monitoring**: `/api/ingestion/status` endpoint shows system health and data freshness

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with custom design system and CSS variables
- **State Management**: TanStack Query (React Query) for server state management
- **Forms**: React Hook Form with Zod validation resolvers

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with structured error handling
- **Request Logging**: Custom middleware for API request/response logging
- **Development**: Hot reload with Vite integration for seamless development experience

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL with Neon serverless driver
- **Schema Management**: Shared TypeScript schema definitions between client and server
- **Validation**: Zod schemas for runtime type checking and validation
- **Storage Interface**: Abstract storage layer with in-memory implementation for development

### Database Schema Design
The application uses three main entities:
- **Users**: Stores seller information with authentication fields
- **Cars**: Comprehensive car listings with filtering attributes (brand, price, location, specifications)
- **Contacts**: Buyer inquiry system linking potential buyers to car listings

### Authentication & Sessions
- Session management using connect-pg-simple for PostgreSQL session storage
- User authentication system with password handling
- Seller-based car listing ownership model

### Development & Build System
- **Build Tool**: Vite for fast development and optimized production builds
- **Code Quality**: TypeScript strict mode with comprehensive type checking
- **Path Resolution**: Absolute imports using @ aliases for clean import statements
- **Asset Management**: Vite handles static assets and provides HMR in development

### Error Handling & Logging
- Centralized error handling middleware in Express
- Structured API response format with consistent error messages
- Development-friendly error overlay integration
- Request/response logging with performance metrics

### UI/UX Architecture
- Responsive design with mobile-first approach
- Dark/light mode support through CSS custom properties
- Component composition using Radix UI primitives
- Form validation with real-time feedback
- Toast notifications for user feedback
- Loading states and skeleton components for better UX

## External Dependencies

### Database & Storage
- **Neon Database**: Serverless PostgreSQL database hosting
- **connect-pg-simple**: PostgreSQL session store for Express sessions

### UI & Styling
- **Radix UI**: Comprehensive set of accessible UI primitives for React
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Lucide React**: Icon library for consistent iconography
- **Google Fonts**: Inter font family for typography

### Development & Build Tools
- **Vite**: Build tool with HMR and development server
- **TypeScript**: Type safety and development experience
- **PostCSS**: CSS processing with Autoprefixer

### API & State Management
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form handling with performance optimization
- **Zod**: Schema validation and type inference

### Routing & Navigation
- **Wouter**: Lightweight React router for client-side navigation

The application is designed to be easily deployable on platforms like Replit, with environment-based configuration and development-friendly tooling.