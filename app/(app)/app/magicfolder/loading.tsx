/**
 * Loading UI for MagicFolder segment (Next.js Suspense boundary).
 * Shown while child segment (page or nested layout) is loading.
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/loading
 */

import { Skeleton } from "@/components/ui/skeleton"

export default function MagicFolderLoading() {
  return (
    <div className="space-y-6" data-slot="magicfolder-loading">
      <div className="space-y-1">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-12 w-full max-w-md" />
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  )
}
