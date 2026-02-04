/**
 * @domain auth
 * @layer ui
 * @responsibility UI route entrypoint for /register
 * 
 * Uses react-hook-form + Zod for validation, enterprise components for UI,
 * and Zustand for OAuth and email verification tracking.
 */

"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { RegisterInput } from "@/lib/contracts/auth"
import { RegisterSchema } from "@/lib/contracts/auth"
import { AUTH_LABELS, AUTH_ERRORS, AUTH_PAGE_DESCRIPTIONS } from "@/lib/constants/auth"
import { authClient } from "@/lib/auth/client"
import { routes } from "@/lib/routes"
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  Form,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { AuthShell } from "@/components/auth/auth-shell"
import { FormError, OAuthButton } from "@/components/auth"
import { useAuth } from "@/lib/client/hooks/useAuth"
import { useAuthUIStore } from "@/stores/auth-ui"

function isSafeInternalPath(next: string | null): next is string {
  if (!next) return false
  return next.startsWith("/") && !next.startsWith("//")
}

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isLoading: isSessionLoading, isAuthenticated } = useAuth()
  const { oauthPending, setOAuthPending, setVerifyingEmail } =
    useAuthUIStore()
  const [showVerificationMessage, setShowVerificationMessage] =
    useState(false)
  const [verifiedEmail, setVerifiedEmail] = useState("")

  const form = useForm<RegisterInput>({
    // NOTE: Resolver typing expects a single zod instance; this repo uses Zod v4.
    // Cast is intentional to avoid versioned-type mismatches in resolver generics.
    resolver: zodResolver(RegisterSchema as unknown as never) as unknown as Resolver<RegisterInput>,
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  const isPending = form.formState.isSubmitting

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

  const onSubmit = async (data: RegisterInput) => {
    try {
      const { data: userData, error } = await authClient.signUp.email({
        name: data.name,
        email: data.email,
        password: data.password,
        callbackURL: routes.ui.auth.authCallback(next),
      })

      if (error) {
        form.setError("root", {
          message: error.message || AUTH_ERRORS.EMAIL_ALREADY_EXISTS,
        })
        return
      }

      // Send Neon Auth verification email (requiredEmailVerification enabled in Neon)
      if (userData?.user) {
        setVerifiedEmail(data.email)
        setVerifyingEmail(data.email)

        try {
          localStorage.setItem("afenda.lastRegisteredEmail", data.email.toLowerCase())
        } catch {
          // ignore storage failures
        }

        // Request verification email from Neon Auth
        authClient
          .sendVerificationEmail({
            email: data.email,
            callbackURL: routes.ui.auth.authCallback(next),
          })
          .catch(() => {
            // Non-fatal: user can resend from /verify-email
          })

        // Show verification message
        setShowVerificationMessage(true)
      }
    } catch {
      form.setError("root", {
        message: AUTH_ERRORS.NETWORK_ERROR,
      })
    }
  }

  const handleSocialSignUp = async (provider: "github" | "google") => {
    setOAuthPending(provider)
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: routes.ui.auth.authCallback(next),
      })
    } catch {
      setOAuthPending(null)
      form.setError("root", {
        message: `${AUTH_ERRORS.OAUTH_FAILED} ${provider}`,
      })
    }
  }

  // Show verification message after successful registration
  if (showVerificationMessage) {
    return (
      <AuthShell
        title={AUTH_LABELS.VERIFY_YOUR_EMAIL}
        description={AUTH_LABELS.SENT_VERIFICATION_LINK}
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
          <Mail className="h-8 w-8 text-purple-600" />
        </div>

        <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 text-center">
          <p className="font-semibold text-purple-900">{verifiedEmail}</p>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>{AUTH_LABELS.NEXT_STEPS}</strong>
          </p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>{AUTH_LABELS.OPEN_EMAIL_INBOX}</li>
            <li>{AUTH_LABELS.CLICK_VERIFICATION_LINK}</li>
            <li>{AUTH_LABELS.RETURN_TO_SIGN_IN}</li>
          </ol>
        </div>

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <p className="text-xs text-blue-800">
            &#x1F4A1; <strong>{AUTH_LABELS.TIP_LABEL}</strong> {AUTH_LABELS.TIP_SPAM_FOLDER}
          </p>
        </div>

        <div className="space-y-2">
          <Button onClick={() => router.push(routes.ui.auth.login())} className="w-full">
            {AUTH_LABELS.GO_TO_SIGN_IN}
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              try {
                await authClient.sendVerificationEmail({
                  email: verifiedEmail,
                  callbackURL: routes.ui.auth.authCallback(next),
                })
              } catch {
                form.setError("root", {
                  message: AUTH_ERRORS.NETWORK_ERROR,
                })
              }
            }}
            className="w-full"
          >
            {AUTH_LABELS.RESEND_VERIFICATION_EMAIL}
          </Button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title={AUTH_LABELS.SIGN_UP}
      description={AUTH_PAGE_DESCRIPTIONS.SIGN_UP}
    >
      {isSessionLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-muted-foreground">
            {AUTH_LABELS.CHECKING_SESSION}
          </div>
        </div>
      ) : null}

      {/* Root-level errors */}
      {form.formState.errors.root && (
        <FormError message={form.formState.errors.root.message} />
      )}

      {/* OAuth Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <OAuthButton
          provider="google"
          onClick={() => handleSocialSignUp("google")}
          isLoading={oauthPending === "google"}
          disabled={isPending || !!oauthPending}
        />
        <OAuthButton
          provider="github"
          onClick={() => handleSocialSignUp("github")}
          isLoading={oauthPending === "github"}
          disabled={isPending || !!oauthPending}
        />
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-muted-foreground/20" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">
            {AUTH_LABELS.OR_CONTINUE_WITH_EMAIL}
          </span>
        </div>
      </div>

      {/* Email/Password Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem idBase="auth-register-name">
                <FormLabel>{AUTH_LABELS.NAME}</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder={AUTH_LABELS.NAME_PLACEHOLDER}
                    autoComplete="name"
                    disabled={isPending}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem idBase="auth-register-email">
                <FormLabel>{AUTH_LABELS.EMAIL}</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder={AUTH_LABELS.EMAIL_PLACEHOLDER}
                    autoComplete="email"
                    disabled={isPending}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem idBase="auth-register-password">
                <FormLabel>{AUTH_LABELS.PASSWORD}</FormLabel>
                <FormControl>
                  <PasswordInput
                    placeholder={AUTH_LABELS.PASSWORD_PLACEHOLDER}
                    autoComplete="new-password"
                    disabled={isPending}
                    showPasswordLabel={AUTH_LABELS.PASSWORD_SHOW}
                    hidePasswordLabel={AUTH_LABELS.PASSWORD_HIDE}
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  {AUTH_LABELS.PASSWORD_CONSTRAINT_HINT}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem idBase="auth-register-confirm-password">
                <FormLabel>{AUTH_LABELS.CONFIRM_PASSWORD}</FormLabel>
                <FormControl>
                  <PasswordInput
                    placeholder={AUTH_LABELS.PASSWORD_PLACEHOLDER}
                    autoComplete="new-password"
                    disabled={isPending}
                    showPasswordLabel={AUTH_LABELS.PASSWORD_SHOW}
                    hidePasswordLabel={AUTH_LABELS.PASSWORD_HIDE}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="pt-2">
            <Button type="submit" className="w-full" size="lg" disabled={isPending}>
              {isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  {AUTH_LABELS.SIGNING_UP}
                </>
              ) : (
                AUTH_LABELS.SIGN_UP
              )}
            </Button>
          </div>
        </form>
      </Form>

      {/* Sign in link */}
      <div className="text-center text-sm text-muted-foreground">
        {AUTH_LABELS.ALREADY_HAVE_ACCOUNT}{" "}
        <Link
          href={routes.ui.auth.login()}
          className="text-primary hover:underline font-medium"
        >
          {AUTH_LABELS.SIGN_IN}
        </Link>
      </div>
    </AuthShell>
  )
}

