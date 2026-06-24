import { Router, type Request, type Response, type NextFunction } from "express"
import { PostController } from "../controllers/post.controller"
import { PostService } from "../services/post.service"
import { identity } from "../middlewares/identity.middleware"
import { requireOwnership, requirePermission } from "../middlewares/roles.middleware"
import { validate } from "../middlewares/validate.middleware"
import { createPostSchema, updatePostSchema } from "../schemas/post.schema"
import { readLimit, writeLimit, searchLimit } from "../middlewares/rate-limit.middleware"
import { PERMISSIONS } from "../constants/permissions"
import { PostModel } from "../models/post.model"
import { createLikeRouter } from "./like.route"
import { LikeController } from "../controllers/like.controller"
import { LikeService } from "../services/like.service"

function requireCreatePermission() {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Unauthorized" })
      return
    }
    const body = req.body as { parentId?: string | null }
    const isComment = !!body.parentId
    const permission = isComment ? PERMISSIONS.COMMENT_CREATE : PERMISSIONS.POST_CREATE
    if (!req.user.permissions.includes(permission)) {
      res.status(403).json({ success: false, error: "Forbidden", required: permission })
      return
    }
    next()
  }
}

export function createPostRouter(
  controller: PostController = new PostController(new PostService()),
  likeController: LikeController = new LikeController(new LikeService())
) {
  const router = Router()

  // Static routes BEFORE /:id to avoid param-route swallowing
  router.post(
    "/",
    identity,
    writeLimit,
    requireCreatePermission(),
    validate(createPostSchema),
    controller.create
  )
  router.get("/feed", identity, readLimit, controller.getFeed)
  router.get("/search", identity, searchLimit, controller.search)
  router.get("/trending-tags", identity, readLimit, controller.trendingTags)
  router.get("/liked-by-me", identity, readLimit, likeController.getMyLikes)
  router.get(
    "/users/:userId",
    identity,
    readLimit,
    requirePermission(PERMISSIONS.POST_READ),
    controller.getUserPosts
  )
  router.get("/:id/detail", identity, readLimit, controller.getDetail)
  router.get("/:id/replies", identity, readLimit, controller.getReplies)
  router.get("/:id", identity, readLimit, controller.getOne)
  router.patch(
    "/:id",
    identity,
    writeLimit,
    requireOwnership(
      (req) => PostModel.findById(req.params.id).exec(),
      PERMISSIONS.POST_UPDATE_ANY
    ),
    validate(updatePostSchema),
    controller.update
  )
  router.delete(
    "/:id",
    identity,
    writeLimit,
    requireOwnership(
      (req) => PostModel.findById(req.params.id).exec(),
      (post) => (post.parentId ? PERMISSIONS.COMMENT_DELETE_ANY : PERMISSIONS.POST_DELETE_ANY)
    ),
    controller.delete
  )

  // Sub-resources, mergeParams in child routers gives them access to :postId
  router.use("/:postId/likes", createLikeRouter())

  return router
}

/**
 * @openapi
 * /api/posts:
 *   post:
 *     summary: Create a post or comment
 *     description: Create a new post or a reply/comment when parentId is provided.
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
 *                 maxLength: 5000
 *                 example: "Hello world!"
 *               tags:
 *                 type: array
 *                 items: { type: string }
 *                 example: ["news", "tech"]
 *               mentions:
 *                 type: array
 *                 items: { type: string }
 *                 example: ["user_42"]
 *               media:
 *                 type: array
 *                 items: { $ref: '#/components/schemas/MediaItem' }
 *                 example: [{ id: "media_abc123", type: "image" }]
 *               parentId:
 *                 type: string
 *                 nullable: true
 *                 example: null
 *                 description: Parent post ID when creating a reply/comment
 *     responses:
 *       201:
 *         description: Post created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Post' }
 *       400:
 *         description: Missing or invalid request data.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiError' }
 *       401:
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiError' }
 *
 * /api/posts/feed:
 *   get:
 *     summary: Personalized feed
 *     description: >
 *       Returns a paginated feed for the authenticated viewer. Use `type=following` for posts from
 *       followed users (including own posts) or `type=for-you` for the recommendation algorithm.
 *       Defaults to `for-you` when no type is provided.
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [following, for-you]
 *           default: for-you
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated list of posts.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/PaginatedPosts' }
 *
 * /api/posts/search:
 *   get:
 *     summary: Search posts
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated search results.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/PaginatedPosts' }
 *
 * /api/posts/trending-tags:
 *   get:
 *     summary: Trending tags
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: List of trending tags.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { type: array, items: { $ref: '#/components/schemas/TrendingTag' } }
 *
 * /api/posts/liked-by-me:
 *   get:
 *     summary: Posts liked by the current user
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated liked posts.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { type: array, items: { $ref: '#/components/schemas/Post' } }
 *
 * /api/posts/users/{userId}:
 *   get:
 *     summary: Posts by user
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated posts by user.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/PaginatedPosts' }
 *       403:
 *         description: Forbidden.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiError' }
 *
 * /api/posts/{id}:
 *   get:
 *     summary: Get a post by id
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Post found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Post' }
 *       404:
 *         description: Not found.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiError' }
 *   patch:
 *     summary: Update a post
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 5000
 *                 example: "Updated content"
 *               tags:
 *                 type: array
 *                 items: { type: string }
 *               mentions:
 *                 type: array
 *                 items: { type: string }
 *               media:
 *                 type: array
 *                 items: { $ref: '#/components/schemas/MediaItem' }
 *     responses:
 *       200:
 *         description: Post updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Post' }
 *       403:
 *         description: Forbidden.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiError' }
 *       404:
 *         description: Not found.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiError' }
 *   delete:
 *     summary: Delete a post
 *     description: Post owner may delete their own post; moderators/admins may delete any post.
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Deleted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { nullable: true, example: null }
 *       403:
 *         description: Not the post owner and lacks elevated role.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiError' }
 *       404:
 *         description: Not found.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiError' }
 *
 * /api/posts/{id}/detail:
 *   get:
 *     summary: Get a post with author, replies and like status
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Post detail.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/PostDetail' }
 *       404:
 *         description: Not found.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiError' }
 *
 * /api/posts/{id}/replies:
 *   get:
 *     summary: List replies to a post
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated replies.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/PaginatedPosts' }
 */
