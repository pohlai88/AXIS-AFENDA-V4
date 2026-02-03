/**
 * @domain auth
 * @layer page
 * @responsibility Account pages (settings, security, organizations) using shadcn UI only
 *
 * No Neon AccountView – all UI uses components from @/components/ui and @/components/auth.
 */

"use client"

import { use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft } from "lucide-react"
import { routes } from "@/lib/routes"
import {
  AUTH_LABELS,
  AUTH_PAGE_TITLES,
  AUTH_PAGE_DESCRIPTIONS,
} from "@/lib/constants/auth"

const ACCOUNT_PATHS = ["settings", "security", "organizations"] as const

const ACCOUNT_TAB_LABELS: Record<(typeof ACCOUNT_PATHS)[number], string> = {
  settings: AUTH_PAGE_TITLES.ACCOUNT_SETTINGS,
  security: AUTH_PAGE_TITLES.ACCOUNT_SECURITY,
  organizations: AUTH_PAGE_TITLES.ACCOUNT_ORGANIZATIONS,
}

const ACCOUNT_DESCRIPTIONS: Record<(typeof ACCOUNT_PATHS)[number], string> = {
  settings: AUTH_LABELS.ACCOUNT_SETTINGS_DESCRIPTION,
  security: AUTH_LABELS.ACCOUNT_SECURITY_DESCRIPTION,
  organizations: AUTH_LABELS.ACCOUNT_ORGANIZATIONS_DESCRIPTION,
}

export default function AccountPathPage({
  params,
}: {
  params: Promise<{ path: string }>
}) {
  const { path } = use(params)
  const router = useRouter()

  const normalizedPath = path?.toLowerCase() ?? ""
  const isKnownPath = ACCOUNT_PATHS.includes(normalizedPath as (typeof ACCOUNT_PATHS)[number])

  if (!isKnownPath) {
    router.replace(routes.ui.auth.accountSettings())
    return null
  }

  const tabPath = normalizedPath as (typeof ACCOUNT_PATHS)[number]

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-14 items-center px-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={routes.ui.orchestra.root()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {AUTH_LABELS.BACK_TO_APP.replace("← ", "")}
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl px-4 py-8">
        <Tabs value={tabPath} onValueChange={(v) => router.replace(`/account/${v}`)}>
          <TabsList className="grid w-full grid-cols-3">
            {ACCOUNT_PATHS.map((p) => (
              <TabsTrigger key={p} value={p} asChild>
                <Link href={`/account/${p}`}>{ACCOUNT_TAB_LABELS[p]}</Link>
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value={tabPath} className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{ACCOUNT_TAB_LABELS[tabPath]}</CardTitle>
                <CardDescription>{ACCOUNT_DESCRIPTIONS[tabPath]}</CardDescription>
              </CardHeader>
              <CardContent>
                {tabPath === "settings" && (
                  <p className="text-sm text-muted-foreground">
                    {AUTH_PAGE_DESCRIPTIONS.SIGN_IN}
                  </p>
                )}
                {tabPath === "security" && (
                  <Button asChild variant="default">
                    <Link href={routes.ui.settings.sessions()}>
                      {AUTH_LABELS.MANAGE_SESSIONS}
                    </Link>
                  </Button>
                )}
                {tabPath === "organizations" && (
                  <Button asChild variant="default">
                    <Link href={routes.ui.tenancy.organizations.list()}>
                      {AUTH_LABELS.VIEW_ORGANIZATIONS}
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
