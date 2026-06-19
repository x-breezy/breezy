import { Router, raw } from "express"
import ImageController from "../controllers/image.controller"
import ImageService from "../services/image.service"
import { identity } from "../middlewares/identity.middleware"
import { requireOwnership } from "../middlewares/owner.middleware"
import { ImageModel } from "../models/image.model"
import { ROLES } from "../constants/roles"
import {
  uploadLimit,
  readLimit,
  writeLimit,
  publicReadLimit,
} from "../middlewares/rate-limit.middleware"

function createImageRouter(controller: ImageController = new ImageController(new ImageService())) {
  const router = Router()

  // Accept any binary body up to 16MB (MongoDB document cap).
  router.post(
    "/",
    identity,
    uploadLimit,
    raw({ type: "*/*", limit: "16mb" }),
    controller.uploadImage
  )
  router.get("/:id/meta", identity, readLimit, controller.getImageMeta)
  router.get("/:id", publicReadLimit, controller.getImage)
  router.delete(
    "/:id",
    identity,
    writeLimit,
    requireOwnership(ImageModel, ROLES.MODERATOR, ROLES.ADMIN),
    controller.deleteImage
  )

  return router
}

export { createImageRouter }

/**
 * @openapi
 * /api/media/images:
 *   post:
 *     summary: Upload an image
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
 *         description: Image uploaded.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/ImageMeta'
 *       400:
 *         description: Invalid file.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *
 * /api/media/images/{id}/meta:
 *   get:
 *     summary: Get image metadata
 *     tags: [Media]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Image metadata.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/ImageMeta'
 *       404:
 *         description: Not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *
 * /api/media/images/{id}:
 *   get:
 *     summary: Stream an image
 *     tags: [Media]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Image binary stream.
 *         content:
 *           image/*:
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
 *     summary: Delete an image
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
