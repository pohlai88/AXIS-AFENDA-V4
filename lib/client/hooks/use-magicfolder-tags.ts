/**
 * @domain magicfolder
 * @layer client
 * @responsibility Fetch tags from API for settings / tag pickers
 */

"use client"

import { useState, useCallback, useEffect } from "react"
import { routes } from "@/lib/routes"

export type TagItem = { id: string; name: string; slug?: string }

/**
 * Hook to fetch and refetch tags from the MagicFolder tags API.
 * Use in settings or anywhere the tag list is needed (API is source of truth).
 */
export function useTags() {
  const [tags, setTags] = useState<TagItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(routes.api.v1.magicfolder.tags(), { credentials: "include" })
      if (!res.ok) throw new Error("Failed to load tags")
      const data = await res.json()
      const items = data.data?.items ?? []
      setTags(
        items.map((t: { id: string; name: string; slug?: string }) => ({
          id: t.id,
          name: t.name,
          slug: t.slug,
        }))
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tags")
      setTags([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { tags, loading, error, refetch }
}
