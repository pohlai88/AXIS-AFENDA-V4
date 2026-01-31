import { z } from "zod"

import { ApiErrorSchema, type ApiError } from "@/lib/contracts/api-error"
import { CACHE_TTL } from "@/lib/constants"
import { retry } from "@/lib/utils"

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
    public requestId?: string,
    public status?: number
  ) {
    super(message)
    this.name = "ApiFetchError"
  }
}

type ApiEnvelope<T> =
  | { data: T; error: null }
  | { data: null; error: ApiError }

interface ApiFetchOptions extends RequestInit {
  retries?: number
  timeout?: number
  cache?: RequestCache
  cacheKey?: string
}

// Simple in-memory cache for GET requests
const cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>()
const DEFAULT_CACHE_TTL = CACHE_TTL.MEDIUM

function getFromCache(key: string): unknown | null {
  const entry = cache.get(key)
  if (!entry) return null

  if (Date.now() - entry.timestamp > entry.ttl) {
    cache.delete(key)
    return null
  }

  return entry.data
}

function setCache(key: string, data: unknown, ttl: number = DEFAULT_CACHE_TTL): void {
  cache.set(key, { data, timestamp: Date.now(), ttl })
}

export async function apiFetch<T extends z.ZodTypeAny>(
  input: RequestInfo | URL,
  init: ApiFetchOptions = {},
  dataSchema: T
): Promise<z.infer<T>> {
  const {
    retries = 3,
    timeout = 30000,
    cache: requestCache = 'default',
    cacheKey,
    ...requestInit
  } = init

  // Generate cache key for GET requests if not provided
  const isGetRequest = (!requestInit.method || requestInit.method === 'GET')
  const effectiveCacheKey = isGetRequest && cacheKey
    ? cacheKey
    : isGetRequest
      ? `${input.toString()}_${JSON.stringify(requestInit)}`
      : null

  // Check cache for GET requests
  if (isGetRequest && effectiveCacheKey && requestCache !== 'no-store') {
    const cached = getFromCache(effectiveCacheKey)
    if (cached) {
      // Type assertion since we know cached data matches the schema
      return cached as z.infer<T>
    }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const result = await retry(
      async () => {
        const res = await fetch(input, {
          ...requestInit,
          signal: controller.signal,
          cache: requestCache,
        })

        // Handle non-JSON responses
        const contentType = res.headers.get('content-type')
        let json: unknown

        if (contentType?.includes('application/json')) {
          json = await res.json().catch(() => undefined)
        } else {
          const text = await res.text()
          try {
            json = JSON.parse(text)
          } catch {
            // For non-JSON responses, create a simple error structure
            json = {
              data: null,
              error: {
                code: `HTTP_${res.status}`,
                message: text || 'Request failed',
                details: { status: res.status, statusText: res.statusText }
              }
            }
          }
        }

        let envelope: ApiEnvelope<z.infer<T>>
        try {
          envelope = ApiEnvelopeSchema(dataSchema).parse(json) as ApiEnvelope<z.infer<T>>
        } catch (parseError) {
          // Type guard to check if json has error property
          const jsonWithError = json as { error?: { requestId?: string } }
          throw new ApiFetchError(
            'API response validation failed',
            'PARSE_ERROR',
            { parseError, response: json },
            jsonWithError.error?.requestId,
            res.status
          )
        }

        const { data, error } = envelope

        if (!res.ok || error) {
          const code = error?.code ?? `HTTP_${res.status}`
          const message = error?.message ?? res.statusText ?? 'Request failed'
          throw new ApiFetchError(message, code, error?.details, error?.requestId, res.status)
        }

        // Cache successful GET responses
        if (isGetRequest && effectiveCacheKey && requestCache !== 'no-store') {
          setCache(effectiveCacheKey, data)
        }

        return data
      },
      retries,
      1000
    )

    clearTimeout(timeoutId)
    return result
  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof ApiFetchError) {
      throw error
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new ApiFetchError(
          'Request timeout',
          'TIMEOUT',
          { timeout },
          undefined,
          undefined
        )
      }

      throw new ApiFetchError(
        error.message,
        'NETWORK_ERROR',
        { originalError: error },
        undefined,
        undefined
      )
    }

    throw new ApiFetchError(
      'Unknown error occurred',
      'UNKNOWN',
      { error },
      undefined,
      undefined
    )
  }
}

/**
 * Clear cached responses matching a pattern or all cache
 */
export function clearCache(pattern?: string): void {
  if (pattern) {
    const keysToDelete: string[] = []
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key)
      }
    }
    keysToDelete.forEach(key => cache.delete(key))
  } else {
    cache.clear()
  }
}

/**
 * Preload data into cache
 */
export function preloadCache<T>(key: string, data: T, ttl?: number): void {
  setCache(key, data, ttl)
}

