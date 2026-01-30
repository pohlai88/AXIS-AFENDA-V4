import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { siteConfig } from "@/lib/config/site"
import { routes } from "@/lib/routes"

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-16">
      <section className="space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight">
          {siteConfig.name}
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          {siteConfig.description} This is the shell that will orchestrate
          modules, tenants, and workflows.
        </p>
      </section>

      <section className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href={routes.app.root()}>Open App Shell</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={routes.components()}>Component Playground</Link>
        </Button>
      </section>

      <section>
        <Card size="sm">
          <CardHeader>
            <CardTitle>Next step</CardTitle>
            <CardDescription>
              Build one vertical slice end-to-end (Approvals) and keep
              integrations as modules (iframe first).
            </CardDescription>
          </CardHeader>
        </Card>
      </section>
    </main>
  )
}

