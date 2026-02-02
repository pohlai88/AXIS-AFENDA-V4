/**
 * @domain auth
 * @layer page
 * @responsibility Dynamic account pages (settings, security, organizations)
 * 
 * NOTE: Uses Neon Auth pre-built UI components with built-in CSS
 * https://neon.com/docs/auth/quick-start/nextjs
 * 
 * Supported paths:
 * - /account/settings - User profile management
 * - /account/security - Password change and active sessions
 * - /account/organizations - Organization management (if enabled)
 * 
 * STYLING STRATEGY:
 * - Custom "Back to App" header: Uses globals.css (Tailwind)
 * - AccountView component: Uses Neon Auth built-in CSS
 * 
 * IMPORTANT: Uses dynamic import with ssr: false to prevent hydration mismatches
 * caused by Radix UI components (Drawer, Dialog) generating different IDs on server vs client
 */

"use client"

import dynamic from "next/dynamic"
import { use } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

// Disable SSR for AccountView to prevent hydration mismatches
// Using named export pattern per Next.js 16.1.6 guidelines
const AccountView = dynamic(
  () => import("@neondatabase/auth/react").then((mod) => mod.AccountView),
  { ssr: false }
)

export default function AccountPage({ params }: { params: Promise<{ path: string }> }) {
  const { path } = use(params)

  return (
    <div className="min-h-screen bg-background">
      {/* Custom Navigation Header - Uses globals.css/Tailwind */}
      <div className="border-b">
        <div className="container mx-auto flex h-14 items-center px-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/app">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to App
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Neon Auth Component - Uses Neon Auth built-in CSS */}
      <AccountView path={path} />
    </div>
  )
}
