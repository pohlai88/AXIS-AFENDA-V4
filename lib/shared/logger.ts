export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal"

export type LogFields = Record<string, unknown>

export interface Logger {
  trace(fields: LogFields, msg?: string): void
  debug(fields: LogFields, msg?: string): void
  info(fields: LogFields, msg?: string): void
  warn(fields: LogFields, msg?: string): void
  error(fields: LogFields, msg?: string): void
  fatal(fields: LogFields, msg?: string): void

  // Convenience overloads
  trace(msg: string): void
  debug(msg: string): void
  info(msg: string): void
  warn(msg: string): void
  error(msg: string): void
  fatal(msg: string): void

  child(fields: LogFields): Logger
}

