/**
 * Notification Service for CarArth
 * 
 * Handles delivery of lead notifications to sellers via email/WhatsApp
 * with retry logic and delivery tracking.
 */

import nodemailer from 'nodemailer';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import twilio from 'twilio';
import type { Contact } from '@shared/schema.js';

export interface NotificationResult {
  success: boolean;
  method: 'email' | 'whatsapp' | 'both' | 'none';
  error?: string;
  deliveredAt?: Date;
}

/**
 * Normalize phone number to E.164 format
 */
export function normalizePhoneNumber(phone: string, defaultCountry: string = 'IN'): string | null {
  try {
    // Remove spaces and special characters
    const cleaned = phone.replace(/\s+/g, '').trim();
    
    // Try parsing with default country
    if (isValidPhoneNumber(cleaned, defaultCountry as any)) {
      const phoneNumber = parsePhoneNumber(cleaned, defaultCountry as any);
      return phoneNumber.format('E.164');
    }
    
    // Try parsing without country code
    if (isValidPhoneNumber(cleaned)) {
      const phoneNumber = parsePhoneNumber(cleaned);
      return phoneNumber.format('E.164');
    }
    
    return null;
  } catch (error) {
    console.error('❌ Phone normalization failed:', error);
    return null;
  }
}

let cachedTransporter: nodemailer.Transporter | null = null;
let transporterInitialized = false;

/**
 * Create email transporter (use environment variables for production)
 */
async function createEmailTransporter(): Promise<nodemailer.Transporter | null> {
  // Return cached transporter if already initialized
  if (transporterInitialized) {
    return cachedTransporter;
  }
  
  // Production: use real SMTP credentials
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    cachedTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
    transporterInitialized = true;
    console.log('📧 Using production SMTP configuration');
    return cachedTransporter;
  }
  
  // Development: create test account with ethereal.email
  if (process.env.NODE_ENV === 'development') {
    try {
      const testAccount = await nodemailer.createTestAccount();
      cachedTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      transporterInitialized = true;
      console.log('📧 Using Ethereal test email account for development');
      console.log(`   View emails at: https://ethereal.email/login`);
      console.log(`   User: ${testAccount.user}`);
      console.log(`   Pass: ${testAccount.pass}`);
      return cachedTransporter;
    } catch (error) {
      console.error('❌ Failed to create test email account:', error);
      transporterInitialized = true;
      cachedTransporter = null;
      return null;
    }
  }
  
  // No email configured
  transporterInitialized = true;
  console.log('⚠️ Email not configured - notifications will not be sent');
  return null;
}

/**
 * Send email notification to seller about new lead
 */
