/**
 * @domain magicfolder
 * @layer ui
 * @responsibility Document detail: metadata, versions, tags, extracted text, approve
 */

"use client"

import { useCallback, useEffect, useState } from "react"

import { routes } from "@/lib/routes"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FileText, AlertCircle, ArrowLeft, Tag, Download, Plus, X, FileImage } from "lucide-react"
import Link from "next/link"

import {
  MagicfolderPageHeader,
  MagicfolderSection,
  MagicfolderLoading,
  MagicfolderMetadataRow,
  MagicfolderHelperText,
} from "@/components/magicfolder"

type Version = {
  id: string
  versionNo: number
  mimeType: string
  sizeBytes: number
  sha256: string
  createdAt: string
}

type TagRow = {
  id: string
  name: string
  slug: string
}

type DocDetail = {
  id: string
  tenantId: string
  ownerId: string
  title: string | null
  docType: string
  status: string
  currentVersionId: string | null
  deletedAt: string | null
  archivedAt: string | null
  createdAt: string
  updatedAt: string
  version?: Version
  versions: Version[]
  tags: TagRow[]
  extractedText: string | null
  extractedFields: Record<string, unknown>
}

type DetailResponse = {
  data: DocDetail | null
  error: { code: string; message: string } | null
}

export default function MagicFolderDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [id, setId] = useState<string | null>(null)
  const [doc, setDoc] = useState<DocDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [thumbUrl, setThumbUrl] = useState<string | null>(null)
  const [thumbLoading, setThumbLoading] = useState(false)
  const [tagsList, setTagsList] = useState<TagRow[]>([])
  const [tagLoading, setTagLoading] = useState(false)
  const [ownerLabel, setOwnerLabel] = useState<string | null>(null)

  useEffect(() => {
    params.then((p) => setId(p.id))
  }, [params])

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    fetch(routes.api.v1.magicfolder.objectById(id), { credentials: "include" })
      .then((r) => r.json() as Promise<DetailResponse>)
      .then((res) => {
        if (res.error) {
          setError(res.error.message)
          return
        }
        if (res.data) setDoc(res.data)
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load")
      })
      .finally(() => setLoading(false))
  }, [id])

  // Resolve ownerId to display name when auth user API is available
  useEffect(() => {
    if (!doc?.ownerId) {
      setOwnerLabel(null)
      return
    }
    let cancelled = false
    fetch(routes.api.v1.auth.users.byId(doc.ownerId), { credentials: "include" })
      .then((r) => r.json() as Promise<{ data?: { email?: string | null }; error?: unknown }>)
      .then((res) => {
        if (cancelled) return
        if (res.data?.email) {
          setOwnerLabel(res.data.email)
        } else {
          setOwnerLabel(doc.ownerId)
        }
      })
      .catch(() => {
        if (!cancelled) setOwnerLabel(doc.ownerId)
      })
    return () => {
      cancelled = true
    }
  }, [doc?.ownerId])

  const loadThumb = useCallback(() => {
    if (!id) return
    setThumbLoading(true)
    fetch(routes.api.v1.magicfolder.objectThumbUrl(id, 1), { credentials: "include" })
      .then((r) => r.json() as Promise<{ data?: { url: string }; error?: { message: string } }>)
      .then((res) => {
        if (!res.error && res.data?.url) setThumbUrl(res.data.url)
      })
      .finally(() => setThumbLoading(false))
  }, [id])

  useEffect(() => {
    if (id && doc?.currentVersionId) loadThumb()
  }, [id, doc?.currentVersionId, loadThumb])

  const approve = useCallback(() => {
    if (!id) return
    fetch(routes.api.v1.magicfolder.objectById(id), {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "active" }),
    })
      .then((r) => r.json())
      .then((res: { data?: { ok?: boolean }; error?: { message: string } }) => {
        if (res.error) return
        if (res.data?.ok === true) setDoc((d) => (d ? { ...d, status: "active" } : null))
      })
  }, [id])

  const downloadSource = useCallback(() => {
    if (!id) return
    setDownloading(true)
    fetch(routes.api.v1.magicfolder.objectSourceUrl(id), { credentials: "include" })
      .then((r) => r.json() as Promise<{ data?: { url: string }; error?: { message: string } }>)
      .then((res) => {
        if (res.error || !res.data?.url) return
        window.open(res.data.url, "_blank", "noopener,noreferrer")
      })
      .finally(() => setDownloading(false))
  }, [id])

  const openPreview = useCallback(() => {
    if (!id) return
    setPreviewLoading(true)
    fetch(routes.api.v1.magicfolder.objectPreviewUrl(id), { credentials: "include" })
      .then((r) => r.json() as Promise<{ data?: { url: string }; error?: { message: string } }>)
      .then((res) => {
        if (res.error || !res.data?.url) return
        window.open(res.data.url, "_blank", "noopener,noreferrer")
      })
      .finally(() => setPreviewLoading(false))
  }, [id])

  const refreshDoc = useCallback(() => {
    if (!id) return
    fetch(routes.api.v1.magicfolder.objectById(id), { credentials: "include" })
      .then((r) => r.json() as Promise<DetailResponse>)
      .then((res) => {
        if (res.data) setDoc(res.data)
      })
  }, [id])

  const fetchTagsForPicker = useCallback(() => {
    setTagLoading(true)
    fetch(routes.api.v1.magicfolder.tags(), { credentials: "include" })
      .then((r) => r.json() as Promise<{ data?: { items: TagRow[] }; error?: { message: string } }>)
      .then((res) => {
        if (res.data?.items) setTagsList(res.data.items)
      })
      .finally(() => setTagLoading(false))
  }, [])

  const addTag = useCallback(
    (tagId: string) => {
      if (!id) return
      fetch(routes.api.v1.magicfolder.objectTags(id), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagId }),
      })
        .then((r) => r.json())
        .then((res: { error?: { message: string } }) => {
          if (!res.error) refreshDoc()
        })
    },
    [id, refreshDoc]
  )

  const removeTag = useCallback(
    (tagId: string) => {
      if (!id) return
      fetch(`${routes.api.v1.magicfolder.objectTags(id)}?tagId=${encodeURIComponent(tagId)}`, {
        method: "DELETE",
        credentials: "include",
      })
        .then((r) => r.json())
        .then((res: { error?: { message: string } }) => {
          if (!res.error) refreshDoc()
        })
    },
    [id, refreshDoc]
  )

  if (!id) return null

  return (
    <MagicfolderSection layout="stack" className="space-y-6">
      <MagicfolderPageHeader
        title="Document"
        description="Metadata and versions"
        actions={
          <Link
            href={routes.ui.magicfolder.inbox()}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Back to Inbox"
          >
            <ArrowLeft className="h-5 w-5" />
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

      {!loading && doc && (
        <>
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {doc.title ?? "(untitled)"}
                </CardTitle>
                <CardDescription>ID: {doc.id}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {doc.currentVersionId && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={downloadSource}
                      disabled={downloading}
                    >
                      <Download className="h-4 w-4" />
                      {downloading ? "…" : "Download / View source"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={openPreview}
                      disabled={previewLoading}
                    >
                      <FileImage className="h-4 w-4" />
                      {previewLoading ? "…" : "Preview"}
                    </Button>
                  </>
                )}
                {doc.status === "inbox" && (
                  <Button size="sm" onClick={approve}>
                    Approve (move to Active)
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <MagicfolderMetadataRow label="Type" value={doc.docType} />
              <MagicfolderMetadataRow label="Status" value={doc.status} />
              <MagicfolderMetadataRow
                label="Owner"
                value={ownerLabel ?? (doc.ownerId ? `${doc.ownerId.slice(0, 8)}…` : "—")}
              />
              <MagicfolderMetadataRow
                label="Created"
                value={new Date(doc.createdAt).toLocaleString()}
              />
              <MagicfolderMetadataRow
                label="Updated"
                value={new Date(doc.updatedAt).toLocaleString()}
              />
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" /> Tags:
                </span>
                {doc.tags?.map((t) => (
                  <span
                    key={t.id}
                    className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs"
                  >
                    {t.name}
                    <button
                      type="button"
                      aria-label={`Remove tag ${t.name}`}
                      className="hover:bg-muted-foreground/20 rounded p-0.5"
                      onClick={() => removeTag(t.id)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 gap-1 px-2 text-xs"
                      disabled={tagLoading}
                      onClick={fetchTagsForPicker}
                    >
                      <Plus className="h-3 w-3" />
                      Add tag
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {tagsList
                      .filter((t) => !doc.tags?.some((dt) => dt.id === t.id))
                      .map((t) => (
                        <DropdownMenuItem key={t.id} onClick={() => addTag(t.id)}>
                          {t.name}
                        </DropdownMenuItem>
                      ))}
                    {tagsList.length === 0 && !tagLoading && (
                      <DropdownMenuItem disabled>No tags</DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {doc.version && (
                <MagicfolderMetadataRow
                  label="Current version"
                  value={`v${doc.version.versionNo} · ${doc.version.mimeType} · ${(doc.version.sizeBytes / 1024).toFixed(1)} KB`}
                />
              )}
              {thumbUrl && (
                <div className="mt-2">
                  <span className="text-muted-foreground text-xs">Thumbnail:</span>
                  <img src={thumbUrl} alt="Thumbnail" className="mt-1 max-h-32 rounded border object-contain" />
                </div>
              )}
              {thumbLoading && !thumbUrl && (
                <MagicfolderHelperText className="text-xs">Loading thumbnail…</MagicfolderHelperText>
              )}
              {Array.isArray(doc.extractedFields?.suggestedTags) &&
                (doc.extractedFields.suggestedTags as string[]).length > 0 && (
                  <MagicfolderHelperText className="text-xs">
                    Auto-applied from text: {(doc.extractedFields.suggestedTags as string[]).join(", ")}
                  </MagicfolderHelperText>
                )}
            </CardContent>
          </Card>

          {doc.extractedText != null && doc.extractedText.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Extracted text</CardTitle>
                <CardDescription>{doc.extractedText.length} characters</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap break-words rounded border bg-muted/30 p-3 text-xs max-h-64 overflow-auto">
                  {doc.extractedText}
                </pre>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Versions</CardTitle>
              <CardDescription>{doc.versions.length} version(s)</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border">
                {doc.versions.map((v) => (
                  <li key={v.id} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                    <span>v{v.versionNo} · {v.mimeType} · {(v.sizeBytes / 1024).toFixed(1)} KB</span>
                    <span className="text-muted-foreground text-xs">
                      {new Date(v.createdAt).toLocaleDateString()}
                      {doc.currentVersionId === v.id && " (current)"}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </>
      )}
    </MagicfolderSection>
  )
}
