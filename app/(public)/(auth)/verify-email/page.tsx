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
import {
  AUTH_LABELS,
  AUTH_ALERT_TITLES,
} from "@/lib/constants/auth"

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
    <AuthShell
      title={AUTH_LABELS.VERIFY_EMAIL}
      description={AUTH_LABELS.VERIFY_EMAIL_DESCRIPTION}
    >
      <div className="flex items-start gap-3 rounded-lg border bg-card p-4">
        <Mail className="mt-0.5 h-5 w-5 text-muted-foreground" />
        <div className="space-y-1">
          <div className="text-sm font-medium">{AUTH_LABELS.VERIFICATION_REQUIRED}</div>
          <div className="text-sm text-muted-foreground">
            {AUTH_LABELS.OPEN_VERIFICATION_EMAIL}
          </div>
        </div>
      </div>

      {status === "sent" ? (
        <Alert>
          <AlertTitle>{AUTH_ALERT_TITLES.EMAIL_SENT}</AlertTitle>
          <AlertDescription>{message ?? AUTH_LABELS.CHECK_INBOX}</AlertDescription>
        </Alert>
      ) : null}

      {status === "error" ? (
        <FormError
          title={AUTH_ALERT_TITLES.COULD_NOT_SEND_EMAIL}
          message={message ?? AUTH_LABELS.TRY_AGAIN_MOMENT}
        />
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
              setMessage(AUTH_LABELS.VERIFICATION_EMAIL_SENT)
            } catch (err) {
              setStatus("error")
              setMessage(
                err instanceof Error ? err.message : AUTH_LABELS.VERIFICATION_EMAIL_FAILED
              )
            }
          })}
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem idBase="auth-verify-email-email">
                <FormControl>
                  <Input
                    {...field}
                    placeholder={AUTH_LABELS.EMAIL_PLACEHOLDER_ALT}
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
                {AUTH_LABELS.SENDING}
              </>
            ) : (
              AUTH_LABELS.RESEND_VERIFICATION_EMAIL
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
          {AUTH_LABELS.GO_TO_SIGN_IN}
        </Button>
      </div>
    </AuthShell>
  )
}

