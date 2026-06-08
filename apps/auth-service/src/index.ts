import { createLogger } from "@breezy/logger"
import { createApp } from "./app"
import { connect } from "./config/database"
import { initUserModel } from "./models/user.model"
import { initReportModel } from "./models/report.model"
import { connectRabbitMQ } from "./clients/rabbitmq"

const logger = createLogger({ service: "auth-service" })

const app = createApp()
const port = process.env.PORT ?? 4040
const databaseUrl =
  process.env.DATABASE_URL ?? "postgres://breezy:breezy@localhost:5432/breezy_auth"

async function start(): Promise<void> {
  const sequelize = await connect(databaseUrl)
  logger.info("Connected to PostgreSQL")

  initUserModel(sequelize)
  initReportModel(sequelize)

  await sequelize.sync(process.env.NODE_ENV === "production" ? undefined : { alter: true })
  logger.info("Models synchronized")

  await connectRabbitMQ()

  app.listen(port, () => {
    logger.info({ port }, "Auth service listening")
  })
}

start().catch((err) => {
  logger.error({ err }, "Failed to start auth service")
  process.exit(1)
})
