/**
 * @domain magicfolder
 * @layer ui
 * @responsibility Hash audit UI: run GET audit/hash with sample size, display result
 */

"use client"

import { useState, useCallback } from "react"

import Link from "next/link"
import { routes } from "@/lib/routes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, ShieldCheck } from "lucide-react"

import {
  MagicfolderPageHeader,
  MagicfolderSection,
} from "@/components/magicfolder"

type HashAuditResult = {
  sampled: number
  checked: number
  matched: number
  mismatched: Array<{ versionId: string; objectId: string; expected: string; actual: string }>
  errors: Array<{ versionId: string; error: string }>
}

type AuditResponse = {
  data?: HashAuditResult
  error?: { code: string; message: string }
}

export default function MagicFolderAuditPage() {
  const [sampleSize, setSampleSize] = useState(20)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<HashAuditResult | null>(null)

  const runAudit = useCallback(() => {
    const size = Math.min(100, Math.max(1, sampleSize))
    setLoading(true)
    setError(null)
    setResult(null)
    fetch(`${routes.api.v1.magicfolder.auditHash()}?sample=${size}`, {
      credentials: "include",
    })
      .then((r) => r.json() as Promise<AuditResponse>)
      .then((res) => {
        if (res.error) {
          setError(res.error.message)
          return
        }
        if (res.data) setResult(res.data)
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Audit failed")
      })
      .finally(() => setLoading(false))
  }, [sampleSize])

  return (
    <MagicfolderSection layout="stack" className="space-y-6">
      <MagicfolderPageHeader
        title="MagicFolder · Hash audit"
        description="Verify stored object SHA-256 hashes against R2. Sample versions are re-downloaded and checked."
        actions={
          <Link
            href={routes.ui.magicfolder.landing()}
            className="text-sm font-medium text-primary hover:underline"
          >
            Back to MagicFolder
          </Link>
        }
      />

      <MagicfolderSection layout="stack" className="max-w-md space-y-2">
        <Label htmlFor="audit-sample-size">Sample size (1–100)</Label>
        <div className="flex gap-2">
          <Input
            id="audit-sample-size"
            type="number"
            min={1}
            max={100}
            value={sampleSize}
            onChange={(e) => setSampleSize(parseInt(e.target.value, 10) || 20)}
          />
          <Button onClick={runAudit} disabled={loading}>
            {loading ? "Running…" : "Run audit"}
          </Button>
        </div>
      </MagicfolderSection>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <MagicfolderSection layout="stack" className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            <span>
              Verified <strong>{result.matched}</strong> of <strong>{result.checked}</strong> sampled
              {result.sampled !== result.checked && ` (requested ${result.sampled})`}.
            </span>
          </div>
          {result.mismatched.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Mismatches: {result.mismatched.length}</strong>
                <ul className="mt-2 list-inside list-disc text-xs">
                  {result.mismatched.slice(0, 10).map((m, i) => (
                    <li key={i}>
                      version {m.versionId.slice(0, 8)}… expected {m.expected.slice(0, 16)}… got{" "}
                      {m.actual.slice(0, 16)}…
                    </li>
                  ))}
                  {result.mismatched.length > 10 && (
                    <li>… and {result.mismatched.length - 10} more</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          {result.errors.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Errors: {result.errors.length}</strong>
                <ul className="mt-2 list-inside list-disc text-xs text-muted-foreground">
                  {result.errors.slice(0, 5).map((e, i) => (
                    <li key={i}>
                      {e.versionId.slice(0, 8)}…: {e.error}
                    </li>
                  ))}
                  {result.errors.length > 5 && (
                    <li>… and {result.errors.length - 5} more</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </MagicfolderSection>
      )}
    </MagicfolderSection>
  )
}
