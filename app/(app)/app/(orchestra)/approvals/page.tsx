/**
 * @domain orchestra
 * @layer ui
 * @responsibility UI route entrypoint for /app/approvals
 */

import { getServerEnv } from "@/lib/env/server"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { ApprovalsClient } from "./ui"

export default function ApprovalsPage() {
  const hasDb = Boolean(getServerEnv().DATABASE_URL)

  if (!hasDb) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Approvals</CardTitle>
          <CardDescription>
            Database is not configured. Set <code>DATABASE_URL</code> to enable
            the approvals workflow.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return <ApprovalsClient />
}

