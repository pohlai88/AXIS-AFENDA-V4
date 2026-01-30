import { getServerEnv } from "@/lib/env/server"

import { ApprovalsClient } from "./ui"

export default function ApprovalsPage() {
  const hasDb = Boolean(getServerEnv().DATABASE_URL)

  if (!hasDb) {
    return (
      <div className="rounded-xl border p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Approvals</h1>
        <p className="text-muted-foreground mt-2">
          Database is not configured. Set <code>DATABASE_URL</code> to enable the
          approvals workflow.
        </p>
      </div>
    )
  }

  return <ApprovalsClient />
}

