import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { routes } from "@/lib/routes"

type Props = {
  params: Promise<{ id: string }>
}

export default async function TeamDetailPage({ params }: Props) {
  const { id } = await params

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
        <p className="text-muted-foreground">ID: {id}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team workspace</CardTitle>
          <CardDescription>
            This is the canonical team detail page in the tenancy domain.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={routes.ui.tenancy.teams.list()}>Back to teams</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={routes.ui.tenancy.teams.settings(id)}>Settings</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={routes.ui.tenancy.teams.members(id)}>Members</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

