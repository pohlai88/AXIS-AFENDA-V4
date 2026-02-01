import { AuthShell } from "@/components/auth/auth-shell"
import { Spinner } from "@/components/ui/spinner"

export default function PublicLoading() {
  return (
    <AuthShell title="Loading" description="Preparing the page…">
      <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
        <Spinner className="size-5" />
        <div className="text-sm text-muted-foreground">One moment…</div>
      </div>
    </AuthShell>
  )
}

