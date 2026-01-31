import { AuthView } from "@neondatabase/auth/react/ui"
import { authViewPaths } from "@neondatabase/auth/react/ui/server"

import { AuthShell } from "../../_components/auth-shell"

export function generateStaticParams() {
  return Object.values(authViewPaths).map((path) => ({ path }))
}

export default async function AuthPage({
  params,
}: {
  params: Promise<{ path: string }>
}) {
  const { path } = await params
  return (
    <AuthShell>
      <AuthView pathname={path} />
    </AuthShell>
  )
}

