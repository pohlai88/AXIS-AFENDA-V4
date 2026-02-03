/**
 * @domain auth
 * @layer ui
 * @responsibility Session summary dashboard: analytics, activity trail, approvals/requests/todo/done,
 * export & utilities (Export, Share to, Save to personal DB), top/bottom action bars, copy per section.
 * No hardcoded strings. Success/fail badges for actions.
 */

"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/lib/client/hooks/useAuth"
import { routes } from "@/lib/routes"
import { apiFetch } from "@/lib/api/client"
import {
  sessionListResponseSchema,
  type SessionResponse,
} from "@/lib/contracts/sessions"
import {
  activityListResponseSchema,
  type ActivityEvent,
} from "@/lib/contracts/auth"
import { authClient } from "@/lib/auth/client"
import { clearAppCache } from "@/lib/client/clear-app-cache"
import { exportToJson, exportToMarkdown } from "@/lib/client/export-to-file"
import { AUTH_LABELS } from "@/lib/constants/auth"
import { AuthBrandWordmark, AuthBrandSlogan } from "@/components/auth/auth-brand"
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"
import {
  LogOut,
  Download,
  Trash2,
  Clock,
  Monitor,
  Activity,
  Users,
  CheckSquare,
  Send,
  ListTodo,
  CircleCheck,
  Copy,
  Share2,
  Database,
  ChevronDown,
} from "lucide-react"

type ActionStatus = "success" | "fail" | null

function formatSessionDuration(createdAt: string): string {
  const start = new Date(createdAt).getTime()
  const now = Date.now()
  const diffMs = now - start
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return AUTH_LABELS.JUST_NOW
  if (diffMins < 60) return `${diffMins} min`
  if (diffHours < 24) return `${diffHours} h`
  return `${diffDays} d`
}

function formatLastActive(lastActive: string): string {
  const date = new Date(lastActive)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return AUTH_LABELS.JUST_NOW
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
}

