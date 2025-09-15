import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
    } catch (error) {
      console.error('❌ Failed to register routes:', error);
      console.error('Server cannot start without routes. Exiting.');
      process.exit(1);
    }

    // Add global error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      
      // Log the error for debugging
      console.error('❌ Request error:', {
        status,
        message,
        stack: err.stack,
        url: _req.url,
        method: _req.method
      });

      // Include stack trace in development
      const responsePayload = process.env.NODE_ENV === 'development' 
        ? { message, stack: err.stack }
        : { message };

      res.status(status).json(responsePayload);
      // Never throw after sending response
    });

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

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled promise rejection:', reason);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});
