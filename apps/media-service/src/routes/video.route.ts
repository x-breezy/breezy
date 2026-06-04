import { Router } from "express"
import VideoController from "../controllers/video.controller"
import VideoService from "../services/video.service"

function createVideoRouter(controller: VideoController = new VideoController(new VideoService())) {
  const router = Router()

  router.get("/", controller.list)
  // No body parser: the raw request stream is piped straight into GridFS.
  router.post("/", controller.upload)
  router.get("/:id/meta", controller.getMeta)
  router.get("/:id", controller.getStream)
  router.delete("/:id", controller.delete)

  return router
}

export { createVideoRouter }

/**
 * @openapi
 * /videos:
 *   get:
 *     summary: List videos
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
 *     description: Stream raw binary directly into GridFS. No multipart encoding. No body size limit enforced at the HTTP layer.
 *     tags: [Videos]
 *     parameters:
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
 *         name: X-Owner-Id
 *         schema:
 *           type: string
 *         description: Owner identifier.
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
 *         headers:
 *           Accept-Ranges:
 *             schema:
 *               type: string
 *               example: bytes
 *         content:
 *           video/*:
 *             schema:
 *               type: string
 *               format: binary
 *       206:
 *         description: Partial video stream.
 *         headers:
 *           Content-Range:
 *             schema:
 *               type: string
 *               example: bytes 0-1048575/10485760
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
 *                 data:
 *                   nullable: true
 *                   example: null
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
