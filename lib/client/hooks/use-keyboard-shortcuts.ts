/**
 * @domain magicfolder
 * @layer client-hooks
 * @responsibility Keyboard shortcuts for MagicFolder navigation and actions
 */

"use client"

import { useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { routes } from "@/lib/routes"

export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  metaKey?: boolean
  description: string
  action: () => void
}

export interface UseKeyboardShortcutsOptions {
  onViewModeChange?: (mode: "cards" | "table" | "board" | "timeline" | "relationship") => void
  onRefresh?: () => void
  onSearch?: () => void
  onFilter?: () => void
  onUpload?: () => void
  onSelectAll?: () => void
  onClearSelection?: () => void
  enabled?: boolean
}

/**
 * Hook for MagicFolder keyboard shortcuts
 * 
 * Shortcuts:
 * - Ctrl/Cmd + K: Search
 * - Ctrl/Cmd + U: Upload
 * - Ctrl/Cmd + R: Refresh
 * - Ctrl/Cmd + F: Toggle filters
 * - Ctrl/Cmd + A: Select all
 * - Escape: Clear selection
 * - 1-5: Switch view modes (cards, table, board, timeline, relationship)
 * - G + H: Go to home
 * - G + I: Go to inbox
 * - G + S: Go to settings
 */
export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const {
    onViewModeChange,
    onRefresh,
    onSearch,
    onFilter,
    onUpload,
    onSelectAll,
    onClearSelection,
    enabled = true,
  } = options

  const router = useRouter()

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        // Allow Escape to work everywhere
        if (event.key !== "Escape") return
      }

      const isMac = typeof navigator !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0
      const modKey = isMac ? event.metaKey : event.ctrlKey

      // Ctrl/Cmd + K: Search
      if (modKey && event.key === "k") {
        event.preventDefault()
        if (onSearch) {
          onSearch()
        } else {
          router.push(routes.ui.magicfolder.search())
        }
        return
      }

      // Ctrl/Cmd + U: Upload
      if (modKey && event.key === "u") {
        event.preventDefault()
        onUpload?.()
        return
      }

      // Ctrl/Cmd + R: Refresh
      if (modKey && event.key === "r") {
        event.preventDefault()
        onRefresh?.()
        return
      }

      // Ctrl/Cmd + F: Toggle filters
      if (modKey && event.key === "f") {
        event.preventDefault()
        onFilter?.()
        return
      }

      // Ctrl/Cmd + A: Select all
      if (modKey && event.key === "a") {
        event.preventDefault()
        onSelectAll?.()
        return
      }

      // Escape: Clear selection
      if (event.key === "Escape") {
        event.preventDefault()
        onClearSelection?.()
        return
      }

      // View mode shortcuts (no modifier)
      if (!modKey && !event.shiftKey && !event.altKey) {
        switch (event.key) {
          case "1":
            event.preventDefault()
            onViewModeChange?.("cards")
            break
          case "2":
            event.preventDefault()
            onViewModeChange?.("table")
            break
          case "3":
            event.preventDefault()
            onViewModeChange?.("board")
            break
          case "4":
            event.preventDefault()
            onViewModeChange?.("timeline")
            break
          case "5":
            event.preventDefault()
            onViewModeChange?.("relationship")
            break
        }
      }

      // G + X navigation shortcuts (vim-style)
      if (event.key === "g") {
        const handleSecondKey = (e: KeyboardEvent) => {
          switch (e.key) {
            case "h":
              router.push(routes.ui.magicfolder.root())
              break
            case "i":
              router.push(routes.ui.magicfolder.inbox())
              break
            case "s":
              router.push(routes.ui.magicfolder.settings())
              break
            case "d":
              router.push(routes.ui.magicfolder.duplicates())
              break
            case "u":
              router.push(routes.ui.magicfolder.unsorted())
              break
            case "c":
              router.push(routes.ui.magicfolder.collections())
              break
          }
          window.removeEventListener("keydown", handleSecondKey)
        }

        window.addEventListener("keydown", handleSecondKey, { once: true })

        // Remove listener after 1 second if no second key pressed
        setTimeout(() => {
          window.removeEventListener("keydown", handleSecondKey)
        }, 1000)
      }
    },
    [
      onViewModeChange,
      onRefresh,
      onSearch,
      onFilter,
      onUpload,
      onSelectAll,
      onClearSelection,
      router,
    ]
  )

  useEffect(() => {
    if (!enabled) return

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [enabled, handleKeyDown])
}

/**
 * Get list of all available keyboard shortcuts for display
 */
export function getKeyboardShortcutList(): Array<{
  category: string
  shortcuts: Array<{ keys: string; description: string }>
}> {
  const isMac = typeof navigator !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0
  const modKey = isMac ? "⌘" : "Ctrl"

  return [
    {
      category: "General",
      shortcuts: [
        { keys: `${modKey} + K`, description: "Open search" },
        { keys: `${modKey} + U`, description: "Upload document" },
        { keys: `${modKey} + R`, description: "Refresh documents" },
        { keys: `${modKey} + F`, description: "Toggle filters" },
        { keys: "Escape", description: "Clear selection" },
      ],
    },
    {
      category: "Selection",
      shortcuts: [
        { keys: `${modKey} + A`, description: "Select all" },
        { keys: "Escape", description: "Clear selection" },
      ],
    },
    {
      category: "View Modes",
      shortcuts: [
        { keys: "1", description: "Cards view" },
        { keys: "2", description: "Table view" },
        { keys: "3", description: "Board view" },
        { keys: "4", description: "Timeline view" },
        { keys: "5", description: "Relationship view" },
      ],
    },
    {
      category: "Navigation",
      shortcuts: [
        { keys: "G + H", description: "Go to home" },
        { keys: "G + I", description: "Go to inbox" },
        { keys: "G + S", description: "Go to settings" },
        { keys: "G + D", description: "Go to duplicates" },
        { keys: "G + U", description: "Go to unsorted" },
        { keys: "G + C", description: "Go to collections" },
      ],
    },
  ]
}
