import "@/lib/server/only"

import { getNeonAuthConfig } from "@/lib/server/auth/neon-integration"
import { CIRCUIT_BREAKER } from "@/lib/constants"
import { CircuitBreaker } from "@/lib/shared/circuit-breaker"
import { logger } from "@/lib/server/logger"

export interface NeonDataApiResponse<T = unknown> {
  data: T[]
  error: string | null
  status: number
}

const neonCircuit = new CircuitBreaker({
  failureThreshold: CIRCUIT_BREAKER.FAILURE_THRESHOLD,
  windowSize: CIRCUIT_BREAKER.WINDOW_SIZE,
  openDurationMs: CIRCUIT_BREAKER.OPEN_DURATION_MS,
  halfOpenMaxProbes: CIRCUIT_BREAKER.HALF_OPEN_MAX_PROBES,
})

export class NeonDataApiClient {
  private baseUrl: string
  private headers: Record<string, string>

  constructor(options?: { token?: string }) {
    const config = getNeonAuthConfig()
    this.baseUrl = config.dataApiUrl
    if (!this.baseUrl) {
      throw new Error("Neon Data API URL is not configured (NEON_DATA_API_URL)")
    }

    this.headers = {
      "Content-Type": "application/json",
      "Accept": "application/json",
    }

    // IMPORTANT: Neon Data API expects a *user JWT* (Neon Auth) as the bearer token.
    // Never send secrets (JWKS, cookie secret, HMAC secret) as Authorization.
    if (options?.token) {
      this.headers["Authorization"] = `Bearer ${options.token}`
    }
  }

  async get<T = unknown>(table: string, options?: {
    select?: string
    filter?: Record<string, unknown>
    limit?: number
    offset?: number
    order?: string
  }): Promise<NeonDataApiResponse<T>> {
    try {
      const params = new URLSearchParams()

      if (options?.select) {
        params.append("select", options.select)
      }

      if (options?.filter) {
        Object.entries(options.filter).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, `eq.${value}`)
          }
        })
      }

      if (options?.limit) {
        params.append("limit", options.limit.toString())
      }

      if (options?.offset) {
        params.append("offset", options.offset.toString())
      }

      if (options?.order) {
        params.append("order", options.order)
      }

      const url = `${this.baseUrl}/${table}?${params.toString()}`
      const response = await neonCircuit.execute(async () =>
        fetch(url, {
          method: "GET",
          headers: this.headers,
        })
      )

      if (!response.ok) {
        const body = await response.text().catch(() => "")
        return {
          data: [],
          error: `HTTP ${response.status}: ${response.statusText}${body ? ` - ${body}` : ""}`,
          status: response.status,
        }
      }

      const data = await response.json()
      return {
        data: Array.isArray(data) ? data : [data],
        error: null,
        status: response.status,
      }
    } catch (error) {
      logger.error({ error }, "[neon-data-api] GET failed")
      return {
        data: [],
        error: error instanceof Error ? error.message : "Unknown error",
        status: 500,
      }
    }
  }

  async post<T = unknown>(table: string, data: Record<string, unknown>): Promise<NeonDataApiResponse<T>> {
    try {
      const response = await neonCircuit.execute(async () =>
        fetch(`${this.baseUrl}/${table}`, {
          method: "POST",
          headers: this.headers,
          body: JSON.stringify(data),
        })
      )

      if (!response.ok) {
        const body = await response.text().catch(() => "")
        return {
          data: [],
          error: `HTTP ${response.status}: ${response.statusText}${body ? ` - ${body}` : ""}`,
          status: response.status,
        }
      }

      const result = await response.json()
      return {
        data: Array.isArray(result) ? result : [result],
        error: null,
        status: response.status,
      }
    } catch (error) {
      logger.error({ error }, "[neon-data-api] POST failed")
      return {
        data: [],
        error: error instanceof Error ? error.message : "Unknown error",
        status: 500,
      }
    }
  }

  async patch<T = unknown>(table: string, data: Record<string, unknown>, filter?: Record<string, unknown>): Promise<NeonDataApiResponse<T>> {
    try {
      const params = new URLSearchParams()

      if (filter) {
        Object.entries(filter).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, `eq.${value}`)
          }
        })
      }

      const url = `${this.baseUrl}/${table}${params.toString() ? `?${params.toString()}` : ""}`
      const response = await neonCircuit.execute(async () =>
        fetch(url, {
          method: "PATCH",
          headers: this.headers,
          body: JSON.stringify(data),
        })
      )

      if (!response.ok) {
        const body = await response.text().catch(() => "")
        return {
          data: [],
          error: `HTTP ${response.status}: ${response.statusText}${body ? ` - ${body}` : ""}`,
          status: response.status,
        }
      }

      const result = await response.json()
      return {
        data: Array.isArray(result) ? result : [result],
        error: null,
        status: response.status,
      }
    } catch (error) {
      logger.error({ error }, "[neon-data-api] PATCH failed")
      return {
        data: [],
        error: error instanceof Error ? error.message : "Unknown error",
        status: 500,
      }
    }
  }

  async delete<T = unknown>(table: string, filter: Record<string, unknown>): Promise<NeonDataApiResponse<T>> {
    try {
      const params = new URLSearchParams()

      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, `eq.${value}`)
        }
      })

      const url = `${this.baseUrl}/${table}?${params.toString()}`
      const response = await neonCircuit.execute(async () =>
        fetch(url, {
          method: "DELETE",
          headers: this.headers,
        })
      )

      if (!response.ok) {
        const body = await response.text().catch(() => "")
        return {
          data: [],
          error: `HTTP ${response.status}: ${response.statusText}${body ? ` - ${body}` : ""}`,
          status: response.status,
        }
      }

      const result = await response.json()
      return {
        data: Array.isArray(result) ? result : [result],
        error: null,
        status: response.status,
      }
    } catch (error) {
      logger.error({ error }, "[neon-data-api] DELETE failed")
      return {
        data: [],
        error: error instanceof Error ? error.message : "Unknown error",
        status: 500,
      }
    }
  }
}

export function createNeonDataApiClient(token?: string): NeonDataApiClient {
  return new NeonDataApiClient({ token })
}
