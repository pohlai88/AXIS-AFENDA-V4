"use client"

import * as React from "react"
import {
  IconDashboard,
  IconFolder,
  IconUsers,
  IconSettings,
  IconHelp,
  IconSearch,
  IconBuilding,
  IconUsersGroup,
  IconShare,
  IconChartBar,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { FEATURE_FLAGS } from "@/lib/constants/feature-flags"
import { routes } from "@/lib/routes"

import { NavUser } from "./nav-user"
import { FeatureGuard } from "./feature-guard"

interface ProgressiveAppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    name: string
    email: string
    avatar: string
  }
}

export function ProgressiveAppSidebar({ user, ...props }: ProgressiveAppSidebarProps) {
  const personalNav = [
    {
      title: "Dashboard",
      url: routes.ui.orchestra.dashboard(),
      icon: IconDashboard,
    },
    {
      title: "Projects",
      url: routes.ui.magictodo.projects(),
      icon: IconFolder,
    },
  ]

  const teamNav = [
    {
      title: "Teams",
      url: routes.ui.tenancy.teams.list(),
      icon: IconUsersGroup,
    },
    {
      title: "Shared with Me",
      url: routes.ui.magictodo.tasks(),
      icon: IconShare,
    },
  ]

  const organizationNav = [
    {
      title: "Organizations",
      url: routes.ui.tenancy.organizations.list(),
      icon: IconBuilding,
    },
    {
      title: "Members",
      url: routes.ui.tenancy.organizations.list(),
      icon: IconUsers,
    },
    {
      title: "Analytics",
      url: routes.ui.orchestra.analytics(),
      icon: IconChartBar,
    },
  ]

  const secondaryNav = [
    {
      title: "Settings",
      url: routes.ui.settings.root(),
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "/help",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: routes.ui.orchestra.root(),
      icon: IconSearch,
    },
  ]

  const buildNavigation = () => {
    const nav = [...personalNav]

    return (
      <>
        <NavMain items={nav} />

        <FeatureGuard feature={FEATURE_FLAGS.TEAM_SIDEBAR}>
          <NavMain items={teamNav} />
        </FeatureGuard>

        <FeatureGuard feature={FEATURE_FLAGS.ORG_HEADER}>
          <NavMain items={organizationNav} />
        </FeatureGuard>
      </>
    )
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href={routes.ui.orchestra.root()}>
                <IconDashboard className="!size-5" />
                <span className="text-base font-semibold">MagicToDo</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <FeatureGuard feature={FEATURE_FLAGS.ORG_SWITCHER}>
          <div className="px-2 py-2">
            <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm">
              <div className="flex items-center gap-2">
                <IconBuilding className="size-4" />
                <span className="font-medium">Acme Inc.</span>
              </div>
            </div>
          </div>
        </FeatureGuard>
      </SidebarHeader>

      <SidebarContent>
        {buildNavigation()}
        <NavSecondary items={secondaryNav} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        {user ? (
          <NavUser
            user={{
              name: user.name,
              email: user.email,
              avatar: user.avatar || "/avatars/default.jpg",
            }}
          />
        ) : null}
      </SidebarFooter>
    </Sidebar>
  )
}

