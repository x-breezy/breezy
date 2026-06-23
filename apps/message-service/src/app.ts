import express from "express"
import type { Express } from "express"
import cors from "cors"
import swaggerUi from "swagger-ui-express"
import { createLogger, httpLogger, createErrorHandler } from "@breezy/logger"
import { createHealthRouter, createMetrics } from "@breezy/observability"
import mongoose from "mongoose"
import { createChatRouter } from "./routes/message.route"
import { swaggerSpec } from "./config/swagger"
import { assertRabbitMQReady } from "./clients/rabbitmq"

const service = "message-service"
const logger = createLogger({ service })
const { metricsMiddleware, metricsHandler } = createMetrics({ service })

/** Build the Express app. No network/DB side effects, so tests can import it. */
export function createApp(): Express {
  const app = express()

  app.set("trust proxy", 1)
  app.disable("x-powered-by")
  app.use(cors())
  app.use(
    createHealthRouter({
      service,
      checks: {
        mongo: async () => {
          const db = mongoose.connection.db
          if (!db) throw new Error("MongoDB not connected")
          await db.admin().ping()
        },
        rabbitmq: assertRabbitMQReady,
      },
    })
  )
  app.get("/metrics", metricsHandler)
  app.use(metricsMiddleware)
  app.use(httpLogger(logger))
  app.use(express.json())

  app.get("/", (_req, res) => {
    res.json({ status: "ok" })
  })

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec))
  app.get("/docs.json", (_req, res) => {
    res.json(swaggerSpec)
  })

  app.use("/conversations", createChatRouter())

  // Global error handler, must be registered last and have exactly 4 params
  app.use(createErrorHandler(logger))

  return app
}
