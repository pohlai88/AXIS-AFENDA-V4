/**
 * @domain magicfolder
 * @layer ui
 * @responsibility Search: full-text + filters; uses list API with q
 * Composes blocks only: MagicfolderPageHeader, MagicfolderSection, MagicfolderFilterBar,
 * MagicfolderDataView, MagicfolderEmptyState, MagicfolderLoading, Alert, Input, Button.
 */

"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useSearchParams } from "next/navigation"

import { routes } from "@/lib/routes"
import { useMagicfolderSearchStore } from "@/lib/client/store/magicfolder-search"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { AlertCircle, Search } from "lucide-react"
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
  MagicfolderFilterBar,
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

export default function MagicFolderSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tagIdFromUrl = useMemo(() => searchParams.get("tagId"), [searchParams])
  const docTypeFromUrl = useMemo(() => searchParams.get("docType"), [searchParams])
  const pageFromUrl = useMemo(() => Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1), [searchParams])
  const filters = useMagicfolderSearchStore((s) => s.filters)
  const { addRecentSearch, setFilters } = useMagicfolderSearchStore()

  // Hydrate FilterBar/store from URL so deep links (e.g. Collections → Search) show correct filters
  useEffect(() => {
    const tagId = searchParams.get("tagId") ?? undefined
    const docType = searchParams.get("docType") ?? undefined
    setFilters({ tagId: tagId || undefined, docType: docType || undefined })
  }, [searchParams, setFilters])

  const [query, setQuery] = useState("")
  const [submitted, setSubmitted] = useState("")
  const [items, setItems] = useState<DocItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const limit = PAGE_SIZE
  const offset = (pageFromUrl - 1) * limit
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const sortBy = useMagicfolderSearchStore((s) => s.sortBy)
  const sortOrder = useMagicfolderSearchStore((s) => s.sortOrder)

  const search = useCallback((page = pageFromUrl) => {
    const q = query.trim()
    setSubmitted(q)
    setLoading(true)
    setError(null)
    const off = (page - 1) * limit
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(off),
      sortBy,
      sortOrder,
    })
    if (q) params.set("q", q)
    if (filters.status) params.set("status", filters.status)
    if (filters.docType) params.set("docType", filters.docType)
    if (filters.hasTags) params.set("hasTags", filters.hasTags)
    if (filters.tagId ?? tagIdFromUrl) params.set("tagId", (filters.tagId ?? tagIdFromUrl) ?? "")
    if (filters.docType ?? docTypeFromUrl) params.set("docType", (filters.docType ?? docTypeFromUrl) ?? "")
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
          if (q) addRecentSearch(q)
        }
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Search failed")
      })
      .finally(() => setLoading(false))
  }, [query, filters.status, filters.docType, filters.hasTags, filters.tagId, tagIdFromUrl, docTypeFromUrl, sortBy, sortOrder, addRecentSearch, pageFromUrl, limit])

  useEffect(() => {
    queueMicrotask(() => search(pageFromUrl))
  }, [filters.status, filters.docType, filters.hasTags, filters.tagId, tagIdFromUrl, docTypeFromUrl, pageFromUrl, search])

  const searchWithPageOne = useCallback(() => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev)
      p.set("page", "1")
      return p
    })
  }, [setSearchParams])

  const emptyState = (
    <MagicfolderEmptyState
      icon={<Search className="h-10 w-10 text-muted-foreground" />}
      title="No results"
      description={
        submitted
          ? `No documents match "${submitted}".`
          : "Enter a search term or adjust filters."
      }
    />
  )

  return (
    <MagicfolderSection layout="stack" className="space-y-6">
      <MagicfolderPageHeader
        title="MagicFolder · Search"
        description="Search by title; filter by status and type"
        actions={
          <Link
            href={routes.ui.magicfolder.inbox()}
            className="text-sm font-medium text-primary hover:underline"
          >
            Inbox
          </Link>
        }
      />

      <MagicfolderSection layout="flex">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchWithPageOne()}
            className="pl-9"
          />
        </div>
        <Button type="button" onClick={searchWithPageOne}>
          Search
        </Button>
      </MagicfolderSection>

      <MagicfolderFilterBar />

      {tagIdFromUrl && (
        <MagicfolderSection layout="flex">
          <span className="text-sm text-muted-foreground">Filtered by tag</span>
          <Link href={routes.ui.magicfolder.search()}>
            <Button variant="ghost" size="sm">
              Clear tag
            </Button>
          </Link>
        </MagicfolderSection>
      )}

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
            title="Results"
            description={`${total} document(s)`}
            rows={items}
            emptyState={emptyState}
          />
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href={
                      pageFromUrl <= 1
                        ? undefined
                        : `${routes.ui.magicfolder.search()}?${(() => {
                          const p = new URLSearchParams(searchParams)
                          p.set("page", String(pageFromUrl - 1))
                          return p
                        })()}`
                    }
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
                    href={
                      pageFromUrl >= totalPages
                        ? undefined
                        : `${routes.ui.magicfolder.search()}?${(() => {
                          const p = new URLSearchParams(searchParams)
                          p.set("page", String(pageFromUrl + 1))
                          return p
                        })()}`
                    }
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