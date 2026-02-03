/**
 * @domain magicfolder
 * @layer ui
 * @responsibility Inbox row: file, type, size; optional checkbox and actions
 */

"use client"

import Link from "next/link"
import { FileText } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { routes } from "@/lib/routes"

export type InboxItemDoc = {
  id: string
  title: string | null
  docType: string
  status?: string
  version?: {
    sizeBytes: number
    mimeType?: string
  }
}

type Props = {
  doc: InboxItemDoc
  isSelected?: boolean
  onToggle?: (id: string) => void
  showCheckbox?: boolean
  showLink?: boolean
}

export function InboxItem({
  doc,
  isSelected = false,
  onToggle,
  showCheckbox = false,
  showLink = true,
}: Props) {
  const content = (
    <>
      {showCheckbox && onToggle && (
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggle(doc.id)}
        />
      )}
      <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{doc.title ?? "(untitled)"}</p>
        <p className="text-xs text-muted-foreground">
          {doc.docType} ·{" "}
          {doc.version
            ? `${(doc.version.sizeBytes / 1024).toFixed(1)} KB`
            : "—"}
        </p>
      </div>
    </>
  )

  const className = "flex items-center gap-3 py-3 first:pt-0 last:pb-0"

  if (showLink) {
    return (
      <li className={className}>
        <Link href={routes.ui.magicfolder.documentById(doc.id)} className="flex min-w-0 flex-1 items-center gap-3">
          {content}
        </Link>
      </li>
    )
  }

  return <li className={className}>{content}</li>
}
