import "@/lib/server/only"

import type { ApiError } from "@/lib/contracts/api-error"

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message)
  }

  toApiError(requestId?: string): ApiError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      requestId,
    }
  }
}

export const Unauthorized = (msg = "Unauthorized") =>
  new HttpError(401, "UNAUTHORIZED", msg)
export const Forbidden = (msg = "Forbidden") => new HttpError(403, "FORBIDDEN", msg)
export const NotFound = (msg = "Not found") => new HttpError(404, "NOT_FOUND", msg)
export const Conflict = (msg = "Conflict", details?: unknown) =>
  new HttpError(409, "CONFLICT", msg, details)
export const BadRequest = (msg = "Bad request", details?: unknown) =>
  new HttpError(400, "BAD_REQUEST", msg, details)

