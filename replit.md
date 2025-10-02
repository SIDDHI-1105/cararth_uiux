# Cararth - India's Very Own Used Car Search Engine

## Overview

Cararth is India's comprehensive used car search engine, aggregating listings from multiple portals (CarDekho, OLX, Cars24, CarWale, AutoTrader) to provide intelligent pricing, authentic verification, and AI-powered market analytics. Its mission is to empower users to discover, compare, and buy/sell cars with confidence, acting as a guide to true car value. Key capabilities include multi-LLM AI intelligence for market analysis and compliance checks, an advanced caching system, smart timeout management, localized market intelligence, real-time aggregation from 10+ automotive platforms, AI-powered listing validation and quality scoring, and enterprise partner syndication.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

Cararth is built as a monorepo using TypeScript, Drizzle ORM with PostgreSQL, and a clean REST API architecture.

### UI/UX Decisions
- **Framework**: React 18 with TypeScript and Vite.
- **Routing**: Wouter.
- **UI Components**: Radix UI primitives with shadcn/ui.
- **Styling**: Tailwind CSS with custom design system.
- **UI/UX**: Responsive design, dark/light mode, component composition, form validation, toast notifications, loading states.

### Technical Implementations
- **Frontend**: TanStack Query for state management, React Hook Form with Zod for forms.
- **Backend**: Node.js with Express.js, TypeScript with ES modules, RESTful API, custom logging middleware, hot reload with Vite.
- **Data Layer**: Drizzle ORM with PostgreSQL (Neon serverless driver), shared TypeScript schema definitions, Zod for runtime type checking, entities for Users, Cars, and Contacts.
- **Authentication**: Session management using `connect-pg-simple`, user authentication with password handling, seller-based car listing ownership.
- **Fast Search**: Batch ingestion, sub-second search responses with caching, cross-filter support, external cron services for ingestion.
- **Search Result Deduplication**: Implemented portal+URL unique identifier to remove exact duplicate listings and quality filtering to remove spam listings.
- **Seller Contact & Notification System**: Uses `libphonenumber-js` for phone normalization, Twilio Business API for WhatsApp notifications, Nodemailer for email fallback, and smart retry logic.
- **AI Search Engine Optimization**: Enhanced Schema.org structured data, AI-friendly robots.txt, comprehensive sitemap.xml, machine-readable data endpoint (`/api/ai-info`), static file serving.
- **Scraper Monitoring**: Production-ready, self-healing system with persistent retry state, exponential backoff, and database-backed health logs for all scrapers. Includes an admin dashboard for real-time status.

### Feature Specifications
- **Enterprise Partner Syndication**: Enables partners to post listings once for multi-platform distribution. Core components include partner source management, canonical listings, multi-LLM compliance pipeline (OpenAI, Gemini, Anthropic, Perplexity), and ingestion service. Supports webhook, manual batch, and Firecrawl/Crawl4AI scraping.
- **Partner Self-Service Portal**: Intuitive dashboard for dealers to manage inventory with real-time marketplace updates. Features include shareable invite links, partner accounts with role-based access, instant cache invalidation, and a non-technical Add Listing form. Includes a Bulk Upload feature for CSV and media files with real-time progress tracking.
- **Automated Forum & Marketplace Scraping**: Daily scraping from quality owner communities like Team-BHP Classifieds, TheAutomotiveIndia Marketplace, Quikr Cars, and Reddit r/CarsIndia.
- **Dynamic Hero Section**: Real-time statistics displayed on the homepage, showing total listings and platform counts, with data fetched from the database and updated frequently.

## External Dependencies

### Database & Storage
- **Neon Database**: Serverless PostgreSQL hosting.
- **connect-pg-simple**: PostgreSQL session store.

### UI & Styling
- **Radix UI**: Accessible UI primitives for React.
- **Tailwind CSS**: Utility-first CSS framework.
- **Lucide React**: Icon library.
- **Google Fonts**: Inter font family.

### Development & Build Tools
- **Vite**: Build tool, HMR, development server.
- **TypeScript**: Type safety.
- **PostCSS**: CSS processing.

### API & State Management
- **TanStack Query**: Server state management.
- **React Hook Form**: Form handling.
- **Zod**: Schema validation.

### Routing & Navigation
- **Wouter**: Lightweight React router.

### LLM Providers
- **OpenAI**: For ToS extraction and normalization.
- **Google Gemini**: For PII detection.
- **Anthropic Claude**: For copyright analysis.
- **Perplexity**: For future market intelligence.

### Web Scraping
- **Firecrawl**: Premium web scraping service with LLM-powered extraction.
- **Crawl4AI**: Free, self-hosted web scraping with LLM extraction (used as backup/legacy).

### Notification & Communication
- **Twilio**: WhatsApp Business API for instant seller notifications.
- **Nodemailer**: Email delivery service.
- **libphonenumber-js**: International phone number normalization and validation.