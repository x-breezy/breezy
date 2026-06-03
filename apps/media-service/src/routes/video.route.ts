import { Router } from "express"
import MediaStreamController from "../controllers/media-stream.controller"
import StorageService from "../services/storage.service"

function createVideoRouter(
  controller: MediaStreamController = new MediaStreamController(new StorageService("videos")),
) {
  const router = Router()

  // No body parser: the raw request stream is piped straight into GridFS.
  router.post("/", controller.upload)
  router.get("/:id", controller.get)
  router.delete("/:id", controller.delete)

  return router
}

export { createVideoRouter }
