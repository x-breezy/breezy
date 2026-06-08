import express from "express"
import type { Express, Request, Response, NextFunction } from "express"
import swaggerUi from "swagger-ui-express"
import { createNotificationRouter } from "./routes/notification.route"
import { swaggerSpec } from "./config/swagger"

export function createApp(): Express {
  const app = express()

  app.use(express.json())

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
    console.error(err)
    res.status(500).json({ success: false, error: "Internal server error" })
  })

  return app
}
