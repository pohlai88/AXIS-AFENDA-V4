"use client"

import { useEffect } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircleIcon } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Something went wrong</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Unhandled error</AlertTitle>
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
