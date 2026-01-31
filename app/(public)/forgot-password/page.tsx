import type { Metadata } from "next"

import { ForgotPasswordForm } from "./ui"
import { SplitLayout } from "../_components/split-layout"

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset your password",
}

export default function ForgotPasswordPage() {
  return (
    <SplitLayout imageAlt="Reset password">
      <ForgotPasswordForm />
    </SplitLayout>
  )
}
