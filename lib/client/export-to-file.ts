"use client"

/**
 * Client-side export to file (JSON or Markdown).
 * Enterprise-standard: user-triggered download, no server round-trip.
 * Use for: session summary, audit snapshot, data export, reports.
 *
 * For "email report to ...": Neon does not provide general email sending.
 * Use a third-party (Resend, SendGrid, AWS SES) and an API route that
 * sends the report to the user's email.
 */

/**
 * Trigger download of a JSON file.
 * @param data - Serializable object (will be JSON.stringify'd).
 * @param filename - e.g. "session-summary.json" (no path).
 */
export function exportToJson(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: "application/json" })
  downloadBlob(blob, filename)
}

/**
 * Trigger download of a Markdown or text file.
 * @param content - Raw string (Markdown or plain text).
 * @param filename - e.g. "session-summary.md" (no path).
 * @param mimeType - Default "text/markdown".
 */
export function exportToMarkdown(
  content: string,
  filename: string,
  mimeType: string = "text/markdown"
): void {
  const blob = new Blob([content], { type: mimeType })
  downloadBlob(blob, filename)
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
