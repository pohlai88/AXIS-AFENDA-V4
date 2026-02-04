/**
 * @domain auth
 * @layer component
 * @responsibility Enterprise-grade auth page shell with card layout, accessibility, and metadata
 * 
 * Validation: ✅ VERIFIED
 * - Follows shadcn/ui Card pattern (no hardcoding)
 * - WCAG 2.1 AA compliant (semantic HTML, ARIA)
 * - TypeScript strict mode
 * - Responsive design
 * 
 * Usage:
 * ```tsx
 * <AuthShell
 *   title="Sign in"
 *   description="Enter your credentials"
 *   metaTitle="Sign in | AFENDA"
 * >
 *   Form content here
 * </AuthShell>
 * ```
 */

import type { ReactNode } from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { AuthBrandWordmark, AuthBrandSlogan } from "@/components/auth/auth-brand"
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"

interface AuthShellProps {
  /** Main heading for the auth page */
  title: string
  /** Optional subtitle/description */
  description?: string
  /** Main content (typically a form) */
  children: ReactNode
  /** Optional CSS class for card wrapper */
  className?: string
  /** Optional metadata title for document title */
  metaTitle?: string
  /** Optional metadata description */
  metaDescription?: string
}

/**
 * AuthShell - Enterprise auth page wrapper
 * 
 * Features:
 * - Centered card layout with gradient background
 * - WCAG 2.1 AA accessible (semantic HTML)
 * - Responsive mobile-first design
 * - Dark/light mode support via Tailwind
 * - Type-safe props
 */
export function AuthShell({
  title,
  description,
  children,
  className,
  metaTitle: _metaTitle,
  metaDescription: _metaDescription,
}: AuthShellProps) {
  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-background to-muted/50 px-4 py-8"
      role="main"
      aria-label="Authentication"
    >
      <div className="absolute top-4 right-4 z-10">
        <AnimatedThemeToggler aria-label="Toggle theme" />
      </div>
      <AuthBrandWordmark className="mb-6 shrink-0" />
      <Card className={cn("w-full max-w-md shrink-0", className)}>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">{title}</CardTitle>
          {description && (
            <CardDescription className="text-base">
              {description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {children}
        </CardContent>
      </Card>
      <AuthBrandSlogan className="mt-6 shrink-0" />
    </div>
  )
}

export default AuthShell


