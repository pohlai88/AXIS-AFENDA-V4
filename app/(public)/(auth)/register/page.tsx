/**
 * @domain auth
 * @layer ui
 * @responsibility UI route entrypoint for /register
 */

"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { authClient } from "@/lib/auth/client"
import { routes } from "@/lib/routes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Mail } from "lucide-react"
import { GitHubLogoIcon } from "@radix-ui/react-icons"
import { AuthShell } from "@/components/auth/auth-shell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/lib/client/hooks/useAuth"

type Status = "idle" | "submitting" | "redirecting"

function isSafeInternalPath(next: string | null): next is string {
  if (!next) return false
  return next.startsWith("/") && !next.startsWith("//")
}

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { isLoading: isSessionLoading, isAuthenticated } = useAuth()
  const [status, setStatus] = useState<Status>("idle")
  const [showVerificationMessage, setShowVerificationMessage] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const next = useMemo(() => {
    const param = searchParams.get("next")
    return isSafeInternalPath(param) ? param : routes.ui.orchestra.root()
  }, [searchParams])

  useEffect(() => {
    if (isSessionLoading) return
    if (isAuthenticated) {
      router.replace(next)
    }
  }, [isAuthenticated, isSessionLoading, next, router])

  const isBusy = status !== "idle"

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setStatus("submitting")

    if (formData.password !== formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords don't match",
        description: "Please make sure your passwords match",
      })
      setStatus("idle")
      return
    }

    if (formData.password.length < 8) {
      toast({
        variant: "destructive",
        title: "Password too short",
        description: "Password must be at least 8 characters long",
      })
      setStatus("idle")
      return
    }

    try {
      const { data, error } = await authClient.signUp.email({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        callbackURL: routes.ui.auth.authCallback(next),
      })

      if (error) {
        setErrorMessage(error.message || "Could not create account")
        toast({
          variant: "destructive",
          title: "Signup Failed",
          description: error.message || "Could not create account",
        })
        setStatus("idle")
        return
      }

      // Send Neon Auth verification email (requiredEmailVerification is enabled in Neon)
      if (data?.user) {
        setRegisteredEmail(formData.email)
        try {
          localStorage.setItem("afenda.lastRegisteredEmail", formData.email.toLowerCase())
        } catch {
          // ignore storage failures
        }

        // Request verification email be sent by Neon Auth.
        // The verification link is handled by `/api/auth/verify-email` (auth.handler()).
        authClient
          .sendVerificationEmail({
            email: formData.email,
            callbackURL: routes.ui.auth.authCallback(next),
          })
          .catch((err) => {
            console.error("Failed to send Neon verification email:", err)
          })

        // Show verification message instead of redirecting
        setShowVerificationMessage(true)
      } else {
        toast({
          title: "Success",
          description: "Account created! Signing you in...",
        })
      }
    } catch (err) {
      setErrorMessage("An unexpected error occurred")
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      })
    } finally {
      if (status !== "redirecting") setStatus("idle")
    }
  }

  const handleSocialSignUp = async (provider: "github" | "google") => {
    setErrorMessage(null)
    setStatus("redirecting")
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: routes.ui.auth.authCallback(next),
      })
      // Social login will redirect
    } catch (err) {
      setErrorMessage(`Failed to sign up with ${provider}`)
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to sign up with ${provider}`,
      })
      setStatus("idle")
    }
  }

  // Show verification message after successful registration
  if (showVerificationMessage) {
    return (
      <AuthShell title="Verify your email" description="We’ve sent a verification link to your inbox.">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-purple-100 to-blue-100">
          <Mail className="h-8 w-8 text-purple-600" />
        </div>
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 text-center">
          <p className="font-semibold text-purple-900">{registeredEmail}</p>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>Next steps:</strong>
          </p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Open your email inbox</li>
            <li>Click the verification link in the email</li>
            <li>Return here to sign in</li>
          </ol>
        </div>

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <p className="text-xs text-blue-800">
            💡 <strong>Tip:</strong> Check your spam folder if you don&apos;t see the email within a few minutes.
          </p>
        </div>

        <div className="space-y-2">
          <Button
            onClick={() => router.push(routes.ui.auth.login())}
            className="w-full"
          >
            Go to Sign In
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              try {
                await authClient.sendVerificationEmail({
                  email: registeredEmail,
                  callbackURL: routes.ui.auth.authCallback(next),
                })
                toast({
                  title: "Verification email sent",
                  description: "Please check your inbox.",
                })
              } catch {
                toast({
                  variant: "destructive",
                  title: "Could not resend email",
                  description: "Please try again in a moment.",
                })
              }
            }}
            className="w-full"
          >
            Resend verification email
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowVerificationMessage(false)}
            className="w-full"
          >
            Back to Registration
          </Button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Create account" description="Set up your workspace and get started.">
      {isSessionLoading ? (
        <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
          <Spinner className="size-5" />
          <div className="text-sm text-muted-foreground">Checking session…</div>
        </div>
      ) : null}

      {errorMessage ? (
        <Alert variant="destructive">
          <AlertTitle>Sign-up failed</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      {status === "redirecting" ? (
        <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
          <Spinner className="size-5" />
          <div className="text-sm text-muted-foreground">Redirecting to finalize sign-in…</div>
        </div>
      ) : null}

      {/* Email Signup Form */}
      <form onSubmit={handleEmailSignUp} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            disabled={isBusy}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            disabled={isBusy}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            disabled={isBusy}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm Password</Label>
          <Input
            id="confirm-password"
            type="password"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            required
            disabled={isBusy}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isBusy}>
          {status === "submitting" ? "Creating account…" : "Create account"}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-muted-foreground/20" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Or sign up with</span>
        </div>
      </div>

      {/* Social Signup Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSocialSignUp("github")}
          disabled={isBusy}
          className="flex items-center gap-2"
        >
          <div className="flex items-center justify-center">
            <GitHubLogoIcon className="size-4" />
          </div>
          GitHub
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSocialSignUp("google")}
          disabled={isBusy}
          className="flex items-center gap-2"
        >
          <div className="flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-4" fill="currentColor">
              <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
            </svg>
          </div>
          Google
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        By clicking continue, you agree to our{" "}
        <Link href={routes.ui.marketing.terms()} className="underline hover:text-foreground">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href={routes.ui.marketing.privacy()} className="underline hover:text-foreground">
          Privacy Policy
        </Link>
        .
      </p>

      {/* Sign In Link */}
      <div className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={routes.ui.auth.login()}
          className="text-primary hover:underline font-medium"
        >
          Sign in
        </Link>
      </div>
    </AuthShell>
  )
}

