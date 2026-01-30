import { redirect } from "next/navigation"

import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { siteConfig } from "@/lib/config/site"
import { routes } from "@/lib/routes"
import { getAuthContext } from "@/lib/server/auth/context"

import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"
import { AppBreadcrumbs } from "./_components/app-breadcrumbs"
import { AppSidebar } from "./_components/app-sidebar"

type Props = {
  children: React.ReactNode
}

export default async function AppShellLayout({ children }: Props) {
  const auth = await getAuthContext()
  if (!auth.userId) redirect(routes.login({ callbackUrl: routes.app.root() }))

  return (
    <SidebarProvider defaultOpen>
      <AppSidebar userId={auth.userId} />
      <SidebarInset>
        <header className="bg-background sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <AppBreadcrumbs appName={siteConfig.name} />
          <div className="ml-auto flex items-center">
            <AnimatedThemeToggler />
          </div>
        </header>
        <div className="p-4 md:p-6">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

