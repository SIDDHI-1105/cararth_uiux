import { randomBytes } from 'crypto';
import { storage } from './storage';

interface EmailVerificationConfig {
  tokenExpirationHours: number;
  fromEmail: string;
  appName: string;
  baseUrl: string;
}

const defaultConfig: EmailVerificationConfig = {
  tokenExpirationHours: 24,
  fromEmail: 'noreply@cararth.com',
  appName: 'Cararth',
  baseUrl: process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : 'https://cararth.com'
};

export class EmailVerificationService {
  private config: EmailVerificationConfig;

  constructor(config?: Partial<EmailVerificationConfig>) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Generate a secure verification token
   */
  generateVerificationToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Generate token expiration time
   */
  generateTokenExpiration(): Date {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.config.tokenExpirationHours);
    return expiresAt;
  }

  /**
   * Create verification token and store in database
   */
  async createVerificationToken(userId: string): Promise<string> {
    const token = this.generateVerificationToken();
    const expiresAt = this.generateTokenExpiration();

    await storage.setUserVerificationToken(userId, token, expiresAt);
    
    return token;
  }

  /**
   * Verify token and mark user as email verified
   */
  async verifyToken(token: string): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      const user = await storage.getUserByVerificationToken(token);
      
      if (!user) {
        return { success: false, error: 'Invalid verification token' };
      }

      if (user.verificationTokenExpiresAt && user.verificationTokenExpiresAt < new Date()) {
        return { success: false, error: 'Verification token has expired' };
      }

      if (user.emailVerified) {
        return { success: false, error: 'Email is already verified' };
      }

      // Mark user as verified and clear token
      await storage.setUserEmailVerified(user.id, true);
      await storage.clearUserVerificationToken(user.id);

      return { success: true, userId: user.id };
    } catch (error) {
      console.error('Token verification error:', error);
      return { success: false, error: 'Token verification failed' };
    }
  }

  /**
   * Generate email verification HTML content
   */
  generateVerificationEmail(email: string, token: string, firstName?: string): string {
    const verificationUrl = `${this.config.baseUrl}/api/seller/verify-email?token=${token}`;
    const userName = firstName || 'Seller';

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Verify Your Email - ${this.config.appName}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; border-radius: 0 0 8px 8px; }
        .legal { font-size: 12px; color: #9ca3af; margin-top: 20px; line-height: 1.4; }
        .highlight { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${this.config.appName}</h1>
        <p>India's Own Used Car Search Engine</p>
    </div>
    
    <div class="content">
        <h2>Welcome to ${this.config.appName}, ${userName}!</h2>
        
        <p>You're one step away from joining India's most trusted car marketplace. Click the button below to verify your email and start listing your car across multiple platforms:</p>
        
        <div style="text-align: center;">
            <a href="${verificationUrl}" class="button" data-testid="button-verify-email">
                Verify My Email Address
            </a>
        </div>
        
        <div class="highlight">
            <strong>🚗 What happens next?</strong><br>
            After verification, you can post your car listing once and we'll distribute it across multiple automotive platforms including CarDekho, OLX, Cars24, and more - completely legally and with full compliance.
        </div>
        
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="background: #f3f4f6; padding: 10px; word-break: break-all; font-family: monospace; font-size: 12px;">
            ${verificationUrl}
        </p>
        
        <p><strong>This verification link expires in ${this.config.tokenExpirationHours} hours.</strong></p>
        
        <div class="legal">
            <strong>📋 Legal Notice:</strong> By verifying your email, you agree to our cross-platform listing distribution service. 
            We act as a technology service provider to help you reach more buyers. You retain full ownership of your listings 
            and can withdraw consent at any time. Each platform's terms of service apply to interactions on their respective sites.
        </div>
    </div>
    
    <div class="footer">
        <p><strong>Cararth</strong> - India's Own Used Car Search Engine</p>
        <p>📧 connect@cararth.com | 🌐 cararth.com</p>
        <p style="font-size: 12px;">This email was sent to ${email}. If you didn't request this, please ignore this email.</p>
    </div>
</body>
</html>`;
  }

  /**
   * Send verification email (stub - integrate with your email service)
   */
  async sendVerificationEmail(email: string, token: string, firstName?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const htmlContent = this.generateVerificationEmail(email, token, firstName);
      
      // TODO: Integrate with actual email service (SendGrid, AWS SES, etc.)
      // For now, just log the email content in development
      if (process.env.NODE_ENV === 'development') {
        console.log('\n📧 EMAIL VERIFICATION - DEVELOPMENT MODE');
        console.log('To:', email);
        console.log('Subject: Verify Your Email - Cararth');
        console.log('Verification URL:', `${this.config.baseUrl}/api/seller/verify-email?token=${token}`);
        console.log('HTML Content:', htmlContent);
        console.log('📧 EMAIL END\n');
        
        return { success: true };
      }
      
      // In production, implement actual email sending
      throw new Error('Email service not configured for production');
      
    } catch (error) {
      console.error('Email sending error:', error);
      return { success: false, error: 'Failed to send verification email' };
    }
  }

  /**
   * Resend verification email for a user
   */
  async resendVerificationEmail(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await storage.getUser(userId);
      if (!user || !user.email) {
        return { success: false, error: 'User not found' };
      }

      if (user.emailVerified) {
        return { success: false, error: 'Email is already verified' };
      }

      // Generate new token
      const token = await this.createVerificationToken(userId);
      
      // Send email
      const emailResult = await this.sendVerificationEmail(user.email, token, user.firstName || undefined);
      
      return emailResult;
    } catch (error) {
      console.error('Resend verification error:', error);
      return { success: false, error: 'Failed to resend verification email' };
    }
  }
}

// Export singleton instance
export const emailVerificationService = new EmailVerificationService();