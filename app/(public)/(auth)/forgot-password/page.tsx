"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"

import { routes } from "@/lib/routes"
import { AuthShell } from "@/components/auth/auth-shell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { authClient } from "@/lib/auth/client"
import { useAuth } from "@/lib/client/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Status = "idle" | "submitting" | "success" | "error"

export default function ForgotPasswordPage() {
  const { isAuthenticated, isLoading: isSessionLoading } = useAuth()
  const [status, setStatus] = useState<Status>("idle")
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [email, setEmail] = useState("")

  const redirectTo = useMemo(() => {
    if (typeof window === "undefined") return ""
    return `${window.location.origin}${routes.ui.auth.resetPassword()}`
  }, [])

  useEffect(() => {
    if (!isSessionLoading && isAuthenticated) {
      // If already signed in, no need to reset password here.
      window.location.assign(routes.ui.orchestra.root())
    }
  }, [isAuthenticated, isSessionLoading])

  return (
    <AuthShell title="Reset password" description="We will email you a secure reset link.">
      {isSessionLoading ? (
        <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
          <Spinner className="size-5" />
          <div className="text-sm text-muted-foreground">Checking session…</div>
        </div>
      ) : null}

      {status === "success" ? (
        <Alert>
          <AlertTitle>Check your email</AlertTitle>
          <AlertDescription>
            If an account exists for <span className="font-medium">{submittedEmail}</span>, we sent a password reset link.
          </AlertDescription>
        </Alert>
      ) : null}

      {status === "error" && errorMessage ? (
        <Alert variant="destructive">
          <AlertTitle>Could not send reset link</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      {status !== "success" ? (
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault()
            setErrorMessage(null)
            setStatus("submitting")
            try {
              const { error } = await authClient.requestPasswordReset({
                email,
                redirectTo,
              })
              if (error) {
                setErrorMessage(error.message || "Could not send reset link")
                setStatus("error")
                return
              }
              setSubmittedEmail(email)
              setEmail("")
              setStatus("success")
            } catch {
              setErrorMessage("An unexpected error occurred. Please try again.")
              setStatus("error")
            }
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={status === "submitting"}
            />
          </div>
          <Button type="submit" className="w-full" disabled={status === "submitting"}>
            {status === "submitting" ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      ) : null}

      <div className="text-center text-sm text-muted-foreground">
        Remember your password?{" "}
        <Link href={routes.ui.auth.login()} className="text-primary hover:underline font-medium">
          Sign in
        </Link>
      </div>
    </AuthShell>
  )
}

