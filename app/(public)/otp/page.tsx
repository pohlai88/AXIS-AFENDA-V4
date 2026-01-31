import type { Metadata } from "next"

import { OTPForm } from "./ui"
import { SplitLayout } from "../_components/split-layout"

export const metadata: Metadata = {
  title: "Verify Code",
  description: "Enter your verification code",
}

export default function OTPPage() {
  return (
    <SplitLayout imageAlt="Verification" showTerms>
      <OTPForm />
    </SplitLayout>
  )
}
