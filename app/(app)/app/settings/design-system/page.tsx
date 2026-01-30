"use client"

import { useEffect } from "react"
import { useDesignSystemStore } from "@/lib/client/store/design-system"
import { CustomizerPanel } from "./_components/customizer-panel"
import { PreviewPlayground } from "./_components/preview-playground"
import { LiveCssPreview } from "./_components/live-css-preview"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * Design System Settings Page
 *
 * Tenant-scoped theming playground with live preview.
 * Based on shadcn/ui's create implementation (MIT licensed).
 */
export default function DesignSystemPage() {
  const { fetchSettings, isLoading, error } = useDesignSystemStore()

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  if (isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
          <div className="grid gap-4">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
        <Skeleton className="h-[500px]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-destructive">Failed to load design system settings</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <LiveCssPreview />
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <PreviewPlayground />
        <CustomizerPanel />
      </div>
    </>
  )
}
