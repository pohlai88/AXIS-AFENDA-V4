/**
 * @domain magicfolder
 * @layer client
 * @responsibility UI-only: search filters, sort, viewMode, recent searches
 * Truth (documents) stays server-side; this store keeps filters from resetting on navigate.
 */

"use client"

import { create } from "zustand"

import type { DocType, Status } from "@/lib/contracts/magicfolder"

export type MagicfolderSortBy = "createdAt" | "title" | "sizeBytes" | "docType"
export type MagicfolderSortOrder = "asc" | "desc"
export type MagicfolderViewMode = "list" | "grid"

export type SavedView = {
  id: string
  name: string
  filters: MagicfolderFilters
  sortBy: MagicfolderSortBy
  sortOrder: MagicfolderSortOrder
}

export type MagicfolderFilters = {
  status?: Status
  docType?: DocType
  hasTags?: "0" | "1"
  hasType?: "0" | "1"
  tagId?: string // uuid
  dateFrom?: string // ISO date
  dateTo?: string
  /** Reserved for future; not yet used by API or UI */
  counterparty?: string
}

interface MagicfolderSearchStore {
  filters: MagicfolderFilters
  sortBy: MagicfolderSortBy
  sortOrder: MagicfolderSortOrder
  viewMode: MagicfolderViewMode
  recentSearches: string[]

  setFilters: (filters: Partial<MagicfolderFilters>) => void
  clearFilters: () => void
  setSort: (sortBy: MagicfolderSortBy, sortOrder: MagicfolderSortOrder) => void
  setViewMode: (viewMode: MagicfolderViewMode) => void
  addRecentSearch: (query: string) => void
  clearRecentSearches: () => void
}

const defaultFilters: MagicfolderFilters = {}
const MAX_RECENT = 10

export const useMagicfolderSearchStore = create<MagicfolderSearchStore>((set) => ({
  filters: defaultFilters,
  sortBy: "createdAt",
  sortOrder: "desc",
  viewMode: "list",
  recentSearches: [],

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  clearFilters: () => set({ filters: defaultFilters }),

  setSort: (sortBy, sortOrder) => set({ sortBy, sortOrder }),

  setViewMode: (viewMode) => set({ viewMode }),

  addRecentSearch: (query) =>
    set((state) => {
      const trimmed = query.trim()
      if (!trimmed) return state
      const next = [trimmed, ...state.recentSearches.filter((q) => q !== trimmed)].slice(
        0,
        MAX_RECENT
      )
      return { recentSearches: next }
    }),

  clearRecentSearches: () => set({ recentSearches: [] }),
}))
