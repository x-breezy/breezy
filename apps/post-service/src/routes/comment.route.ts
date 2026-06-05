import { Router } from "express"
import { CommentController } from "../controllers/comment.controller"
import { CommentService } from "../services/comment.service"
import { identity } from "../middlewares/identity.middleware"
import { requireOwnership } from "../middlewares/roles.middleware"
import { validate } from "../middlewares/validate.middleware"
import { createCommentSchema } from "../schemas/comment.schema"
import { CommentModel } from "../models/comment.model"
import { PERMISSIONS } from "../constants/permissions"

export function createCommentRouter(
  controller: CommentController = new CommentController(new CommentService())
) {
  const router = Router({ mergeParams: true })

  router.get("/", identity, controller.list)
  router.post("/", identity, validate(createCommentSchema), controller.create)
  router.delete(
    "/:commentId",
    identity,
    requireOwnership(
      (req) => CommentModel.findById(req.params.commentId).exec(),
      PERMISSIONS.COMMENT_DELETE_ANY
    ),
    controller.delete
  )

  return router
}
