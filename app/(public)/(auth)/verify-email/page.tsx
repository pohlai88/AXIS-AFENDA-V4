/**
 * @domain auth
 * @layer ui
 * @responsibility UI route entrypoint for /verify-email
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
import { useAuthUIStore } from '@/stores/auth-ui'
import { apiFetch } from '@/lib/api/client'
import {
  ResendVerificationSchema,
  verifyEmailResponseSchema,
  type ResendVerificationInput,
} from '@/lib/contracts/auth'
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { FormError } from "@/components/auth"

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { verifyingEmail } = useAuthUIStore()
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [message, setMessage] = useState<string | null>(null)

  const initialEmail = useMemo(() => {
    try {
      return (verifyingEmail || localStorage.getItem("afenda.lastRegisteredEmail")) ?? ""
    } catch {
      return ""
    }
  }, [verifyingEmail])

  const next = useMemo(() => {
    const param = searchParams.get("next")
    return param && param.startsWith("/") && !param.startsWith("//")
      ? param
      : routes.ui.orchestra.root()
  }, [searchParams])

  const form = useForm<ResendVerificationInput>({
    // NOTE: Resolver typing expects a single zod instance; this repo uses Zod v4.
    // Cast is intentional to avoid versioned-type mismatches in resolver generics.
    resolver: zodResolver(ResendVerificationSchema as unknown as never) as unknown as Resolver<ResendVerificationInput>,
    defaultValues: { email: initialEmail },
  })

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
        <FormError title="Could not send email" message={message ?? "Please try again in a moment."} />
      ) : null}

      <Form {...form}>
        <form
          className="space-y-3"
          onSubmit={form.handleSubmit(async (values) => {
            setStatus("sending")
            setMessage(null)
            try {
              await apiFetch(
                routes.api.publicAuth.verifyEmailResend(),
                {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({
                    email: values.email,
                    callbackURL: routes.ui.auth.authCallback(next),
                  }),
                },
                verifyEmailResponseSchema
              )

              setStatus("sent")
              setMessage("Verification email sent. Please check your inbox.")
            } catch (err) {
              setStatus("error")
              setMessage(err instanceof Error ? err.message : "Failed to send verification email.")
            }
          })}
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="you@company.com"
                    type="email"
                    autoComplete="email"
                    disabled={status === "sending"}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
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
      </Form>

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

