import { Suspense } from "react"

import { LoginClient } from "./ui"

export default function LoginPage() {
  // `useSearchParams()` requires a Suspense boundary.
  return (
    <Suspense fallback={<div className="px-6 py-16">Loading…</div>}>
      <LoginClient />
    </Suspense>
  )
}

