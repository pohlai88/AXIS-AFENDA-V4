/**
 * @domain auth
 * @layer ui
 * @responsibility UI route entrypoint for /forgot-password
 */

"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { routes } from "@/lib/routes"
import { AuthShell } from "@/components/auth/auth-shell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/lib/client/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { apiFetch } from "@/lib/api/client"
import {
  ForgotPasswordSchema,
  forgotPasswordResponseSchema,
  type ForgotPasswordInput,
} from "@/lib/contracts/auth"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { FormError } from "@/components/auth"

type Status = "idle" | "submitting" | "success" | "error"

export default function ForgotPasswordPage() {
  const { isAuthenticated, isLoading: isSessionLoading } = useAuth()
  const [status, setStatus] = useState<Status>("idle")
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const redirectTo = useMemo(() => {
    if (typeof window === "undefined") return ""
    return `${window.location.origin}${routes.ui.auth.resetPassword()}`
  }, [])

  const form = useForm<ForgotPasswordInput>({
    // NOTE: Resolver typing expects a single zod instance; this repo uses Zod v4.
    // Cast is intentional to avoid versioned-type mismatches in resolver generics.
    resolver: zodResolver(ForgotPasswordSchema as unknown as never) as unknown as Resolver<ForgotPasswordInput>,
    defaultValues: { email: "" },
  })

  const isPending = form.formState.isSubmitting || status === "submitting"

  useEffect(() => {
    if (!isSessionLoading && isAuthenticated) {
      // If already signed in, no need to reset password here.
      window.location.assign(routes.ui.orchestra.root())
    }
  }, [isAuthenticated, isSessionLoading])

  return (
    <AuthShell title="Reset password" description="We will email you a secure reset link.">
      {isSessionLoading ? (
        <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
          <Spinner className="size-5" />
          <div className="text-sm text-muted-foreground">Checking session…</div>
        </div>
      ) : null}

      {status === "success" ? (
        <Alert>
          <AlertTitle>Check your email</AlertTitle>
          <AlertDescription>
            If an account exists for <span className="font-medium">{submittedEmail}</span>, we sent a password reset link.
          </AlertDescription>
        </Alert>
      ) : null}

      {status === "error" ? (
        <FormError title="Could not send reset link" message={errorMessage} />
      ) : null}

      {status !== "success" ? (
        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(async (values) => {
              setErrorMessage(null)
              setStatus("submitting")
              try {
                await apiFetch(
                  routes.api.publicAuth.forgotPassword(),
                  {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ email: values.email, redirectTo }),
                  },
                  forgotPasswordResponseSchema
                )

                setSubmittedEmail(values.email)
                form.reset()
                setStatus("success")
              } catch (err) {
                setErrorMessage(
                  err instanceof Error
                    ? err.message
                    : "An unexpected error occurred. Please try again."
                )
                setStatus("error")
              }
            })}
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="you@company.com"
                      autoComplete="email"
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        </Form>
      ) : null}

      <div className="text-center text-sm text-muted-foreground">
        Remember your password?{" "}
        <Link href={routes.ui.auth.login()} className="text-primary hover:underline font-medium">
          Sign in
        </Link>
      </div>
    </AuthShell>
  )
}

