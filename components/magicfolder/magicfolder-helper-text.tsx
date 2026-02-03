/**
 * @domain magicfolder
 * @layer ui
 * @responsibility Helper text block (design token only; no raw typography in pages)
 */

"use client"

import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

export type MagicfolderHelperTextProps = {
  children: ReactNode
  className?: string
}

export function MagicfolderHelperText({
  children,
  className,
}: MagicfolderHelperTextProps) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>
      {children}
    </p>
  )
}
