/**
 * Email Verification Page
 * 
 * Displays verification status after user clicks email verification link.
 * Enterprise UI: provides a clear "check inbox" + "resend" experience.
 * 
 * @route /verify-email
 */

'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Mail, Loader2 } from 'lucide-react'
import { AuthShell } from '@/components/auth/auth-shell'
import { routes } from '@/lib/routes'
import { Input } from '@/components/ui/input'
import { authClient } from '@/lib/auth/client'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem("afenda.lastRegisteredEmail") ?? ""
    } catch {
      return ""
    }
  })
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [message, setMessage] = useState<string | null>(null)

  const next = useMemo(() => {
    const param = searchParams.get("next")
    return param && param.startsWith("/") && !param.startsWith("//")
      ? param
      : routes.ui.orchestra.root()
  }, [searchParams])

  return (
    <AuthShell title="Verify your email" description="Check your inbox for a verification email.">
      <div className="flex items-start gap-3 rounded-lg border bg-card p-4">
        <Mail className="mt-0.5 h-5 w-5 text-muted-foreground" />
        <div className="space-y-1">
          <div className="text-sm font-medium">Verification required</div>
          <div className="text-sm text-muted-foreground">
            Open the email we sent and click the verification link to continue.
          </div>
        </div>
      </div>

      {status === "sent" ? (
        <Alert>
          <AlertTitle>Email sent</AlertTitle>
          <AlertDescription>{message ?? "Please check your inbox."}</AlertDescription>
        </Alert>
      ) : null}

      {status === "error" ? (
        <Alert variant="destructive">
          <AlertTitle>Could not send email</AlertTitle>
          <AlertDescription>{message ?? "Please try again in a moment."}</AlertDescription>
        </Alert>
      ) : null}

      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault()
          setStatus("sending")
          setMessage(null)
          try {
            const { error, data } = await authClient.sendVerificationEmail({
              email,
              callbackURL: routes.ui.auth.authCallback(next),
            })
            if (error) {
              setStatus("error")
              setMessage(error.message || "Failed to send verification email.")
              return
            }
            setStatus("sent")
            setMessage("Verification email sent. Please check your inbox.")
          } catch {
            setStatus("error")
            setMessage("Failed to send verification email.")
          }
        }}
      >
        <Input
          placeholder="you@company.com"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={status === "sending"}
        />
        <Button type="submit" className="w-full" disabled={status === "sending"}>
          {status === "sending" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending…
            </>
          ) : (
            "Resend verification email"
          )}
        </Button>
      </form>

      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push(routes.ui.auth.login())}
        >
          Go to sign in
        </Button>
      </div>
    </AuthShell>
  )
}

