import { Router } from "express"
import VideoController from "../controllers/video.controller"
import VideoService from "../services/video.service"
import { identity } from "../middlewares/identity.middleware"
import { requireOwnership } from "../middlewares/owner.middleware"
import { VideoModel } from "../models/video.model"
import { ROLES } from "../constants/roles"

function createVideoRouter(controller: VideoController = new VideoController(new VideoService())) {
  const router = Router()

  // No body parser: the raw request stream is piped straight into GridFS.
  router.get("/", identity, controller.list)
  router.post("/", identity, controller.upload)
  router.get("/:id/meta", identity, controller.getMeta)
  router.get("/:id", identity, controller.getStream)
  router.delete(
    "/:id",
    identity,
    requireOwnership(VideoModel, ROLES.MODERATOR, ROLES.ADMIN),
    controller.delete
  )

  return router
}

export { createVideoRouter }

/**
 * @openapi
 * /videos:
 *   get:
 *     summary: List videos
 *     description: Returns all videos, optionally filtered by ownerId. Any authenticated user.
 *     tags: [Videos]
 *     parameters:
 *       - in: query
 *         name: ownerId
 *         schema:
 *           type: string
 *         description: Filter by owner.
 *     responses:
 *       200:
 *         description: Array of video metadata.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Video'
 *   post:
 *     summary: Upload a video
 *     description: >
 *       Stream raw binary directly into GridFS. No multipart encoding.
 *       No body size limit enforced at the HTTP layer.
 *       Requires authentication via x-user-id and x-roles headers.
 *     tags: [Videos]
 *     parameters:
 *       - in: header
 *         name: x-user-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Authenticated user identifier (injected by gateway). Used as ownerId.
 *       - in: header
 *         name: x-roles
 *         required: true
 *         schema:
 *           type: string
 *         description: Comma-separated roles.
 *       - in: header
 *         name: Content-Type
 *         required: true
 *         schema:
 *           type: string
 *           example: video/mp4
 *         description: MIME type of the video.
 *       - in: header
 *         name: X-Filename
 *         schema:
 *           type: string
 *           default: upload
 *         description: Original filename.
 *       - in: header
 *         name: X-Title
 *         schema:
 *           type: string
 *         description: Human-readable title.
 *     requestBody:
 *       required: true
 *       content:
 *         application/octet-stream:
 *           schema:
 *             type: string
 *             format: binary
 *     responses:
 *       201:
 *         description: Video uploaded.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Video'
 *       400:
 *         description: Invalid headers.
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
 * /videos/{id}:
 *   get:
 *     summary: Stream video bytes
 *     description: Streams raw video bytes. Supports the Range header for seeking (HTTP 206). Suitable as an HTML5 `<video src="...">` target.
 *     tags: [Videos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: header
 *         name: Range
 *         schema:
 *           type: string
 *           example: bytes=0-1048575
 *         description: Byte range for partial content.
 *     responses:
 *       200:
 *         description: Full video stream.
 *         content:
 *           video/*:
 *             schema:
 *               type: string
 *               format: binary
 *       206:
 *         description: Partial video stream.
 *         content:
 *           video/*:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       416:
 *         description: Range not satisfiable.
 *   delete:
 *     summary: Delete a video
 *     description: Video owner may delete. Moderators and admins may delete any video.
 *     tags: [Videos]
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
 *       403:
 *         description: Not the video owner and lacks elevated role.
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
 *
 * /videos/{id}/meta:
 *   get:
 *     summary: Get video metadata
 *     description: Returns metadata as JSON without transferring bytes.
 *     tags: [Videos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Video metadata.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Video'
 *       404:
 *         description: Not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
