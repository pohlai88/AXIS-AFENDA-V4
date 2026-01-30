import "@/lib/server/only"
import { z } from "zod"

import { BadRequest } from "./errors"

export async function parseJson<T extends z.ZodTypeAny>(
  req: Request,
  schema: T
): Promise<z.infer<T>> {
  const json = await req.json().catch(() => undefined)
  const parsed = schema.safeParse(json)
  if (!parsed.success) {
    throw BadRequest("Invalid JSON body", parsed.error.flatten())
  }
  return parsed.data
}

export function parseSearchParams<T extends z.ZodTypeAny>(
  searchParams: URLSearchParams,
  schema: T
): z.infer<T> {
  const obj = Object.fromEntries(searchParams.entries())
  const parsed = schema.safeParse(obj)
  if (!parsed.success) {
    throw BadRequest("Invalid query params", parsed.error.flatten())
  }
  return parsed.data
}

