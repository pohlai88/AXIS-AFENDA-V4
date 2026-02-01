/**
 * Email Verification API Endpoint
 * 
 * Handles email verification via token sent in verification emails.
 * Updates user's emailVerified status and sends welcome email.
 * 
 * @route GET /api/auth/verify-email?token=xxx
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/server/db'
import { users, verificationTokens } from '@/lib/server/db/schema'
import { eq, and, gt } from 'drizzle-orm'
import { sendWelcomeEmail } from '@/lib/server/email/service'
import { logger } from '@/lib/server/logger'
import { getServerEnv } from '@/lib/env/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      )
    }

    // Find valid verification token
    const [verificationToken] = await db
      .select()
      .from(verificationTokens)
      .where(
        and(
          eq(verificationTokens.token, token),
          gt(verificationTokens.expires, new Date())
        )
      )
      .limit(1)

    if (!verificationToken) {
      logger.warn({ token }, 'Invalid or expired verification token')
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      )
    }

    // Find user by email (identifier)
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, verificationToken.identifier))
      .limit(1)

    if (!user) {
      logger.error({
        identifier: verificationToken.identifier,
      }, 'User not found for verification token')
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if already verified
    if (user.emailVerified) {
      logger.info({ userId: user.id }, 'User email already verified')
      // Delete used token
      await db
        .delete(verificationTokens)
        .where(eq(verificationTokens.token, token))

      return NextResponse.json({
        success: true,
        message: 'Email already verified',
        alreadyVerified: true,
      })
    }

    // Update user email verification status
    await db
      .update(users)
      .set({
        emailVerified: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))

    // Delete used verification token
    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.token, token))

    logger.info({
      userId: user.id,
      email: user.email,
    }, 'Email verified successfully')

    // Send welcome email
    const appUrl = getServerEnv().NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const dashboardUrl = `${appUrl}/dashboard`

    // Fire and forget welcome email (don't block response)
    sendWelcomeEmail(
      user.email,
      user.displayName || user.username || 'there',
      dashboardUrl
    ).catch((error) => {
      logger.error({
        userId: user.id,
        email: user.email,
        error,
      }, 'Failed to send welcome email')
    })

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
    })
  } catch (error) {
    logger.error({ error }, 'Error verifying email')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
