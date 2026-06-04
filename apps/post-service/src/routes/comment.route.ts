import { Router } from "express"
import { CommentController } from "../controllers/comment.controller"
import { CommentService } from "../services/comment.service"
import { identity } from "../middlewares/identity.middleware"
import { validate } from "../middlewares/validate.middleware"
import { createCommentSchema } from "../schemas/comment.schema"

export function createCommentRouter(
  controller: CommentController = new CommentController(new CommentService())
) {
  const router = Router({ mergeParams: true })

  router.get("/", identity, controller.list)
  router.post("/", identity, validate(createCommentSchema), controller.create)
  router.delete("/:commentId", identity, controller.delete)

  return router
}
