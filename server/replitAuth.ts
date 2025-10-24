import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    const issuerUrl = process.env.ISSUER_URL || "https://replit.com/oidc";
    console.log(`🔐 OIDC Config: Using issuer ${issuerUrl} with client ID ${process.env.REPL_ID}`);
    return await client.discovery(
      new URL(issuerUrl),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  for (const domain of process.env
    .REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // Development mode bypass - create mock admin user
  if (process.env.NODE_ENV === 'development') {
    console.log('🔓 Development mode: Creating mock authenticated user');
    if (!req.user) {
      req.user = {
        id: 'bd93e13e-068a-4a5d-8013-a50a67bd146f', // kritarth1981@gmail.com
        claims: { sub: 'bd93e13e-068a-4a5d-8013-a50a67bd146f' }
      } as any;
    }
    return next();
  }

  const user = req.user as any;

  if (!req.isAuthenticated() || !user) {
    console.log('🔒 Authentication failed: User not authenticated or missing');
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Local login (email/password) doesn't have expires_at - allow it through
  if (!user.expires_at) {
    console.log('✅ Local authentication (no expiration check)');
    return next();
  }

  // OAuth login - check token expiration and refresh if needed
  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    console.log('🔒 Authentication failed: No refresh token');
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    console.log('🔄 Token refreshed successfully');
    return next();
  } catch (error) {
    console.log('🔒 Token refresh failed:', error);
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};

// Admin authentication middleware
export const isAdmin: RequestHandler = async (req, res, next) => {
  // Development mode bypass - allow all requests
  if (process.env.NODE_ENV === 'development') {
    console.log('🔓 Development mode: Bypassing admin check');
    return next();
  }

  const user = req.user as any;

  // First check if user is authenticated
  if (!req.isAuthenticated() || !user) {
    console.log('🔒 Admin check failed: User not authenticated');
    return res.status(401).json({ message: "Unauthorized - Authentication required" });
  }

  // Get user from database to check role
  try {
    const { storage } = await import('./storage.js');
    const userId = user.claims?.sub || user.id;
    
    if (!userId) {
      console.log('🔒 Admin check failed: No user ID found');
      return res.status(401).json({ message: "Unauthorized - Invalid user session" });
    }

    const dbUser = await storage.getUser(userId);
    
    if (!dbUser) {
      console.log('🔒 Admin check failed: User not found in database');
      return res.status(401).json({ message: "Unauthorized - User not found" });
    }

    // Check if user has admin role
    if (dbUser.role !== 'admin') {
      console.log(`🔒 Admin check failed: User ${userId} has role '${dbUser.role}', requires 'admin'`);
      return res.status(403).json({ message: "Forbidden - Admin access required" });
    }

    console.log(`✅ Admin authenticated: ${userId}`);
    return next();
  } catch (error) {
    console.error('🔒 Admin check error:', error);
    return res.status(500).json({ message: "Internal server error during admin check" });
  }
};