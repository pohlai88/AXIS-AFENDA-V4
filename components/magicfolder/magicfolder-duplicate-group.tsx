/**
 * @domain magicfolder
 * @layer ui
 * @responsibility Duplicate group card: versions list + Keep Best / Keep this
 */

"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, XCircle } from "lucide-react"

export type VersionInGroup = {
  versionId: string
  objectId: string
  title: string | null
  mimeType: string
  sizeBytes: number
  sha256: string
  versionCreatedAt: string
}

export type DuplicateGroupProps = {
  id: string
  reason: string
  keepVersionId: string | null
  versions: VersionInGroup[]
  chosenKeepVersionId?: string | null
  suggestedBestVersionId: string
  isKeeping: boolean
  isDismissing?: boolean
  onKeepBest: (groupId: string, versionId: string) => void
  onDismiss?: (groupId: string) => void
}

/** Keep Best heuristic: prefer PDF, then higher size, then newest */
export function pickBestVersionId(versions: VersionInGroup[]): string {
  if (versions.length === 0) return ""
  const sorted = [...versions].sort((a, b) => {
    const pdfA = a.mimeType === "application/pdf" ? 1 : 0
    const pdfB = b.mimeType === "application/pdf" ? 1 : 0
    if (pdfB !== pdfA) return pdfB - pdfA
    if (b.sizeBytes !== a.sizeBytes) return b.sizeBytes - a.sizeBytes
    return new Date(b.versionCreatedAt).getTime() - new Date(a.versionCreatedAt).getTime()
  })
  return sorted[0]!.versionId
}

export function DuplicateGroup({
  id,
  reason,
  keepVersionId,
  versions,
  chosenKeepVersionId,
  suggestedBestVersionId,
  isKeeping,
  isDismissing,
  onKeepBest,
  onDismiss,
}: DuplicateGroupProps) {
  const effectiveKept = keepVersionId ?? chosenKeepVersionId ?? null

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle className="text-base">Duplicate group ({reason})</CardTitle>
          <CardDescription>
            {versions.length} version(s) · Pick one as &quot;Keep Best&quot;
          </CardDescription>
        </div>
        {onDismiss && (
          <Button
            size="sm"
            variant="ghost"
            disabled={isKeeping || isDismissing}
            onClick={() => onDismiss(id)}
            className="shrink-0"
          >
            <XCircle className="mr-1 h-4 w-4" />
            Not duplicates
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="space-y-2">
          {versions.map((v) => (
            <li
              key={v.versionId}
              className="flex items-center justify-between rounded-md border p-2"
            >
              <div>
                <p className="font-medium">{v.title ?? "(untitled)"}</p>
                <p className="text-xs text-muted-foreground">
                  {v.mimeType} · {(v.sizeBytes / 1024).toFixed(1)} KB ·{" "}
                  {new Date(v.versionCreatedAt).toLocaleDateString()}
                </p>
              </div>
              <Button
                size="sm"
                variant={v.versionId === effectiveKept ? "secondary" : "outline"}
                disabled={isKeeping}
                onClick={() => onKeepBest(id, v.versionId)}
              >
                {v.versionId === keepVersionId ? (
                  <>
                    <Check className="mr-1 h-4 w-4" />
                    Kept
                  </>
                ) : v.versionId === suggestedBestVersionId ? (
                  "Keep Best"
                ) : (
                  "Keep this"
                )}
              </Button>
            </li>
          ))}
        </ul>
        {!keepVersionId && (
          <p className="text-xs text-muted-foreground">
            Suggested: &quot;Keep Best&quot; prefers PDF, higher size, newest.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
