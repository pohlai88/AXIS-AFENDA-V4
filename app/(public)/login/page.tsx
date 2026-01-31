import type { Metadata } from "next"
import { Suspense } from "react"

import { LoginForm } from "./ui"
import { AuthShell } from "../_components/auth-shell"

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to your account",
}

export default function LoginPage() {
  return (
    <AuthShell>
      <Suspense fallback={<div>Loading...</div>}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  )
}
