import { Router } from "express"
import VideoController from "../controllers/video.controller"
import VideoService from "../services/video.service"
import { identity } from "../middlewares/identity.middleware"
import { requireOwnership } from "../middlewares/owner.middleware"
import { VideoModel } from "../models/video.model"
import { ROLES } from "../constants/roles"
import {
  videoUploadLimit,
  readLimit,
  writeLimit,
  publicReadLimit,
} from "../middlewares/rate-limit.middleware"

function createVideoRouter(controller: VideoController = new VideoController(new VideoService())) {
  const router = Router()

  // No body parser: the raw request stream is piped straight into GridFS.
  router.post("/", identity, videoUploadLimit, controller.upload)
  router.get("/:id/meta", identity, readLimit, controller.getMeta)
  router.get("/:id", publicReadLimit, controller.getStream)
  router.delete(
    "/:id",
    identity,
    writeLimit,
    requireOwnership(VideoModel, ROLES.MODERATOR, ROLES.ADMIN),
    controller.delete
  )

  return router
}

export { createVideoRouter }

/**
 * @openapi
 * /api/media/videos:
 *   post:
 *     summary: Upload a video
 *     tags: [Media]
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
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/Video'
 *
 * /api/media/videos/{id}/meta:
 *   get:
 *     summary: Get video metadata
 *     tags: [Media]
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
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/Video'
 *       404:
 *         description: Not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *
 * /api/media/videos/{id}:
 *   get:
 *     summary: Stream a video
 *     tags: [Media]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Video stream (supports Range requests).
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
 *   delete:
 *     summary: Delete a video
 *     tags: [Media]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted.
 *       403:
 *         description: Not the owner.
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
