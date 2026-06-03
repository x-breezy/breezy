import { Router, raw } from "express"
import ImageController from "../controllers/image.controller"
import ImageService from "../services/image.service"

function createImageRouter(controller: ImageController = new ImageController(new ImageService())) {
  const router = Router()

  // Accept any binary body up to 16MB (MongoDB document cap).
  router.post("/", raw({ type: "*/*", limit: "16mb" }), controller.uploadImage)
  router.get("/:id", controller.getImage)
  router.delete("/:id", controller.deleteImage)

  return router
}

export { createImageRouter }
