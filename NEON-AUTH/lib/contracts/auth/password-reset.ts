/**
 * @domain auth
 * @layer contracts
 * @responsibility Zod schemas and types for password reset flows
 * 
 * Used for:
 * - Forgot password request
 * - Reset password completion
 * - Email verification
 */

import { z } from "zod"

/**
 * Shared response shapes for public auth feature APIs.
 *
 * NOTE: These are the `data` payloads for the mandatory `{ data, error }` envelope.
 */
export const forgotPasswordResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
})

export const resetPasswordVerifyResponseSchema = z.object({
  valid: z.boolean(),
})

export const resetPasswordResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
})

export const verifyEmailResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
})

/**
 * Forgot password request - just email
 */
export const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
})

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>

/**
 * Reset password - with token and new password
 */
export const ResetPasswordSchema = z
  .object({
    token: z
      .string()
      .min(1, "Invalid reset token"),
    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain an uppercase letter")
      .regex(/[a-z]/, "Password must contain a lowercase letter")
      .regex(/[0-9]/, "Password must contain a number"),
    confirmPassword: z
      .string()
      .min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>

/**
 * Email verification - OTP code
 */
export const VerifyEmailSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
  code: z
    .string()
    .min(6, "Verification code must be 6 digits")
    .max(6, "Verification code must be 6 digits")
    .regex(/^\d+$/, "Verification code must contain only numbers"),
})

export type VerifyEmailInput = z.infer<typeof VerifyEmailSchema>

/**
 * Resend verification email
 */
export const ResendVerificationSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
})

export type ResendVerificationInput = z.infer<typeof ResendVerificationSchema>
