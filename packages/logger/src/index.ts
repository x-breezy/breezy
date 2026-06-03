import { pino } from "pino"
import type { Logger, LoggerOptions } from "pino"

export type { Logger } from "pino"

export interface CreateLoggerOptions {
  /** Service name attached to every log line (e.g. "media-service"). */
  service: string
  /** Log level. Defaults to LOG_LEVEL env, then "info". */
  level?: LoggerOptions["level"]
  /** Pretty-print to console. Defaults to true outside production. */
  pretty?: boolean
}

/**
 * Build a structured logger bound to a service name.
 *
 * JSON output in production for log aggregation; pretty output in dev.
 */
export function createLogger(options: CreateLoggerOptions): Logger {
  const isProd = process.env.NODE_ENV === "production"
  const pretty = options.pretty ?? !isProd

  return pino({
    level: options.level ?? process.env.LOG_LEVEL ?? "info",
    base: { service: options.service },
    timestamp: pino.stdTimeFunctions.isoTime,
    transport: pretty ? { target: "pino-pretty", options: { colorize: true } } : undefined,
  })
}
