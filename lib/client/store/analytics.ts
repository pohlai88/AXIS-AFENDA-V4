"use client"

import { create } from "zustand"
import { routes } from "@/lib/routes"
import { apiFetch } from "@/lib/api/client"
import type {
  AnalyticsResponse,
  QuickStats,
  InsightsResponse,
  AnalyticsRequest,
  AnalyticsTimeRange
} from "@/lib/contracts/analytics"
import { z } from "zod"

// Simple schema validation (in production these would be imported from contracts)
const AnalyticsResponseSchema = z.any() // Placeholder
const QuickStatsSchema = z.any() // Placeholder  
const InsightsResponseSchema = z.any() // Placeholder

interface AnalyticsStore {
  // State
  analytics: AnalyticsResponse | null
  quickStats: QuickStats | null
  insights: InsightsResponse | null
  loading: boolean
  error: string | null
  currentTimeRange: AnalyticsTimeRange

  // Actions
  setAnalytics: (analytics: AnalyticsResponse) => void
  setQuickStats: (quickStats: QuickStats) => void
  setInsights: (insights: InsightsResponse) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setTimeRange: (timeRange: AnalyticsTimeRange) => void

  // API calls
  fetchAnalytics: (userId: string, request?: Partial<AnalyticsRequest>) => Promise<void>
  fetchQuickStats: (userId: string) => Promise<void>
  fetchInsights: (userId: string) => Promise<void>
  refreshAll: (userId: string) => Promise<void>
}

export const useAnalyticsStore = create<AnalyticsStore>((set, get) => ({
  // Initial state
  analytics: null,
  quickStats: null,
  insights: null,
  loading: false,
  error: null,
  currentTimeRange: "month" as AnalyticsTimeRange,

  // Basic actions
  setAnalytics: (analytics) => set({ analytics }),
  setQuickStats: (quickStats) => set({ quickStats }),
  setInsights: (insights) => set({ insights }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setTimeRange: (timeRange) => set({ currentTimeRange: timeRange }),

  // API calls
  fetchAnalytics: async (userId, request) => {
    set({ loading: true, error: null })

    try {
      const analyticsRequest: AnalyticsRequest = {
        timeRange: request?.timeRange || get().currentTimeRange,
        projectId: request?.projectId,
        includePatterns: request?.includePatterns || false,
        includeTags: request?.includeTags || false,
      }

      // Build URL with query parameters
      const url = new URL(routes.api.analytics(), window.location.origin)
      url.searchParams.set('timeRange', analyticsRequest.timeRange)
      if (analyticsRequest.projectId) {
        url.searchParams.set('projectId', analyticsRequest.projectId)
      }
      if (analyticsRequest.includePatterns) {
        url.searchParams.set('includePatterns', 'true')
      }
      if (analyticsRequest.includeTags) {
        url.searchParams.set('includeTags', 'true')
      }

      const analytics = await apiFetch(
        url.toString(),
        {
          headers: { "x-user-id": userId }
        },
        AnalyticsResponseSchema
      ) as AnalyticsResponse

      set({ analytics, loading: false })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch analytics"
      set({ error: errorMessage, loading: false })
    }
  },

  fetchQuickStats: async (userId) => {
    try {
      const quickStats = await apiFetch(
        `${routes.api.analytics()}/quick-stats`,
        { headers: { "x-user-id": userId } },
        QuickStatsSchema
      ) as QuickStats

      set({ quickStats })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch quick stats"
      set({ error: errorMessage })
    }
  },

  fetchInsights: async (userId) => {
    try {
      const insights = await apiFetch(
        `${routes.api.analytics()}/insights`,
        { headers: { "x-user-id": userId } },
        InsightsResponseSchema
      ) as InsightsResponse

      set({ insights })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch insights"
      set({ error: errorMessage })
    }
  },

  refreshAll: async (userId) => {
    const { currentTimeRange } = get()

    // Fetch all data in parallel for better performance
    await Promise.all([
      get().fetchAnalytics(userId, { timeRange: currentTimeRange }),
      get().fetchQuickStats(userId),
      get().fetchInsights(userId),
    ])
  },
}))
