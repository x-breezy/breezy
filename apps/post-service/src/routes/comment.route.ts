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

/**
 * @openapi
 * /api/posts/{postId}/comments:
 *   get:
 *     summary: List comments on a post
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of comments.
 *   post:
 *     summary: Add a comment to a post
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 example: Great post!
 *     responses:
 *       201:
 *         description: Comment created.
 *       404:
 *         description: Post not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *
 * /api/posts/{postId}/comments/{commentId}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted.
 *       403:
 *         description: Not the comment owner.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
