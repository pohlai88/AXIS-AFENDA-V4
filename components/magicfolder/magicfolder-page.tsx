/**
 * @domain magicfolder
 * @layer ui
 * @responsibility Page shell: full-width container with vertical rhythm (Notion-like)
 * Used by every MagicFolder page. Built from shadcn layout patterns only.
 */

"use client"

import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

export type MagicfolderPageProps = {
  children: ReactNode
  /** Vertical spacing between direct children (default: space-y-6) */
  className?: string
}

export function MagicfolderPage({
  children,
  className,
}: MagicfolderPageProps) {
  return (
    <div
      data-slot="page"
      className={cn("w-full space-y-6", className)}
    >
      {children}
    </div>
  )
}