export default function SignOutPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: isSessionLoading } = useAuth()
  const [sessions, setSessions] = useState<SessionResponse[]>([])
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [sessionsError, setSessionsError] = useState(false)
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([])
  const [loadingActivity, setLoadingActivity] = useState(true)
  const [activityError, setActivityError] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [clearingCache, setClearingCache] = useState(false)
  const [exportStatus, setExportStatus] = useState<ActionStatus>(null)
  const [cacheStatus, setCacheStatus] = useState<ActionStatus>(null)
  const [copyFeedback, setCopyFeedback] = useState<{
    section: string
    status: "success" | "fail"
  } | null>(null)

  useEffect(() => {
    if (!isSessionLoading && !isAuthenticated) {
      router.replace(routes.ui.auth.login())
      return
    }
  }, [isSessionLoading, isAuthenticated, router])

  useEffect(() => {
    if (!isAuthenticated) return

    let cancelled = false

    apiFetch(routes.api.v1.auth.sessions.list(), {}, sessionListResponseSchema)
      .then((res) => {
        if (!cancelled) setSessions(res.sessions)
      })
      .catch(() => {
        if (!cancelled) setSessionsError(true)
      })
      .finally(() => {
        if (!cancelled) setLoadingSessions(false)
      })

    return () => {
      cancelled = true
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) return

    let cancelled = false

    apiFetch(routes.api.auth.activity(), {}, activityListResponseSchema)
      .then((res) => {
        if (!cancelled) setActivityEvents(res.events)
      })
      .catch(() => {
        if (!cancelled) setActivityError(true)
      })
      .finally(() => {
        if (!cancelled) setLoadingActivity(false)
      })

    return () => {
      cancelled = true
    }
  }, [isAuthenticated])

  const currentSession = sessions.find((s) => s.isCurrent)
  const totalSessions = sessions.length

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await fetch(routes.api.auth.logout(), {
        method: "POST",
        credentials: "include",
      })
      await authClient.signOut()
      router.replace(routes.ui.auth.login())
    } catch {
      await authClient.signOut()
      router.replace(routes.ui.auth.login())
    }
  }

  const handleClearCache = async () => {
    setClearingCache(true)
    setCacheStatus(null)
    try {
      await clearAppCache()
      setCacheStatus("success")
    } catch {
      setCacheStatus("fail")
    } finally {
      setClearingCache(false)
    }
  }

  const handleExportJson = useCallback(() => {
    setExportStatus(null)
    try {
      const summary = {
        exportedAt: new Date().toISOString(),
        sessionDuration: currentSession
          ? formatSessionDuration(currentSession.createdAt)
          : null,
        lastActivity: currentSession
          ? formatLastActive(currentSession.lastActive)
          : null,
        device: currentSession
          ? {
            device: currentSession.device,
            browser: currentSession.browser,
            os: currentSession.os,
          }
          : null,
        activeSessionsCount: totalSessions,
      }
      exportToJson(summary, "sign-out-summary.json")
      setExportStatus("success")
    } catch {
      setExportStatus("fail")
    }
  }, [currentSession, totalSessions])

  const handleExportMarkdown = useCallback(() => {
    setExportStatus(null)
    try {
      const lines: string[] = [
        `# ${AUTH_LABELS.SIGN_OUT_SUMMARY_EXPORT_HEADING}`,
        "",
        `**Exported:** ${new Date().toISOString()}`,
        "",
        `## ${AUTH_LABELS.EXPORT_SECTION_SESSION}`,
        currentSession
          ? [
            `- **${AUTH_LABELS.SESSION_DURATION}:** ${formatSessionDuration(currentSession.createdAt)}`,
            `- **${AUTH_LABELS.LAST_ACTIVITY}:** ${formatLastActive(currentSession.lastActive)}`,
            `- **${AUTH_LABELS.SESSION_DEVICE}:** ${currentSession.device}, ${currentSession.browser}, ${currentSession.os}`,
          ].join("\n")
          : `- ${AUTH_LABELS.EXPORT_NO_CURRENT_SESSION}`,
        "",
        `## ${AUTH_LABELS.EXPORT_SECTION_ACCOUNT}`,
        `- **${AUTH_LABELS.ACTIVE_SESSIONS}:** ${totalSessions}`,
        "",
        AUTH_LABELS.EXPORT_FOOTER_AUDIT,
      ]
      exportToMarkdown(lines.join("\n"), "sign-out-summary.md")
      setExportStatus("success")
    } catch {
      setExportStatus("fail")
    }
  }, [currentSession, totalSessions])

  const getActivityTrailCopyText = useCallback((): string => {
    if (loadingSessions || loadingActivity) return ""
    const lines = [
      `${AUTH_LABELS.ACTIVITY_TRAIL}`,
      AUTH_LABELS.ACTIVITY_TRAIL_DESCRIPTION,
      "",
      AUTH_LABELS.LAST_ACTIVITY,
      AUTH_LABELS.SESSION_DEVICE,
    ]
    if (activityEvents.length > 0) {
      activityEvents.forEach((ev) => {
        lines.push("", formatLastActive(ev.createdAt), ev.action ?? "—")
      })
    } else if (currentSession) {
      lines.push("", formatLastActive(currentSession.lastActive), `${currentSession.device}, ${currentSession.browser}, ${currentSession.os}`)
    } else {
      lines.push("", AUTH_LABELS.ACTIVITY_TRAIL_EMPTY_TITLE, AUTH_LABELS.ACTIVITY_TRAIL_EMPTY_DESCRIPTION)
    }
    return lines.join("\n")
  }, [loadingSessions, loadingActivity, currentSession, activityEvents])

  const handleCopyActivityTrail = useCallback(async () => {
    const text = getActivityTrailCopyText()
    try {
      await navigator.clipboard.writeText(text)
      setCopyFeedback({ section: "activity", status: "success" })
    } catch {
      setCopyFeedback({ section: "activity", status: "fail" })
    }
    setTimeout(() => setCopyFeedback(null), 2000)
  }, [getActivityTrailCopyText])

  const getSummaryTabCopyText = useCallback((tab: string): string => {
    const emptyTitles: Record<string, string> = {
      [AUTH_LABELS.APPROVALS]: AUTH_LABELS.APPROVALS_EMPTY_TITLE,
      [AUTH_LABELS.REQUESTS]: AUTH_LABELS.REQUESTS_EMPTY_TITLE,
      [AUTH_LABELS.TODO]: AUTH_LABELS.TODO_EMPTY_TITLE,
      [AUTH_LABELS.DONE]: AUTH_LABELS.DONE_EMPTY_TITLE,
    }
    const emptyDescs: Record<string, string> = {
      [AUTH_LABELS.APPROVALS]: AUTH_LABELS.APPROVALS_EMPTY_DESCRIPTION,
      [AUTH_LABELS.REQUESTS]: AUTH_LABELS.REQUESTS_EMPTY_DESCRIPTION,
      [AUTH_LABELS.TODO]: AUTH_LABELS.TODO_EMPTY_DESCRIPTION,
      [AUTH_LABELS.DONE]: AUTH_LABELS.DONE_EMPTY_DESCRIPTION,
    }
    return [AUTH_LABELS.SUMMARY_WHATS_DONE, tab, "", emptyTitles[tab] ?? tab, emptyDescs[tab] ?? ""].join("\n")
  }, [])

  const handleCopySummarySection = useCallback(
    async (tab: string) => {
      const text = getSummaryTabCopyText(tab)
      try {
        await navigator.clipboard.writeText(text)
        setCopyFeedback({ section: tab, status: "success" })
      } catch {
        setCopyFeedback({ section: tab, status: "fail" })
      }
      setTimeout(() => setCopyFeedback(null), 2000)
    },
    [getSummaryTabCopyText]
  )

  if (isSessionLoading) {
    return (
      <div
        className="min-h-screen bg-gradient-to-br from-background via-background to-muted/50 px-4 py-8 flex items-center justify-center"
        role="main"
        aria-label={AUTH_LABELS.DASHBOARD_PAGE_TITLE}
      >
        <div className="flex items-center gap-3" role="status" aria-live="polite">
          <Spinner className="size-5 shrink-0" aria-hidden />
          <span className="text-sm text-muted-foreground">
            {AUTH_LABELS.SESSION_LOADING_LABEL}
          </span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const topBarButtons = (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleClearCache}
        disabled={signingOut || clearingCache}
        aria-busy={clearingCache}
      >
        {clearingCache ? (
          <>
            <Spinner className="mr-2 size-4 shrink-0" aria-hidden />
            {AUTH_LABELS.CLEAR_CACHE}
          </>
        ) : (
          <>
            <Trash2 className="mr-2 size-4 shrink-0" aria-hidden />
            {AUTH_LABELS.CLEAR_CACHE}
          </>
        )}
      </Button>
      <Button
        variant="default"
        size="sm"
        onClick={handleSignOut}
        disabled={signingOut}
        aria-busy={signingOut}
      >
        {signingOut ? (
          <>
            <Spinner className="mr-2 size-4 shrink-0" aria-hidden />
            {AUTH_LABELS.SIGNING_OUT}
          </>
        ) : (
          <>
            <LogOut className="mr-2 size-4 shrink-0" aria-hidden />
            {AUTH_LABELS.SIGN_OUT}
          </>
        )}
      </Button>
      <Button variant="outline" size="sm" asChild disabled={signingOut}>
        <Link href={routes.ui.orchestra.root()}>{AUTH_LABELS.STAY_SIGNED_IN}</Link>
      </Button>
    </>
  )

  return (
    <div
      className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-muted/50 px-4 py-6"
      role="main"
      aria-label={AUTH_LABELS.DASHBOARD_PAGE_TITLE}
    >
      <div className="absolute top-4 right-4 z-20">
        <AnimatedThemeToggler aria-label="Toggle theme" />
      </div>
      <AuthBrandWordmark className="mb-4 shrink-0" />
      {/* Top fixed bar: Session summary + actions */}
      <div className="sticky top-0 z-10 -mx-4 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <header className="space-y-0.5 min-w-0">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              {AUTH_LABELS.DASHBOARD_PAGE_TITLE}
            </h1>
            <p className="text-muted-foreground text-sm max-w-xl truncate">
              {AUTH_LABELS.DASHBOARD_PAGE_DESCRIPTION}
            </p>
          </header>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {topBarButtons}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-6 pt-4">

        {sessionsError && (
          <Alert variant="destructive" role="alert">
            <AlertTitle>{AUTH_LABELS.SESSION_INFO_UNAVAILABLE}</AlertTitle>
            <AlertDescription>
              {AUTH_LABELS.SESSION_INFO_UNAVAILABLE_DESCRIPTION}
            </AlertDescription>
          </Alert>
        )}

        {/* Stats row */}
        <section aria-labelledby="session-overview-heading">
          <h2 id="session-overview-heading" className="sr-only">
            {AUTH_LABELS.SESSION_OVERVIEW}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {AUTH_LABELS.STAT_SESSION_DURATION}
                </CardTitle>
                <Clock className="size-4 text-muted-foreground" aria-hidden />
              </CardHeader>
              <CardContent>
                {loadingSessions ? (
                  <Skeleton className="h-7 w-16" aria-hidden />
                ) : currentSession ? (
                  <span className="text-2xl font-bold tabular-nums">
                    {formatSessionDuration(currentSession.createdAt)}
                  </span>
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {AUTH_LABELS.STAT_ACTIVE_SESSIONS}
                </CardTitle>
                <Users className="size-4 text-muted-foreground" aria-hidden />
              </CardHeader>
              <CardContent>
                {loadingSessions ? (
                  <Skeleton className="h-7 w-8" aria-hidden />
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold tabular-nums">
                      {totalSessions}
                    </span>
                    {totalSessions > 0 && (
                      <Badge variant="secondary" className="font-normal">
                        {totalSessions}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {AUTH_LABELS.STAT_LAST_ACTIVITY}
                </CardTitle>
                <Activity className="size-4 text-muted-foreground" aria-hidden />
              </CardHeader>
              <CardContent>
                {loadingSessions ? (
                  <Skeleton className="h-7 w-24" aria-hidden />
                ) : currentSession ? (
                  <span className="text-2xl font-bold">
                    {formatLastActive(currentSession.lastActive)}
                  </span>
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {AUTH_LABELS.STAT_DEVICE}
                </CardTitle>
                <Monitor className="size-4 text-muted-foreground" aria-hidden />
              </CardHeader>
              <CardContent>
                {loadingSessions ? (
                  <Skeleton className="h-7 w-28" aria-hidden />
                ) : currentSession ? (
                  <p className="text-sm font-medium leading-tight truncate" title={`${currentSession.device}, ${currentSession.browser}, ${currentSession.os}`}>
                    {currentSession.device}
                  </p>
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Activity trail + Copy */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div className="space-y-1.5">
              <CardTitle>{AUTH_LABELS.ACTIVITY_TRAIL}</CardTitle>
              <CardDescription>
                {AUTH_LABELS.ACTIVITY_TRAIL_DESCRIPTION}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyActivityTrail}
                disabled={loadingSessions || loadingActivity}
                aria-label={AUTH_LABELS.COPY_SECTION}
              >
                <Copy className="mr-1.5 size-4 shrink-0" aria-hidden />
                {AUTH_LABELS.COPY}
              </Button>
              {copyFeedback?.section === "activity" && (
                <Badge
                  variant={copyFeedback.status === "success" ? "default" : "destructive"}
                  className="text-xs"
                >
                  {copyFeedback.status === "success"
                    ? AUTH_LABELS.COPIED
                    : AUTH_LABELS.COPY_FAILED}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loadingActivity ? (
              <div className="space-y-2" aria-hidden>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : activityError ? (
              <p className="text-sm text-destructive py-4">
                {AUTH_LABELS.ACTIVITY_LOAD_ERROR}
              </p>
            ) : activityEvents.length === 0 ? (
              <ScrollArea className="h-[200px] rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[140px]">{AUTH_LABELS.LAST_ACTIVITY}</TableHead>
                      <TableHead>{AUTH_LABELS.SESSION_DEVICE}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={2} className="h-[160px]">
                        <Empty className="py-8">
                          <EmptyHeader>
                            <EmptyMedia variant="icon" aria-hidden>
                              <Activity className="size-5 text-muted-foreground" />
                            </EmptyMedia>
                            <EmptyTitle className="text-sm font-medium">
                              {AUTH_LABELS.ACTIVITY_TRAIL_EMPTY_TITLE}
                            </EmptyTitle>
                            <EmptyDescription className="text-xs">
                              {AUTH_LABELS.ACTIVITY_TRAIL_EMPTY_DESCRIPTION}
                            </EmptyDescription>
                          </EmptyHeader>
                        </Empty>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </ScrollArea>
            ) : (
              <ScrollArea className="h-[200px] rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[140px]">{AUTH_LABELS.LAST_ACTIVITY}</TableHead>
                      <TableHead>{AUTH_LABELS.SESSION_DEVICE}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activityEvents.map((ev) => (
                      <TableRow key={ev.id}>
                        <TableCell className="text-sm">
                          {formatLastActive(ev.createdAt)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {ev.action ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* What's been done + Copy per tab */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div className="space-y-1.5">
              <CardTitle>{AUTH_LABELS.SUMMARY_WHATS_DONE}</CardTitle>
              <CardDescription>
                {AUTH_LABELS.SUMMARY_WHATS_DONE_DESCRIPTION}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={AUTH_LABELS.APPROVALS} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value={AUTH_LABELS.APPROVALS} className="gap-1.5">
                  <CheckSquare className="size-3.5" aria-hidden />
                  {AUTH_LABELS.APPROVALS}
                </TabsTrigger>
                <TabsTrigger value={AUTH_LABELS.REQUESTS} className="gap-1.5">
                  <Send className="size-3.5" aria-hidden />
                  {AUTH_LABELS.REQUESTS}
                </TabsTrigger>
                <TabsTrigger value={AUTH_LABELS.TODO} className="gap-1.5">
                  <ListTodo className="size-3.5" aria-hidden />
                  {AUTH_LABELS.TODO}
                </TabsTrigger>
                <TabsTrigger value={AUTH_LABELS.DONE} className="gap-1.5">
                  <CircleCheck className="size-3.5" aria-hidden />
                  {AUTH_LABELS.DONE}
                </TabsTrigger>
              </TabsList>
              {([AUTH_LABELS.APPROVALS, AUTH_LABELS.REQUESTS, AUTH_LABELS.TODO, AUTH_LABELS.DONE] as const).map((tab) => (
                <TabsContent key={tab} value={tab} className="mt-4">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopySummarySection(tab)}
                        aria-label={`${AUTH_LABELS.COPY_SECTION} ${tab}`}
                      >
                        <Copy className="mr-1.5 size-4 shrink-0" aria-hidden />
                        {AUTH_LABELS.COPY}
                      </Button>
                      {copyFeedback?.section === tab && (
                        <Badge
                          variant={copyFeedback.status === "success" ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {copyFeedback.status === "success"
                            ? AUTH_LABELS.COPIED
                            : AUTH_LABELS.COPY_FAILED}
                        </Badge>
                      )}
                    </div>
                    <Empty className="min-h-32 border border-dashed rounded-lg py-8">
                      <EmptyHeader>
                        <EmptyMedia variant="icon" aria-hidden>
                          {tab === AUTH_LABELS.APPROVALS && <CheckSquare className="size-5 text-muted-foreground" />}
                          {tab === AUTH_LABELS.REQUESTS && <Send className="size-5 text-muted-foreground" />}
                          {tab === AUTH_LABELS.TODO && <ListTodo className="size-5 text-muted-foreground" />}
                          {tab === AUTH_LABELS.DONE && <CircleCheck className="size-5 text-muted-foreground" />}
                        </EmptyMedia>
                        <EmptyTitle className="text-sm font-medium">
                          {tab === AUTH_LABELS.APPROVALS && AUTH_LABELS.APPROVALS_EMPTY_TITLE}
                          {tab === AUTH_LABELS.REQUESTS && AUTH_LABELS.REQUESTS_EMPTY_TITLE}
                          {tab === AUTH_LABELS.TODO && AUTH_LABELS.TODO_EMPTY_TITLE}
                          {tab === AUTH_LABELS.DONE && AUTH_LABELS.DONE_EMPTY_TITLE}
                        </EmptyTitle>
                        <EmptyDescription className="text-xs">
                          {tab === AUTH_LABELS.APPROVALS && AUTH_LABELS.APPROVALS_EMPTY_DESCRIPTION}
                          {tab === AUTH_LABELS.REQUESTS && AUTH_LABELS.REQUESTS_EMPTY_DESCRIPTION}
                          {tab === AUTH_LABELS.TODO && AUTH_LABELS.TODO_EMPTY_DESCRIPTION}
                          {tab === AUTH_LABELS.DONE && AUTH_LABELS.DONE_EMPTY_DESCRIPTION}
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Export & utilities – redesigned */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{AUTH_LABELS.EXPORT_AND_UTILITIES}</CardTitle>
            <CardDescription>
              {AUTH_LABELS.EXPORT_AND_UTILITIES_DESCRIPTION}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Export: dropdown with JSON / Markdown */}
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {AUTH_LABELS.EXPORT_SUMMARY_JSON.replace(" (JSON)", "")}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between" disabled={signingOut}>
                      <Download className="mr-2 size-4 shrink-0" aria-hidden />
                      {AUTH_LABELS.EXPORT_SUMMARY_JSON.replace(" (JSON)", "…")}
                      <ChevronDown className="ml-2 size-4 shrink-0 opacity-50" aria-hidden />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuLabel>{AUTH_LABELS.EXPORT_SUMMARY_JSON.replace(" (JSON)", "")}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleExportJson}>
                      <Download className="mr-2 size-4" aria-hidden />
                      {AUTH_LABELS.EXPORT_SUMMARY_JSON}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportMarkdown}>
                      <Download className="mr-2 size-4" aria-hidden />
                      {AUTH_LABELS.EXPORT_SUMMARY_MARKDOWN}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Share to */}
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {AUTH_LABELS.SHARE_TO}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between" disabled={signingOut}>
                      <Share2 className="mr-2 size-4 shrink-0" aria-hidden />
                      {AUTH_LABELS.SHARE_TO}…
                      <ChevronDown className="ml-2 size-4 shrink-0 opacity-50" aria-hidden />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuLabel>{AUTH_LABELS.SHARE_TO}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled>
                      {AUTH_LABELS.SHARE_TO_TEAM_MEMBERS}
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled>
                      {AUTH_LABELS.SHARE_TO_TEAMS_SAME_TEAM}
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled>
                      {AUTH_LABELS.SHARE_TO_SAME_ORGANIZATION}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Save to personal DB */}
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {AUTH_LABELS.SAVE_TO_PERSONAL_DB}
                </span>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  disabled={signingOut}
                  title={AUTH_LABELS.SAVE_TO_PERSONAL_DB_DESCRIPTION}
                >
                  <Database className="mr-2 size-4 shrink-0" aria-hidden />
                  {AUTH_LABELS.SAVE_TO_PERSONAL_DB}
                </Button>
              </div>
            </div>

            {/* Success / fail badges */}
            <div className="flex flex-wrap items-center gap-2 border-t pt-4">
              {exportStatus && (
                <Badge
                  variant={exportStatus === "success" ? "default" : "destructive"}
                  className="font-normal"
                >
                  {exportStatus === "success"
                    ? AUTH_LABELS.ACTION_SUCCESS
                    : AUTH_LABELS.ACTION_FAIL}
                </Badge>
              )}
              {cacheStatus && (
                <Badge
                  variant={cacheStatus === "success" ? "default" : "destructive"}
                  className="font-normal"
                >
                  {cacheStatus === "success"
                    ? AUTH_LABELS.ACTION_SUCCESS
                    : AUTH_LABELS.ACTION_FAIL}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <AuthBrandSlogan className="mt-auto shrink-0 pb-6 pt-8" />
    </div>
  )
}
