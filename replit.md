# Cararth - India's Used Car Search Engine

## Overview
Cararth is India's comprehensive used car search engine, aggregating listings from multiple portals. It provides intelligent pricing, authentic verification, and AI-powered market analytics to empower users to discover, compare, and buy/sell cars with confidence. Key capabilities include multi-LLM AI for market analysis and compliance, an advanced caching system, real-time aggregation, AI-powered listing validation, and enterprise partner syndication.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
Cararth is a TypeScript monorepo utilizing Drizzle ORM with PostgreSQL and a REST API architecture.

### UI/UX Decisions
The frontend uses React 18, Vite, Wouter for routing, Radix UI primitives with shadcn/ui, and Tailwind CSS for responsive design and theme support. It emphasizes component composition, form validation, and clear loading states.

**Glassmorphism Design System (November 2025)**: iOS-inspired premium design with day/night theme switching. Features 30px backdrop blur (desktop), 20px (mobile), 55-60% opacity (day mode) / 70-80% (night mode), 2.5px glowing borders (orange in day, blue in night). Implemented across all major surfaces: homepage sections (HowItWorks, TrustSection, KeyInsights, FAQ), search results (FilterPanel, BadgeLegend, source filters), car detail pages (pricing cards, contact seller, Telangana intelligence), and forms. The `glass-contrast` variant (50% day / 80% night opacity) ensures text legibility in content-heavy areas with explicit white text tokens for night mode.

### Technical Implementations
- **Frontend**: TanStack Query for state management, React Hook Form with Zod for forms.
- **Backend**: Node.js with Express.js, TypeScript, RESTful API.
- **Data Layer**: Drizzle ORM with PostgreSQL, shared TypeScript schemas, Zod for runtime type checking.
- **Authentication**: Session management, user authentication, and seller-based car listing ownership.
- **Search**: Fast, cached search with cross-filter support, deduplication, and intelligent image-priority sorting.
- **Communication**: Seller contact and notification system using Twilio (WhatsApp) and Nodemailer (email), with phone normalization via `libphonenumber-js`.
- **AI SEO**: Enhanced Schema.org structured data, AI-friendly robots.txt, dynamic sitemap.xml, machine-readable data endpoint (`/api/ai-info`), and static file serving.
- **Server-Side SEO Rendering**: Production-ready SSR for critical pages with meta tags and JSON-LD injection before client-side hydration.
- **404 & SEO Cleanup**: Intelligent 410 Gone system with deleted listings cache (4-hour TTL), auto-cleanup for reinstated cars, and canonical URL normalization (https://www.cararth.com). Features intelligent double-check logic that always verifies DB before returning 410, preventing false positives for reinstated listings.
- **Scraper Monitoring**: Self-healing system with persistent retries, exponential backoff, and health logs.
- **Trust Layer & Listing Validation**: Centralized ingestion service enforces validation, rejecting non-compliant listings.
- **Scrapers**: Implementations for CarDekho, OLX, and Facebook Marketplace, all routing through a centralized ingestion service.

### Feature Specifications
- **Google Vehicle Listings Compliance**: Validator enforcing Google's requirements for dealer listings, including vehicle type, title status, data, image quality, and availability.
- **Google Vehicle Feed**: RSS/XML feed generator compliant with Google Merchant Center specifications, exporting only fully compliant listings.
- **Enterprise Partner Syndication**: Allows partners to post listings for multi-platform distribution with multi-LLM compliance.
- **Partner Self-Service Portal**: Dashboard for dealers to manage inventory, offering bulk upload and instant cache invalidation.
- **Market Intelligence**: Integrates SIAM sales data, Google Trends, xAI Grok for granular market insights, and Telangana RTA Data for authentic vehicle registration statistics and demand scoring.
- **Image-Based Quality Ranking**: Search results incorporate image quality scoring.
- **Dealer Inventory Upload System**: Platform for inventory management with strict validation, Google Vehicle Listing feed compliance, and comprehensive bulk upload.
- **Dealer Performance Analytics Dashboard**: Interactive dashboard for Telangana dealers with real-time metrics and forecasts.
- **Throttle Talk - Automated Content Generation**: Content pipeline for the /news section, generating SEO-optimized articles using Perplexity and xAI Grok.
- **User-Generated Content (UGC) System**: Story submission platform with AI moderation (xAI Grok) for car owner experiences.
- **Enhanced SEO Infrastructure**: Dynamic sitemap.xml, NewsSEOHead component, and machine-readable data endpoint for LLM agents.
- **City Landing Pages**: SEO-optimized landing pages for major Indian markets with city-specific content and live car listings.
- **Pillar/Cluster Content Strategy**: SEO content system with bidirectional linking for guides like "AI Verification" and "Trust-Over-Traffic".
- **Project AETHER**: Adaptive Engine for Trust, Heuristics & Evolving Rankings - An SEO/GEO monitoring and analytics system. Features include GEO Sweep Monitoring (tracking CarArth mentions in AI responses), SEO Audit Tool (analyzing website technical SEO), Content Brief Generator (using OpenAI for SEO-optimized content briefs), and Competitive Benchmarking & Playbooks (tracking performance against competitors).

## External Dependencies

### Database & Storage
- **Neon Database**: Serverless PostgreSQL.
- **connect-pg-simple**: PostgreSQL session store.
- **Google Cloud Storage**: For vehicle images.

### UI & Styling
- **Radix UI**: Accessible UI primitives.
- **Tailwind CSS**: Utility-first CSS framework.
- **Lucide React**: Icon library.
- **Google Fonts**: Inter font family.

### Development & Build Tools
- **Vite**: Build tool.
- **TypeScript**: Type safety.
- **PostCSS**: CSS processing.

### API & State Management
- **TanStack Query**: Server state management.
- **React Hook Form**: Form handling.
- **Zod**: Schema validation.

### Routing & Navigation
- **Wouter**: Lightweight React router.

### Data Visualization
- **Recharts**: Composable charting library.

### LLM Providers
- **OpenAI**: ToS extraction, AETHER GEO monitoring, content brief generation.
- **Google Gemini**: PII detection.
- **Anthropic Claude**: Copyright analysis.
- **Perplexity**: Indian automotive news scanning.
- **xAI Grok**: SEO-optimized article generation, market insights, UGC moderation.

### Web Scraping
- **Firecrawl**: Premium web scraping service.
- **Crawl4AI**: Free, self-hosted web scraping.
- **Apify**: Cloud-based web scraping (OLX, Facebook Marketplace).
- **axios + cheerio**: Custom web scraping (CarDekho).

### Notification & Communication
- **Twilio**: WhatsApp Business API.
- **Nodemailer**: Email delivery.
- **libphonenumber-js**: Phone number normalization.

### Data Sources
- **Telangana Open Data Portal**: Vehicle registration data.
- **SIAM (Society of Indian Automobile Manufacturers)**: Sales data.
- **Google Trends**: Market trend insights.
- **VAHAN**: Vehicle registration data.