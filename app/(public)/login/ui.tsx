"use client"

import * as React from "react"
import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { siteConfig } from "@/lib/config/site"
import { routes } from "@/lib/routes"
import { AlertCircleIcon, EyeIcon, EyeOffIcon, GithubIcon } from "lucide-react"

export function LoginClient() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") ?? routes.app.root()
  const [showPassword, setShowPassword] = React.useState(false)
  const [isPending, setIsPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [username, setUsername] = React.useState("admin")
  const [password, setPassword] = React.useState("admin")

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username.trim() || !password.trim()) {
      setError("Username and password are required")
      return
    }

    setIsPending(true)
    setError(null)

    try {
      const res = await signIn("credentials", {
        username,
        password,
        redirect: false,
        callbackUrl,
      })

      if (!res || res.error) {
        setError("Invalid credentials")
        return
      }

      toast.success("Successfully signed in!")
      window.location.assign(res.url ?? callbackUrl)
    } catch {
      setError("Authentication failed")
      toast.error("Authentication failed")
    } finally {
      setIsPending(false)
    }
  }

  const handleGitHubSignIn = () => {
    signIn("github", { callbackUrl })
  }
  return (
    <main className="mx-auto flex w-full max-w-sm flex-col gap-6 px-6 py-16">
      <Card size="sm" className="border-0 shadow-lg">
        <CardHeader className="space-y-1 border-b">
          <CardTitle className="text-2xl font-bold text-center">
            Sign in to {siteConfig.name}
          </CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertTitle>Authentication failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                disabled={isPending}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={isPending}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isPending}
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Spinner className="mr-2 h-4 w-4" />}
              {isPending ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              variant="outline"
              type="button"
              className="w-full"
              onClick={handleGitHubSignIn}
              disabled={isPending}
            >
              <GithubIcon className="mr-2 h-4 w-4" />
              GitHub
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p className="mb-2">
              Don&apos;t have an account?{" "}
              <Button variant="link" className="h-auto p-0">
                Sign up
              </Button>
            </p>
            <Button variant="link" className="h-auto p-0 text-sm">
              Forgot your password?
            </Button>
          </div>

          <div className="text-center text-xs text-muted-foreground border-t pt-4">
            <p>
              Dev credentials: <code className="bg-muted px-1 py-0.5 rounded">admin/admin</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

