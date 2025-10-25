# Cararth - India's Used Car Search Engine

## Overview
Cararth is India's comprehensive used car search engine, aggregating listings from multiple portals to provide intelligent pricing, authentic verification, and AI-powered market analytics. Its mission is to empower users to discover, compare, and buy/sell cars with confidence, acting as a guide to true car value. Key capabilities include multi-LLM AI intelligence for market analysis and compliance checks, an advanced caching system, smart timeout management, localized market intelligence, real-time aggregation, AI-powered listing validation, and enterprise partner syndication.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
Cararth is built as a monorepo using TypeScript, Drizzle ORM with PostgreSQL, and a clean REST API architecture.

### UI/UX Decisions
The frontend uses React 18 with TypeScript and Vite, Wouter for routing, Radix UI primitives with shadcn/ui, and Tailwind CSS for styling, supporting responsive design and dark/light modes. Emphasis is placed on component composition, form validation, toast notifications, and loading states.

### Technical Implementations
- **Frontend**: TanStack Query for state management, React Hook Form with Zod for forms.
- **Backend**: Node.js with Express.js, TypeScript with ES modules, RESTful API, custom logging, and hot reload.
- **Data Layer**: Drizzle ORM with PostgreSQL (Neon serverless driver), shared TypeScript schemas, Zod for runtime type checking, and entities for Users, Cars, and Contacts.
- **Authentication**: Session management with `connect-pg-simple`, user authentication, and seller-based car listing ownership.
- **Search**: Fast search with batch ingestion, sub-second responses using caching, cross-filter support, and deduplication based on unique identifiers and quality filtering.
- **Communication**: Seller contact and notification system uses `libphonenumber-js` for phone normalization, Twilio Business API for WhatsApp, and Nodemailer for email, with smart retry logic.
- **AI SEO**: Enhanced Schema.org structured data, AI-friendly robots.txt, comprehensive sitemap.xml, machine-readable data endpoint (`/api/ai-info`), and static file serving.
- **Scraper Monitoring**: Production-ready, self-healing system with persistent retry states, exponential backoff, database-backed health logs, and an admin dashboard.
- **Trust Layer & Listing Validation**: Centralized ingestion service enforces mandatory Trust Layer validation, rejecting listings with high severity violations and ensuring only approved listings are saved to the database.
- **Scrapers**: Implementations for CarDekho (axios + cheerio), OLX, and Facebook Marketplace (Apify), all routing through the centralized ingestion service.

### Feature Specifications
- **Enterprise Partner Syndication**: Allows partners to post listings once for multi-platform distribution, including multi-LLM compliance.
- **Partner Self-Service Portal**: Dashboard for dealers to manage inventory, offering shareable invite links, role-based access, instant cache invalidation, and a non-technical Add Listing form with Bulk Upload (CSV and media files).
- **Market Intelligence**: Integrates SIAM sales data and Google Trends for price insights and real-time statistics (e.g., total listings). Features xAI Grok for granular market intelligence specific to Hyderabad/Telangana, analyzing trends across various car attributes and providing deal quality scoring. Includes integration with Telangana RTA Data for authentic vehicle registration statistics and demand scoring.
- **Image-Based Quality Ranking**: Search results incorporate image quality scoring.
- **Dealer Inventory Upload System**: Production-ready platform for vehicle inventory management with strict validation (VIN, price, image), Google Vehicle Listing feed compliance, Quick Add, and comprehensive Bulk Upload supporting CSV data, vehicle images, and RC/Insurance documents, with detailed validation reports.
- **Dealer Performance Analytics Dashboard**: Interactive dashboard for Telangana dealers with real-time metrics, ML forecasts, and market benchmarks.
- **Throttle Talk - Automated Content Generation**: Production-ready content pipeline for the /news section, generating SEO-optimized articles twice daily using Perplexity and xAI Grok, with admin controls and logging.
- **User-Generated Content (UGC) System**: Production-ready story submission platform with AI moderation (xAI Grok) for car owner experiences, featuring quality scoring, safety checks, and a "Road Tales" carousel.
- **Enhanced SEO Infrastructure**: Dynamic sitemap.xml generator, NewsSEOHead component with auto-generated meta tags, Schema.org markup, and a machine-readable data endpoint (`/api/ai-info`) for LLM agents.

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
- **Perplexity**: Scans Indian automotive news for Throttle Talk content generation.
- **xAI Grok**: Compiles SEO-optimized articles for Throttle Talk, provides granular market insights, and moderates UGC.

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