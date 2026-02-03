/**
 * @domain auth
 * @layer page
 * @responsibility Redirect legacy /auth/[path] to canonical auth routes (single route strategy)
 *
 * Canonical routes only: /login, /register, /forgot-password, /reset-password, /auth/callback.
 * No Neon AuthView – all UI uses shadcn in components/auth.
 */

"use client"

import { use, useEffect } from "react"
import { useRouter } from "next/navigation"
import { routes } from "@/lib/routes"
import { AuthShell } from "@/components/auth/auth-shell"
import { Spinner } from "@/components/ui/spinner"
import { AUTH_LOADING_STATES } from "@/lib/constants/auth"

const PATH_TO_ROUTE: Record<string, () => string> = {
  "sign-in": routes.ui.auth.login,
  "sign-up": routes.ui.auth.register,
  "forgot-password": routes.ui.auth.forgotPassword,
  "reset-password": routes.ui.auth.resetPassword,
  "sign-out": routes.ui.auth.signOut,
}

export default function AuthPathRedirectPage({
  params,
}: {
  params: Promise<{ path: string }>
}) {
  const { path } = use(params)
  const router = useRouter()

  useEffect(() => {
    const target = PATH_TO_ROUTE[path]
    if (target) {
      router.replace(target())
      return
    }
    router.replace(routes.ui.auth.login())
  }, [path, router])

  return (
    <AuthShell title="" description="">
      <div className="flex items-center justify-center gap-3 py-4">
        <Spinner className="size-5" />
        <span className="text-sm text-muted-foreground">{AUTH_LOADING_STATES.CHECKING}</span>
      </div>
    </AuthShell>
  )
}
