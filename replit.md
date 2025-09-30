# Cararth - India's Very Own Used Car Search Engine

## Overview

Cararth is India's comprehensive used car search engine, aggregating listings from multiple portals (CarDekho, OLX, Cars24, CarWale, AutoTrader) to provide intelligent pricing, authentic verification, and AI-powered market analytics. Its mission is to empower users to discover, compare, and buy/sell cars with confidence, acting as a guide to true car value.

Key capabilities include:
- Multi-LLM AI Intelligence for market analysis and compliance checks.
- Advanced Caching System for performance optimization.
- Smart Timeout Management for external services.
- Localized market intelligence (e.g., Hyderabad).
- Real-time aggregation from 10+ automotive platforms.
- AI-powered listing validation and quality scoring.
- Enterprise Partner Syndication for sellers to distribute listings across platforms with multi-LLM compliance.

## Recent Changes

### September 30, 2025 - AI Search Engine Optimization Complete ✅
- ✅ **Enhanced Schema.org Structured Data** in `client/index.html`:
  - Organization, WebSite, WebApplication, Service, and FAQPage schemas
  - Comprehensive feature list, technology stack, and service coverage
  - Search action integration for better AI understanding
- ✅ **AI-Friendly robots.txt** (`public/robots.txt`):
  - Explicitly allows all major AI crawlers: GPTBot, ChatGPT-User, ClaudeBot, PerplexityBot, Google-Extended, Bingbot
  - Zero crawl delay for maximum discoverability
  - References sitemap and AI info endpoint
- ✅ **Comprehensive sitemap.xml** (`public/sitemap.xml`):
  - All main pages with current timestamps (2025-09-30)
  - High-priority AI-friendly endpoints (`/api/ai-info`, `/api/news/market-insights`)
  - Proper change frequencies and priorities for AI crawlers
- ✅ **Machine-Readable Data Endpoint** (`/api/ai-info`):
  - Structured JSON with complete platform information
  - Feature list, technology stack, data sources, API endpoints
  - FAQs, keywords, and unique differentiators
  - Designed for AI search engines to understand CarArth's capabilities
- ✅ **Static File Serving** in `server/index.ts`:
  - Explicit routes for robots.txt and sitemap.xml before Vite catch-all
  - Ensures AI crawlers can access critical discovery files

### September 30, 2025 - Enterprise Partner Syndication System Complete ✅
- ✅ Database schema with 4 new tables: `listing_sources`, `canonical_listings`, `llm_reports`, `ingestion_logs`
- ✅ Multi-LLM compliance service with 4 LLM providers (OpenAI, Gemini, Claude, Perplexity)
- ✅ Smart ingestion service with VIN-based deduplication and auto-normalization
- ✅ 10 new admin API endpoints for partner CRUD, ingestion management, and review workflows
- ✅ Full DatabaseStorage and MemStorage implementations for all partner operations
- ✅ Cost-optimized LLM provider selection (~$0.00001-$0.005 per request)
- ✅ **Frontend Admin UI Complete**:
  - Partner Management Dashboard (`/admin/partners`) - Create, edit, delete, and monitor partner sources
  - Partner Monitoring Page (`/admin/partners/:id/monitor`) - View stats, logs, and health metrics
  - Flagged Listings Review Interface (`/admin/review`) - Approve or reject flagged listings with AI insights
  - Full dark mode support, responsive design, and comprehensive data-testid attributes

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

Cararth is built as a monorepo using TypeScript, Drizzle ORM with PostgreSQL, and a clean REST API architecture.

### Fast Search Architecture
- **Batch Ingestion**: Scheduled jobs scrape portals, normalize, and store data in PostgreSQL.
- **Performance**: Sub-second search responses from the database (600-800ms) with cached responses (0ms).
- **Fallback**: Real-time portal search only if the database is empty.
- **Cross-Filter Support**: Flexible filtering combinations.
- **Deployment**: External cron services trigger ingestion via `/api/run_ingestion` endpoint (2x daily).
- **Caching**: Two-tier system with in-memory L1 and database L2 cache.

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite.
- **Routing**: Wouter.
- **UI Components**: Radix UI primitives with shadcn/ui.
- **Styling**: Tailwind CSS with custom design system.
- **State Management**: TanStack Query (React Query).
- **Forms**: React Hook Form with Zod validation.
- **UI/UX**: Responsive design, dark/light mode, component composition, form validation, toast notifications, loading states.

### Backend Architecture
- **Runtime**: Node.js with Express.js.
- **Language**: TypeScript with ES modules.
- **API Design**: RESTful API with structured error handling.
- **Logging**: Custom middleware for API request/response logging.
- **Development**: Hot reload with Vite integration.

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect.
- **Database**: PostgreSQL with Neon serverless driver.
- **Schema Management**: Shared TypeScript schema definitions (client/server).
- **Validation**: Zod schemas for runtime type checking.
- **Entities**: Users, Cars, and Contacts.

### Authentication & Sessions
- Session management using `connect-pg-simple` for PostgreSQL.
- User authentication with password handling.
- Seller-based car listing ownership.

### Enterprise Partner Syndication System
This system enables enterprise partners to post listings once and distribute them across platforms with multi-LLM compliance checks.
- **Core Components**:
    - **Partner Source Management**: Manages partner configurations, feed types (webhook, CSV, SFTP, Firecrawl), field mapping, legal compliance, and health metrics.
    - **Canonical Listings**: Stores normalized listings with provenance tracking, deduplication (VIN, Registration, SHA256), risk scoring, and status management.
    - **Multi-LLM Compliance Pipeline**: Utilizes various LLMs for compliance:
        - **OpenAI (GPT-4o/GPT-4o-mini)**: ToS extraction, data normalization.
        - **Google Gemini (Flash 1.5)**: High-throughput PII detection.
        - **Anthropic Claude (Sonnet 3.5/Haiku)**: Copyright analysis.
        - **Perplexity**: Reserved for future market intelligence.
    - **Ingestion Service**: Handles smart deduplication, auto-normalization, field mapping, batch processing, and webhook support.
    - **LLM Compliance Service**: Orchestrates compliance checks for ToS, PII, and copyright, providing risk flagging.
- **Ingestion Workflows**: Supports webhook, manual batch, and Firecrawl scraping for listing ingestion, followed by LLM compliance checks.
- **Cost Optimization**: Strategic selection of LLM providers based on task and cost-efficiency, combined with caching and batch processing.

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
- **Firecrawl**: For web scraping partners without APIs.