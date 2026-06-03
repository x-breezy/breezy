import { createLogger } from "@breezy/logger"
import express from "express"

const logger = createLogger({ service: "media-service" })

const app = express()
const port = process.env.PORT ?? 3000

app.use(express.json())

app.get("/", (_req, res) => {
  res.json({ status: "ok" })
})

app.listen(port, () => {
  logger.info({ port }, "Media service listening")
})
