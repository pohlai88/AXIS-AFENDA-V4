/**
 * @domain auth
 * @layer page
 * @responsibility Session finalize callback landing page for Neon Auth redirects
 *
 * This page is used as a stable, first-party landing location after:
 * - Email/password sign-in (callbackURL)
 * - OAuth sign-in (callbackURL)
 * - Email verification flows (callbackURL)
 *
 * It waits for the Neon Auth session cookie to become available, then redirects
 * the user to the intended internal destination (`next`).
 */

"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

import { routes } from "@/lib/routes"
import { authClient } from "@/lib/auth/client"
import { AuthShell } from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { AUTH_LABELS } from "@/lib/constants/auth"

function isSafeInternalPath(next: string | null): next is string {
  if (!next) return false
  return next.startsWith("/") && !next.startsWith("//")
}

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"finalizing" | "failed">("finalizing")

  const next = useMemo(() => {
    const param = searchParams.get("next")
    return isSafeInternalPath(param) ? param : routes.ui.orchestra.root()
  }, [searchParams])

  useEffect(() => {
    let cancelled = false

    async function finalize() {
      try {
        // Encourage the SDK to resolve the newly-issued session cookie immediately.
        // (Some environments need an explicit refresh after the OAuth redirect.)
        await authClient.getSession()

        const { data } = await authClient.getSession()
        if (cancelled) return

        if (data) {
          router.replace(next)
          return
        }

        // Give the cookie/session a brief moment to settle, then re-check.
        await new Promise((r) => setTimeout(r, 350))
        const retry = await authClient.getSession()
        if (cancelled) return

        if (retry.data) {
          router.replace(next)
          return
        }

        setStatus("failed")
      } catch {
        if (!cancelled) setStatus("failed")
      }
    }

    finalize()

    return () => {
      cancelled = true
    }
  }, [next, router])

  const loginHref = useMemo(() => {
    const base = routes.ui.auth.login()
    return next ? `${base}?next=${encodeURIComponent(next)}` : base
  }, [next])

  if (status === "failed") {
    return (
      <AuthShell
        title={AUTH_LABELS.FINISHING_SIGN_IN}
        description={AUTH_LABELS.CALLBACK_FAILED_DESCRIPTION}
      >
        <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">{AUTH_LABELS.TRY_THIS}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>{AUTH_LABELS.GO_BACK_SIGN_IN}</li>
            <li>{AUTH_LABELS.COOKIES_TIP}</li>
            <li>{AUTH_LABELS.REDIRECT_URL_TIP}</li>
          </ul>
        </div>

        <div className="grid gap-2">
          <Button asChild>
            <Link href={loginHref}>{AUTH_LABELS.BACK_TO_SIGN_IN}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={routes.ui.marketing.home()}>{AUTH_LABELS.GO_TO_HOME}</Link>
          </Button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title={AUTH_LABELS.FINISHING_SIGN_IN}
      description={AUTH_LABELS.FINALIZING_SESSION}
    >
      <div className="flex items-center justify-center py-6">
        <Spinner className="h-5 w-5" />
      </div>
      <p className="text-center text-sm text-muted-foreground">
        If you&apos;re not redirected automatically,{" "}
        <Link className="text-primary underline underline-offset-4" href={next}>
          {AUTH_LABELS.CONTINUE_LINK}
        </Link>
        .
      </p>
    </AuthShell>
  )
}
