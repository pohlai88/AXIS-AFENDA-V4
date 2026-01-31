"use client"

import * as React from "react"
import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { routes } from "@/lib/routes"
import { siteConfig } from "@/lib/config/site"
import { AlertCircleIcon, EyeIcon, EyeOffIcon, GithubIcon } from "lucide-react"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
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
    <div className={className} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Login to your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Sign in to <span className="font-medium text-foreground">{siteConfig.name}</span>
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircleIcon className="size-4" />
            <AlertTitle>Authentication failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="username">Username</FieldLabel>
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
          </Field>

          <Field>
            <div className="flex items-center">
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Button
                type="button"
                variant="link"
                className="ml-auto h-auto p-0 text-sm"
              >
                Forgot your password?
              </Button>
            </div>
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
          </Field>

          <Field>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Spinner className="mr-2 size-4" />}
              {isPending ? "Signing in…" : "Sign in"}
            </Button>
          </Field>
        </form>

        <FieldSeparator>Or continue with</FieldSeparator>

        <Field>
          <Button
            variant="outline"
            type="button"
            className="w-full"
            onClick={handleGitHubSignIn}
            disabled={isPending}
          >
            <GithubIcon className="mr-2 size-4" />
            Login with GitHub
          </Button>

          <FieldDescription className="text-center">
            Don&apos;t have an account?{" "}
            <Button variant="link" className="h-auto p-0">
              Sign up
            </Button>
          </FieldDescription>

          <FieldDescription className="text-xs text-center text-muted-foreground">
            Dev credentials: <code className="bg-muted px-1 py-0.5 rounded">admin/admin</code>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </div>
  )
}
