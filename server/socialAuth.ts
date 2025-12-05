import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { Strategy as GitHubStrategy } from "passport-github2";
import { Strategy as LinkedInStrategy } from "passport-linkedin-oauth2";
import type { Express } from "express";
import { db } from "./db";
import { users, socialAccounts, userReputation } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { logError, ErrorCategory, createAppError } from './errorHandling.js';

// Social OAuth configuration
interface SocialProfile {
  id: string;
  provider: string;
  email?: string;
  name?: string;
  avatar?: string;
  displayName?: string;
}

// Environment variables check
function checkRequiredSecrets() {
  const required = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    logError(createAppError('Missing social auth configuration', 500, ErrorCategory.AUTHENTICATION), 'Social auth secrets validation');
    logError({ message: 'Social login disabled - missing configuration', statusCode: 500 }, 'Social auth configuration validation');
    return false;
  }
  return true;
}

// Setup social authentication strategies
export function setupSocialAuth(app: Express) {
  const hasRequiredSecrets = checkRequiredSecrets();

  if (!hasRequiredSecrets) {
    logError({ message: 'Social authentication disabled - missing required secrets', statusCode: 500 }, 'Social auth configuration check');
    return;
  }

  // Passport serialization for session management
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    console.log('✅ Google OAuth configured with Client ID:', process.env.GOOGLE_CLIENT_ID.substring(0, 20) + '...');

    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_REDIRECT_URI || "http://localhost:5000/auth/google/callback"
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('✅ Google OAuth callback received for user:', profile.emails?.[0]?.value);
        const socialProfile: SocialProfile = {
          id: profile.id,
          provider: 'google',
          email: profile.emails?.[0]?.value,
          name: profile.displayName,
          avatar: profile.photos?.[0]?.value
        };

        const user = await handleSocialLogin(socialProfile, accessToken, refreshToken);
        return done(null, user);
      } catch (error) {
        console.error('❌ Google OAuth error:', error);
        return done(error, false);
      }
    }));

    // Google OAuth routes
    app.get('/auth/google',
      (_req, _res, next) => {
        console.log('🔐 Initiating Google OAuth flow...');
        next();
      },
      passport.authenticate('google', { scope: ['profile', 'email'] })
    );

    app.get('/auth/google/callback',
      (_req, _res, next) => {
        console.log('🔄 Google OAuth callback received, processing...');
        next();
      },
      passport.authenticate('google', {
        failureRedirect: '/login',
        failureMessage: true
      }),
      (_req, res) => {
        console.log('✅ Google sign-in successful, redirecting to home');
        res.redirect('/'); // Redirect to home after successful login
      }
    );
  } else {
    console.log('⚠️ Google OAuth not configured - GOOGLE_CLIENT_SECRET missing');

    // Add debug route to show configuration issues
    app.get('/auth/google', (req, res) => {
      res.status(500).send(`
        <h1>Google OAuth Not Configured</h1>
        <p><strong>Missing:</strong> GOOGLE_CLIENT_SECRET environment variable</p>
        <p><strong>Steps to fix:</strong></p>
        <ol>
          <li>Get your Google Client Secret from <a href="https://console.cloud.google.com/apis/credentials">Google Cloud Console</a></li>
          <li>Open <code>.env</code> file and paste the secret where it says <code>&lt;PASTE_GOOGLE_CLIENT_SECRET_HERE&gt;</code></li>
          <li>Restart the development server: <code>npm run dev</code></li>
        </ol>
        <p><strong>Expected redirect URI:</strong> ${process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/auth/google/callback'}</p>
        <p>Make sure this URL is added to "Authorized redirect URIs" in Google Console</p>
      `);
    });
  }

  // Facebook OAuth Strategy (if configured)
  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    passport.use(new FacebookStrategy({
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: "/api/auth/facebook/callback",
      profileFields: ['id', 'displayName', 'photos', 'email']
    }, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        const socialProfile: SocialProfile = {
          id: profile.id,
          provider: 'facebook',
          email: profile.emails?.[0]?.value,
          name: profile.displayName,
          avatar: profile.photos?.[0]?.value
        };
        
        const user = await handleSocialLogin(socialProfile, accessToken, refreshToken);
        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    }));

    app.get('/api/auth/facebook',
      passport.authenticate('facebook', { scope: ['email'] })
    );

    app.get('/api/auth/facebook/callback',
      passport.authenticate('facebook', { failureRedirect: '/login' }),
      (req, res) => {
        res.redirect('/news');
      }
    );
  }

  // GitHub OAuth Strategy (if configured)
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(new GitHubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "/api/auth/github/callback"
    }, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        const socialProfile: SocialProfile = {
          id: profile.id,
          provider: 'github',
          email: profile.emails?.[0]?.value,
          name: profile.displayName || profile.username,
          avatar: profile.photos?.[0]?.value
        };
        
        const user = await handleSocialLogin(socialProfile, accessToken, refreshToken);
        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    }));

    app.get('/api/auth/github',
      passport.authenticate('github', { scope: ['user:email'] })
    );

    app.get('/api/auth/github/callback',
      passport.authenticate('github', { failureRedirect: '/login' }),
      (req, res) => {
        res.redirect('/news');
      }
    );
  }

  // LinkedIn OAuth Strategy (if configured)
  if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
    passport.use(new LinkedInStrategy({
      clientID: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      callbackURL: "/api/auth/linkedin/callback",
      scope: ['r_emailaddress', 'r_liteprofile']
    }, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        const socialProfile: SocialProfile = {
          id: profile.id,
          provider: 'linkedin',
          email: profile.emails?.[0]?.value,
          name: profile.displayName,
          avatar: profile.photos?.[0]?.value
        };
        
        const user = await handleSocialLogin(socialProfile, accessToken, refreshToken);
        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    }));

    app.get('/api/auth/linkedin',
      passport.authenticate('linkedin')
    );

    app.get('/api/auth/linkedin/callback',
      passport.authenticate('linkedin', { failureRedirect: '/login' }),
      (req, res) => {
        res.redirect('/news');
      }
    );
  }

  logError({ message: 'Social authentication configured successfully', statusCode: 200 }, 'Social auth initialization');
}

