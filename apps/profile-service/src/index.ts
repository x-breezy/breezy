import "@breezy/observability/register"
import { createLogger, registerProcessHandlers } from "@breezy/logger"
import { createApp } from "./app"
import { connect } from "./config/database"
import { initFollowModel } from "./models/follow.model"
import { initProfileModel } from "./models/profile.model"
import { connectRabbitMQ } from "./clients/rabbitmq"
import { startBannedUsersConsumer } from "./clients/banned-users.consumer"
import { startGrpcServer } from "./config/grpc.server"

const logger = createLogger({ service: "profile-service" })
registerProcessHandlers(logger)

const app = createApp()
const port = process.env.PORT ?? 4010
const databaseUrl =
  process.env.DATABASE_URL ?? "postgres://breezy:breezy@localhost:5432/breezy_profiles"

async function start(): Promise<void> {
  const sequelize = await connect(databaseUrl)
  logger.info("Connected to PostgreSQL")

  initFollowModel(sequelize)
  initProfileModel(sequelize)

  await sequelize.sync(process.env.NODE_ENV === "production" ? undefined : { alter: true })
  logger.info("Models synchronized")

  await connectRabbitMQ()
  void startBannedUsersConsumer()
  startGrpcServer(logger, 50051)

  const server = app.listen(port, () => {
    logger.info({ port }, "Profile service listening")
  })

  process.on("SIGTERM", () => {
    server.close(() => process.exit(0))
  })
}

start().catch((err) => {
  logger.error({ err }, "Failed to start profile service")
  process.exit(1)
})
