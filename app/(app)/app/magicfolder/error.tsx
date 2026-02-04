/**
 * @domain magicfolder
 * @layer ui
 * @responsibility Error state for main MagicFolder page
 */

"use client"

import { useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function MagicFolderError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('MagicFolder error:', error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="max-w-md w-full">
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <AlertTriangle className="h-16 w-16 text-destructive" />
          <h2 className="text-2xl font-bold text-center">Something Went Wrong</h2>
          <p className="text-muted-foreground text-center">
            {error.message || "An error occurred while loading your documents. Please try again."}
          </p>
          <Button onClick={reset}>Try Again</Button>
        </CardContent>
      </Card>
    </div>
  )
}
