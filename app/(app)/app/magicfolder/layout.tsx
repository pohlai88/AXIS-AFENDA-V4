/**
 * MagicFolder segment layout (Next.js App Router).
 * Renders inside the app-shell only. App shell (app/(app)/layout.tsx) provides
 * SidebarProvider + AppSidebar + SidebarInset; this layout passes children through
 * (single sidebar at app level, like AXIS-AFANDA).
 */

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "MagicFolder",
  description: "Intelligent document management with smart filtering and mobile-first design",
}

type Props = {
  children: React.ReactNode
}

export default function MagicFolderLayout({ children }: Props) {
  return <>{children}</>
}
