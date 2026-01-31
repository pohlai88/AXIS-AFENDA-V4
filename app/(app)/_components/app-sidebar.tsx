"use client"

import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { siteConfig } from "@/lib/config/site"
import { routes } from "@/lib/routes"
import {
  GalleryVerticalEnd,
  HomeIcon,
  LayoutDashboardIcon,
  ListChecksIcon,
  PackageIcon,
  PaletteIcon,
  SettingsIcon,
  ShieldCheckIcon,
  FolderIcon,
} from "lucide-react"

import { NavMain, type NavMainItem } from "@/components/nav-main"
import { NavProjects, type NavProjectItem } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"

type Props = {
  userId: string
}

export function AppSidebar({ userId }: Props) {
  const pathname = usePathname()

  const isDashboard = pathname === routes.app.dashboard()
  const isTasks = pathname.startsWith(routes.app.tasks())
  const isProjects = pathname.startsWith(routes.app.projects())
  const isModules = pathname.startsWith(routes.app.modules())
  const isApprovals = pathname.startsWith(routes.app.approvals())
  const isAnalytics = pathname.startsWith(routes.app.analytics())
  const isSettings = pathname.startsWith(routes.app.settings.root())
  const isHome = pathname === routes.home()
  const isComponents = pathname.startsWith(routes.components())

  const navMain: NavMainItem[] = [
    {
      title: "App",
      url: routes.app.root(),
      icon: LayoutDashboardIcon,
      isActive: isDashboard || isTasks || isProjects || isModules || isApprovals || isAnalytics,
      items: [
        { title: "Dashboard", url: routes.app.dashboard() },
        { title: "Tasks", url: routes.app.tasks() },
        { title: "Projects", url: routes.app.projects() },
        { title: "Analytics", url: routes.app.analytics() },
        { title: "Modules", url: routes.app.modules() },
        { title: "Approvals", url: routes.app.approvals() },
      ],
    },
    {
      title: "Settings",
      url: routes.app.settings.root(),
      icon: SettingsIcon,
      isActive: isSettings,
      items: [
        { title: "Design System", url: routes.app.settings.designSystem() },
      ],
    },
    {
      title: "Public",
      url: routes.home(),
      icon: HomeIcon,
      isActive: isHome || isComponents,
      items: [
        { title: "Home", url: routes.home() },
        { title: "Components", url: routes.components() },
      ],
    },
  ]

  const projects: NavProjectItem[] = [
    { name: "Tasks", url: routes.app.tasks(), icon: ListChecksIcon },
    { name: "Projects", url: routes.app.projects(), icon: FolderIcon },
    { name: "Modules", url: routes.app.modules(), icon: PackageIcon },
    { name: "Approvals", url: routes.app.approvals(), icon: ShieldCheckIcon },
    { name: "Design System", url: routes.app.settings.designSystem(), icon: PaletteIcon },
  ]

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <TeamSwitcher
          teams={[
            {
              name: siteConfig.name,
              logo: GalleryVerticalEnd,
              plan: "Enterprise",
            },
          ]}
        />
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navMain} />
        <NavProjects projects={projects} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={{ name: "User", email: userId, avatar: "/avatars/shadcn.svg" }} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

