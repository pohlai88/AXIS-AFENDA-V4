import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function AppDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Shell spine: navigation, tenants, modules, and one vertical slice.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border p-5">
          <h2 className="font-medium">Modules</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Integrations are added as modules (iframe first), so the shell stays
            stable.
          </p>
          <div className="mt-4">
            <Button variant="outline" asChild>
              <Link href="/app/modules">Open module registry</Link>
            </Button>
          </div>
        </div>

        <div className="rounded-xl border p-5">
          <h2 className="font-medium">Approvals</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            First end-to-end workflow validating contracts, tenant scope, and
            persistence.
          </p>
          <div className="mt-4">
            <Button variant="outline" asChild>
              <Link href="/app/approvals">Go to approvals</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

