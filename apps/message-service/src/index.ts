import { createLogger } from "@breezy/logger"
import { createApp } from "./app"
import { connect } from "./config/database"
import { connectRabbitMQ } from "./clients/rabbitmq"
import http from "http"
import { setupWebSocket } from "./config/websocket"

const logger = createLogger({ service: "message-service" })

const app = createApp()
const port = process.env.PORT ?? 4030
const mongoUri = process.env.DATABASE_URL ?? "mongodb://localhost:27017/breezy"

async function start(): Promise<void> {
  await connect(mongoUri)
  logger.info("Connected to MongoDB")

  await connectRabbitMQ()

  const server = http.createServer(app)
  setupWebSocket(server)

  server.listen(port, () => {
    logger.info({ port }, "Message service listening")
  })
}

start().catch((err) => {
  logger.error({ err }, "Failed to start message service")
  process.exit(1)
})
