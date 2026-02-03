/**
 * @domain magicfolder
 * @layer ui
 * @responsibility Inbox: documents with status=inbox; filters + selection from Zustand
 * Composes blocks only: MagicfolderPageHeader, MagicfolderSection, MagicfolderFilterBar,
 * MagicfolderDataView, MagicfolderEmptyState, MagicfolderLoading, Alert, Button, DropdownMenu.
 */

"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useSearchParams } from "next/navigation"

import { routes } from "@/lib/routes"
import { useMagicfolderSearchStore } from "@/lib/client/store/magicfolder-search"
import { useMagicfolderSelectionStore } from "@/lib/client/store/magicfolder-selection"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AlertCircle, Check, Archive, Tag, ChevronDown, FileText, Upload } from "lucide-react"
import Link from "next/link"

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  MagicfolderPageHeader,
  MagicfolderSection,
  MagicfolderFilterBar,
  MagicfolderDataView,
  MagicfolderEmptyState,
  MagicfolderLoading,
  MagicfolderUploadDialog,
} from "@/components/magicfolder"

type TagRow = { id: string; name: string; slug: string }

type DocItem = {
  id: string
  title: string | null
  status: string
  docType: string
  createdAt: string
  version?: {
    id: string
    mimeType: string
    sizeBytes: number
    sha256: string
  }
}

type ListResponse = {
  data: { items: DocItem[]; total: number; limit: number; offset: number } | null
  error: { code: string; message: string } | null
}

const PAGE_SIZE = 50

