/**
 * @domain auth
 * @layer ui
 * @responsibility UI route entrypoint for /forgot-password
 *
 * Uses Neon's ForgotPasswordForm (recommended by Neon for password reset; SDK methods not fully supported).
 * Form calls authClient.requestPasswordReset and redirects to /login on success.
 */

"use client"

import { useEffect } from "react"
import Link from "next/link"
import { ForgotPasswordForm, authLocalization } from "@neondatabase/auth/react"
import { routes } from "@/lib/routes"
import { AuthShell } from "@/components/auth/auth-shell"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/lib/client/hooks/useAuth"
import { AUTH_LABELS, AUTH_LOADING_STATES } from "@/lib/constants/auth"

export default function ForgotPasswordPage() {
  const { isAuthenticated, isLoading: isSessionLoading } = useAuth()

  useEffect(() => {
    if (!isSessionLoading && isAuthenticated) {
      window.location.assign(routes.ui.orchestra.root())
    }
  }, [isAuthenticated, isSessionLoading])

  return (
    <AuthShell
      title={AUTH_LABELS.FORGOT_PASSWORD_TITLE}
      description={AUTH_LABELS.FORGOT_PASSWORD_DESCRIPTION}
    >
      {isSessionLoading ? (
        <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
          <Spinner className="size-5" />
          <div className="text-sm text-muted-foreground">{AUTH_LOADING_STATES.CHECKING}</div>
        </div>
      ) : (
        <>
          <ForgotPasswordForm localization={authLocalization} />
          <div className="text-center text-sm text-muted-foreground">
            {AUTH_LABELS.REMEMBER_PASSWORD}{" "}
            <Link href={routes.ui.auth.login()} className="text-primary hover:underline font-medium">
              {AUTH_LABELS.SIGN_IN}
            </Link>
          </div>
        </>
      )}
    </AuthShell>
  )
}

