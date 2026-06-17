import { createLogger } from "@breezy/logger"
import { createApp } from "./app"
import { connect } from "./config/database"
import { startConsuming } from "./clients/rabbitmq"
import { handleEvent } from "./consumers/event.consumer"

const logger = createLogger({ service: "notifications-service" })

const app = createApp()
const port = process.env.PORT ?? 4060
const mongoUri = process.env.DATABASE_URL ?? "mongodb://localhost:27019/notifications_service"

async function start(): Promise<void> {
  await connect(mongoUri)
  logger.info("Connected to MongoDB")

  await startConsuming(handleEvent)

  const server = app.listen(port, () => {
    logger.info({ port }, "Notifications service listening")
  })

  process.on("SIGTERM", () => {
    server.close(() => process.exit(0))
  })
}

start().catch((err) => {
  logger.error({ err }, "Failed to start notifications service")
  process.exit(1)
})
