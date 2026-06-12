import { Router } from "express"
import { PostController } from "../controllers/post.controller"
import { PostService } from "../services/post.service"
import { identity } from "../middlewares/identity.middleware"
import { requireSelfOrPermission, requireOwnership } from "../middlewares/roles.middleware"
import { validate } from "../middlewares/validate.middleware"
import { createPostSchema } from "../schemas/post.schema"
import { PERMISSIONS } from "../constants/permissions"
import { PostModel } from "../models/post.model"
import { createLikeRouter } from "./like.route"
import { createCommentRouter } from "./comment.route"
import { LikeController } from "../controllers/like.controller"
import { LikeService } from "../services/like.service"

export function createPostRouter(
  controller: PostController = new PostController(new PostService()),
  likeController: LikeController = new LikeController(new LikeService())
) {
  const router = Router()

  // Static routes BEFORE /:id to avoid param-route swallowing
  router.post("/", identity, validate(createPostSchema), controller.create)
  router.get("/feed", identity, controller.getFeed)
  router.get("/search", identity, controller.search)
  router.get("/trending-tags", identity, controller.trendingTags)
  router.get("/liked-by-me", identity, likeController.getMyLikes)
  router.get(
    "/users/:userId",
    identity,
    requireSelfOrPermission("userId", PERMISSIONS.POST_READ_ANY),
    controller.getUserPosts
  )
  router.get("/:id", identity, controller.getOne)
  router.delete(
    "/:id",
    identity,
    requireOwnership(
      (req) => PostModel.findById(req.params.id).exec(),
      PERMISSIONS.POST_DELETE_ANY
    ),
    controller.delete
  )

  // Sub-resources — mergeParams in child routers gives them access to :postId
  router.use("/:postId/likes", createLikeRouter())
  router.use("/:postId/comments", createCommentRouter())

  return router
}

/**
 * @openapi
 * /api/posts:
 *   post:
 *     summary: Create a post
 *     description: Create a new post. Requires authentication via x-user-id and x-role headers.
 *     tags: [Posts]
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
 *                 minLength: 1
 *                 example: "Hello world!"
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["news", "tech"]
 *               media:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     type:
 *                       type: string
 *                       enum: [image, video]
 *                 example: [{ id: "media_abc123", type: "image" }]
 *     responses:
 *       201:
 *         description: Post created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Post'
 *       400:
 *         description: Missing or invalid request data.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Missing authentication headers.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *
 * /api/posts/feed:
 *   get:
 *     summary: Personalized chronological feed
 *     description: >
 *       Returns posts from users the authenticated viewer follows, sorted newest first, paginated.
 *       The viewer's own posts are always included. Follow graph is resolved server-side from
 *       user-service (GET /users/:id/following). Falls back to a global chronological feed when
 *       user-service is unavailable — the endpoint never errors due to follow-graph failures.
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: Paginated list of posts.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PaginatedPosts'
 *
 * /api/posts/users/{userId}:
 *   get:
 *     summary: Posts by user
 *     description: >
 *       Returns paginated posts authored by the given userId, newest first.
 *       Users may only access their own profile; moderators and admins may access any.
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: Paginated posts by user.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PaginatedPosts'
 *       403:
 *         description: User attempting to access another user's posts.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *
 * /api/posts/{id}:
 *   get:
 *     summary: Get a post by id
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Post'
 *       404:
 *         description: Not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *   delete:
 *     summary: Delete a post
 *     description: >
 *       Post owner may delete their own post.
 *       Moderators and admins may delete any post.
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   nullable: true
 *                   example: null
 *       403:
 *         description: Not the post owner and lacks elevated role.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
