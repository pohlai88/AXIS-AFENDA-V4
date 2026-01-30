"use client"

import * as React from "react"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiFetch } from "@/lib/api/client"
import { endpoints } from "@/lib/api/endpoints"

const ApprovalSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  title: z.string(),
  status: z.string(),
  createdAt: z.string().or(z.date()).optional(),
})

const ApprovalListSchema = z.array(ApprovalSchema)

export function ApprovalsClient() {
  const [items, setItems] = React.useState<z.infer<typeof ApprovalListSchema>>([])
  const [title, setTitle] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const refresh = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetch(endpoints.approvals.list(), { method: "GET" }, ApprovalListSchema)
      setItems(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load approvals")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    refresh()
  }, [refresh])

  async function create() {
    if (!title.trim()) return
    setLoading(true)
    setError(null)
    try {
      await apiFetch(
        endpoints.approvals.list(),
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ title }),
        },
        ApprovalSchema
      )
      setTitle("")
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create approval")
      setLoading(false)
    }
  }

  async function setStatus(id: string, status: "approved" | "rejected") {
    setLoading(true)
    setError(null)
    try {
      await apiFetch(
        endpoints.approvals.byId(id),
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ status }),
        },
        ApprovalSchema
      )
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update approval")
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Approvals</h1>
        <p className="text-muted-foreground">
          MVP vertical slice: create → approve/reject → audit later.
        </p>
      </div>

      <div className="rounded-xl border p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Escalate customer request to CEO"
            />
          </div>
          <Button onClick={create} disabled={loading || !title.trim()}>
            Create
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="rounded-xl border">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div className="font-medium">Approvals</div>
          <Button variant="outline" onClick={refresh} disabled={loading}>
            Refresh
          </Button>
        </div>
        <div className="divide-y">
          {items.length === 0 ? (
            <div className="text-muted-foreground px-5 py-6 text-sm">
              No approvals yet.
            </div>
          ) : (
            items.map((a) => (
              <div
                key={a.id}
                className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{a.title}</div>
                  <div className="text-muted-foreground mt-1 text-xs">
                    {a.id} · {a.status}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={loading}
                    onClick={() => setStatus(a.id, "approved")}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={loading}
                    onClick={() => setStatus(a.id, "rejected")}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

