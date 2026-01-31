"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { NeonAuthUIProvider } from "@neondatabase/auth/react/ui"

import { authClient } from "@/lib/auth/client"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  return (
    <NeonAuthUIProvider
      authClient={authClient}
      navigate={router.push}
      replace={router.replace}
      onSessionChange={() => router.refresh()}
      Link={Link}
      social={{
        providers: ["google", "github"],
      }}
    >
      {children}
    </NeonAuthUIProvider>
  )
}

