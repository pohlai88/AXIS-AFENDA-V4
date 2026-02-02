/**
 * @domain auth
 * @layer component
 * @responsibility Auth context provider for client-side auth state
 * 
 * NOTE: Wraps app with NeonAuthUIProvider to enable:
 * - Client-side auth hooks (useSession, useUser)
 * - Pre-built UI components (AuthView, AccountView, UserButton)
 * - OAuth support (Google, GitHub)
 * 
 * Following official Neon Auth documentation:
 * https://neon.com/docs/auth/quick-start/nextjs
 */

"use client"

import { NeonAuthUIProvider } from "@neondatabase/auth/react"
import { authClient } from "@/lib/auth/client"
import { routes } from "@/lib/routes"

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <NeonAuthUIProvider
      authClient={authClient}
      redirectTo={routes.ui.orchestra.root()}
      social={{
        providers: ["google", "github"],
      }}
    >
      {children}
    </NeonAuthUIProvider>
  )
}
