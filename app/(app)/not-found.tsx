import Link from "next/link"

import { Button } from "@/components/ui/button"
import { routes } from "@/lib/routes"

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground">
        The requested resource could not be found.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button asChild>
          <Link href={routes.ui.orchestra.root()}>Back to app</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={routes.ui.marketing.home()}>Home</Link>
        </Button>
      </div>
    </main>
  )
}
