# Cararth - India's Very Own Used Car Search Engine

## Overview

Cararth is India's comprehensive used car search engine, aggregating listings from multiple portals (CarDekho, OLX, Cars24, CarWale, AutoTrader) to provide intelligent pricing, authentic verification, and AI-powered market analytics. Its mission is to empower users to discover, compare, and buy/sell cars with confidence, acting as a guide to true car value. Key capabilities include multi-LLM AI intelligence for market analysis and compliance checks, an advanced caching system, smart timeout management, localized market intelligence, real-time aggregation from 10+ automotive platforms, AI-powered listing validation and quality scoring, and enterprise partner syndication.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

Cararth is built as a monorepo using TypeScript, Drizzle ORM with PostgreSQL, and a clean REST API architecture.

### UI/UX Decisions
- **Framework**: React 18 with TypeScript and Vite, using Wouter for routing.
- **UI Components**: Radix UI primitives with shadcn/ui.
- **Styling**: Tailwind CSS with a custom design system, supporting responsive design and dark/light modes.
- **General UI/UX**: Component composition, form validation, toast notifications, and loading states.

### Technical Implementations
- **Frontend**: TanStack Query for state management, React Hook Form with Zod for forms.
- **Backend**: Node.js with Express.js, TypeScript with ES modules, RESTful API, custom logging, and hot reload.
- **Data Layer**: Drizzle ORM with PostgreSQL (Neon serverless driver), shared TypeScript schemas, Zod for runtime type checking, and entities for Users, Cars, and Contacts.
- **Authentication**: Session management with `connect-pg-simple`, user authentication, and seller-based car listing ownership.
- **Fast Search**: Batch ingestion, sub-second search responses with caching, cross-filter support, and external cron services for ingestion.
- **Search Result Deduplication**: Utilizes portal+URL unique identifiers and quality filtering to remove duplicate and spam listings.
- **Seller Contact & Notification System**: Uses `libphonenumber-js` for phone normalization, Twilio Business API for WhatsApp notifications, Nodemailer for email fallback, and smart retry logic.
- **AI Search Engine Optimization**: Enhanced Schema.org structured data, AI-friendly robots.txt, comprehensive sitemap.xml, machine-readable data endpoint (`/api/ai-info`), and static file serving.
- **Scraper Monitoring**: Production-ready, self-healing system with persistent retry states, exponential backoff, database-backed health logs, and an admin dashboard.
- **Trust Layer & Listing Validation**: Centralized ingestion service enforces mandatory Trust Layer validation (`listingIngestionService.ingestListing()`) before saving to the database. High severity violations lead to listing rejection. Strict institutional allowlist for trusted sources. Defensive storage gate at the database layer (`dbStorage.ts`) ensures only approved listings are saved.
- **Scraper Implementations**: Includes a CarDekho scraper using axios + cheerio, Apify-powered scraping for OLX and Facebook Marketplace, and automated forum/marketplace scraping. All scrapers route through the centralized ingestion service.

### Feature Specifications
- **Enterprise Partner Syndication**: Allows partners to post listings once for multi-platform distribution, including multi-LLM compliance (OpenAI, Gemini, Anthropic, Perplexity).
- **Partner Self-Service Portal**: Dashboard for dealers to manage inventory, offering shareable invite links, role-based access, instant cache invalidation, and a non-technical Add Listing form with Bulk Upload (CSV and media files).
- **Real Market Intelligence**: Integrates SIAM sales data and Google Trends for price insights, showing market trends and popularity.
- **Image-Based Quality Ranking**: Search results incorporate image quality scoring for enhanced relevance.
- **Dynamic Hero Section**: Displays real-time statistics on the homepage, such as total listings and platform counts.
- **Social Media Integration & Sharing**: Active social media presence with footer links, car listing social sharing capabilities, and server-side rendered Open Graph meta tags for optimal social previews.
- **xAI Grok Market Insights**: AI-powered granular market intelligence engine for Hyderabad/Telangana used cars, analyzing trends at model, variant, color, transmission, fuel type, and location levels using real-time data from SIAM, VAHAN, Telangana Open Data Portal, CarDekho, Spinny, and OLX. Provides deal quality scoring and price comparison against market averages.
- **Telangana RTA Data Integration**: Direct integration with the Telangana Open Data Portal for authentic vehicle registration statistics, providing monthly data by brand, model, fuel type, transmission, and district.
- **Telangana Market Intelligence**: Utilizes official Telangana RTA data to provide real-time market insights for sellers and buyers, including demand scoring, trend analysis, and AI-powered insights.
- **Dealer Inventory Upload System**: Production-ready platform for vehicle inventory management with strict validation (VIN, price, image) and Google Vehicle Listing feed compliance. Features Quick Add, Bulk CSV Upload, validation reports, and a dealer dashboard.
- **Dealer Performance Analytics Dashboard**: Interactive dashboard for Telangana dealers with real-time metrics, ML forecasts, and market benchmarks, including sales trend visualization, VAHAN ROI benchmark, and Telangana district analysis.

## External Dependencies

### Database & Storage
- **Neon Database**: Serverless PostgreSQL hosting.
- **connect-pg-simple**: PostgreSQL session store.
- **Google Cloud Storage**: For vehicle images.

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

### Data Visualization
- **Recharts**: Composable charting library for React.

### LLM Providers
- **OpenAI**: For ToS extraction and normalization.
- **Google Gemini**: For PII detection.
- **Anthropic Claude**: For copyright analysis.
- **Perplexity**: For future market intelligence.
- **xAI Grok**: For granular market insights and AI-powered used car analysis.

### Web Scraping
- **Firecrawl**: Premium web scraping service with LLM-powered extraction.
- **Crawl4AI**: Free, self-hosted web scraping with LLM extraction.
- **Apify**: Cloud-based web scraping and automation platform (for OLX and Facebook Marketplace).
- **axios + cheerio**: For web scraping (e.g., CarDekho).

### Notification & Communication
- **Twilio**: WhatsApp Business API for instant seller notifications.
- **Nodemailer**: Email delivery service.
- **libphonenumber-js**: International phone number normalization and validation.

### Data Sources
- **Telangana Open Data Portal**: Official government data for vehicle registration statistics.
- **SIAM (Society of Indian Automobile Manufacturers)**: For sales data.
- **Google Trends**: For market trend insights.
- **VAHAN**: For vehicle registration data.