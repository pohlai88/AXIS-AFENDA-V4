"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  IconDeviceDesktop,
  IconDeviceMobile,
  IconDeviceTablet,
  IconMapPin,
  IconClock,
  IconCircleCheck,
  IconTrash,
  IconAlertTriangle,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { apiFetch } from "@/lib/api/client"
import { routes } from "@/lib/routes"
import {
  sessionListResponseSchema,
  revokeSessionResponseSchema,
  revokeAllSessionsResponseSchema,
  type SessionResponse,
} from "@/lib/contracts/sessions"

function getDeviceIcon(device: string) {
  if (device === "Mobile") return <IconDeviceMobile className="h-4 w-4" />
  if (device === "Tablet") return <IconDeviceTablet className="h-4 w-4" />
  return <IconDeviceDesktop className="h-4 w-4" />
}

function formatLastActive(lastActive: string): string {
  const date = new Date(lastActive)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
}

function formatExpires(expires: string): string {
  const date = new Date(expires)
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export default function SessionsPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [sessions, setSessions] = React.useState<SessionResponse[]>([])
  const [loading, setLoading] = React.useState(true)
  const [revoking, setRevoking] = React.useState<string | null>(null)
  const [showRevokeAllDialog, setShowRevokeAllDialog] = React.useState(false)

  // Load sessions on mount
  React.useEffect(() => {
    loadSessions()
  }, [])

  async function loadSessions() {
    try {
      setLoading(true)
      const response = await apiFetch(
        routes.api.sessions.list(),
        {},
        sessionListResponseSchema
      )
      setSessions(response.sessions)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load sessions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function revokeSession(sessionId: string) {
    try {
      setRevoking(sessionId)
      await apiFetch(
        routes.api.sessions.byId(sessionId),
        { method: "DELETE" },
        revokeSessionResponseSchema
      )

      toast({
        title: "Session Revoked",
        description: "The session has been successfully revoked.",
      })

      // Reload sessions
      await loadSessions()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to revoke session",
        variant: "destructive",
      })
    } finally {
      setRevoking(null)
    }
  }

  async function revokeAllOtherSessions() {
    try {
      setLoading(true)
      const response = await apiFetch(
        routes.api.sessions.list(),
        { method: "DELETE" },
        revokeAllSessionsResponseSchema
      )

      toast({
        title: "Sessions Revoked",
        description: response.message,
      })

      // Reload sessions
      await loadSessions()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to revoke sessions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setShowRevokeAllDialog(false)
    }
  }

  const currentSession = sessions.find((s) => s.isCurrent)
  const otherSessions = sessions.filter((s) => !s.isCurrent)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Active Sessions</h1>
        <p className="text-muted-foreground mt-2">
          Manage your active sessions across all devices. You can revoke access from any
          device at any time.
        </p>
      </div>

      {/* Current Session */}
      {currentSession && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconCircleCheck className="h-5 w-5 text-green-600" />
              Current Session
            </CardTitle>
            <CardDescription>This is the session you&apos;re using right now</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-2">
                {getDeviceIcon(currentSession.device)}
                <div>
                  <div className="font-medium">{currentSession.browser}</div>
                  <div className="text-sm text-muted-foreground">
                    {currentSession.device} • {currentSession.os}
                  </div>
                </div>
              </div>
              {currentSession.ipAddress && (
                <div className="flex items-center gap-2">
                  <IconMapPin className="h-4 w-4 text-muted-foreground" />
                  <div className="text-sm">{currentSession.ipAddress}</div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <IconClock className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  Last active: {formatLastActive(currentSession.lastActive)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <IconAlertTriangle className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">Expires: {formatExpires(currentSession.expires)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Other Sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Other Sessions</CardTitle>
              <CardDescription>
                Sessions on other devices or browsers
                {otherSessions.length > 0 && ` (${otherSessions.length})`}
              </CardDescription>
            </div>
            {otherSessions.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowRevokeAllDialog(true)}
                disabled={loading}
              >
                <IconTrash className="mr-2 h-4 w-4" />
                Revoke All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading sessions...
            </div>
          ) : otherSessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No other active sessions
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {otherSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(session.device)}
                        <div>
                          <div className="font-medium">{session.browser}</div>
                          <div className="text-sm text-muted-foreground">
                            {session.device} • {session.os}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {session.ipAddress || "Unknown"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatLastActive(session.lastActive)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {formatExpires(session.expires)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => revokeSession(session.id)}
                        disabled={revoking === session.id}
                      >
                        <IconTrash className="mr-2 h-4 w-4" />
                        {revoking === session.id ? "Revoking..." : "Revoke"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Revoke All Confirmation Dialog */}
      <AlertDialog open={showRevokeAllDialog} onOpenChange={setShowRevokeAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke All Other Sessions?</AlertDialogTitle>
            <AlertDialogDescription>
              This will sign you out from all other devices and browsers. Your current
              session will remain active. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={revokeAllOtherSessions}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revoke All Sessions
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
