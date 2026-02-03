/**
 * @domain magicfolder
 * @layer ui
 * @responsibility Duplicate groups + Keep Best; Zustand holds UI choice before commit
 */

"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useSearchParams } from "next/navigation"

import { routes } from "@/lib/routes"
import { useMagicfolderDuplicatesStore } from "@/lib/client/store/magicfolder-duplicates"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Copy, AlertCircle, Check } from "lucide-react"
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
  MagicfolderLoading,
  MagicfolderEmptyState,
  MagicfolderHelperText,
  DuplicateGroup,
  pickBestVersionId,
} from "@/components/magicfolder"

type VersionInGroup = {
  versionId: string
  objectId: string
  title: string | null
  mimeType: string
  sizeBytes: number
  sha256: string
  versionCreatedAt: string
}

type DuplicateGroup = {
  id: string
  tenantId: string
  reason: string
  keepVersionId: string | null
  createdAt: string
  versions: VersionInGroup[]
}

type GroupsResponse = {
  data: { items: DuplicateGroup[]; total: number; limit: number; offset: number } | null
  error: { code: string; message: string } | null
}

const PAGE_SIZE = 50

export default function MagicFolderDuplicatesPage() {
  const searchParams = useSearchParams()
  const pageFromUrl = useMemo(() => Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1), [searchParams])
  const { chosenKeepVersionId, setChosenKeepVersion, clearChoice } =
    useMagicfolderDuplicatesStore()

  const [groups, setGroups] = useState<DuplicateGroup[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [keeping, setKeeping] = useState<string | null>(null)
  const [dismissingGroupId, setDismissingGroupId] = useState<string | null>(null)

  const limit = PAGE_SIZE
  const offset = (pageFromUrl - 1) * limit
  const totalPages = Math.max(1, Math.ceil(total / limit))

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    fetch(`${routes.api.v1.magicfolder.duplicateGroups()}?limit=${limit}&offset=${offset}`, {
      credentials: "include",
    })
      .then((r) => r.json() as Promise<GroupsResponse>)
      .then((res) => {
        if (res.error) {
          setError(res.error.message)
          return
        }
        if (res.data) {
          setGroups(res.data.items)
          setTotal(res.data.total)
        }
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load")
      })
      .finally(() => setLoading(false))
  }, [limit, offset])

  useEffect(() => {
    load()
  }, [load])

  const handleKeepBest = async (groupId: string, versionId: string) => {
    setChosenKeepVersion(groupId, versionId)
    setKeeping(groupId)
    try {
      const res = await fetch(routes.api.v1.magicfolder.keepBest(), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId, versionId }),
      })
      const json = (await res.json()) as { data?: { groupId: string }; error?: { message: string } }
      if (json.error) throw new Error(json.error.message)
      clearChoice(groupId)
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Keep Best failed")
    } finally {
      setKeeping(null)
    }
  }

  const handleDismiss = async (groupId: string) => {
    setDismissingGroupId(groupId)
    setError(null)
    try {
      const res = await fetch(routes.api.v1.magicfolder.duplicateGroupById(groupId), {
        method: "DELETE",
        credentials: "include",
      })
      if (!res.ok) {
        const json = (await res.json()) as { error?: { message: string } }
        throw new Error(json.error?.message ?? "Failed to dismiss group")
      }
      clearChoice(groupId)
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Not duplicates failed")
    } finally {
      setDismissingGroupId(null)
    }
  }

  return (
    <MagicfolderSection layout="stack" className="space-y-6">
      <MagicfolderPageHeader
        title="MagicFolder · Duplicates"
        description="Exact duplicate groups — pick the best copy"
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

      {!loading && !error && groups.length === 0 && (
        <MagicfolderEmptyState
          icon={<Copy className="h-10 w-10 text-muted-foreground" />}
          title="No duplicate groups"
          description="When ingest finds exact duplicates (same SHA-256), they appear here."
        />
      )}

      {!loading && !error && groups.length > 0 && (
        <>
          <MagicfolderSection layout="stack" className="space-y-4">
            <MagicfolderHelperText>{total} duplicate group(s)</MagicfolderHelperText>
            {groups.map((group) => {
              const suggestedBestVersionId = pickBestVersionId(group.versions)
              const isKeeping = keeping === group.id
              const isDismissing = dismissingGroupId === group.id
              return (
                <DuplicateGroup
                  key={group.id}
                  id={group.id}
                  reason={group.reason}
                  keepVersionId={group.keepVersionId}
                  versions={group.versions}
                  chosenKeepVersionId={chosenKeepVersionId[group.id]}
                  suggestedBestVersionId={suggestedBestVersionId}
                  isKeeping={isKeeping}
                  isDismissing={isDismissing}
                  onKeepBest={handleKeepBest}
                  onDismiss={handleDismiss}
                />
              )
            })}
          </MagicfolderSection>
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href={pageFromUrl <= 1 ? undefined : `${routes.ui.magicfolder.duplicates()}?page=${pageFromUrl - 1}`}
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
                    href={pageFromUrl >= totalPages ? undefined : `${routes.ui.magicfolder.duplicates()}?page=${pageFromUrl + 1}`}
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
