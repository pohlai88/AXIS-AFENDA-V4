/**
 * Resend Verification Email API Endpoint
 * 
 * Allows users to request a new verification email if the previous one expired.
 * Creates a new verification token and sends a fresh email.
 * 
 * @route POST /api/auth/resend-verification
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/server/db'
import { users, verificationTokens } from '@/lib/server/db/schema'
import { eq } from 'drizzle-orm'
import { sendVerificationEmail } from '@/lib/server/email/service'
import { logger } from '@/lib/server/logger'
import { randomBytes } from 'crypto'
import { getServerEnv } from '@/lib/env/server'

/**
 * Generate secure verification token
 */
function generateVerificationToken(): string {
  return randomBytes(32).toString('base64url')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1)

    if (!user) {
      // Don't reveal if user exists or not (security best practice)
      logger.warn({ email }, 'Verification email requested for non-existent user')
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a verification link will be sent.',
      })
    }

    // Check if already verified
    if (user.emailVerified) {
      logger.info({
        userId: user.id,
        email,
      }, 'Verification email requested for already verified user')
      return NextResponse.json({
        success: true,
        message: 'This email is already verified.',
        alreadyVerified: true,
      })
    }

    // Delete any existing verification tokens for this email
    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.identifier, email.toLowerCase()))

    // Generate new verification token
    const token = generateVerificationToken()
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Store verification token
    await db.insert(verificationTokens).values({
      identifier: email.toLowerCase(),
      token,
      expires,
    })

    // Build verification URL
    const appUrl = getServerEnv().NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const verificationUrl = `${appUrl}/verify-email?token=${token}`

    // Send verification email
    const result = await sendVerificationEmail(
      email,
      user.displayName || user.username || 'there',
      verificationUrl
    )

    if (!result.success) {
      logger.error({
        userId: user.id,
        email,
        error: result.error,
      }, 'Failed to send verification email')
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again later.' },
        { status: 500 }
      )
    }

    logger.info({
      userId: user.id,
      email,
      messageId: result.messageId,
    }, 'Verification email resent successfully')

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully. Please check your inbox.',
    })
  } catch (error) {
    logger.error({ error }, 'Error resending verification email')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
