/**
 * @domain magicfolder
 * @layer ui
 * @responsibility Doc row/card contract: icon, title, tags, date (same across Inbox, Search, Unsorted, Collections)
 * Built from shadcn primitives only.
 */

"use client"

import Link from "next/link"
import { FileText } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  TableCell,
  TableRow,
} from "@/components/ui/table"
import { routes } from "@/lib/routes"
import { cn } from "@/lib/utils"

export type MagicfolderDocItem = {
  id: string
  title: string | null
  docType: string
  status?: string
  createdAt: string
  tags?: { id: string; name: string; slug: string }[]
  version?: {
    id: string
    mimeType: string
    sizeBytes: number
    sha256: string
  }
}

export type MagicfolderDocRowProps = {
  doc: MagicfolderDocItem
  isSelected?: boolean
  onToggleSelection?: (id: string) => void
  showCheckbox?: boolean
  showLink?: boolean
}

export function MagicfolderDocRow({
  doc,
  isSelected = false,
  onToggleSelection,
  showCheckbox = false,
  showLink = true,
}: MagicfolderDocRowProps) {
  const content = (
    <>
      {showCheckbox && onToggleSelection && (
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelection(doc.id)}
          onClick={(e) => e.stopPropagation()}
        />
      )}
      <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{doc.title ?? "(untitled)"}</p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          <span>{doc.docType}</span>
          {doc.status != null && <span>· {doc.status}</span>}
          {doc.version != null && (
            <span>· {(doc.version.sizeBytes / 1024).toFixed(1)} KB</span>
          )}
          <span>· {new Date(doc.createdAt).toLocaleDateString()}</span>
          {doc.tags != null && doc.tags.length > 0 && (
            <span className="flex flex-wrap gap-1">
              {doc.tags.map((t) => (
                <Badge key={t.id} variant="secondary" className="text-xs">
                  {t.name}
                </Badge>
              ))}
            </span>
          )}
        </div>
      </div>
    </>
  )

  const className = "flex items-center gap-3 py-3 first:pt-0 last:pb-0"

  if (showLink) {
    return (
      <li className={className}>
        <Link
          href={routes.ui.magicfolder.documentById(doc.id)}
          className="flex min-w-0 flex-1 items-center gap-3 hover:underline"
        >
          {content}
        </Link>
      </li>
    )
  }

  return <li className={className}>{content}</li>
}

/** Table row variant for use inside DataView list mode (Table primitive). */
export function MagicfolderDocTableRow({
  doc,
  isSelected = false,
  onToggleSelection,
  showCheckbox = false,
  showLink = true,
}: MagicfolderDocRowProps) {
  const cellContent = (
    <>
      <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{doc.title ?? "(untitled)"}</p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          <span>{doc.docType}</span>
          {doc.status != null && <span>· {doc.status}</span>}
          {doc.version != null && (
            <span>· {(doc.version.sizeBytes / 1024).toFixed(1)} KB</span>
          )}
          <span>· {new Date(doc.createdAt).toLocaleDateString()}</span>
          {doc.tags != null && doc.tags.length > 0 && (
            <span className="flex flex-wrap gap-1">
              {doc.tags.map((t) => (
                <Badge key={t.id} variant="secondary" className="text-xs">
                  {t.name}
                </Badge>
              ))}
            </span>
          )}
        </div>
      </div>
    </>
  )

  const mainCell = showLink ? (
    <Link
      href={routes.ui.magicfolder.documentById(doc.id)}
      className="flex min-w-0 flex-1 items-center gap-3 py-1 hover:underline"
    >
      {cellContent}
    </Link>
  ) : (
    <div className="flex min-w-0 flex-1 items-center gap-3 py-1">
      {cellContent}
    </div>
  )

  return (
    <TableRow>
      {showCheckbox && onToggleSelection && (
        <TableCell className="w-10">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelection(doc.id)}
            onClick={(e) => e.stopPropagation()}
          />
        </TableCell>
      )}
      <TableCell className="min-w-0">{mainCell}</TableCell>
    </TableRow>
  )
}

export type MagicfolderDocCardProps = {
  doc: MagicfolderDocItem
  isSelected?: boolean
  onToggleSelection?: (id: string) => void
  showCheckbox?: boolean
  showLink?: boolean
  className?: string
}

export function MagicfolderDocCard({
  doc,
  isSelected = false,
  onToggleSelection,
  showCheckbox = false,
  showLink = true,
  className,
}: MagicfolderDocCardProps) {
  const content = (
    <>
      {showCheckbox && onToggleSelection && (
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelection(doc.id)}
          onClick={(e) => e.stopPropagation()}
          className="absolute right-2 top-2"
        />
      )}
      <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{doc.title ?? "(untitled)"}</p>
        <p className="text-xs text-muted-foreground">
          {doc.docType}
          {doc.version != null
            ? ` · ${(doc.version.sizeBytes / 1024).toFixed(1)} KB`
            : ""}
        </p>
        {doc.tags != null && doc.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {doc.tags.map((t) => (
              <Badge key={t.id} variant="secondary" className="text-xs">
                {t.name}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </>
  )

  const cardContentCls = cn("flex items-center gap-3 pt-4", showCheckbox && "relative")

  if (showLink) {
    return (
      <Link href={routes.ui.magicfolder.documentById(doc.id)} className={className}>
        <Card className="transition-colors hover:bg-muted/50">
          <CardContent className={cardContentCls}>
            {content}
          </CardContent>
        </Card>
      </Link>
    )
  }

  return (
    <Card className={className}>
      <CardContent className={cardContentCls}>
        {content}
      </CardContent>
    </Card>
  )
}
