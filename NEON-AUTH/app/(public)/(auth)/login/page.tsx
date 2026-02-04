/**
 * @domain auth
 * @layer ui
 * @responsibility UI route entrypoint for /login
 * 
 * Uses react-hook-form + Zod for validation, enterprise components for UI,
 * and Zustand for OAuth flow tracking.
 */

"use client"

import { useEffect, useMemo } from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { LoginInput } from "@/lib/contracts/auth"
import { LoginSchema } from "@/lib/contracts/auth"
import { AUTH_LABELS, AUTH_ERRORS } from "@/lib/constants/auth"
import { authClient } from "@/lib/auth/client"
import { routes } from "@/lib/routes"
import { getPublicEnv } from "@/lib/env/public"
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
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import HCaptcha from "@hcaptcha/react-hcaptcha"
import { AuthShell } from "@/components/auth/auth-shell"
import { FormError, OAuthButton } from "@/components/auth"
import { useAuth } from "@/lib/client/hooks/useAuth"
import { useAuthUIStore } from "@/stores/auth-ui"

function isSafeInternalPath(next: string | null): next is string {
  if (!next) return false
  return next.startsWith("/") && !next.startsWith("//")
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isLoading: isSessionLoading, isAuthenticated } = useAuth()
  const { oauthPending, setOAuthPending } = useAuthUIStore()
  const [requiresCaptcha, setRequiresCaptcha] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const { NEXT_PUBLIC_HCAPTCHA_SITE_KEY } = getPublicEnv()

  const form = useForm<LoginInput>({
    // NOTE: Resolver typing expects a single zod instance; this repo uses Zod v4.
    // Cast is intentional to avoid versioned-type mismatches in resolver generics.
    resolver: zodResolver(LoginSchema as unknown as never) as unknown as Resolver<LoginInput>,
    defaultValues: {
      email: "",
      password: "",
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

  const onSubmit = async (data: LoginInput) => {
    try {
      if (requiresCaptcha && !captchaToken) {
        form.setError("root", {
          message: AUTH_ERRORS.CAPTCHA_REQUIRED,
        })
        return
      }

      const { error } = await authClient.signIn.email({
        email: data.email,
        password: data.password,
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
        const message = error.message || AUTH_ERRORS.INVALID_CREDENTIALS

        // Check if captcha needed
        if (
          message.toLowerCase().includes("captcha") ||
          message.toLowerCase().includes("too many")
        ) {
          setRequiresCaptcha(true)
        }

        form.setError("root", { message })
      }
    } catch {
      form.setError("root", {
        message: AUTH_ERRORS.NETWORK_ERROR,
      })
    }
  }

  const handleSocialLogin = async (provider: "github" | "google") => {
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

  return (
    <AuthShell
      title={AUTH_LABELS.SIGN_IN}
      description="Enter your credentials or continue with social login"
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
          onClick={() => handleSocialLogin("google")}
          isLoading={oauthPending === "google"}
          disabled={isPending || !!oauthPending}
        />
        <OAuthButton
          provider="github"
          onClick={() => handleSocialLogin("github")}
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
            name="email"
            render={({ field }) => (
              <FormItem idBase="auth-login-email">
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
              <FormItem idBase="auth-login-password">
                <div className="flex items-center justify-between">
                  <FormLabel>{AUTH_LABELS.PASSWORD}</FormLabel>
                  <Link
                    href={routes.ui.auth.forgotPassword()}
                    className="text-sm text-primary hover:underline"
                  >
                    {AUTH_LABELS.FORGOT_PASSWORD}
                  </Link>
                </div>
                <FormControl>
                  <PasswordInput
                    placeholder={AUTH_LABELS.PASSWORD_PLACEHOLDER}
                    autoComplete="current-password"
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

          {requiresCaptcha && NEXT_PUBLIC_HCAPTCHA_SITE_KEY && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
              <HCaptcha
                sitekey={NEXT_PUBLIC_HCAPTCHA_SITE_KEY}
                onVerify={(token) => setCaptchaToken(token)}
                onExpire={() => setCaptchaToken(null)}
              />
            </div>
          )}

          <div className="pt-2">
            <Button type="submit" className="w-full" size="lg" disabled={isPending}>
              {isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  {AUTH_LABELS.SIGNING_IN}
                </>
              ) : (
                AUTH_LABELS.SIGN_IN
              )}
            </Button>
          </div>
        </form>
      </Form>

      {/* Sign up link */}
      <div className="text-center text-sm text-muted-foreground">
        {AUTH_LABELS.DONT_HAVE_ACCOUNT}{" "}
        <Link
          href={routes.ui.auth.register()}
          className="text-primary hover:underline font-medium"
        >
          {AUTH_LABELS.CREATE_ACCOUNT}
        </Link>
      </div>
    </AuthShell>
  )
}

