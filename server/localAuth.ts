import { type Express } from 'express';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { db } from './db';
import { users, userReputation } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { createAppError, ErrorCategory, logError } from './errorHandling';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// Validation schemas
const registrationSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

// Setup local authentication strategy
export function setupLocalAuth(app: Express) {
  // Configure Passport Local Strategy
  passport.use(new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password'
    },
    async (email, password, done) => {
      try {
        // Find user by email
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!user) {
          return done(null, false, { message: 'Incorrect email or password' });
        }

        // Check if user has a password (might be OAuth-only user)
        if (!user.password) {
          return done(null, false, { message: 'Please use social login for this account' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return done(null, false, { message: 'Incorrect email or password' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));

  // Registration endpoint
  app.post('/api/auth/register', async (req, res) => {
    try {
      // Validate request body
      const validatedData = registrationSchema.parse(req.body);

      // Check if user already exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, validatedData.email))
        .limit(1);

      if (existingUser) {
        return res.status(400).json({
          error: 'Email already registered',
          message: 'An account with this email already exists'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);

      // Create new user
      const [newUser] = await db
        .insert(users)
        .values({
          email: validatedData.email,
          password: hashedPassword,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName || '',
          emailVerified: false
        })
        .returning();

      // Initialize user reputation
      await db
        .insert(userReputation)
        .values({
          userId: newUser.id,
          totalReputation: 0,
          level: 'newcomer'
        });

      // Log the user in automatically
      req.login(newUser, (err) => {
        if (err) {
          logError(err, 'Auto-login after registration');
          return res.status(500).json({ error: 'Registration successful but login failed' });
        }

        // Return user without password
        const { password: _, ...userWithoutPassword } = newUser;
        return res.json({
          success: true,
          message: 'Registration successful',
          user: userWithoutPassword
        });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
      }

      // Log the actual error for debugging
      console.error('❌ Registration error details:', error);
      logError(createAppError('Registration failed', 500, ErrorCategory.AUTHENTICATION), 'Registration error');
      return res.status(500).json({
        error: 'Registration failed',
        message: error instanceof Error ? error.message : 'An error occurred during registration'
      });
    }
  });

  // Login endpoint
  app.post('/api/auth/login', async (req, res, next) => {
    try {
      // Validate request body
      const validatedData = loginSchema.parse(req.body);

      passport.authenticate('local', (err: any, user: any, info: any) => {
        if (err) {
          logError(err, 'Login authentication error');
          return res.status(500).json({
            error: 'Authentication error',
            message: 'An error occurred during login'
          });
        }

        if (!user) {
          return res.status(401).json({
            error: 'Login failed',
            message: info?.message || 'Invalid email or password'
          });
        }

        req.login(user, (loginErr) => {
          if (loginErr) {
            logError(loginErr, 'Login session error');
            return res.status(500).json({
              error: 'Login failed',
              message: 'Failed to create session'
            });
          }

          // Return user without password
          const { password: _, ...userWithoutPassword } = user;
          return res.json({
            success: true,
            message: 'Login successful',
            user: userWithoutPassword
          });
        });
      })(req, res, next);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
      }

      logError(createAppError('Login failed', 500, ErrorCategory.AUTHENTICATION), 'Login error');
      return res.status(500).json({
        error: 'Login failed',
        message: 'An error occurred during login'
      });
    }
  });

  // Logout endpoint
  app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        logError(err, 'Logout error');
        return res.status(500).json({
          error: 'Logout failed',
          message: 'An error occurred during logout'
        });
      }

      res.json({
        success: true,
        message: 'Logout successful'
      });
    });
  });

  console.log('✅ Local authentication configured');
}
