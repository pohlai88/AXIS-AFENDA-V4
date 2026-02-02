"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { routes } from "@/lib/routes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { AuthShell } from "@/components/auth/auth-shell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"

export default function ResetPasswordClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const token = searchParams.get("token")

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token. Please request a new password reset.")
      const timeout = setTimeout(() => {
        router.push(routes.ui.auth.forgotPassword())
      }, 3000)
      return () => clearTimeout(timeout)
    }
  }, [token, router])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      if (password !== confirmPassword) {
        setError("Passwords do not match")
        setIsLoading(false)
        return
      }

      if (password.length < 8) {
        setError("Password must be at least 8 characters long")
        setIsLoading(false)
        return
      }

      const res = await fetch(routes.api.publicAuth.resetPassword(), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password }),
      })

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null
        setError(payload?.error || "Failed to reset password")
        return
      }

      toast({
        title: "Success",
        description: "Your password has been reset successfully. Redirecting to login...",
      })
      setSuccess(true)

      setTimeout(() => {
        router.push(routes.ui.auth.login())
      }, 2000)
    } catch {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (error && !token) {
    return (
      <AuthShell title="Reset link invalid" description="Request a new reset link to continue.">
        <Alert variant="destructive">
          <AlertTitle>Invalid reset link</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="text-sm text-muted-foreground text-center">
          Redirecting to password recovery…
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Create a new password" description="Choose a strong password for your account.">
      {success ? (
        <Alert>
          <AlertTitle>Password updated</AlertTitle>
          <AlertDescription>Redirecting you to sign in…</AlertDescription>
        </Alert>
      ) : null}

      {isLoading ? (
        <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
          <Spinner className="size-5" />
          <div className="text-sm text-muted-foreground">Updating password…</div>
        </div>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Could not reset password</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <form onSubmit={handleResetPassword} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading || success}
            required
            minLength={8}
          />
          <p className="text-xs text-muted-foreground">Must be at least 8 characters long</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm password</Label>
          <Input
            id="confirm-password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading || success}
            required
            minLength={8}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading || success}>
          {isLoading ? "Resetting…" : "Reset password"}
        </Button>
      </form>
    </AuthShell>
  )
}

