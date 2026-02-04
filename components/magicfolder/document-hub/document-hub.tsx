/**
 * @domain magicfolder
 * @layer ui
 * @responsibility Unified Document Hub - main interface replacing 6 separate sections
 * Features: Smart filtering, mobile-first design, bulk operations, real-time updates
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { useShallow } from "zustand/react/shallow"
import { routes } from "@/lib/routes"
import { useKeyboardShortcuts } from "@/lib/client/hooks/use-keyboard-shortcuts"
import { useDocumentHubStore, useUploadStore, type SortBy, type SortOrder } from "@/lib/client/store/magicfolder-enhanced"
import { useDocuments } from "@/lib/client/hooks/use-magicfolder-documents"
import { EnhancedDocumentCard } from "@/components/magicfolder/document-card/enhanced-document-card"
import { DocumentTable } from "@/components/magicfolder/document-table/document-table"
import { RelationshipView } from "@/components/magicfolder/relationship-view/relationship-view"
import { BoardView } from "@/components/magicfolder/board-view/board-view"
import { TimelineView } from "@/components/magicfolder/timeline-view/timeline-view"
import { SmartFilters } from "@/components/magicfolder/smart-filters/smart-filters"
import { QuickSettingsToolbar } from "@/components/magicfolder/quick-settings/quick-settings-toolbar"
import { SavedViewManager } from "@/components/magicfolder/saved-views/saved-view-manager"
import { MagicfolderErrorBoundary } from "@/components/magicfolder/ui/error-boundary"
import { KeyboardShortcutsDialog } from "@/components/magicfolder/ui/keyboard-shortcuts-dialog"
import type { SavedView } from "@/lib/contracts/magicfolder-saved-views"
import {
  FileText,
  Upload,
  List,
  Table,
  Network,
  BarChart3,
  Archive,
  Tag,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  LayoutGrid,
  Calendar,
} from "lucide-react"

interface DocumentHubProps {
  className?: string
}

export function DocumentHub({ className }: DocumentHubProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const pageFromUrl = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1)

  const {
    documents,
    totalCount,
    loading,
    error,
    viewMode,
    sortBy,
    sortOrder,
    filters,
    selectedIds,
    showBulkActions,
    isMobile,
    setViewMode,
    setSorting,
    setFilters,
    setDocuments,
    setLoading,
    setError,
    toggleSelection,
    selectDocument,
    clearSelection,
  } = useDocumentHubStore(
    useShallow((s) => ({
      documents: s.documents,
      totalCount: s.totalCount,
      loading: s.loading,
      error: s.error,
      viewMode: s.viewMode,
      sortBy: s.sortBy,
      sortOrder: s.sortOrder,
      filters: s.filters,
      selectedIds: s.selectedIds,
      showBulkActions: s.showBulkActions,
      isMobile: s.isMobile,
      setViewMode: s.setViewMode,
      setSorting: s.setSorting,
      setFilters: s.setFilters,
      setDocuments: s.setDocuments,
      setLoading: s.setLoading,
      setError: s.setError,
      toggleSelection: s.toggleSelection,
      selectDocument: s.selectDocument,
      clearSelection: s.clearSelection,
    }))
  )

  const { toggleUploadDialog, completedUploads } = useUploadStore()

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastCompletedCount, setLastCompletedCount] = useState(0)
  const [stats, setStats] = useState({
    inbox: 0,
    active: 0,
    archived: 0,
    total: 0,
  })

  const PAGE_SIZE = isMobile ? 20 : 50
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const offset = (pageFromUrl - 1) * PAGE_SIZE

  const { fetchDocuments } = useDocuments(filters, {
    sortBy,
    sortOrder,
    limit: PAGE_SIZE,
    offset,
  })

  // Fetch stats - memoized with empty deps since it doesn't depend on any external values
  const fetchStats = useCallback(async () => {
    try {
      const [inboxRes, activeRes, archivedRes] = await Promise.all([
        fetch(`${routes.api.v1.magicfolder.list()}?status=inbox&limit=1`, { credentials: 'include' }),
        fetch(`${routes.api.v1.magicfolder.list()}?status=active&limit=1`, { credentials: 'include' }),
        fetch(`${routes.api.v1.magicfolder.list()}?status=archived&limit=1`, { credentials: 'include' }),
      ])

      const [inboxData, activeData, archivedData] = await Promise.all([
        inboxRes.json(),
        activeRes.json(),
        archivedRes.json(),
      ])

      setStats({
        inbox: inboxData.data?.total || 0,
        active: activeData.data?.total || 0,
        archived: archivedData.data?.total || 0,
        total: (inboxData.data?.total || 0) + (activeData.data?.total || 0) + (archivedData.data?.total || 0),
      })
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }, []) // Empty deps - this function doesn't use any external values

  // Refresh data
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await Promise.all([fetchDocuments(), fetchStats()])
    setIsRefreshing(false)
  }, [fetchDocuments, fetchStats])

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onViewModeChange: setViewMode,
    onRefresh: handleRefresh,
    onUpload: toggleUploadDialog,
    onSelectAll: () => {
      documents.forEach(doc => selectDocument(doc.id, true))
    },
    onClearSelection: clearSelection,
  })

  // Sync pathname to store so sub-pages (inbox, duplicates, etc.) open with correct filter
  const setInitialFilterFromRoute = useDocumentHubStore((s) => s.setInitialFilterFromRoute)
  useEffect(() => {
    if (!pathname?.startsWith(routes.ui.magicfolder.root())) return
    let routeFilter: Parameters<typeof setFilters>[0] = {}
    if (pathname === routes.ui.magicfolder.inbox() || pathname === routes.ui.magicfolder.unsorted()) {
      routeFilter = { status: "inbox" }
    } else if (pathname === routes.ui.magicfolder.duplicates()) {
      routeFilter = { status: "all" }
    } else if (pathname === routes.ui.magicfolder.search()) {
      routeFilter = { status: "all", searchQuery: "" }
    } else if (pathname === routes.ui.magicfolder.collections()) {
      routeFilter = { status: "all" }
    }
    if (Object.keys(routeFilter).length > 0) {
      setInitialFilterFromRoute(routeFilter)
      setFilters(routeFilter)
    }
  }, [pathname, setFilters, setInitialFilterFromRoute])

  // Apply default filters from user preferences when on landing page (no route override)
  useEffect(() => {
    if (pathname !== routes.ui.magicfolder.landing()) return
    let cancelled = false
    fetch(routes.api.v1.magicfolder.preferences(), { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        const qs = data.data?.preferences?.quickSettings ?? {}
        const status = qs.defaultStatusFilter ?? "inbox"
        const type = qs.defaultDocTypeFilter ?? "other"
        setFilters({ status, type })
      })
      .catch(() => { })
    return () => { cancelled = true }
  }, [pathname, setFilters])

  // Initial load and dependencies
  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  // Auto-refresh when uploads complete
  useEffect(() => {
    const currentCount = completedUploads.size
    if (currentCount > lastCompletedCount) {
      // New uploads completed, refresh the list after a small delay
      const timer = setTimeout(() => {
        handleRefresh()
      }, 500)
      return () => clearTimeout(timer)
    }
    setLastCompletedCount(currentCount)
  }, [completedUploads.size, lastCompletedCount, handleRefresh])

  // Handle bulk actions with API calls
  const handleBulkArchive = useCallback(async () => {
    try {
      const res = await fetch(routes.api.v1.magicfolder.bulk(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'archive',
          objectIds: Array.from(selectedIds),
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error?.message || 'Failed to archive documents')
      }

      const data = await res.json()
      toast.success(`Archived ${data.data.updated} document(s)`)
      clearSelection()
      handleRefresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to archive documents'
      toast.error(message)
    }
  }, [selectedIds, clearSelection, handleRefresh])

  const handleBulkTag = useCallback(() => {
    // Open tag dialog - for now show a toast
    toast.info('Use the BulkActions panel for tagging')
  }, [])

  const handleBulkProcess = useCallback(async () => {
    try {
      const objectIds = Array.from(selectedIds)
      let processed = 0

      for (const objectId of objectIds) {
        const res = await fetch(routes.api.v1.magicfolder.objectById(objectId), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ status: 'active' }),
        })

        if (res.ok) processed++
      }

      toast.success(`Processed ${processed} document(s)`)
      clearSelection()
      handleRefresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to process documents'
      toast.error(message)
    }
  }, [selectedIds, clearSelection, handleRefresh])

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Documents</h3>
          <p className="text-muted-foreground text-center mb-4">{error}</p>
          <Button onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("space-y-4 sm:space-y-6", className)}>
      {/* Mobile-first Header with stats */}
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold truncate">Documents</h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              Manage and organize your documents with smart filtering
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing || loading}
              className="shrink-0"
            >
              <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button onClick={toggleUploadDialog} className="shrink-0">
              <Upload className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Upload</span>
            </Button>
          </div>
        </div>

        {/* Stats cards - Mobile optimized */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-lg sm:text-2xl font-bold truncate">{stats.inbox}</p>
                  <p className="text-xs text-muted-foreground">Needs Review</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg shrink-0">
                  <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-lg sm:text-2xl font-bold truncate">{stats.active}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 bg-muted rounded-lg shrink-0">
                  <Archive className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-lg sm:text-2xl font-bold truncate">{stats.archived}</p>
                  <p className="text-xs text-muted-foreground">Archived</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg shrink-0">
                  <BarChart3 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-lg sm:text-2xl font-bold truncate">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Smart Filters */}
      <SmartFilters />

      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {totalCount} documents
          </span>
          {selectedIds.size > 0 && (
            <Badge variant="secondary">
              {selectedIds.size} selected
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <QuickSettingsToolbar />
          <KeyboardShortcutsDialog />
        </div>
      </div>

      {/* Bulk actions */}
      {
        showBulkActions && (
          <Card className="border-primary">
            <CardContent className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {selectedIds.size} documents selected
                  </span>
                  <Button variant="ghost" size="sm" onClick={clearSelection}>
                    Clear selection
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={handleBulkProcess}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Process
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleBulkTag}>
                    <Tag className="mr-2 h-4 w-4" />
                    Add Tags
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleBulkArchive}>
                    <Archive className="mr-2 h-4 w-4" />
                    Archive
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      }

      {/* Saved Views Sidebar */}
      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          {/* Documents grid/list */}
          {
            loading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="h-24 bg-muted rounded" />
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : documents.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No documents found</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {Object.keys(filters).length > 0
                      ? 'Try adjusting your filters or search terms'
                      : 'Upload your first document to get started'}
                  </p>
                  <Button onClick={toggleUploadDialog}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Document
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {viewMode === 'table' ? (
                  <DocumentTable
                    documents={documents}
                    selectedIds={selectedIds}
                    onToggleSelection={toggleSelection}
                  />
                ) : viewMode === 'board' ? (
                  <BoardView
                    documents={documents}
                    selectedIds={selectedIds}
                    onToggleSelection={toggleSelection}
                  />
                ) : viewMode === 'timeline' ? (
                  <TimelineView
                    documents={documents}
                    selectedIds={selectedIds}
                    onToggleSelection={toggleSelection}
                  />
                ) : viewMode === 'relationship' ? (
                  <RelationshipView
                    documents={documents}
                    selectedIds={selectedIds}
                    onToggleSelection={toggleSelection}
                  />
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {documents.map((document) => (
                      <EnhancedDocumentCard
                        key={document.id}
                        document={document}
                        viewMode="card"
                        showCheckbox={true}
                        isSelected={selectedIds.has(document.id)}
                        onToggleSelection={toggleSelection}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          }

          {/* Pagination */}
          {
            totalPages > 1 && (
              <div className="flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href={pageFromUrl > 1 ? `?page=${pageFromUrl - 1}` : undefined}
                        className={pageFromUrl <= 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>

                    {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                      const page = i + 1
                      const isActive = page === pageFromUrl

                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            href={`?page=${page}`}
                            isActive={isActive}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    })}

                    <PaginationItem>
                      <PaginationNext
                        href={pageFromUrl < totalPages ? `?page=${pageFromUrl + 1}` : undefined}
                        className={pageFromUrl >= totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )
          }
        </div>

        {/* Saved Views Panel */}
        <div className="lg:col-span-1">
          <MagicfolderErrorBoundary>
            <SavedViewManager
              currentFilters={filters}
              currentViewMode={viewMode}
              currentSortBy={sortBy}
              currentSortOrder={sortOrder}
              onViewApply={(view) => {
                // Apply saved view
                setFilters(view.filters as any)
                setViewMode(view.viewMode)
                setSorting(view.sortBy as any, view.sortOrder)
              }}
            />
          </MagicfolderErrorBoundary>
        </div>
      </div>
    </div>
  )
}
