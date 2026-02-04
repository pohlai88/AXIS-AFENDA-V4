/**
 * @domain magicfolder
 * @layer client
 * @responsibility Fetch documents from list API and update hub store
 */

"use client"

import { useCallback } from "react"
import { routes } from "@/lib/routes"
import { useDocumentHubStore } from "@/lib/client/store/magicfolder-enhanced"
import type { SmartFilter } from "@/lib/client/store/magicfolder-enhanced"
import type { SortBy, SortOrder } from "@/lib/client/store/magicfolder-enhanced"

export type UseDocumentsOptions = {
  sortBy: SortBy
  sortOrder: SortOrder
  limit: number
  offset: number
}

/**
 * Hook to fetch documents for the given filters and pagination, updating the hub store.
 * Returns a fetch function and the store's loading/error state.
 */
export function useDocuments(
  filters: SmartFilter,
  options: UseDocumentsOptions
) {
  const setDocuments = useDocumentHubStore((s) => s.setDocuments)
  const setLoading = useDocumentHubStore((s) => s.setLoading)
  const setError = useDocumentHubStore((s) => s.setError)
  const loading = useDocumentHubStore((s) => s.loading)
  const error = useDocumentHubStore((s) => s.error)

  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        limit: String(options.limit),
        offset: String(options.offset),
        sortBy: options.sortBy,
        sortOrder: options.sortOrder,
      })
      if (filters.status) params.set("status", filters.status)
      if (filters.type) params.set("docType", filters.type)
      if (filters.searchQuery) params.set("q", filters.searchQuery)
      if (filters.tags?.length) {
        filters.tags.forEach((tag) => params.append("tagId", tag))
      }
      if (filters.dateRange) {
        params.set("dateFrom", filters.dateRange.from)
        params.set("dateTo", filters.dateRange.to)
      }

      const response = await fetch(`${routes.api.v1.magicfolder.list()}?${params}`, {
        credentials: "include",
      })
      const data = await response.json()
      if (data.error) throw new Error(data.error.message ?? "Failed to fetch")
      setDocuments(data.data.items ?? [], data.data.total ?? 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch documents")
    } finally {
      setLoading(false)
    }
  }, [filters, options, setDocuments, setLoading, setError])

  return { fetchDocuments, loading, error }
}
