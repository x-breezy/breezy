import "@breezy/observability/register"
import { createLogger, registerProcessHandlers } from "@breezy/logger"
import { createApp } from "./app"
import { connect } from "./config/database"
import { startGrpcServer } from "./config/grpc.server"

export const logger = createLogger({ service: "media-service" })
registerProcessHandlers(logger)

const app = createApp()
const port = process.env.PORT ?? 4050
const mongoUri = process.env.DATABASE_URL ?? "mongodb://localhost:27017/breezy"

async function start(): Promise<void> {
  await connect(mongoUri)
  logger.info("Connected to MongoDB")

  startGrpcServer(logger, Number(process.env.GRPC_PORT ?? 50052))

  const server = app.listen(port, () => {
    logger.info({ port }, "Media service listening")
  })

  process.on("SIGTERM", () => {
    server.close(() => process.exit(0))
  })
}

start().catch((err) => {
  logger.error({ err }, "Failed to start media service")
  process.exit(1)
})
