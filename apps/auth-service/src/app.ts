import helmet from "helmet"
import express from "express"
import type { Express } from "express"
import swaggerUi from "swagger-ui-express"
import { createAuthRouter } from "./routes/auth.route"
import { createLogger, httpLogger, createErrorHandler } from "@breezy/logger"
import { createUserRouter } from "./routes/user.route"
import { createReportRouter } from "./routes/report.route"
import { swaggerSpec } from "./config/swagger"
import { getJwks } from "./utils/jwt.util"

const logger = createLogger({ service: "auth-service" })

/** Build the Express app. No network/DB side effects, so tests can import it. */
export function createApp(): Express {
  const app = express()

  app.set("trust proxy", 1)
  app.disable("x-powered-by")
  app.use(helmet())
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

  // Global error handler, must be registered last and have exactly 4 params
  app.use(createErrorHandler(logger))

  return app
}
