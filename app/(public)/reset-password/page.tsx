import type { Metadata } from "next"

import { ResetPasswordForm } from "./ui"
import { SplitLayout } from "../_components/split-layout"

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Enter your reset code and new password",
}

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams?: { email?: string }
}) {
  const email = searchParams?.email ?? ""
  return (
    <SplitLayout imageAlt="Reset password">
      <ResetPasswordForm initialEmail={email} />
    </SplitLayout>
  )
}
