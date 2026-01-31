import { Suspense } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"

import { RegisterClient } from "./ui"

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex w-full max-w-sm flex-col gap-6 px-6 py-16">
          <Card size="sm">
            <CardContent className="flex items-center gap-2">
              <Spinner className="size-4" />
              <span className="text-muted-foreground text-sm">Loading…</span>
            </CardContent>
          </Card>
        </div>
      }
    >
      <RegisterClient />
    </Suspense>
  )
}
