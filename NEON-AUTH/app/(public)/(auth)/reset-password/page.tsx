/**
 * @domain auth
 * @layer ui
 * @responsibility UI route entrypoint for /reset-password
 *
 * Uses Neon's ResetPasswordForm (recommended by Neon for password reset).
 * Expects ?token=... from email link; form calls authClient.resetPassword and redirects to /login on success.
 */

import { Suspense } from "react"
import ResetPasswordClient from "./reset-password-client"
import { AuthShell } from "@/components/auth/auth-shell"
import { Spinner } from "@/components/ui/spinner"
import { AUTH_LABELS, AUTH_LOADING_STATES } from "@/lib/constants/auth"

function ResetPasswordFallback() {
  return (
    <AuthShell
      title={AUTH_LABELS.FORGOT_PASSWORD_TITLE}
      description={AUTH_LOADING_STATES.CHECKING}
    >
      <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
        <Spinner className="size-5" />
        <div className="text-sm text-muted-foreground">{AUTH_LOADING_STATES.CHECKING}</div>
      </div>
    </AuthShell>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordClient />
    </Suspense>
  )
}

