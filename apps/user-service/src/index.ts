import { createLogger } from "@breezy/logger"
import express from "express"
import { createUserRouter } from "./routes/user.route"
import "dotenv/config"

const logger = createLogger({ service: "user-service" })

const app = express()
const port = process.env.PORT ?? 3001

app.use(express.json())

app.get("/", (_req, res) => {
  res.json({ status: "ok" })
})

app.use("/users", createUserRouter())

app.listen(port, () => {
  logger.info({ port }, "User service listening")
})
