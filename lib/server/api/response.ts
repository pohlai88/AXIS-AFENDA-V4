import "@/lib/server/only"
import { NextResponse } from "next/server"

import type { ApiError } from "@/lib/contracts/api-error"
import { HEADER_NAMES } from "@/lib/constants/headers"

const API_VERSION = "1.0.0"

export type ApiOk<T> = { data: T; error: null }
export type ApiFail = { data: null; error: ApiError }

export function ok<T>(data: T, init?: ResponseInit) {
  const body: ApiOk<T> = { data, error: null }
  const res = NextResponse.json(body, { status: 200, ...init })
  res.headers.set(HEADER_NAMES.API_VERSION, API_VERSION)
  return res
}

export function fail(error: ApiError, status = 400, init?: ResponseInit) {
  const body: ApiFail = { data: null, error }
  const res = NextResponse.json(body, { status, ...init })
  res.headers.set(HEADER_NAMES.API_VERSION, API_VERSION)
  return res
}

