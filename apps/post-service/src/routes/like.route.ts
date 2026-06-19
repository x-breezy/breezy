import { Router } from "express"
import { LikeController } from "../controllers/like.controller"
import { LikeService } from "../services/like.service"
import { identity } from "../middlewares/identity.middleware"
import { writeLimit } from "../middlewares/rate-limit.middleware"

export function createLikeRouter(
  controller: LikeController = new LikeController(new LikeService())
) {
  const router = Router({ mergeParams: true })

  router.post("/", identity, writeLimit, controller.like)
  router.delete("/", identity, writeLimit, controller.unlike)

  return router
}

/**
 * @openapi
 * /api/posts/{postId}/likes:
 *   post:
 *     summary: Like a post
 *     tags: [Likes]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post liked.
 *       409:
 *         description: Already liked.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *   delete:
 *     summary: Unlike a post
 *     tags: [Likes]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post unliked.
 *       404:
 *         description: Like not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
