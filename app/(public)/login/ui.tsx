"use client"

import * as React from "react"
import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LoginClient() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") ?? "/app"

  const [username, setUsername] = React.useState("admin")
  const [password, setPassword] = React.useState("admin")
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  return (
    <main className="mx-auto flex w-full max-w-sm flex-col gap-6 px-6 py-16">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-muted-foreground text-sm">
          Dev credentials are enabled. Default is <code>admin/admin</code>.
        </p>
      </div>

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

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </main>
  )
}

