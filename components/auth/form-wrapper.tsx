/**
 * @domain auth
 * @layer components
 * @responsibility Submit button with loading state and spinner
 * 
 * Replaces hardcoded loading state logic in forms.
 * Single source of truth for button loading UX.
 */

"use client"

import { Button, ButtonProps } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

export interface LoadingSpinnerButtonProps extends ButtonProps {
  isLoading?: boolean
  loadingText?: string
  children: React.ReactNode
}

/**
 * Button with automatic loading state management
 * 
 * Usage:
 * ```tsx
 * <LoadingSpinnerButton 
 *   isLoading={isPending}
 *   loadingText="Signing in..."
 * >
 *   Sign in
 * </LoadingSpinnerButton>
 * ```
 */
export function LoadingSpinnerButton({
  isLoading = false,
  loadingText,
  children,
  disabled,
  className,
  ...props
}: LoadingSpinnerButtonProps) {
  const isDisabled = disabled || isLoading

  return (
    <Button
      disabled={isDisabled}
      className={`relative ${className || ""}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Spinner className="mr-2 h-4 w-4" />
          <span>{loadingText || "Loading..."}</span>
        </>
      ) : (
        children
      )}
    </Button>
  )
}
