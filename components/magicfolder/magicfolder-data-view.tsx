/**
 * @domain magicfolder
 * @layer ui
 * @responsibility Data view block: table + card mode, selection, empty state slot
 * Built from Table/Card list + Checkbox from @/components/ui only.
 */

"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { MagicfolderDocItem } from "./magicfolder-doc-row"
import { MagicfolderDocCard, MagicfolderDocTableRow } from "./magicfolder-doc-row"
import type { ReactNode } from "react"
import { useMagicfolderSearchStore } from "@/lib/client/store/magicfolder-search"

export type MagicfolderDataViewProps<T extends MagicfolderDocItem> = {
  title: string
  description?: string
  rows: T[]
  /** Render a row (list mode). Default: MagicfolderDocRow */
  rowRenderer?: (doc: T, opts: { isSelected: boolean; onToggle: (id: string) => void }) => ReactNode
  /** Render a card (card mode). Default: MagicfolderDocCard */
  cardRenderer?: (doc: T, opts: { isSelected: boolean; onToggle: (id: string) => void }) => ReactNode
  /** Empty state when rows.length === 0 */
  emptyState?: ReactNode
  /** Selection: pass view ids for "select all" */
  viewIds?: string[]
  isSelected?: (id: string) => boolean
  onToggleSelection?: (id: string) => void
  selectAllInView?: (ids: string[]) => void
  /** Bulk actions slot (e.g. Approve, Add tag, Archive) */
  bulkActions?: ReactNode
}

export function MagicfolderDataView<T extends MagicfolderDocItem>({
  title,
  description,
  rows,
  rowRenderer,
  cardRenderer,
  emptyState,
  viewIds = [],
  isSelected,
  onToggleSelection,
  selectAllInView,
  bulkActions,
}: MagicfolderDataViewProps<T>) {
  const viewMode = useMagicfolderSearchStore((s) => s.viewMode)
  const allInViewSelected =
    viewIds.length > 0 &&
    typeof isSelected === "function" &&
    viewIds.every((id) => isSelected(id))
  const selectedCount =
    typeof isSelected === "function" ? viewIds.filter((id) => isSelected(id)).length : 0

  if (rows.length === 0 && emptyState != null) {
    return <>{emptyState}</>
  }

  if (rows.length === 0) {
    return null
  }

  const showSelection =
    typeof isSelected === "function" &&
    typeof onToggleSelection === "function" &&
    typeof selectAllInView === "function"

  const defaultListRowRenderer = (doc: T) => (
    <MagicfolderDocTableRow
      key={doc.id}
      doc={doc}
      isSelected={isSelected?.(doc.id)}
      onToggleSelection={onToggleSelection}
      showCheckbox={showSelection}
      showLink
    />
  )
  const defaultCardRenderer = (doc: T) => (
    <MagicfolderDocCard
      key={doc.id}
      doc={doc}
      isSelected={isSelected?.(doc.id)}
      onToggleSelection={onToggleSelection}
      showCheckbox={showSelection}
      showLink
    />
  )

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            {description ?? `${rows.length} document(s)`}
            {showSelection ? " · Select for bulk actions" : ""}
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {showSelection && (
            <>
              <Checkbox
                checked={allInViewSelected}
                onCheckedChange={() => selectAllInView!(viewIds)}
              />
              <span className="text-sm text-muted-foreground">Select all</span>
              {selectedCount > 0 && bulkActions}
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === "grid" ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((doc) => (
              <li key={doc.id}>
                {cardRenderer != null
                  ? cardRenderer(doc, {
                    isSelected: isSelected?.(doc.id) ?? false,
                    onToggle: onToggleSelection ?? (() => { }),
                  })
                  : defaultCardRenderer(doc)}
              </li>
            ))}
          </ul>
        ) : rowRenderer != null ? (
          <ul className="divide-y divide-border">
            {rows.map((doc) => (
              <li key={doc.id}>
                {rowRenderer(doc, {
                  isSelected: isSelected?.(doc.id) ?? false,
                  onToggle: onToggleSelection ?? (() => { }),
                })}
              </li>
            ))}
          </ul>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {showSelection && (
                  <TableHead className="w-10" aria-label="Select row" />
                )}
                <TableHead>Title</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((doc) =>
                defaultListRowRenderer(doc)
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
