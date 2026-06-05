import { Router, raw } from "express"
import ImageController from "../controllers/image.controller"
import ImageService from "../services/image.service"
import { identity } from "../middlewares/identity.middleware"
import { requireOwnership } from "../middlewares/owner.middleware"
import { ImageModel } from "../models/image.model"
import { ROLES } from "../constants/roles"

function createImageRouter(controller: ImageController = new ImageController(new ImageService())) {
  const router = Router()

  // Accept any binary body up to 16MB (MongoDB document cap).
  router.post("/", identity, raw({ type: "*/*", limit: "16mb" }), controller.uploadImage)
  router.get("/:id/meta", identity, controller.getImageMeta)
  router.get("/:id", identity, controller.getImage)
  router.delete(
    "/:id",
    identity,
    requireOwnership(ImageModel, ROLES.MODERATOR, ROLES.ADMIN),
    controller.deleteImage
  )

  return router
}

export { createImageRouter }
