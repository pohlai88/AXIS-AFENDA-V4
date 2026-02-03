/**
 * @domain magicfolder
 * @layer ui
 * @responsibility Section block: owns grid/flex layout for content (pages must not use raw flex/grid)
 * Built from shadcn primitives only.
 */

"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export type MagicfolderSectionProps = {
  title?: string
  /** "grid" | "flex" | "stack" */
  layout?: "grid" | "flex" | "stack"
  children: ReactNode
  className?: string
}

export function MagicfolderSection({
  title,
  layout = "stack",
  children,
  className,
}: MagicfolderSectionProps) {
  const layoutClass =
    layout === "grid"
      ? "grid gap-4 md:grid-cols-2"
      : layout === "flex"
        ? "flex flex-wrap gap-2"
        : "space-y-4"
  if (title != null) {
    return (
      <section className={className}>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">{title}</h2>
        <div className={cn(layoutClass)}>{children}</div>
      </section>
    )
  }
  return <section className={cn(layoutClass, className)}>{children}</section>
}
