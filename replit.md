# The Mobility Hub - Your Journey. Simplified.

## Overview

The Mobility Hub is a comprehensive marketplace aggregator that revolutionizes how Indians buy and sell cars online. The platform scans multiple car portals (CarDekho, OLX, Cars24, CarWale, AutoTrader) to provide intelligent pricing insights, granular filtering capabilities, and market analytics with historical data for both buyers and sellers.

The application follows a monorepo structure with shared TypeScript schemas, uses Drizzle ORM for database management, and implements a clean REST API architecture. It's designed as a production-ready marketplace aggregator with features like cross-portal scanning, intelligent price comparison, advanced filtering down to granular details, and comprehensive market analytics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

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