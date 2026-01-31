import "@/lib/server/only"

import pino from "pino"

import { ENVIRONMENTS } from "@/lib/constants"
import type { Logger, LogFields } from "@/lib/shared/logger"

type PinoLogger = pino.Logger

function isProd() {
  return process.env.NODE_ENV === ENVIRONMENTS.PRODUCTION
}

const base = {
  service: "afenda",
  env: process.env.NODE_ENV,
}

const pinoLogger: PinoLogger = pino(
  {
    base,
    level: process.env.LOG_LEVEL ?? (isProd() ? "info" : "debug"),
    redact: {
      // Conservative defaults; expand as needed.
      paths: [
        "req.headers.authorization",
        "authorization",
        "cookie",
        "cookies",
        "password",
        "*.password",
        "token",
        "*.token",
        "access_token",
        "refresh_token",
      ],
      censor: "[redacted]",
    },
  },
  isProd()
    ? undefined
    : pino.transport({
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      })
)

function toLogger(l: PinoLogger): Logger {
  return {
    trace: (a: unknown, b?: string) => (typeof a === "string" ? l.trace(a) : l.trace(a as LogFields, b)),
    debug: (a: unknown, b?: string) => (typeof a === "string" ? l.debug(a) : l.debug(a as LogFields, b)),
    info: (a: unknown, b?: string) => (typeof a === "string" ? l.info(a) : l.info(a as LogFields, b)),
    warn: (a: unknown, b?: string) => (typeof a === "string" ? l.warn(a) : l.warn(a as LogFields, b)),
    error: (a: unknown, b?: string) => (typeof a === "string" ? l.error(a) : l.error(a as LogFields, b)),
    fatal: (a: unknown, b?: string) => (typeof a === "string" ? l.fatal(a) : l.fatal(a as LogFields, b)),
    child: (fields: LogFields) => toLogger(l.child(fields)),
  } as Logger
}

/**
 * Server logger (pino).
 *
 * Use `logger.child({ requestId, tenantId, userId })` at request boundaries.
 */
export const logger: Logger = toLogger(pinoLogger)

