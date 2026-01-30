import Link from "next/link"
import { redirect } from "next/navigation"

import { Button } from "@/components/ui/button"
import { getAuthContext } from "@/lib/server/auth/context"

type Props = {
  children: React.ReactNode
}

export default async function AppShellLayout({ children }: Props) {
  const auth = await getAuthContext()
  if (!auth.userId) redirect("/login?callbackUrl=/app")

  return (
    <div className="min-h-dvh">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Link href="/app" className="font-semibold tracking-tight">
              AFENDA
            </Link>
            <span className="text-muted-foreground text-sm">App Shell</span>
          </div>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/">Home</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/components">Components</Link>
            </Button>
            <span className="text-muted-foreground hidden text-sm md:inline">
              {auth.userId}
            </span>
          </nav>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-4 py-6 md:grid-cols-[240px_1fr]">
        <aside className="space-y-2">
          <div className="text-muted-foreground px-2 text-xs font-medium uppercase tracking-wide">
            Navigation
          </div>
          <div className="flex flex-col gap-1">
            <Button variant="ghost" className="justify-start" asChild>
              <Link href="/app">Dashboard</Link>
            </Button>
            <Button variant="ghost" className="justify-start" asChild>
              <Link href="/app/modules">Modules</Link>
            </Button>
            <Button variant="ghost" className="justify-start" asChild>
              <Link href="/app/approvals">Approvals</Link>
            </Button>
          </div>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  )
}

