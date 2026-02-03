/**
 * @domain magicfolder
 * @layer ui
 * @responsibility Unsorted: documents with docType=other (and no tags)
 * Composes blocks only: MagicfolderPageHeader, MagicfolderSection, MagicfolderDataView,
 * MagicfolderEmptyState, MagicfolderLoading, Alert.
 */

"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useSearchParams } from "next/navigation"

import { routes } from "@/lib/routes"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, FolderX } from "lucide-react"
import Link from "next/link"

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  MagicfolderPageHeader,
  MagicfolderSection,
  MagicfolderDataView,
  MagicfolderEmptyState,
  MagicfolderLoading,
} from "@/components/magicfolder"

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

export default function MagicFolderUnsortedPage() {
  const searchParams = useSearchParams()
  const pageFromUrl = useMemo(() => Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1), [searchParams])
  const [items, setItems] = useState<DocItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const limit = PAGE_SIZE
  const offset = (pageFromUrl - 1) * limit
  const totalPages = Math.max(1, Math.ceil(total / limit))

  const fetchList = useCallback(() => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({
      docType: "other",
      hasTags: "0",
      limit: String(limit),
      offset: String(offset),
    })
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
  }, [limit, offset])

  useEffect(() => {
    queueMicrotask(() => fetchList())
  }, [fetchList])

  const emptyState = (
    <MagicfolderEmptyState
      icon={<FolderX className="h-10 w-10 text-muted-foreground" />}
      title="No unsorted documents"
      description="Documents with docType=other and no tags appear here. Assign a type or add tags to move them out."
    />
  )

  return (
    <MagicfolderSection layout="stack" className="space-y-6">
      <MagicfolderPageHeader
        title="MagicFolder · Unsorted"
        description="Documents with no type and no tags (docType=other, untagged)"
        actions={
          <Link
            href={routes.ui.magicfolder.inbox()}
            className="text-sm font-medium text-primary hover:underline"
          >
            Inbox
          </Link>
        }
      />

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
            title="Unsorted"
            description={`${total} document(s) with no type and no tags`}
            rows={items}
            emptyState={emptyState}
          />
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href={pageFromUrl <= 1 ? undefined : `${routes.ui.magicfolder.unsorted()}?page=${pageFromUrl - 1}`}
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
                    href={pageFromUrl >= totalPages ? undefined : `${routes.ui.magicfolder.unsorted()}?page=${pageFromUrl + 1}`}
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