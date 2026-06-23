import express from "express"
import type { NextFunction, Request, RequestHandler, Response, Router } from "express"
import client from "prom-client"

export type HealthCheck = () => Promise<unknown> | unknown

export interface HealthRouterOptions {
  service: string
  version?: string
  checks?: Record<string, HealthCheck>
  timeoutMs?: number
}

export interface MetricsMiddlewareOptions {
  service: string
  collectDefaultMetrics?: boolean
  skipPaths?: string[]
}

interface CheckResult {
  status: "ok" | "error"
  latencyMs: number
  error?: string
}

const DEFAULT_HEALTH_TIMEOUT_MS = 2_000

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: NodeJS.Timeout | undefined
  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timeout = setTimeout(() => reject(new Error(`Timed out after ${timeoutMs}ms`)), timeoutMs)
  })

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeout) clearTimeout(timeout)
  })
}

async function runCheck(check: HealthCheck, timeoutMs: number): Promise<CheckResult> {
  const start = Date.now()

  try {
    await withTimeout(Promise.resolve().then(check), timeoutMs)
    return { status: "ok", latencyMs: Date.now() - start }
  } catch (err) {
    return {
      status: "error",
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

export function createHealthRouter(options: HealthRouterOptions): Router {
  const router = express.Router()
  const checks = options.checks ?? {}
  const timeoutMs = options.timeoutMs ?? DEFAULT_HEALTH_TIMEOUT_MS

  router.get("/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      service: options.service,
      version: options.version,
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    })
  })

  router.get("/health/live", (_req: Request, res: Response) => {
    res.json({
      status: "live",
      service: options.service,
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    })
  })

  router.get("/health/ready", async (_req: Request, res: Response) => {
    const entries = await Promise.all(
      Object.entries(checks).map(
        async ([name, check]) => [name, await runCheck(check, timeoutMs)] as const
      )
    )
    const dependencies = Object.fromEntries(entries)
    const ready = entries.every(([, result]) => result.status === "ok")

    res.status(ready ? 200 : 503).json({
      status: ready ? "ready" : "not_ready",
      service: options.service,
      dependencies,
      timestamp: new Date().toISOString(),
    })
  })

  return router
}

function normalizeRoute(req: Request): string {
  if (req.route?.path) {
    const routePath = Array.isArray(req.route.path)
      ? req.route.path.join("|")
      : String(req.route.path)
    return `${req.baseUrl}${routePath}` || req.path
  }

  return req.path
}

export function createMetrics(options: MetricsMiddlewareOptions): {
  registry: client.Registry
  metricsMiddleware: RequestHandler
  metricsHandler: RequestHandler
} {
  const registry = new client.Registry()
  registry.setDefaultLabels({ service: options.service })

  if (options.collectDefaultMetrics ?? true) {
    client.collectDefaultMetrics({ register: registry, prefix: "breezy_" })
  }

  const requestDuration = new client.Histogram({
    name: "http_request_duration_seconds",
    help: "HTTP request duration in seconds",
    registers: [registry],
    labelNames: ["service", "method", "route", "status_code"] as const,
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  })

  const requestTotal = new client.Counter({
    name: "http_requests_total",
    help: "Total number of HTTP requests",
    registers: [registry],
    labelNames: ["service", "method", "route", "status_code"] as const,
  })

  const inFlightRequests = new client.Gauge({
    name: "http_requests_in_flight",
    help: "Current number of in-flight HTTP requests",
    registers: [registry],
    labelNames: ["service"] as const,
  })

  const skipPaths = new Set(
    options.skipPaths ?? ["/metrics", "/health", "/health/live", "/health/ready"]
  )

  const metricsMiddleware: RequestHandler = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    if (skipPaths.has(req.path)) {
      return next()
    }

    const endTimer = requestDuration.startTimer()
    inFlightRequests.inc({ service: options.service })

    res.on("finish", () => {
      const labels = {
        service: options.service,
        method: req.method,
        route: normalizeRoute(req),
        status_code: String(res.statusCode),
      }

      requestTotal.inc(labels)
      endTimer(labels)
      inFlightRequests.dec({ service: options.service })
    })

    next()
  }

  const metricsHandler: RequestHandler = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      res.setHeader("Content-Type", registry.contentType)
      res.end(await registry.metrics())
    } catch (err) {
      next(err)
    }
  }

  return { registry, metricsMiddleware, metricsHandler }
}
