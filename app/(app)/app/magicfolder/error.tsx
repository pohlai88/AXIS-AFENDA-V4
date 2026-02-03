"use client"

/**
 * Error boundary for MagicFolder segment.
 * Catches errors in magicfolder routes and shows recovery UI.
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/error
 */

import { useEffect } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircleIcon } from "lucide-react"

export default function MagicFolderError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[MagicFolder]", error)
  }, [error])

  return (
    <Card data-slot="magicfolder-error">
      <CardHeader className="border-b">
        <CardTitle>MagicFolder error</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
        {error.digest ? (
          <p className="text-muted-foreground text-xs">Digest: {error.digest}</p>
        ) : null}
        <Button onClick={() => reset()} variant="outline">
          Try again
        </Button>
      </CardContent>
    </Card>
  )
}
