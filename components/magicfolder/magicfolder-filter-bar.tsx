/**
 * @domain magicfolder
 * @layer ui
 * @responsibility Single FilterBar: status, docType, hasTags, tagId, sort (uses useMagicfolderSearchStore)
 * Used by Inbox, Search, and MagicfolderToolbar. Built from shadcn Select, Button only.
 */

"use client"

import { useEffect, useState, useCallback } from "react"

import { routes } from "@/lib/routes"
import { useMagicfolderSearchStore } from "@/lib/client/store/magicfolder-search"
import type { MagicfolderSortBy, MagicfolderSortOrder } from "@/lib/client/store/magicfolder-search"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { STATUS, DOC_TYPE } from "@/lib/constants/magicfolder"
import { X } from "lucide-react"

type TagRow = { id: string; name: string; slug: string }

export function MagicfolderFilterBar() {
  const { filters, setFilters, clearFilters, sortBy, sortOrder, setSort } =
    useMagicfolderSearchStore()

  const [tags, setTags] = useState<TagRow[]>([])

  const hasFilters =
    filters.status != null ||
    filters.docType != null ||
    filters.hasTags != null ||
    filters.hasType != null ||
    filters.tagId != null

  const fetchTags = useCallback(() => {
    fetch(routes.api.v1.magicfolder.tags(), { credentials: "include" })
      .then((r) => r.json() as Promise<{ data?: { items: TagRow[] }; error?: unknown }>)
      .then((res) => {
        if (res.data?.items) setTags(res.data.items)
      })
  }, [])

  useEffect(() => {
    fetchTags()
  }, [fetchTags])

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={filters.status ?? "all"}
        onValueChange={(v) =>
          setFilters({ status: v === "all" ? undefined : (v as typeof filters.status) })
        }
      >
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All status</SelectItem>
          {Object.values(STATUS).map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={filters.docType ?? "all"}
        onValueChange={(v) =>
          setFilters({ docType: v === "all" ? undefined : (v as typeof filters.docType) })
        }
      >
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          {Object.values(DOC_TYPE).map((d) => (
            <SelectItem key={d} value={d}>
              {d}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={filters.hasTags ?? "all"}
        onValueChange={(v) =>
          setFilters({ hasTags: v === "all" ? undefined : (v as "0" | "1") })
        }
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Has tags" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any</SelectItem>
          <SelectItem value="1">Has tags</SelectItem>
          <SelectItem value="0">No tags</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={filters.tagId ?? "all"}
        onValueChange={(v) => setFilters({ tagId: v === "all" ? undefined : v })}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Tag" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All tags</SelectItem>
          {tags.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={`${sortBy}-${sortOrder}`}
        onValueChange={(v) => {
          const [by, order] = v.split("-") as [MagicfolderSortBy, MagicfolderSortOrder]
          setSort(by, order)
        }}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="createdAt-desc">Newest first</SelectItem>
          <SelectItem value="createdAt-asc">Oldest first</SelectItem>
          <SelectItem value="title-asc">Title A–Z</SelectItem>
          <SelectItem value="title-desc">Title Z–A</SelectItem>
          <SelectItem value="sizeBytes-desc">Largest first</SelectItem>
          <SelectItem value="sizeBytes-asc">Smallest first</SelectItem>
        </SelectContent>
      </Select>
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="mr-1 h-4 w-4" />
          Clear filters
        </Button>
      )}
    </div>
  )
}
