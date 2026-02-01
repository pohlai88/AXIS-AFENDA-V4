/**
 * Email Service
 * 
 * Centralized email sending service using Resend API.
 * Handles verification emails, welcome emails, and transactional notifications.
 * 
 * @module lib/server/email/service
 */

import { Resend } from 'resend'
import { getServerEnv } from '@/lib/env/server'
import { logger } from '@/lib/server/logger'

// Initialize Resend client
const resend = new Resend(getServerEnv().RESEND_API_KEY)

/**
 * Email configuration
 */
const EMAIL_CONFIG = {
  from: 'NEXIS AFENDA <noreply@nexuscanon.com>',
  replyTo: 'support@nexuscanon.com',
} as const

/**
 * Email sending result
 */
export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface SendEmailParams {
  to: string
  subject: string
  html: string
  replyTo?: string
}

/**
 * Send a transactional email (generic helper)
 */
export async function sendEmail(params: SendEmailParams): Promise<EmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      replyTo: params.replyTo ?? EMAIL_CONFIG.replyTo,
    })

    if (error) {
      logger.error({ email: params.to, error }, 'Failed to send email')
      return { success: false, error: error.message }
    }

    return { success: true, messageId: data?.id }
  } catch (error) {
    logger.error({ email: params.to, error }, 'Unexpected error sending email')
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send email verification link
 */
export async function sendVerificationEmail(
  email: string,
  name: string,
  verificationUrl: string
): Promise<EmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: email,
      subject: 'Verify your email address',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify your email</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">NEXIS AFENDA</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 40px 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #1f2937; margin-top: 0;">Hi ${name || 'there'}! 👋</h2>
              
              <p style="color: #4b5563; font-size: 16px;">
                Welcome to NEXIS AFENDA! We're excited to have you on board.
              </p>
              
              <p style="color: #4b5563; font-size: 16px;">
                To complete your registration and access your account, please verify your email address by clicking the button below:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 14px 32px; 
                          text-decoration: none; 
                          border-radius: 6px; 
                          font-weight: 600;
                          font-size: 16px;
                          display: inline-block;
                          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  Verify Email Address
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                Or copy and paste this link into your browser:
              </p>
              <p style="color: #667eea; font-size: 14px; word-break: break-all;">
                ${verificationUrl}
              </p>
              
              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; font-size: 13px; margin: 5px 0;">
                  This link will expire in 24 hours for security reasons.
                </p>
                <p style="color: #9ca3af; font-size: 13px; margin: 5px 0;">
                  If you didn't create an account, you can safely ignore this email.
                </p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
              <p>© ${new Date().getFullYear()} NEXIS AFENDA. All rights reserved.</p>
            </div>
          </body>
        </html>
      `,
      replyTo: EMAIL_CONFIG.replyTo,
    })

    if (error) {
      logger.error({ email, error }, 'Failed to send verification email')
      return {
        success: false,
        error: error.message,
      }
    }

    logger.info({ email, messageId: data?.id }, 'Verification email sent successfully')
    return {
      success: true,
      messageId: data?.id,
    }
  } catch (error) {
    logger.error({ email, error }, 'Unexpected error sending verification email')
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send welcome email after successful verification
 */
export async function sendWelcomeEmail(
  email: string,
  name: string,
  dashboardUrl: string
): Promise<EmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: email,
      subject: 'Welcome to NEXIS AFENDA!',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to NEXIS AFENDA</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Welcome to NEXIS AFENDA!</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 40px 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #1f2937; margin-top: 0;">Hi ${name}! 🚀</h2>
              
              <p style="color: #4b5563; font-size: 16px;">
                Your email has been verified and your account is now active!
              </p>
              
              <p style="color: #4b5563; font-size: 16px;">
                We've set up a personal workspace for you with a default team to get you started. 
                You can create additional teams, invite collaborators, and start organizing your projects right away.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${dashboardUrl}" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 14px 32px; 
                          text-decoration: none; 
                          border-radius: 6px; 
                          font-weight: 600;
                          font-size: 16px;
                          display: inline-block;
                          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  Go to Dashboard
                </a>
              </div>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin-top: 30px;">
                <h3 style="color: #1f2937; margin-top: 0; font-size: 18px;">🌟 Quick Start Guide</h3>
                <ul style="color: #4b5563; padding-left: 20px;">
                  <li>Complete your profile in Settings</li>
                  <li>Invite team members to collaborate</li>
                  <li>Create your first project</li>
                  <li>Explore our task management features</li>
                  <li>Set up integrations and automations</li>
                </ul>
              </div>
              
              <div style="margin-top: 30px; padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                <p style="color: #92400e; font-size: 14px; margin: 0;">
                  <strong>💡 Pro Tip:</strong> Check out our documentation and tutorials to make the most of NEXIS AFENDA's features.
                </p>
              </div>
              
              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px;">
                  Need help? Our support team is here for you at 
                  <a href="mailto:${EMAIL_CONFIG.replyTo}" style="color: #667eea; text-decoration: none;">${EMAIL_CONFIG.replyTo}</a>
                </p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
              <p>© ${new Date().getFullYear()} NEXIS AFENDA. All rights reserved.</p>
            </div>
          </body>
        </html>
      `,
      replyTo: EMAIL_CONFIG.replyTo,
    })

    if (error) {
      logger.error({ email, error }, 'Failed to send welcome email')
      return {
        success: false,
        error: error.message,
      }
    }

    logger.info({ email, messageId: data?.id }, 'Welcome email sent successfully')
    return {
      success: true,
      messageId: data?.id,
    }
  } catch (error) {
    logger.error({ email, error }, 'Unexpected error sending welcome email')
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetUrl: string
): Promise<EmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: email,
      subject: 'Reset your password',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset your password</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">NEXIS AFENDA</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 40px 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #1f2937; margin-top: 0;">Password Reset Request 🔐</h2>
              
              <p style="color: #4b5563; font-size: 16px;">
                Hi ${name || 'there'},
              </p>
              
              <p style="color: #4b5563; font-size: 16px;">
                We received a request to reset the password for your account. Click the button below to set a new password:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 14px 32px; 
                          text-decoration: none; 
                          border-radius: 6px; 
                          font-weight: 600;
                          font-size: 16px;
                          display: inline-block;
                          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  Reset Password
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                Or copy and paste this link into your browser:
              </p>
              <p style="color: #667eea; font-size: 14px; word-break: break-all;">
                ${resetUrl}
              </p>
              
              <div style="margin-top: 40px; padding: 15px; background: #fee2e2; border-left: 4px solid #ef4444; border-radius: 4px;">
                <p style="color: #991b1b; font-size: 14px; margin: 0;">
                  <strong>⚠️ Security Notice:</strong> This link will expire in 1 hour. If you didn't request this password reset, please ignore this email or contact support if you're concerned.
                </p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
              <p>© ${new Date().getFullYear()} NEXIS AFENDA. All rights reserved.</p>
            </div>
          </body>
        </html>
      `,
      replyTo: EMAIL_CONFIG.replyTo,
    })

    if (error) {
      logger.error({ email, error }, 'Failed to send password reset email')
      return {
        success: false,
        error: error.message,
      }
    }

    logger.info({ email, messageId: data?.id }, 'Password reset email sent successfully')
    return {
      success: true,
      messageId: data?.id,
    }
  } catch (error) {
    logger.error({ email, error }, 'Unexpected error sending password reset email')
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
