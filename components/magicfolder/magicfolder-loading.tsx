/**
 * @domain magicfolder
 * @layer ui
 * @responsibility Loading block: centered spinner (owns layout so pages don't use raw flex)
 */

"use client"

import { Spinner } from "@/components/ui/spinner"

export function MagicfolderLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <Spinner className="h-8 w-8" />
    </div>
  )
}
