/**
 * @domain auth
 * @layer page
 * @responsibility Dynamic auth pages (sign-in, sign-up, sign-out, forgot-password, reset-password)
 * 
 * NOTE: Uses Neon Auth pre-built UI components with built-in CSS
 * https://neon.com/docs/auth/quick-start/nextjs
 * 
 * Supported paths:
 * - /auth/sign-in - Sign in with email/password and OAuth (Google, GitHub)
 * - /auth/sign-up - New account registration
 * - /auth/sign-out - Sign out
 * - /auth/forgot-password - Request password reset
 * - /auth/reset-password - Complete password reset
 * 
 * STYLING STRATEGY:
 * - AuthView component: Uses Neon Auth built-in CSS exclusively
 * - No custom wrapper layouts (uses root layout only)
 * 
 * IMPORTANT: Uses dynamic import with ssr: false to prevent hydration mismatches
 * caused by Radix UI components (Drawer, Dialog) generating different IDs on server vs client
 */

"use client"

import dynamic from "next/dynamic"
import { use } from "react"

// Disable SSR for AuthView to prevent hydration mismatches
// Using named export pattern per Next.js 16.1.6 guidelines
const AuthView = dynamic(
  () => import("@neondatabase/auth/react").then((mod) => mod.AuthView),
  { ssr: false }
)

export default function AuthPage({ params }: { params: Promise<{ path: string }> }) {
  const { path } = use(params)

  // AuthView uses Neon Auth built-in CSS - no custom wrapper needed
  return <AuthView path={path} />
}
