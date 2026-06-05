import "dotenv/config"
import { createLogger } from "@breezy/logger"
import { createApp } from "./app"
import { connectDatabase } from "./config/database"

const logger = createLogger({ service: "user-service" })
const port = process.env.PORT ?? 4010

connectDatabase()
  .then(() => {
    const app = createApp()
    app.listen(port, () => {
      logger.info({ port }, "User service listening")
    })
  })
  .catch((error) => {
    logger.error({ error }, "Failed to connect to database")
    process.exit(1)
  })
