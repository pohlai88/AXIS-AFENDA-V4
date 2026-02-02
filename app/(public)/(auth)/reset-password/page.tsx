/**
 * @domain auth
 * @layer ui
 * @responsibility UI route entrypoint for /reset-password
 */

import { Suspense } from "react"
import ResetPasswordClient from "./reset-password-client"
import { AuthShell } from "@/components/auth/auth-shell"
import { Spinner } from "@/components/ui/spinner"

function ResetPasswordFallback() {
  return (
    <AuthShell title="Reset password" description="Loading…">
      <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
        <Spinner className="size-5" />
        <div className="text-sm text-muted-foreground">Preparing reset form…</div>
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

