/**
 * @domain auth
 * @layer contracts
 * @responsibility Zod schemas and types for registration request/response
 * 
 * These schemas are used for:
 * - Client-side form validation (react-hook-form)
 * - Server-side request validation
 * - Type-safe API contracts
 */

import { z } from "zod"

/**
 * Register request schema - client submits this
 */
export const RegisterSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be less than 100 characters"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid email address"),
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

export type RegisterInput = z.infer<typeof RegisterSchema>

/**
 * Register response schema - server returns this
 */
export const RegisterResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  requiresEmailVerification: z.boolean().optional(),
})

export type RegisterResponse = z.infer<typeof RegisterResponseSchema>

/**
 * Register error schema - standardized error response
 */
export const RegisterErrorSchema = z.object({
  code: z.enum([
    "EMAIL_ALREADY_EXISTS",
    "INVALID_EMAIL",
    "PASSWORD_TOO_WEAK",
    "NAME_REQUIRED",
    "CAPTCHA_REQUIRED",
    "UNKNOWN_ERROR",
  ]),
  message: z.string(),
  details: z.record(z.string(), z.any()).optional(),
})

export type RegisterError = z.infer<typeof RegisterErrorSchema>
