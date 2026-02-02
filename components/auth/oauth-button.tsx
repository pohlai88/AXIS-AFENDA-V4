/**
 * @domain auth
 * @layer components
 * @responsibility Reusable OAuth button component for Google, GitHub
 * 
 * Single source of truth for OAuth button styling, loading states, icons.
 * Eliminates hardcoded OAuth buttons across login/register pages.
 */

"use client"

import type { ComponentType } from "react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { GitHubLogoIcon } from "@radix-ui/react-icons"
import { AUTH_BUTTON_LABELS } from "@/lib/constants/auth"

export interface OAuthButtonProps {
  provider: "google" | "github"
  onClick: () => Promise<void>
  isLoading?: boolean
  disabled?: boolean
  variant?: "default" | "outline"
}

type OAuthIcon = ComponentType<{ className?: string }>

/**
 * OAuth button with provider icon, loading state, and consistent styling
 * 
 * @param provider - "google" or "github"
 * @param onClick - async function to handle OAuth sign-in
 * @param isLoading - show spinner and disable button
 * @param disabled - disable button (e.g., while form is submitting)
 * @param variant - button variant from shadcn
 */
export function OAuthButton({
  provider,
  onClick,
  isLoading = false,
  disabled = false,
  variant = "outline",
}: OAuthButtonProps) {
  // Provider configuration
  const config = {
    google: {
      label: AUTH_BUTTON_LABELS.SIGN_IN_WITH_GOOGLE,
      icon: null as OAuthIcon | null, // No icon available for Google
      className: "w-4 h-4",
    },
    github: {
      label: AUTH_BUTTON_LABELS.SIGN_IN_WITH_GITHUB,
      icon: GitHubLogoIcon,
      className: "w-4 h-4",
    },
  }

  const { label, icon: Icon, className } = config[provider]
  const isDisabled = disabled || isLoading

  return (
    <Button
      type="button"
      variant={variant}
      size="lg"
      onClick={onClick}
      disabled={isDisabled}
      className="w-full gap-2"
      aria-label={label}
    >
      {isLoading ? (
        <>
          <Spinner className="h-4 w-4" />
          <span>Connecting...</span>
        </>
      ) : (
        <>
          {Icon && <Icon className={className} />}
          <span>{label}</span>
        </>
      )}
    </Button>
  )
}
