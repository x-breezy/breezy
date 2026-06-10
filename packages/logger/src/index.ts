import { pino } from "pino"
import type { Logger, LoggerOptions } from "pino"
import type { Request, Response, NextFunction, RequestHandler } from "express"
import { randomUUID } from "node:crypto"
import { createWriteStream } from "node:fs"

export type { Logger } from "pino"

declare global {
  namespace Express {
    interface Request {
      log: Logger
      correlationId: string
    }
  }
}

export interface CreateLoggerOptions {
  /** Service name attached to every log line (e.g. "media-service"). */
  service: string
  /** Log level. Defaults to LOG_LEVEL env, then "info". */
  level?: LoggerOptions["level"]
  /** Pretty-print to console. Defaults to true outside production. */
  pretty?: boolean
}

/** Redact sensitive fields from logs */
const sensitiveFields = ["password", "token", "authorization", "cookie", "secret"]

/**
 * Build a structured logger bound to a service name.
 *
 * JSON output in production for log aggregation; pretty output in dev.
 * Writes to file if LOG_FILE env var is set (for Filebeat collection).
 */
export function createLogger(options: CreateLoggerOptions): Logger {
  const isProd = process.env.NODE_ENV === "production"
  const pretty = options.pretty ?? !isProd
  const logFile = isProd ? process.env.LOG_FILE : undefined

  if (logFile) {
    const stream = createWriteStream(logFile, { flags: "a" })
    stream.on("error", (err) => {
      console.error("[Logger] Failed to write to log file:", err.message)
    })
    return pino(
      {
        level: options.level ?? process.env.LOG_LEVEL ?? "info",
        base: { service: options.service },
        timestamp: pino.stdTimeFunctions.isoTime,
        redact: { paths: sensitiveFields, censor: "[REDACTED]" },
      },
      stream
    )
  }

  // stdout only (dev) or prod fallback
  return pino({
    level: options.level ?? process.env.LOG_LEVEL ?? "info",
    base: { service: options.service },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: { paths: sensitiveFields, censor: "[REDACTED]" },
    transport: pretty ? { target: "pino-pretty", options: { colorize: true } } : undefined,
  })
}

export interface HttpLoggerOptions {
  /** Paths to skip logging (e.g., ['/health', '/metrics']) */
  skipPaths?: string[]
}

/**
 * Express middleware that:
 * - Assigns correlation ID per request
 * - Attaches logger to req.log
 * - Logs all HTTP requests with timing
 */
export function httpLogger(logger: Logger, options: HttpLoggerOptions = {}): RequestHandler {
  const skipPaths = new Set(options.skipPaths || ["/health", "/favicon.ico"])

  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip logging for health checks etc.
    if (skipPaths.has(req.path)) {
      return next()
    }

    const correlationId = req.get("x-correlation-id") || randomUUID()
    req.correlationId = correlationId
    res.setHeader("x-correlation-id", correlationId)

    req.log = logger.child({ correlationId })

    const start = Date.now()

    res.on("finish", () => {
      const duration = Date.now() - start
      req.log.info(
        {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
          userId: req.get("x-user-id"),
        },
        `${req.method} ${req.path} ${res.statusCode} ${duration}ms`
      )
    })

    next()
  }
}
