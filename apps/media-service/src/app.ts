import express from "express"
import type { Express } from "express"
import swaggerUi from "swagger-ui-express"
import { createImageRouter } from "./routes/image.route"
import { createVideoRouter } from "./routes/video.route"
import { swaggerSpec } from "./config/swagger"

/** Build the Express app. No network/DB side effects, so tests can import it. */
export function createApp(): Express {
  const app = express()

  app.get("/", (_req, res) => {
    res.json({ status: "ok" })
  })

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec))
  app.get("/docs.json", (_req, res) => {
    res.json(swaggerSpec)
  })

  app.use("/images", createImageRouter())
  app.use("/videos", createVideoRouter())

  return app
}
