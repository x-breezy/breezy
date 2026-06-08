import { createLogger } from "@breezy/logger"
import { createApp } from "./app"
import { connect } from "./config/database"
import { initFollowModel } from "./models/follow.model"
import { initProfileModel } from "./models/profile.model"
import { connectRabbitMQ } from "./clients/rabbitmq"
import { startGrpcServer } from "./config/grpc.server"

const logger = createLogger({ service: "profile-service" })

const app = createApp()
const port = process.env.PORT ?? 4010
const databaseUrl =
  process.env.DATABASE_URL ?? "postgres://breezy:breezy@localhost:5432/breezy_auth"

async function start(): Promise<void> {
  const sequelize = await connect(databaseUrl)
  logger.info("Connected to PostgreSQL")

  initFollowModel(sequelize)
  initProfileModel(sequelize)

  await sequelize.sync(process.env.NODE_ENV === "production" ? undefined : { alter: true })
  logger.info("Models synchronized")

  await connectRabbitMQ()
  startGrpcServer(50051)

  app.listen(port, () => {
    logger.info({ port }, "Profile service listening")
  })
}

start().catch((err) => {
  logger.error({ err }, "Failed to start profile service")
  process.exit(1)
})
