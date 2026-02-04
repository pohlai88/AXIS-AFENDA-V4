/**
 * @domain auth
 * @layer contracts
 * @responsibility Zod schemas and types for login request/response
 * 
 * These schemas are used for:
 * - Client-side form validation (react-hook-form)
 * - Server-side request validation
 * - Type-safe API contracts
 */

import { z } from "zod"

/**
 * Login request schema - client submits this
 */
export const LoginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
})

export type LoginInput = z.infer<typeof LoginSchema>

/**
 * Login response schema - server returns this
 */
export const LoginResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
})

export type LoginResponse = z.infer<typeof LoginResponseSchema>

/**
 * Login error schema - standardized error response
 */
export const LoginErrorSchema = z.object({
  code: z.enum([
    "INVALID_CREDENTIALS",
    "USER_NOT_FOUND",
    "ACCOUNT_DISABLED",
    "TOO_MANY_ATTEMPTS",
    "CAPTCHA_REQUIRED",
    "UNKNOWN_ERROR",
  ]),
  message: z.string(),
  details: z.record(z.string(), z.any()).optional(),
})

export type LoginError = z.infer<typeof LoginErrorSchema>
