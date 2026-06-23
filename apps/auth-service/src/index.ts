import "@breezy/observability/register"
import { createLogger, registerProcessHandlers } from "@breezy/logger"
import { createApp } from "./app"
import { connect } from "./config/database"
import { initUserModel } from "./models/user.model"
import { initReportModel } from "./models/report.model"
import { initEmailVerificationTokenModel } from "./models/email-verification-token.model"
import { initPasswordResetTokenModel } from "./models/password-reset-token.model"
import { initTwoFactorCodeModel } from "./models/two-factor-code.model"
import { connectRabbitMQ } from "./clients/rabbitmq"
import { connectRedis } from "./clients/redis"

const logger = createLogger({ service: "auth-service" })
registerProcessHandlers(logger)

const app = createApp()
const port = process.env.PORT ?? 4000
const databaseUrl =
  process.env.DATABASE_URL ?? "postgres://breezy:breezy@localhost:5432/breezy_auth"

async function start(): Promise<void> {
  const sequelize = await connect(databaseUrl)
  logger.info("Connected to PostgreSQL")

  initUserModel(sequelize)
  initReportModel(sequelize)
  initEmailVerificationTokenModel(sequelize)
  initPasswordResetTokenModel(sequelize)
  initTwoFactorCodeModel(sequelize)

  await sequelize.sync(process.env.NODE_ENV === "production" ? undefined : { alter: true })
  logger.info("Models synchronized")

  await connectRabbitMQ()
  await connectRedis()

  const server = app.listen(port, () => {
    logger.info({ port }, "Auth service listening")
  })

  process.on("SIGTERM", () => {
    server.close(() => process.exit(0))
  })
}

start().catch((err) => {
  logger.error({ err }, "Failed to start auth service")
  process.exit(1)
})
