"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircleIcon } from "lucide-react"

export default function Error({ error }: { error: Error & { digest?: string } }) {
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
      </CardContent>
    </Card>
  )
}

