import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-16">
      <section className="space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight">AFENDA</h1>
        <p className="text-muted-foreground max-w-2xl">
          Life is chaos, but work doesn’t have to be. This is the shell that will
          orchestrate modules, tenants, and workflows.
        </p>
      </section>

      <section className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/app">Open App Shell</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/components">Component Playground</Link>
        </Button>
      </section>

      <section className="rounded-xl border p-6">
        <h2 className="text-lg font-medium">Next step</h2>
        <p className="text-muted-foreground mt-1">
          Build one vertical slice end-to-end (Approvals) and keep integrations as
          modules (iframe first).
        </p>
      </section>
    </main>
  )
}

