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
- **AI SEO**: Enhanced Schema.org structured data, AI-friendly robots.txt with API endpoint blocking, comprehensive dynamic sitemap.xml (using `cararth.com` without www), machine-readable data endpoint (`/api/ai-info`), and static file serving.
- **Server-Side SEO Rendering**: Production-ready SSR for SEO-critical pages (`/`, `/sell`, `/used-cars-hyderabad`) with meta tags and JSON-LD injected server-side before client JavaScript loads. Uses `renderShell` helper in `server/lib/renderShell.ts` to generate HTML shells with Organization, FAQPage, Service, and WebPage schemas. Routes defined in `server/routes/seoRoutes.ts` and mounted before Vite middleware in `server/index.ts` to ensure search engines can read structured data immediately. Includes canonical URLs, Open Graph tags for social sharing, and proper meta descriptions/keywords for each page.
- **404 & SEO Cleanup**: Production-ready 404 audit system with automated URL health checking (`scripts/audit-404.ts`). Implements proper HTTP status codes: 410 Gone for deleted car listings (signals permanent removal to search engines), robots.txt blocks `/api/*` endpoints from indexing (except `/api/ai-info` for AI agents), and generates monthly audit reports (`404_audit.json`). See `404_AUDIT_SUMMARY.md` for implementation details.
- **Scraper Monitoring**: Production-ready, self-healing system with persistent retry states, exponential backoff, database-backed health logs, and an admin dashboard.
- **Trust Layer & Listing Validation**: Centralized ingestion service enforces mandatory Trust Layer validation, rejecting listings with high severity violations and ensuring only approved listings are saved to the database.
- **Scrapers**: Implementations for CarDekho (axios + cheerio), OLX, and Facebook Marketplace (Apify), all routing through the centralized ingestion service.

### Feature Specifications
- **Google Vehicle Listings Compliance**: Production-ready compliance validator enforcing Google's strict requirements for dealer listings appearing in Google Search and Maps. Validates 5 critical requirements: vehicle type (passenger cars only, no commercial/two-wheelers), clean title status (no salvage/flood/accident), data requirements (VIN and odometer REQUIRED, RTO verification recommended), image quality (800x600+, NO watermarks/text overlays), and availability (immediately available, no "coming soon"). Integrated into listing scoring system with Google compliance score (0-100) and UI badges ("Google Ready ✓" for compliant listings). Non-compliant listings are properly flagged with detailed issue reporting. **Note**: Enforcement in dealer upload flow (gating persistence) is pending implementation.
- **Google Vehicle Feed**: Production-ready RSS/XML feed generator (`/api/google-vehicle-feed.xml`) compliant with Google Merchant Center's Vehicle Listings specification. Exports fully-compliant dealer listings with all required elements including vehicle_year, vehicle_make, vehicle_model, vehicle_mileage (with unit="km"), vehicle_fuel_type, vehicle_transmission, dealer address (country/region/locality/postal_code), and proper image handling (single image_link + additional_image_link for extras). Only includes listings with googleComplianceScore >= 100 and all required fields (VIN, mileage, images). Includes `/api/google-vehicle-feed/stats` endpoint for monitoring feed health. **Note**: Requires complete dealer metadata (postal codes, full addresses) for full production compliance.
- **Enterprise Partner Syndication**: Allows partners to post listings once for multi-platform distribution, including multi-LLM compliance.
- **Partner Self-Service Portal**: Dashboard for dealers to manage inventory, offering shareable invite links, role-based access, instant cache invalidation, and a non-technical Add Listing form with Bulk Upload (CSV and media files).
- **Market Intelligence**: Integrates SIAM sales data and Google Trends for price insights and real-time statistics (e.g., total listings). Features xAI Grok for granular market intelligence specific to Hyderabad/Telangana, analyzing trends across various car attributes and providing deal quality scoring. Includes integration with Telangana RTA Data for authentic vehicle registration statistics and demand scoring.
- **Image-Based Quality Ranking**: Search results incorporate image quality scoring.
- **Dealer Inventory Upload System**: Production-ready platform for vehicle inventory management with strict validation (VIN, price, image), Google Vehicle Listing feed compliance, Quick Add, and comprehensive Bulk Upload supporting CSV data, vehicle images, and RC/Insurance documents, with detailed validation reports.
- **Dealer Performance Analytics Dashboard**: Interactive dashboard for Telangana dealers with real-time metrics, ML forecasts, and market benchmarks.
- **Throttle Talk - Automated Content Generation**: Production-ready content pipeline for the /news section, generating SEO-optimized articles twice daily using Perplexity and xAI Grok, with admin controls and logging. Includes newsletter subscription, interactive polls, Disqus comments, and GA4 analytics tracking.
- **Throttle Talk Navigation Enhancements**: Mega-dropdown menu component with hover activation showing categorized content (Market Intelligence, Community, OEM Analytics, Road Tales) and featured articles. Related articles carousel on detail pages with fully responsive design (1/2/3 items per breakpoint), dot pagination, and smooth transitions.
- **User-Generated Content (UGC) System**: Production-ready story submission platform with AI moderation (xAI Grok) for car owner experiences, featuring quality scoring, safety checks, and a "Road Tales" carousel.
- **Enhanced SEO Infrastructure**: Dynamic sitemap.xml generator, NewsSEOHead component with auto-generated meta tags, Schema.org markup, and a machine-readable data endpoint (`/api/ai-info`) for LLM agents.
- **City Landing Pages**: SEO-optimized landing pages for major Indian markets (Hyderabad, Delhi NCR, Mumbai, Bangalore, Pune, Chennai) at `/used-cars-[city]` routes. Features reusable CityLandingPage component driven by centralized CITY_CONFIG data source for maintainability, complete Schema.org LocalBusiness markup with PostalAddress, unique meta tags and canonical URLs for each city, city-specific market insights and popular brands, integration with live car listings filtered by city, and footer navigation with "Popular Cities" section. New cities can be added by updating the single CITY_CONFIG object in `client/src/config/city-data.ts`.
- **Pillar/Cluster Content Strategy**: Production-ready SEO content system with bidirectional pillar ↔ cluster article linking. Pillar article (`/guides/ai-verified-used-car-trust-india`) is a comprehensive 3000-word React component with Schema.org Article markup, Open Graph tags, Twitter Cards, and responsive SocialShareButtons. Cluster article (`/guides/ai-check-vs-manual-inspection.html`) is a static HTML deep-dive with inline social sharing buttons (LinkedIn, Twitter, Facebook, WhatsApp). Both integrated into Throttle Talk navigation under "Guides" tab. Includes SEO best practices: canonical URLs, mobile-first design, proper heading hierarchy, internal linking, and social meta tags. See `SEO_SOCIAL_SHARING_GUIDE.md` for indexing workflow.

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