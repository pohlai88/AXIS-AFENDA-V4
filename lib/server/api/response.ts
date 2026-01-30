import "@/lib/server/only"
import { NextResponse } from "next/server"

import type { ApiError } from "@/lib/contracts/api-error"

export type ApiOk<T> = { data: T; error: null }
export type ApiFail = { data: null; error: ApiError }

export function ok<T>(data: T, init?: ResponseInit) {
  const body: ApiOk<T> = { data, error: null }
  return NextResponse.json(body, { status: 200, ...init })
}

export function fail(error: ApiError, status = 400, init?: ResponseInit) {
  const body: ApiFail = { data: null, error }
  return NextResponse.json(body, { status, ...init })
}

