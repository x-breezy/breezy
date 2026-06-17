import express from "express"
import type { Express, Request, Response, NextFunction } from "express"
import helmet from "helmet"
import swaggerUi from "swagger-ui-express"
import { createLogger, httpLogger } from "@breezy/logger"
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error({ err }, "Unhandled error")
    res.status(500).json({ success: false, error: "Internal server error" })
  })

  return app
}