// Handle social login logic
async function handleSocialLogin(
  profile: SocialProfile, 
  accessToken: string, 
  refreshToken?: string
) {
  try {
    // Check if social account already exists
    const [existingSocialAccount] = await db
      .select()
      .from(socialAccounts)
      .where(eq(socialAccounts.providerUserId, profile.id))
      .limit(1);

    let user;

    if (existingSocialAccount) {
      // Update existing social account
      await db
        .update(socialAccounts)
        .set({
          accessToken,
          refreshToken,
          tokenExpiresAt: refreshToken ? new Date(Date.now() + 3600000) : null, // 1 hour
          providerEmail: profile.email,
          providerName: profile.name,
          providerAvatar: profile.avatar,
          updatedAt: new Date()
        })
        .where(eq(socialAccounts.id, existingSocialAccount.id));

      // Get the associated user
      [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, existingSocialAccount.userId))
        .limit(1);
    } else {
      // Check if user with this email already exists
      let existingUser = null;
      if (profile.email) {
        [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, profile.email))
          .limit(1);
      }

      if (existingUser) {
        // Link social account to existing user
        user = existingUser;
      } else {
        // Create new user
        [user] = await db
          .insert(users)
          .values({
            email: profile.email,
            firstName: profile.name?.split(' ')[0] || profile.displayName,
            lastName: profile.name?.split(' ').slice(1).join(' ') || '',
            profileImageUrl: profile.avatar,
          })
          .returning();

        // Initialize user reputation
        await db
          .insert(userReputation)
          .values({
            userId: user.id,
            totalReputation: 0,
            level: 'newcomer'
          });
      }

      // Create social account record
      await db
        .insert(socialAccounts)
        .values({
          userId: user.id,
          provider: profile.provider,
          providerUserId: profile.id,
          accessToken,
          refreshToken,
          tokenExpiresAt: refreshToken ? new Date(Date.now() + 3600000) : null,
          providerEmail: profile.email,
          providerName: profile.name,
          providerAvatar: profile.avatar,
        });
    }

    logError({ message: 'Social login successful', statusCode: 200 }, 'Social auth login success');
    return user;

  } catch (error) {
    logError(createAppError('Social authentication operation failed', 500, ErrorCategory.AUTHENTICATION), 'Social auth error handler');
    throw error;
  }
}

// Get user's social accounts
export async function getUserSocialAccounts(userId: string) {
  return await db
    .select()
    .from(socialAccounts)
    .where(eq(socialAccounts.userId, userId));
}

// Remove social account connection
export async function disconnectSocialAccount(userId: string, provider: string) {
  await db
    .delete(socialAccounts)
    .where(and(eq(socialAccounts.userId, userId), eq(socialAccounts.provider, provider)));
}