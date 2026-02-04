"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { ResetPasswordForm, authLocalization } from "@neondatabase/auth/react"
import { AuthShell } from "@/components/auth/auth-shell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { routes } from "@/lib/routes"
import {
  AUTH_LABELS,
  AUTH_ALERT_TITLES,
  AUTH_VALIDATION,
} from "@/lib/constants/auth"

/**
 * Reset-password client: Neon ResetPasswordForm when token present;
 * invalid-link message and link to forgot-password when token missing.
 */
export default function ResetPasswordClient() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  if (token === null || token === "" || token === "INVALID_TOKEN") {
    return (
      <AuthShell
        title={AUTH_LABELS.RESET_LINK_INVALID_TITLE}
        description={AUTH_LABELS.RESET_LINK_INVALID_DESCRIPTION}
      >
        <Alert variant="destructive">
          <AlertTitle>{AUTH_ALERT_TITLES.INVALID_RESET_LINK}</AlertTitle>
          <AlertDescription>{AUTH_LABELS.RESET_TOKEN_MISSING}</AlertDescription>
        </Alert>
        <div className="text-center text-sm text-muted-foreground">
          <Link href={routes.ui.auth.forgotPassword()} className="text-primary hover:underline font-medium">
            {AUTH_LABELS.REQUEST_NEW_LINK}
          </Link>
          {" · "}
          <Link href={routes.ui.auth.login()} className="text-primary hover:underline font-medium">
            {AUTH_LABELS.SIGN_IN}
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title={AUTH_LABELS.CREATE_NEW_PASSWORD}
      description={AUTH_LABELS.CHOOSE_STRONG_PASSWORD}
    >
      <ResetPasswordForm
        localization={authLocalization}
        passwordValidation={{
          minLength: AUTH_VALIDATION.PASSWORD_MIN_LENGTH,
        }}
      />
    </AuthShell>
  )
}
