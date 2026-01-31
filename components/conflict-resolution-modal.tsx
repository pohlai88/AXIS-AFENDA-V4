"use client"

/**
 * Conflict resolution modal - handles resolving sync conflicts
 */

import { useEffect, useState } from "react"
import { conflictResolver } from "@/lib/client/offline/conflict-resolver"
import type { SyncConflict as StorageSyncConflict } from "@/lib/client/offline/storage"
import type { SyncConflict } from "@/lib/client/offline/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

interface ConflictResolutionModalProps {
  isOpen: boolean
  onClose: () => void
  conflictId?: string
}

export function ConflictResolutionModal({
  isOpen,
  onClose,
  conflictId,
}: ConflictResolutionModalProps) {
  const [conflict, setConflict] = useState<StorageSyncConflict | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedStrategy, setSelectedStrategy] = useState<string>("merge")

  useEffect(() => {
    if (isOpen && conflictId) {
      fetchConflict(conflictId)
    }
  }, [isOpen, conflictId])

  const fetchConflict = async (id: string) => {
    try {
      const conflicts = await conflictResolver.getUnresolvedConflicts("") as StorageSyncConflict[]
      const found = conflicts.find(c => c.id === id)
      setConflict(found || null)
    } catch (error) {
      console.error("Failed to fetch conflict:", error)
    }
  }

  const handleResolve = async () => {
    if (!conflict) return

    setLoading(true)
    try {
      await conflictResolver.applyResolution(conflict.id!, {
        strategy: selectedStrategy as "SERVER_WINS" | "CLIENT_WINS" | "MERGE" | "MANUAL",
        resolvedData: selectedStrategy === "manual" ? conflict.clientData : undefined,
      })
      onClose()
    } catch (error) {
      console.error("Failed to resolve conflict:", error)
    } finally {
      setLoading(false)
    }
  }

  const renderConflictData = (data: Record<string, unknown> | null, title: string) => {
    if (!data) return null

    return (
      <div className="space-y-2">
        <h4 className="font-medium text-sm">{title}</h4>
        <div className="bg-gray-50 rounded p-3 text-sm">
          {Object.entries(data).map(([key, value]) => {
            if (key.startsWith("sync") || key === "clientGeneratedId") return null
            return (
              <div key={key} className="flex justify-between py-1">
                <span className="text-gray-600 capitalize">{key}:</span>
                <span className="font-medium">
                  {value instanceof Date ? value.toLocaleDateString() : String(value)}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (!conflict) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Resolve Sync Conflict</DialogTitle>
          <DialogDescription>
            There&apos;s a conflict between your offline changes and the server version.
            Please choose how to resolve it.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4">
            {/* Conflict details */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-yellow-800 border-yellow-300">
                  {conflict.entityType}
                </Badge>
                <span className="text-sm text-yellow-800">
                  Conflict detected on {conflict.createdAt.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Show both versions */}
            <div className="grid grid-cols-2 gap-4">
              {renderConflictData(conflict.clientData, "Your Changes")}
              {renderConflictData(conflict.serverData, "Server Version")}
            </div>

            {/* Resolution strategy */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Resolution Strategy</Label>
              <RadioGroup value={selectedStrategy} onValueChange={setSelectedStrategy}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="server_wins" id="server_wins" />
                  <Label htmlFor="server_wins">
                    <div>
                      <div className="font-medium">Use Server Version</div>
                      <div className="text-sm text-gray-500">
                        Discard your changes and keep the server version
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="client_wins" id="client_wins" />
                  <Label htmlFor="client_wins">
                    <div>
                      <div className="font-medium">Use Your Changes</div>
                      <div className="text-sm text-gray-500">
                        Overwrite the server with your offline changes
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="merge" id="merge" />
                  <Label htmlFor="merge">
                    <div>
                      <div className="font-medium">Auto-Merge</div>
                      <div className="text-sm text-gray-500">
                        Automatically merge non-conflicting changes
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="manual" id="manual" />
                  <Label htmlFor="manual">
                    <div>
                      <div className="font-medium">Manual Resolution</div>
                      <div className="text-sm text-gray-500">
                        Keep your changes for manual editing later
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleResolve} disabled={loading}>
            {loading ? "Resolving..." : "Resolve Conflict"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
