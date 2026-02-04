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
  Building2Icon,
} from "lucide-react"
import type { Icon } from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects, type NavProjectItem } from "@/components/nav-projects"
import { NavUser } from "./nav-user"
import { TeamSwitcher } from "./team-switcher"

type Props = {
  userId: string
}

type NavMainItem = {
  title: string
  url: string
  icon?: Icon
  isActive?: boolean
  items?: { title: string; url: string }[]
}

export function AppSidebar({ userId }: Props) {
  const pathname = usePathname()

  const isDashboard = pathname === routes.ui.orchestra.dashboard()
  const isTasks = pathname.startsWith(routes.ui.magictodo.tasks())
  const isProjects = pathname.startsWith(routes.ui.magictodo.projects())
  const isModules = pathname.startsWith(routes.ui.orchestra.modules())
  const isApprovals = pathname.startsWith(routes.ui.orchestra.approvals())
  const isAnalytics = pathname.startsWith(routes.ui.orchestra.analytics())
  const isSettings = pathname.startsWith(routes.ui.settings.root())
  const isHome = pathname === routes.ui.marketing.home()
  const isComponents = pathname.startsWith(routes.ui.marketing.components())
  const isTenancy = pathname.startsWith(routes.ui.tenancy.root())
  const isMagicFolder =
    pathname.startsWith(routes.ui.magicfolder.landing()) ||
    pathname.startsWith(routes.ui.magicfolder.inbox()) ||
    pathname.startsWith(routes.ui.magicfolder.duplicates()) ||
    pathname.startsWith(routes.ui.magicfolder.unsorted()) ||
    pathname.startsWith(routes.ui.magicfolder.search()) ||
    pathname.startsWith(routes.ui.magicfolder.collections()) ||
    pathname.startsWith(routes.ui.magicfolder.settings()) ||
    pathname.startsWith(routes.ui.magicfolder.audit())

  const navMain: NavMainItem[] = [
    {
      title: "App",
      url: routes.ui.orchestra.root(),
      icon: LayoutDashboardIcon as unknown as Icon,
      isActive:
        isDashboard ||
        isTasks ||
        isProjects ||
        isModules ||
        isApprovals ||
        isAnalytics ||
        isMagicFolder,
      items: [
        { title: "Dashboard", url: routes.ui.orchestra.dashboard() },
        { title: "Tasks", url: routes.ui.magictodo.tasks() },
        { title: "Projects", url: routes.ui.magictodo.projects() },
        { title: "MagicFolder", url: routes.ui.magicfolder.landing() },
        { title: "MagicFolder Inbox", url: routes.ui.magicfolder.inbox() },
        { title: "MagicFolder Duplicates", url: routes.ui.magicfolder.duplicates() },
        { title: "MagicFolder Unsorted", url: routes.ui.magicfolder.unsorted() },
        { title: "MagicFolder Search", url: routes.ui.magicfolder.search() },
        { title: "MagicFolder Collections", url: routes.ui.magicfolder.collections() },
        { title: "MagicFolder Settings", url: routes.ui.magicfolder.settings() },
        { title: "MagicFolder Audit", url: routes.ui.magicfolder.audit() },
        { title: "Analytics", url: routes.ui.orchestra.analytics() },
        { title: "Modules", url: routes.ui.orchestra.modules() },
        { title: "Approvals", url: routes.ui.orchestra.approvals() },
      ],
    },
    {
      title: "Tenancy",
      url: routes.ui.tenancy.organizations.list(),
      icon: Building2Icon as unknown as Icon,
      isActive: isTenancy,
      items: [
        { title: "Organizations", url: routes.ui.tenancy.organizations.list() },
        { title: "Teams", url: routes.ui.tenancy.teams.list() },
      ],
    },
    {
      title: "Settings",
      url: routes.ui.settings.root(),
      icon: SettingsIcon as unknown as Icon,
      isActive: isSettings,
      items: [
        { title: "Design System", url: routes.ui.settings.designSystem() },
      ],
    },
    {
      title: "Home",
      url: routes.ui.marketing.home(),
      icon: HomeIcon as unknown as Icon,
      isActive: isHome || isComponents,
      items: [
        { title: "Home", url: routes.ui.marketing.home() },
        { title: "Components", url: routes.ui.marketing.components() },
      ],
    },
  ]

  const projects: NavProjectItem[] = [
    { name: "Tasks", url: routes.ui.magictodo.tasks(), icon: ListChecksIcon },
    { name: "Projects", url: routes.ui.magictodo.projects(), icon: FolderIcon },
    { name: "Modules", url: routes.ui.orchestra.modules(), icon: PackageIcon },
    { name: "Approvals", url: routes.ui.orchestra.approvals(), icon: ShieldCheckIcon },
    { name: "Design System", url: routes.ui.settings.designSystem(), icon: PaletteIcon },
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

