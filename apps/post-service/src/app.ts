import express from "express"
import type { Express } from "express"
import swaggerUi from "swagger-ui-express"
import { createPostRouter } from "./routes/post.route"
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

  app.use("/posts", createPostRouter())

  return app
}
