export type CircuitState = "closed" | "open" | "halfOpen"

export type CircuitBreakerConfig = {
  failureThreshold: number
  windowSize: number
  openDurationMs: number
  halfOpenMaxProbes: number
}

type Failure = { at: number }

export class CircuitBreaker {
  private state: CircuitState = "closed"
  private failures: Failure[] = []
  private openedAt: number | null = null
  private halfOpenProbes = 0

  constructor(private readonly cfg: CircuitBreakerConfig) {}

  getState(): CircuitState {
    if (this.state === "open" && this.openedAt != null) {
      if (Date.now() - this.openedAt >= this.cfg.openDurationMs) {
        this.state = "halfOpen"
        this.halfOpenProbes = 0
      }
    }
    return this.state
  }

  private pruneFailures(now: number) {
    // Keep only last N failures (rolling window by count).
    if (this.failures.length > this.cfg.windowSize) {
      this.failures = this.failures.slice(-this.cfg.windowSize)
    }

    // Also drop very old failures if window is sparse (optional, but safe).
    const maxAgeMs = this.cfg.openDurationMs * 10
    this.failures = this.failures.filter((f) => now - f.at <= maxAgeMs)
  }

  private recordFailure() {
    const now = Date.now()
    this.failures.push({ at: now })
    this.pruneFailures(now)

    if (this.state === "halfOpen") {
      // Any failure during half-open re-opens immediately
      this.trip()
      return
    }

    if (this.failures.length >= this.cfg.failureThreshold) {
      this.trip()
    }
  }

  private recordSuccess() {
    if (this.state === "halfOpen") {
      // Success in half-open counts as a probe
      this.halfOpenProbes += 1
      if (this.halfOpenProbes >= this.cfg.halfOpenMaxProbes) {
        this.reset()
      }
    }
  }

  private trip() {
    this.state = "open"
    this.openedAt = Date.now()
    this.halfOpenProbes = 0
  }

  reset() {
    this.state = "closed"
    this.failures = []
    this.openedAt = null
    this.halfOpenProbes = 0
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const state = this.getState()
    if (state === "open") {
      throw new Error("Circuit is open")
    }

    if (state === "halfOpen") {
      if (this.halfOpenProbes >= this.cfg.halfOpenMaxProbes) {
        throw new Error("Circuit is half-open (probe limit reached)")
      }
    }

    try {
      const value = await fn()
      this.recordSuccess()
      return value
    } catch (e) {
      this.recordFailure()
      throw e
    }
  }
}

