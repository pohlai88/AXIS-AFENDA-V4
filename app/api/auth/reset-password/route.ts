import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/server/db"
import { users, passwordResetTokens } from "@/lib/server/db/schema"
import { eq, and } from "drizzle-orm"
import { nanoid } from "nanoid"
import bcrypt from "bcryptjs"

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
})

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")

    if (action === "forgot") {
      // Handle forgot password request
      const validatedData = forgotPasswordSchema.parse(body)

      const user = await db
        .select()
        .from(users)
        .where(eq(users.email, validatedData.email))
        .limit(1)

      if (!user[0]) {
        // Don't reveal if email exists or not
        return NextResponse.json({
          message: "If an account with that email exists, a password reset link has been sent.",
        })
      }

      // Generate reset token
      const token = nanoid(32)
      const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

      // Delete any existing tokens for this user
      await db
        .delete(passwordResetTokens)
        .where(eq(passwordResetTokens.userId, user[0].id))

      // Create new reset token
      await db.insert(passwordResetTokens).values({
        userId: user[0].id,
        token,
        expires,
      })

      // TODO: Send email with reset link
      // For now, just return success
      console.log(`Password reset token for ${user[0].email}: ${token}`)

      return NextResponse.json({
        message: "If an account with that email exists, a password reset link has been sent.",
      })

    } else if (action === "reset") {
      // Handle password reset
      const validatedData = resetPasswordSchema.parse(body)

      // Find valid token
      const resetToken = await db
        .select()
        .from(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.token, validatedData.token),
            eq(passwordResetTokens.used, false)
          )
        )
        .limit(1)

      if (!resetToken[0] || resetToken[0].expires < new Date()) {
        return NextResponse.json(
          { message: "Invalid or expired reset token" },
          { status: 400 }
        )
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(validatedData.password, 12)

      // Update user password
      await db
        .update(users)
        .set({
          password: hashedPassword,
          updatedAt: new Date(),
        })
        .where(eq(users.id, resetToken[0].userId))

      // Mark token as used
      await db
        .update(passwordResetTokens)
        .set({ used: true })
        .where(eq(passwordResetTokens.id, resetToken[0].id))

      return NextResponse.json({
        message: "Password reset successfully",
      })

    } else {
      return NextResponse.json(
        { message: "Invalid action" },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error("Password reset error:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid input", errors: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
