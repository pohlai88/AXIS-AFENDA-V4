"use client"

import { ProgressiveAppSidebar } from "@/components/progressive-app-sidebar"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { ProgressiveFeature } from "@/components/feature-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/lib/client/hooks/useAuth"
import { useFeatureFlags } from "@/lib/client/hooks/useFeatureFlags"

/**
 * Progressive Dashboard following the hybrid methodology
 * Phase 1: Personal tasks and projects
 * Phase 2: Team collaboration
 * Phase 3: Organization management
 */
export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth()
  const { isLoading: flagsLoading } = useFeatureFlags()

  if (authLoading || flagsLoading) {
    return <DashboardSkeleton />
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <ProgressiveAppSidebar
        user={user ? {
          name: user.name || user.email || "User",
          email: user.email || "",
          avatar: "/avatars/default.jpg"
        } : undefined}
        variant="inset"
      />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* Progressive content based on enabled features */}
              <ProgressiveFeature
                personalContent={<PersonalDashboard />}
                teamContent={<TeamDashboard />}
                organizationContent={<OrganizationDashboard />}
                enterpriseContent={<EnterpriseDashboard />}
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

/**
 * Personal Dashboard (Phase 1 - Always visible)
 */
function PersonalDashboard() {
  return (
    <div className="space-y-4">
      <div className="px-4 lg:px-6">
        <h1 className="text-3xl font-bold tracking-tight">My Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your personal tasks and projects
        </p>
      </div>
      <SectionCards />
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Tasks</CardTitle>
            <CardDescription>Your most recent personal tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No tasks yet. Create your first task to get started!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/**
 * Team Dashboard (Phase 2 - Enabled with teams)
 */
function TeamDashboard() {
  return (
    <div className="space-y-4">
      <div className="px-4 lg:px-6">
        <h1 className="text-3xl font-bold tracking-tight">Team Dashboard</h1>
        <p className="text-muted-foreground">
          Collaborate with your team on shared projects
        </p>
      </div>
      <SectionCards />

      <div className="grid gap-4 px-4 lg:px-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>My Teams</CardTitle>
            <CardDescription>Teams you&apos;re a member of</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You haven&apos;t joined any teams yet.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shared Projects</CardTitle>
            <CardDescription>Projects shared with your teams</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No shared projects yet.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/**
 * Organization Dashboard (Phase 3 - Enabled with organizations)
 */
function OrganizationDashboard() {
  return (
    <div className="space-y-4">
      <div className="px-4 lg:px-6">
        <h1 className="text-3xl font-bold tracking-tight">Organization Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your organization and teams
        </p>
      </div>
      <SectionCards />

      <div className="grid gap-4 px-4 lg:px-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Teams</CardTitle>
            <CardDescription>Active teams in your organization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Create your first team
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
            <CardDescription>Organization members</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">
              Invite more members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Projects</CardTitle>
            <CardDescription>Total organization projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Start your first project
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/**
 * Enterprise Dashboard (Phase 4 - Advanced features)
 */
function EnterpriseDashboard() {
  return (
    <div className="space-y-4">
      <div className="px-4 lg:px-6">
        <h1 className="text-3xl font-bold tracking-tight">Enterprise Dashboard</h1>
        <p className="text-muted-foreground">
          Advanced analytics and multi-organization management
        </p>
      </div>
      <SectionCards />

      <div className="grid gap-4 px-4 lg:px-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Organizations</CardTitle>
            <CardDescription>Your organizations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Teams</CardTitle>
            <CardDescription>Across all orgs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Members</CardTitle>
            <CardDescription>Across all orgs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Calls</CardTitle>
            <CardDescription>This month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/**
 * Loading skeleton for dashboard
 */
function DashboardSkeleton() {
  return (
    <div className="flex h-screen w-full">
      <div className="w-64 border-r">
        <Skeleton className="h-full w-full" />
      </div>
      <div className="flex-1 p-6">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-4 w-96 mb-8" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    </div>
  )
}
