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
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { FeatureGuard } from "@/components/feature-guard"
import { FEATURE_FLAGS } from "@/lib/constants/feature-flags"

interface ProgressiveAppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    name: string
    email: string
    avatar: string
  }
}

/**
 * Progressive sidebar that evolves based on enabled features
 * Phase 1: Personal - Tasks & Projects
 * Phase 2: Teams - Team collaboration
 * Phase 3: Organizations - Org management
 */
export function ProgressiveAppSidebar({ user, ...props }: ProgressiveAppSidebarProps) {
  // Personal navigation (always visible)
  const personalNav = [
    {
      title: "Dashboard",
      url: "/app",
      icon: IconDashboard,
    },
    {
      title: "Projects",
      url: "/app/projects",
      icon: IconFolder,
    },
  ]

  // Team navigation (Phase 2)
  const teamNav = [
    {
      title: "Teams",
      url: "/app/teams",
      icon: IconUsersGroup,
    },
    {
      title: "Shared with Me",
      url: "/app/shared",
      icon: IconShare,
    },
  ]

  // Organization navigation (Phase 3)
  const organizationNav = [
    {
      title: "Organization",
      url: "/app/organization",
      icon: IconBuilding,
    },
    {
      title: "Members",
      url: "/app/organization/members",
      icon: IconUsers,
    },
    {
      title: "Analytics",
      url: "/app/organization/analytics",
      icon: IconChartBar,
    },
  ]

  const secondaryNav = [
    {
      title: "Settings",
      url: "/app/settings",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "/help",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "/app/search",
      icon: IconSearch,
    },
  ]

  // Build navigation progressively
  const buildNavigation = () => {
    const nav = [...personalNav]

    return (
      <>
        <NavMain items={nav} />

        {/* Team navigation - Phase 2 */}
        <FeatureGuard feature={FEATURE_FLAGS.TEAM_SIDEBAR}>
          <NavMain items={teamNav} />
        </FeatureGuard>

        {/* Organization navigation - Phase 3 */}
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
              <a href="/app">
                <IconDashboard className="!size-5" />
                <span className="text-base font-semibold">MagicToDo</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Organization switcher - Phase 3 */}
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
        {user && (
          <NavUser
            user={{
              name: user.name,
              email: user.email,
              avatar: user.avatar || "/avatars/default.jpg",
            }}
          />
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
