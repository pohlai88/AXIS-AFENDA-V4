import "@/lib/server/only"

import type { Logger } from "@/lib/shared/logger"
import { logger } from "@/lib/server/logger"
import { HEADER_NAMES } from "@/lib/constants"
import { fail } from "@/lib/server/api/response"
import { HttpError } from "@/lib/server/api/errors"

export function getRequestIdFromHeaders(headers: Headers): string | undefined {
  return headers.get(HEADER_NAMES.REQUEST_ID) ?? undefined
}

export function getRequestLogger(headers: Headers): Logger {
  const requestId = getRequestIdFromHeaders(headers)
  return requestId ? logger.child({ requestId }) : logger
}

/**
 * Standard error boundary for Route Handlers.
 *
 * Enforces:
 * - requestId propagation (when available)
 * - HttpError -> standardized fail() envelope
 * - unknown errors -> INTERNAL fail() envelope + server logger
 */
export async function withApiErrorBoundary(
  request: Request,
  fn: (log: Logger, requestId?: string) => Promise<Response>
): Promise<Response> {
  const requestId = getRequestIdFromHeaders(request.headers)
  const log = getRequestLogger(request.headers)

  try {
    return await fn(log, requestId)
  } catch (e) {
    if (e instanceof HttpError) {
      return fail(e.toApiError(requestId), e.status)
    }

    log.error({ err: e }, "Unhandled API error")
    return fail({ code: "INTERNAL", message: "Internal error", requestId }, 500)
  }
}

