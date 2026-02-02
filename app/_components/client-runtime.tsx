"use client"

import dynamic from "next/dynamic"

// NOTE: Serwist auto-registers via next.config.ts; no client hook needed here.

const WebVitals = dynamic(() => import("@/app/_components/web-vitals").then((mod) => mod.WebVitals), {
  ssr: false,
  loading: () => null,
})

const NavProgressBar = dynamic(() => import("@/components/nav-progress-bar").then((mod) => mod.NavProgressBar), {
  ssr: false,
  loading: () => null,
})

const PWAInstallPrompt = dynamic(() => import("@/components/pwa-install-prompt").then((mod) => mod.PWAInstallPrompt), {
  ssr: false,
  loading: () => null,
})

export function ClientRuntime() {
  return (
    <>
      <WebVitals />
      <NavProgressBar />
      <PWAInstallPrompt />
    </>
  )
}
