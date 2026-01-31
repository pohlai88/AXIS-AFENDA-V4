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

  constructor(userId?: string) {
    const config = getNeonAuthConfig()
    this.baseUrl = config.dataApiUrl

    this.headers = {
      "Content-Type": "application/json",
      "Accept": "application/json",
    }

    // Add Neon Auth headers if configured
    if (config.enabled) {
      // Use the auth base URL for token validation
      this.headers["Authorization"] = `Bearer ${config.jwtSecret}`
      if (userId) {
        this.headers["X-User-ID"] = userId
      }
      // Add project context for Neon Auth
      if (config.projectId) {
        this.headers["X-Project-ID"] = config.projectId
      }
      if (config.branchId) {
        this.headers["X-Branch-ID"] = config.branchId
      }
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
        return {
          data: [],
          error: `HTTP ${response.status}: ${response.statusText}`,
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
        return {
          data: [],
          error: `HTTP ${response.status}: ${response.statusText}`,
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
        return {
          data: [],
          error: `HTTP ${response.status}: ${response.statusText}`,
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
        return {
          data: [],
          error: `HTTP ${response.status}: ${response.statusText}`,
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

export function createNeonDataApiClient(userId?: string): NeonDataApiClient {
  return new NeonDataApiClient(userId)
}
