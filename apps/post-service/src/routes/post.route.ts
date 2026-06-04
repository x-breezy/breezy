import { Router, json } from "express"
import PostController from "../controllers/post.controller"
import PostService from "../services/post.service"

function createPostRouter(controller: PostController = new PostController(new PostService())) {
  const router = Router()

  // Static routes before /:id to avoid param swallowing
  router.get("/feed", controller.feed)
  router.get("/users/:userId", controller.getUserPosts)

  router.post("/", json(), controller.createPost)
  router.get("/:id", controller.getPost)
  router.delete("/:id", controller.deletePost)

  return router
}

export { createPostRouter }

/**
 * @openapi
 * /posts:
 *   post:
 *     summary: Create a post
 *     description: Create a new post. Requires the author to be identified via the X-Owner-Id header.
 *     tags: [Posts]
 *     parameters:
 *       - in: header
 *         name: X-Owner-Id
 *         required: true
 *         schema:
 *           type: string
 *         description: Author identifier.
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
 *               mediaIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["media_abc123"]
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
 *
 * /posts/feed:
 *   get:
 *     summary: Chronological feed
 *     description: Returns all posts sorted by creation date descending (newest first), paginated.
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
 *     description: Returns paginated posts authored by the given userId, newest first.
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
 *       404:
 *         description: Not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