export default function MagicFolderInboxPage() {
  const searchParams = useSearchParams()
  const pageFromUrl = useMemo(() => Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1), [searchParams])
  const filters = useMagicfolderSearchStore((s) => s.filters)
  const sortBy = useMagicfolderSearchStore((s) => s.sortBy)
  const sortOrder = useMagicfolderSearchStore((s) => s.sortOrder)
  const { isSelected, toggle, selectAllInView, clear } = useMagicfolderSelectionStore()

  const [items, setItems] = useState<DocItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tags, setTags] = useState<TagRow[]>([])
  const [tagsLoading, setTagsLoading] = useState(false)
  const [bulkLoading, setBulkLoading] = useState(false)

  const status = filters.status ?? "inbox"
  const limit = PAGE_SIZE
  const offset = (pageFromUrl - 1) * limit
  const totalPages = Math.max(1, Math.ceil(total / limit))

  const fetchList = useCallback(() => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({
      status,
      limit: String(limit),
      offset: String(offset),
      sortBy,
      sortOrder,
    })
    if (filters.docType) params.set("docType", filters.docType)
    if (filters.tagId) params.set("tagId", filters.tagId)
    if (filters.hasTags) params.set("hasTags", filters.hasTags)
    fetch(`${routes.api.v1.magicfolder.list()}?${params}`, { credentials: "include" })
      .then((r) => r.json() as Promise<ListResponse>)
      .then((res) => {
        if (res.error) {
          setError(res.error.message)
          return
        }
        if (res.data) {
          setItems(res.data.items)
          setTotal(res.data.total)
        }
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load")
      })
      .finally(() => setLoading(false))
  }, [status, limit, offset, sortBy, sortOrder, filters.docType, filters.tagId, filters.hasTags, pageFromUrl])

  useEffect(() => {
    queueMicrotask(() => fetchList())
  }, [fetchList])

  const viewIds = items.map((d) => d.id)
  const selectedIds = viewIds.filter((id) => isSelected(id))

  const approveSelected = useCallback(() => {
    if (selectedIds.length === 0) return
    setBulkLoading(true)
    Promise.all(
      selectedIds.map((objectId) =>
        fetch(routes.api.v1.magicfolder.objectById(objectId), {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "active" }),
        })
      )
    )
      .then(() => fetchList())
      .finally(() => setBulkLoading(false))
  }, [selectedIds, fetchList])

  const archiveSelected = useCallback(() => {
    if (selectedIds.length === 0) return
    setBulkLoading(true)
    fetch(routes.api.v1.magicfolder.bulk(), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "archive", objectIds: selectedIds }),
    })
      .then((r) => r.json())
      .then(() => fetchList())
      .finally(() => setBulkLoading(false))
  }, [selectedIds, fetchList])

  const fetchTags = useCallback(() => {
    setTagsLoading(true)
    fetch(routes.api.v1.magicfolder.tags(), { credentials: "include" })
      .then((r) => r.json() as Promise<{ data?: { items: TagRow[] }; error?: { message: string } }>)
      .then((res) => {
        if (res.data?.items) setTags(res.data.items)
      })
      .finally(() => setTagsLoading(false))
  }, [])

  const bulkAddTag = useCallback(
    (tagId: string) => {
      if (selectedIds.length === 0) return
      setBulkLoading(true)
      fetch(routes.api.v1.magicfolder.bulk(), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "addTag", objectIds: selectedIds, tagId }),
      })
        .then((r) => r.json())
        .then(() => {
          fetchList()
          clear()
        })
        .finally(() => setBulkLoading(false))
    },
    [selectedIds, fetchList, clear]
  )

  const bulkActions =
    selectedIds.length > 0 ? (
      <>
        <Button
          size="sm"
          variant="outline"
          disabled={bulkLoading}
          onClick={approveSelected}
        >
          <Check className="mr-1 h-4 w-4" />
          Approve ({selectedIds.length})
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              disabled={bulkLoading || tagsLoading}
              onClick={fetchTags}
            >
              <Tag className="mr-1 h-4 w-4" />
              Add tag ({selectedIds.length})
              <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {tags.length === 0 && !tagsLoading && (
              <DropdownMenuItem disabled>No tags yet</DropdownMenuItem>
            )}
            {tags.map((tag) => (
              <DropdownMenuItem key={tag.id} onClick={() => bulkAddTag(tag.id)}>
                {tag.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          size="sm"
          variant="outline"
          disabled={bulkLoading}
          onClick={archiveSelected}
        >
          <Archive className="mr-1 h-4 w-4" />
          Archive ({selectedIds.length})
        </Button>
      </>
    ) : null

  const emptyState = (
    <MagicfolderEmptyState
      icon={<FileText className="h-10 w-10 text-muted-foreground" />}
      title="No documents in Inbox"
      description="Upload documents via presign → PUT to R2 → ingest. They will appear here."
    />
  )

  return (
    <MagicfolderSection layout="stack" className="space-y-6">
      <MagicfolderPageHeader
        title="MagicFolder · Inbox"
        description="Documents with status Inbox"
        actions={
          <>
            <MagicfolderUploadDialog
              trigger={
                <Button size="sm" variant="outline">
                  <Upload className="mr-1 h-4 w-4" />
                  Upload
                </Button>
              }
            />
            <Link
              href={routes.ui.magicfolder.duplicates()}
              className="text-sm font-medium text-primary hover:underline"
            >
              Duplicates
            </Link>
          </>
        }
      />

      <MagicfolderFilterBar />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && <MagicfolderLoading />}

      {!loading && !error && items.length === 0 && emptyState}

      {!loading && !error && items.length > 0 && (
        <>
          <MagicfolderDataView
            title="Documents"
            description={`${total} document(s) · Select for bulk actions`}
            rows={items}
            viewIds={viewIds}
            isSelected={isSelected}
            onToggleSelection={toggle}
            selectAllInView={selectAllInView}
            bulkActions={bulkActions}
            emptyState={emptyState}
          />
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href={pageFromUrl <= 1 ? undefined : `${routes.ui.magicfolder.inbox()}?page=${pageFromUrl - 1}`}
                    aria-disabled={pageFromUrl <= 1}
                    className={pageFromUrl <= 1 ? "pointer-events-none opacity-50" : undefined}
                  />
                </PaginationItem>
                <PaginationItem>
                  <span className="px-2 text-sm text-muted-foreground">
                    Page {pageFromUrl} of {totalPages}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    href={pageFromUrl >= totalPages ? undefined : `${routes.ui.magicfolder.inbox()}?page=${pageFromUrl + 1}`}
                    aria-disabled={pageFromUrl >= totalPages}
                    className={pageFromUrl >= totalPages ? "pointer-events-none opacity-50" : undefined}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </MagicfolderSection>
  )
}
