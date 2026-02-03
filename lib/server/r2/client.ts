/**
 * @domain storage
 * @layer server
 * @responsibility Cloudflare R2 S3-compatible client for presigned uploads
 *
 * See: https://neon.com/docs/guides/cloudflare-r2
 */

import "@/lib/server/only"

import { S3Client } from "@aws-sdk/client-s3"

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME
const R2_ENDPOINT = process.env.R2_ENDPOINT

export const R2_PUBLIC_BASE_URL = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "") ?? ""

function getEndpoint(): string {
  if (R2_ENDPOINT) return R2_ENDPOINT
  if (R2_ACCOUNT_ID) return `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
  return ""
}

/**
 * Returns true if R2 is configured (enough env to create a client).
 */
export function isR2Configured(): boolean {
  return Boolean(
    R2_ACCESS_KEY_ID &&
    R2_SECRET_ACCESS_KEY &&
    R2_BUCKET_NAME &&
    getEndpoint()
  )
}

/**
 * Get S3 client configured for Cloudflare R2.
 * Throws if R2 env vars are missing.
 */
export function getR2Client(): S3Client {
  const endpoint = getEndpoint()
  if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME || !endpoint) {
    throw new Error(
      "R2 not configured: set R2_ACCOUNT_ID (or R2_ENDPOINT), R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME in .env"
    )
  }
  return new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  })
}

export function getR2BucketName(): string {
  if (!R2_BUCKET_NAME) {
    throw new Error("R2_BUCKET_NAME is not set")
  }
  return R2_BUCKET_NAME
}

/**
 * Thin drop-in for skeleton-style code: single client and bucket name.
 * Equivalent to getR2Client() / getR2BucketName(); use those in new code.
 */
export const r2 = getR2Client()
export const R2_BUCKET = getR2BucketName()
