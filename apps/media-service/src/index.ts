import { createLogger } from "@breezy/logger"
import { createApp } from "./app"
import { connect } from "./config/database"

export const logger = createLogger({ service: "media-service" })

const app = createApp()
const port = process.env.PORT ?? 4050
const mongoUri = process.env.DATABASE_URL ?? "mongodb://localhost:27017/breezy"

async function start(): Promise<void> {
  await connect(mongoUri)
  logger.info("Connected to MongoDB")

  app.listen(port, () => {
    logger.info({ port }, "Media service listening")
  })
}

start().catch((err) => {
  logger.error({ err }, "Failed to start media service")
  process.exit(1)
})
