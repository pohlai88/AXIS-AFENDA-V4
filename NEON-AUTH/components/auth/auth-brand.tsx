/**
 * @domain auth
 * @layer component
 * @responsibility AFENDA brand typography (wordmark) and slogan for auth shell
 * No hardcoded strings – uses AUTH_BRAND constants.
 */

"use client"

import { cn } from "@/lib/utils"
import { AUTH_BRAND } from "@/lib/constants/auth"

export interface AuthBrandWordmarkProps {
  className?: string
}

/**
 * AFENDA wordmark – typography for top of auth forms.
 * Bold caps, wide tracking, accent line (SVG).
 */
export function AuthBrandWordmark({ className }: AuthBrandWordmarkProps) {
  return (
    <div className={cn("flex flex-col items-center gap-0.5", className)} aria-hidden>
      <span
        className="text-2xl font-extrabold tracking-[0.35em] text-foreground sm:text-3xl sm:tracking-[0.4em]"
        style={{ letterSpacing: "0.35em" }}
      >
        {AUTH_BRAND.NAME}
      </span>
      {/* Accent line – SVG for crisp scale */}
      <svg
        viewBox="0 0 120 4"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-1 w-24 text-foreground/40 sm:w-28"
        aria-hidden
      >
        <line
          x1="0"
          y1="2"
          x2="120"
          y2="2"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

export interface AuthBrandSloganProps {
  className?: string
}

/**
 * MACHINA VITAE slogan – for bottom of auth shell.
 */
export function AuthBrandSlogan({ className }: AuthBrandSloganProps) {
  return (
    <p
      className={cn(
        "text-center text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground",
        className
      )}
      aria-hidden
    >
      {AUTH_BRAND.SLOGAN}
    </p>
  )
}
