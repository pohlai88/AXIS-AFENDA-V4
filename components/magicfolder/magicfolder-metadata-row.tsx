/**
 * @domain magicfolder
 * @layer ui
 * @responsibility Single metadata row (label + value); owns typography
 */

"use client"

import type { ReactNode } from "react"

export type MagicfolderMetadataRowProps = {
  label: ReactNode
  value: ReactNode
}

export function MagicfolderMetadataRow({ label, value }: MagicfolderMetadataRowProps) {
  return (
    <p className="text-sm">
      <span className="text-muted-foreground">{label}:</span>{" "}
      {value}
    </p>
  )
}
