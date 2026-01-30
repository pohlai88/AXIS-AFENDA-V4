import { z } from "zod"

import { ApiErrorSchema, type ApiError } from "@/lib/contracts/api-error"

const ApiEnvelopeSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.union([
    z.object({
      data: dataSchema,
      error: z.null(),
    }),
    z.object({
      data: z.null(),
      error: ApiErrorSchema,
    }),
  ])

export class ApiFetchError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown,
    public requestId?: string
  ) {
    super(message)
    this.name = "ApiFetchError"
  }
}

type ApiEnvelope<T> =
  | { data: T; error: null }
  | { data: null; error: ApiError }

export async function apiFetch<T extends z.ZodTypeAny>(
  input: RequestInfo | URL,
  init: RequestInit = {},
  dataSchema: T
): Promise<z.infer<T>> {
  const res = await fetch(input, init)
  const json = await res.json().catch(() => undefined)

  let envelope: ApiEnvelope<z.infer<T>>
  try {
    envelope = ApiEnvelopeSchema(dataSchema).parse(json) as ApiEnvelope<z.infer<T>>
  } catch {
    throw new Error("API envelope parse failed")
  }

  const { data, error } = envelope

  if (!res.ok || error) {
    const code = error?.code ?? `HTTP_${res.status}`
    const message = error?.message ?? "Request failed"
    throw new ApiFetchError(message, code, error?.details, error?.requestId)
  }

  return data
}

