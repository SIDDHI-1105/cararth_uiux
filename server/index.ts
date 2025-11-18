import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { 
  setupProcessErrorHandlers,
  errorHandler,
  requestIdMiddleware,
  createHealthCheckHandler
} from "./errorHandling.js";
import { setGlobalLogger } from "../shared/logging";
import { initializeMetricsService } from "./listingMetricsService.js";
import seoRoutes from "./routes/seoRoutes.js";

const app = express();

// Setup process-level error handlers first
setupProcessErrorHandlers();

// Initialize production-grade logging system
const initLogger = async () => {
  if (typeof setGlobalLogger === 'function') {
    const { ProductionLogger } = await import('./errorHandling.js');
    setGlobalLogger(new ProductionLogger());
  }
};
await initLogger();

// Add request ID middleware for better error tracking
app.use(requestIdMiddleware);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Redirect non-www to www for canonical URL consistency
app.use((req, res, next) => {
  const host = req.headers.host || '';
  if (host.startsWith('cararth.com') && !host.startsWith('www.')) {
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    return res.redirect(301, `${protocol}://www.${host}${req.url}`);
  }
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Graceful error handling for server startup
(async () => {
  try {
    console.log('🚀 Starting server initialization...');
    
    // Register routes with error handling
    let server;
    try {
      server = await registerRoutes(app);
      console.log('✅ Routes registered successfully');
      
      // Initialize daily listing metrics service (runs at midnight IST)
      try {
        const { storage } = await import('./storage.js');
        if ('db' in storage) {
          initializeMetricsService(storage);
          console.log('✅ Daily metrics service started');
        } else {
          console.log('⏭️ Daily metrics service skipped (requires database storage)');
        }
      } catch (metricsError) {
        console.error('❌ Failed to start metrics service:', metricsError);
        console.error('Continuing without metrics tracking...');
      }

      // Initialize AETHER production system
      try {
        const { initializeAether } = await import('./lib/aether/initialize.js');
        const aetherInitialized = await initializeAether(app);
        if (aetherInitialized) {
          console.log('✅ AETHER production system initialized');
        } else {
          console.log('⚠️ AETHER initialization completed with warnings');
        }
      } catch (aetherError) {
        console.error('❌ Failed to initialize AETHER:', aetherError);
        console.error('Continuing without AETHER features...');
      }

      // Initialize AETHER GEO Citation Monster scheduler
      try {
        const { citationScheduler } = await import('./citationScheduler.js');
        citationScheduler.start();
        console.log('✅ AETHER Citation Monster scheduler started');
      } catch (citationError) {
        console.error('❌ Failed to start citation scheduler:', citationError);
        console.error('Continuing without automatic citation monitoring...');
      }
    } catch (error) {
      console.error('❌ Failed to register routes:', error);
      console.error('Server cannot start without routes. Exiting.');
      process.exit(1);
    }

    // Add health check endpoint  
    app.get('/health', createHealthCheckHandler());
    
    // SEO routes - server-side rendering for SEO-critical pages (bots only)
    // These routes serve HTML with meta tags and JSON-LD to search engine crawlers
    // Regular users will skip these and get the full React app from Vite
    app.use(seoRoutes);
    
    // Server-side rendering for car detail pages (for social media crawlers)
    app.get('/car/:id', async (req, res, next) => {
      try {
        const { storage } = await import('./storage.js');
        
        // OPTIMIZATION: Check deleted listing cache first, but verify against DB
        // This handles reinstated listings and prevents false 410s
        const maybeDeleted = await storage.isListingDeleted(req.params.id);
        
        // Always check the actual DB to handle reinstated listings
        const car = await storage.getCar(req.params.id);
        
        // If cache said deleted but car exists, cleanup was already done in getCar()
        // Just continue serving the car normally
        if (car && maybeDeleted) {
          // Log the cache inconsistency for monitoring
          console.log(`Reinstated listing detected: ${req.params.id}`);
        }
        
        // Only return 410 if car truly doesn't exist in DB
        if (!car && maybeDeleted) {
          // Fast path: cached deletion confirmed by DB
          return res.status(410).send(`
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <title>Car Listing No Longer Available | CarArth</title>
                <meta http-equiv="refresh" content="3;url=/results">
              </head>
              <body>
                <h1>This car listing is no longer available</h1>
                <p>Redirecting you to search results...</p>
                <p>If not redirected, <a href="/results">click here</a>.</p>
              </body>
            </html>
          `);
        }
        
        if (!car) {
          // Car not found - add to deleted listings cache for future fast lookups
          // Guard against DB failures so we still return 410 even if cache write fails
          try {
            await storage.addDeletedListing({
              originalId: req.params.id,
              source: 'user_direct', // Unknown source
              reason: 'not_found'
            });
          } catch (cacheError) {
            // Log but continue - cache write failure shouldn't prevent 410 response
            console.error('Failed to cache deleted listing:', cacheError);
          }
          
          // Return 410 Gone to signal permanent deletion to search engines
          // This tells Google to remove these URLs from the index
          return res.status(410).send(`
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <title>Car Listing No Longer Available | CarArth</title>
                <meta http-equiv="refresh" content="3;url=/results">
              </head>
              <body>
                <h1>This car listing is no longer available</h1>
                <p>Redirecting you to search results...</p>
                <p>If not redirected, <a href="/results">click here</a>.</p>
              </body>
            </html>
          `);
        }
        
        // HTML escape helper for safe meta tag insertion
        const escapeHtml = (str: string) => {
          return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
        };
        
        // Format price helper
        const formatPrice = (price: number | string) => {
          const priceNum = typeof price === 'string' ? parseFloat(price) : price;
          if (priceNum >= 10000000) return `₹${(priceNum / 10000000).toFixed(2)} Cr`;
          if (priceNum >= 100000) return `₹${(priceNum / 100000).toFixed(2)} L`;
          return `₹${priceNum.toLocaleString('en-IN')}`;
        };
        
        // Format mileage helper
        const formatMileage = (mileage: number | string | null | undefined) => {
          if (!mileage) return "0 km";
          const mileageNum = typeof mileage === 'string' ? parseInt(mileage) : mileage;
          return `${mileageNum.toLocaleString('en-IN')} km`;
        };
        
        const carImage = (car.images && car.images[0]) || 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=600&fit=crop';
        const carTitle = escapeHtml(`${car.title} - ${formatPrice(car.price)} | CarArth`);
        const carDescription = escapeHtml(`${car.year} ${car.title} for sale at ${formatPrice(car.price)}. ${formatMileage(car.mileage)} driven, ${car.transmission} transmission, ${car.fuelType} fuel. Located in ${car.city}, ${car.state}. ${car.isVerified ? 'Verified ✓' : ''} listing on CarArth.`);
        const carUrl = escapeHtml(`https://www.cararth.com/car/${car.id}`);
        const carImageEscaped = escapeHtml(carImage);
        
        // Read the base HTML template
        const fs = await import('fs/promises');
        const path = await import('path');
        const htmlPath = path.join(process.cwd(), 'client', 'index.html');
        let html = await fs.readFile(htmlPath, 'utf-8');
        
        // Replace meta tags with car-specific data (all values are escaped)
        html = html
          .replace(/<title>.*?<\/title>/, `<title>${carTitle}</title>`)
          .replace(/<meta name="description" content=".*?">/, `<meta name="description" content="${carDescription}">`)
          .replace(/<meta property="og:type" content=".*?">/, `<meta property="og:type" content="product">`)
          .replace(/<meta property="og:url" content=".*?">/, `<meta property="og:url" content="${carUrl}">`)
          .replace(/<meta property="og:title" content=".*?">/, `<meta property="og:title" content="${carTitle}">`)
          .replace(/<meta property="og:description" content=".*?">/, `<meta property="og:description" content="${carDescription}">`)
          .replace(/<meta property="og:image" content=".*?">/, `<meta property="og:image" content="${carImageEscaped}">`)
          .replace(/<meta property="twitter:url" content=".*?">/, `<meta property="twitter:url" content="${carUrl}">`)
          .replace(/<meta property="twitter:title" content=".*?">/, `<meta property="twitter:title" content="${carTitle}">`)
          .replace(/<meta property="twitter:description" content=".*?">/, `<meta property="twitter:description" content="${carDescription}">`)
          .replace(/<meta property="twitter:image" content=".*?">/, `<meta property="twitter:image" content="${carImageEscaped}">`)
          .replace(/<link rel="canonical" href=".*?">/, `<link rel="canonical" href="${carUrl}">`);
        
        // Add structured data for the car (JSON.stringify handles escaping)
        const structuredData = {
          "@context": "https://schema.org",
          "@type": "Car",
          "name": `${car.brand} ${car.model}`,
          "brand": {
            "@type": "Brand",
            "name": car.brand
          },
          "model": car.model,
          "vehicleModelDate": car.year,
          "fuelType": car.fuelType,
          "vehicleTransmission": car.transmission,
          "mileageFromOdometer": {
            "@type": "QuantitativeValue",
            "value": car.mileage,
            "unitCode": "KMT"
          },
          "image": carImage,
          "offers": {
            "@type": "Offer",
            "price": typeof car.price === 'string' ? parseFloat(car.price) : car.price,
            "priceCurrency": "INR",
            "availability": "https://schema.org/InStock",
            "url": `https://www.cararth.com/car/${car.id}`,
            "seller": {
              "@type": "AutoDealer",
              "name": "CarArth"
            }
          }
        };
        
        // Inject structured data before closing head tag
        // Use safe JSON serialization for script context (escape <, >, / to prevent script breakout)
        const safeJsonLd = JSON.stringify(structuredData)
          .replace(/</g, '\\u003c')
          .replace(/>/g, '\\u003e')
          .replace(/\//g, '\\u002f');
        
        html = html.replace(
          '</head>',
          `<script type="application/ld+json">${safeJsonLd}</script>\n  </head>`
        );
        
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
      } catch (error) {
        console.error('Error rendering car detail page:', error);
        next(); // Pass to SPA on error
      }
    });
    
    // Explicit routes for static files (must be before Vite catch-all)
    app.get('/robots.txt', (req, res) => {
      res.sendFile('robots.txt', { root: 'public' });
    });
    app.get('/sitemap.xml', (req, res) => {
      res.type('application/xml');
      res.sendFile('sitemap.xml', { root: 'public' });
    });
    app.get('/what-is-cararth', (req, res) => {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), 'public', 'what-is-cararth.html');
      const html = fs.readFileSync(filePath, 'utf8');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    });
    
    // Serve other static files from public directory
    app.use(express.static('public'));

    // Setup development/production serving with error handling
    try {
      if (app.get("env") === "development") {
        console.log('🔧 Setting up Vite for development...');
        await setupVite(app, server);
        console.log('✅ Vite setup completed');
      } else {
        console.log('📦 Setting up static file serving...');
        serveStatic(app);
        console.log('✅ Static file serving configured');
      }
    } catch (error) {
      console.error('❌ Failed to setup file serving:', error);
      console.error('Continuing with basic Express server...');
    }
    
    // Add centralized error handling middleware (must be absolute last)
    app.use(errorHandler);

    // Start server with error handling
    const port = parseInt(process.env.PORT || '5000', 10);
    
    try {
      await new Promise<void>((resolve, reject) => {
        const serverInstance = server.listen({
          port,
          host: "0.0.0.0"
        }, () => {
          resolve();
        });
        
        // Handle server errors
        serverInstance.on('error', (error: any) => {
          if (error.code === 'EADDRINUSE') {
            console.error(`❌ Port ${port} is already in use`);
            reject(new Error(`Port ${port} is already in use`));
          } else {
            console.error('❌ Server error:', error);
            reject(error);
          }
        });
      });
      
      console.log(`✅ Server started successfully on port ${port}`);
      log(`serving on port ${port}`);
      
      // Start automated content generation scheduler (Throttle Talk)
      try {
        const { automatedContentGenerator } = await import('./automatedContentGenerator');
        automatedContentGenerator.startScheduler();
      } catch (error: any) {
        console.warn('⚠️ Could not start automated content generator:', error.message);
      }

      // Start Bing Webmaster Tools sync scheduler
      try {
        const { scheduleBingSyncJobs } = await import('./lib/aether/bingScheduler.js');
        scheduleBingSyncJobs();
      } catch (error: any) {
        console.warn('⚠️ Could not start Bing sync scheduler:', error.message);
      }

      // Start Google Search Console sync scheduler
      try {
        const { scheduleGscSyncJobs } = await import('./lib/aether/gscScheduler.js');
        scheduleGscSyncJobs();
      } catch (error: any) {
        console.warn('⚠️ Could not start GSC sync scheduler:', error.message);
      }
      
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      console.error('Server startup failed. Exiting.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Critical server startup error:', error);
    console.error('Application cannot start. Exiting.');
    process.exit(1);
  }
})().catch((error) => {
  console.error('❌ Unhandled server startup error:', error);
  process.exit(1);
});

// Note: Process-level error handlers are already setup in setupProcessErrorHandlers()
