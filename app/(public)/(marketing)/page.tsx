import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { siteConfig } from "@/lib/config/site"
import { routes } from "@/lib/routes"

import { SiteLogo } from "../_components/site-logo"

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-16">
      <header className="mb-8 flex items-center justify-between">
        <SiteLogo />
      </header>
      <section className="space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight">
          {siteConfig.name}
        </h1>
        <p className="text-muted-foreground max-w-2xl text-lg">
          {siteConfig.description} This is the shell that will orchestrate
          modules, tenants, and workflows.
        </p>
      </section>

      <section className="flex flex-wrap gap-4">
        <Button asChild size="lg">
          <Link href={routes.ui.auth.login()}>Sign In</Link>
        </Button>
        <Button asChild size="lg">
          <Link href={routes.ui.auth.register()}>Create Account</Link>
        </Button>
        <Button variant="outline" asChild size="lg">
          <Link href={routes.ui.marketing.components()}>Component Playground</Link>
        </Button>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Next step</CardTitle>
            <CardDescription>
              Build one vertical slice end-to-end (Approvals) and keep
              integrations as modules (iframe first).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href={routes.ui.orchestra.root()}>Get Started</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
            <CardDescription>
              Multi-tenant architecture with module orchestration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Neon Auth integration</li>
              <li>• Row Level Security</li>
              <li>• Module-based architecture</li>
              <li>• Type-safe API contracts</li>
            </ul>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

