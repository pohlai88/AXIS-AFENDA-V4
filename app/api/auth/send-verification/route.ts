/**
 * Post-Registration Email Verification Handler
 * 
 * Server action to send verification email after successful registration.
 * Creates verification token and sends email.
 * 
 * @module app/api/auth/send-verification
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
    const { userId, email } = body

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify user exists
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) {
      logger.error({ userId, email }, 'User not found for verification email')
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if already verified
    if (user.emailVerified) {
      logger.info({ userId }, 'User already verified')
      return NextResponse.json({
        success: true,
        alreadyVerified: true,
      })
    }

    // Delete any existing verification tokens
    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.identifier, email.toLowerCase()))

    // Generate verification token
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
        userId,
        email,
        error: result.error,
      }, 'Failed to send verification email')
      return NextResponse.json(
        { error: 'Failed to send verification email' },
        { status: 500 }
      )
    }

    logger.info({
      userId,
      email,
      messageId: result.messageId,
    }, 'Verification email sent')

    return NextResponse.json({
      success: true,
      message: 'Verification email sent',
    })
  } catch (error) {
    logger.error({ error }, 'Error sending verification email')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
