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
- **Seller Contact & Notification System**: Uses `libphonenumber-js` for phone normalization, Twilio Business API for WhatsApp notifications (WhatsApp-first approach), Nodemailer for email fallback, and smart retry logic with exponential backoff.
- **AI Search Engine Optimization**: Enhanced Schema.org structured data, AI-friendly robots.txt, comprehensive sitemap.xml, machine-readable data endpoint (`/api/ai-info`), static file serving.

### Feature Specifications
- **Enterprise Partner Syndication**: Enables partners to post listings once for multi-platform distribution.
    - **Core Components**: Partner source management (webhook, CSV, SFTP, Firecrawl, Crawl4AI), canonical listings (normalized, deduplicated, risk-scored), multi-LLM compliance pipeline (OpenAI, Gemini, Anthropic, Perplexity), and ingestion service (smart deduplication, auto-normalization).
    - **Ingestion Workflows**: Supports webhook, manual batch, and Firecrawl/Crawl4AI scraping.
    - **Cost Optimization**: Strategic LLM provider selection, caching, and batch processing.
- **Partner Self-Service Portal**: Simple, intuitive dashboard for dealers to manage inventory with real-time marketplace updates.
    - **Core Components**: Shareable invite links (7-day expiry, crypto-secure tokens), partner accounts with role-based access, instant cache invalidation for real-time updates, non-technical Add Listing form.
    - **Database Schema**: `partner_invites` (token, listing source, expiry), `partner_accounts` (user-source relationship), `cached_portal_listings` with `origin='partner'` and verification fields.
    - **Security**: Secure token generation with crypto.randomUUID(), session-based authentication, role-based authorization (admin/partner), ownership verification on CRUD operations.
    - **Real-Time Updates**: Listings appear on CarArth.com instantly via integrated cache invalidation (cacheManager) clearing all search, marketplace, and listing caches.

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
- **Crawl4AI**: Free, self-hosted web scraping with LLM extraction.

### Notification & Communication
- **Twilio**: WhatsApp Business API for instant seller notifications.
- **Nodemailer**: Email delivery service.
- **libphonenumber-js**: International phone number normalization and validation.

## Recent Updates

### October 1, 2025 - Partner Self-Service Portal & Automated Scraping
- ✅ **Partner Self-Service Portal**: Simple, intuitive dashboard for dealers to manage inventory with real-time CarArth.com updates.
  - **Admin Features** (`client/src/pages/admin-partners.tsx`): Generate shareable invite links from partner sources with 7-day expiry.
  - **Partner Invite** (`client/src/pages/partner-invite.tsx`): Beautiful acceptance page showing partner benefits and one-click setup.
  - **Partner Dashboard** (`client/src/pages/partner-dashboard.tsx`): Non-technical Add Listing form, My Inventory management, instant CRUD operations.
  - **Backend API** (`server/routes.ts`): Secure invite generation/acceptance, authenticated partner listing CRUD with ownership verification.
  - **Database Schema** (`shared/schema.ts`): `partner_invites`, `partner_accounts` tables with secure crypto token generation.
  - **Real-Time Cache** (`server/dbStorage.ts`): Instant cache invalidation via cacheManager for immediate marketplace updates.
  - **Security**: crypto.randomUUID() tokens, role-based access (admin/partner), session authentication, ownership checks.
  - **Impact**: Empowers dealers to self-manage inventory with zero technical knowledge, instant visibility on CarArth.com.
- ✅ **Automated Forum & Marketplace Scraping**: Daily scraping from quality owner communities.
  - **Team-BHP Classifieds** (`server/teamBhpScraper.ts`): India's trusted car enthusiast community owner listings.
  - **TheAutomotiveIndia Marketplace** (`server/automotiveIndiaScraper.ts`): 34.9K community owner-to-owner sales.
  - **Quikr Cars** (`server/quikrScraper.ts`): 2,500+ active owner listings from India's largest classifieds.
  - **Reddit r/CarsIndia** (`server/redditScraper.ts`): Active community buying/selling threads with rich discussions.
  - **Daily Scheduler**: All scrapers run at 11:00 & 23:00 IST with auto-source creation and parallel execution.
  - **Impact**: ~50%+ inventory boost from hidden gems with authentic owner context.