/**
 * @domain magicfolder
 * @layer shared
 * @responsibility Client-side SHA-256 (Web Crypto) for presigned uploads
 */

/**
 * Compute SHA-256 hash of a file and return 64-char lowercase hex string.
 * Use in upload UI before calling presign.
 */
export async function sha256Hex(file: File): Promise<string> {
  const buf = await file.arrayBuffer()
  const hash = await crypto.subtle.digest("SHA-256", buf)
  const bytes = new Uint8Array(hash)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toLowerCase()
}
