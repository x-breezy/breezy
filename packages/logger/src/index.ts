import { pino } from "pino"
import type { Logger, LoggerOptions } from "pino"
import type { Request, Response, NextFunction, RequestHandler } from "express"
import { randomUUID } from "node:crypto"
import { createWriteStream } from "node:fs"

export type { Logger } from "pino"

export interface ErrorHandlerOptions {
  /** Whether to include error stack traces in the response (dev only). */
  exposeStack?: boolean
}

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
  const isTest = process.env.NODE_ENV === "test"
  const pretty = options.pretty ?? (!isProd && !isTest && !!process.stdout.isTTY)
  const logFile = isProd ? process.env.LOG_FILE : undefined

  if (logFile) {
    const fileStream = createWriteStream(logFile, { flags: "a" })
    fileStream.on("error", (err) => {
      console.error("[Logger] Failed to write to log file:", err.message)
    })
    // Write to both file and stdout so docker logs / Dokploy log viewer captures errors
    const multiStream = {
      write(msg: string) {
        fileStream.write(msg)
        process.stdout.write(msg)
      },
    }
    return pino(
      {
        level: options.level ?? process.env.LOG_LEVEL ?? "info",
        base: { service: options.service },
        timestamp: pino.stdTimeFunctions.isoTime,
        redact: { paths: sensitiveFields, censor: "[REDACTED]" },
      },
      multiStream as ReturnType<typeof createWriteStream>
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
 * - Logs all HTTP requests with timing and context
 */
export function httpLogger(logger: Logger, options: HttpLoggerOptions = {}): RequestHandler {
  const skipPaths = new Set(options.skipPaths || ["/health", "/favicon.ico"])

  return (req: Request, res: Response, next: NextFunction): void => {
    if (skipPaths.has(req.path)) {
      return next()
    }

    const correlationId = req.get("x-correlation-id") || randomUUID()
    req.correlationId = correlationId
    res.setHeader("x-correlation-id", correlationId)

    req.log = logger.child({ correlationId })

    const start = Date.now()
    const contentLength = req.headers["content-length"]
    const userAgent = req.headers["user-agent"]
    const referer = req.headers["referer"]

    res.on("finish", () => {
      const duration = Date.now() - start
      const logData: Record<string, unknown> = {
        method: req.method,
        path: req.path,
        query: Object.keys(req.query).length > 0 ? req.query : undefined,
        statusCode: res.statusCode,
        duration,
        contentLength: contentLength ? Number(contentLength) : undefined,
        responseSize: res.getHeader("content-length")
          ? Number(res.getHeader("content-length"))
          : undefined,
        userId: req.get("x-user-id") || undefined,
        userAgent: userAgent || undefined,
        referer: referer || undefined,
        ip: req.ip,
      }

      if (res.statusCode >= 400) {
        req.log.warn(logData, `${req.method} ${req.path} ${res.statusCode} ${duration}ms`)
      } else {
        req.log.info(logData, `${req.method} ${req.path} ${res.statusCode} ${duration}ms`)
      }
    })

    next()
  }
}

/**
 * Express error-handling middleware factory.
 * Logs structured error context and returns a consistent JSON response.
 */
export function createErrorHandler(
  logger: Logger,
  options: ErrorHandlerOptions = {}
): (err: Error, req: Request, res: Response, next: NextFunction) => void {
  return (err: Error, req: Request, res: Response, _next: NextFunction): void => {
    const errorContext: Record<string, unknown> = {
      err,
      method: req.method,
      path: req.path,
      correlationId: req.correlationId,
      userId: req.get("x-user-id") || undefined,
    }

    logger.error(errorContext, err.message || "Unhandled error")

    const statusCode =
      (err as Error & { statusCode?: number }).statusCode ||
      (err as Error & { status?: number }).status ||
      500

    const body: Record<string, unknown> = {
      success: false,
      error: statusCode >= 500 ? "Internal server error" : err.message,
    }

    if (options.exposeStack && err.stack) {
      body.stack = err.stack
    }

    res.status(statusCode).json(body)
  }
}

/**
 * Register global process-level error handlers for uncaught exceptions
 * and unhandled promise rejections.
 */
export function registerProcessHandlers(logger: Logger): void {
  process.on("uncaughtException", (err) => {
    logger.fatal({ err }, "Uncaught exception")
    process.exit(1)
  })

  process.on("unhandledRejection", (reason) => {
    logger.error(
      { err: reason instanceof Error ? reason : new Error(String(reason)) },
      "Unhandled promise rejection"
    )
  })
}
