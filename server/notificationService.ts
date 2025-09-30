/**
 * Notification Service for CarArth
 * 
 * Handles delivery of lead notifications to sellers via email/SMS
 * with retry logic and delivery tracking.
 */

import nodemailer from 'nodemailer';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import type { Contact } from '@shared/schema.js';

export interface NotificationResult {
  success: boolean;
  method: 'email' | 'sms' | 'both' | 'none';
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

/**
 * Create email transporter (use environment variables for production)
 */
function createEmailTransporter() {
  // In production, use real SMTP credentials
  // For now, use ethereal for testing (or skip if not configured)
  
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }
  
  // No email configured - return null
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
  const transporter = createEmailTransporter();
  
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
    
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email notification sent to ${sellerEmail}`);
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
 * Send SMS notification to seller (placeholder - requires Twilio/SMS provider)
 */
async function sendSMSNotification(
  sellerPhone: string,
  sellerName: string,
  leadData: {
    buyerName: string;
    buyerPhone: string;
    carTitle: string;
  }
): Promise<{ success: boolean; error?: string }> {
  // TODO: Integrate with Twilio or SMS provider
  // For now, just log
  console.log(`📱 SMS notification (not implemented): ${sellerPhone}`);
  console.log(`   Lead: ${leadData.buyerName} (${leadData.buyerPhone}) interested in ${leadData.carTitle}`);
  
  return { 
    success: false, 
    error: 'SMS not configured - install Twilio integration' 
  };
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
  let smsResult: { success: boolean; error?: string } | null = null;
  
  // Try email if verified
  if (sellerInfo.emailVerified && sellerInfo.email) {
    emailResult = await sendEmailNotification(
      sellerInfo.email,
      sellerInfo.name,
      leadData
    );
  }
  
  // Try SMS if verified (future feature)
  if (sellerInfo.phoneVerified && sellerInfo.phone) {
    smsResult = await sendSMSNotification(
      sellerInfo.phone,
      sellerInfo.name,
      {
        buyerName: leadData.buyerName,
        buyerPhone: leadData.buyerPhone,
        carTitle: leadData.carTitle,
      }
    );
  }
  
  // Determine result
  const emailSuccess = emailResult?.success || false;
  const smsSuccess = smsResult?.success || false;
  
  if (emailSuccess && smsSuccess) {
    return { success: true, method: 'both', deliveredAt: new Date() };
  } else if (emailSuccess) {
    return { success: true, method: 'email', deliveredAt: new Date() };
  } else if (smsSuccess) {
    return { success: true, method: 'sms', deliveredAt: new Date() };
  } else {
    const errors = [emailResult?.error, smsResult?.error].filter(Boolean).join('; ');
    return { 
      success: false, 
      method: 'none', 
      error: errors || 'No verified contact methods available' 
    };
  }
}

/**
 * Retry failed notifications with exponential backoff
 */
export async function retryNotification(
  contact: Contact,
  sellerInfo: any,
  carTitle: string
): Promise<NotificationResult> {
  const retryCount = contact.notificationRetryCount || 0;
  
  if (retryCount >= 3) {
    console.log(`❌ Max retries reached for contact ${contact.id}`);
    return { 
      success: false, 
      method: 'none', 
      error: 'Max retries exceeded' 
    };
  }
  
  // Exponential backoff: 5min, 30min, 2hr
  const backoffDelays = [5 * 60 * 1000, 30 * 60 * 1000, 2 * 60 * 60 * 1000];
  const lastAttempt = contact.lastNotificationAttempt;
  
  if (lastAttempt) {
    const timeSinceLastAttempt = Date.now() - new Date(lastAttempt).getTime();
    const requiredDelay = backoffDelays[retryCount] || backoffDelays[backoffDelays.length - 1];
    
    if (timeSinceLastAttempt < requiredDelay) {
      console.log(`⏳ Too soon to retry contact ${contact.id} (retry ${retryCount + 1})`);
      return { 
        success: false, 
        method: 'none', 
        error: 'Waiting for backoff period' 
      };
    }
  }
  
  console.log(`🔄 Retrying notification for contact ${contact.id} (attempt ${retryCount + 1})`);
  
  return await notifySeller(sellerInfo, {
    buyerName: contact.buyerName,
    buyerPhone: contact.buyerPhone,
    buyerEmail: contact.buyerEmail,
    message: contact.message || '',
    carTitle,
  });
}
