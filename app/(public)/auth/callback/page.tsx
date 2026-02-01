"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { AuthShell } from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { routes } from "@/lib/routes"

type Status = "loading" | "success" | "error"

function isSafeInternalPath(next: string | null): next is string {
  if (!next) return false
  // Prevent open redirects: only allow same-origin relative paths.
  return next.startsWith("/") && !next.startsWith("//")
}

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<Status>("loading")
  const [message, setMessage] = useState<string>("Finalizing your sign-in…")

  const verifier = searchParams.get("neon_auth_session_verifier")

  const next = useMemo(() => {
    const param = searchParams.get("next")
    return isSafeInternalPath(param) ? param : routes.app.root()
  }, [searchParams])

  const didStart = useRef(false)

  useEffect(() => {
    if (didStart.current) return
    didStart.current = true

    let cancelled = false

    async function pollSession() {
      // Try a short polling window to let Neon Auth finish exchanging/verifying.
      // This gives a deterministic "enterprise" sequence instead of dropping users
      // onto random pages with transient query params.
      const maxAttempts = 30
      const delayMs = 200

      for (let i = 0; i < maxAttempts; i++) {
        if (cancelled) return

        try {
          const res = await fetch("/api/auth/get-session", { credentials: "include" })
          if (res.ok) {
            const data = (await res.json()) as unknown
            // `@neondatabase/auth` returns { user, session } (or null-ish) when signed out.
            if (data && typeof data === "object" && "user" in data && data.user) {
              setStatus("success")
              setMessage("Signed in. Redirecting…")
              router.replace(next)
              return
            }
          }
        } catch {
          // ignore and continue polling
        }

        await new Promise((r) => setTimeout(r, delayMs))
      }

      if (cancelled) return
      setStatus("error")
      setMessage("We couldn’t finalize your session. Please try signing in again.")
    }

    pollSession()
    return () => {
      cancelled = true
    }
  }, [router, next])

  return (
    <AuthShell title="Signing you in" description="Please wait while we verify your session.">
      <div className="flex items-start gap-3 rounded-lg border bg-card p-4">
        <Spinner className="mt-0.5 size-5" />
        <div className="space-y-1">
          <p className="text-sm font-medium">{message}</p>
          {verifier ? (
            <p className="text-xs text-muted-foreground">
              Security check in progress.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              This usually takes a moment.
            </p>
          )}
        </div>
      </div>

      {status === "error" ? (
        <>
          <Alert variant="destructive">
            <AlertTitle>Sign-in not completed</AlertTitle>
            <AlertDescription>
              {message} If this keeps happening, your Neon compute may be waking from scale-to-zero.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => router.replace(routes.public.login())}>
              Back to Sign in
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </>
      ) : null}
    </AuthShell>
  )
}

