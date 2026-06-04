import { Router } from "express"
import { LikeController } from "../controllers/like.controller"
import { LikeService } from "../services/like.service"
import { identity } from "../middlewares/identity.middleware"

export function createLikeRouter(
  controller: LikeController = new LikeController(new LikeService())
) {
  const router = Router({ mergeParams: true })

  router.post("/", identity, controller.like)
  router.delete("/", identity, controller.unlike)

  return router
}
