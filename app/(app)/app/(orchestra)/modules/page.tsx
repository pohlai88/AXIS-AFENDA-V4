import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { routes } from "@/lib/routes"
import { modules } from "@/lib/shared/modules"

export default function ModulesPage() {
  const enabledModules = modules.filter((m) => m.enabled !== false)

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Modules</h1>
        <p className="text-muted-foreground">
          Integrations live behind a registry. Start with iframe embeds; deepen
          integration later.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {enabledModules.map((m) => (
          <Card key={m.slug}>
            <CardHeader className="border-b">
              <CardTitle>{m.name}</CardTitle>
              <CardDescription>
                {m.description ?? "Module integration (iframe first)."}
              </CardDescription>
              <CardAction>
                <Button variant="outline" asChild>
                  <Link href={routes.ui.orchestra.moduleBySlug(m.slug)}>Open</Link>
                </Button>
              </CardAction>
            </CardHeader>
            <div className="text-muted-foreground px-6 pb-5 text-xs group-data-[size=sm]/card:px-4">
              {m.kind.toUpperCase()} · {m.href}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

