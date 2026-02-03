/**
 * @domain magicfolder
 * @layer ui
 * @responsibility Page header block: title + description + optional actions (owns typography)
 * Built from shadcn design tokens only (Notion-like). No raw h1/p in feature pages.
 */

"use client"

import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

export type MagicfolderPageHeaderProps = {
  title: string
  description?: string
  /** Right-side link or actions */
  actions?: ReactNode
  className?: string
}

export function MagicfolderPageHeader({
  title,
  description,
  actions,
  className,
}: MagicfolderPageHeaderProps) {
  return (
    <header
      data-slot="page-header"
      className={cn(
        "flex flex-wrap items-center justify-between gap-4",
        className
      )}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description != null && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions != null && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </header>
  )
}
