/**
 * @domain magicfolder
 * @layer page
 * @responsibility MagicFolder settings and configuration page
 */

import { Suspense } from "react"
import { MagicFolderSettings } from "./_components/settings-form"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata = {
  title: "Settings | MagicFolder",
  description: "Configure your MagicFolder preferences",
}

export default function SettingsPage() {
  return (
    <div className="container max-w-4xl py-6">
      <Suspense fallback={<SettingsLoadingSkeleton />}>
        <MagicFolderSettings />
      </Suspense>
    </div>
  )
}

function SettingsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  )
}
