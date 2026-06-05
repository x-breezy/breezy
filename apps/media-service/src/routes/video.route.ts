import { Router } from "express"
import VideoController from "../controllers/video.controller"
import VideoService from "../services/video.service"
import { identity } from "../middlewares/identity.middleware"
import { requireOwnership } from "../middlewares/owner.middleware"
import { VideoModel } from "../models/video.model"
import { ROLES } from "../constants/roles"

function createVideoRouter(controller: VideoController = new VideoController(new VideoService())) {
  const router = Router()

  // No body parser: the raw request stream is piped straight into GridFS.
  router.post("/", identity, controller.upload)
  router.get("/:id/meta", identity, controller.getMeta)
  router.get("/:id", identity, controller.getStream)
  router.delete(
    "/:id",
    identity,
    requireOwnership(VideoModel, ROLES.MODERATOR, ROLES.ADMIN),
    controller.delete
  )

  return router
}

export { createVideoRouter }
