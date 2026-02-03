/**
 * @domain magicfolder
 * @layer ui
 * @responsibility Toolbar block: left title+count, middle filters, right actions (Upload, Bulk, Sort)
 * Built from shadcn Button, Select, etc. only.
 */

"use client"

import { magicfolderRegistry } from "@/lib/domains/magicfolder/registry"
import { MagicfolderFilterBar } from "./magicfolder-filter-bar"
import { MagicfolderUploadDialog } from "./magicfolder-upload-dialog"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"
import type { ReactNode } from "react"

export type MagicfolderToolbarProps = {
  title: string
  count?: number
  /** Show filter bar (status, docType, hasTags, tagId, sort) */
  showFilters?: boolean
  /** Right-side actions: Upload button, etc. */
  actions?: ReactNode
  /** Optional view mode toggle (list/grid) can be passed in actions */
  children?: ReactNode
}

export function MagicfolderToolbar({
  title,
  count,
  showFilters = true,
  actions,
  children,
}: MagicfolderToolbarProps) {
  const capabilities = magicfolderRegistry.capabilities

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold tracking-tight">
          {title}
          {count != null ? ` · ${count}` : ""}
        </h2>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {showFilters && <MagicfolderFilterBar />}
        {capabilities.canUpload && (
          <MagicfolderUploadDialog
            trigger={
              <Button size="sm" variant="outline">
                <Upload className="mr-1 h-4 w-4" />
                Upload
              </Button>
            }
          />
        )}
        {actions}
      </div>
      {children}
    </div>
  )
}
