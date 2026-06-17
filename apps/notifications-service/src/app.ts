import express from "express"
import type { Express } from "express"
import helmet from "helmet"
import swaggerUi from "swagger-ui-express"
import { createLogger, httpLogger, createErrorHandler } from "@breezy/logger"
import { createNotificationRouter } from "./routes/notification.route"
import { swaggerSpec } from "./config/swagger"

const logger = createLogger({ service: "notifications-service" })

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

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec))
  app.get("/docs.json", (_req, res) => {
    res.json(swaggerSpec)
  })

  app.use("/notifications", createNotificationRouter())

  app.use(createErrorHandler(logger))

  return app
}
