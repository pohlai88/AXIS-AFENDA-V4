/**
 * @domain magicfolder
 * @layer ui
 * @responsibility Domain shell for MagicFolder segment: wraps page content inside app shell.
 * App shell (app/(app)/layout.tsx) provides SidebarProvider + AppSidebar + SidebarInset;
 * this shell wraps children in the MagicFolder content area.
 */

"use client"

import type { ReactNode } from "react"

export type MagicfolderDomainShellProps = {
  children: ReactNode
  className?: string
}

export type MagicfolderShellProps = {
  children: ReactNode
  className?: string
}

/**
 * Wraps MagicFolder segment content. Used when MagicFolder layout needs a domain shell.
 */
export function MagicfolderDomainShell({
  children,
  className,
}: MagicfolderDomainShellProps) {
  return <div className={className}>{children}</div>
}

/**
 * Generic MagicFolder shell (e.g. for sub-pages that need a consistent wrapper).
 */
export function MagicfolderShell({ children, className }: MagicfolderShellProps) {
  return <div className={className}>{children}</div>
}
