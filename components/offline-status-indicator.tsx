"use client"

/**
 * Offline status indicator - shows connection and sync status
 */

import { useEffect, useState } from "react"
import { offlineManager } from "@/lib/client/offline/offline-manager"
import { OFFLINE_STATUS } from "@/lib/constants"
import type { OfflineState } from "@/lib/client/offline/offline-manager"

export function OfflineStatusIndicator() {
  const [state, setState] = useState<OfflineState>({
    status: "online",
    pendingCount: 0,
    conflictCount: 0,
  })

  useEffect(() => {
    // Get initial state
    offlineManager.getState().then(state => {
      setState({
        status: state.status as "online" | "offline" | "syncing" | "sync_error",
        pendingCount: state.pendingCount,
        conflictCount: state.conflictCount,
      })
    })

    // Listen for status changes
    const handleStatusChange = (event: CustomEvent<{ status: "online" | "offline" | "syncing" | "sync_error" }>) => {
      setState(prev => ({ ...prev, status: event.detail.status }))
    }

    const handleSyncComplete = () => {
      offlineManager.getState().then(state => {
        setState({
          status: state.status as "online" | "offline" | "syncing" | "sync_error",
          pendingCount: state.pendingCount,
          conflictCount: state.conflictCount,
        })
      })
    }

    const handleSyncFailed = () => {
      offlineManager.getState().then(state => {
        setState({
          status: state.status as "online" | "offline" | "syncing" | "sync_error",
          pendingCount: state.pendingCount,
          conflictCount: state.conflictCount,
        })
      })
    }

    const handleConflictDetected = () => {
      offlineManager.getState().then(state => {
        setState({
          status: state.status as "online" | "offline" | "syncing" | "sync_error",
          pendingCount: state.pendingCount,
          conflictCount: state.conflictCount,
        })
      })
    }

    // Update state periodically
    const interval = setInterval(() => {
      offlineManager.getState().then(state => {
        setState({
          status: state.status as "online" | "offline" | "syncing" | "sync_error",
          pendingCount: state.pendingCount,
          conflictCount: state.conflictCount,
        })
      })
    }, 5000)

    window.addEventListener("offline:status-changed", handleStatusChange as EventListener)
    window.addEventListener("offline:sync-completed", handleSyncComplete as EventListener)
    window.addEventListener("offline:sync-failed", handleSyncFailed as EventListener)
    window.addEventListener("offline:conflict-detected", handleConflictDetected as EventListener)

    return () => {
      clearInterval(interval)
      window.removeEventListener("offline:status-changed", handleStatusChange as EventListener)
      window.removeEventListener("offline:sync-completed", handleSyncComplete as EventListener)
      window.removeEventListener("offline:sync-failed", handleSyncFailed as EventListener)
      window.removeEventListener("offline:conflict-detected", handleConflictDetected as EventListener)
    }
  }, [])

  const getStatusColor = () => {
    switch (state.status) {
      case "online":
        return "bg-green-500"
      case "offline":
        return "bg-red-500"
      case "syncing":
        return "bg-blue-500 animate-pulse"
      case "sync_error":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = () => {
    switch (state.status) {
      case "online":
        return state.pendingCount > 0 ? "Syncing..." : "Online"
      case "offline":
        return "Offline"
      case "syncing":
        return "Syncing..."
      case "sync_error":
        return "Sync Error"
      default:
        return "Unknown"
    }
  }

  const showPendingIndicator = state.pendingCount > 0 || state.conflictCount > 0

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 min-w-[200px]">
        <div className="flex items-center space-x-3">
          {/* Status dot */}
          <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />

          {/* Status text */}
          <span className="text-sm font-medium text-gray-900">
            {getStatusText()}
          </span>
        </div>

        {/* Pending items indicator */}
        {showPendingIndicator && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            {state.pendingCount > 0 && (
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>Pending changes</span>
                <span className="font-medium">{state.pendingCount}</span>
              </div>
            )}
            {state.conflictCount > 0 && (
              <div className="flex items-center justify-between text-xs text-red-600 mt-1">
                <span>Conflicts</span>
                <span className="font-medium">{state.conflictCount}</span>
              </div>
            )}
          </div>
        )}

        {/* Last sync time */}
        {state.lastSyncAt && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              Last sync: {formatRelativeTime(state.lastSyncAt)}
            </div>
          </div>
        )}

        {/* Action buttons */}
        {state.status === OFFLINE_STATUS.SYNC_ERROR && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <button
              onClick={() => offlineManager.syncAll()}
              className="w-full text-xs bg-blue-600 text-white rounded px-2 py-1 hover:bg-blue-700 transition-colors"
            >
              Retry Sync
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) {
    return "Just now"
  } else if (diffMins < 60) {
    return `${diffMins}m ago`
  } else if (diffMins < 1440) {
    return `${Math.floor(diffMins / 60)}h ago`
  } else {
    return `${Math.floor(diffMins / 1440)}d ago`
  }
}
