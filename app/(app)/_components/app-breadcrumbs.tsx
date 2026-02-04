"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { routes } from "@/lib/routes"
import { getModuleBySlug } from "@/lib/shared/modules"

type Props = {
  appName: string
}

export function AppBreadcrumbs({ appName }: Props) {
  const pathname = usePathname()

  const crumbs: Array<{ label: string; href?: string }> = [
    { label: appName, href: routes.ui.orchestra.root() },
  ]

  if (pathname === routes.ui.orchestra.dashboard()) {
    crumbs.push({ label: "Dashboard" })
  } else if (pathname.startsWith(routes.ui.magictodo.tasks())) {
    crumbs.push({ label: "Tasks" })
  } else if (pathname.startsWith(routes.ui.orchestra.modules())) {
    crumbs.push({ label: "Modules", href: routes.ui.orchestra.modules() })
    const slug = pathname.split("/").filter(Boolean)[2]
    if (slug) crumbs.push({ label: getModuleBySlug(slug)?.name ?? slug })
  } else if (pathname.startsWith(routes.ui.orchestra.approvals())) {
    crumbs.push({ label: "Approvals" })
  } else if (pathname.startsWith(routes.ui.magicfolder.landing())) {
    // MagicFolder breadcrumb handling
    const magicfolderPath = pathname.replace(routes.ui.magicfolder.landing(), "").split("/").filter(Boolean)

    if (magicfolderPath.length === 0) {
      // Main MagicFolder hub
      crumbs.push({ label: "MagicFolder" })
    } else if (magicfolderPath[0] === "documents" && magicfolderPath.length === 2) {
      // Document detail view
      crumbs.push({ label: "MagicFolder", href: routes.ui.magicfolder.landing() })
      crumbs.push({ label: "Document" })
    } else {
      // Specialized MagicFolder views
      const viewNames: Record<string, string> = {
        inbox: "Inbox",
        duplicates: "Duplicates",
        unsorted: "Unsorted",
        search: "Search",
        collections: "Collections",
        audit: "Audit"
      }

      const viewName = viewNames[magicfolderPath[0]] || magicfolderPath[0]
      crumbs.push({ label: "MagicFolder", href: routes.ui.magicfolder.landing() })
      crumbs.push({ label: viewName })
    }
  } else {
    crumbs.push({ label: "App Shell" })
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((c, idx) => {
          const isLast = idx === crumbs.length - 1
          return (
            <div key={`${c.label}-${idx}`} className="contents">
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{c.label}</BreadcrumbPage>
                ) : c.href ? (
                  <BreadcrumbLink asChild>
                    <Link href={c.href}>{c.label}</Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{c.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {!isLast ? <BreadcrumbSeparator /> : null}
            </div>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

