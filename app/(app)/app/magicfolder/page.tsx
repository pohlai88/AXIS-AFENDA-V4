/**
 * @domain magicfolder
 * @layer ui
 * @responsibility MagicFolder landing: summary (Inbox, Duplicates) + quick links
 * Composes blocks only: MagicfolderPageHeader, MagicfolderSection, MagicfolderStatCard,
 * MagicfolderNavLinks, MagicfolderLoading, MagicfolderUploadDialog, Button.
 */

"use client"

import { useEffect, useState } from "react"

import { routes } from "@/lib/routes"
import { Button } from "@/components/ui/button"
import { Copy, Inbox, Upload } from "lucide-react"

import {
  MagicfolderPageHeader,
  MagicfolderSection,
  MagicfolderLoading,
  MagicfolderNavLinks,
  MagicfolderUploadDialog,
  MagicfolderStatCard,
} from "@/components/magicfolder"

type Counts = { inbox: number; duplicates: number }

const NAV_ITEMS = [
  { href: routes.ui.magicfolder.inbox(), label: "Inbox" },
  { href: routes.ui.magicfolder.duplicates(), label: "Duplicates" },
  { href: routes.ui.magicfolder.unsorted(), label: "Unsorted" },
  { href: routes.ui.magicfolder.search(), label: "Search" },
  { href: routes.ui.magicfolder.collections(), label: "Collections" },
  { href: routes.ui.magicfolder.audit(), label: "Hash audit" },
] as const

export default function MagicFolderLandingPage() {
  const [counts, setCounts] = useState<Counts | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetch(`${routes.api.v1.magicfolder.list()}?status=inbox&limit=1&offset=0`, {
        credentials: "include",
      }).then((r) => r.json()),
      fetch(`${routes.api.v1.magicfolder.duplicateGroups()}?limit=1&offset=0`, {
        credentials: "include",
      }).then((r) => r.json()),
    ])
      .then(([listRes, groupsRes]) => {
        if (cancelled) return
        const list = listRes as { data?: { total: number }; error?: unknown }
        const groups = groupsRes as { data?: { total: number }; error?: unknown }
        setCounts({
          inbox: list.data?.total ?? 0,
          duplicates: groups.data?.total ?? 0,
        })
      })
      .catch(() => {
        if (!cancelled) setCounts({ inbox: 0, duplicates: 0 })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <MagicfolderSection layout="stack" className="space-y-6">
      <MagicfolderPageHeader
        title="MagicFolder"
        description="Document inbox, duplicates, and search"
        actions={
          <MagicfolderUploadDialog
            trigger={
              <Button size="sm">
                <Upload className="mr-1 h-4 w-4" />
                Upload
              </Button>
            }
          />
        }
      />

      {loading && <MagicfolderLoading />}

      {!loading && counts !== null && (
        <MagicfolderSection layout="grid">
          <MagicfolderStatCard
            title="Inbox"
            value={counts.inbox}
            description="Documents awaiting review"
            href={routes.ui.magicfolder.inbox()}
            icon={<Inbox />}
          />
          <MagicfolderStatCard
            title="Duplicates"
            value={counts.duplicates}
            description="Exact duplicate groups — pick best"
            href={routes.ui.magicfolder.duplicates()}
            icon={<Copy />}
          />
        </MagicfolderSection>
      )}

      <MagicfolderNavLinks items={NAV_ITEMS} />
    </MagicfolderSection>
  )
}