async function sendEmailNotification(
  sellerEmail: string,
  sellerName: string,
  leadData: {
    buyerName: string;
    buyerPhone: string;
    buyerEmail: string;
    message: string;
    carTitle: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const transporter = await createEmailTransporter();
  
  if (!transporter) {
    console.log('📧 Email not configured, skipping email notification');
    return { success: false, error: 'Email not configured' };
  }
  
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@cararth.com',
      to: sellerEmail,
      subject: `New Lead: ${leadData.buyerName} is interested in your ${leadData.carTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">New Lead from CarArth</h2>
          
          <p>Hi ${sellerName},</p>
          
          <p>You have a new inquiry about your <strong>${leadData.carTitle}</strong>.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Buyer Details:</h3>
            <p><strong>Name:</strong> ${leadData.buyerName}</p>
            <p><strong>Phone:</strong> ${leadData.buyerPhone}</p>
            <p><strong>Email:</strong> ${leadData.buyerEmail}</p>
            <p><strong>Message:</strong></p>
            <p style="font-style: italic;">"${leadData.message}"</p>
          </div>
          
          <p>Please contact the buyer as soon as possible to close the deal!</p>
          
          <p style="color: #6b7280; font-size: 12px;">
            This is an automated notification from CarArth. 
            You're receiving this because you listed a car on our platform.
          </p>
        </div>
      `,
      text: `
New Lead from CarArth

Hi ${sellerName},

You have a new inquiry about your ${leadData.carTitle}.

Buyer Details:
- Name: ${leadData.buyerName}
- Phone: ${leadData.buyerPhone}
- Email: ${leadData.buyerEmail}
- Message: "${leadData.message}"

Please contact the buyer as soon as possible!
      `.trim(),
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email notification sent to ${sellerEmail}`);
    
    // Log preview URL for test accounts (Ethereal)
    if (process.env.NODE_ENV === 'development') {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`   📬 View email: ${previewUrl}`);
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('❌ Email notification failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Email send failed' 
    };
  }
}

/**
 * Send WhatsApp notification to seller using Twilio API
 */
async function sendWhatsAppNotification(
  sellerPhone: string,
  sellerName: string,
  leadData: {
    buyerName: string;
    buyerPhone: string;
    buyerEmail: string;
    message: string;
    carTitle: string;
  }
): Promise<{ success: boolean; error?: string }> {
  // Check if Twilio credentials are configured
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_WHATSAPP_NUMBER) {
    console.log('📱 WhatsApp not configured, skipping WhatsApp notification');
    return { 
      success: false, 
      error: 'WhatsApp not configured - missing Twilio credentials' 
    };
  }
  
  try {
    // Initialize Twilio client
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    
    // Normalize seller phone number to E.164 format
    const normalizedPhone = normalizePhoneNumber(sellerPhone, 'IN');
    if (!normalizedPhone) {
      console.error(`❌ Invalid seller phone number: ${sellerPhone}`);
      return {
        success: false,
        error: `Invalid phone number format: ${sellerPhone}`
      };
    }
    
    // Format message for WhatsApp
    const whatsappMessage = `🚗 *New Lead from CarArth!*

Hi ${sellerName},

You have a new inquiry about your *${leadData.carTitle}*.

*Buyer Details:*
👤 Name: ${leadData.buyerName}
📱 Phone: ${leadData.buyerPhone}
📧 Email: ${leadData.buyerEmail}

💬 Message: "${leadData.message}"

Please contact the buyer as soon as possible to close the deal!

_This is an automated notification from CarArth._`;
    
    // Send WhatsApp message via Twilio
    const message = await client.messages.create({
      body: whatsappMessage,
      from: process.env.TWILIO_WHATSAPP_NUMBER, // Format: whatsapp:+14155238886
      to: `whatsapp:${normalizedPhone}`,         // Format: whatsapp:+919876543210
    });
    
    console.log(`✅ WhatsApp notification sent to ${sellerPhone}`);
    console.log(`   Message SID: ${message.sid}`);
    console.log(`   Status: ${message.status}`);
    
    return { success: true };
  } catch (error: any) {
    console.error('❌ WhatsApp notification failed:', error);
    
    // Handle specific Twilio errors
    if (error.code === 63016) {
      return {
        success: false,
        error: 'Recipient has not joined WhatsApp sandbox. Ask them to send the join code first.'
      };
    }
    
    return { 
      success: false, 
      error: error.message || 'WhatsApp send failed' 
    };
  }
}

/**
 * Main notification service - send lead notification to seller
 */
export async function notifySeller(
  sellerInfo: {
    id: string;
    name: string;
    email: string;
    phone: string;
    emailVerified: boolean;
    phoneVerified: boolean;
  },
  leadData: {
    buyerName: string;
    buyerPhone: string;
    buyerEmail: string;
    message: string;
    carTitle: string;
  }
): Promise<NotificationResult> {
  console.log(`📬 Notifying seller ${sellerInfo.name} about new lead from ${leadData.buyerName}`);
  
  let emailResult: { success: boolean; error?: string } | null = null;
  let whatsappResult: { success: boolean; error?: string } | null = null;
  
  // Try WhatsApp first if phone is verified (preferred for India)
  if (sellerInfo.phoneVerified && sellerInfo.phone) {
    whatsappResult = await sendWhatsAppNotification(
      sellerInfo.phone,
      sellerInfo.name,
      leadData
    );
  }
  
  // Try email if verified (fallback or simultaneous)
  if (sellerInfo.emailVerified && sellerInfo.email) {
    emailResult = await sendEmailNotification(
      sellerInfo.email,
      sellerInfo.name,
      leadData
    );
  }
  
  // Determine result
  const whatsappSuccess = whatsappResult?.success || false;
  const emailSuccess = emailResult?.success || false;
  
  if (whatsappSuccess && emailSuccess) {
    return { success: true, method: 'both', deliveredAt: new Date() };
  } else if (whatsappSuccess) {
    return { success: true, method: 'whatsapp', deliveredAt: new Date() };
  } else if (emailSuccess) {
    return { success: true, method: 'email', deliveredAt: new Date() };
  } else {
    const errors = [whatsappResult?.error, emailResult?.error].filter(Boolean).join('; ');
    return { 
      success: false, 
      method: 'none', 
      error: errors || 'No verified contact methods available' 
    };
  }
}

/**
 * Retry failed notifications with exponential backoff
 * 
 * Retry count logic:
 * - 0: Initial attempt failed
 * - 1: After 1st failure, wait 5min then retry (1st retry)
 * - 2: After 2nd failure, wait 30min then retry (2nd retry)
 * - 3: After 3rd failure, wait 2hr then retry (3rd retry)
 * - 4+: Max retries exceeded, stop
 */
export async function retryNotification(
  contact: Contact,
  sellerInfo: any,
  carTitle: string
): Promise<NotificationResult> {
  const retryCount = contact.notificationRetryCount || 0;
  
  // Allow up to 3 retry attempts (after initial attempt = 4 total attempts)
  // retryCount: 1, 2, 3 = allow retry; 4+ = stop
  if (retryCount > 3) {
    console.log(`❌ Max retries (3) reached for contact ${contact.id}`);
    return { 
      success: false, 
      method: 'none', 
      error: 'Max retries exceeded (3 attempts)' 
    };
  }
  
  // If this is the first notification (retryCount = 0), don't apply backoff
  if (retryCount === 0) {
    console.log(`📬 Initial notification attempt for contact ${contact.id}`);
    return await notifySeller(sellerInfo, {
      buyerName: contact.buyerName,
      buyerPhone: contact.buyerPhone,
      buyerEmail: contact.buyerEmail,
      message: contact.message || '',
      carTitle,
    });
  }
  
  // Exponential backoff for retries: 5min, 30min, 2hr
  // retryCount 1 → backoffDelays[0] = 5min
  // retryCount 2 → backoffDelays[1] = 30min
  // retryCount 3 → backoffDelays[2] = 2hr
  const backoffDelays = [5 * 60 * 1000, 30 * 60 * 1000, 2 * 60 * 60 * 1000];
  const lastAttempt = contact.lastNotificationAttempt;
  
  if (lastAttempt) {
    const timeSinceLastAttempt = Date.now() - new Date(lastAttempt).getTime();
    const delayIndex = retryCount - 1; // Convert retry count to array index
    const requiredDelay = backoffDelays[delayIndex] || backoffDelays[backoffDelays.length - 1];
    
    if (timeSinceLastAttempt < requiredDelay) {
      const remainingMs = requiredDelay - timeSinceLastAttempt;
      const remainingMin = Math.ceil(remainingMs / 60000);
      console.log(`⏳ Too soon to retry contact ${contact.id} (retry ${retryCount}/${3}). Wait ${remainingMin} more minutes`);
      return { 
        success: false, 
        method: 'none', 
        error: `Waiting for backoff period (${remainingMin} minutes remaining)` 
      };
    }
  }
  
  console.log(`🔄 Retrying notification for contact ${contact.id} (retry ${retryCount}/${3})`);
  
  return await notifySeller(sellerInfo, {
    buyerName: contact.buyerName,
    buyerPhone: contact.buyerPhone,
    buyerEmail: contact.buyerEmail,
    message: contact.message || '',
    carTitle,
  });
}
