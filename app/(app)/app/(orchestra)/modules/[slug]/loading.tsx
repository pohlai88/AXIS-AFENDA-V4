/**
 * Loading state for module embed page
 * Shows skeleton while async data is being fetched
 */

import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function ModuleLoading() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      <Card className="py-0">
        <CardContent className="px-0 py-0">
          <Skeleton className="h-[75dvh] w-full rounded-2xl" />
        </CardContent>
      </Card>
    </div>
  )
}
