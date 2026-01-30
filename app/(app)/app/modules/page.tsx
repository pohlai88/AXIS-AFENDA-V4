import Link from "next/link"

import { Button } from "@/components/ui/button"
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
          <div key={m.slug} className="rounded-xl border p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="font-medium">{m.name}</div>
                {m.description ? (
                  <p className="text-muted-foreground mt-1 text-sm">
                    {m.description}
                  </p>
                ) : null}
                <p className="text-muted-foreground mt-2 text-xs">
                  {m.kind.toUpperCase()} · {m.href}
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link href={`/app/modules/${m.slug}`}>Open</Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

