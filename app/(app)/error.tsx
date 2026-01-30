"use client"

export default function Error({ error }: { error: Error & { digest?: string } }) {
  return (
    <div className="rounded-xl border p-6">
      <h1 className="text-lg font-semibold">Something went wrong</h1>
      <p className="text-muted-foreground mt-2 text-sm">{error.message}</p>
      {error.digest ? (
        <p className="text-muted-foreground mt-2 text-xs">Digest: {error.digest}</p>
      ) : null}
    </div>
  )
}

