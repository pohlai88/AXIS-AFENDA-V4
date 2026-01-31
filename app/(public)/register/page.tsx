import type { Metadata } from "next"
import { Suspense } from "react"

import { SignupForm } from "./ui"
import { SplitLayout } from "../_components/split-layout"

export const metadata: Metadata = {
  title: "Register",
  description: "Create a new account",
}

export default function RegisterPage() {
  return (
    <SplitLayout imageAlt="Sign up" showTerms>
      <Suspense fallback={<div>Loading...</div>}>
        <SignupForm />
      </Suspense>
    </SplitLayout>
  )
}
