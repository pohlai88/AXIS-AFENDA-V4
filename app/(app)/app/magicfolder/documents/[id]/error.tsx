/**
 * @domain magicfolder
 * @layer ui
 * @responsibility Error state for document detail page
 */

"use client"

import { useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { routes } from "@/lib/routes"

export default function DocumentDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Document detail error:', error)
  }, [error])

  return (
    <div className="h-full flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <AlertTriangle className="h-16 w-16 text-destructive" />
          <h2 className="text-2xl font-bold text-center">Failed to Load Document</h2>
          <p className="text-muted-foreground text-center">
            {error.message || "An error occurred while loading the document. Please try again."}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link href={routes.ui.magicfolder.landing()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Documents
              </Link>
            </Button>
            <Button onClick={reset}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
