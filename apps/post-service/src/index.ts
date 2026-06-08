import { createLogger } from "@breezy/logger"
import { createApp } from "./app"
import { connect } from "./config/database"
import { connectRabbitMQ } from "./clients/rabbitmq"

const logger = createLogger({ service: "post-service" })

const app = createApp()
const port = process.env.PORT ?? 4040
const mongoUri = process.env.DATABASE_URL ?? "mongodb://localhost:27017/breezy"

async function start(): Promise<void> {
  await connect(mongoUri)
  logger.info("Connected to MongoDB")

  await connectRabbitMQ()

  app.listen(port, () => {
    logger.info({ port }, "Post service listening")
  })
}

start().catch((err) => {
  logger.error({ err }, "Failed to start post service")
  process.exit(1)
})
