"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { authClient } from "@/lib/auth/client"
import { routes } from "@/lib/routes"
import { getPublicEnv } from "@/lib/env/public"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { GitHubLogoIcon } from "@radix-ui/react-icons"
import HCaptcha from "@hcaptcha/react-hcaptcha"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AuthShell } from "@/components/auth/auth-shell"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/lib/client/hooks/useAuth"

type Status = "idle" | "submitting" | "redirecting"

function isSafeInternalPath(next: string | null): next is string {
  if (!next) return false
  return next.startsWith("/") && !next.startsWith("//")
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { isLoading: isSessionLoading, isAuthenticated } = useAuth()
  const [status, setStatus] = useState<Status>("idle")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [requiresCaptcha, setRequiresCaptcha] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { NEXT_PUBLIC_HCAPTCHA_SITE_KEY } = getPublicEnv()

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

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setStatus("submitting")

    if (requiresCaptcha && !captchaToken) {
      toast({
        variant: "destructive",
        title: "Verification Required",
        description: "Please complete the CAPTCHA verification.",
      })
      setStatus("idle")
      return
    }

    try {
      const { error, data } = await authClient.signIn.email({
        email,
        password,
        callbackURL: routes.ui.auth.authCallback(next),
        fetchOptions: captchaToken
          ? {
            headers: {
              "x-captcha-token": captchaToken,
            },
          }
          : undefined,
      })

      if (error) {
        const message = error.message || "Invalid email or password"
        const requiresCaptchaNext = message.toLowerCase().includes("captcha") || message.toLowerCase().includes("too many")
        if (requiresCaptchaNext) {
          setRequiresCaptcha(true)
        }
        setErrorMessage(message)
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: message,
        })
        setStatus("idle")
        return
      }

      // Redirect happens automatically via callbackURL
      setStatus("redirecting")
    } catch (err) {
      setErrorMessage("An unexpected error occurred")
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      })
      setStatus("idle")
    } finally {
      // keep status during redirects
      if (status !== "redirecting") setStatus("idle")
    }
  }

  const handleSocialLogin = async (provider: "github" | "google") => {
    setErrorMessage(null)
    setStatus("redirecting")
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: routes.ui.auth.authCallback(next),
      })
      // Social login will redirect, so we don't need to navigate manually
    } catch (err) {
      setErrorMessage(`Failed to login with ${provider}`)
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to login with ${provider}`,
      })
      setStatus("idle")
    }
  }

  return (
    <AuthShell title="Sign in" description="Access your workspace securely.">
      {isSessionLoading ? (
        <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
          <Spinner className="size-5" />
          <div className="text-sm text-muted-foreground">Checking session…</div>
        </div>
      ) : null}

      {errorMessage ? (
        <Alert variant="destructive">
          <AlertTitle>Sign-in failed</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      {status === "redirecting" ? (
        <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
          <Spinner className="size-5" />
          <div className="text-sm text-muted-foreground">Redirecting to finalize sign-in…</div>
        </div>
      ) : null}

      {/* Email Login Form */}
      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isBusy}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isBusy}>
          {status === "submitting" ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      {requiresCaptcha && NEXT_PUBLIC_HCAPTCHA_SITE_KEY && (
        <div className="rounded-md border border-muted-foreground/20 p-3">
          <HCaptcha
            sitekey={NEXT_PUBLIC_HCAPTCHA_SITE_KEY}
            onVerify={(token) => setCaptchaToken(token)}
            onExpire={() => setCaptchaToken(null)}
          />
        </div>
      )}

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-muted-foreground/20" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      {/* Social Login Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSocialLogin("github")}
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
          onClick={() => handleSocialLogin("google")}
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

      {/* Forgot Password Link */}
      <div className="text-center text-sm">
        <Link
          href={routes.ui.auth.forgotPassword()}
          className="text-primary hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      {/* Sign Up Link */}
      <div className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href={routes.ui.auth.register()}
          className="text-primary hover:underline font-medium"
        >
          Sign up
        </Link>
      </div>
    </AuthShell>
  )
}

