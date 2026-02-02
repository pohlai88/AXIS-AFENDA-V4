/**
 * @domain auth
 * @layer components
 * @responsibility Standardized error display component
 * 
 * Single source of truth for error UI across all auth pages.
 * Replaces toast() and inline error displays.
 */

"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export interface FormErrorProps {
  title?: string
  message: string | null | undefined
  code?: string
  details?: Record<string, unknown>
}

/**
 * Standardized error alert component
 * 
 * Usage:
 * ```tsx
 * {error && <FormError title="Sign in failed" message={error.message} />}
 * ```
 */
export function FormError({
  title = "Error",
  message,
  code,
  details,
}: FormErrorProps) {
  if (!message) return null

  return (
    <Alert variant="destructive" role="alert">
      <AlertCircle className="h-4 w-4" />
      <div className="space-y-1">
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="space-y-1">
          <p>{message}</p>
          {code && (
            <p className="text-xs opacity-75">
              Error code: {code}
            </p>
          )}
          {details && Object.keys(details).length > 0 && (
            <div className="mt-2 text-xs space-y-1">
              {Object.entries(details).map(([key, value]) => (
                <p key={key}>
                  <span className="font-medium">{key}:</span> {String(value)}
                </p>
              ))}
            </div>
          )}
        </AlertDescription>
      </div>
    </Alert>
  )
}

/**
 * Success alert variant
 */
export interface FormSuccessProps {
  title?: string
  message: string | null | undefined
}

export function FormSuccess({
  title = "Success",
  message,
}: FormSuccessProps) {
  if (!message) return null

  return (
    <Alert className="border-green-200 bg-green-50">
      <AlertCircle className="h-4 w-4 text-green-600" />
      <div className="space-y-1">
        <AlertTitle className="text-green-900">{title}</AlertTitle>
        <AlertDescription className="text-green-800">
          {message}
        </AlertDescription>
      </div>
    </Alert>
  )
}
