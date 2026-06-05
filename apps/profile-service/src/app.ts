import express from "express"
import type { Express } from "express"
import swaggerUi from "swagger-ui-express"
import { createProfileRouter } from "./routes/profile.route"
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

  app.use("/profiles", createProfileRouter())

  return app
}
