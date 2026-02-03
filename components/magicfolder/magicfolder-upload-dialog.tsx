/**
 * @domain magicfolder
 * @layer ui
 * @responsibility Upload Dialog: file input, progress list, result summary (presign → PUT → ingest)
 * Built from shadcn Dialog, Button, Progress only. Uses magicfolder-upload store.
 */

"use client"

import { useCallback, useRef, useState } from "react"

import { routes } from "@/lib/routes"
import { sha256Hex } from "@/lib/shared/magicfolder/sha256"
import { ALLOWED_MIME_TYPES, MAX_FILE_BYTES } from "@/lib/constants/magicfolder"
import { useMagicfolderUploadStore } from "@/lib/client/store/magicfolder-upload"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Upload } from "lucide-react"

const ALLOWED_MIME_SET = new Set(ALLOWED_MIME_TYPES)

function isAllowedFile(file: File): boolean {
  return ALLOWED_MIME_SET.has(file.type as (typeof ALLOWED_MIME_TYPES)[number]) && file.size <= MAX_FILE_BYTES
}

export type MagicfolderUploadDialogProps = {
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function MagicfolderUploadDialog({
  trigger,
  open: controlledOpen,
  onOpenChange,
}: MagicfolderUploadDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen
  const inputRef = useRef<HTMLInputElement>(null)

  const { items, add, update, clearCompleted, clearAll } = useMagicfolderUploadStore()

  const runIngest = useCallback(
    async (itemId: string, serverUploadId: string) => {
      try {
        update(itemId, { status: "ingesting", progress: 90 })
        const res = await fetch(routes.api.v1.magicfolder.ingest(), {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uploadId: serverUploadId }),
        })
        const json = (await res.json()) as {
          data?: { objectId: string; versionId: string; duplicateGroupId?: string | null }
          error?: { message: string }
        }
        if (json.error) {
          update(itemId, { status: "failed", progress: 100, error: json.error.message })
          return
        }
        update(itemId, {
          status: "done",
          progress: 100,
          objectId: json.data?.objectId,
          versionId: json.data?.versionId,
        })
      } catch (e) {
        update(itemId, {
          status: "failed",
          progress: 100,
          error: e instanceof Error ? e.message : "Ingest failed",
        })
      }
    },
    [update]
  )

  const uploadOne = useCallback(
    async (id: string) => {
      const item = items.find((i) => i.id === id)
      if (!item) return

      try {
        update(id, { status: "hashing", progress: 0 })
        const sha256 = await sha256Hex(item.file)
        update(id, { status: "presigning", progress: 10 })

        const presignRes = await fetch(routes.api.v1.magicfolder.presign(), {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: item.filename,
            mimeType: item.mimeType,
            sizeBytes: item.sizeBytes,
            sha256,
          }),
        })
        const presignJson = (await presignRes.json()) as {
          data?: { uploadId: string; url: string }
          error?: { message: string }
        }
        if (presignJson.error || !presignJson.data?.url) {
          update(id, {
            status: "failed",
            progress: 100,
            error: presignJson.error?.message ?? "Presign failed",
          })
          return
        }
        update(id, {
          status: "uploading",
          progress: 20,
          uploadId: presignJson.data.uploadId,
        })

        const putRes = await fetch(presignJson.data.url, {
          method: "PUT",
          body: item.file,
          headers: { "Content-Type": item.mimeType },
        })
        if (!putRes.ok) {
          update(id, { status: "failed", progress: 100, error: `Upload failed: ${putRes.status}` })
          return
        }
        update(id, { progress: 80 })

        await runIngest(id, presignJson.data.uploadId)
      } catch (e) {
        update(id, {
          status: "failed",
          progress: 100,
          error: e instanceof Error ? e.message : "Upload failed",
        })
      }
    },
    [items, update, runIngest]
  )

  const startUploads = useCallback(() => {
    const toRun = items.filter((i) => i.status !== "done" && i.status !== "failed")
    toRun.forEach((i) => uploadOne(i.id))
  }, [items, uploadOne])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files?.length) return
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (isAllowedFile(file)) add(file)
      }
      e.target.value = ""
    },
    [add]
  )

  const doneCount = items.filter((i) => i.status === "done").length
  const failedCount = items.filter((i) => i.status === "failed").length
  const duplicateCount = 0 // ingest response can include duplicateGroupId; we could tally if needed
  const summary =
    items.length > 0 && items.every((i) => i.status === "done" || i.status === "failed")
      ? `${doneCount} uploaded${failedCount > 0 ? ` · ${failedCount} failed` : ""}${duplicateCount > 0 ? ` · ${duplicateCount} duplicate found` : ""}`
      : null

  const triggerNode =
    trigger ?? (
      <Button size="sm" variant="outline">
        <Upload className="mr-1 h-4 w-4" />
        Upload
      </Button>
    )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{triggerNode}</DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload documents</DialogTitle>
          <DialogDescription>
            Select files (PDF, images). Max {MAX_FILE_BYTES / 1024 / 1024} MB per file.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <input
            ref={inputRef}
            type="file"
            accept={ALLOWED_MIME_TYPES.join(",")}
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            className="w-full"
          >
            Choose files
          </Button>
          {items.length > 0 && (
            <>
              <ul className="max-h-48 space-y-2 overflow-y-auto">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-col gap-1 rounded border p-2 text-sm"
                  >
                    <span className="truncate font-medium">{item.filename}</span>
                    <div className="flex items-center gap-2">
                      <Progress value={item.progress} className="h-2 flex-1" />
                      <span className="text-muted-foreground shrink-0">
                        {item.status === "done"
                          ? "Done"
                          : item.status === "failed"
                            ? "Failed"
                            : item.status === "ingesting"
                              ? "Processing…"
                              : item.status}
                      </span>
                    </div>
                    {item.error != null && (
                      <span className="text-destructive text-xs">{item.error}</span>
                    )}
                  </li>
                ))}
              </ul>
              {summary != null ? (
                <p className="text-sm font-medium text-muted-foreground">{summary}</p>
              ) : null}
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => clearAll()}>
            Clear all
          </Button>
          <Button
            onClick={startUploads}
            disabled={
              items.length === 0 ||
              items.every((i) => i.status === "done" || i.status === "failed")
            }
          >
            {items.some(
              (i) =>
                i.status === "hashing" ||
                i.status === "presigning" ||
                i.status === "uploading" ||
                i.status === "ingesting"
            )
              ? "Uploading…"
              : "Start upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
