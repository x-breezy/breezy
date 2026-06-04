import { Router } from "express"
import { PostController } from "../controllers/post.controller"
import { PostService } from "../services/post.service"
import { identity } from "../middlewares/identity.middleware"
import { requireSelfOrRoles } from "../middlewares/roles.middleware"
import { requirePostOwnership } from "../middlewares/post-ownership.middleware"
import { validate } from "../middlewares/validate.middleware"
import { createPostSchema } from "../schemas/post.schema"
import { ROLES } from "../constants/roles"

export function createPostRouter(
  controller: PostController = new PostController(new PostService())
) {
  const router = Router()

  // Static routes BEFORE /:id to avoid param-route swallowing
  router.post("/", identity, validate(createPostSchema), controller.create)
  router.get("/feed", identity, controller.getFeed)
  router.get(
    "/users/:userId",
    identity,
    requireSelfOrRoles("userId", ROLES.MODERATOR, ROLES.ADMIN),
    controller.getUserPosts
  )
  router.get("/:id", identity, controller.getOne)
  router.delete(
    "/:id",
    identity,
    requirePostOwnership(ROLES.MODERATOR, ROLES.ADMIN),
    controller.delete
  )

  return router
}

/**
 * @openapi
 * /posts:
 *   post:
 *     summary: Create a post
 *     description: Create a new post. Requires authentication via x-user-id and x-roles headers.
 *     tags: [Posts]
 *     parameters:
 *       - in: header
 *         name: x-user-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Authenticated user identifier (injected by gateway).
 *       - in: header
 *         name: x-roles
 *         required: true
 *         schema:
 *           type: string
 *         description: Comma-separated roles (e.g. "user" or "admin,moderator").
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
 * /posts/feed:
 *   get:
 *     summary: Chronological feed
 *     description: Returns all posts sorted by creation date descending (newest first), paginated. Any authenticated user.
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
 * /posts/users/{userId}:
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
 * /posts/{id}:
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
