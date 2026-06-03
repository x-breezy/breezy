import express from "express"
import type { Express } from "express"
import { createImageRouter } from "./routes/image.route"
import { createVideoRouter } from "./routes/video.route"

/** Build the Express app. No network/DB side effects, so tests can import it. */
export function createApp(): Express {
  const app = express()

  app.use(express.json())

  app.get("/", (_req, res) => {
    res.json({ status: "ok" })
  })

  app.use("/images", createImageRouter())
  app.use("/videos", createVideoRouter())

  return app
}
