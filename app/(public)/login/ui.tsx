"use client"

import * as React from "react"
import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"

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
import { AlertCircleIcon } from "lucide-react"

export function LoginClient() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") ?? routes.app.root()

  const [username, setUsername] = React.useState("admin")
  const [password, setPassword] = React.useState("admin")
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  return (
    <main className="mx-auto flex w-full max-w-sm flex-col gap-6 px-6 py-16">
      <Card size="sm">
        <CardHeader className="border-b">
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Sign in to <span className="font-medium text-foreground">{siteConfig.name}</span>.
            <br />
            Dev credentials are enabled locally: <code>admin/admin</code> (override via{" "}
            <code>DEV_AUTH_USERNAME</code> / <code>DEV_AUTH_PASSWORD</code>).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <Alert variant="destructive">
              <AlertCircleIcon />
              <AlertTitle>Sign in failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault()
              setPending(true)
              setError(null)
              const res = await signIn("credentials", {
                username,
                password,
                redirect: false,
                callbackUrl,
              })
              setPending(false)
              if (!res || res.error) {
                setError("Invalid credentials")
                return
              }
              window.location.assign(res.url ?? callbackUrl)
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? <Spinner className="mr-2 size-4" /> : null}
              {pending ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}

