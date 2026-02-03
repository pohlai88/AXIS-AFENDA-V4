/**
 * @domain auth
 * @layer component
 * @responsibility Auth context provider for client-side auth state
 *
 * Wraps app with NeonAuthUIProvider for client-side auth hooks (useSession, useUser),
 * OAuth (Google, GitHub), and Neon-recommended password reset (ForgotPasswordForm/ResetPasswordForm).
 * All auth UI uses shadcn except password reset flows which use Neon's UI components.
 */

"use client"

import { useMemo, useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { NeonAuthUIProvider } from "@neondatabase/auth/react"
import { authClient } from "@/lib/auth/client"
import { routes } from "@/lib/routes"

/** View path overrides so Neon auth forms navigate to our canonical routes (e.g. /login, /reset-password). */
const AUTH_VIEW_PATHS = {
  SIGN_IN: "login",
  SIGN_UP: "register",
  FORGOT_PASSWORD: "forgot-password",
  RESET_PASSWORD: "reset-password",
} as const

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter()
  const [origin, setOrigin] = useState("")

  useEffect(() => {
    queueMicrotask(() => {
      if (typeof window !== "undefined") setOrigin(window.location.origin)
    })
  }, [])

  const viewPaths = useMemo(() => AUTH_VIEW_PATHS, [])

  return (
    <NeonAuthUIProvider
      authClient={authClient}
      redirectTo={routes.ui.orchestra.root()}
      basePath=""
      baseURL={origin}
      navigate={router.push}
      replace={router.replace}
      Link={Link}
      credentials={{ forgotPassword: true }}
      viewPaths={viewPaths}
      social={{
        providers: ["google", "github"],
      }}
    >
      {children}
    </NeonAuthUIProvider>
  )
}
