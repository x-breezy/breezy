import helmet from "helmet"
import express from "express"
import type { Express } from "express"
import swaggerUi from "swagger-ui-express"
import { createAuthRouter } from "./routes/auth.route"
import { createLogger, httpLogger, createErrorHandler } from "@breezy/logger"
import { createHealthRouter, createMetrics } from "@breezy/observability"
import { createUserRouter } from "./routes/user.route"
import { createReportRouter } from "./routes/report.route"
import { swaggerSpec } from "./config/swagger"
import { getJwks } from "./utils/jwt.util"
import UserService from "./services/user.service"
import { getSequelize } from "./config/database"
import { assertRabbitMQReady } from "./clients/rabbitmq"
import { getRedis } from "./clients/redis"

const service = "auth-service"
const logger = createLogger({ service })
const { metricsMiddleware, metricsHandler } = createMetrics({ service })

/** Build the Express app. No network/DB side effects, so tests can import it. */
export function createApp(): Express {
  const app = express()

  app.set("trust proxy", 1)
  app.disable("x-powered-by")
  app.use(helmet())
  app.use(
    createHealthRouter({
      service,
      checks: {
        postgres: () => getSequelize().authenticate(),
        rabbitmq: assertRabbitMQReady,
        redis: () => getRedis().ping(),
      },
    })
  )
  app.get("/metrics", metricsHandler)
  app.use(metricsMiddleware)
  app.use(httpLogger(logger))
  app.use(express.json({ limit: "1mb" }))

  app.get("/", (_req, res) => {
    res.json({ status: "ok" })
  })

  app.get("/.well-known/jwks.json", (_req, res) => {
    res.json(getJwks())
  })

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec))
  app.get("/docs.json", (_req, res) => {
    res.json(swaggerSpec)
  })

  app.use("/auth", createAuthRouter())
  app.use("/users", createUserRouter())
  app.use("/reports", createReportRouter())

  const userService = new UserService()
  app.get("/internal/banned-user-ids", async (_req, res, next) => {
    try {
      let page = 1
      const limit = 100
      const ids: string[] = []
      while (true) {
        const { users } = await userService.listSanctioned(page, limit)
        for (const u of users) ids.push(u.id)
        if (users.length < limit) break
        page++
      }
      res.json({ ids })
    } catch (err) {
      next(err)
    }
  })

  // Global error handler, must be registered last and have exactly 4 params
  app.use(createErrorHandler(logger))

  return app
}
